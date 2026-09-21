import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import { fetchAssessmentOverview, fetchAssessmentResultDetail } from '../Game Service/game-service.js'; // adjust path to your shared services folder
import { fetchSections } from '../Student Service/student-service.js'; // same section data source Student Account Management uses
import '../Style/global-style.css';
import { useDarkMode } from '../Theme/theme.js';

import appsIcon from '../assets/apps.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import consoleControllerIcon from '../assets/console-controller.png';
import chartHistogramIcon from '../assets/chart-histogram.png';
import assessmentIcon from '../assets/assessment.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';

function StudentAssessment() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    {/* Real overview data + the currently-open modal's per-student detail */}
    const [overview, setOverview] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [resultDetail, setResultDetail] = useState([]);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Every section this teacher owns — the dropdown lets them pick which
    // one they're viewing as context (a teacher can own several now).
    const [mySections, setMySections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const mySection = mySections.find(s => s.section_id === selectedSectionId) ?? null;
    useEffect(() => {
        fetchSections().then((sections) => {
            setMySections(sections);
            setSelectedSectionId(sections[0]?.section_id ?? null);
        }).catch((err) => console.error(err));
    }, []);

    // Every individual attempt across every quiz, flattened — fetched
    // once up front purely to compute "Highest Score Achieved" honestly
    // (the actual best single attempt, not an average of averages). For
    // a class-sized quiz list this is a handful of parallel requests;
    // if your quiz count grows large, move this aggregation server-side.
    const [allResults, setAllResults] = useState([]);

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            setLoadError('');
            try {
                const overviewRows = await fetchAssessmentOverview();
                setOverview(overviewRows);
                const detailArrays = await Promise.all(
                    overviewRows.map((q) => fetchAssessmentResultDetail(q.quizId).catch(() => []))
                );
                setAllResults(detailArrays.flat());
            } catch (err) {
                console.error(err);
                setLoadError('Could not load assessment data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    // ============================================================
    // QUICK STATISTICS — derived from the overview + attempts data
    // above, replacing the hardcoded sample numbers.
    // ============================================================
    const quizzesWithCompletion = overview.filter(q => q.completionRate != null);
    const avgQuizCompletion = quizzesWithCompletion.length > 0
        ? Math.round(quizzesWithCompletion.reduce((sum, q) => sum + q.completionRate, 0) / quizzesWithCompletion.length)
        : null;

    const avgQuizAttempts = overview.length > 0
        ? overview.reduce((sum, q) => sum + (q.attempted ?? 0), 0) / overview.length
        : null;

    const quizzesWithScore = overview.filter(q => q.avgScore != null);
    const avgQuizScore = quizzesWithScore.length > 0
        ? quizzesWithScore.reduce((sum, q) => sum + q.avgScore, 0) / quizzesWithScore.length
        : null;

    const quizzesWithAccuracy = overview.filter(q => q.avgAccuracy != null);
    const avgAccuracy = quizzesWithAccuracy.length > 0
        ? quizzesWithAccuracy.reduce((sum, q) => sum + q.avgAccuracy, 0) / quizzesWithAccuracy.length
        : null;

    const quizzesWithTime = overview.filter(q => q.avgTimeSeconds != null);
    const avgQuizTimeSeconds = quizzesWithTime.length > 0
        ? quizzesWithTime.reduce((sum, q) => sum + q.avgTimeSeconds, 0) / quizzesWithTime.length
        : null;

    const scoresAchieved = allResults.map(r => r.score).filter(s => s != null);
    const highestScoreAchieved = scoresAchieved.length > 0 ? Math.max(...scoresAchieved) : null;

    // Small inline stat-card icons — no new asset files needed.
    const iconCompletion = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    );
    const iconAttempts = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
    );
    const iconScore = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
    );
    const iconAccuracy = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
    );
    const iconTime = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
    );
    const iconTrophy = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 19.771l-7.416 3.642 1.48-8.279L0 9.306l8.332-1.151z"/></svg>
    );

    const dropdownRef = useRef(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    // TODO: replace with real notifications from the backend
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    // Signed-in teacher's own profile — powers the sidebar footer name/
    // initials and the topbar user-name instead of a hardcoded placeholder.
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const userName = currentTeacher?.name || 'Loading…';

    useEffect(() => {
        fetchCurrentTeacher().then(setCurrentTeacher).catch((err) => console.error(err));
    }, []);
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }

    // Shows/hides the notifications panel in the topbar
    function toggleNotifications() { setIsNotifOpen(!isNotifOpen); }
    function dismissNotification(id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }
    function markAllRead() {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    async function handleLogout() { await supabase.auth.signOut(); navigate('/sign-in-page', { replace: true }); }

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

    async function openResultModal(quiz) {
        setSelectedQuiz(quiz);
        setIsResultModalOpen(true);
        setIsLoadingDetail(true);
        try {
            setResultDetail(await fetchAssessmentResultDetail(quiz.quizId));
        } catch (err) {
            console.error(err);
            setResultDetail([]);
        } finally {
            setIsLoadingDetail(false);
        }
    }
    function closeResultModal() { setIsResultModalOpen(false); setSelectedQuiz(null); }

    function formatDuration(seconds) {
        if (seconds === null || seconds === undefined) return '—';
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m} min ${s} sec`;
    }

    // Compact variant ("3m 15s") for the Quick Statistics card
    function formatShortDuration(seconds) {
        if (seconds === null || seconds === undefined) return '—';
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}m ${s}s`;
    }

    return (
        <>
            <div className="layout-container">

                {/* ============================================================
                     SIDEBAR (same nav as every other admin page — see
                     AdminDashboard.html for the fuller commented version)
                     ============================================================ */}
                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                    <div className="sidebar-header">
                        <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                    </div>

                    <nav className="sidebar-nav">
                        <a href="/admin-dashboard" className="nav-item">
                            <img src={appsIcon} alt="Dashboard Icon" className="nav-icon" />
                            Dashboard
                        </a>
                        <a href="/student-account-management" className="nav-item">
                            <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" />
                            Student Account Management
                        </a>
                        <a href="/game-management" className="nav-item">
                            <img src={consoleControllerIcon} alt="Game Icon" className="nav-icon" />
                            Game Management
                        </a>
                        <a href="/student-game-progress" className="nav-item">
                            <img src={chartHistogramIcon} alt="Progress Icon" className="nav-icon" />
                            Student Game Progress
                        </a>
                        {/* "active" is hardcoded here since this page has no
                             auto-highlight script (unlike AdminDashboard.html) */}
                        <a href="/student-assessment" className="nav-item active">
                            <img src={assessmentIcon} alt="Assessment Icon" className="nav-icon" />
                            Student Assessment
                        </a>
                    </nav>

                    <div className="sidebar-footer">
                        <div className="admin-avatar">{currentTeacher?.initials || 'A'}</div>
                        <div className="admin-info">
                            <strong>{currentTeacher?.name || 'Admin'}</strong>
                            <span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">
                    {/* Topbar: page title + profile dropdown (logout) */}
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Student Assessment</h1>

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

                                <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} id="profileDropdown">
                                    <button className="dropdown-item text-red" onClick={handleLogout}>
                                        <img src={leaveIcon} alt="Logout" className="topbar-icon" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="page-body">

                        {/* ============================================================
                             QUICK STATISTICS
                             Section/Chapter filters + a row of stat cards, matching
                             the card-grid look used on Student Game Progress (no
                             outer bordered wrapper around the group — each stat
                             gets its own card instead of one shared panel).
                             ============================================================ */}
                        <div className="quick-stats-section">
                            <div className="page-section-header">
                                <h3 className="panel-heading">Quick Statistics</h3>
                                <div className="filter-group">
                                    <label>Section:</label>
                                    <select
                                        className="form-input rounded-input"
                                        value={selectedSectionId || ''}
                                        onChange={(e) => setSelectedSectionId(e.target.value)}
                                        disabled={mySections.length === 0}
                                    >
                                        {mySections.length === 0 ? (
                                            <option value="">No section assigned</option>
                                        ) : (
                                            mySections.map(s => (
                                                <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                                            ))
                                        )}
                                    </select>
                                    <label style={{ marginLeft: '15px' }}>Chapter:</label>
                                    <select className="form-input rounded-input">
                                        <option>CH01</option>
                                    </select>
                                </div>
                            </div>

                            <div className="stats-card-grid standalone-stats-grid">
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Completion</span>
                                        <span className="stat-icon">{iconCompletion}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : (avgQuizCompletion != null ? `${avgQuizCompletion}%` : '—')}</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Attempt</span>
                                        <span className="stat-icon">{iconAttempts}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : (avgQuizAttempts != null ? avgQuizAttempts.toFixed(1) : '—')}</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Score</span>
                                        <span className="stat-icon">{iconScore}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : (avgQuizScore != null ? `${Math.round(avgQuizScore)}%` : '—')}</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Accuracy</span>
                                        <span className="stat-icon">{iconAccuracy}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : (avgAccuracy != null ? `${Math.round(avgAccuracy)}%` : '—')}</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Time</span>
                                        <span className="stat-icon">{iconTime}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : formatShortDuration(avgQuizTimeSeconds)}</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Highest Score Achieved</span>
                                        <span className="stat-icon">{iconTrophy}</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">{isLoading ? '—' : (highestScoreAchieved != null ? highestScoreAchieved : '—')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ============================================================
                             ASSESSMENT OVERVIEW TABLE
                             Lists each quiz/chapter with its completion status.
                             "View Result" opens the results modal (below) via
                             openResultModal() — note it currently opens the SAME
                             modal regardless of which row was clicked, so the
                             modal content is static placeholder data, not tied
                             to the specific row yet.
                             ============================================================ */}
                        <div className="bordered-panel">
                            <div className="panel-top-flex border-bottom-none">
                                <h3 className="panel-heading">Student Assessment Overview</h3>
                            </div>

                            <div className="table-responsive table-scroll-vertical">
                                <table className="data-table shaded-header text-center-table">
                                    <thead>
                                        <tr>
                                            <th>Quiz Title</th>
                                            <th>Attempts</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Loading…</td></tr>
                                        )}
                                        {!isLoading && loadError && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>{loadError}</td></tr>
                                        )}
                                        {!isLoading && !loadError && overview.length === 0 && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No quizzes yet.</td></tr>
                                        )}
                                        {!isLoading && !loadError && overview.map(quiz => (
                                            <tr key={quiz.quizId}>
                                                <td><strong>{quiz.title}</strong></td>
                                                <td>{quiz.attempted}</td>
                                                <td><strong>{quiz.status}</strong></td>
                                                <td><button className="btn-view-result" onClick={() => openResultModal(quiz)}>View Result</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </main>
                </div>

                {/* ============================================================
                     "VIEW RESULT" MODAL
                     Populated from fetchAssessmentResultDetail() for whichever
                     quiz's "View Result" button was clicked.
                     ============================================================ */}
                {isResultModalOpen && (
                    <div className="modal-overlay show-modal" id="resultModal">
                        <div className="modal-box vr-modal">
                            <div className="vr-header">
                                <h2 className="vr-title">View Result</h2>
                                <button className="vr-close" onClick={closeResultModal}>✕</button>
                            </div>
                            <div className="vr-body">
                                <div className="vr-top-info">
                                    <div className="vr-quiz-title"><strong>{selectedQuiz?.title}</strong></div>
                                    <div className="vr-status"><strong>Status: {selectedQuiz?.status}</strong></div>
                                </div>

                                <fieldset className="vr-fieldset">
                                    <legend>Average Statistics</legend>
                                    <div className="vr-stats-grid-4">
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{selectedQuiz?.avgScore != null ? selectedQuiz.avgScore.toFixed(1) : '—'}</span>
                                            <span>Average Quiz Score</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{selectedQuiz?.completionRate != null ? `${selectedQuiz.completionRate}%` : '—'}</span>
                                            <span>Average Quiz Completion</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{formatDuration(selectedQuiz?.avgTimeSeconds)}</span>
                                            <span>Average Time Taken</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{selectedQuiz?.avgAccuracy != null ? `${selectedQuiz.avgAccuracy.toFixed(1)}%` : '—'}</span>
                                            <span>Average Accuracy</span>
                                        </div>
                                    </div>
                                </fieldset>

                                <table className="vr-table">
                                    <thead>
                                        <tr>
                                            <th>ID Number</th>
                                            <th>Name</th>
                                            <th>Quiz Score</th>
                                            <th>Time Taken</th>
                                            <th>Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingDetail && (
                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>Loading…</td></tr>
                                        )}
                                        {!isLoadingDetail && resultDetail.length === 0 && (
                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>No attempts yet.</td></tr>
                                        )}
                                        {!isLoadingDetail && resultDetail.map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.idNum}</td>
                                                <td>{r.name}</td>
                                                <td>{r.score}</td>
                                                <td>{formatDuration(r.timeTakenSeconds)}</td>
                                                <td>{r.accuracy != null ? `${r.accuracy}%` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default StudentAssessment;