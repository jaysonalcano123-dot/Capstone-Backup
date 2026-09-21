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

function GameManagement() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    {/* Which table is showing: "all" quizzes, or "chapter" management */}
    const [activeTab, setActiveTab] = useState('all');

    {/* --- All Quizzes table data --- */}
    const [quizzes, setQuizzes] = useState([
        { id: 1, title: 'History of IT', chapter: 1, features: 'Shuffle', status: 'Completed' },
        { id: 2, title: 'Cybersecurity Basics', chapter: 2, features: 'Shuffle', status: 'Completed' },
    ]);

    {/* --- Chapter Management table data ---
         status can be "Completed", "Active", or "Locked" */}
    const [chapters, setChapters] = useState([
        { id: 1, quizTitle: 'History of IT', chapterNum: 1, status: 'Completed' },
        { id: 2, quizTitle: 'Cybersecurity Basics', chapterNum: 2, status: 'Completed' },
        { id: 3, quizTitle: 'Database Management', chapterNum: 3, status: 'Active' },
        { id: 4, quizTitle: 'Networking Fundamentals', chapterNum: 4, status: 'Locked' },
    ]);

    {/* --- Edit Quiz modal state --- */}
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [editingQuizId, setEditingQuizId] = useState(null);
    const [quizTitleInput, setQuizTitleInput] = useState('');
    const [shuffleOptions, setShuffleOptions] = useState(false);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);

    {/* --- Question builder state (left column of the modal) --- */}
    const [questionText, setQuestionText] = useState('');
    const [optA, setOptA] = useState('');
    const [optB, setOptB] = useState('');
    const [optC, setOptC] = useState('');
    const [optD, setOptD] = useState('');
    const [correctOption, setCorrectOption] = useState('');

    {/* --- Questions preview list (right column of the modal) ---
         NOTE: this is session-only, same as the original HTML/JS version —
         questions added here are shown in the preview table but are NOT
         persisted back onto the quiz row when "Save Changes" is clicked.
         Only the quiz title gets saved. Worth wiring up to the backend
         when quiz data is actually persisted. */}
    const [previewQuestions, setPreviewQuestions] = useState([]);

    const dropdownRef = useRef(null);

    // TODO: replace with the logged-in user's actual name from the backend
    const userName = "Sample Sample";
    const navigate = useNavigate();

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

    {/* --- All Quizzes logic --- */}
    function deleteQuiz(id) {
        setQuizzes(quizzes.filter(q => q.id !== id));
    }

    function openQuizModal(quiz) {
        setEditingQuizId(quiz.id);
        setQuizTitleInput(quiz.title);
        setShuffleOptions(false);
        setShuffleQuestions(false);
        clearQuestionInputs();
        setPreviewQuestions([]);
        setIsQuizModalOpen(true);
    }

    function closeQuizModal() {
        setIsQuizModalOpen(false);
        setEditingQuizId(null);
    }

    function clearQuestionInputs() {
        setQuestionText('');
        setOptA('');
        setOptB('');
        setOptC('');
        setOptD('');
        setCorrectOption('');
    }

    {/* Validates the question builder, then adds a row to the preview
         table on the right. Doesn't touch the actual quiz data. */}
    function insertQuestion() {
        if (!questionText.trim() || !correctOption) {
            alert("Please enter a question and select the correct answer.");
            return;
        }

        const displayQuestion = questionText.length > 30
            ? questionText.substring(0, 30) + '...'
            : questionText;

        setPreviewQuestions([...previewQuestions, {
            id: Date.now(),
            fullText: questionText,
            displayText: displayQuestion,
            correctAnswer: correctOption
        }]);

        clearQuestionInputs();
    }

    function deletePreviewQuestion(id) {
        setPreviewQuestions(previewQuestions.filter(q => q.id !== id));
    }

    {/* "Save Changes" — only updates the quiz title, matching the
         original behavior (question list isn't persisted here). */}
    function saveQuiz() {
        if (editingQuizId && quizTitleInput.trim()) {
            setQuizzes(quizzes.map(q =>
                q.id === editingQuizId ? { ...q, title: quizTitleInput.trim() } : q
            ));
        }
        closeQuizModal();
    }

    {/* --- Chapter Management logic ---
         NOTE: same known quirk as the original — unlocking a chapter
         always sets it to "Active", even if it was "Completed" before
         being locked. Flagging here for whoever wires up persistence. */}
    function toggleChapterLock(id) {
        setChapters(chapters.map(chapter => {
            if (chapter.id !== id) return chapter;
            const isLocked = chapter.status === 'Locked';
            return { ...chapter, status: isLocked ? 'Active' : 'Locked' };
        }));
    }

    function statusClass(status) {
        if (status === 'Completed') return 'status-text text-green';
        if (status === 'Active') return 'status-text text-blue';
        return 'status-text text-red';
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
                        <a href="/student-account-management" className="nav-item">
                            <img src={graduationCapIcon} alt="Student Icon" className="nav-icon" /> Student Account Management
                        </a>
                        <a href="/game-management" className="nav-item active">
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
                        <h1 className="page-title">Game Management</h1>

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

                        {/* Top-level summary stats — hardcoded placeholders,
                             same as the original HTML version */}
                        <div className="stats-card-grid-4">
                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Total Quizzes</span>
                                    <span className="placeholder-icon">[ICON]</span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">10</span>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Completed Chapters</span>
                                    <span className="placeholder-icon">[ICON]</span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">2</span>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Active Chapters</span>
                                    <span className="placeholder-icon">[ICON]</span>
                                </div>
                                <div className="stat-card-body flex-column-center">
                                    <span className="text-sub">[Title]</span>
                                    <strong className="text-medium">Chapter n</strong>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Locked Chapters</span>
                                    <span className="placeholder-icon">[ICON]</span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">5</span>
                                </div>
                            </div>
                        </div>

                        {/* ============================================================
                             QUIZ / CHAPTER MANAGEMENT PANEL
                             ============================================================ */}
                        <div className="bordered-panel">
                            <div className="panel-tabs">
                                <div className="tab-button-group">
                                    <button
                                        className={`btn tab-btn ${activeTab === 'all' ? 'active-tab' : 'outline-tab'}`}
                                        onClick={() => setActiveTab('all')}
                                    >All Quizzes</button>
                                    <button
                                        className={`btn tab-btn ${activeTab === 'chapter' ? 'active-tab' : 'outline-tab'}`}
                                        onClick={() => setActiveTab('chapter')}
                                    >Chapter Management</button>
                                </div>
                            </div>

                            {/* --- "All Quizzes" view --- */}
                            {activeTab === 'all' && (
                                <div className="table-responsive">
                                    <table className="data-table shaded-header text-center-table">
                                        <thead>
                                            <tr>
                                                <th>Quiz Title</th>
                                                <th>Chapter</th>
                                                <th>Features</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quizzes.map(quiz => (
                                                <tr key={quiz.id}>
                                                    <td><strong>{quiz.title}</strong></td>
                                                    <td>{quiz.chapter}</td>
                                                    <td><strong>{quiz.features}</strong></td>
                                                    <td><strong>{quiz.status}</strong></td>
                                                    <td>
                                                        <div className="action-cells center-actions">
                                                            <button className="icon-btn" title="Edit" onClick={() => openQuizModal(quiz)}>✎</button>
                                                            <button className="icon-btn trash" title="Delete" onClick={() => deleteQuiz(quiz.id)}>🗑</button>
                                                            <button className="icon-btn" title="Options">☰</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* --- "Chapter Management" view --- */}
                            {activeTab === 'chapter' && (
                                <div className="table-responsive">
                                    <table className="data-table shaded-header text-center-table">
                                        <thead>
                                            <tr>
                                                <th>Quiz Assigned</th>
                                                <th>Chapter No.</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chapters.map(chapter => (
                                                <tr key={chapter.id}>
                                                    <td><strong>{chapter.quizTitle}</strong></td>
                                                    <td>{chapter.chapterNum}</td>
                                                    <td><strong className={statusClass(chapter.status)}>{chapter.status}</strong></td>
                                                    <td>
                                                        <button className="btn btn-pill-outline" onClick={() => toggleChapterLock(chapter.id)}>
                                                            {chapter.status === 'Locked' ? 'Unlock' : 'Lock'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* ============================================================
                 EDIT QUIZ MODAL
                 ============================================================ */}
            {isQuizModalOpen && (
                <div className="modal-overlay show-modal">
                    <div className="modal-box" style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Edit Quiz Details</h2>
                                <p className="modal-subtitle">Configure quiz settings and manage questions below.</p>
                            </div>
                            <button className="modal-close-btn" onClick={closeQuizModal} title="Close">✕</button>
                        </div>

                        <div className="modal-body quiz-modal-layout" style={{ overflowY: 'auto', flex: 1 }}>

                            {/* --- Left column: settings + question builder --- */}
                            <div className="quiz-panel">
                                <div className="field-group">
                                    <label className="field-label">Quiz Title</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="e.g. History of IT"
                                        style={{ fontSize: '16px', fontWeight: 500 }}
                                        value={quizTitleInput}
                                        onChange={(e) => setQuizTitleInput(e.target.value)}
                                    />
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Quiz Features</label>
                                    <div className="feature-toggles-container">
                                        <label className="feature-toggle">
                                            <input
                                                type="checkbox"
                                                checked={shuffleOptions}
                                                onChange={(e) => setShuffleOptions(e.target.checked)}
                                            />
                                            <div className="toggle-bg"></div>
                                            Shuffle Options
                                        </label>
                                        <label className="feature-toggle">
                                            <input
                                                type="checkbox"
                                                checked={shuffleQuestions}
                                                onChange={(e) => setShuffleQuestions(e.target.checked)}
                                            />
                                            <div className="toggle-bg"></div>
                                            Shuffle Questions
                                        </label>
                                    </div>
                                </div>

                                <div className="question-builder-card">
                                    <span className="card-header-label">Question Builder</span>
                                    <textarea
                                        className="modal-input"
                                        rows="2"
                                        placeholder="Type your question here..."
                                        style={{ resize: 'none', marginBottom: '16px' }}
                                        value={questionText}
                                        onChange={(e) => setQuestionText(e.target.value)}
                                    ></textarea>

                                    <div className="options-container">
                                        {[
                                            ['A', optA, setOptA],
                                            ['B', optB, setOptB],
                                            ['C', optC, setOptC],
                                            ['D', optD, setOptD],
                                        ].map(([letter, value, setValue]) => (
                                            <div className="option-row" key={letter}>
                                                <label className="opt-radio-label" title={`Mark Option ${letter} as correct`}>
                                                    <input
                                                        type="radio"
                                                        name="correctOption"
                                                        value={letter}
                                                        checked={correctOption === letter}
                                                        onChange={(e) => setCorrectOption(e.target.value)}
                                                    />
                                                    <span className="opt-letter">{letter}</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="modal-input"
                                                    placeholder={`Enter option ${letter}...`}
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-outline-teal"
                                        onClick={insertQuestion}
                                        style={{ marginTop: '10px', width: '100%', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', padding: '12px' }}
                                    >
                                        + Add Question to Quiz
                                    </button>
                                </div>
                            </div>

                            {/* --- Right column: session-only preview list --- */}
                            <div className="quiz-panel quiz-right-panel">
                                <div style={{ overflowY: 'auto', flex: 1, minHeight: '250px' }}>
                                    <table className="data-table styled-table text-center-table" style={{ marginTop: 0, border: 'none' }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <tr>
                                                <th style={{ width: '55%', padding: '16px 20px' }}>Question</th>
                                                <th>Correct Answer</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewQuestions.map(q => (
                                                <tr key={q.id}>
                                                    <td style={{ textAlign: 'left', paddingLeft: '15px' }} title={q.fullText}>{q.displayText}</td>
                                                    <td><strong>{q.correctAnswer}</strong></td>
                                                    <td>
                                                        <button
                                                            className="icon-btn trash"
                                                            title="Delete"
                                                            style={{ fontSize: '16px' }}
                                                            onClick={() => deletePreviewQuestion(q.id)}
                                                        >🗑</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={closeQuizModal}>Cancel</button>
                            <button type="button" className="btn-modal-submit" onClick={saveQuiz}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default GameManagement;