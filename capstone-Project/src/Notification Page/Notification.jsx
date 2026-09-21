import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import '../Style/global-style.css';
import { useDarkMode } from '../Theme/theme.js';

import appsIcon from '../assets/apps.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import consoleControllerIcon from '../assets/console-controller.png';
import chartHistogramIcon from '../assets/chart-histogram.png';
import assessmentIcon from '../assets/assessment.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';

function NotificationsPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Signed-in teacher's own profile — powers the sidebar footer name/
    // initials and the topbar user-name instead of a hardcoded placeholder.
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const userName = currentTeacher?.name || 'Loading…';

    useEffect(() => {
        fetchCurrentTeacher().then(setCurrentTeacher).catch((err) => console.error(err));
    }, []);
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    // TODO: replace with real notifications from the backend. This page and
    // the topbar bell dropdown currently keep their own separate copies of
    // notification state — once a backend is wired up, both should read
    // from the same source (context, store, or API) so read/dismiss actions
    // stay in sync between them.
    const [notifications, setNotifications] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    async function handleLogout() { await supabase.auth.signOut(); navigate('/sign-in-page', { replace: true }); }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allSelected = notifications.length > 0 && selectedIds.length === notifications.length;

    function toggleSelectAll() {
        setSelectedIds(allSelected ? [] : notifications.map(n => n.id));
    }
    function toggleSelectOne(id) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
    function markSelectedRead() {
        setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n));
        setSelectedIds([]);
    }
    function deleteSelected() {
        setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
        setSelectedIds([]);
    }
    function clearAll() {
        setNotifications([]);
        setSelectedIds([]);
    }

    return (
        <>
            <div className="layout-container">

                {isSidebarOpen && (
                    <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                )}

                {/* SIDEBAR — same nav as every other admin page */}
                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                    <div className="sidebar-header">
                        <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                    </div>
                    <nav className="sidebar-nav">
                        <Link to="/admin-dashboard" className="nav-item">
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
                        <h1 className="page-title">Notifications</h1>
                        <div className="spacer"></div>
                        <div className="topbar-actions">
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

                        <div className="notif-feed-wrap">
                            <div className="notif-feed-toolbar">
                                <div>
                                    <h2 className="notif-feed-title">Notifications</h2>
                                    <p className="notif-feed-subtitle">
                                        {notifications.filter(n => !n.read).length} unread · {notifications.length} total
                                    </p>
                                </div>
                                <div className="notif-feed-actions">
                                    <label className="notif-feed-select-all">
                                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                                        Select all
                                    </label>
                                    <button className="btn-pill-outline" onClick={markSelectedRead} disabled={selectedIds.length === 0}>
                                        ✓ Mark as read
                                    </button>
                                    <button className="btn-pill-outline" onClick={deleteSelected} disabled={selectedIds.length === 0}>
                                        🗑 Delete
                                    </button>
                                    <button className="btn btn-outline" onClick={clearAll} disabled={notifications.length === 0}>
                                        Clear all
                                    </button>
                                </div>
                            </div>

                            <div className="notif-feed-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-feed-empty">You're all caught up — no notifications.</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`notif-feed-card ${n.read ? '' : 'is-unread'} ${selectedIds.includes(n.id) ? 'is-selected' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="notif-feed-checkbox"
                                                checked={selectedIds.includes(n.id)}
                                                onChange={() => toggleSelectOne(n.id)}
                                            />
                                            <div className="notif-feed-avatar">{n.name.charAt(0)}</div>
                                            <div className="notif-feed-body">
                                                <div className="notif-feed-row-top">
                                                    <span className="notif-feed-name">{n.name}</span>
                                                    <span className="notif-feed-time">{n.time}</span>
                                                </div>
                                                <p className="notif-feed-message">{n.message}</p>
                                            </div>
                                            {!n.read && <span className="notif-feed-dot" title="Unread"></span>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </>
    );
}

export default NotificationsPage;