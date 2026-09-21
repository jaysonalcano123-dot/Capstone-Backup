import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './global-style.css';

import appsIcon from './assets/apps.png';
import graduationCapIcon from './assets/graduation-cap.png';
import consoleControllerIcon from './assets/console-controller.png';
import chartHistogramIcon from './assets/chart-histogram.png';
import assessmentIcon from './assets/assessment.png';
import bellIcon from './assets/bell.png';
import leaveIcon from './assets/leave.png';

function StudentAssessment() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
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
                    <div className="sidebar-header"></div>

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

                        <div className="profile-dropdown-container" ref={dropdownRef}>
                            <div className="user-profile" onClick={toggleDropdown}>
                                <img src={bellIcon} alt="Notification" className="topbar-icon" />
                                <span className="user-name">Sample Sample</span>
                                <span className="dropdown-icon">▼</span>
                            </div>

                            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} id="profileDropdown">
                                <button className="dropdown-item text-red" onClick={handleLogout}>
                                    <img src={leaveIcon} alt="Logout" className="topbar-icon" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="page-body">

                        {/* ============================================================
                             QUICK STATISTICS PANEL
                             Section/Chapter filter dropdowns (not yet wired to JS —
                             just static <select> markup for now) + a row of
                             summary stats for the selected quiz(zes).
                             ============================================================ */}
                        <div className="bordered-panel">
                            <div className="panel-top-flex border-bottom-none">
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
                            <div className="stats-inline-flex">
                                <div className="stat-item">
                                    <span className="stat-label">Average Quiz Completion</span>
                                    <span className="stat-value">83%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Average Quiz Attempt</span>
                                    <span className="stat-value">1.5</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Average Quiz Score</span>
                                    <span className="stat-value">80%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Average Accuracy</span>
                                    <span className="stat-value">85%</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Average Time</span>
                                    <span className="stat-value">3m 15 sec</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Highest Score Achieved</span>
                                    <span className="stat-value">19/20</span>
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