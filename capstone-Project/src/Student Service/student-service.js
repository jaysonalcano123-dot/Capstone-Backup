import { supabase } from '../../capstone-client'; 
/**
 * supabase-js's `error` from functions.invoke() only ever says
 * "Edge Function returned a non-2xx status code" — the actual reason
 * (e.g. "You can only add students to your own section.") is in the
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
 * auth.users). fetchStudents() doesn't currently display an email
 * anywhere, but this keeps it available and correct rather than absent,
 * for consistency with fetchTeachers().
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
 * READ — every student the caller is allowed to see. Explicitly scoped
 * here rather than trusting RLS alone (same reasoning as fetchSections()
 * above): a superadmin sees everyone, a teacher sees ONLY students in a
 * section THEY own. A teacher can own multiple sections, so this pulls
 * every section_id they own and filters by all of them.
 */
export async function fetchStudents() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return [];

    const { data: account, error: accountError } = await supabase
        .from('user_account')
        .select('role')
        .eq('account_id', user.id)
        .maybeSingle();
    if (accountError) throw accountError;

    let query = supabase
        .from('student')
        .select(`
            student_id,
            account_id,
            section_id,
            first_name,
            last_name,
            middle_initial,
            suffix,
            address,
            contact_number,
            gender,
            student_number,
            user_account ( username, is_active ),
            class_section ( section_id, section_name, academic_year )
        `)
        .order('last_name', { ascending: true });

    if (account?.role === 'teacher') {
        const { data: teacherRow, error: teacherError } = await supabase
            .from('teacher')
            .select('teacher_id')
            .eq('account_id', user.id)
            .maybeSingle();
        if (teacherError) throw teacherError;
        if (!teacherRow) return [];

        const { data: ownedSections, error: sectionsError } = await supabase
            .from('class_section')
            .select('section_id')
            .eq('teacher_id', teacherRow.teacher_id);
        if (sectionsError) throw sectionsError;

        const sectionIds = (ownedSections ?? []).map((s) => s.section_id);
        if (sectionIds.length === 0) return []; // no section assigned yet — nothing to show

        query = query.in('section_id', sectionIds);
    }
    // superadmin (or any other role): no filter, sees every student.

    const { data, error } = await query;
    if (error) throw error;

    const emails = await fetchRealEmails(data.map((s) => s.account_id));

    return data.map((s) => ({
        id: s.student_id,
        accountId: s.account_id,
        sectionId: s.section_id,
        idNum: s.student_number ?? '',
        firstName: s.first_name,
        lastName: s.last_name,
        mi: s.middle_initial ?? '',
        suffix: s.suffix ?? '',
        fullName: `${s.last_name}, ${s.first_name}`,
        address: s.address ?? '',
        contact: s.contact_number ?? '',
        gender: s.gender ?? '',
        username: s.user_account?.username ?? '',
        isActive: s.user_account?.is_active ?? true,
        email: emails[s.account_id] ?? '',
        section: s.class_section?.section_name ?? '',
        academicYear: s.class_section?.academic_year ?? '',
    }));
}

/**
 * READ — sections available to assign a student to. Explicitly scoped
 * here rather than trusting RLS alone: a superadmin gets every section,
 * a teacher gets ONLY their own. (The previous version had no filter at
 * all in the query and relied entirely on RLS to restrict rows — if
 * that policy was ever missing/misconfigured, every teacher would see
 * every section, silently. This is now correct either way.)
 */
export async function fetchSections() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return [];

    const { data: account, error: accountError } = await supabase
        .from('user_account')
        .select('role')
        .eq('account_id', user.id)
        .maybeSingle();
    if (accountError) throw accountError;

    let query = supabase
        .from('class_section')
        .select('section_id, section_name, academic_year, teacher_id')
        .order('section_name', { ascending: true });

    if (account?.role === 'teacher') {
        const { data: teacherRow, error: teacherError } = await supabase
            .from('teacher')
            .select('teacher_id')
            .eq('account_id', user.id)
            .maybeSingle();
        if (teacherError) throw teacherError;

        // No matching teacher row (shouldn't normally happen) — return
        // nothing rather than accidentally falling through to "all sections".
        if (!teacherRow) return [];

        query = query.eq('teacher_id', teacherRow.teacher_id);
    }
    // superadmin (or any other role): no filter, sees every section.

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * CREATE — calls `manage-account` (action: "create", targetRole:
 * "student"). A teacher may only pass a sectionId they own; a
 * superadmin may pass any sectionId. Enforced server-side too.
 */
export async function createStudent({
    firstName, lastName, mi, suffix, studentNumber,
    address, contact, gender, username, password, sectionId,
}) {
    const cleanUsername = username.trim().toLowerCase().split('@')[0];
    const email = `${cleanUsername}@edumanage.edu`;

    return invokeFunction('manage-account', {
        action: 'create',
        targetRole: 'student',
        email,
        password,
        username: cleanUsername,
        profile: {
            first_name: firstName,
            last_name: lastName,
            middle_initial: mi || null,
            suffix: suffix || null,
            student_number: studentNumber || null,
            address: address || null,
            contact_number: contact || null,
            gender: gender || null,
            section_id: sectionId || null,
        },
    });
}

/**
 * UPDATE — action: "update", targetRole: "student". Passwords cannot be
 * updated here; use resetStudentPassword() instead.
 */
export async function updateStudent(studentAccountId, {
    firstName, lastName, mi, suffix, studentNumber,
    address, contact, gender, username, sectionId,
}) {
    const cleanUsername = username ? username.trim().toLowerCase().split('@')[0] : undefined;

    return invokeFunction('manage-account', {
        action: 'update',
        targetRole: 'student',
        account_id: studentAccountId, // NOTE: account_id, not student_id
        username: cleanUsername,
        profile: {
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            middle_initial: mi ?? undefined,
            suffix: suffix ?? undefined,
            student_number: studentNumber || undefined,
            address: address ?? undefined,
            contact_number: contact ?? undefined,
            gender: gender || undefined,
            section_id: sectionId || undefined,
        },
    });
}

/**
 * DELETE — action: "delete", targetRole: "student".
 */
export async function deleteStudent(studentAccountId) {
    return invokeFunction('manage-account', {
        action: 'delete',
        targetRole: 'student',
        account_id: studentAccountId, // NOTE: account_id, not student_id
    });
}

/** Directly sets the student's password to `newPassword` — no email or
 *  recovery link. Their old password stops working immediately. */
export async function resetStudentPassword(studentAccountId, newPassword) {
    return invokeFunction('manage-account', {
        action: 'reset_password', targetRole: 'student', account_id: studentAccountId,
        password: newPassword,
    });
}

/** Toggles a student's account between Active and Inactive — used by the
 *  clickable Status badge in Student Account Management. */
export async function setStudentActive(studentAccountId, isActive) {
    return invokeFunction('manage-account', {
        action: 'update',
        targetRole: 'student',
        account_id: studentAccountId,
        is_active: isActive,
    });
}