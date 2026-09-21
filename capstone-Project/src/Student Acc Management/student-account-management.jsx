import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import { fetchStudents, fetchSections, createStudent, updateStudent, resetStudentPassword, setStudentActive, deleteStudent as deleteStudentRequest } from '../Student Service/student-service.js'; // adjust path to your shared services folder
import RowActionsMenu from '../Shared/rows-action.jsx';
import { useConfirm } from '../Shared/confirm-dialog.jsx';
import useRowSelection, { SelectAllCheckbox } from '../Shared/use-row-function.jsx';
import { parseStudentBatch, runStudentBatch } from '../Shared/batch-import.jsx';
import '../Style/global-style.css';
import { useDarkMode } from '../Theme/theme.js';

import appsIcon from '../assets/apps.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import consoleControllerIcon from '../assets/console-controller.png';
import chartHistogramIcon from '../assets/chart-histogram.png';
import assessmentIcon from '../assets/assessment.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';

function StudentAccountManagement() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    {/* Modal state */}
    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    {/* Table Data State (Replaces the vanilla JS DOM insertion).
         Personal info + login credentials now live on ONE record,
         since a "student account" is really both of these together. */}
    const [students, setStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    {/* The teacher's own sections — a teacher may only add/edit/delete
         students within a section they own (enforced server-side too), so
         it's auto-attached rather than picked in the form. A teacher can
         own several sections now, so `mySections` holds all of them and
         `selectedSectionId` is whichever one is currently being viewed —
         the class list, "Assign Section" preview, and new-student/batch
         creation all follow this selection. */}
    const [mySections, setMySections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const mySection = mySections.find(s => s.section_id === selectedSectionId) ?? null;

    {/* Edit State */}
    const [editingStudent, setEditingStudent] = useState(null);

    {/* Search box — filters the already-loaded `students` array by name or ID */}
    const [searchQuery, setSearchQuery] = useState('');

    {/* Styled confirmation dialog, used by every destructive action on this
         page (single delete, batch delete, batch archive, status toggle)
         instead of the browser's window.confirm popup. */}
    const { confirm, confirmDialog } = useConfirm();

    async function loadData() {
        setIsLoadingStudents(true);
        setLoadError('');
        try {
            const [studentRows, sections] = await Promise.all([fetchStudents(), fetchSections()]);
            setStudents(studentRows);
            setMySections(sections);
            // Keep the current selection if it's still valid (e.g. after a
            // save), otherwise default to the first owned section.
            setSelectedSectionId(prev =>
                (prev && sections.some(s => s.section_id === prev)) ? prev : (sections[0]?.section_id ?? null)
            );
        } catch (err) {
            console.error(err);
            setLoadError('Could not load students. Please refresh the page.');
        } finally {
            setIsLoadingStudents(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    {/* Temp password shown in the Add/Edit modal — editable, defaults to
         a fixed value rather than being randomized (see DEFAULT_TEMP_PASSWORD). */}
    const [modalTempPassword, setModalTempPassword] = useState('');

    {/* Whether the modal's password field shows plain text or dots */}
    const [showModalPassword, setShowModalPassword] = useState(false);

    {/* Batch import textarea, parse/validation problems, per-row progress,
         and the summary shown after a run finishes. */}
    const [batchText, setBatchText] = useState('');
    const [batchError, setBatchError] = useState('');
    const [batchIssues, setBatchIssues] = useState([]);
    const [batchProgress, setBatchProgress] = useState(null);
    const [batchResult, setBatchResult] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

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

    const eyeOpenSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    );
    const eyeClosedSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
    );
    const refreshSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
    );

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

    {/* --- Temporary password ---
         Students set their real password in-game on first login; this is
         just the starter credential the admin hands out. It's a fixed
         default (same one used across the app, e.g. Teacher Account
         Management) rather than randomized, so it's predictable and easy
         to communicate to students. Admins can still edit it per-student
         in the modal below before saving. */}
    const DEFAULT_TEMP_PASSWORD = 'TempPass123!';

    {/* Email is generated automatically from the student's name (see the
         manage-account Edge Function) rather than typed in by the admin.
         This preview mirrors that same logic purely for display — the
         actual address is always computed server-side. */}
    const [previewFirstName, setPreviewFirstName] = useState('');
    const [previewLastName, setPreviewLastName] = useState('');
    function buildEmailPreview(first, last) {
        const clean = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const f = clean(first);
        const l = clean(last);
        if (!f && !l) return '';
        return `${f || 'user'}.${l || 'account'}@edumanage.edu`;
    }

    {/* --- Student Account Logic (personal info + login credentials together) --- */}
    function openInsertModal(student = null) {
        setEditingStudent(student);
        setPreviewFirstName(student?.firstName || '');
        setPreviewLastName(student?.lastName || '');
        setModalTempPassword(student ? '' : DEFAULT_TEMP_PASSWORD);
        setShowModalPassword(false);
        setIsInsertModalOpen(true);
    }

    function closeInsertModal() {
        setIsInsertModalOpen(false);
        setEditingStudent(null);
        setModalTempPassword('');
    }

    async function handleInsertStudent(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const payload = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            mi: formData.get('mi'),
            suffix: formData.get('suffix'),
            studentNumber: formData.get('studentNum'),
            username: formData.get('username'),
            password: editingStudent ? undefined : modalTempPassword,
            sectionId: mySection?.section_id,
        };

        if (!mySection) {
            alert("You don't have a section assigned yet — contact your administrator before adding students.");
            return;
        }

        setIsSaving(true);
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.accountId, payload);
            } else {
                if (!payload.password) {
                    alert("Please set a temporary password.");
                    setIsSaving(false);
                    return;
                }
                await createStudent(payload);
            }
            await loadData();
            closeInsertModal();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while saving this student.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteStudent(student) {
        const accountId = typeof student === 'object' ? student.accountId : student;
        const label = typeof student === 'object' ? student.fullName : 'this student';
        const ok = await confirm({
            title: 'Delete student account',
            message: `Delete ${label}? This also deletes their login and can't be undone. To keep the record but block sign-in, archive them instead.`,
            confirmLabel: 'Delete student',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteStudentRequest(accountId);
            await loadData();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while deleting this student.");
        }
    }

    async function handlePasswordReset(student) {
        const ok = await confirm({
            title: 'Reset password',
            message: `Reset the password for ${student.username} to the default temporary password (${DEFAULT_TEMP_PASSWORD})? Their current password will stop working immediately.`,
            confirmLabel: 'Reset password',
        });
        if (!ok) return;
        try {
            // Sets the password directly — no email or link involved.
            await resetStudentPassword(student.accountId, DEFAULT_TEMP_PASSWORD);
            alert(`Password reset. ${student.username} can now sign in with the temporary password: ${DEFAULT_TEMP_PASSWORD}`);
        } catch (err) {
            console.error(err);
            alert(err.message || 'Could not reset the password.');
        }
    }

    // Clicking the Status badge toggles Active/Inactive directly, no
    // modal needed. Updates the row optimistically, then rolls back if
    // the request fails.
    const [togglingStatusId, setTogglingStatusId] = useState(null);
    async function toggleStudentStatus(student) {
        const nextActive = !student.isActive;
        const ok = await confirm({
            title: nextActive ? 'Reactivate account' : 'Archive account',
            message: nextActive
                ? `Mark ${student.fullName} as Active? They'll be able to sign in again.`
                : `Mark ${student.fullName} as Inactive? Their record is kept but they can't sign in.`,
            confirmLabel: nextActive ? 'Mark Active' : 'Mark Inactive',
            danger: !nextActive,
        });
        if (!ok) return;

        setTogglingStatusId(student.id);
        setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, isActive: nextActive } : s)));
        try {
            await setStudentActive(student.accountId, nextActive);
        } catch (err) {
            console.error(err);
            alert(err.message || "Could not update this account's status.");
            setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, isActive: !nextActive } : s)));
        } finally {
            setTogglingStatusId(null);
        }
    }

    function copyStudentId(student) {
        navigator.clipboard?.writeText(String(student.idNum ?? student.id));
    }

    {/* Exports whatever is currently on screen (respects the active search),
         so the file always matches the registered students actually shown. */}
    function downloadClassListCSV() {
        const escapeCsv = (value) => {
            const str = String(value ?? '');
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const header = ['ID Number', 'Name', 'Email Address', 'Status'];
        const lines = [header.join(',')];
        filteredStudents.forEach((s) => {
            lines.push([s.idNum, s.fullName, s.email || buildEmailPreview(s.firstName, s.lastName), s.isActive ? 'Active' : 'Inactive'].map(escapeCsv).join(','));
        });
        const csvContent = lines.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const sectionLabel = (mySection?.section_name || 'class-list').replace(/[^a-z0-9-]+/gi, '-');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sectionLabel}-class-list-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Narrowed to the currently selected section first (fetchStudents()
    // returns every section this teacher owns combined, so this is what
    // actually keeps each section's roster separate), then by the name/ID/
    // username search on top of that.
    const filteredStudents = students.filter((student) => {
        if (selectedSectionId && student.sectionId !== selectedSectionId) return false;
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
            student.fullName?.toLowerCase().includes(query) ||
            String(student.idNum ?? '').toLowerCase().includes(query) ||
            student.username?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query)
        );
    });

    {/* --- Multi-select + batch actions ---
         Checkboxes in the table feed this hook; `filteredStudents` drives the
         header "select all" (so it only ever ticks what's on screen), while
         the full `students` array keeps a row selected if a search
         temporarily hides it. */}
    const selection = useRowSelection(filteredStudents, students, (student) => student.id);
    const [isBatchRunning, setIsBatchRunning] = useState(false);

    function selectionPreview(items) {
        const shown = items.slice(0, 8).map((s) => `${s.idNum} — ${s.fullName}`);
        if (items.length > shown.length) shown.push(`…and ${items.length - shown.length} more`);
        return shown;
    }

    async function runBatchAction({ title, message, confirmLabel, danger, pastTense, action }) {
        const targets = selection.selectedItems;
        if (targets.length === 0) return;

        const ok = await confirm({
            title,
            message,
            details: selectionPreview(targets),
            confirmLabel,
            danger,
        });
        if (!ok) return;

        setIsBatchRunning(true);
        const failures = [];
        for (const student of targets) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await action(student);
            } catch (err) {
                failures.push(`${student.fullName}: ${err.message}`);
            }
        }
        setIsBatchRunning(false);
        selection.clear();
        await loadData();

        if (failures.length > 0) {
            alert(`${targets.length - failures.length} of ${targets.length} ${pastTense}.\n\nFailed:\n${failures.join('\n')}`);
        }
    }

    function batchDeleteStudents() {
        const count = selection.selectedCount;
        return runBatchAction({
            title: 'Delete selected students',
            message: `Permanently delete ${count} selected student${count === 1 ? '' : 's'}? This also deletes their logins and can't be undone.`,
            confirmLabel: `Delete ${count} student${count === 1 ? '' : 's'}`,
            danger: true,
            pastTense: 'deleted',
            action: (student) => deleteStudentRequest(student.accountId),
        });
    }

    function batchSetActive(nextActive) {
        const count = selection.selectedCount;
        return runBatchAction({
            title: nextActive ? 'Restore selected students' : 'Archive selected students',
            message: nextActive
                ? `Set ${count} selected account${count === 1 ? '' : 's'} back to active? They'll be able to sign in again.`
                : `Archive ${count} selected account${count === 1 ? '' : 's'}? This sets their status to inactive — the records stay, but they can't sign in.`,
            confirmLabel: nextActive ? 'Restore accounts' : 'Archive accounts',
            danger: !nextActive,
            pastTense: nextActive ? 'restored' : 'archived',
            action: (student) => setStudentActive(student.accountId, nextActive),
        });
    }

    {/* --- Batch Import Logic ---
         One student per line, comma-separated:
         ID Number, First Name, Last Name[, Username]
         Username defaults to the ID Number if left out.
         Every row gets its own auto-generated temporary password. */}
    function openBatchModal() {
        setBatchText('');
        setBatchError('');
        setBatchIssues([]);
        setBatchProgress(null);
        setBatchResult(null);
        setIsBatchModalOpen(true);
    }

    function closeBatchModal() {
        if (isImporting) return; // don't let the modal close mid-import
        setIsBatchModalOpen(false);
        setBatchText('');
        setBatchError('');
        setBatchIssues([]);
        setBatchProgress(null);
        setBatchResult(null);
    }

    async function handleBatchSubmit(event) {
        event.preventDefault();
        if (isImporting) return; // guards against a double-submit creating everyone twice

        setBatchError('');
        setBatchIssues([]);
        setBatchResult(null);

        if (!mySection) {
            setBatchError("You don't have a section assigned yet — contact your administrator before adding students.");
            return;
        }

        const { rows, errors } = parseStudentBatch(batchText, {
            existingStudents: students,
            password: DEFAULT_TEMP_PASSWORD,
            sectionId: mySection.section_id,
        });

        if (errors.length > 0) {
            setBatchError(`Fix ${errors.length} line${errors.length === 1 ? '' : 's'} before importing — nothing has been saved yet.`);
            setBatchIssues(errors);
            return;
        }
        if (rows.length === 0) {
            setBatchError('Add at least one student line before importing.');
            return;
        }

        setIsImporting(true);
        setBatchProgress({ done: 0, total: rows.length });

        const { succeeded, failed } = await runStudentBatch(rows, createStudent, setBatchProgress);

        setIsImporting(false);
        setBatchProgress(null);
        await loadData();

        if (failed.length === 0) {
            closeBatchModal();
            return;
        }

        // Partial failure: keep ONLY the rows that didn't make it in the box,
        // so pressing Import again retries those instead of duplicating the
        // students that were already created.
        setBatchText(failed.map((f) => f.row.rawLine).join('\n'));
        setBatchResult({ imported: succeeded.length, total: rows.length });
        setBatchError(`${succeeded.length} of ${rows.length} imported. The ${failed.length} line${failed.length === 1 ? '' : 's'} below still need${failed.length === 1 ? 's' : ''} attention.`);
        setBatchIssues(failed.map((f) => `Line ${f.row.lineNo} (${f.row.firstName} ${f.row.lastName}): ${f.message}`));
    }

    return (
        <>
            <div className="layout-container">
                {isSidebarOpen && (
                    <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                )}

                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                    <div className="sidebar-header">
                        <span className="brand-mark small">IN_SEC<span className="cursor">_</span></span>
                    </div>
                    <nav className="sidebar-nav">
                        <a href="/admin-dashboard" className="nav-item">
                            <img src={appsIcon} alt="Dashboard Icon" className="nav-icon" /> Dashboard
                        </a>
                        <a href="/student-account-management" className="nav-item active">
                            <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" /> Student Account Management
                        </a>
                        <a href="/game-management" className="nav-item">
                            <img src={consoleControllerIcon} alt="Game Icon" className="nav-icon" /> Game Management
                        </a>
                        <a href="/student-game-progress" className="nav-item">
                            <img src={chartHistogramIcon} alt="Progress Icon" className="nav-icon" /> Student Game Progress
                        </a>
                        <a href="/student-assessment" className="nav-item">
                            <img src={assessmentIcon} alt="Assessment Icon" className="nav-icon" /> Student Assessment
                        </a>
                    </nav>
                    <div className="sidebar-footer">
                        <div className="admin-avatar">{currentTeacher?.initials || 'A'}</div>
                        <div className="admin-info">
                            <strong>{currentTeacher?.name || 'Admin'}</strong><span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Student Account Management</h1>

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

                                <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                                    <button className="dropdown-item text-red" onClick={handleLogout}>
                                        <img src={leaveIcon} alt="Logout" className="topbar-icon" /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="page-body">
                        <div style={{ marginBottom: '25px' }}>
                            <h2 className="page-title-large">Section Class List | {mySection?.section_name || (mySections.length === 0 ? 'No Section Assigned' : 'Select a Section')}</h2>
                            <p className="text-gray" style={{ marginTop: '5px' }}>Students for the S.Y - {mySection?.academic_year || '—'}</p>
                        </div>

                        {/* STUDENT ACCOUNTS TABLE
                             Merged personal info + login credentials into one
                             table/modal — a "student account" is both of these
                             together, so splitting them into two cards just
                             duplicated the ID/Name columns for no reason. */}
                        <div className="data-card">
                            <div className="card-header-row">
                                <h3 className="panel-heading" style={{ fontSize: '20px' }}>Student Accounts</h3>
                                <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <button className="btn-cancel" onClick={openBatchModal}>Batch Import</button>
                                    <button className="btn-cancel" onClick={downloadClassListCSV} disabled={filteredStudents.length === 0}>Download Class List</button>
                                    <button className="btn-modal-submit" onClick={() => openInsertModal()}>+ Create New Student</button>
                                </div>
                            </div>
                            <div className="filter-bar">
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
                                </div>
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        className="form-input search-input rounded-input"
                                        placeholder="Search by Name or ID"
                                        style={{ borderRadius: '20px' }}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* SELECTION TOOLBAR — only appears once at least one
                                 row is ticked, so the table looks unchanged
                                 until multi-select is actually being used. */}
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
                                        <button type="button" className="btn-danger" onClick={batchDeleteStudents} disabled={isBatchRunning}>
                                            🗑 Delete Selected
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="table-responsive">
                                <table className="data-table styled-table text-center-table" style={{ marginTop: '10px' }}>
                                    <thead>
                                        <tr>
                                            <th className="checkbox-cell">
                                                <SelectAllCheckbox
                                                    checked={selection.allVisibleSelected}
                                                    indeterminate={selection.someVisibleSelected}
                                                    onChange={selection.toggleAll}
                                                    disabled={isBatchRunning || filteredStudents.length === 0}
                                                />
                                            </th>
                                            <th>ID Number</th><th>Name</th><th>Email Address</th><th>Status</th><th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingStudents && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading students…</td></tr>
                                        )}
                                        {!isLoadingStudents && loadError && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>{loadError}</td></tr>
                                        )}
                                        {!isLoadingStudents && !loadError && students.length === 0 && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No students yet.</td></tr>
                                        )}
                                        {!isLoadingStudents && !loadError && students.length > 0 && filteredStudents.length === 0 && (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No students match your search.</td></tr>
                                        )}
                                        {!isLoadingStudents && !loadError && filteredStudents.map(student => (
                                            <tr key={student.id} className={selection.isSelected(student) ? 'row-selected' : ''}>
                                                <td className="checkbox-cell">
                                                    <input
                                                        type="checkbox"
                                                        className="row-checkbox"
                                                        checked={selection.isSelected(student)}
                                                        onChange={(e) => selection.toggleRow(student, e.nativeEvent)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        disabled={isBatchRunning}
                                                        aria-label={`Select ${student.fullName}`}
                                                    />
                                                </td>
                                                <td>{student.idNum}</td>
                                                <td>{student.fullName}</td>
                                                <td>{student.email || buildEmailPreview(student.firstName, student.lastName)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={`status-pill status-pill-btn ${student.isActive ? 'active' : 'inactive'}`}
                                                        onClick={() => toggleStudentStatus(student)}
                                                        disabled={togglingStatusId === student.id}
                                                        title={`Click to mark as ${student.isActive ? 'Inactive' : 'Active'}`}
                                                    >
                                                        <span className="dot"></span>{student.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <RowActionsMenu
                                                            actions={[
                                                                { key: 'copy', label: 'Copy ID', icon: '📋', onClick: () => copyStudentId(student) },
                                                                { key: 'edit', label: 'View / Edit', icon: '✎', onClick: () => openInsertModal(student) },
                                                                { key: 'reset', label: 'Reset Password', icon: '↻', onClick: () => handlePasswordReset(student) },
                                                                { key: 'delete', label: 'Delete', icon: '🗑', danger: true, onClick: () => handleDeleteStudent(student) },
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
                                {selection.selectedCount} of {filteredStudents.length} row(s) selected.
                            </div>
                        </div>
                    </main>
                </div>

                {/* ADD / EDIT STUDENT ACCOUNT MODAL
                     Combines personal details and login credentials in one form.
                     Password is auto-generated, never typed by the admin —
                     the student changes it in-game on first login. */}
                {isInsertModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box" style={{ maxWidth: '820px' }}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{editingStudent ? "Edit Student Account" : "Add New Student Account"}</h2>
                                    <p className="modal-subtitle">{editingStudent ? 'Update student details. Use Reset Password in the row menu to set the password back to the default.' : 'Enter student details below. A temporary password is used for first sign-in only.'}</p>
                                </div>
                                <button className="modal-close-btn" onClick={closeInsertModal}>✕</button>
                            </div>
                            <form onSubmit={handleInsertStudent}>
                                <div className="modal-body">
                                    <div className="modal-two-col">

                                        {/* LEFT COLUMN — personal info */}
                                        <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="section-divider"><span className="divider-text">Personal Information</span></div>
                                            <div className="modal-row-4">
                                                <div className="field-group">
                                                    <label className="field-label">First Name</label>
                                                    <input type="text" name="firstName" defaultValue={editingStudent?.firstName} className="modal-input" required onChange={(e) => setPreviewFirstName(e.target.value)} />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Last Name</label>
                                                    <input type="text" name="lastName" defaultValue={editingStudent?.lastName} className="modal-input" required onChange={(e) => setPreviewLastName(e.target.value)} />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">M.I.</label>
                                                    <input type="text" name="mi" defaultValue={editingStudent?.mi} className="modal-input text-center" />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Suffix</label>
                                                    <input type="text" name="suffix" defaultValue={editingStudent?.suffix} className="modal-input text-center" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN — ID + login credentials */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="field-group">
                                                <label className="field-label">Student ID Number</label>
                                                <input type="text" name="studentNum" defaultValue={editingStudent?.idNum} className="modal-input" required />
                                            </div>
                                            <div className="field-group">
                                                <label className="field-label">Section</label>
                                                <input type="text" className="modal-input" value={mySection?.section_name ?? 'No section assigned'} disabled />
                                            </div>
                                            <div className="section-divider"><span className="divider-text">Login Credentials</span></div>
                                            <div className="field-group">
                                                <label className="field-label">Email</label>
                                                <input type="text" className="modal-input" value={buildEmailPreview(previewFirstName, previewLastName) || '—'} disabled />
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Generated automatically from the student's name.</span>
                                            </div>
                                            <div className="field-group">
                                                <label className="field-label">Username</label>
                                                <input type="text" name="username" defaultValue={editingStudent?.username} className="modal-input" required />
                                            </div>
                                            {!editingStudent && <div className="field-group">
                                                <label className="field-label">Temporary Password</label>
                                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type={showModalPassword ? "text" : "password"}
                                                        value={modalTempPassword}
                                                        onChange={(e) => setModalTempPassword(e.target.value)}
                                                        className="modal-input"
                                                        style={{ paddingRight: '60px', width: '100%', fontFamily: 'monospace' }}
                                                        required
                                                    />
                                                    <button type="button" onClick={() => setShowModalPassword(!showModalPassword)} title={showModalPassword ? "Hide password" : "Show password"} style={{ position: 'absolute', right: '34px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0, display: 'flex' }}>
                                                        {showModalPassword ? eyeClosedSVG : eyeOpenSVG}
                                                    </button>
                                                    <button type="button" onClick={() => setModalTempPassword(DEFAULT_TEMP_PASSWORD)} title="Restore temporary password" style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0, display: 'flex' }}>
                                                            {refreshSVG}
                                                        </button>
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    Set a temporary password for first sign-in. To change it later, use the Reset Password action, which sets it back to this default.
                                                </span>
                                            </div>}
                                        </div>

                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeInsertModal} disabled={isSaving}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit" disabled={isSaving}>
                                        {isSaving ? "Saving…" : (editingStudent ? "Update Account" : "Save Account")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* BATCH IMPORT MODAL
                     Add many students at once instead of one-by-one. Each row
                     gets its own auto-generated temporary password, same as
                     the single-add flow — nothing is typed in by the admin. */}
                {isBatchModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box" style={{ maxWidth: '700px' }}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">📤 Batch Import Students</h2>
                                    <p className="modal-subtitle">Paste multiple students at once — one per line.</p>
                                </div>
                                <button className="modal-close-btn" onClick={closeBatchModal}>✕</button>
                            </div>
                            <form onSubmit={handleBatchSubmit}>
                                <div className="modal-body">
                                    <div className="field-group">
                                        <label className="field-label" style={{ marginBottom: '6px' }}>Line format</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-light)', border: '1px solid var(--border-color)', marginBottom: '4px' }}>
                                            {['ID Number', 'First Name', 'Last Name'].map((col) => (
                                                <span key={col} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: 'var(--primary-teal)', color: '#fff' }}>
                                                    {col}
                                                </span>
                                            ))}
                                            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: '1px dashed var(--text-gray)', color: 'var(--text-gray)' }}>
                                                Username (optional)
                                            </span>
                                        </div>
                                        <textarea
                                            className="modal-input"
                                            rows={9}
                                            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                                            placeholder={"02000123456, Juan, Dela Cruz\n02000123457, Maria, Santos"}
                                            value={batchText}
                                            onChange={(e) => { setBatchText(e.target.value); setBatchError(''); setBatchIssues([]); }}
                                            disabled={isImporting}
                                        />
                                        {batchError && (
                                            <span style={{ fontSize: '13px', color: batchResult ? '#b45309' : '#dc2626' }}>{batchError}</span>
                                        )}
                                        {batchIssues.length > 0 && (
                                            <ul className="batch-issues">
                                                {batchIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                                            </ul>
                                        )}
                                        {batchProgress && (
                                            <div className="batch-progress">
                                                <div className="batch-progress-bar">
                                                    <div style={{ width: `${Math.round((batchProgress.done / Math.max(batchProgress.total, 1)) * 100)}%` }} />
                                                </div>
                                                <span>Importing {batchProgress.done} of {batchProgress.total}…</span>
                                            </div>
                                        )}
                                        <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--text-gray)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <li>Commas or tabs both work — paste straight from a spreadsheet.</li>
                                            <li>Wrap any value containing a comma in "quotes".</li>
                                            <li>Username defaults to the ID Number when left out.</li>
                                            <li>Every new student gets the temporary password <code style={{ background: 'var(--bg-light)', padding: '1px 6px', borderRadius: '4px' }}>{DEFAULT_TEMP_PASSWORD}</code>, and a login email generated automatically from their name.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeBatchModal} disabled={isImporting}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit" disabled={isImporting || !batchText.trim()}>
                                        {isImporting ? 'Importing…' : 'Import Students'}
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

export default StudentAccountManagement;