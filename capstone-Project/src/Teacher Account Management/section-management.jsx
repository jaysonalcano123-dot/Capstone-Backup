import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client.js'; 
import { fetchManagedSections, manageSection } from '../Teacher Service/teacher-service.js'; // sections live on the same table teachers read from, so this reuses that service
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

/**
 * SECTION MANAGEMENT
 * ------------------
 * Split out of teacher-account-management.jsx so it can be routed to on
 * its own (was previously a second export living inside that file).
 *
 * A section's only "identity" is section_name + academic_year, and its
 * only meaningful relationship is which teacher owns it (class_section.
 * teacher_id). Because Teacher Account Management reads that exact same
 * relationship (teacher_service.fetchTeachers() joins class_section on
 * teacher_id), any change made here — reassigning a section to a
 * different teacher, renaming it, deleting it — is picked up by the
 * Teacher page the next time it loads data. There's no separate copy of
 * this data to keep in sync; both pages read the same source of truth.
 */
function SectionManagement() {
    const navigate = useNavigate();
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    {/* Styled confirmation dialog — replaces window.confirm for deletes. */}
    const { confirm, confirmDialog } = useConfirm();

    const [selectedSection, setSelectedSection] = useState(null);
    const [form, setForm] = useState({ section_name: '', academic_year: '' });
    const [academicYearError, setAcademicYearError] = useState('');

    // Pulls the first 4-digit year out of whatever was typed (e.g. "2024"
    // from "2024-2025") so it works whether someone types a hyphen, an
    // en dash, or nothing at all yet. Returns null if no year-like number
    // is present — we don't block the field in that case, just when it
    // DOES look like a real, past year.
    function getStartYear(value) {
        const match = String(value || '').match(/\d{4}/);
        return match ? parseInt(match[0], 10) : null;
    }

    function validateAcademicYear(value) {
        const startYear = getStartYear(value);
        if (startYear === null) return '';
        const currentYear = new Date().getFullYear();
        return startYear < currentYear
            ? `Academic year can't be in the past — the earliest allowed is ${currentYear}.`
            : '';
    }

    async function loadData() {
        setIsLoading(true);
        setLoadError('');
        try {
            // fetchManagedSections() already joins each section to its
            // assigned teacher internally, so there's no separate teacher
            // fetch needed here now that this page doesn't assign teachers.
            setSections(await fetchManagedSections());
        } catch (err) {
            console.error(err);
            setLoadError(err.message || 'Could not load sections. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
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

    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    async function handleLogout() { await supabase.auth.signOut(); navigate('/sign-in-page', { replace: true }); }

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

    function openModal(section = null) {
        setSelectedSection(section);
        setForm(section
            ? { section_name: section.section_name, academic_year: section.academic_year || '' }
            : { section_name: '', academic_year: '' });
        setAcademicYearError('');
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setSelectedSection(null);
    }

    async function saveSection(event) {
        event.preventDefault();

        const yearError = validateAcademicYear(form.academic_year);
        if (yearError) {
            setAcademicYearError(yearError);
            return;
        }

        setIsSaving(true);
        try {
            await manageSection(selectedSection ? 'update' : 'create', {
                ...form,
                section_id: selectedSection?.section_id,
            });
            closeModal();
            await loadData(); // re-pulls sections AND teachers, so Teacher Account Management sees this the next time it loads
        } catch (err) {
            console.error(err);
            setLoadError(err.message || 'Could not save the section.');
        } finally {
            setIsSaving(false);
        }
    }

    async function deleteSection(section) {
        const ok = await confirm({
            title: 'Delete section',
            message: `Delete ${section.section_name}${section.academic_year ? ` (${section.academic_year})` : ''}? Sections that still have students in them can't be deleted — move or remove those students first.`,
            confirmLabel: 'Delete section',
            danger: true,
        });
        if (!ok) return;
        try {
            await manageSection('delete', { section_id: section.section_id });
            await loadData();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Could not delete the section.');
        }
    }

    {/* --- Multi-select + batch delete ---
         Sections have no active/inactive status, so delete is the only batch
         action here. Rows that can't be deleted (because students are still
         assigned) are reported back individually rather than failing silently. */}
    const selection = useRowSelection(sections, sections, (section) => section.section_id);
    const [isBatchRunning, setIsBatchRunning] = useState(false);

    async function batchDeleteSections() {
        const targets = selection.selectedItems;
        if (targets.length === 0) return;

        const preview = targets.slice(0, 8).map((s) => `${s.section_name}${s.academic_year ? ` (${s.academic_year})` : ''}`);
        if (targets.length > preview.length) preview.push(`…and ${targets.length - preview.length} more`);

        const ok = await confirm({
            title: 'Delete selected sections',
            message: `Delete ${targets.length} selected section${targets.length === 1 ? '' : 's'}? Any section that still has students assigned will be skipped.`,
            details: preview,
            confirmLabel: `Delete ${targets.length} section${targets.length === 1 ? '' : 's'}`,
            danger: true,
        });
        if (!ok) return;

        setIsBatchRunning(true);
        const failures = [];
        for (const section of targets) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await manageSection('delete', { section_id: section.section_id });
            } catch (err) {
                failures.push(`${section.section_name}: ${err.message}`);
            }
        }
        setIsBatchRunning(false);
        selection.clear();
        await loadData();

        if (failures.length > 0) {
            alert(`${targets.length - failures.length} of ${targets.length} deleted.\n\nSkipped:\n${failures.join('\n')}`);
        }
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
                            <a href="/teacher-account-management" className="nav-item">
                                <img src={chalkboardUserIcon} alt="Teacher Icon" className="nav-icon" />
                                Teacher Account Management
                            </a>
                            <a href="/section-management" className="nav-item active">
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
                            <div className="header-actions-row">
                                <div>
                                    <h2 className="page-title-large">Section Management</h2>
                                    <p className="text-gray">Create and manage sections. Assign a section to a teacher from Teacher Account Management.</p>
                                </div>
                                <button className="btn-modal-submit" onClick={() => openModal()}>+ Add Section</button>
                            </div>

                            {loadError && <p style={{ color: '#b91c1c' }}>{loadError}</p>}

                            <div className="data-card">
                                {/* SELECTION TOOLBAR — appears only once at least
                                     one row is ticked. */}
                                {selection.selectedCount > 0 && (
                                    <div className="selection-bar">
                                        <button type="button" className="selection-clear" onClick={selection.clear} disabled={isBatchRunning}>
                                            ✕ Clear selection
                                        </button>
                                        <span className="selection-count">{selection.selectedCount} selected</span>
                                        <div className="selection-actions">
                                            <button type="button" className="btn-danger" onClick={batchDeleteSections} disabled={isBatchRunning}>
                                                🗑 Delete Selected
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="table-responsive">
                                    <table className="styled-table">
                                        <thead>
                                            <tr>
                                                <th className="checkbox-cell" style={{ paddingLeft: '20px' }}>
                                                    <SelectAllCheckbox
                                                        checked={selection.allVisibleSelected}
                                                        indeterminate={selection.someVisibleSelected}
                                                        onChange={selection.toggleAll}
                                                        disabled={isBatchRunning || sections.length === 0}
                                                    />
                                                </th>
                                                <th>Section</th>
                                                <th>Academic Year</th>
                                                <th>Assigned Teacher</th>
                                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading && (
                                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Loading sections…</td></tr>
                                            )}
                                            {!isLoading && sections.length === 0 && (
                                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>No sections yet.</td></tr>
                                            )}
                                            {!isLoading && sections.map(section => (
                                                <tr key={section.section_id} className={selection.isSelected(section) ? 'row-selected' : ''}>
                                                    <td className="checkbox-cell" style={{ paddingLeft: '20px' }}>
                                                        <input
                                                            type="checkbox"
                                                            className="row-checkbox"
                                                            checked={selection.isSelected(section)}
                                                            onChange={(e) => selection.toggleRow(section, e.nativeEvent)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={isBatchRunning}
                                                            aria-label={`Select ${section.section_name}`}
                                                        />
                                                    </td>
                                                    <td><strong>{section.section_name}</strong></td>
                                                    <td>{section.academic_year || '—'}</td>
                                                    <td>{section.teacher?.name || 'Unassigned'}</td>
                                                    <td style={{ paddingRight: '20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <RowActionsMenu
                                                                actions={[
                                                                    { key: 'edit', label: 'View / Edit', icon: '✎', onClick: () => openModal(section) },
                                                                    { key: 'delete', label: 'Delete', icon: '🗑', danger: true, onClick: () => deleteSection(section) },
                                                                ]}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="selection-footer">
                                    {selection.selectedCount} of {sections.length} row(s) selected.
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                {/* ADD / EDIT SECTION MODAL — same modal-overlay / field-group
                     structure as Teacher and Student Account Management. */}
                {isModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box">
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{selectedSection ? 'Edit Section' : 'Add Section'}</h2>
                                    <p className="modal-subtitle">Assign the teacher for this section from Teacher Account Management.</p>
                                </div>
                                <button className="modal-close-btn" onClick={closeModal}>✕</button>
                            </div>
                            <form onSubmit={saveSection}>
                                <div className="modal-body">
                                    <div className="field-group">
                                        <label className="field-label">Section Name</label>
                                        <input
                                            className="modal-input"
                                            value={form.section_name}
                                            onChange={event => setForm({ ...form, section_name: event.target.value })}
                                            placeholder="e.g. BSIT-4103"
                                            required
                                        />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Academic Year</label>
                                        <input
                                            className="modal-input"
                                            placeholder="e.g. 2026–2027"
                                            value={form.academic_year}
                                            onChange={event => {
                                                const value = event.target.value;
                                                setForm({ ...form, academic_year: value });
                                                setAcademicYearError(validateAcademicYear(value));
                                            }}
                                        />
                                        {academicYearError && (
                                            <span style={{ fontSize: '12px', color: '#b91c1c' }}>{academicYearError}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSaving}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit" disabled={isSaving || !!academicYearError}>
                                        {isSaving ? "Saving…" : "Save Section"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Styled confirmation dialog for deletes */}
                {confirmDialog}
            </div>
        </>
    );
}

export default SectionManagement;