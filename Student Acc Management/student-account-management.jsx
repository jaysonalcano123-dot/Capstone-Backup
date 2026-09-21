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

    {/* Edit State */}
    const [editingStudent, setEditingStudent] = useState(null);

    {/* Temp password shown in the Add/Edit modal — editable, defaults to
         a fixed value rather than being randomized (see DEFAULT_TEMP_PASSWORD). */}
    const [modalTempPassword, setModalTempPassword] = useState('');

    {/* Whether the modal's password field shows plain text or dots */}
    const [showModalPassword, setShowModalPassword] = useState(false);

    {/* Batch import textarea + any parse errors to show the admin */}
    const [batchText, setBatchText] = useState('');
    const [batchError, setBatchError] = useState('');

    const dropdownRef = useRef(null);

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Sample Sample";
    const navigate = useNavigate();

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
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }

    // Handles the notification bell — separate from the profile dropdown
    // TODO: replace with a real notifications panel/list
    function handleNotificationClick() {
        alert("No new notifications");
    }
    function handleLogout() { navigate('/sign-in-page'); }

    {/* --- Temporary password ---
         Students set their real password in-game on first login; this is
         just the starter credential the admin hands out. It's a fixed
         default (same one used across the app, e.g. Teacher Account
         Management) rather than randomized, so it's predictable and easy
         to communicate to students. Admins can still edit it per-student
         in the modal below before saving. */}
    const DEFAULT_TEMP_PASSWORD = 'TempPass123!';

    {/* --- Student Account Logic (personal info + login credentials together) --- */}
    function openInsertModal(student = null) {
        setEditingStudent(student);
        setModalTempPassword(student ? student.password : DEFAULT_TEMP_PASSWORD);
        setShowModalPassword(false);
        setIsInsertModalOpen(true);
    }

    function closeInsertModal() {
        setIsInsertModalOpen(false);
        setEditingStudent(null);
        setModalTempPassword('');
    }

    function handleInsertStudent(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newStudent = {
            idNum: formData.get('studentNum'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            mi: formData.get('mi'),
            suffix: formData.get('suffix'),
            fullName: `${formData.get('lastName')}, ${formData.get('firstName')}`,
            address: formData.get('address'),
            contact: formData.get('contact'),
            gender: formData.get('gender'),
            username: formData.get('username'),
            password: modalTempPassword,
            showPassword: editingStudent ? editingStudent.showPassword : false,
            id: editingStudent ? editingStudent.id : Date.now()
        };

        if (editingStudent) {
            setStudents(students.map(s => s.id === editingStudent.id ? newStudent : s));
        } else {
            setStudents([newStudent, ...students]);
        }
        closeInsertModal();
    }

    function deleteStudent(id) {
        setStudents(students.filter(s => s.id !== id));
    }

    function toggleRowPassword(id) {
        setStudents(students.map(s => s.id === id ? { ...s, showPassword: !s.showPassword } : s));
    }

    {/* --- Batch Import Logic ---
         One student per line, comma-separated:
         ID Number, First Name, Last Name, Address, Contact Number, Gender[, Username]
         Username defaults to the ID Number if left out.
         Every row gets its own auto-generated temporary password. */}
    function openBatchModal() {
        setBatchText('');
        setBatchError('');
        setIsBatchModalOpen(true);
    }

    function closeBatchModal() {
        setIsBatchModalOpen(false);
        setBatchText('');
        setBatchError('');
    }

    function handleBatchSubmit(event) {
        event.preventDefault();
        const lines = batchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length === 0) {
            setBatchError('Add at least one student line before importing.');
            return;
        }

        const newStudents = [];
        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length < 6) {
                setBatchError(`Line ${i + 1} is missing fields — expected at least ID, First Name, Last Name, Address, Contact Number, Gender.`);
                return;
            }
            const [idNum, firstName, lastName, address, contact, gender, username] = parts;
            newStudents.push({
                idNum,
                firstName,
                lastName,
                mi: '',
                suffix: '',
                fullName: `${lastName}, ${firstName}`,
                address,
                contact,
                gender,
                username: username || idNum,
                password: DEFAULT_TEMP_PASSWORD,
                showPassword: false,
                id: Date.now() + i
            });
        }

        setStudents([...newStudents, ...students]);
        closeBatchModal();
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
                        <div className="admin-avatar">A</div>
                        <div className="admin-info">
                            <strong>Admin (Name)</strong><span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Student Account Management</h1>

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

                    <main className="page-body">
                        <div style={{ marginBottom: '25px' }}>
                            <h2 className="page-title-large">Section Class List | BSIT</h2>
                            <p className="text-gray" style={{ marginTop: '5px' }}>Students for the S.Y - 2025-2026 | 1st Semester</p>
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
                                    <button className="btn-cancel" onClick={() => {}}>Download Class List</button>
                                    <button className="btn-modal-submit" onClick={() => openInsertModal()}>+ Create New Student</button>
                                </div>
                            </div>
                            <div className="filter-bar">
                                <div className="filter-group">
                                    <label>Section:</label>
                                    <select className="form-input rounded-input"><option>BT101</option></select>
                                </div>
                                <div className="filter-group" style={{ marginLeft: '15px' }}>
                                    <label>Chapter:</label>
                                    <select className="form-input rounded-input"><option>CH01</option></select>
                                </div>
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input type="text" className="form-input search-input rounded-input" placeholder="Search by Name or ID" style={{ borderRadius: '20px' }} />
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="data-table styled-table text-center-table" style={{ marginTop: '10px' }}>
                                    <thead>
                                        <tr>
                                            <th>ID Number</th><th>Name</th><th>Address</th><th>Gender</th><th>Contact Number</th><th>Username</th><th>Password</th><th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.idNum}</td>
                                                <td>{student.fullName}</td>
                                                <td>{student.address}</td>
                                                <td>{student.gender}</td>
                                                <td>{student.contact}</td>
                                                <td>{student.username}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <input type={student.showPassword ? "text" : "password"} className="password-field" value={student.password || ''} readOnly style={{ textAlign: 'center', border: 'none', background: 'transparent', outline: 'none', width: '80px' }} />
                                                        <button className="icon-btn toggle-pwd" onClick={() => toggleRowPassword(student.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {student.showPassword ? eyeClosedSVG : eyeOpenSVG}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-cells center-actions">
                                                        <button className="icon-btn" onClick={() => openInsertModal(student)}>✎</button>
                                                        <button className="icon-btn trash" onClick={() => deleteStudent(student.id)}>🗑</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                    <p className="modal-subtitle">Enter student details below. A temporary password is generated automatically.</p>
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
                                                    <input type="text" name="firstName" defaultValue={editingStudent?.firstName} className="modal-input" required />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Last Name</label>
                                                    <input type="text" name="lastName" defaultValue={editingStudent?.lastName} className="modal-input" required />
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
                                            <div className="field-group">
                                                <label className="field-label">Complete Address</label>
                                                <input type="text" name="address" defaultValue={editingStudent?.address} className="modal-input" required />
                                            </div>
                                            <div className="modal-row-2">
                                                <div className="field-group">
                                                    <label className="field-label">Contact Number</label>
                                                    <input type="text" name="contact" defaultValue={editingStudent?.contact} className="modal-input" required />
                                                </div>
                                                <div className="field-group">
                                                    <label className="field-label">Gender</label>
                                                    <select name="gender" className="modal-input" required defaultValue={editingStudent?.gender || ""}>
                                                        <option value="" disabled>Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN — ID + login credentials */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div className="field-group">
                                                <label className="field-label">Student ID Number</label>
                                                <input type="text" name="studentNum" defaultValue={editingStudent?.idNum} className="modal-input" required />
                                            </div>
                                            <div className="section-divider"><span className="divider-text">Login Credentials</span></div>
                                            <div className="field-group">
                                                <label className="field-label">Username</label>
                                                <input type="text" name="username" defaultValue={editingStudent?.username} className="modal-input" required />
                                            </div>
                                            <div className="field-group">
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
                                                    <button type="button" onClick={() => setModalTempPassword(DEFAULT_TEMP_PASSWORD)} title="Reset to default password" style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0, display: 'flex' }}>
                                                        {refreshSVG}
                                                    </button>
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Defaults to "{DEFAULT_TEMP_PASSWORD}" — edit it if you'd like to set a different one. The student can change it in-game after logging in.</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeInsertModal}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit">{editingStudent ? "Update Account" : "Save Account"}</button>
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
                        <div className="modal-box" style={{ maxWidth: '650px' }}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">Batch Import Students</h2>
                                    <p className="modal-subtitle">Add multiple students at once, one per line.</p>
                                </div>
                                <button className="modal-close-btn" onClick={closeBatchModal}>✕</button>
                            </div>
                            <form onSubmit={handleBatchSubmit}>
                                <div className="modal-body">
                                    <div className="field-group">
                                        <label className="field-label">
                                            Format: ID Number, First Name, Last Name, Address, Contact Number, Gender <span style={{ color: '#6b7280', fontWeight: 400 }}>(Username optional — defaults to ID Number)</span>
                                        </label>
                                        <textarea
                                            className="modal-input"
                                            rows={9}
                                            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                                            placeholder={"02000123456, Juan, Dela Cruz, Quezon City, 09171234567, Male\n02000123457, Maria, Santos, Manila City, 09171234568, Female"}
                                            value={batchText}
                                            onChange={(e) => { setBatchText(e.target.value); setBatchError(''); }}
                                        />
                                        {batchError && (
                                            <span style={{ fontSize: '13px', color: '#dc2626' }}>{batchError}</span>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Every student gets the default temporary password "{DEFAULT_TEMP_PASSWORD}" — edit individual passwords afterward from the Password column if needed.</span>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeBatchModal}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit">Import Students</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default StudentAccountManagement;