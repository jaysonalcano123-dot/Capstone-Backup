import React, { useEffect, useState } from 'react';
import '../Style/public-style.css';
import { supabase } from '../../capstone-client'; 
import { useDarkMode } from '../Theme/theme.js';

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;
const ATTEMPTS_KEY = 'insec-login-attempts';
const LOCK_UNTIL_KEY = 'insec-login-lock-until';

// "Remember me" — Supabase persists the session in localStorage
// indefinitely by default, so without this, every login is effectively
// "remembered" forever regardless of the checkbox. REMEMBER_KEY records
// the user's actual choice; SESSION_LIVE_KEY is a sessionStorage flag
// (cleared automatically when the browser/tab fully closes, unlike
// localStorage) that RequireAuth uses to detect "this is a fresh browser
// session" and force a sign-out if the user didn't ask to be remembered.
const REMEMBER_KEY = 'insec-remember-me';
const SESSION_LIVE_KEY = 'insec-session-live';

function SignIn() {
    {/* Controlled inputs for the login form */}
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(() => Number(sessionStorage.getItem(ATTEMPTS_KEY) || 0));
    const [lockUntil, setLockUntil] = useState(() => Number(sessionStorage.getItem(LOCK_UNTIL_KEY) || 0));
    const [rememberMe, setRememberMe] = useState(true); // matches Supabase's existing default (sessions persist unless opted out)
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const isLocked = !isRecoveryMode && lockUntil > currentTime;
    const remainingMinutes = Math.max(1, Math.ceil((lockUntil - currentTime) / 60000));
    const [isDarkMode, toggleDarkMode] = useDarkMode();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setIsRecoveryMode(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!lockUntil) return undefined;
        const timer = window.setInterval(() => {
            const now = Date.now();
            setCurrentTime(now);
            if (now >= lockUntil) {
                sessionStorage.removeItem(ATTEMPTS_KEY);
                sessionStorage.removeItem(LOCK_UNTIL_KEY);
                setFailedAttempts(0);
                setLockUntil(0);
                setFormMessage('You can try signing in again.');
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [lockUntil]);

    async function handlePasswordReset(event) {
        event.preventDefault();
        setFormMessage('');
        if (password.length < 8) return setFormMessage('Use at least 8 characters for your new password.');
        if (password !== confirmPassword) return setFormMessage('The passwords do not match.');

        setIsSubmitting(true);
        const { error } = await supabase.auth.updateUser({ password });
        setIsSubmitting(false);
        if (error) return setFormMessage(error.message || 'This reset link is invalid or has expired.');
        setFormMessage('Password reset successfully. You can now sign in.');
        setIsRecoveryMode(false);
        setPassword('');
        setConfirmPassword('');
    }

    async function sendSelfServiceReset(event) {
        event.preventDefault();
        if (!email) return setFormMessage('Enter your email address first.');
        setIsSendingReset(true);

        const [emailResult, notifyResult] = await Promise.allSettled([
            supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/sign-in-page`,
            }),
            // Separate, no-auth-required function — logs this request so
            // Super Admins see "X requested a password reset" on their
            // Notifications page. This is a plain database write, so it
            // succeeds independently of whether Supabase can actually
            // deliver an email to this address (e.g. a placeholder
            // domain that isn't real) — that's why these two outcomes
            // are tracked and reported separately below, instead of one
            // failure silently overriding the other's result.
            supabase.functions.invoke('manage-account', { body: { action: 'notify_password_reset', email } }),
        ]);

        setIsSendingReset(false);

        const emailFailed = emailResult.status === 'rejected' || emailResult.value?.error;
        const notifyFailed = notifyResult.status === 'rejected' || notifyResult.value?.error;

        if (!emailFailed) {
            setFormMessage('Reset password has been requested. If that account exists, a reset link has been sent to it.');
        } else if (!notifyFailed) {
            // The actual email couldn't be sent (commonly because this
            // account uses a non-deliverable placeholder domain), but the
            // admin was still notified and can reset the password manually.
            setFormMessage("Reset password has been requested — the admin has been notified. (A reset email couldn't be sent to this address.)");
        } else {
            setFormMessage(emailResult.value?.error?.message || 'Could not request a password reset. Please try again.');
        }
    }

    async function handleLoginSubmit(event) {
        event.preventDefault();
        if (isLocked) {
            setFormMessage(`Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`);
            return;
        }
        setIsSubmitting(true);
        setFormMessage('');

        try {
            // 1. Authenticate against Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !authData?.user) {
                const nextAttempts = failedAttempts + 1;
                setFailedAttempts(nextAttempts);
                sessionStorage.setItem(ATTEMPTS_KEY, String(nextAttempts));
                if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
                    const nextLockUntil = Date.now() + LOCKOUT_MS;
                    setLockUntil(nextLockUntil);
                    sessionStorage.setItem(LOCK_UNTIL_KEY, String(nextLockUntil));
                    setFormMessage('Too many failed attempts. Sign-in is locked for 5 minutes.');
                } else {
                    setFormMessage(`Invalid credentials. ${MAX_LOGIN_ATTEMPTS - nextAttempts} attempt${MAX_LOGIN_ATTEMPTS - nextAttempts === 1 ? '' : 's'} remaining.`);
                }
                return;
            }

            setFailedAttempts(0);
            setLockUntil(0);
            sessionStorage.removeItem(ATTEMPTS_KEY);
            sessionStorage.removeItem(LOCK_UNTIL_KEY);

            // Record the "remember me" choice. SESSION_LIVE_KEY marks this
            // browser session as one where the user actually just signed
            // in — RequireAuth uses its absence (after a real browser
            // restart) to know it should sign an unremembered user out.
            localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');
            sessionStorage.setItem(SESSION_LIVE_KEY, '1');

            // 2. Look up the account's role so we know where to send them
            const { data: account, error: accountError } = await supabase
                .from('user_account')
                .select('role, is_active')
                .eq('account_id', authData.user.id)
                .single();

            if (accountError || !account) {
                alert("We couldn't find an account profile for these credentials. Please contact support.");
                await supabase.auth.signOut();
                return;
            }

            if (!account.is_active) {
                alert("This account has been deactivated. Please contact your administrator.");
                await supabase.auth.signOut();
                return;
            }

            // 3. Redirect based on role
            if (account.role === 'superadmin') {
                window.location.href = "/teacher-account-management";
            } else if (account.role === 'teacher') {
                window.location.href = "/admin-dashboard";
            } else {
                alert("This account type isn't permitted to sign in here.");
                await supabase.auth.signOut();
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while signing in. Please try again.");
        } finally {
            setIsSubmitting(false);
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

                {/* Floating dark-mode toggle — mirrors "Back to Home" on the
                     opposite corner. Preference is saved and stays applied
                     until the user toggles it again (see Theme/theme.js). */}
                <button
                    className="theme-toggle-btn"
                    style={{ position: 'fixed', top: 30, right: 30, zIndex: 10 }}
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

                            <h1 className="form-title">{isRecoveryMode ? 'Reset Password' : 'Sign In'}</h1>
                            <p className="form-subtitle">{isRecoveryMode ? 'Choose a new password. This recovery link can only be used once.' : 'Enter your credentials to continue.'}</p>

                            {/* Login form. Submission is intercepted by handleLoginSubmit() */}
                            <form id="loginForm" onSubmit={isRecoveryMode ? handlePasswordReset : handleLoginSubmit}>

                                {/* Email field (required, browser-validated as an email format) */}
                                {!isRecoveryMode && <div className="input-group">
                                    <label htmlFor="email">Email</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>
                                        </span>
                                        <input type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLocked} required />
                                    </div>
                                </div>}

                                {/* Password field (required, masked input) */}
                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </span>
                                        <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLocked} required />
                                    </div>
                                </div>

                                {isRecoveryMode && <div className="input-group">
                                    <label htmlFor="confirm-password">Confirm New Password</label>
                                    <div className="input-with-icon">
                                        <span className="input-icon">🔒</span>
                                        <input type="password" id="confirm-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                    </div>
                                </div>}

                                {!isRecoveryMode && <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me
                                    </label>
                                    <a href="#" className="forgot-password" onClick={isSendingReset ? (e) => e.preventDefault() : sendSelfServiceReset}>
                                        {isSendingReset ? 'Sending…' : 'Forgot Password?'}
                                    </a>
                                </div>}

                                {(formMessage || isLocked) && <p role="status" className="form-subtitle">{formMessage || `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`}</p>}

                                {/* Submit button — triggers handleLoginSubmit() above */}
                                <button type="submit" className="btn-submit" disabled={isSubmitting || isLocked}>
                                    {isSubmitting ? (isRecoveryMode ? 'Resetting…' : 'Signing In...') : (isRecoveryMode ? 'Reset Password' : 'Log In')}
                                </button>
                            </form>

                        </div>
                    </div>

                </main>
            </div>
        </>
    );
}

export default SignIn;