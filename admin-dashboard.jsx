import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './global-style.css';
import appsIcon from './assets/apps.png';
import graduationCapIcon from './assets/graduation-cap.png';
import consoleControllerIcon from './assets/console-controller.png';
import chartHistogramIcon from './assets/chart-histogram.png';
import assessmentIcon from './assets/assessment.png';
import bellIcon from './assets/bell.png';
import leaveIcon from './assets/leave.png';

function AdminDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    {/* Shows/hides the profile dropdown menu in the topbar */}
    function toggleDropdown() {
        setIsDropdownOpen(!isDropdownOpen);
    }

    {/* Slides the sidebar in/out on mobile, and toggles the dark overlay */}
    function toggleSidebar() {
        setIsSidebarOpen(!isSidebarOpen);
    }

    {/* Closes the profile dropdown if the user clicks anywhere outside it */}
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    {/* Handles logging out and routing back to the sign-in page */}
    function handleLogout() {
        navigate('/sign-in-page');
    }

    return (
        <>
            {/* ============================================================
                 PAGE LAYOUT WRAPPER
                 Holds the sidebar (left nav) + main content area (right).
                 ============================================================ */}
            <div className="layout-container">

                {/* Dark overlay shown behind the sidebar on mobile when it's open.
                     Clicking it closes the sidebar (calls toggleSidebar()). */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay show-overlay" id="sidebarOverlay" onClick={toggleSidebar}></div>
                )}

                {/* ============================================================
                     SIDEBAR
                     Left navigation menu, shared across all admin pages.
                     On mobile this slides in/out via the "mobileSidebar" ID
                     and the show-sidebar class (toggled by toggleSidebar()).
                     ============================================================ */}
                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`} id="mobileSidebar">
                    {/* Empty header — likely intended for a logo, left blank for now */}
                    <div className="sidebar-header"></div>

                    {/* Nav links to each admin page. The "active" className marks
                         the current page. Routing paths are updated for React Router. */}
                    <nav className="sidebar-nav">
                        <a href="/admin-dashboard" className="nav-item active">
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
                        <a href="/student-assessment" className="nav-item">
                            <img src={assessmentIcon} alt="Assessment Icon" className="nav-icon" />
                            Student Assessment
                        </a>
                    </nav>

                    {/* Bottom-of-sidebar admin info (avatar + name/role).
                         "A" and "Admin (Name)" look like placeholders —
                         replace with real logged-in admin data. */}
                    <div className="sidebar-footer">
                        <div className="admin-avatar">A</div>
                        <div className="admin-info">
                            <strong>Admin (Name)</strong>
                            <span>Admin</span>
                        </div>
                    </div>
                </aside>

                {/* ============================================================
                     MAIN CONTENT AREA
                     Everything to the right of the sidebar: topbar + page body.
                     ============================================================ */}
                <div className="main-content">

                    {/* --- Top bar: page title, notifications, profile menu --- */}
                    <header className="topbar">
                        {/* Hamburger icon, only visible on mobile — opens the sidebar */}
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>

                        <h1 className="page-title">Dashboard</h1>
                        <div className="spacer"></div> {/* pushes profile section to the right */}

                        {/* Profile section: bell icon, username, avatar, dropdown arrow.
                             Clicking anywhere on .user-profile toggles the dropdown. */}
                        <div className="profile-dropdown-container" ref={dropdownRef}>
                            <div className="user-profile" onClick={toggleDropdown}>
                                <img src={bellIcon} alt="Notification" className="topbar-icon" />
                                <span className="user-name">Sample Sample</span>
                                {/* Placeholder for the admin's profile picture */}
                                <span className="dropdown-icon">▼</span>
                            </div>

                            {/* Dropdown menu (hidden by default, shown via .show class) */}
                            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} id="profileDropdown">
                                <button className="dropdown-item text-red" onClick={handleLogout}>
                                    <img src={leaveIcon} alt="Logout" className="topbar-icon" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* --- Page body: dashboard stat cards --- */}
                    <main className="page-body">
                        <div className="dashboard-grid">

                            {/* Big featured card: average score across all students */}
                            <div className="card card-main">
                                <h2>Total Average Student Score</h2>
                                <div className="card-content">
                                    <span className="text-massive text-green">85%</span>
                                </div>
                            </div>

                            {/* Total number of enrolled students */}
                            <div className="card card-top-right">
                                <h2>No. of Students Enrolled</h2>
                                <div className="card-content">
                                    <span className="text-massive">2,480</span>
                                </div>
                            </div>

                            {/* Average score per chapter, shown as "X/10" */}
                            <div className="card card-mid-right">
                                <h2>Average Score Per Chapter</h2>
                                <div className="card-content">
                                    <span className="text-massive">
                                        8.2<span style={{ fontSize: '24px', color: '#777' }}>/10</span>
                                    </span>
                                </div>
                            </div>

                            {/* Pending assessments awaiting admin review */}
                            <div className="card card-bottom-left">
                                <h2>To Check</h2>
                                <div className="card-content">
                                    <span className="text-massive">14</span>
                                    <span style={{ marginLeft: '10px', color: '#777' }}>Pending Assessments</span>
                                </div>
                            </div>

                            {/* Overall student progress percentage */}
                            <div className="card card-bottom-right">
                                <h2>Student Progress</h2>
                                <div className="card-content">
                                    <span className="text-massive">92%</span>
                                </div>
                            </div>
                        </div>
                        {/* NOTE: all stat values above (85%, 2,480, 8.2/10, 14, 92%)
                             are hardcoded placeholders — replace with real data
                             from the backend/API. */}
                    </main>
                </div>
            </div>
        </>
    );
}

export default AdminDashboard;