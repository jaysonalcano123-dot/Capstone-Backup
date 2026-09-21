import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import { fetchStudents, fetchSections } from '../Student Service/student-service.js'; // same student data Student Account Management shows; fetchSections() lists every section this teacher owns, even ones with no students enrolled yet
import { fetchAssessmentOverview, fetchSimulationOverview, fetchStudentPerformanceOverview } from '../Game Service/game-service.js'; // same data Student Assessment / Student Game Progress show; fetchStudentPerformanceOverview aggregates the same underlying records per-student instead of per-quiz/scenario
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import '../Style/global-style.css';
import { useDarkMode } from '../Theme/theme.js';

import appsIcon from '../assets/apps.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import consoleControllerIcon from '../assets/console-controller.png';
import chartHistogramIcon from '../assets/chart-histogram.png';
import assessmentIcon from '../assets/assessment.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';

function AdminDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    // TODO: replace with real notifications from the backend
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    // Signed-in teacher's own profile — powers the sidebar footer name/
    // initials and the topbar user-name instead of a hardcoded placeholder.
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [isTeacherLoaded, setIsTeacherLoaded] = useState(false);
    const userName = currentTeacher?.name || (isTeacherLoaded ? 'Admin' : 'Loading…');

    useEffect(() => {
        fetchCurrentTeacher()
            .then(setCurrentTeacher)
            .catch((err) => console.error(err))
            .finally(() => setIsTeacherLoaded(true));
    }, []);

    // Shows/hides the profile dropdown menu in the topbar
    function toggleDropdown() {
        setIsDropdownOpen(!isDropdownOpen);
    }

    // Shows/hides the notifications panel in the topbar
    function toggleNotifications() { setIsNotifOpen(!isNotifOpen); }
    function dismissNotification(id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }
    function markAllRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }

    // ============================================================
    // REAL DASHBOARD DATA — same data sources Student Account
    // Management, Student Assessment, and Student Game Progress read
    // from, aggregated here for the summary widgets/charts.
    // ============================================================
    const [students, setStudents] = useState([]);
    const [assessmentOverview, setAssessmentOverview] = useState([]);
    const [simulationOverview, setSimulationOverview] = useState([]);
    const [studentPerformance, setStudentPerformance] = useState({}); // { [student_id]: { avgScore, completionRate } }
    const [mySections, setMySections] = useState([]); // every section this teacher owns — the Section dropdown's own source of truth, independent of who's enrolled
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState('');

    useEffect(() => {
        async function loadDashboard() {
            setIsDashboardLoading(true);
            setDashboardError('');
            try {
                const [studentRows, assessmentRows, simulationRows, performanceMap, sectionRows] = await Promise.all([
                    fetchStudents(),
                    fetchAssessmentOverview(),
                    fetchSimulationOverview(),
                    fetchStudentPerformanceOverview(),
                    fetchSections(),
                ]);
                setStudents(studentRows);
                setAssessmentOverview(assessmentRows);
                setSimulationOverview(simulationRows);
                setStudentPerformance(performanceMap);
                setMySections(sectionRows);
            } catch (err) {
                console.error(err);
                setDashboardError('Could not load some dashboard data. Numbers below may be incomplete.');
            } finally {
                setIsDashboardLoading(false);
            }
        }
        loadDashboard();
    }, []);

    // Enrolled Students — straight count, same rows Student Account
    // Management's table shows. Filtered down to the selected section (see
    // the Section dropdown in the header) when one is picked.
    const [sectionFilter, setSectionFilter] = useState('all');
    // Every section this teacher owns (not just ones with students already
    // enrolled) — a newly assigned section should show up here right away.
    const sectionOptions = mySections.map(s => s.section_name).filter(Boolean).sort();
    const filteredStudents = sectionFilter === 'all'
        ? students
        : students.filter(s => s.section === sectionFilter);
    const enrolledStudentsCount = filteredStudents.length;

    // Total Average Score — for "All Sections" this stays the original
    // per-quiz aggregate (mean of each quiz's own avgScore). The quiz-level
    // data has no per-section breakdown, so once a specific section is
    // selected this instead averages that section's own students' scores
    // from fetchStudentPerformanceOverview() — the same underlying
    // assessment_record data, just aggregated per-student instead of
    // per-quiz.
    const quizzesWithScore = assessmentOverview.filter(q => q.avgScore != null);
    const avgQuizScore = sectionFilter === 'all'
        ? (quizzesWithScore.length > 0
            ? quizzesWithScore.reduce((sum, q) => sum + q.avgScore, 0) / quizzesWithScore.length
            : null)
        : (() => {
            const scores = filteredStudents.map(s => studentPerformance[s.id]?.avgScore).filter(v => v != null);
            return scores.length > 0 ? scores.reduce((sum, v) => sum + v, 0) / scores.length : null;
        })();

    // Pending Assessments — quizzes + game scenarios whose status isn't
    // "Completed" yet, combined into one count. This is a definition-level
    // status (is the quiz/scenario itself still open), not a per-student
    // record, so it isn't affected by the Section filter — there's no
    // per-section breakdown of "is this quiz done" in the data available here.
    const pendingAssessmentsCount =
        assessmentOverview.filter(q => q.status !== 'Completed').length +
        simulationOverview.filter(s => s.status !== 'Completed').length;

    // Student Progress donut — for "All Sections" this stays the original
    // per-scenario aggregate; once a section is selected, it averages that
    // section's own students' completionRate instead (same reasoning as
    // Total Average Score above).
    const scenariosWithCompletion = simulationOverview.filter(s => s.completionRate != null);
    const overallCompletionRate = sectionFilter === 'all'
        ? (scenariosWithCompletion.length > 0
            ? Math.round(scenariosWithCompletion.reduce((sum, s) => sum + s.completionRate, 0) / scenariosWithCompletion.length)
            : 0)
        : (() => {
            const completions = filteredStudents.map(s => studentPerformance[s.id]?.completionRate).filter(v => v != null);
            return completions.length > 0 ? Math.round(completions.reduce((sum, v) => sum + v, 0) / completions.length) : 0;
        })();
    const studentProgressData = [
        { name: 'Completed', value: overallCompletionRate },
        { name: 'Remaining', value: 100 - overallCompletionRate },
    ];
    const PROGRESS_COLORS = ['#36a68f', '#e3e9e5'];

    // Chapter Analysis bar chart — each scenario's own completion rate.
    // Scenarios don't carry a numeric "score" field the way quizzes do
    // (only completionRate), so this shows % complete per chapter rather
    // than a /10 score. Swap the source array to `assessmentOverview` +
    // `avgScore` here instead if "chapter" should mean "quiz" for you.
    // Like Pending Assessments above, this is per-scenario (not
    // per-student), so it isn't affected by the Section filter.
    const chapterAnalysisData = simulationOverview.map(s => ({
        chapter: s.title,
        completionRate: s.completionRate ?? 0,
    }));
    const avgChapterCompletion = chapterAnalysisData.length > 0
        ? Math.round(chapterAnalysisData.reduce((sum, c) => sum + c.completionRate, 0) / chapterAnalysisData.length)
        : null;

    // ============================================================
    // STUDENTS NEEDING ATTENTION — joins the roster (`students`) with
    // real per-student score/completion from fetchStudentPerformanceOverview(),
    // which aggregates assessment_record + simulation_log by student_id.
    // ============================================================
    const RISK_SCORE_THRESHOLD = 60;      // % — below this, score alone flags a student
    const RISK_COMPLETION_THRESHOLD = 50; // % — below this, completion alone flags a student

    function getRiskLevel(score, completion) {
        if (score == null && completion == null) return 'No Activity'; // hasn't attempted anything yet
        if ((score != null && score < 40) || (completion != null && completion < 25)) return 'High';
        return 'Medium';
    }

    const atRiskStudents = filteredStudents
        .map(s => {
            const perf = studentPerformance[s.id];
            return { ...s, _score: perf?.avgScore ?? null, _completion: perf?.completionRate ?? null };
        })
        .filter(s =>
            (s._score == null && s._completion == null) || // flag zero-activity students too
            (s._score != null && s._score < RISK_SCORE_THRESHOLD) ||
            (s._completion != null && s._completion < RISK_COMPLETION_THRESHOLD)
        )
        .sort((a, b) => (a._score ?? 100) - (b._score ?? 100))
        .slice(0, 5);

    // Shows a quick readout when a chart segment is clicked
    function handleProgressSliceClick(entry) {
        alert(`${entry.name}: ${entry.value}%`);
    }
    function handleChapterBarClick(entry) {
        alert(`${entry.chapter} — Completion: ${entry.completionRate}%`);
    }

    // Slides the sidebar in/out on mobile, and toggles the dark overlay
    function toggleSidebar() {
        setIsSidebarOpen(!isSidebarOpen);
    }

    // Closes the profile dropdown if the user clicks anywhere outside it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handles logging out and routing back to the sign-in page
    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/sign-in-page', { replace: true });
    }

    return (
        <>
            <div className="layout-container">

                {/* Dark overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                )}

                {/* SIDEBAR */}
                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                    <div className="sidebar-header">
                        <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/admin-dashboard" className="nav-item active">
                            <img src={appsIcon} alt="Dashboard Icon" className="nav-icon" /> Dashboard
                        </Link>
                        <Link to="/student-account-management" className="nav-item">
                            <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" /> Student Account Management
                        </Link>
                        <Link to="/game-management" className="nav-item">
                            <img src={consoleControllerIcon} alt="Game Icon" className="nav-icon" /> Game Management
                        </Link>
                        <Link to="/student-game-progress" className="nav-item">
                            <img src={chartHistogramIcon} alt="Progress Icon" className="nav-icon" /> Student Game Progress
                        </Link>
                        <Link to="/student-assessment" className="nav-item">
                            <img src={assessmentIcon} alt="Assessment Icon" className="nav-icon" /> Student Assessment
                        </Link>
                    </nav>
                    <div className="sidebar-footer">
                        <div className="admin-avatar">{currentTeacher?.initials || 'A'}</div>
                        <div className="admin-info">
                            <strong>{currentTeacher?.name || 'Admin'}</strong><span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">

                    {/* TOPBAR */}
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Dashboard</h1>
                        <div className="filter-group" style={{ marginLeft: '20px' }}>
                            <label>Section:</label>
                            <select className="form-input rounded-input" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                                <option value="all">All Sections</option>
                                {sectionOptions.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>
                        <div className="spacer"></div>
                        <div className="topbar-actions">
                            <div className="notification-dropdown-container" ref={notifRef}>
                                <button className="notification-btn" onClick={toggleNotifications} aria-label="Notifications">
                                    <img src={bellIcon} alt="Notifications" className="topbar-icon" />
                                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                                </button>
                                <div className={`notif-panel ${isNotifOpen ? 'show' : ''}`}>
                                    <div className="notif-panel-header">
                                        <span className="notif-panel-title">Notifications</span>
                                        {unreadCount > 0 && <span className="notif-panel-count">{unreadCount} new</span>}
                                    </div>
                                    <div className="notif-list">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                                                    <div className="notif-avatar">{n.name.charAt(0)}</div>
                                                    <div className="notif-body">
                                                        <strong>{n.name}</strong>
                                                        <p>{n.message}</p>
                                                        <span className="notif-time">{n.time}</span>
                                                    </div>
                                                    <button className="notif-dismiss" onClick={() => dismissNotification(n.id)} aria-label="Dismiss notification">✕</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="notif-panel-footer">
                                        <button className="notif-footer-link" onClick={() => navigate('/notifications')}>See all</button>
                                        <button className="notif-footer-link" onClick={markAllRead}>Mark all read</button>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="theme-toggle-btn"
                                onClick={toggleDarkMode}
                                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDarkMode ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="5" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                )}
                            </button>
                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <div className="user-profile">
                                    <button className="dropdown-toggle-btn" onClick={toggleDropdown} aria-label="Toggle profile menu">▼</button>
                                </div>
                                <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                                    <button className="dropdown-item text-red" onClick={handleLogout}>
                                        <img src={leaveIcon} alt="Logout" className="topbar-icon" /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* PAGE BODY */}
                    <main className="page-body">

                        {dashboardError && (
                            <p style={{ color: '#b91c1c', marginBottom: '15px' }}>{dashboardError}</p>
                        )}

                        {/* Top row of 4 Bootstrap-style colored widgets */}
                        <div className="widget-row">
                            
                            {/* Blue Info Widget */}
                            <div className="widget-card bg-info">
                                <div className="widget-body">
                                    <h3>{isDashboardLoading ? '—' : (avgQuizScore != null ? `${Math.round(avgQuizScore)}%` : '—')}</h3>
                                    <p>Total Average Score</p>
                                </div>
                                <div className="widget-icon">
                                    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                                </div>
                                <Link to="/student-assessment" className="widget-footer">
                                    More info <span style={{ marginLeft: '4px' }}>➔</span>
                                </Link>
                            </div>

                            {/* Green Success Widget */}
                            <div className="widget-card bg-success">
                                <div className="widget-body">
                                    <h3>{isDashboardLoading ? '—' : enrolledStudentsCount.toLocaleString()}</h3>
                                    <p>Enrolled Students</p>
                                </div>
                                <div className="widget-icon">
                                    <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                                <Link to="/student-account-management" className="widget-footer">
                                    More info <span style={{ marginLeft: '4px' }}>➔</span>
                                </Link>
                            </div>

                            {/* Yellow Warning Widget */}
                            <div className="widget-card bg-warning">
                                <div className="widget-body">
                                    <h3>{isDashboardLoading ? '—' : (avgChapterCompletion != null ? `${avgChapterCompletion}%` : '—')}</h3>
                                    <p>Avg Score Per Chapter</p>
                                </div>
                                <div className="widget-icon">
                                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                                </div>
                                <Link to="/game-management" className="widget-footer">
                                    More info <span style={{ marginLeft: '4px' }}>➔</span>
                                </Link>
                            </div>

                            {/* Red Danger Widget */}
                            <div className="widget-card bg-danger">
                                <div className="widget-body">
                                    <h3>{isDashboardLoading ? '—' : pendingAssessmentsCount}</h3>
                                    <p>Pending Assessments</p>
                                </div>
                                <div className="widget-icon">
                                    <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                                </div>
                                <Link to="/student-assessment" className="widget-footer">
                                    More info <span style={{ marginLeft: '4px' }}>➔</span>
                                </Link>
                            </div>

                        </div>

                        {/* Bottom Row for Charts/Overviews */}
                        <div className="chart-row">
                            
                            {/* Left Chart Panel (e.g. Doughnut Chart) */}
                            <div className="chart-panel">
                                <div className="chart-header">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3.5a.5.5 0 0 1-.5-.5v-3.5A.5.5 0 0 1 8 4z"/></svg>
                                    Student Progress
                                </div>
                                <div className="chart-body chart-body-viz">
                                    <div className="donut-chart-wrap">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={studentProgressData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius="70%"
                                                    outerRadius="100%"
                                                    paddingAngle={2}
                                                    onClick={handleProgressSliceClick}
                                                    cursor="pointer"
                                                >
                                                    {studentProgressData.map((entry, index) => (
                                                        <Cell key={entry.name} fill={PROGRESS_COLORS[index % PROGRESS_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => [`${value}%`, name]}
                                                    contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="donut-center-label">
                                            <span className="donut-center-value">{isDashboardLoading ? '—' : `${overallCompletionRate}%`}</span>
                                            <span className="donut-center-caption">Completion Rate</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Chart Panel (e.g. Bar Chart) */}
                            <div className="chart-panel">
                                <div className="chart-header">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-8Zm-5 3a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-5Zm-5 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1Z"/></svg>
                                    Chapter Analysis
                                </div>
                                <div className="chart-body chart-body-viz">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chapterAnalysisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                            <XAxis dataKey="chapter" tick={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--text-gray)' }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--text-gray)' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, 'Completion']}
                                                contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 8, border: '1px solid var(--border-color)' }}
                                                cursor={{ fill: 'rgba(54, 166, 143, 0.08)' }}
                                            />
                                            <Bar dataKey="completionRate" radius={[4, 4, 0, 0]} onClick={handleChapterBarClick} cursor="pointer">
                                                {chapterAnalysisData.map((entry) => (
                                                    <Cell key={entry.chapter} fill="#36a68f" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>

                        {/* Students Needing Attention — spans full width under the two charts */}
                        <div className="chart-panel" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                            <div className="chart-header">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.964 0L.165 13.233c-.457.778.091 1.767.982 1.767h13.706c.89 0 1.438-.99.982-1.767L8.982 1.566ZM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5Zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>
                                </svg>
                                Students Needing Attention
                            </div>
                            <div className="chart-body" style={{ padding: '4px 0 8px' }}>
                                {isDashboardLoading ? (
                                    <p style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</p>
                                ) : atRiskStudents.length === 0 ? (
                                    <p style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                        No students currently at risk — everyone's on track.
                                    </p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-gray)', borderBottom: '1px solid var(--border-color)' }}>
                                                <th style={{ padding: '8px 6px', fontWeight: 500 }}>Student</th>
                                                <th style={{ padding: '8px 6px', fontWeight: 500 }}>Score</th>
                                                <th style={{ padding: '8px 6px', fontWeight: 500 }}>Completion</th>
                                                <th style={{ padding: '8px 6px', fontWeight: 500 }}>Risk</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {atRiskStudents.map(s => {
                                                const risk = getRiskLevel(s._score, s._completion);
                                                const riskColor = risk === 'High' ? '#b91c1c' : risk === 'Medium' ? '#b45309' : '#6b7280';
                                                const riskBg = risk === 'High' ? 'rgba(185,28,28,0.1)' : risk === 'Medium' ? 'rgba(180,83,9,0.1)' : 'rgba(107,114,128,0.1)';
                                                return (
                                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '8px 6px' }}>{s.fullName}</td>
                                                        <td style={{ padding: '8px 6px' }}>{s._score != null ? `${s._score}%` : '—'}</td>
                                                        <td style={{ padding: '8px 6px' }}>{s._completion != null ? `${s._completion}%` : '—'}</td>
                                                        <td style={{ padding: '8px 6px' }}>
                                                            <span style={{
                                                                padding: '2px 8px',
                                                                borderRadius: 999,
                                                                fontSize: 11,
                                                                color: riskColor,
                                                                background: riskBg,
                                                            }}>
                                                                {risk}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                <Link to="/student-account-management" className="widget-footer" style={{ display: 'inline-block', marginTop: '10px' }}>
                                    View all students <span style={{ marginLeft: '4px' }}>➔</span>
                                </Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default AdminDashboard;