import { supabase } from '../../capstone-client'; // adjust path to match where capstone-client.js actually lives

/**
 * supabase-js's `error` from functions.invoke() only ever says
 * "Edge Function returned a non-2xx status code" — the actual reason
 * (e.g. "Only a superadmin can create teacher accounts.") is in the
 * response body, which this reads out so callers get something useful.
 */
async function invokeFunction(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
        let message = error.message;
        try {
            const raw = await error.context.json();
            if (raw?.error) message = raw.error;
        } catch {
            // response body wasn't JSON (e.g. the function isn't deployed,
            // or crashed before returning JSON) — fall back to the generic message
        }
        throw new Error(message);
    }
    return data;
}

/**
 * Looks up the REAL current login email for a batch of accounts, via the
 * manage-account Edge Function (the only place with admin access to
 * auth.users). Used by fetchTeachers()/fetchStudents() instead of
 * fabricating "<username>@edumanage.edu" — that guess stopped being
 * correct once email generation switched to name-based.
 */
async function fetchRealEmails(accountIds) {
    const ids = accountIds.filter(Boolean);
    if (ids.length === 0) return {};
    try {
        const { emails } = await invokeFunction('manage-account', { action: 'list_emails', accountIds: ids });
        return emails ?? {};
    } catch (err) {
        console.error('Could not fetch real emails:', err);
        return {};
    }
}

/**
 * READ — all teachers, joined with their login info and every section
 * they're assigned to (a teacher can now own multiple class_section rows).
 */
export async function fetchTeachers() {
    const { data, error } = await supabase
        .from('teacher')
        .select(`
            teacher_id,
            account_id,
            employee_no,
            first_name,
            last_name,
            user_account ( username, is_active ),
            class_section ( section_id, section_name, academic_year )
        `)
        .order('last_name', { ascending: true });

    if (error) throw error;

    const emails = await fetchRealEmails(data.map((t) => t.account_id));

    // Flatten into the shape the UI table expects
    return data.map((t) => {
        const sections = Array.isArray(t.class_section) ? t.class_section : (t.class_section ? [t.class_section] : []);
        return {
            id: t.teacher_id,
            accountId: t.account_id,
            employeeNo: t.employee_no ?? null, // null for accounts created before the employee_no migration/backfill
            name: `${t.first_name} ${t.last_name}`,
            firstName: t.first_name,
            lastName: t.last_name,
            username: t.user_account?.username ?? '',
            isActive: t.user_account?.is_active ?? true,
            // `sections` is the full list (e.g. ["BSIT4101", "BSIT4102"]);
            // `section` is kept as a comma-joined string for any older UI
            // that still expects a single display value.
            sections: sections.map((s) => s.section_name),
            section: sections.map((s) => s.section_name).join(', '),
            academicYear: sections[0]?.academic_year ?? '',
            initials: `${t.first_name?.[0] ?? ''}${t.last_name?.[0] ?? ''}`.toUpperCase(),
            email: emails[t.account_id] ?? '',
        };
    });
}

/**
 * READ — the currently signed-in teacher's own name, for display in the
 * sidebar/topbar (e.g. sidebar footer, topbar user-name) instead of a
 * hardcoded placeholder. Every teacher-facing page (Admin Dashboard, Game
 * Management, Student Account Management, Student Assessment, Student
 * Game Progress, Notifications) can call this the same way.
 *
 * Returns null if nobody's signed in, or the signed-in account has no
 * matching teacher row (e.g. a superadmin previewing a teacher page).
 */
export async function fetchCurrentTeacher() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data, error } = await supabase
        .from('teacher')
        .select('first_name, last_name, user_account ( username )')
        .eq('account_id', user.id)
        .maybeSingle();

    if (error || !data) return null;

    const initials = `${data.first_name?.[0] ?? ''}${data.last_name?.[0] ?? ''}`.toUpperCase();

    return {
        firstName: data.first_name,
        lastName: data.last_name,
        name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
        username: data.user_account?.username ?? '',
        initials: initials || 'T',
    };
}

/**
 * CREATE — calls the shared `manage-account` Edge Function (action: "create"),
 * which uses the service_role key server-side to create the auth.users row +
 * the matching user_account / teacher rows in one go, then assigns every
 * section in `sections` (by name) to the new teacher. Only a signed-in
 * superadmin can call this successfully for targetRole "teacher" (checked
 * inside the function). If any requested section is already assigned to a
 * DIFFERENT teacher, the whole call is rejected before anything is created.
 */
export async function createTeacher({ firstName, lastName, username, password, sections }) {
    // Always end in @edumanage.edu — if someone pastes a full email or
    // includes an "@" by mistake, only the part before it is kept.
    const cleanUsername = username.trim().toLowerCase().split('@')[0];
    const email = `${cleanUsername}@edumanage.edu`;

    return invokeFunction('manage-account', {
        action: 'create',
        targetRole: 'teacher',
        email,
        password,
        username: cleanUsername,
        profile: {
            first_name: firstName,
            last_name: lastName,
            section_names: sections ?? [],
        },
    });
}

/**
 * UPDATE — profile, username, and section changes go through
 * `manage-account` (action: "update"). Passwords cannot be updated here.
 * `sections`, when provided, REPLACES this teacher's full set of sections —
 * pass every section they should end up owning, not just the ones changing.
 * Omit it entirely to leave their current sections untouched.
 */
export async function updateTeacher(teacherAccountId, { firstName, lastName, username, sections }) {
    // Same @edumanage.edu enforcement as createTeacher
    const cleanUsername = username ? username.trim().toLowerCase().split('@')[0] : undefined;

    return invokeFunction('manage-account', {
        action: 'update',
        targetRole: 'teacher',
        account_id: teacherAccountId, // NOTE: this is the account_id (auth user id), not teacher_id
        username: cleanUsername,
        profile: {
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            section_names: sections, // undefined = leave sections unchanged; [] = unassign all
        },
    });
}

/**
 * DELETE — removes the teacher row, their user_account row, and their
 * auth.users row, via `manage-account` (action: "delete"). Their
 * class_section row is left in place today (only account_id-owned rows
 * are cleaned up) — delete it separately first if you want it removed too.
 */
export async function deleteTeacher(teacherAccountId) {
    return invokeFunction('manage-account', {
        action: 'delete',
        targetRole: 'teacher',
        account_id: teacherAccountId, // NOTE: account_id, not teacher_id
    });
}

/** Send the teacher a one-time password recovery link. */
export async function resetTeacherPassword(teacherAccountId) {
    return invokeFunction('manage-account', {
        action: 'reset_password', targetRole: 'teacher', account_id: teacherAccountId,
    });
}

/** Toggles a teacher's account between Active and Inactive — used by the
 *  clickable Status badge in Teacher Account Management. */
export async function setTeacherActive(teacherAccountId, isActive) {
    return invokeFunction('manage-account', {
        action: 'update',
        targetRole: 'teacher',
        account_id: teacherAccountId,
        is_active: isActive,
    });
}

export async function fetchManagedSections() {
    const [{ data: sections, error }, teachers] = await Promise.all([
        supabase.from('class_section').select('section_id, section_name, academic_year, teacher_id').order('section_name'),
        fetchTeachers(),
    ]);
    if (error) throw error;
    return sections.map((section) => ({ ...section, teacher: teachers.find((teacher) => teacher.id === section.teacher_id) ?? null }));
}

export async function manageSection(operation, payload) {
    return invokeFunction('manage-account', { action: 'manage_section', operation, ...payload });
}