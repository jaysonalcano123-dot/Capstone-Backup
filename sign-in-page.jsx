import React, { useState } from 'react';
import './public-style.css';

function SignIn() {
    {/* Assignment of the account role to the currentRole variable */}
    const [currentRole, setCurrentRole] = useState('admin');
    
    {/* Controlled inputs for the login form */}
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function setRole(role) {
        setCurrentRole(role);
    }

    {/* this is the credentials for the admin and super admin accounts. The user can only log in using these credentials. */}
    function handleLoginSubmit(event) {
        event.preventDefault(); 
        
        const validAdminEmail = "admin@insec.com";
        const validAdminPassword = "admin123";

        const validSuperEmail = "super@insec.com";
        const validSuperPassword = "super123";

        if (currentRole === 'admin') {
            if (email === validAdminEmail && password === validAdminPassword) {
                window.location.href = "/admin-dashboard"; 
            } else {
                alert("Invalid Admin credentials! Please use:\nEmail: admin@insec.com\nPassword: admin123");
            }
        } else if (currentRole === 'super') {
            if (email === validSuperEmail && password === validSuperPassword) {
                window.location.href = "/teacher-account-management"; 
            } else {
                alert("Invalid Super Admin credentials! Please use:\nEmail: super@insec.com\nPassword: super123");
            }
        }
    }

    return (
        <>
            {/* ============================================================
                 MAIN LAYOUT
                 Two-column split screen: image panel (left) + form panel (right).
                 Styled by .split-container in public-style.css.
                 On mobile (≤900px), the left panel is hidden (see CSS media query).
                 ============================================================ */}
            <main className="split-container">

                {/* Left panel: purely decorative background image/gradient.
                     No content needed here — background is set via CSS (.left-panel). */}
                <div className="left-panel">
                </div>

                {/* Right panel: contains the actual sign-in form */}
                <div className="right-panel">
                    <div className="form-container">

                        {/* Navigates back to the landing page */}
                        <button className="btn-back" onClick={() => window.location.href='/'}>← Back to Home</button>

                        <h1 className="form-title">Sign In</h1>

                        {/* Role switcher: toggles which type of account is logging in.
                             setRole() should update which button has the "active" class 
                             and likely change form behavior/endpoint depending on role. */}
                        <div className="role-toggle">
                            <button className={`toggle-btn ${currentRole === 'admin' ? 'active' : ''}`} id="btn-admin" onClick={() => setRole('admin')}>Admin</button>
                            <button className={`toggle-btn ${currentRole === 'super' ? 'active' : ''}`} id="btn-super" onClick={() => setRole('super')}>Super Admin</button>
                        </div>

                        {/* Login form. Submission is intercepted by handleLoginSubmit() */}
                        <form id="loginForm" onSubmit={handleLoginSubmit}>

                            {/* Email field (required, browser-validated as an email format) */}
                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            {/* Password field (required, masked input) */}
                            <div className="input-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
                            <button type="submit" className="btn-submit">Login</button>
                        </form>

                    </div>
                </div>

            </main>
        </>
    );
}

export default SignIn;