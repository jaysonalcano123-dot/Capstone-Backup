import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../Style/global-style.css';

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
    const navigate = useNavigate();

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Sample Sample";

    // Shows/hides the profile dropdown menu in the topbar
    function toggleDropdown() {
        setIsDropdownOpen(!isDropdownOpen);
    }

    // Handles the notification bell — separate from the profile dropdown
    // TODO: replace with a real notifications panel/list
    function handleNotificationClick() {
        alert("No new notifications");
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
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handles logging out and routing back to the sign-in page
    function handleLogout() {
        navigate('/sign-in-page');
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
                        <div className="admin-avatar">A</div>
                        <div className="admin-info">
                            <strong>Admin (Name)</strong><span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">

                    {/* TOPBAR */}
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Dashboard</h1>
                        <div className="spacer"></div>
                        <div className="topbar-actions">
                            <button className="notification-btn" onClick={handleNotificationClick} aria-label="Notifications">
                                <img src={bellIcon} alt="Notifications" className="topbar-icon" />
                            </button>
                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <div className="user-profile">
                                    <span className="user-name">{userName}</span>
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

                        {/* Top row of 4 Bootstrap-style colored widgets */}
                        <div className="widget-row">
                            
                            {/* Blue Info Widget */}
                            <div className="widget-card bg-info">
                                <div className="widget-body">
                                    <h3>85%</h3>
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
                                    <h3>2,480</h3>
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
                                    <h3>8.2<span style={{ fontSize: '20px' }}>/10</span></h3>
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
                                    <h3>14</h3>
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
                                <div className="chart-body">
                                    {/* Placeholder for future Doughnut Chart library */}
                                    <h3 style={{ color: '#333', fontSize: '30px', margin: 0, textAlign: 'center' }}>92% <br /><span style={{ fontSize: '15px', color: '#999', fontWeight: 'normal'}}>Completion Rate</span></h3>
                                </div>
                            </div>

                            {/* Right Chart Panel (e.g. Bar Chart) */}
                            <div className="chart-panel">
                                <div className="chart-header">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-8Zm-5 3a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-5Zm-5 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1Z"/></svg>
                                    Chapter Analysis
                                </div>
                                <div className="chart-body">
                                    {/* Placeholder for future Bar Chart library */}
                                    [ Bar Chart Placeholder ]
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}

export default AdminDashboard;