import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './global-styleSA.css';

import chalkboardUserIcon from './assets/chalkboard-user.png';
import graduationCapIcon from './assets/graduation-cap.png';
import bellIcon from './assets/bell.png';
import leaveIcon from './assets/leave.png';

function TeacherAccountManagement() {
    const [editingId, setEditingId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [showModalPassword, setShowModalPassword] = useState(false);
    
    const [teachers, setTeachers] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '',
        section: '',
        username: '',
        password: 'TempPass123!'
    });

    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function handleLogout() { navigate('/sign-in-page'); }

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
            setFormData({ name: '', section: '', username: '', password: 'TempPass123!' });
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

    function saveTeacher() {
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
        if(window.confirm("Are you sure you want to remove this teacher?")) {
            setTeachers(teachers.filter(t => t.id !== id));
        }
    }

    return (
        <>
            <div className="super-admin">
                <div className="layout-container">

                    {isSidebarOpen && (
                        <div className="sidebar-overlay show-overlay" id="sidebarOverlay" onClick={toggleSidebar}></div>
                    )}

                    <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`} id="mobileSidebar">
                        <div className="sidebar-header"></div>

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

                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <div className="user-profile" onClick={toggleDropdown}>
                                    <img src={bellIcon} alt="Notification" className="topbar-icon" />
                                    <span className="user-name">Sample Sample</span>
                                    <span className="dropdown-icon">▼</span>
                                </div>

                                <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} id="profileDropdown">
                                    <button className="dropdown-item text-red" onClick={handleLogout}>
                                        <img src={leaveIcon} alt="Logout" className="topbar-icon" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </header>

                        <main className="page-body full-white-bg">

                            <div className="header-actions-row">
                                <h1 className="page-title-large">Teacher Account Management</h1>
                                <button className="btn btn-primary" onClick={() => openAdminModal('add')}>
                                    <span className="icon" style={{ fontSize: '14px' }}>+</span> Add Teacher
                                </button>
                            </div>

                            <div className="filter-bar">
                                <div className="search-box full-width">
                                    <span className="search-icon">🔍</span>
                                    <input type="text" className="form-input search-input" placeholder="Search by name, email or ID..." />
                                </div>
                                <div className="filter-actions">
                                    <select className="form-input" style={{ minWidth: '150px' }}>
                                        <option>Any Status</option>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                        <option>On Leave</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="styled-table perfect-lines" id="teacherTable">
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

                        </main>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="admin-modal-overlay show" id="teacherModal">
                        <div className="admin-modal-box">
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title" id="modalTitle">
                                    {modalMode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
                                </h2>
                            </div>
                            <div className="admin-modal-body">
                                <fieldset className="admin-fieldset">
                                    <legend className="admin-legend"><span className="admin-legend-icon">🪪</span> Identity Details</legend>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="admin-input" placeholder="e.g. Jonathan Doe" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Assign Section</label>
                                        <input type="text" name="section" value={formData.section} onChange={handleInputChange} className="admin-input" placeholder="e.g. SC01, SC02" />
                                    </div>
                                </fieldset>

                                <fieldset className="admin-fieldset">
                                    <legend className="admin-legend"><span className="admin-legend-icon">🔒</span> Access Credentials</legend>
                                    <div className="admin-flex-row">
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Username</label>
                                            <div className="admin-input-wrapper">
                                                <span className="admin-input-icon">@</span>
                                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="admin-input with-icon" placeholder="username" />
                                            </div>
                                        </div>
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Temporary Password</label>
                                            <div className="admin-input-wrapper">
                                                <span className="admin-input-icon">🔑</span>
                                                <input type={showModalPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} className="admin-input with-icon" placeholder="••••••••" />
                                                <span className="admin-input-eye" onClick={toggleModalPassword}>👁</span>
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                            <div className="admin-modal-footer">
                                <button className="btn-ghost" onClick={closeAdminModal}>Cancel</button>
                                <button className="btn-solid" id="saveTeacherBtn" onClick={saveTeacher}>
                                    {modalMode === 'add' ? 'Add Teacher' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default TeacherAccountManagement;