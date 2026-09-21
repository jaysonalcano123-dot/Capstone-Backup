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

function StudentGameProgress() {
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
                        <h1 className="page-title">Student Progress</h1>

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
                             Section/Chapter filters + 3 stat cards summarizing a
                             student's (or class's) progress through the game.
                             ============================================================ */}
                        <div className="bordered-panel">
                            <div className="panel-top-flex">
                                <h3 className="panel-heading">Quick Statistics</h3>
                                <div className="filter-group">
                                    <label>Section:</label>
                                    <select className="form-input rounded-input"><option>SC01</option></select>
                                    <label style={{ marginLeft: '15px' }}>Chapter:</label>
                                    <select className="form-input rounded-input"><option>CH01</option></select>
                                </div>
                            </div>

                            <div className="stats-card-grid">
                                {/* Chapters completed out of total, and percent complete */}
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Chapter Completion Progress</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">3/3</span> <span className="text-sub">Chapter</span>
                                        <span className="text-huge" style={{ marginLeft: '15px' }}>100%</span> <span className="text-sub">Percent</span>
                                    </div>
                                </div>

                                {/* Title of whichever chapter the student is currently on —
                                     [Chapter Title] is placeholder text */}
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Current Chapter Title</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <strong className="text-medium">[Chapter Title]</strong>
                                    </div>
                                </div>

                                {/* Average time spent per simulation/game session */}
                                <div className="inner-stat-card">
                                    <div className="stat-card-header">
                                        <span>Average Simulation Duration</span>
                                        <span className="placeholder-icon">[ICON]</span>
                                    </div>
                                    <div className="stat-card-body">
                                        <span className="text-huge">10</span> <span className="text-sub">minutes</span>
                                        <span className="text-huge" style={{ marginLeft: '10px' }}>15</span> <span className="text-sub">seconds</span>
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
                     Note the difference from StudentAssessment.html's version:
                     this one uses "vr-stats-grid" (3 cards: Completion, Duration,
                     Accuracy) instead of "vr-stats-grid-4". Heads up — that class
                     has no matching CSS rule in global-style.css, so these 3 cards
                     currently fall back to default block layout instead of a grid.
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
                                
                                <fieldset className="vr-fieldset">
                                    <legend>Average Statistics</legend>
                                    <div className="vr-stats-grid">
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Completion</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Duration</span>
                                        </div>
                                        <div className="vr-stat-card">
                                            <div className="vr-circle"></div>
                                            <span>Accuracy</span>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Per-student progress table; one sample row shown */}
                                <table className="vr-table">
                                    <thead>
                                        <tr>
                                            <th>ID Number</th>
                                            <th>Name</th>
                                            <th>Total Simulation Play Time</th>
                                            <th>Response Accuracy</th>
                                            <th>Chapter Completion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>02000123456</td>
                                            <td>World, Hello Testing</td>
                                            <td>3 min 10 sec</td>
                                            <td>80%</td>
                                            <td>100%</td>
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

export default StudentGameProgress;