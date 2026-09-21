import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchNotifications, markNotificationsRead, deleteNotifications } from '../Notification Service/notification-service.js';
import '../Style/global-styleSA.css';
import { useDarkMode } from '../Theme/theme.js';

import chalkboardUserIcon from '../assets/chalkboard-user.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import schoolIcon from '../assets/school.png';
import leaveIcon from '../assets/leave.png';

function NotificationsPageSA() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Kristian Leonard Dumo";
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    // Real notifications — e.g. teachers requesting a password reset
    // (see notify-password-reset Edge Function + sign-in-page.jsx).
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    async function loadNotifications() {
        setIsLoading(true);
        setLoadError('');
        try {
            setNotifications(await fetchNotifications());
        } catch (err) {
            console.error(err);
            setLoadError('Could not load notifications. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, []);

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
    async function markSelectedRead() {
        const ids = selectedIds;
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
        setSelectedIds([]);
        try {
            await markNotificationsRead(ids);
        } catch (err) {
            console.error(err);
            loadNotifications(); // reload to undo the optimistic update if the write failed
        }
    }
    async function deleteSelected() {
        const ids = selectedIds;
        setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
        setSelectedIds([]);
        try {
            await deleteNotifications(ids);
        } catch (err) {
            console.error(err);
            loadNotifications();
        }
    }
    async function clearAll() {
        const ids = notifications.map(n => n.id);
        setNotifications([]);
        setSelectedIds([]);
        try {
            await deleteNotifications(ids);
        } catch (err) {
            console.error(err);
            loadNotifications();
        }
    }

    return (
        <>
            <div className="super-admin">
                <div className="layout-container">

                    {isSidebarOpen && (
                        <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                    )}

                    {/* SIDEBAR — same nav as the other Super Admin pages */}
                    <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                        <div className="sidebar-header">
                            <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                        </div>

                        <nav className="sidebar-nav">
                            <a href="/teacher-account-management" className="nav-item">
                                <img src={chalkboardUserIcon} alt="Teacher Icon" className="nav-icon" />
                                Teacher Account Management
                            </a>
                            <a href="/section-management" className="nav-item">
                                <img src={schoolIcon} alt="School Icon" className="nav-icon" />
                                Section Management
                            </a>
                            <a href="/student-account-management-sa" className="nav-item">
                                <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" />
                                Student Account Management
                            </a>
                        </nav>

                        <div className="sidebar-footer">
                            <div className="admin-avatar">KD</div>
                            <div className="admin-info">
                                <strong>Kristian Leonard Dumo</strong>
                                <span>Super Admin</span>
                            </div>
                        </div>
                    </aside>

                    <div className="main-content">
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

                                {loadError && <p style={{ color: '#b91c1c', padding: '0 4px 14px' }}>{loadError}</p>}

                                <div className="notif-feed-list">
                                    {isLoading ? (
                                        <div className="notif-feed-empty">Loading…</div>
                                    ) : notifications.length === 0 ? (
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
            </div>
        </>
    );
}

export default NotificationsPageSA;