import { useEffect, useState } from 'react';

// Shared between landing-page.jsx and sign-in-page.jsx (and any other public
// page that wants it). Stores the choice in localStorage so it survives
// refreshes/navigation and persists until the user changes it again — it is
// intentionally NOT tied to the OS `prefers-color-scheme` setting, since the
// requirement is "stays dark mode until the user changes it," not "follows
// the system."
const THEME_KEY = 'insec-theme';

function getStoredTheme() {
    try {
        return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light'; // localStorage can throw in some privacy modes — fail to light
    }
}

function applyTheme(theme) {
    // Toggled on <html> (not just a page wrapper) so it's available to every
    // selector in public-style.css, including ones like `body` that sit
    // outside any single page's root element.
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
}

export function useDarkMode() {
    const [theme, setTheme] = useState(getStoredTheme);

    // Apply on mount and whenever it changes, so navigating between the
    // landing page and the sign-in page keeps whatever was last chosen.
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem(THEME_KEY, next);
            } catch {
                // ignore — theme still applies for this session via state
            }
            return next;
        });
    }

    return [theme === 'dark', toggleTheme];
}