import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Style/global-styleSA.css';

import chalkboardUserIcon from '../assets/chalkboard-user.png';
import graduationCapIcon from '../assets/graduation-cap.png';
import bellIcon from '../assets/bell.png';
import leaveIcon from '../assets/leave.png';

function TeacherAccountManagement() {
    const [editingId, setEditingId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [showModalPassword, setShowModalPassword] = useState(false);

    const [teachers, setTeachers] = useState([]);

    {/* Fixed default temp password (same one used across the app) —
         not randomized. Admin can edit it per-teacher before saving. */}
    const DEFAULT_TEMP_PASSWORD = 'TempPass123!';

    const [formData, setFormData] = useState({
        name: '',
        section: '',
        username: '',
        password: DEFAULT_TEMP_PASSWORD
    });

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

    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function handleLogout() { navigate('/sign-in-page'); }

    // Handles the notification bell — separate from the profile dropdown
    // TODO: replace with a real notifications panel/list
    function handleNotificationClick() {
        alert("No new notifications");
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleInputChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function toggleModalPassword() {
        setShowModalPassword(!showModalPassword);
    }

    function toggleRowPassword(id) {
        setTeachers(teachers.map(t =>
            t.id === id ? { ...t, showPassword: !t.showPassword } : t
        ));
    }

    function openAdminModal(mode, teacher = null) {
        setModalMode(mode);
        setShowModalPassword(false);

        if (mode === 'add') {
            setFormData({ name: '', section: '', username: '', password: DEFAULT_TEMP_PASSWORD });
            setEditingId(null);
        } else if (mode === 'edit' && teacher) {
            setFormData({
                name: teacher.name,
                section: teacher.section,
                username: teacher.username,
                password: teacher.password
            });
            setEditingId(teacher.id);
        }
        setIsModalOpen(true);
    }

    function closeAdminModal() {
        setIsModalOpen(false);
    }

    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    function saveTeacher(event) {
        event.preventDefault();
        const { name, section, username, password } = formData;

        if (!name || !username || !password) {
            alert("Please fill in the required fields including the password.");
            return;
        }

        const initials = getInitials(name);
        const email = username.toLowerCase() + "@edumanage.edu";

        if (modalMode === 'edit') {
            setTeachers(teachers.map(t =>
                t.id === editingId
                    ? { ...t, name, section, username, password, initials, email }
                    : t
            ));
        } else {
            const randomId = "#TCH-" + Math.floor(1000 + Math.random() * 9000);

            const newTeacher = {
                id: randomId,
                name,
                section,
                username,
                password,
                initials,
                email,
                status: 'Active',
                showPassword: false
            };
            setTeachers([...teachers, newTeacher]);
        }
        closeAdminModal();
    }

    function deleteTeacher(id) {
        if (window.confirm("Are you sure you want to remove this teacher?")) {
            setTeachers(teachers.filter(t => t.id !== id));
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
                            <a href="/teacher-account-management" className="nav-item active">
                                <img src={chalkboardUserIcon} alt="Teacher Icon" className="nav-icon" />
                                Teacher Account Management
                            </a>
                            <a href="/student-account-management-sa" className="nav-item">
                                <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" />
                                Student Account Management
                            </a>
                        </nav>

                        <div className="sidebar-footer">
                            <div className="admin-avatar">S</div>
                            <div className="admin-info">
                                <strong>Sample (Name)</strong>
                                <span>Super Admin</span>
                            </div>
                        </div>
                    </aside>

                    <div className="main-content">
                        <header className="topbar">
                            <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
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
                                        <select className="form-input rounded-input">
                                            <option>Any Status</option>
                                            <option>Active</option>
                                            <option>Inactive</option>
                                            <option>On Leave</option>
                                        </select>
                                    </div>
                                    <div className="search-box">
                                        <span className="search-icon">🔍</span>
                                        <input type="text" className="form-input search-input rounded-input" placeholder="Search by name, email, or ID" style={{ borderRadius: '20px' }} />
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="styled-table" style={{ marginTop: '10px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '20px' }}>TEACHER INFO</th>
                                                <th>EMPLOYEE ID</th>
                                                <th>SECTION ASSIGNED</th>
                                                <th>ACCOUNT INFO</th>
                                                <th>STATUS</th>
                                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teachers.map((teacher) => (
                                                <tr key={teacher.id}>
                                                    <td style={{ paddingLeft: '20px' }}>
                                                        <div className="user-info-cell">
                                                            <div className="avatar bg-teal-light">{teacher.initials}</div>
                                                            <div className="user-details">
                                                                <strong style={{ color: '#000' }}>{teacher.name}</strong>
                                                                <span>{teacher.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-gray">{teacher.id}</td>
                                                    <td><span style={{ fontWeight: 600, color: '#333' }}>{teacher.section}</span></td>
                                                    <td>
                                                        <div className="account-details">
                                                            <div className="acc-line"><span style={{ color: '#777' }}>👤</span> {teacher.username}</div>
                                                            <div className="acc-line text-gray">
                                                                <span style={{ color: '#e6a838' }}>🔒</span>
                                                                <span className="pwd-text">{teacher.showPassword ? teacher.password : "••••••••"}</span>
                                                                <span className="eye-icon" onClick={() => toggleRowPassword(teacher.id)}>👁</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><span className="status-pill active"><span className="dot"></span> Active</span></td>
                                                    <td style={{ paddingRight: '20px' }}>
                                                        <div className="action-cells">
                                                            <button className="icon-btn" title="Edit" onClick={() => openAdminModal('edit', teacher)}>✎</button>
                                                            <button className="icon-btn trash" title="Delete" onClick={() => deleteTeacher(teacher.id)}>🗑</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="pagination-footer">
                                    <span className="showing-text">Showing {teachers.length} of {teachers.length} teachers</span>
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
                                    <p className="modal-subtitle">Enter teacher details below. A default temporary password is filled in — edit it if needed.</p>
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
                                        <label className="field-label">Assign Section</label>
                                        <input type="text" name="section" value={formData.section} onChange={handleInputChange} className="modal-input" placeholder="e.g. SC01, SC02" />
                                    </div>

                                    <div className="section-divider"><span className="divider-text">Access Credentials</span></div>
                                    <div className="modal-row-2">
                                        <div className="field-group">
                                            <label className="field-label">Username</label>
                                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="modal-input" placeholder="username" required />
                                        </div>
                                        <div className="field-group">
                                            <label className="field-label">Temporary Password</label>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type={showModalPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="modal-input"
                                                    style={{ paddingRight: '60px', fontFamily: 'monospace' }}
                                                    required
                                                />
                                                <span onClick={toggleModalPassword} title={showModalPassword ? "Hide password" : "Show password"} style={{ position: 'absolute', right: '34px', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
                                                    {showModalPassword ? eyeClosedSVG : eyeOpenSVG}
                                                </span>
                                                <button type="button" onClick={() => setFormData({ ...formData, password: DEFAULT_TEMP_PASSWORD })} title="Reset to default password" style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', outline: 'none', padding: 0, display: 'flex' }}>
                                                    {refreshSVG}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Defaults to "{DEFAULT_TEMP_PASSWORD}" — edit it if you'd like to set a different one.</span>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={closeAdminModal}>Cancel</button>
                                    <button type="submit" className="btn-modal-submit">{modalMode === 'add' ? "Add Teacher" : "Save Changes"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default TeacherAccountManagement;