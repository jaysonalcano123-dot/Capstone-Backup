import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchTeachers, fetchManagedSections, createTeacher, updateTeacher, resetTeacherPassword, setTeacherActive, deleteTeacher as deleteTeacherRequest } from '../Teacher Service/teacher-service.js'; // now in the same folder
import { fetchNotifications, markNotificationsRead, deleteNotifications } from '../Notification Service/notification-service.js';
import RowActionsMenu from '../Shared/rows-action.jsx';
import { useConfirm } from '../Shared/confirm-dialog.jsx';
import useRowSelection, { SelectAllCheckbox } from '../Shared/use-row-function.jsx';
import '../Style/global-styleSA.css';
import { useDarkMode } from '../Theme/theme.js';

import chalkboardUserIcon from '../assets/chalkboard-user.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';
import school from '../assets/school.png';

function TeacherAccountManagement() {
    const [editingId, setEditingId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');

    const [teachers, setTeachers] = useState([]);
    // Real sections (same records Section Management reads/writes), used to
    // populate "Assign Section" as a dropdown instead of free text, so both
    // pages always agree on what a section actually is.
    const [sections, setSections] = useState([]);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

    {/* Search box + Status filter — applied together in `filteredTeachers` below */}
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loadError, setLoadError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    {/* Styled confirmation dialog — replaces window.confirm for every
         destructive action (delete, batch delete, archive). */}
    const { confirm, confirmDialog } = useConfirm();

    // Used only when creating an account. Existing passwords are never shown or changed here.
    const DEFAULT_TEMP_PASSWORD = 'TempPass123!';

    const [formData, setFormData] = useState({
        name: '',
        sectionIds: [],
        username: '',
        password: DEFAULT_TEMP_PASSWORD
    });

    async function loadTeachers() {
        setIsLoadingTeachers(true);
        setLoadError('');
        try {
            const [teacherRows, sectionRows] = await Promise.all([fetchTeachers(), fetchManagedSections()]);
            setTeachers(teacherRows);
            setSections(sectionRows);
        } catch (err) {
            console.error(err);
            setLoadError('Could not load teachers. Please refresh the page.');
        } finally {
            setIsLoadingTeachers(false);
        }
    }

    useEffect(() => {
        loadTeachers();
    }, []);

    const dropdownRef = useRef(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    // Real notifications — e.g. teachers requesting a password reset
    // (see notify-password-reset Edge Function + sign-in-page.jsx).
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    async function loadNotifications() {
        try {
            setNotifications(await fetchNotifications());
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        loadNotifications();
        // Poll periodically so the bell reflects new requests without a manual refresh.
        const intervalId = setInterval(loadNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Kristian Leonard Dumo";
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    const refreshSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
    );

    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    async function handleLogout() { await supabase.auth.signOut(); navigate('/sign-in-page', { replace: true }); }

    // Email is generated automatically from the teacher's name (see the
    // manage-account Edge Function) rather than typed in by the admin.
    // This mirrors that same logic purely for display in the modal.
    function buildEmailPreview(fullName) {
        const parts = (fullName || '').trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '';
        const first = parts[0];
        const last = parts.slice(1).join(' ') || parts[0];
        const clean = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${clean(first) || 'user'}.${clean(last) || 'account'}@edumanage.edu`;
    }

    // Shows/hides the notifications panel in the topbar
    function toggleNotifications() { setIsNotifOpen(!isNotifOpen); }
    async function dismissNotification(id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await deleteNotifications([id]);
        } catch (err) {
            console.error(err);
            loadNotifications(); // reload to undo the optimistic update if the write failed
        }
    }
    async function markAllRead() {
        const ids = notifications.filter(n => !n.read).map(n => n.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await markNotificationsRead(ids);
        } catch (err) {
            console.error(err);
            loadNotifications();
        }
    }

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

    function handleInputChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    // Toggles one section in/out of the checkbox list — a teacher can be
    // assigned to several sections at once now, so this is a Set-like
    // add/remove rather than a single select value.
    function toggleSectionSelection(sectionId) {
        setFormData(prev => ({
            ...prev,
            sectionIds: prev.sectionIds.includes(sectionId)
                ? prev.sectionIds.filter(id => id !== sectionId)
                : [...prev.sectionIds, sectionId],
        }));
    }

    function openAdminModal(mode, teacher = null) {
        setModalMode(mode);

        if (mode === 'add') {
            setFormData({ name: '', sectionIds: [], username: '', password: DEFAULT_TEMP_PASSWORD });
            setEditingId(null);
        } else if (mode === 'edit' && teacher) {
            // Pre-check every section this teacher currently owns, found by
            // matching Section Management's own teacher_id-based `.teacher`
            // field rather than trusting a value baked into `teacher` itself.
            const ownedSectionIds = sections
                .filter(s => s.teacher?.accountId === teacher.accountId)
                .map(s => s.section_id);
            setFormData({
                name: teacher.name,
                sectionIds: ownedSectionIds,
                username: teacher.username,
                password: DEFAULT_TEMP_PASSWORD
            });
            setEditingId(teacher.accountId); // manage-account identifies rows by account_id, not teacher_id
        }
        setIsModalOpen(true);
    }

    function closeAdminModal() {
        setIsModalOpen(false);
    }

    async function saveTeacher(event) {
        event.preventDefault();
        const { name, sectionIds, username, password } = formData;

        if (!name || !username || (modalMode === 'add' && !password)) {
            alert("Please fill in the required fields including the password.");
            return;
        }

        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];
        const sectionNames = sections.filter(s => sectionIds.includes(s.section_id)).map(s => s.section_name);

        setIsSaving(true);
        try {
            if (modalMode === 'edit') {
                await updateTeacher(editingId, {
                    firstName,
                    lastName,
                    username,
                    sections: sectionNames,
                });
            } else {
                await createTeacher({
                    firstName,
                    lastName,
                    username,
                    password,
                    sections: sectionNames,
                });
            }
            await loadTeachers();
            closeAdminModal();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while saving this teacher.");
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteTeacher(teacher) {
        const accountId = typeof teacher === 'object' ? teacher.accountId : teacher;
        const label = typeof teacher === 'object' ? teacher.name : 'this teacher';
        const ok = await confirm({
            title: 'Delete teacher account',
            message: `Delete ${label}? This also deletes their login and can't be undone. Any section they own is left unassigned. To keep the record but block sign-in, archive them instead.`,
            confirmLabel: 'Delete teacher',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteTeacherRequest(accountId);
            await loadTeachers();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while deleting this teacher.");
        }
    }

    async function handlePasswordReset(teacher) {
        const ok = await confirm({
            title: 'Reset password',
            message: `Send a password reset link to ${teacher.username}? Their current password keeps working until they use the link.`,
            confirmLabel: 'Send reset link',
        });
        if (!ok) return;
        try {
            await resetTeacherPassword(teacher.accountId);
            alert('Password reset email sent. The teacher can choose a new password from the one-time link.');
        } catch (err) {
            console.error(err);
            alert(err.message || 'Could not send the password reset email.');
        }
    }

    // Clicking the Status badge toggles Active/Inactive directly, no
    // modal needed. Updates the row optimistically, then rolls back if
    // the request fails.
    const [togglingStatusId, setTogglingStatusId] = useState(null);
    async function toggleTeacherStatus(teacher) {
        const nextActive = !teacher.isActive;
        const ok = await confirm({
            title: nextActive ? 'Reactivate account' : 'Archive account',
            message: nextActive
                ? `Mark ${teacher.name} as Active? They'll be able to sign in again.`
                : `Mark ${teacher.name} as Inactive? Their record is kept but they can't sign in.`,
            confirmLabel: nextActive ? 'Mark Active' : 'Mark Inactive',
            danger: !nextActive,
        });
        if (!ok) return;

        setTogglingStatusId(teacher.id);
        setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, isActive: nextActive } : t)));
        try {
            await setTeacherActive(teacher.accountId, nextActive);
        } catch (err) {
            console.error(err);
            alert(err.message || 'Could not update this account\'s status.');
            setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, isActive: !nextActive } : t)));
        } finally {
            setTogglingStatusId(null);
        }
    }

    function copyTeacherId(teacher) {
        navigator.clipboard?.writeText(String(teacher.id));
    }

    // Prefers the real, backend-generated employee_no (once you've run the
    // migration). Falls back to the cosmetic TCH-XXXXXX code derived from
    // the UUID for any account created before that column existed.
    function formatEmployeeId(teacher) {
        if (teacher.employeeNo) return teacher.employeeNo;
        if (!teacher.id) return '—';
        return `TCH-${String(teacher.id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    }

    // Search (name / email / username / employee ID / section) + Status,
    // combined. Both act on the same already-loaded `teachers` array —
    // no extra fetch, just a client-side narrow of what's rendered.
    const filteredTeachers = teachers.filter((teacher) => {
        const matchesStatus =
            !statusFilter ||
            (statusFilter === 'Active' && teacher.isActive) ||
            (statusFilter === 'Inactive' && !teacher.isActive);

        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !query ||
            teacher.name?.toLowerCase().includes(query) ||
            teacher.email?.toLowerCase().includes(query) ||
            teacher.username?.toLowerCase().includes(query) ||
            String(teacher.id ?? '').toLowerCase().includes(query) ||
            formatEmployeeId(teacher).toLowerCase().includes(query) ||
            teacher.section?.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
    });

    {/* --- Multi-select + batch actions ---
         Same pattern as Student Account Management: `filteredTeachers` drives
         the header "select all" (only what's on screen), while the full
         `teachers` array keeps a row selected if a filter hides it. */}
    const selection = useRowSelection(filteredTeachers, teachers, (teacher) => teacher.id);
    const [isBatchRunning, setIsBatchRunning] = useState(false);

    function selectionPreview(items) {
        const shown = items.slice(0, 8).map((t) => `${formatEmployeeId(t)} — ${t.name}`);
        if (items.length > shown.length) shown.push(`…and ${items.length - shown.length} more`);
        return shown;
    }

    async function runBatchAction({ title, message, confirmLabel, danger, pastTense, action }) {
        const targets = selection.selectedItems;
        if (targets.length === 0) return;

        const ok = await confirm({ title, message, details: selectionPreview(targets), confirmLabel, danger });
        if (!ok) return;

        setIsBatchRunning(true);
        const failures = [];
        for (const teacher of targets) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await action(teacher);
            } catch (err) {
                failures.push(`${teacher.name}: ${err.message}`);
            }
        }
        setIsBatchRunning(false);
        selection.clear();
        await loadTeachers();

        if (failures.length > 0) {
            alert(`${targets.length - failures.length} of ${targets.length} ${pastTense}.\n\nFailed:\n${failures.join('\n')}`);
        }
    }

    function batchDeleteTeachers() {
        const count = selection.selectedCount;
        return runBatchAction({
            title: 'Delete selected teachers',
            message: `Permanently delete ${count} selected teacher${count === 1 ? '' : 's'}? This also deletes their logins and leaves their sections unassigned. This can't be undone.`,
            confirmLabel: `Delete ${count} teacher${count === 1 ? '' : 's'}`,
            danger: true,
            pastTense: 'deleted',
            action: (teacher) => deleteTeacherRequest(teacher.accountId),
        });
    }

    function batchSetActive(nextActive) {
        const count = selection.selectedCount;
        return runBatchAction({
            title: nextActive ? 'Restore selected teachers' : 'Archive selected teachers',
            message: nextActive
                ? `Set ${count} selected account${count === 1 ? '' : 's'} back to active? They'll be able to sign in again.`
                : `Archive ${count} selected account${count === 1 ? '' : 's'}? This sets their status to inactive — the records stay, but they can't sign in.`,
            confirmLabel: nextActive ? 'Restore accounts' : 'Archive accounts',
            danger: !nextActive,
            pastTense: nextActive ? 'restored' : 'archived',
            action: (teacher) => setTeacherActive(teacher.accountId, nextActive),
        });
    }

    return (
        <>
            <div className="super-admin">
                <div className="layout-container">

                    {isSidebarOpen && (
                        <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                    )}

                    <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                        <div className="sidebar-header">
                            <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                        </div>

                        <nav className="sidebar-nav">
                            <a href="/teacher-account-management" className="nav-item active">
                                <img src={chalkboardUserIcon} alt="Teacher Icon" className="nav-icon" />
                                Teacher Account Management
                            </a>
                            <a href="/section-management" className="nav-item">
                                <img src={school} alt="Section Icon" className="nav-icon" />
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
                                            <button className="notif-footer-link" onClick={() => navigate('/notifications-sa')}>See all</button>
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
                                            <img src={leaveIcon} alt="Logout" className="topbar-icon" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <main className="page-body">
                            <div style={{ marginBottom: '25px' }}>
                                <h2 className="page-title-large">Teacher Account Management</h2>
                                <p className="text-gray" style={{ marginTop: '5px' }}>All teacher accounts and their section assignments.</p>
                            </div>

                            {/* TEACHER ACCOUNTS TABLE
                                 Same data-card panel structure as Student Account
                                 Management (Admin / SA). */}
                            <div className="data-card">
                                <div className="card-header-row">
                                    <h3 className="panel-heading" style={{ fontSize: '20px' }}>Teacher Accounts</h3>
                                    <div className="header-actions">
                                        <button className="btn-modal-submit" onClick={() => openAdminModal('add')}>+ Add Teacher</button>
                                    </div>
                                </div>
                                <div className="filter-bar">
                                    <div className="filter-group">
                                        <label>Status:</label>
                                        <select className="form-input rounded-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="">Any Status</option>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="search-box">
                                        <span className="search-icon">🔍</span>
                                        <input
                                            type="text"
                                            className="form-input search-input rounded-input"
                                            placeholder="Search by name, email, or ID"
                                            style={{ borderRadius: '20px' }}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* SELECTION TOOLBAR — appears only once at least
                                     one row is ticked. */}
                                {selection.selectedCount > 0 && (
                                    <div className="selection-bar">
                                        <button type="button" className="selection-clear" onClick={selection.clear} disabled={isBatchRunning}>
                                            ✕ Clear selection
                                        </button>
                                        <span className="selection-count">{selection.selectedCount} selected</span>
                                        <div className="selection-actions">
                                            <button type="button" className="btn-cancel" onClick={() => batchSetActive(false)} disabled={isBatchRunning}>
                                                🗄 Batch Archive
                                            </button>
                                            <button type="button" className="btn-cancel" onClick={() => batchSetActive(true)} disabled={isBatchRunning}>
                                                ↻ Batch Restore
                                            </button>
                                            <button type="button" className="btn-danger" onClick={batchDeleteTeachers} disabled={isBatchRunning}>
                                                🗑 Delete Selected
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="table-responsive">
                                    <table className="styled-table" style={{ marginTop: '10px' }}>
                                        <thead>
                                            <tr>
                                                <th className="checkbox-cell" style={{ paddingLeft: '20px' }}>
                                                    <SelectAllCheckbox
                                                        checked={selection.allVisibleSelected}
                                                        indeterminate={selection.someVisibleSelected}
                                                        onChange={selection.toggleAll}
                                                        disabled={isBatchRunning || filteredTeachers.length === 0}
                                                    />
                                                </th>
                                                <th>TEACHER INFO</th>
                                                <th>EMPLOYEE ID</th>
                                                <th>SECTION ASSIGNED</th>
                                                <th>USERNAME</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: 'center', paddingRight: '20px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoadingTeachers && (
                                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Loading teachers…</td></tr>
                                            )}
                                            {!isLoadingTeachers && loadError && (
                                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>{loadError}</td></tr>
                                            )}
                                            {!isLoadingTeachers && !loadError && teachers.length === 0 && (
                                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No teacher accounts yet.</td></tr>
                                            )}
                                            {!isLoadingTeachers && !loadError && teachers.length > 0 && filteredTeachers.length === 0 && (
                                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No teachers match your search/filter.</td></tr>
                                            )}
                                            {!isLoadingTeachers && !loadError && filteredTeachers.map((teacher) => (
                                                <tr key={teacher.id} className={selection.isSelected(teacher) ? 'row-selected' : ''}>
                                                    <td className="checkbox-cell" style={{ paddingLeft: '20px' }}>
                                                        <input
                                                            type="checkbox"
                                                            className="row-checkbox"
                                                            checked={selection.isSelected(teacher)}
                                                            onChange={(e) => selection.toggleRow(teacher, e.nativeEvent)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={isBatchRunning}
                                                            aria-label={`Select ${teacher.name}`}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="user-info-cell">
                                                            <div className="avatar bg-teal-light">{teacher.initials}</div>
                                                            <div className="user-details">
                                                                <strong style={{ color: '#000' }}>{teacher.name}</strong>
                                                                <span>{teacher.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-gray" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                                                        {formatEmployeeId(teacher)}
                                                    </td>
                                                    <td>
                                                        {teacher.sections && teacher.sections.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                {teacher.sections.map(sec => (
                                                                    <span key={sec} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', color: isDarkMode ? '#fff' : '#333' }}>
                                                                        {sec}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="account-details">
                                                            <div className="acc-line"><span style={{ color: '#777' }}>👤</span> {teacher.username}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={`status-pill status-pill-btn ${teacher.isActive ? 'active' : 'inactive'}`}
                                                            onClick={() => toggleTeacherStatus(teacher)}
                                                            disabled={togglingStatusId === teacher.id}
                                                            title={`Click to mark as ${teacher.isActive ? 'Inactive' : 'Active'}`}
                                                        >
                                                            <span className="dot"></span> {teacher.isActive ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </td>
                                                    <td style={{ paddingRight: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                            <RowActionsMenu
                                                                actions={[
                                                                    { key: 'copy', label: 'Copy ID', icon: '📋', onClick: () => copyTeacherId(teacher) },
                                                                    { key: 'edit', label: 'View / Edit', icon: '✎', onClick: () => openAdminModal('edit', teacher) },
                                                                    { key: 'reset', label: 'Reset Password', icon: '↻', onClick: () => handlePasswordReset(teacher) },
                                                                    { key: 'delete', label: 'Delete', icon: '🗑', danger: true, onClick: () => deleteTeacher(teacher) },
                                                                ]}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pagination-footer">
                                    <span className="showing-text">
                                        Showing {filteredTeachers.length} of {teachers.length} teachers
                                        {selection.selectedCount > 0 && ` · ${selection.selectedCount} of ${filteredTeachers.length} row(s) selected`}
                                    </span>
                                    <div className="pagination-controls">
                                        <button className="page-btn">&lt;</button>
                                        <button className="page-btn active">1</button>
                                        <button className="page-btn">&gt;</button>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                {/* ADD / EDIT TEACHER MODAL
                     Same modal-overlay / field-group structure as Student
                     Account Management, instead of the old fieldset design. */}
                {isModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box" style={{ maxWidth: '520px' }}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{modalMode === 'add' ? "Add New Teacher" : "Edit Teacher"}</h2>
                                    <p className="modal-subtitle">{modalMode === 'add' ? 'Enter teacher details below. The temporary password is for first sign-in only.' : 'Update profile and access details. Passwords are reset through a secure email link.'}</p>
                                </div>
                                <button className="modal-close-btn" onClick={closeAdminModal}>✕</button>
                            </div>
                            <form onSubmit={saveTeacher}>
                                <div className="modal-body">
                                    <div className="section-divider"><span className="divider-text">Identity Details</span></div>
                                    <div className="field-group">
                                        <label className="field-label">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="modal-input" placeholder="e.g. Jonathan Doe" required />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Assign Section(s)</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                                            {sections.length === 0 && (
                                                <span style={{ fontSize: '13px', color: '#6b7280' }}>No sections yet — create one in Section Management.</span>
                                            )}
                                            {sections.map(s => {
                                                const isTakenByOther = s.teacher && s.teacher.accountId !== editingId;
                                                const checked = formData.sectionIds.includes(s.section_id);
                                                return (
                                                    <label key={s.section_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: isTakenByOther ? 0.5 : 1, cursor: isTakenByOther ? 'not-allowed' : 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={isTakenByOther}
                                                            onChange={() => toggleSectionSelection(s.section_id)}
                                                        />
                                                        {s.section_name}
                                                        {isTakenByOther && (
                                                            <span style={{ color: '#9ca3af', fontSize: '11px' }}>— assigned to {s.teacher.name}</span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                            A section already assigned to another teacher can't be selected here — unassign it from them first. Pulled from Section Management, so both pages stay in sync.
                                        </span>
                                    </div>

                                    <div className="section-divider"><span className="divider-text">Access Credentials</span></div>
                                    <div className="field-group">
                                        <label className="field-label">Email</label>
                                        <input type="text" className="modal-input" value={buildEmailPreview(formData.name) || '—'} disabled />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Generated automatically from the teacher's name.</span>
                                    </div>
                                    <div className={modalMode === 'add' ? 'modal-row-2' : ''}>
                                        <div className="field-group">
                                            <label className="field-label">Username</label>
                                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="modal-input" placeholder="username" required />
                                        </div>
                                        {modalMode === 'add' && <div className="field-group">
                                            <label className="field-label">Temporary Password</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="modal-input"
                                                    style={{ paddingRight: '60px', fontFamily: 'monospace' }}
                                                    required
                                                />
                                                <button type="button" onClick={() => setFormData({ ...formData, password: DEFAULT_TEMP_PASSWORD })} title="Restore temporary password" style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0, display: 'flex' }}>
                                                        {refreshSVG}
                                                    </button>
                                            </div>
                                        </div>}
                                    </div>
                                    {modalMode === 'add' && <span style={{ fontSize: '12px', color: '#6b7280' }}>Set a temporary password for the teacher’s first sign-in. Future password changes use the Reset password action.</span>}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeAdminModal} disabled={isSaving}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit" disabled={isSaving}>
                                        {isSaving ? "Saving…" : (modalMode === 'add' ? "Add Teacher" : "Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Styled confirmation dialog for deletes / archives */}
                {confirmDialog}
            </div>
        </>
    );
}

export default TeacherAccountManagement;

// Section Management now lives in its own file: see section-management.jsx
// (same folder). Import it there, e.g.:
//   import SectionManagement from './section-management.jsx';