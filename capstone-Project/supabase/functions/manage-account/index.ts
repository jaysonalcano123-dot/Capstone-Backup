// supabase/functions/manage-account/index.ts
//
// Handles creating, updating, and deleting teacher/student accounts.
// Runs server-side with the service role key, so it can safely:
//   - create a Supabase Auth user without logging the caller out
//   - change a Supabase Auth user's email (Admin API only)
//   - send password-recovery emails without handling replacement passwords
//   - delete a Supabase Auth user (Admin API only)
//
// Permissions:
//   - targetRole "teacher" — caller must be a superadmin.
//   - targetRole "student" — caller must be a superadmin (any section) or
//     a teacher (their OWN section only — enforced below).
//
// Body shape for create:
// {
//   "action": "create",
//   "targetRole": "teacher" | "student",
//   // NOTE: email is no longer accepted from the client — it's always
//   // derived server-side from profile.first_name + profile.last_name
//   // (e.g. "juan.delacruz@edumanage.edu"), with a numeric suffix if
//   // that address is already taken by someone else.
//   "password": string,
//   "username": string,
//   "profile": {
//     "first_name": string,
//     "last_name": string,
//     // teacher only:
//     "section_names"?: string[], // existing section names to assign this
//                                  // teacher to (replaces their full set on
//                                  // update); a section already owned by a
//                                  // DIFFERENT teacher is rejected, not stolen
//     // student only:
//     "section_id"?: string,
//     "student_number"?: string,
//     "middle_initial"?: string,
//     "suffix"?: string,
//     "address"?: string,
//     "contact_number"?: string,
//     "gender"?: string
//   }
// }
//
// Body shape for update (all fields optional except action/targetRole/account_id —
// omit a field to leave it unchanged):
// {
//   "action": "update",
//   "targetRole": "teacher" | "student",
//   "account_id": string,
//   "username"?: string,
//   "profile"?: { ...same fields as create, all optional }
// }
//
// Body shape for delete:
// { "action": "delete", "targetRole": "teacher" | "student", "account_id": string }
// Body shape for reset_password:
// { "action": "reset_password", "targetRole": "teacher" | "student", "account_id": string }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
async function getCallerTeacherId(adminClient: any, accountId: string): Promise<string | null> {
  const { data } = await adminClient.from("teacher").select("teacher_id").eq("account_id", accountId).maybeSingle();
  return data?.teacher_id ?? null;
}

