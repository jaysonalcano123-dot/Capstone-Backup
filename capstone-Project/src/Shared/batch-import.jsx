/**
 * STUDENT BATCH IMPORT PARSER
 * ---------------------------
 * Shared by the Admin and Super Admin Student Account Management pages.
 *
 * Expected format, one student per line:
 *   ID Number, First Name, Last Name[, Username]
 *
 * What this fixes versus the old inline parser:
 *   - splits on commas OR tabs, and respects "quoted, values" so a name
 *     containing a comma no longer shifts every later column
 *   - skips a pasted header row instead of trying to import it as a student
 *   - reports EVERY bad line at once, with the line number and what's wrong,
 *     instead of bailing out at the first problem
 *   - catches duplicate ID numbers inside the paste, and IDs/usernames that
 *     already exist in the table, before anything is sent to the server
 *
 * Address, Contact Number and Gender were dropped from both this parser and
 * the account forms — the account creation flow generates login email from
 * the person's name instead, and those three fields aren't required anymore.
 */

/** Splits one line on commas or tabs, honouring "quoted values". */
export function splitDelimitedLine(line) {
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if ((char === ',' || char === '\t') && !inQuotes) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current.trim());
    return parts;
}

function looksLikeHeader(parts) {
    const first = (parts[0] || '').toLowerCase().replace(/[^a-z]/g, '');
    return first === 'idnumber' || first === 'id' || first === 'studentnumber' || first === 'studentid';
}

/**
 * @param {string} text      raw textarea contents
 * @param {object} options
 * @param {Array}  options.existingStudents  rows already in the table, used to
 *                                           catch duplicates before submitting
 * @param {string} options.password          temporary password applied to every row
 * @param {string|number} options.sectionId  section every row is assigned to
 * @returns {{rows: Array, errors: Array<string>, skippedHeader: boolean}}
 */
export function parseStudentBatch(text, { existingStudents = [], password, sectionId } = {}) {
    const lines = String(text || '').split(/\r?\n/);
    const rows = [];
    const errors = [];
    let skippedHeader = false;

    const takenIds = new Set(
        existingStudents.map((s) => String(s.idNum ?? '').trim().toLowerCase()).filter(Boolean),
    );
    const takenUsernames = new Set(
        existingStudents.map((s) => String(s.username ?? '').trim().toLowerCase()).filter(Boolean),
    );
    const seenIds = new Map();
    const seenUsernames = new Map();

    lines.forEach((rawLine, index) => {
        const lineNo = index + 1;
        const line = rawLine.trim();
        if (!line) return;

        const parts = splitDelimitedLine(line);

        if (rows.length === 0 && !skippedHeader && looksLikeHeader(parts)) {
            skippedHeader = true;
            return;
        }

        if (parts.length < 3) {
            errors.push(`Line ${lineNo}: found ${parts.length} value${parts.length === 1 ? '' : 's'}, expected at least 3 — ID Number, First Name, Last Name.`);
            return;
        }
        if (parts.length > 4) {
            errors.push(`Line ${lineNo}: found ${parts.length} values, expected 3 or 4 — ID Number, First Name, Last Name[, Username]. If a name contains a comma, wrap it in "quotes".`);
            return;
        }

        const [studentNumber, firstName, lastName, rawUsername] = parts;
        const lineErrors = [];

        if (!studentNumber) lineErrors.push('ID Number is blank');
        if (!firstName) lineErrors.push('First Name is blank');
        if (!lastName) lineErrors.push('Last Name is blank');

        if (studentNumber && !/^[A-Za-z0-9-]+$/.test(studentNumber)) {
            lineErrors.push(`"${studentNumber}" isn't a valid ID Number (letters, numbers and dashes only)`);
        }

        const username = (rawUsername || studentNumber || '').trim();
        const idKey = studentNumber.toLowerCase();
        const usernameKey = username.toLowerCase();

        if (idKey) {
            if (seenIds.has(idKey)) lineErrors.push(`ID Number ${studentNumber} is also on line ${seenIds.get(idKey)}`);
            else if (takenIds.has(idKey)) lineErrors.push(`ID Number ${studentNumber} already belongs to a student in this list`);
        }
        if (usernameKey) {
            if (seenUsernames.has(usernameKey)) lineErrors.push(`username ${username} is also on line ${seenUsernames.get(usernameKey)}`);
            else if (takenUsernames.has(usernameKey)) lineErrors.push(`username ${username} is already taken`);
        }

        if (lineErrors.length > 0) {
            errors.push(`Line ${lineNo}: ${lineErrors.join('; ')}.`);
            return;
        }

        seenIds.set(idKey, lineNo);
        seenUsernames.set(usernameKey, lineNo);

        rows.push({
            lineNo,
            rawLine: line,
            studentNumber,
            firstName,
            lastName,
            username,
            password,
            sectionId,
        });
    });

    return { rows, errors, skippedHeader };
}

/**
 * Creates each parsed row, reporting progress as it goes. Rows are sent one at
 * a time so a single bad record can't take the rest of the batch down with it;
 * whatever fails is handed back with its original line so the textarea can be
 * refilled with only the rows still needing attention.
 */
export async function runStudentBatch(rows, createStudent, onProgress) {
    const succeeded = [];
    const failed = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        onProgress?.({ done: i, total: rows.length, current: row });
        try {
            // eslint-disable-next-line no-await-in-loop
            await createStudent({
                studentNumber: row.studentNumber,
                firstName: row.firstName,
                lastName: row.lastName,
                username: row.username,
                password: row.password,
                sectionId: row.sectionId,
            });
            succeeded.push(row);
        } catch (err) {
            failed.push({ row, message: err?.message || 'Unknown error' });
        }
    }

    onProgress?.({ done: rows.length, total: rows.length, current: null });
    return { succeeded, failed };
}