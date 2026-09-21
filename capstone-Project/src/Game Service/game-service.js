import { supabase } from '../../capstone-client'; 

/* =====================================================================
   QUIZZES (assessment_quiz + quiz_question + assessment_record)
   ===================================================================== */

/** All quizzes — used by Game Management's "All Quizzes" tab. */
export async function fetchQuizzes() {
    const { data, error } = await supabase
        .from('assessment_quiz')
        .select('quiz_id, quiz_title, scenario_id, total_items, passing_score, is_modified_by_teacher')
        .order('quiz_title', { ascending: true });
    if (error) throw error;
    return data;
}

/** Questions for one quiz — used by the quiz editor's right-hand preview list. */
export async function fetchQuizQuestions(quizId) {
    const { data, error } = await supabase
        .from('quiz_question')
        .select('question_id, question_text, correct_answer, option_a, option_b, option_c, option_d')
        .eq('quiz_id', quizId)
        .order('question_id', { ascending: true });
    if (error) throw error;
    return data;
}

export async function updateQuizTitle(quizId, title) {
    const { error } = await supabase
        .from('assessment_quiz')
        .update({ quiz_title: title, is_modified_by_teacher: true })
        .eq('quiz_id', quizId);
    if (error) throw error;
}

export async function deleteQuiz(quizId) {
    // Remove questions first — no ON DELETE CASCADE assumed.
    await supabase.from('quiz_question').delete().eq('quiz_id', quizId);
    const { error } = await supabase.from('assessment_quiz').delete().eq('quiz_id', quizId);
    if (error) throw error;
}

