import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../capstone-client'; 
import { fetchCurrentTeacher } from '../Teacher Service/teacher-service.js'; // shared with Teacher Account Management — reads the signed-in teacher's own name
import {
    fetchQuizzes, fetchQuizQuestions, updateQuizTitle, deleteQuiz as deleteQuizRequest,
    addQuizQuestion, deleteQuizQuestion,
    fetchScenarios, toggleScenarioLock,
} from '../Game Service/game-service.js'; // adjust path to your shared services folder
import '../Style/global-style.css';
import { useDarkMode } from '../Theme/theme.js';

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
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    {/* --- Chapter Management table data ("chapters" = privacy_scenario rows) --- */}
    const [chapters, setChapters] = useState([]);

    async function loadData() {
        setIsLoading(true);
        setLoadError('');
        try {
            const [quizRows, scenarioRows] = await Promise.all([fetchQuizzes(), fetchScenarios()]);
            setQuizzes(quizRows);
            setChapters(scenarioRows);
        } catch (err) {
            console.error(err);
            setLoadError('Could not load game data. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

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

    {/* --- All Quizzes logic --- */}
    async function deleteQuiz(quizId) {
        if (!window.confirm("Delete this quiz? This also deletes its questions.")) return;
        try {
            await deleteQuizRequest(quizId);
            await loadData();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while deleting this quiz.");
        }
    }

    async function openQuizModal(quiz) {
        setEditingQuizId(quiz.quiz_id);
        setQuizTitleInput(quiz.quiz_title);
        setShuffleOptions(false);
        setShuffleQuestions(false);
        clearQuestionInputs();
        setIsQuizModalOpen(true);
        try {
            const questions = await fetchQuizQuestions(quiz.quiz_id);
            setPreviewQuestions(questions.map(q => ({
                id: q.question_id,
                fullText: q.question_text,
                displayText: q.question_text.length > 30 ? q.question_text.substring(0, 30) + '...' : q.question_text,
                correctAnswer: q.correct_answer,
            })));
        } catch (err) {
            console.error(err);
            setPreviewQuestions([]);
        }
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

    {/* Validates the question builder, then persists the question directly
         to quiz_question and adds it to the preview table. */}
    async function insertQuestion() {
        if (!questionText.trim() || !correctOption) {
            alert("Please enter a question and select the correct answer.");
            return;
        }

        try {
            const saved = await addQuizQuestion(editingQuizId, {
                questionText,
                optionA: optA,
                optionB: optB,
                optionC: optC,
                optionD: optD,
                correctAnswer: correctOption,
            });

            const displayQuestion = questionText.length > 30
                ? questionText.substring(0, 30) + '...'
                : questionText;

            setPreviewQuestions([...previewQuestions, {
                id: saved.question_id,
                fullText: questionText,
                displayText: displayQuestion,
                correctAnswer: correctOption
            }]);

            clearQuestionInputs();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while saving this question.");
        }
    }

    async function deletePreviewQuestion(questionId) {
        try {
            await deleteQuizQuestion(questionId);
            setPreviewQuestions(previewQuestions.filter(q => q.id !== questionId));
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while deleting this question.");
        }
    }

    {/* "Save Changes" — persists the (possibly renamed) quiz title. */}
    async function saveQuiz() {
        if (editingQuizId && quizTitleInput.trim()) {
            try {
                await updateQuizTitle(editingQuizId, quizTitleInput.trim());
                await loadData();
            } catch (err) {
                console.error(err);
                alert(err.message || "Something went wrong while saving the quiz title.");
                return;
            }
        }
        closeQuizModal();
    }

    {/* --- Chapter Management logic (chapters = privacy_scenario rows) --- */}
    async function toggleChapterLock(scenarioId, currentlyLocked) {
        try {
            await toggleScenarioLock(scenarioId, !currentlyLocked);
            await loadData();
        } catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong while updating this chapter's lock state.");
        }
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
                        <div className="admin-avatar">{currentTeacher?.initials || 'A'}</div>
                        <div className="admin-info">
                            <strong>{currentTeacher?.name || 'Admin'}</strong><span>Admin</span>
                        </div>
                    </div>
                </aside>

                <div className="main-content">
                    <header className="topbar">
                        <button className="mobile-menu-btn" onClick={toggleSidebar}>☰</button>
                        <h1 className="page-title">Game Management</h1>

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

                        {/* Top-level summary stats, computed from the real data loaded above */}
                        <div className="stats-card-grid-4">
                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Total Quizzes</span>
                                    <span className="stat-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                    </span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">{quizzes.length}</span>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Total Scenarios</span>
                                    <span className="stat-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H14z"/></svg>
                                    </span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">{chapters.length}</span>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Active Scenarios</span>
                                    <span className="stat-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 14.5L6 11l1.41-1.41L10.5 12.67l6.09-6.09L18 8l-7.5 7.5z"/></svg>
                                    </span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">{chapters.filter(c => !c.is_locked).length}</span>
                                </div>
                            </div>

                            <div className="inner-stat-card">
                                <div className="stat-card-header">
                                    <span>Locked Scenarios</span>
                                    <span className="stat-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                                    </span>
                                </div>
                                <div className="stat-card-body flex-center-vertical">
                                    <span className="text-huge">{chapters.filter(c => c.is_locked).length}</span>
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
                                                <th>Total Items</th>
                                                <th>Passing Score</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Loading…</td></tr>
                                            )}
                                            {!isLoading && loadError && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>{loadError}</td></tr>
                                            )}
                                            {!isLoading && !loadError && quizzes.length === 0 && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No quizzes yet.</td></tr>
                                            )}
                                            {!isLoading && !loadError && quizzes.map(quiz => (
                                                <tr key={quiz.quiz_id}>
                                                    <td><strong>{quiz.quiz_title}</strong></td>
                                                    <td>{quiz.total_items ?? '—'}</td>
                                                    <td>{quiz.passing_score ?? '—'}</td>
                                                    <td>
                                                        <div className="action-cells center-actions">
                                                            <button className="icon-btn" title="Edit" onClick={() => openQuizModal(quiz)}>✎</button>
                                                            <button className="icon-btn trash" title="Delete" onClick={() => deleteQuiz(quiz.quiz_id)}>🗑</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* --- "Chapter Management" view (chapters = privacy_scenario rows) --- */}
                            {activeTab === 'chapter' && (
                                <div className="table-responsive">
                                    <table className="data-table shaded-header text-center-table">
                                        <thead>
                                            <tr>
                                                <th>Scenario Title</th>
                                                <th>Rule</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>Loading…</td></tr>
                                            )}
                                            {!isLoading && loadError && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>{loadError}</td></tr>
                                            )}
                                            {!isLoading && !loadError && chapters.length === 0 && (
                                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>No scenarios yet.</td></tr>
                                            )}
                                            {!isLoading && !loadError && chapters.map(chapter => (
                                                <tr key={chapter.scenario_id}>
                                                    <td><strong>{chapter.title}</strong></td>
                                                    <td>{chapter.rule || '—'}</td>
                                                    <td><strong className={chapter.is_locked ? 'status-text text-red' : 'status-text text-blue'}>{chapter.is_locked ? 'Locked' : 'Active'}</strong></td>
                                                    <td>
                                                        <button className="btn btn-pill-outline" onClick={() => toggleChapterLock(chapter.scenario_id, chapter.is_locked)}>
                                                            {chapter.is_locked ? 'Unlock' : 'Lock'}
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