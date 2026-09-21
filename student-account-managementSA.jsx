import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './global-styleSA.css';

import chalkboardUserIcon from './assets/chalkboard-user.png';
import graduationCapIcon from './assets/graduation-cap.png';
import bellIcon from './assets/bell.png';
import leaveIcon from './assets/leave.png';

function StudentAccountManagementSA() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
    const [showModalPassword, setShowModalPassword] = useState(false);
    
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    function toggleSidebar() { setIsSidebarOpen(!isSidebarOpen); }
    function toggleDropdown() { setIsDropdownOpen(!isDropdownOpen); }
    function handleLogout() { navigate('/sign-in-page'); }

    // Closes the profile dropdown if the user clicks anywhere OUTSIDE it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function openStudentModal(mode) {
        setIsStudentModalOpen(true);
        setShowModalPassword(false); // always reset to hidden on open
    }

    function closeStudentModal() {
        setIsStudentModalOpen(false);
    }

    function toggleModalPassword() {
        setShowModalPassword(!showModalPassword);
    }

    function saveStudent(e) {
        e.preventDefault();
        closeStudentModal();
    }

    return (
        <>
            <div className="super-admin">
                <div className="layout-container">
                    
                    {/* Left navigation sidebar (same on every Super Admin page) */}
                    <aside className={`sidebar ${isSidebarOpen ? 'show-sidebar' : ''}`}>
                        <div className="sidebar-header"></div>

                        <nav className="sidebar-nav">
                            <a href="/teacher-account-management" className="nav-item">
                                <img src={chalkboardUserIcon} alt="Teacher Icon" className="nav-icon" />
                                Teacher Account Management
                            </a>
                            <a href="/student-account-management-sa" className="nav-item active">
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
                        
                        {/* Top bar: notification bell + profile name + logout dropdown */}
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
                            
                            {/* Page title + top-right action buttons */}
                            <div className="header-actions-row">
                                <h1 className="page-title-large">Student Account Management</h1>
                                <div className="header-actions">
                                    <button className="btn btn-primary">
                                        <span className="icon" style={{ fontSize: '14px' }}>+</span> Insert Record
                                    </button>
                                    <button className="btn btn-primary" onClick={() => openStudentModal('add')}>
                                        <span className="icon" style={{ fontSize: '14px' }}>+</span> Add Student
                                    </button>
                                </div>
                            </div>

                            {/* Search box + section filter dropdown */}
                            <div className="filter-bar">
                                <div className="search-box full-width">
                                    <span className="search-icon">🔍</span>
                                    <input type="text" className="form-input search-input" placeholder="Search by name, ID, or email..." />
                                </div>
                                <div className="filter-actions">
                                    <span className="filter-label">Section:</span>
                                    <select className="form-input">
                                        <option>BT101</option>
                                    </select>
                                    <button className="btn btn-outline-gray">
                                        <span className="icon">≡</span> More Filters
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="styled-table perfect-lines" id="studentTable">
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: '20px' }}>NAME</th>
                                            <th>USERNAME</th>
                                            <th>PASSWORD</th>
                                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination-footer">
                                <span className="showing-text">Showing 0 of 0 students</span>
                                <div className="pagination-controls">
                                    <button className="page-btn">&lt;</button>
                                    <button className="page-btn active">1</button>
                                    <button className="page-btn">&gt;</button>
                                </div>
                            </div>

                        </main>
                    </div>
                </div>

                {/* ADD / EDIT STUDENT MODAL (popup form) */}
                {isStudentModalOpen && (
                    <div className="admin-modal-overlay show" id="studentModal">
                        <div className="admin-modal-box">
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title" id="modalTitle">Add New Student</h2>
                            </div>
                            <div className="admin-modal-body">
                                <fieldset className="admin-fieldset">
                                    <legend className="admin-legend"><span className="admin-legend-icon">🪪</span> Identity Details</legend>
                                    <div className="admin-flex-row">
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Full Name</label>
                                            <input type="text" id="studentName" className="admin-input" placeholder="e.g. Jonathan Doe" />
                                        </div>
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Student ID</label>
                                            <input type="text" id="studentIdNum" className="admin-input" placeholder="STU-2024-001" />
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="admin-fieldset">
                                    <legend className="admin-legend"><span className="admin-legend-icon">🔒</span> Access Credentials</legend>
                                    <div className="admin-flex-row">
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Username</label>
                                            <div className="admin-input-wrapper">
                                                <span className="admin-input-icon">@</span>
                                                <input type="text" id="studentUsername" className="admin-input with-icon" placeholder="username" />
                                            </div>
                                        </div>
                                        <div className="admin-flex-col">
                                            <label className="admin-label">Temporary Password</label>
                                            <div className="admin-input-wrapper">
                                                <span className="admin-input-icon">🔑</span>
                                                <input type={showModalPassword ? "text" : "password"} id="studentPassword" className="admin-input with-icon" placeholder="••••••••" defaultValue="TempPass123!" />
                                                <span className="admin-input-eye" onClick={toggleModalPassword}>👁</span>
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                            <div className="admin-modal-footer">
                                <button className="btn-ghost" onClick={closeStudentModal}>Cancel</button>
                                <button className="btn-solid" id="saveStudentBtn" onClick={saveStudent}>Add Student</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default StudentAccountManagementSA;