// deno-lint-ignore no-explicit-any
async function sectionBelongsToTeacher(adminClient: any, sectionId: string | null | undefined, teacherId: string | null): Promise<boolean> {
  if (!sectionId || !teacherId) return false;
  const { data } = await adminClient
    .from("class_section")
    .select("section_id")
    .eq("section_id", sectionId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return !!data;
}

/** Section names already owned by some OTHER teacher (excludeTeacherId is
 *  that teacher's own id, so re-selecting their own current sections never
 *  counts as a conflict). Used to validate BEFORE a teacher account is
 *  created, so a section conflict never leaves a half-created account. */
// deno-lint-ignore no-explicit-any
async function findSectionConflicts(adminClient: any, sectionNames: string[], excludeTeacherId: string | null): Promise<{ conflicts: string[]; error: string | null }> {
  const names = sectionNames.map((n) => String(n ?? "").trim()).filter(Boolean);
  if (names.length === 0) return { conflicts: [], error: null };
  const { data, error } = await adminClient
    .from("class_section")
    .select("section_name, teacher_id")
    .in("section_name", names);
  if (error) return { conflicts: [], error: error.message };
  const conflicts = (data ?? [])
    .filter((s: { teacher_id: string | null }) => s.teacher_id && s.teacher_id !== excludeTeacherId)
    .map((s: { section_name: string }) => s.section_name);
  return { conflicts, error: null };
}

/**
 * Makes a teacher's class_section ownership match `sectionNames` exactly —
 * assigns any of those sections not already theirs, and un-assigns any
 * section they currently own that isn't in the list (a teacher can own
 * several sections; a section still only ever has one teacher). A section
 * already owned by a DIFFERENT teacher is never silently taken: if any
 * requested name belongs to someone else, NOTHING is changed and an error
 * describing the conflict is returned instead.
 */
// deno-lint-ignore no-explicit-any
async function syncTeacherSections(adminClient: any, teacherId: string, sectionNames: string[]): Promise<{ error: string | null }> {
  const wantedNames = sectionNames.map((n) => String(n ?? "").trim()).filter(Boolean);

  const { data: matchedSections, error: fetchErr } = await adminClient
    .from("class_section")
    .select("section_id, section_name, teacher_id")
    .in("section_name", wantedNames.length > 0 ? wantedNames : [""]);
  if (fetchErr) return { error: fetchErr.message };

  const conflicts = (matchedSections ?? []).filter((s: { teacher_id: string | null }) => s.teacher_id && s.teacher_id !== teacherId);
  if (conflicts.length > 0) {
    const names = conflicts.map((s: { section_name: string }) => s.section_name).join(", ");
    return { error: `${names} ${conflicts.length === 1 ? "is" : "are"} already assigned to another teacher.` };
  }

  const matchedIds: string[] = (matchedSections ?? []).map((s: { section_id: string }) => s.section_id);

  const { data: currentlyOwned } = await adminClient
    .from("class_section")
    .select("section_id")
    .eq("teacher_id", teacherId);
  const ownedIds: string[] = (currentlyOwned ?? []).map((s: { section_id: string }) => s.section_id);

  const toUnassign = ownedIds.filter((id) => !matchedIds.includes(id));
  if (toUnassign.length > 0) {
    const { error: unassignErr } = await adminClient
      .from("class_section")
      .update({ teacher_id: null })
      .in("section_id", toUnassign);
    if (unassignErr) return { error: unassignErr.message };
  }

  const toAssign = matchedIds.filter((id) => !ownedIds.includes(id));
  if (toAssign.length > 0) {
    const { error: assignErr } = await adminClient
      .from("class_section")
      .update({ teacher_id: teacherId })
      .in("section_id", toAssign);
    if (assignErr) return { error: assignErr.message };
  }

  // A requested name with no matching existing row — create it fresh,
  // owned by this teacher. Defensive fallback only: the multi-select UI
  // normally offers just names of sections that already exist.
  const matchedNamesLower = new Set((matchedSections ?? []).map((s: { section_name: string }) => s.section_name.toLowerCase()));
  const missingNames = wantedNames.filter((n) => !matchedNamesLower.has(n.toLowerCase()));
  for (const name of missingNames) {
    const { error: insertErr } = await adminClient
      .from("class_section")
      .insert({ teacher_id: teacherId, section_name: name, academic_year: "" });
    if (insertErr) console.error("class_section insert failed:", insertErr.message);
  }

  return { error: null };
}

// Emails are derived from the account holder's real name — e.g.
// "juan.delacruz@edumanage.edu" — instead of tracking whatever username
// the admin typed. Never trust client-supplied email; always compute it here.
function baseEmailFromName(firstName: unknown, lastName: unknown): string {
  const clean = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = clean(firstName) || "user";
  const last = clean(lastName) || "account";
  return `${first}.${last}@edumanage.edu`;
}

// Appends a numeric suffix to the local part for retrying against a
// duplicate ("juan.delacruz2@edumanage.edu"); suffix 1 is the base address itself.
function emailWithSuffix(base: string, suffix: number): string {
  if (suffix <= 1) return base;
  const [local, domain] = base.split("@");
  return `${local}${suffix}@${domain}`;
}

// deno-lint-ignore no-explicit-any
function isDuplicateEmailError(message: any): boolean {
  const m = String(message ?? "").toLowerCase();
  return m.includes("already been registered") || m.includes("already registered") || m.includes("already exists") || m.includes("duplicate");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { action, targetRole } = body;

    // notify_password_reset — called from the sign-in page's "Forgot
    // Password" link, BEFORE the caller is logged in. Every other action
    // below requires an Authorization header for an already-signed-in
    // user; this one deliberately runs first and returns early, since a
    // person requesting a reset has no session to authenticate with.
    if (action === "notify_password_reset") {
      const { email } = body;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      if (email && typeof email === "string") {
        const cleanEmail = email.trim().toLowerCase();

        // Emails are generated from the person's name (see
        // baseEmailFromName above), not their username, so there's no
        // shortcut back from email to username anymore — the account has
        // to be found by matching the real auth email directly.
        let matchedUserId: string | null = null;
        for (let page = 1; page <= 20 && !matchedUserId; page++) {
          const { data: pageData, error: listErr } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
          if (listErr || !pageData?.users?.length) break;
          const found = pageData.users.find((u: { email?: string }) => u.email?.toLowerCase() === cleanEmail);
          if (found) matchedUserId = found.id;
          if (pageData.users.length < 200) break; // reached the last page
        }

        const { data: account } = matchedUserId
          ? await adminClient
              .from("user_account")
              .select("account_id, role")
              .eq("account_id", matchedUserId)
              .maybeSingle()
          : { data: null };

        if (account && (account.role === "teacher" || account.role === "student" || account.role === "superadmin")) {
          // Fallback name if the person/role lookup below finds nothing —
          // the part of the email before "@" is at least a recognizable label.
          let name = cleanEmail.split("@")[0];

          // "teacher" and "student" are both the table name AND the role value here,
          // so this covers both without duplicating the lookup.
          if (account.role === "teacher" || account.role === "student") {
            const { data: personRow } = await adminClient
              .from(account.role)
              .select("first_name, last_name")
              .eq("account_id", account.account_id)
              .maybeSingle();
            if (personRow) name = `${personRow.first_name} ${personRow.last_name}`;
          }

          const { error: insertErr } = await adminClient.from("notification").insert({
            recipient_role: "superadmin",
            name,
            message: `${name} requested a password reset.`,
            type: "password_reset_request",
          });
          if (insertErr) console.error("notification insert failed:", insertErr.message);
        }
      }

      // Same response either way — never confirm/deny whether the email matched an account.
      return json({ ok: true });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    // Client scoped as the caller, just to find out who they are
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerUser) return json({ error: "Not authenticated" }, 401);

    // Admin client — bypasses RLS, can manage auth users
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerAccount, error: callerAccountErr } = await adminClient
      .from("user_account")
      .select("role")
      .eq("account_id", callerUser.id)
      .single();
    if (callerAccountErr || !callerAccount) return json({ error: "Caller account not found" }, 403);

    const isSectionAction = action === "manage_section";
    // list_emails looks up auth emails by account_id directly — it isn't
    // "about" a teacher or student row the way every other action is, so
    // it's exempt from the targetRole requirement too.
    const skipsTargetRole = isSectionAction || action === "list_emails";
    if (!skipsTargetRole && !["teacher", "student"].includes(targetRole)) {
      return json({ error: "Invalid targetRole" }, 400);
    }
    if ((targetRole === "teacher" || isSectionAction) && callerAccount.role !== "superadmin") {
      return json({ error: "Only a superadmin can manage teacher accounts" }, 403);
    }
    if (targetRole === "student" && !["teacher", "superadmin"].includes(callerAccount.role)) {
      return json({ error: "Only a teacher or superadmin can manage student accounts" }, 403);
    }

    if (isSectionAction) {
      const { operation, section_id, section_name, academic_year, teacher_id } = body;
      if (!["create", "update", "delete"].includes(operation)) return json({ error: "Invalid section operation" }, 400);
      if (operation !== "delete" && !section_name?.trim()) return json({ error: "A section name is required." }, 400);
      if (teacher_id) {
        const { data: teacher } = await adminClient.from("teacher").select("teacher_id").eq("teacher_id", teacher_id).maybeSingle();
        if (!teacher) return json({ error: "Assigned teacher not found." }, 404);
      }
      if (operation === "create") {
        const { error } = await adminClient.from("class_section").insert({ section_name: section_name.trim(), academic_year: academic_year?.trim() || "", teacher_id });
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
      if (!section_id) return json({ error: "Missing section_id" }, 400);
      if (operation === "update") {
        const { error } = await adminClient.from("class_section").update({ section_name: section_name.trim(), academic_year: academic_year?.trim() || "", teacher_id }).eq("section_id", section_id);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
      const { count, error: countErr } = await adminClient.from("student").select("student_id", { count: "exact", head: true }).eq("section_id", section_id);
      if (countErr) return json({ error: countErr.message }, 400);
      if (count && count > 0) return json({ error: "This section still has students. Reassign them before deleting it." }, 400);
      const { error } = await adminClient.from("class_section").delete().eq("section_id", section_id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "create") {
      const { password, username, profile } = body;
      if (!password || !username || !profile?.first_name || !profile?.last_name) {
        return json({ error: "Missing required fields" }, 400);
      }

      // Reject section conflicts BEFORE creating anything, so a taken
      // section never leaves a half-created teacher account behind.
      if (targetRole === "teacher" && Array.isArray(profile.section_names) && profile.section_names.length > 0) {
        const { conflicts, error: conflictErr } = await findSectionConflicts(adminClient, profile.section_names, null);
        if (conflictErr) return json({ error: conflictErr }, 400);
        if (conflicts.length > 0) {
          return json({ error: `${conflicts.join(", ")} ${conflicts.length === 1 ? "is" : "are"} already assigned to another teacher.` }, 400);
        }
      }

      // Email is always generated from the person's name (never typed in,
      // never taken from the client). If the base address is taken —
      // e.g. two students both named "Juan Dela Cruz" — a numeric suffix
      // is appended until a free address is found.
      const baseEmail = baseEmailFromName(profile.first_name, profile.last_name);
      // deno-lint-ignore no-explicit-any
      let newUser: any = null;
      // deno-lint-ignore no-explicit-any
      let createErr: any = null;
      for (let suffix = 1; suffix <= 25; suffix++) {
        const { data, error } = await adminClient.auth.admin.createUser({
          email: emailWithSuffix(baseEmail, suffix),
          password,
          email_confirm: true,
        });
        if (!error) { newUser = data; createErr = null; break; }
        createErr = error;
        if (!isDuplicateEmailError(error.message)) break; // a real error — stop retrying
      }
      if (!newUser?.user) {
        return json({ error: createErr?.message || "Failed to create auth user" }, 400);
      }
      const newAccountId = newUser.user.id;

      const { error: accountErr } = await adminClient.from("user_account").insert({
        account_id: newAccountId,
        username,
        role: targetRole,
        is_active: true,
      });
      if (accountErr) {
        await adminClient.auth.admin.deleteUser(newAccountId);
        return json({ error: accountErr.message }, 400);
      }

      if (targetRole === "teacher") {
        const { data: teacherRow, error: teacherErr } = await adminClient
          .from("teacher")
          .insert({
            account_id: newAccountId,
            first_name: profile.first_name,
            last_name: profile.last_name,
          })
          .select()
          .single();
        if (teacherErr) {
          await adminClient.auth.admin.deleteUser(newAccountId);
          return json({ error: teacherErr.message }, 400);
        }

        if (Array.isArray(profile.section_names) && profile.section_names.length > 0) {
          // Already validated for conflicts above, before the account was
          // created — this just applies it. Not fatal on failure: the
          // teacher account still exists, sections can be fixed afterward.
          const { error: sectionErr } = await syncTeacherSections(adminClient, teacherRow.teacher_id, profile.section_names);
          if (sectionErr) console.error("section assignment failed:", sectionErr);
        }
      } else {
        // student — a teacher may only add students to their OWN section;
        // a superadmin may assign any section_id.
        if (callerAccount.role === "teacher") {
          const callerTeacherId = await getCallerTeacherId(adminClient, callerUser.id);
          if (!(await sectionBelongsToTeacher(adminClient, profile.section_id, callerTeacherId))) {
            await adminClient.auth.admin.deleteUser(newAccountId);
            return json({ error: "You can only add students to your own section." }, 403);
          }
        }

        const { error: studentErr } = await adminClient.from("student").insert({
          account_id: newAccountId,
          section_id: profile.section_id ?? null,
          first_name: profile.first_name,
          last_name: profile.last_name,
          student_number: profile.student_number ?? null,
          middle_initial: profile.middle_initial ?? null,
          suffix: profile.suffix ?? null,
          address: profile.address ?? null,
          contact_number: profile.contact_number ?? null,
          gender: profile.gender ?? null,
        });
        if (studentErr) {
          await adminClient.auth.admin.deleteUser(newAccountId);
          return json({ error: studentErr.message }, 400);
        }
      }

      return json({ success: true, account_id: newAccountId });
    }

    if (action === "update") {
      const { account_id, username, profile } = body;
      if (!account_id) return json({ error: "Missing account_id" }, 400);
      // Confirm the target row exists under this role before touching anything.
      // `section_id` only exists on the student table (sections point AT
      // teachers via class_section.teacher_id, not the reverse), so it's
      // only requested for that role — asking for it on `teacher` errors
      // out the whole query and gets misreported as "teacher not found".
      const existingRowSelect = targetRole === "student"
        ? "account_id, section_id, first_name, last_name"
        : "account_id, first_name, last_name";
      const { data: existingRow, error: findErr } = await adminClient
        .from(targetRole)
        .select(existingRowSelect)
        .eq("account_id", account_id)
        .single();
      if (findErr || !existingRow) return json({ error: `${targetRole} not found` }, 404);

      // A teacher may only touch students currently in their own section,
      // and (if reassigning) only move them into another section they own.
      let callerTeacherId: string | null = null;
      if (targetRole === "student" && callerAccount.role === "teacher") {
        callerTeacherId = await getCallerTeacherId(adminClient, callerUser.id);
        if (!(await sectionBelongsToTeacher(adminClient, existingRow.section_id, callerTeacherId))) {
          return json({ error: "You can only edit students in your own section." }, 403);
        }
        if (profile?.section_id && !(await sectionBelongsToTeacher(adminClient, profile.section_id, callerTeacherId))) {
          return json({ error: "You can only move students into your own section." }, 403);
        }
      }

      // 1. Auth email is always derived from the account holder's name
      //    (never the username, never client-supplied) — recompute it from
      //    whatever name is now on file, and leave it alone if that
      //    already matches the current auth email.
      {
        const effectiveFirstName = profile?.first_name ?? existingRow.first_name;
        const effectiveLastName = profile?.last_name ?? existingRow.last_name;
        if (effectiveFirstName && effectiveLastName) {
          const baseEmail = baseEmailFromName(effectiveFirstName, effectiveLastName);
          const { data: authUserData } = await adminClient.auth.admin.getUserById(account_id);
          const currentEmail = authUserData?.user?.email;

          if (currentEmail !== baseEmail) {
            let updated = false;
            // deno-lint-ignore no-explicit-any
            let lastErr: any = null;
            for (let suffix = 1; suffix <= 25; suffix++) {
              const attemptEmail = emailWithSuffix(baseEmail, suffix);
              if (attemptEmail === currentEmail) { updated = true; break; } // already this address
              const { error: authErr } = await adminClient.auth.admin.updateUserById(account_id, { email: attemptEmail, email_confirm: true });
              if (!authErr) { updated = true; break; }
              lastErr = authErr;
              if (!isDuplicateEmailError(authErr.message)) break;
            }
            if (!updated) return json({ error: lastErr?.message || "Could not update account email" }, 400);
          }
        }
      }
      // Passwords must be changed via recovery links, never set directly here.

      // 2. user_account.username
      if (username) {
        const { error: userAccErr } = await adminClient
          .from("user_account")
          .update({ username })
          .eq("account_id", account_id);
        if (userAccErr) return json({ error: userAccErr.message }, 400);
      }

      // Toggle Active/Inactive directly (e.g. clicking the Status badge
      // in Teacher/Student Account Management) — separate from the
      // profile-fields update below, since this can be sent on its own
      // with no other fields present.
      if (typeof body.is_active === "boolean") {
        const { error: statusErr } = await adminClient
          .from("user_account")
          .update({ is_active: body.is_active })
          .eq("account_id", account_id);
        if (statusErr) return json({ error: statusErr.message }, 400);
      }

      // 3. profile fields on the teacher/student row itself
      if (profile && Object.keys(profile).length > 0) {
        const allowedFields = targetRole === "teacher"
          ? ["first_name", "last_name"]
          : ["first_name", "last_name", "section_id", "student_number", "middle_initial", "suffix", "address", "contact_number", "gender"];

        const updatePayload: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (profile[field] !== undefined) updatePayload[field] = profile[field];
        }

        if (Object.keys(updatePayload).length > 0) {
          const { error: profileErr } = await adminClient
            .from(targetRole)
            .update(updatePayload)
            .eq("account_id", account_id);
          if (profileErr) return json({ error: profileErr.message }, 400);
        }

        // Section reassignment (teacher only). Replaces this teacher's
        // full set of sections with exactly `profile.section_names` — a
        // teacher can own several sections at once, but a section already
        // owned by a DIFFERENT teacher is rejected, never silently taken.
        if (targetRole === "teacher" && Array.isArray(profile?.section_names)) {
          const { data: teacherRow } = await adminClient
            .from("teacher")
            .select("teacher_id")
            .eq("account_id", account_id)
            .single();

          if (teacherRow) {
            const { error: sectionErr } = await syncTeacherSections(adminClient, teacherRow.teacher_id, profile.section_names);
            if (sectionErr) return json({ error: sectionErr }, 400);
          }
        }
      }

      return json({ success: true, account_id });
    }

    if (action === "reset_password") {
      const { account_id } = body;
      if (!account_id) return json({ error: "Missing account_id" }, 400);

      // Same role-dependent select as the update action above — `section_id`
      // only exists on the student table.
      const targetRowSelect = targetRole === "student" ? "account_id, section_id" : "account_id";
      const { data: targetRow, error: targetErr } = await adminClient.from(targetRole)
        .select(targetRowSelect).eq("account_id", account_id).single();
      if (targetErr || !targetRow) return json({ error: `${targetRole} not found` }, 404);

      if (targetRole === "student" && callerAccount.role === "teacher") {
        const callerTeacherId = await getCallerTeacherId(adminClient, callerUser.id);
        if (!(await sectionBelongsToTeacher(adminClient, targetRow.section_id, callerTeacherId))) {
          return json({ error: "You can only reset passwords for students in your own section." }, 403);
        }
      }

      const { data: authUser, error: authUserErr } = await adminClient.auth.admin.getUserById(account_id);
      if (authUserErr || !authUser.user?.email) return json({ error: "The account email could not be found." }, 404);
      const redirectTo = Deno.env.get("PASSWORD_RESET_REDIRECT_URL");
      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(authUser.user.email, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (resetErr) return json({ error: resetErr.message }, 400);
      return json({ success: true, message: "Password reset email sent." });
    }

    if (action === "delete") {
      const { account_id } = body;
      if (!account_id) return json({ error: "Missing account_id" }, 400);

      if (targetRole === "student" && callerAccount.role === "teacher") {
        const { data: targetStudent } = await adminClient
          .from("student")
          .select("section_id")
          .eq("account_id", account_id)
          .single();
        const callerTeacherId = await getCallerTeacherId(adminClient, callerUser.id);
        if (!(await sectionBelongsToTeacher(adminClient, targetStudent?.section_id, callerTeacherId))) {
          return json({ error: "You can only remove students in your own section." }, 403);
        }
      }

      // Un-assign (never delete!) every section this teacher owns BEFORE
      // the teacher row itself is removed. If class_section.teacher_id has
      // an ON DELETE CASCADE foreign key, deleting the teacher row while
      // sections still point at it would silently delete those sections
      // too — this guarantees they're already detached by that point, so
      // they survive (just unassigned) instead of disappearing.
      if (targetRole === "teacher") {
        const { data: teacherRow } = await adminClient
          .from("teacher")
          .select("teacher_id")
          .eq("account_id", account_id)
          .maybeSingle();
        if (teacherRow) {
          await adminClient
            .from("class_section")
            .update({ teacher_id: null })
            .eq("teacher_id", teacherRow.teacher_id);
        }
      }

      // Deleting the auth user cascades if your FKs use ON DELETE CASCADE;
      // otherwise delete the child rows first.
      await adminClient.from(targetRole).delete().eq("account_id", account_id);
      await adminClient.from("user_account").delete().eq("account_id", account_id);
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(account_id);
      if (deleteErr) return json({ error: deleteErr.message }, 400);

      return json({ success: true });
    }

    // list_emails — returns each requested account's REAL current login
    // email. fetchTeachers()/fetchStudents() run with the caller's own
    // (non-admin) credentials and can't read auth.users directly, so
    // without this they'd have to guess "<username>@edumanage.edu" — which
    // is now wrong for everyone, since email moved to name-based
    // generation. Any signed-in caller may use this; it only returns
    // emails for accounts they explicitly ask about, which in practice
    // are always ones their own already-scoped list fetch just returned.
    if (action === "list_emails") {
      const { accountIds } = body;
      if (!Array.isArray(accountIds) || accountIds.length === 0) return json({ emails: {} });

      const entries = await Promise.all(accountIds.map(async (id: string) => {
        const { data } = await adminClient.auth.admin.getUserById(id);
        return [id, data?.user?.email ?? null] as const;
      }));
      return json({ emails: Object.fromEntries(entries) });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});