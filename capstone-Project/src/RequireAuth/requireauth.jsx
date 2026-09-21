import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// =====================================================================
// FIX APPLIED HERE: Pointing the import to the supabase folder
// If your file is named something else (like supabase.js), change capstone-client below
// =====================================================================
import { supabase } from '../../capstone-client';

// Matches the keys sign-in-page.jsx writes on login. REMEMBER_KEY is the
// user's actual "remember me" choice (localStorage — survives browser
// restarts). SESSION_LIVE_KEY is a sessionStorage flag that only exists
// for the lifetime of the current browser session; its absence means
// the browser was fully closed and reopened since the last sign-in.
const REMEMBER_KEY = 'insec-remember-me';
const SESSION_LIVE_KEY = 'insec-session-live';
function RequireAuth({ children, allowedRoles }) {
    const [status, setStatus] = useState('checking'); // 'checking' | 'authorized' | 'unauthorized'
    const location = useLocation();

    useEffect(() => {
        let isMounted = true;
        setStatus('checking');

        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                if (isMounted) setStatus('unauthorized');
                return;
            }

            // "Remember me" enforcement — without this, Supabase's default
            // session persistence means every login is remembered forever
            // regardless of the checkbox. If this is a genuinely new
            // browser session (SESSION_LIVE_KEY missing — it only survives
            // within the same browser session, unlike localStorage) and
            // the user didn't ask to be remembered, sign them out instead
            // of silently honoring the still-valid Supabase token.
            const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
            const sessionIsLive = sessionStorage.getItem(SESSION_LIVE_KEY) === '1';
            if (!remembered && !sessionIsLive) {
                await supabase.auth.signOut();
                if (isMounted) setStatus('unauthorized');
                return;
            }
            sessionStorage.setItem(SESSION_LIVE_KEY, '1');

            if (allowedRoles && allowedRoles.length > 0) {
                const { data: account, error } = await supabase
                    .from('user_account')
                    .select('role, is_active')
                    .eq('account_id', session.user.id)
                    .single();

                if (error || !account || !account.is_active || !allowedRoles.includes(account.role)) {
                    if (isMounted) setStatus('unauthorized');
                    return;
                }
            }

            if (isMounted) setStatus('authorized');
        }

        checkSession();

        // Catches sign-out happening elsewhere (another tab, token expiry, etc.)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                if (isMounted) setStatus('unauthorized');
            } else {
                checkSession();
            }
        });

        return () => {
            isMounted = false;
            listener.subscription.unsubscribe();
        };
        // Re-check every time the route changes — this is what makes the
        // browser back button re-validate instead of showing a cached page.
    }, [location.pathname]);

    if (status === 'checking') {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (status === 'unauthorized') {
        return <Navigate to="/sign-in-page" replace state={{ from: location }} />;
    }

    return children;
}

export default RequireAuth;