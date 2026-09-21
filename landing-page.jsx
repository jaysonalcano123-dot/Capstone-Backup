import React from 'react';
import './public-style.css';
import logo from './assets/logo.png';

function LandingPageINSEC() {

    function handleLogin() {
        {/* Navigates to the react /login route */}
        window.location.href = '/sign-in-page';
    }

    function handleDownload() {
        alert("Initiating the download for IN-SEC game...");
        {/* placeholder for download logic */}
    }

    {/* To be update for animation and other stuff */}

    return (
        <main className="page-container">
            
            {/* ========================================== */}
            {/* HEADER SECTION                             */}
            {/* (Login Button and Top Navigation area)     */}
            {/* ========================================== */}
            <header>
                <button className="btn-login" onClick={handleLogin}>Login</button>
            </header>

            {/* ========================================== */}
            {/* HERO SECTION                               */}
            {/* (Main Title and Download Button)           */}
            {/* ========================================== */}
            <section id="hero" className="section-container flex-center">
                <div className="text-center">
                    <h1 className="hero-title">IN-SEC</h1>
                    <button className="btn-download" onClick={handleDownload}>Click To Download</button>
                </div>
            </section>

            {/* ========================================== */}
            {/* ABOUT US SECTION                           */}
            {/* (Project/Game description and logo)        */}
            {/* ========================================== */}
            <section id="about" className="section-container">
                <h2 className="section-title">About Us</h2>
                <div className="content-split">
                    <div className="text-content">
                        <p className="description-text">Description</p>
                    </div>
                    <div className="image-content">
                        <img src={logo} alt="About Us" className="placeholder-img rounded" width="345" />
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* GAME FEATURES SECTION                      */}
            {/* (4-column grid detailing what the game does)*/}
            {/* ========================================== */}
            <section id="features" className="section-container block-layout">
                <h1 className="huge-title text-center mb-50">Game Features</h1>
                
                <div className="features-grid">
                    {/* Feature 1 */}
                    <div className="feature-card">
                        <div className="feature-img-wrapper">
                            <img src="https://placehold.co/250x180/ffffff/999999?text=Feature+1" alt="Feature 1" />
                        </div>
                        <h3 className="feature-title">Engaging Visual Learning Through Game Experience</h3>
                        <p className="feature-desc">Students can engage with interactive content that makes learning more enjoyable and effective.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-card">
                        <div className="feature-img-wrapper">
                            <img src="https://placehold.co/250x180/ffffff/999999?text=Feature+2" alt="Feature 2" />
                        </div>
                        <h3 className="feature-title">Interactive activities and assessments</h3>
                        <p className="feature-desc">Students can test their knowledge and skills through interactive polls, quizzes, and debates, among others.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-card">
                        <div className="feature-img-wrapper">
                            <img src="https://placehold.co/250x180/ffffff/999999?text=Feature+3" alt="Feature 3" />
                        </div>
                        <h3 className="feature-title">Student progress tracking</h3>
                        <p className="feature-desc">The platform tracks student progress within the game, showing completed levels and achievement growth rather than att</p>
                    </div>

                    {/* Feature 4 */}
                    <div className="feature-card">
                        <div className="feature-img-wrapper">
                            <img src="https://placehold.co/250x180/ffffff/000000?text=Feature+4" alt="Feature 4" />
                        </div>
                        <h3 className="feature-title">Challenging Levels</h3>
                        <p className="feature-desc">The platform allows the students to engage with progressively difficult content that adapts to their learning pace.</p>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* PROGRESS MONITORING SECTION                */}
            {/* ========================================== */}
            <section id="progress" className="section-container">
                <h2 className="section-title">Progress Monitoring</h2>
                <div className="content-split reverse">
                    <div className="text-content">
                        <p className="description-text">Description</p>
                    </div>
                    <div className="image-content">
                        <img src="https://placehold.co/500x300/eeeeee/999999?text=Progress+Monitoring" alt="Progress" className="placeholder-img" />
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* STUDENT ASSESSMENT SECTION                 */}
            {/* ========================================== */}
            <section id="assessment" className="section-container">
                <h2 className="section-title">Student Assessment</h2>
                <div className="content-split">
                    <div className="text-content">
                        <p className="description-text">Description</p>
                    </div>
                    <div className="image-content">
                        <img src="https://placehold.co/500x300/eeeeee/999999?text=Assessment+Interface" alt="Assessment" className="placeholder-img" />
                    </div>
                </div>
            </section>

        </main>
    );
}

export default LandingPageINSEC;