export async function addQuizQuestion(quizId, { questionText, optionA, optionB, optionC, optionD, correctAnswer }) {
    const { data, error } = await supabase
        .from('quiz_question')
        .insert({
            quiz_id: quizId,
            question_text: questionText,
            option_a: optionA,
            option_b: optionB,
            option_c: optionC,
            option_d: optionD,
            correct_answer: correctAnswer,
        })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteQuizQuestion(questionId) {
    const { error } = await supabase.from('quiz_question').delete().eq('question_id', questionId);
    if (error) throw error;
}

/**
 * Per-quiz overview stats, scoped automatically by RLS: a teacher only
 * sees records for students in their own section; a superadmin sees
 * everyone. Powers Student Assessment's table + the "View Result" modal's
 * stat cards.
 */
export async function fetchAssessmentOverview() {
    const [{ data: quizzes, error: quizErr }, { data: records, error: recErr }] = await Promise.all([
        supabase.from('assessment_quiz').select('quiz_id, quiz_title'),
        supabase.from('assessment_record').select('quiz_id, total_score, passed, time_taken_seconds, accuracy'),
    ]);
    if (quizErr) throw quizErr;
    if (recErr) throw recErr;

    return quizzes.map((quiz) => {
        const rows = records.filter((r) => r.quiz_id === quiz.quiz_id);
        const attempted = rows.length;
        const completed = rows.filter((r) => r.passed).length;
        const avg = (key) => (attempted === 0 ? null : rows.reduce((sum, r) => sum + (r[key] ?? 0), 0) / attempted);

        return {
            quizId: quiz.quiz_id,
            title: quiz.quiz_title,
            attempted,
            completionRate: attempted === 0 ? null : Math.round((completed / attempted) * 100),
            avgScore: avg('total_score'),
            avgTimeSeconds: avg('time_taken_seconds'),
            avgAccuracy: avg('accuracy'),
            status: attempted === 0 ? 'Not Attempted' : completed === attempted ? 'Completed' : 'Active',
        };
    });
}

/** Per-student rows for one quiz's "View Result" modal. */
export async function fetchAssessmentResultDetail(quizId) {
    const { data, error } = await supabase
        .from('assessment_record')
        .select(`
            record_id, total_score, passed, time_taken_seconds, accuracy, completion_date,
            student ( student_id, student_number, first_name, last_name )
        `)
        .eq('quiz_id', quizId);
    if (error) throw error;
    return data.map((r) => ({
        idNum: r.student?.student_number ?? '',
        name: r.student ? `${r.student.last_name}, ${r.student.first_name}` : '',
        score: r.total_score,
        timeTakenSeconds: r.time_taken_seconds,
        accuracy: r.accuracy,
        passed: r.passed,
    }));
}

/**
 * Per-student performance, aggregated across ALL quizzes and scenarios.
 * Unlike fetchAssessmentOverview()/fetchSimulationOverview() (which group
 * by quiz/scenario) or fetchAssessmentResultDetail()/
 * fetchSimulationResultDetail() (which group by ONE quiz/scenario at a
 * time), this groups every assessment_record + simulation_log row by
 * student_id — so callers can tell which individual students are
 * struggling, not just which quiz/scenario is hard overall.
 *
 * Scoped by the same RLS as the other overview functions: a teacher only
 * gets rows for their own students, a superadmin gets everyone.
 *
 * Returns a map: { [student_id]: { avgScore, completionRate } }
 *   - avgScore: mean of total_score across the student's quiz attempts
 *     (null if they haven't attempted any quiz)
 *   - completionRate: % of quiz+scenario attempts that were
 *     passed/successful (null if they have no attempts at all)
 */
export async function fetchStudentPerformanceOverview() {
    const [{ data: records, error: recErr }, { data: logs, error: logErr }] = await Promise.all([
        supabase.from('assessment_record').select('student_id, total_score, passed'),
        supabase.from('simulation_log').select('student_id, is_success'),
    ]);
    if (recErr) throw recErr;
    if (logErr) throw logErr;

    const byStudent = new Map();
    function getEntry(studentId) {
        if (!byStudent.has(studentId)) {
            byStudent.set(studentId, { quizScores: [], quizAttempted: 0, quizPassed: 0, simAttempted: 0, simSuccess: 0 });
        }
        return byStudent.get(studentId);
    }

    (records ?? []).forEach((r) => {
        if (r.student_id == null) return;
        const entry = getEntry(r.student_id);
        entry.quizAttempted += 1;
        if (r.passed) entry.quizPassed += 1;
        if (r.total_score != null) entry.quizScores.push(r.total_score);
    });

    (logs ?? []).forEach((l) => {
        if (l.student_id == null) return;
        const entry = getEntry(l.student_id);
        entry.simAttempted += 1;
        if (l.is_success) entry.simSuccess += 1;
    });

    const result = {};
    byStudent.forEach((entry, studentId) => {
        const totalAttempted = entry.quizAttempted + entry.simAttempted;
        const totalCompleted = entry.quizPassed + entry.simSuccess;
        result[studentId] = {
            avgScore: entry.quizScores.length > 0
                ? Math.round(entry.quizScores.reduce((sum, s) => sum + s, 0) / entry.quizScores.length)
                : null,
            completionRate: totalAttempted > 0
                ? Math.round((totalCompleted / totalAttempted) * 100)
                : null,
        };
    });
    return result;
}

/* =====================================================================
   SCENARIOS / "CHAPTERS" (privacy_scenario + dispatch_option + simulation_log)
   ===================================================================== */

/** All scenarios — used by Game Management's "Chapter Management" tab. */
export async function fetchScenarios() {
    const { data, error } = await supabase
        .from('privacy_scenario')
        .select('scenario_id, title, rule, situation_text, is_locked, locked_at')
        .order('title', { ascending: true });
    if (error) throw error;
    return data;
}

export async function toggleScenarioLock(scenarioId, lock) {
    const { error } = await supabase
        .from('privacy_scenario')
        .update({ is_locked: lock, locked_at: lock ? new Date().toISOString() : null })
        .eq('scenario_id', scenarioId);
    if (error) throw error;
}

/**
 * Per-scenario overview stats, scoped by RLS the same way as
 * fetchAssessmentOverview(). Powers Student Game Progress's table.
 */
export async function fetchSimulationOverview() {
    const [{ data: scenarios, error: scErr }, { data: logs, error: logErr }] = await Promise.all([
        supabase.from('privacy_scenario').select('scenario_id, title, is_locked'),
        supabase.from('simulation_log').select('scenario_id, is_success, time_taken_seconds'),
    ]);
    if (scErr) throw scErr;
    if (logErr) throw logErr;

    return scenarios.map((scenario) => {
        const rows = logs.filter((l) => l.scenario_id === scenario.scenario_id);
        const attempted = rows.length;
        const successful = rows.filter((r) => r.is_success).length;
        const avgTime = attempted === 0 ? null : rows.reduce((sum, r) => sum + (r.time_taken_seconds ?? 0), 0) / attempted;

        return {
            scenarioId: scenario.scenario_id,
            title: scenario.title,
            attempted,
            completionRate: attempted === 0 ? null : Math.round((successful / attempted) * 100),
            avgTimeSeconds: avgTime,
            status: scenario.is_locked ? 'Locked' : attempted > 0 && successful === attempted ? 'Completed' : 'Active',
        };
    });
}

/** Per-student rows for one scenario's "View Result" modal. */
export async function fetchSimulationResultDetail(scenarioId) {
    const { data, error } = await supabase
        .from('simulation_log')
        .select(`
            sim_log_id, is_success, time_taken_seconds, timestamp,
            student ( student_id, student_number, first_name, last_name )
        `)
        .eq('scenario_id', scenarioId)
        .order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map((r) => ({
        idNum: r.student?.student_number ?? '',
        name: r.student ? `${r.student.last_name}, ${r.student.first_name}` : '',
        timeTakenSeconds: r.time_taken_seconds,
        success: r.is_success,
        timestamp: r.timestamp,
    }));
}