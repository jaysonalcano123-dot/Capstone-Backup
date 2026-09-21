import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Style/global-style.css';

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
    
    const dropdownRef = useRef(null);

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Sample Sample";
    const navigate = useNavigate();

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }

    // Handles the notification bell — separate from the profile dropdown
    // TODO: replace with a real notifications panel/list
    function handleNotificationClick() {
        alert("No new notifications");
    }
    function handleLogout() { navigate('/sign-in-page'); }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function openResultModal() { setIsResultModalOpen(true); }
    function closeResultModal() { setIsResultModalOpen(false); }

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
                        <div className="admin-avatar">A</div>
                        <div className="admin-info">
                            <strong>Admin (Name)</strong>
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
                            <button className="notification-btn" onClick={handleNotificationClick} aria-label="Notifications">
                                <img src={bellIcon} alt="Notifications" className="topbar-icon" />
                            </button>
                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <div className="user-profile">
                                    <span className="user-name">{userName}</span>
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
                                    <select className="form-input rounded-input">
                                        <option>SC01</option>
                                    </select>
                                    <label style={{ marginLeft: '15px' }}>Chapter:</label>
                                    <select className="form-input rounded-input">
                                        <option>CH01</option>
                                    </select>
                                </div>
                            </div>

                            {/* All values below are hardcoded sample data —
                                 replace with real aggregated stats from the backend */}
                            <div className="stats-card-grid standalone-stats-grid">
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Completion</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">83%</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Attempt</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">1.5</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Quiz Score</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">80%</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Accuracy</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">85%</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Time</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">3m 15s</span>
                                    </div>
                                </div>
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Highest Score Achieved</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">19/20</span>
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

                            <div className="table-responsive">
                                <table className="data-table shaded-header text-center-table">
                                    <thead>
                                        <tr>
                                            <th>Quiz Title</th>
                                            <th>Chapter</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* [Title of the Quiz] is placeholder text —
                                             swap in real quiz titles once data is connected */}
                                        <tr>
                                            <td><strong>[Title of the Quiz]</strong></td>
                                            <td>1</td>
                                            <td><strong>Completed</strong></td>
                                            <td><button className="btn btn-pill-outline" onClick={openResultModal}>View Result</button></td>
                                        </tr>
                                        <tr>
                                            <td><strong>[Title of the Quiz]</strong></td>
                                            <td>2</td>
                                            <td><strong>Completed</strong></td>
                                            <td><button className="btn btn-pill-outline" onClick={openResultModal}>View Result</button></td>
                                        </tr>
                                        <tr>
                                            <td><strong>[Title of the Quiz]</strong></td>
                                            <td>3</td>
                                            <td><strong>Active</strong></td>
                                            <td><button className="btn btn-pill-outline" onClick={openResultModal}>View Result</button></td>
                                        </tr>
                                        <tr>
                                            <td><strong>[Title of the Quiz]</strong></td>
                                            <td>4</td>
                                            <td><strong>Locked</strong></td>
                                            <td><button className="btn btn-pill-outline" onClick={openResultModal}>View Result</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </main>
                </div>

                {/* ============================================================
                     "VIEW RESULT" MODAL
                     Shown/hidden via openResultModal()/closeResultModal() below.
                     Styled with the .vr-* classes in global-style.css.
                     Currently shows one hardcoded example student row — this
                     should eventually be populated dynamically per quiz/section.
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
                                    <div className="vr-quiz-title"><strong>[Title of the Quiz]</strong> &nbsp;&nbsp;&nbsp; <strong>Chapter n</strong></div>
                                    <div className="vr-status"><strong>Status: Completed</strong></div>
                                </div>
                                
                                {/* 4 summary stat cards; .vr-circle is a placeholder ring
                                     meant to eventually show a percentage/progress circle */}
                                <fieldset className="vr-fieldset">
                                    <legend>Average Statistics</legend>
                                    <div className="vr-stats-grid-4">
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Average Quiz Score</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Average Quiz Completion</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Average Time Taken</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Average Accuracy</span>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Per-student results table; one sample row shown */}
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
                                        <tr>
                                            <td>02000123456</td>
                                            <td>World, Hello Testing</td>
                                            <td>16 / 20</td>
                                            <td>3 min 10 sec</td>
                                            <td>80%</td>
                                        </tr>
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