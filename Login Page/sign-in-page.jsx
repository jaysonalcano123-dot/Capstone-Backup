import React, { useState } from 'react';
import '../Style/public-style.css';

function SignIn() {
    {/* Single form for both roles now — the role is decided by which
         credentials are entered, not by the URL. Whichever set matches
         (Admin or Super Admin) determines where the user is redirected. */}
    const validAdminEmail = "admin@insec.com";
    const validAdminPassword = "admin123";
    const validSuperEmail = "super@insec.com";
    const validSuperPassword = "super123";

    {/* Controlled inputs for the login form */}
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleLoginSubmit(event) {
        event.preventDefault();

        if (email === validSuperEmail && password === validSuperPassword) {
            window.location.href = "/teacher-account-management";
        } else if (email === validAdminEmail && password === validAdminPassword) {
            window.location.href = "/admin-dashboard";
        } else {
            alert("Invalid credentials! Please check your email and password.");
        }
    }

    return (
        <>
            {/* ============================================================
                 MAIN LAYOUT
                 A floating two-column card (illustration panel + form panel)
                 centered on a full-page background — styled by
                 .signin-page-bg (outer background) and .split-container
                 (the card itself) in public-style.css. On mobile (≤900px),
                 the card becomes full-width and the left panel is hidden.
                 ============================================================ */}
            <div className="signin-page-bg">

                {/* Floating "back to home" control — sits above the card in the
                     page's top-left corner instead of inside the form column. */}
                <button className="btn-back" onClick={() => window.location.href='/'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="M12 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </button>

                <main className="split-container">

                    {/* Left panel: light background, "Welcome Back" heading,
                         and a simple inline illustration (no external image
                         asset needed, so nothing can go missing). */}
                    <div className="left-panel">
                        <div className="left-panel-content">
                            <h1 className="welcome-title">Welcome Back</h1>
                            <p className="welcome-subtitle">Sign in to manage the IN-SEC platform.</p>

                            <svg className="login-illustration" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="200" cy="160" r="140" fill="#ffffff" opacity="0.5" />
                                <rect x="110" y="90" width="180" height="130" rx="14" fill="#ffffff" stroke="#2f937e" strokeWidth="3" />
                                <rect x="130" y="115" width="140" height="12" rx="6" fill="#d9f0ea" />
                                <rect x="130" y="140" width="100" height="12" rx="6" fill="#d9f0ea" />
                                <rect x="130" y="170" width="140" height="26" rx="8" fill="#36a68f" />
                                <circle cx="200" cy="235" r="26" fill="#2f937e" />
                                <rect x="188" y="248" width="24" height="34" rx="6" fill="#2f937e" />
                                <circle cx="310" cy="80" r="10" fill="#ffffff" opacity="0.6" />
                                <circle cx="85" cy="230" r="14" fill="#ffffff" opacity="0.4" />
                                <circle cx="95" cy="70" r="7" fill="#ffffff" opacity="0.5" />
                            </svg>
                        </div>
                    </div>

                    {/* Right panel: contains the actual sign-in form */}
                    <div className="right-panel">
                        <div className="form-container">

                            <h1 className="form-title">Sign In</h1>
                            <p className="form-subtitle">Enter your credentials to continue.</p>

                            {/* Login form. Submission is intercepted by handleLoginSubmit() */}
                            <form id="loginForm" onSubmit={handleLoginSubmit}>

                                {/* Email field (required, browser-validated as an email format) */}
                                <div className="input-group">
                                    <label htmlFor="email">Email</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>
                                        </span>
                                        <input type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>

                                {/* Password field (required, masked input) */}
                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </span>
                                        <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>

                                {/* "Remember me" checkbox + forgot password link, side by side */}
                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" id="remember" /> Remember me
                                    </label>
                                    <a href="#" className="forgot-password">Forgot Password?</a>
                                    {/* TODO: currently links to "#" — needs a real forgot-password page/flow */}
                                </div>

                                {/* Submit button — triggers handleLoginSubmit() above */}
                                <button type="submit" className="btn-submit">Log In</button>
                            </form>

                        </div>
                    </div>

                </main>
            </div>
        </>
    );
}

export default SignIn;