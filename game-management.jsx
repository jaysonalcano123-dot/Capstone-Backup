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

function StudentAccountManagement() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [showModalPassword, setShowModalPassword] = useState(false);

    const [students, setStudents] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [editingStudent, setEditingStudent] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const eyeOpenSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    );
    const eyeClosedSVG = (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
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
    function handleLogout() { navigate('/sign-in-page'); }

    function openInsertModal(student = null) {
        setEditingStudent(student);
        setIsInsertModalOpen(true);
    }

    function closeInsertModal() {
        setIsInsertModalOpen(false);
        setEditingStudent(null);
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

    function openAccountModal(account = null) {
        setEditingAccount(account);
        setIsAccountModalOpen(true);
        setShowModalPassword(false);
    }

    function closeAccountModal() {
        setIsAccountModalOpen(false);
        setEditingAccount(null);
    }

    function handleCreateAccount(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newAccount = {
            idNum: formData.get('accStudentNum'),
            name: formData.get('accStudentName'),
            username: formData.get('accUsername'),
            password: formData.get('accPassword'),
            showPassword: false,
            id: editingAccount ? editingAccount.id : Date.now()
        };

        if (editingAccount) {
            setAccounts(accounts.map(a => a.id === editingAccount.id ? newAccount : a));
        } else {
            setAccounts([newAccount, ...accounts]);
        }
        closeAccountModal();
    }

    function deleteAccount(id) {
        setAccounts(accounts.filter(a => a.id !== id));
    }

    function toggleRowPassword(id) {
        setAccounts(accounts.map(a => a.id === id ? { ...a, showPassword: !a.showPassword } : a));
    }

    return (
        <>
            <div className="layout-container">
                {isSidebarOpen && (
                    <div className="sidebar-overlay show-overlay" onClick={toggleSidebar}></div>
                )}
                
                <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                    <div className="sidebar-header"></div>
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

                        <div className="profile-dropdown-container" ref={dropdownRef}>
                            <div className="user-profile" onClick={toggleDropdown}>
                                <img src={bellIcon} alt="Notification" className="topbar-icon" />
                                <span className="user-name">Sample Sample</span>
                                <span className="dropdown-icon">▼</span>
                            </div>

                            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                                <button className="dropdown-item text-red" onClick={handleLogout}>
                                    <img src={leaveIcon} alt="Logout" className="topbar-icon" /> Logout
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="page-body">
                        <div style={{ marginBottom: '25px' }}>
                            <h2 className="page-title-large">Section Class List | BSIT</h2>
                            <p className="text-gray" style={{ marginTop: '5px' }}>Students for the S.Y - 2025-2026 | 1st Semester</p>
                        </div>

                        <div className="data-card">
                            <div className="card-header-row">
                                <h3 className="panel-heading" style={{ fontSize: '20px' }}>Student Information</h3>
                                <div className="header-actions">
                                    <button className="btn btn-pill-outline" onClick={() => alert("Excel file upload feature coming soon.")}>Insert Record</button>
                                    <button className="btn btn-pill-outline">Download Class List</button>
                                    <button className="btn btn-pill-outline" onClick={() => openInsertModal()}>Create New Student</button>
                                </div>
                            </div>
                            <div className="filter-bar">
                                <div className="filter-group">
                                    <label>Section:</label>
                                    <select className="form-input rounded-input"><option>SC01</option></select>
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
                                            <th>ID Number</th><th>Name</th><th>Address</th><th>Gender</th><th>Contact Number</th><th>Action</th>
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

                        <div className="data-card">
                            <div className="card-header-row">
                                <h3 className="panel-heading" style={{ fontSize: '20px' }}>Student Login Credentials</h3>
                                <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <button className="btn btn-pill-outline" onClick={() => openAccountModal()}>Create Account</button>
                                    <div className="search-box" style={{ marginLeft: 0 }}>
                                        <span className="search-icon">🔍</span>
                                        <input type="text" className="form-input search-input rounded-input" placeholder="Search by Name or ID" style={{ borderRadius: '20px' }} />
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="data-table styled-table text-center-table">
                                    <thead>
                                        <tr>
                                            <th>ID Number</th><th>Student Name</th><th>Username</th><th>Password</th><th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map(account => (
                                            <tr key={account.id}>
                                                <td>{account.idNum}</td>
                                                <td>{account.name}</td>
                                                <td>{account.username}</td>
                                                <td>
                                                    <input type={account.showPassword ? "text" : "password"} className="password-field" value={account.password} readOnly style={{ textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }} />
                                                </td>
                                                <td>
                                                    <div className="action-cells center-actions">
                                                        <button className="icon-btn" onClick={() => openAccountModal(account)}>✎</button>
                                                        <button className="icon-btn toggle-pwd" onClick={() => toggleRowPassword(account.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {account.showPassword ? eyeClosedSVG : eyeOpenSVG}
                                                        </button>
                                                        <button className="icon-btn trash" onClick={() => deleteAccount(account.id)}>🗑</button>
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

                {isInsertModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box">
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{editingStudent ? "Edit Student" : "Add New Student"}</h2>
                                </div>
                                <button className="modal-close-btn" onClick={closeInsertModal}>✕</button>
                            </div>
                            <form onSubmit={handleInsertStudent}>
                                <div className="modal-body">
                                    <div className="field-group">
                                        <label className="field-label">Student ID Number</label>
                                        <input type="text" name="studentNum" defaultValue={editingStudent?.idNum} className="modal-input" required />
                                    </div>
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
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeInsertModal}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit">{editingStudent ? "Update Record" : "Save Record"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isAccountModalOpen && (
                    <div className="modal-overlay show-modal">
                        <div className="modal-box" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{editingAccount ? "Edit Student Account" : "Create Student Account"}</h2>
                                </div>
                                <button className="modal-close-btn" onClick={closeAccountModal}>✕</button>
                            </div>
                            <form onSubmit={handleCreateAccount}>
                                <div className="modal-body">
                                    <div className="field-group">
                                        <label className="field-label">Student ID Number</label>
                                        <input type="text" name="accStudentNum" defaultValue={editingAccount?.idNum} className="modal-input" required />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Student Name</label>
                                        <input type="text" name="accStudentName" defaultValue={editingAccount?.name} className="modal-input" required />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Username</label>
                                        <input type="text" name="accUsername" defaultValue={editingAccount?.username} className="modal-input" required />
                                    </div>
                                    <div className="field-group">
                                        <label className="field-label">Password</label>
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <input type={showModalPassword ? "text" : "password"} name="accPassword" defaultValue={editingAccount?.password} className="modal-input" required style={{ paddingRight: '35px', width: '100%' }} />
                                            <button type="button" onClick={() => setShowModalPassword(!showModalPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0 }}>
                                                {showModalPassword ? eyeClosedSVG : eyeOpenSVG}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeAccountModal}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit">{editingAccount ? "Update Account" : "Create Account"}</button>
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