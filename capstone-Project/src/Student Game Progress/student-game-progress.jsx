import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import { fetchSimulationOverview, fetchSimulationResultDetail } from '../Game Service/game-service.js'; // adjust path to your shared services folder
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

function StudentGameProgress() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    {/* Real overview data + the currently-open modal's per-student detail */}
    const [overview, setOverview] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedScenario, setSelectedScenario] = useState(null);
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

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            setLoadError('');
            try {
                setOverview(await fetchSimulationOverview());
            } catch (err) {
                console.error(err);
                setLoadError('Could not load progress data. Please refresh the page.');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    // ============================================================
    // QUICK STATISTICS — derived from `overview` above, replacing
    // the hardcoded sample numbers.
    // ============================================================

    // Chapter Completion Progress — how many scenarios ("chapters") are
    // marked Completed, out of the total, plus the class-wide average
    // completion rate across every scenario.
    const totalChapters = overview.length;
    const completedChapters = overview.filter(s => s.status === 'Completed').length;
    const scenariosWithCompletion = overview.filter(s => s.completionRate != null);
    const avgCompletionPercent = scenariosWithCompletion.length > 0
        ? Math.round(scenariosWithCompletion.reduce((sum, s) => sum + s.completionRate, 0) / scenariosWithCompletion.length)
        : null;

    // Current Chapter Title — the first scenario the class hasn't
    // finished yet (falls back to the last scenario if every chapter is
    // already Completed). This is a class-wide aggregate, so it reads
    // as "what's currently active for the section" rather than any one
    // student's individual position.
    const currentChapter = overview.find(s => s.status !== 'Completed') ?? overview[overview.length - 1] ?? null;

    // Average Simulation Duration — mean avgTimeSeconds across scenarios.
    const scenariosWithTime = overview.filter(s => s.avgTimeSeconds != null);
    const avgDurationSeconds = scenariosWithTime.length > 0
        ? scenariosWithTime.reduce((sum, s) => sum + s.avgTimeSeconds, 0) / scenariosWithTime.length
        : null;
    const avgDurationMinutes = avgDurationSeconds != null ? Math.floor(avgDurationSeconds / 60) : null;
    const avgDurationRemSeconds = avgDurationSeconds != null ? Math.round(avgDurationSeconds % 60) : null;

    // Small inline stat-card icons — no new asset files needed.
    const iconCompletion = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    );
    const iconChapter = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H14z"/></svg>
    );
    const iconTime = (
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
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

    async function openResultModal(scenario) {
        setSelectedScenario(scenario);
        setIsResultModalOpen(true);
        setIsLoadingDetail(true);
        try {
            setResultDetail(await fetchSimulationResultDetail(scenario.scenarioId));
        } catch (err) {
            console.error(err);
            setResultDetail([]);
        } finally {
            setIsLoadingDetail(false);
        }
    }
    function closeResultModal() { setIsResultModalOpen(false); setSelectedScenario(null); }

    function formatDuration(seconds) {
        if (seconds === null || seconds === undefined) return '—';
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m} min ${s} sec`;
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
                        {/* "active" is hardcoded here since this page has no
                             auto-highlight script (unlike AdminDashboard.html) */}
                        <a href="/student-game-progress" className="nav-item active">
                            <img src={chartHistogramIcon} alt="Progress Icon" className="nav-icon" />
                            Student Game Progress
                        </a>
                        <a href="/student-assessment" className="nav-item">
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
                        <h1 className="page-title">Student Game Progress</h1>

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
                             Section/Chapter filters + 3 standalone stat cards
                             (same look as Game Management's top stat cards —
                             no outer bordered wrapper around the group).
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
                                <select className="form-input rounded-input"><option>CH01</option></select>
                            </div>
                        </div>

                        <div className="stats-card-grid standalone-stats-grid">
                            {/* Chapters completed out of total, and percent complete */}
                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Chapter Completion Progress</span>
                                    <span className="stat-icon">{iconCompletion}</span>
                                </div>
                                <div className="stat-card-body">
                                    <span><span className="text-huge">{isLoading ? '—' : `${completedChapters}/${totalChapters}`}</span> <span className="text-sub">Chapter</span></span>
                                    <span><span className="text-huge">{isLoading ? '—' : (avgCompletionPercent != null ? `${avgCompletionPercent}%` : '—')}</span> <span className="text-sub">Percent</span></span>
                                </div>
                            </div>

                            {/* Title of the scenario the class hasn't finished yet */}
                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Current Chapter Title</span>
                                    <span className="stat-icon">{iconChapter}</span>
                                </div>
                                <div className="stat-card-body">
                                    <strong className="text-medium">{isLoading ? '—' : (currentChapter?.title || 'No chapters yet')}</strong>
                                </div>
                            </div>

                            {/* Average time spent per simulation/game session */}
                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Average Simulation Duration</span>
                                    <span className="stat-icon">{iconTime}</span>
                                </div>
                                <div className="stat-card-body">
                                    <span><span className="text-huge">{isLoading ? '—' : (avgDurationMinutes ?? '—')}</span> <span className="text-sub">minutes</span></span>
                                    <span><span className="text-huge">{isLoading ? '—' : (avgDurationRemSeconds ?? '—')}</span> <span className="text-sub">seconds</span></span>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* ============================================================
                             PROGRESS OVERVIEW TABLE
                             Same pattern as Student Assessment's table: lists each
                             quiz/chapter and its status, with a "View Result" button
                             that opens the shared results modal below (also not yet
                             tied to the specific row clicked).
                             ============================================================ */}
                        <div className="bordered-panel">
                            <div className="panel-top-flex border-bottom-none">
                                <h3 className="panel-heading">Student Progress Overview</h3>
                            </div>

                            <div className="table-responsive">
                                <table className="data-table shaded-header text-center-table">
                                    <thead>
                                        <tr>
                                            <th>Scenario Title</th>
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
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No scenarios yet.</td></tr>
                                        )}
                                        {!isLoading && !loadError && overview.map(scenario => (
                                            <tr key={scenario.scenarioId}>
                                                <td><strong>{scenario.title}</strong></td>
                                                <td>{scenario.attempted}</td>
                                                <td><strong>{scenario.status}</strong></td>
                                                <td><button className="btn-view-result" onClick={() => openResultModal(scenario)}>View Result</button></td>
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
                     Populated from fetchSimulationResultDetail() for whichever
                     scenario's "View Result" button was clicked.
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
                                    <div className="vr-quiz-title"><strong>{selectedScenario?.title}</strong></div>
                                    <div className="vr-status"><strong>Status: {selectedScenario?.status}</strong></div>
                                </div>

                                <fieldset className="vr-fieldset">
                                    <legend>Average Statistics</legend>
                                    <div className="vr-stats-grid">
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{selectedScenario?.completionRate != null ? `${selectedScenario.completionRate}%` : '—'}</span>
                                            <span>Completion</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{formatDuration(selectedScenario?.avgTimeSeconds)}</span>
                                            <span>Duration</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>{selectedScenario?.attempted > 0 ? `${Math.round((resultDetail.filter(r => r.success).length / resultDetail.length) * 100) || 0}%` : '—'}</span>
                                            <span>Accuracy</span>
                                        </div>
                                    </div>
                                </fieldset>

                                <table className="vr-table">
                                    <thead>
                                        <tr>
                                            <th>ID Number</th>
                                            <th>Name</th>
                                            <th>Time Taken</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingDetail && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>Loading…</td></tr>
                                        )}
                                        {!isLoadingDetail && resultDetail.length === 0 && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>No attempts yet.</td></tr>
                                        )}
                                        {!isLoadingDetail && resultDetail.map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.idNum}</td>
                                                <td>{r.name}</td>
                                                <td>{formatDuration(r.timeTakenSeconds)}</td>
                                                <td>{r.success ? 'Success' : 'Failed'}</td>
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

export default StudentGameProgress;