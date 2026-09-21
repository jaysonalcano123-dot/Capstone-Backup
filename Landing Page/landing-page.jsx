import React, { useEffect, useState } from 'react';
import '../Style/public-style.css';
import logo from '../assets/logo.png';

const BOOT_SEQUENCE = [
    '$ insec --init',
    '> compiling countermeasures...',
    '> loading 12 live missions...',
    '> access granted_',
];

function LandingPageINSEC() {

    function handleLogin() {
        {/* Navigates to the react /login route */}
        window.location.href = '/sign-in-page';
    }

    function handleDownload() {
        alert("Initiating the download for IN-SEC game...");
        {/* placeholder for download logic */}
    }

    {/* Boot-sequence reveal for the hero terminal. Falls back to showing
         everything immediately if the visitor prefers reduced motion. */}
    const [linesShown, setLinesShown] = useState(0);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setLinesShown(BOOT_SEQUENCE.length);
            return;
        }
        if (linesShown >= BOOT_SEQUENCE.length) return;
        const delay = linesShown === 0 ? 350 : 420;
        const timer = setTimeout(() => setLinesShown((count) => count + 1), delay);
        return () => clearTimeout(timer);
    }, [linesShown]);

    const bootComplete = linesShown >= BOOT_SEQUENCE.length;

    return (
        <main className="page-container">

            {/* ========================================== */}
            {/* HEADER SECTION                             */}
            {/* ========================================== */}
            <header>
                <div className="brand-mark">IN_SEC<span className="cursor">_</span></div>
                <nav className="nav-links">
                    <a href="#hero">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                    <a href="#progress">Progress</a>
                    <a href="#assessment">Assessment</a>
                </nav>
                <button className="btn-login" onClick={handleLogin}>Login</button>
            </header>

            {/* ========================================== */}
            {/* HERO SECTION                               */}
            {/* A terminal window "boots" into the pitch — the game's own   */}
            {/* language (a shell session) doubles as the hero's visual.    */}
            {/* ========================================== */}
            <section id="hero" className="section-container flex-center">
                <div className="terminal-window">
                    <div className="terminal-titlebar">
                        <span className="terminal-dot red"></span>
                        <span className="terminal-dot amber"></span>
                        <span className="terminal-dot green"></span>
                        <span className="terminal-path">student@in-sec: ~</span>
                    </div>
                    <div className="terminal-body">
                        {BOOT_SEQUENCE.slice(0, linesShown).map((line, i) => (
                            <p key={i} className="terminal-line">{line}</p>
                        ))}

                        {bootComplete && (
                            <div className="hero-reveal">
                                <h1 className="hero-title">IN-SEC</h1>
                                <p className="hero-subtitle">
                                    A game where students learn cybersecurity by finding the exploit
                                    before it finds them — real vulnerabilities, safely simulated.
                                </p>
                                <div className="hero-actions">
                                    <button className="btn-download" onClick={handleDownload}>Download the Game</button>
                                    <a href="#features" className="btn-secondary">See Features</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* ABOUT US SECTION                           */}
            {/* ========================================== */}
            <section id="about" className="section-container">
                <div className="content-split">
                    <div className="text-content">
                        <span className="section-eyebrow">// about</span>
                        <h2 className="section-title">About Us</h2>
                        <p className="description-text">
                            IN-SEC turns the fundamentals of cybersecurity into a playable
                            curriculum. Students step into the role of a junior analyst —
                            patching real vulnerabilities, chasing intrusions, and defending a
                            simulated network — while teachers get a live view of who's stuck,
                            who's thriving, and what to teach next.
                        </p>
                    </div>
                    <div className="image-content">
                        <div className="panel-frame">
                            <div className="terminal-titlebar">
                                <span className="terminal-dot red"></span>
                                <span className="terminal-dot amber"></span>
                                <span className="terminal-dot green"></span>
                                <span className="terminal-path">about.insec</span>
                            </div>
                            <div className="panel-body">
                                <img src={logo} alt="IN-SEC" className="placeholder-img" width="220" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* GAME FEATURES SECTION                      */}
            {/* ========================================== */}
            <section id="features" className="section-container">
                <div className="text-center mb-50">
                    <span className="section-eyebrow">// features</span>
                    <h1 className="huge-title">Game Features</h1>
                </div>

                <div className="features-grid">
                    {/* Feature 1 */}
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                                <path d="M10 9.2l5 2.8-5 2.8V9.2z" fill="currentColor" stroke="none" />
                            </svg>
                        </div>
                        <h3 className="feature-title">Engaging Visual Learning Through Game Experience</h3>
                        <p className="feature-desc">Students can engage with interactive content that makes learning more enjoyable and effective.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="4" width="14" height="17" rx="2" />
                                <path d="M9 3h6v3H9z" />
                                <path d="M8.5 12l2 2 4-4" />
                                <path d="M8.5 17.3l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="feature-title">Interactive activities and assessments</h3>
                        <p className="feature-desc">Students can test their knowledge and skills through interactive polls, quizzes, and debates, among others.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 21V10" />
                                <path d="M11 21V6" />
                                <path d="M18 21v-8" />
                                <path d="M3 21h18" />
                            </svg>
                        </div>
                        <h3 className="feature-title">Student progress tracking</h3>
                        <p className="feature-desc">The platform tracks student progress within the game, showing completed levels and achievement growth rather than attempts.</p>
                    </div>

                    {/* Feature 4 */}
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 21V4" />
                                <path d="M5 4h13l-2.5 3.5L18 11H5" />
                            </svg>
                        </div>
                        <h3 className="feature-title">Challenging Levels</h3>
                        <p className="feature-desc">The platform allows students to engage with progressively difficult content that adapts to their learning pace.</p>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* PROGRESS MONITORING SECTION                */}
            {/* ========================================== */}
            <section id="progress" className="section-container">
                <div className="content-split reverse">
                    <div className="text-content">
                        <span className="section-eyebrow">// telemetry</span>
                        <h2 className="section-title">Progress Monitoring</h2>
                        <p className="description-text">
                            Every mission, quiz, and near-miss is logged automatically. Teachers
                            see completion, mastery, and time-on-task by student, class, or
                            cohort — no spreadsheets required.
                        </p>
                    </div>
                    <div className="image-content">
                        <div className="panel-frame">
                            <div className="terminal-titlebar">
                                <span className="terminal-dot red"></span>
                                <span className="terminal-dot amber"></span>
                                <span className="terminal-dot green"></span>
                                <span className="terminal-path">telemetry.insec</span>
                            </div>
                            <div className="panel-body">
                                <svg viewBox="0 0 320 190" className="mockup-svg" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="30" y1="150" x2="300" y2="150" stroke="var(--insec-line)" strokeWidth="1" />
                                    <line x1="30" y1="20" x2="30" y2="150" stroke="var(--insec-line)" strokeWidth="1" />
                                    <rect x="55" y="95" width="26" height="55" rx="2" fill="var(--insec-green-dim)" />
                                    <rect x="100" y="70" width="26" height="80" rx="2" fill="var(--insec-green)" />
                                    <rect x="145" y="110" width="26" height="40" rx="2" fill="var(--insec-green-dim)" />
                                    <rect x="190" y="45" width="26" height="105" rx="2" fill="var(--insec-green)" />
                                    <rect x="235" y="85" width="26" height="65" rx="2" fill="var(--insec-green-dim)" />
                                    <polyline points="68,90 113,60 158,100 203,35 248,75" fill="none" stroke="var(--insec-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="203" cy="35" r="3.5" fill="var(--insec-amber)" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* STUDENT ASSESSMENT SECTION                 */}
            {/* ========================================== */}
            <section id="assessment" className="section-container">
                <div className="content-split">
                    <div className="text-content">
                        <span className="section-eyebrow">// assessment</span>
                        <h2 className="section-title">Student Assessment</h2>
                        <p className="description-text">
                            Auto-graded challenges check whether a fix actually works, not just
                            whether an answer was picked. Students get instant feedback; teachers
                            get a rubric-aligned breakdown for every submission.
                        </p>
                    </div>
                    <div className="image-content">
                        <div className="panel-frame">
                            <div className="terminal-titlebar">
                                <span className="terminal-dot red"></span>
                                <span className="terminal-dot amber"></span>
                                <span className="terminal-dot green"></span>
                                <span className="terminal-path">assessment.insec</span>
                            </div>
                            <div className="panel-body">
                                <svg viewBox="0 0 320 190" className="mockup-svg" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="20" y="20" width="280" height="14" rx="3" fill="var(--insec-text)" opacity="0.85" />
                                    <rect x="20" y="46" width="180" height="9" rx="3" fill="var(--insec-text-muted)" opacity="0.6" />
                                    <rect x="20" y="72" width="260" height="26" rx="5" fill="none" stroke="var(--insec-green)" strokeWidth="1.5" />
                                    <circle cx="34" cy="85" r="5" fill="var(--insec-green)" />
                                    <rect x="20" y="106" width="260" height="26" rx="5" fill="none" stroke="var(--insec-line)" strokeWidth="1.5" />
                                    <circle cx="34" cy="119" r="5" fill="none" stroke="var(--insec-text-muted)" strokeWidth="1.5" />
                                    <rect x="20" y="140" width="260" height="26" rx="5" fill="none" stroke="var(--insec-line)" strokeWidth="1.5" />
                                    <circle cx="34" cy="153" r="5" fill="none" stroke="var(--insec-text-muted)" strokeWidth="1.5" />
                                    <rect x="230" y="20" width="50" height="14" rx="3" fill="var(--insec-amber)" opacity="0.9" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* FOOTER                                     */}
            {/* ========================================== */}
            <footer className="site-footer">
                <div className="brand-mark small">IN_SEC<span className="cursor">_</span></div>
                <p className="footer-tagline">Cybersecurity, learned by doing.</p>
            </footer>

        </main>
    );
}

export default LandingPageINSEC;