import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// =====================================================================
// IMPORTING ALL PAGE COMPONENTS
// We must import every screen (page) we created so the router knows 
// what to display when a user visits a specific link.
// =====================================================================

// --- Auth guard ---
// Place RequireAuth.jsx alongside this file (src/RequireAuth.jsx).
// It re-checks the Supabase session (and role) on every route change,
// so signing out and hitting "back" always bounces to sign-in.
import RequireAuth from './RequireAuth/requireauth.jsx';

// --- Public Pages ---
import LandingPageINSEC from './Landing Page/landing-page.jsx';
import SignIn from './Login Page/sign-in-page.jsx';

// --- Admin Pages ---
import AdminDashboard from './Admin Dashboard/admin-dashboard.jsx';
import GameManagement from './Game Management/game-management.jsx';
import StudentAccountManagement from './Student Acc Management/student-account-management.jsx';
import StudentAssessment from './Student Assessment/student-assessment.jsx';
import StudentGameProgress from './Student Game Progress/student-game-progress.jsx';
import Notification from './Notification Page/Notification.jsx';

// --- Super Admin Pages ---
import StudentAccountManagementSA from './Student Acc Management SA/student-account-managementSA.jsx';
import TeacherAccountManagement from './Teacher Account Management/teacher-account-management.jsx';
import SectionManagement from './Teacher Account Management/section-management.jsx';
import NotificationSA from './Notification Page SA/NotificationSA.jsx';

// =====================================================================
// MAIN APP COMPONENT (THE TRAFFIC CONTROLLER)
// =====================================================================
function App() {
    return (
        // <Router> wraps our app to enable the URL navigation features
        <Router>
            {/* <Routes> acts as a container for all the possible URLs */}
            <Routes>

                {/* -------------------------------------------------- */}
                {/* PUBLIC ROUTES (No login required)                  */}
                {/* -------------------------------------------------- */}
                <Route path="/" element={<LandingPageINSEC />} />
                <Route path="/sign-in-page" element={<SignIn />} />

                {/* -------------------------------------------------- */}
                {/* ADMIN (TEACHER) ROUTES — session + role required   */}
                {/* -------------------------------------------------- */}
                <Route path="/admin-dashboard" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <AdminDashboard />
                    </RequireAuth>
                } />
                <Route path="/game-management" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <GameManagement />
                    </RequireAuth>
                } />
                <Route path="/student-account-management" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <StudentAccountManagement />
                    </RequireAuth>
                } />
                <Route path="/student-assessment" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <StudentAssessment />
                    </RequireAuth>
                } />
                <Route path="/student-game-progress" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <StudentGameProgress />
                    </RequireAuth>
                } />
                <Route path="/notifications" element={
                    <RequireAuth allowedRoles={['teacher']}>
                        <Notification />
                    </RequireAuth>
                } />

                {/* -------------------------------------------------- */}
                {/* SUPER ADMIN ROUTES — session + role required       */}
                {/* -------------------------------------------------- */}
                <Route path="/student-account-management-sa" element={
                    <RequireAuth allowedRoles={['superadmin']}>
                        <StudentAccountManagementSA />
                    </RequireAuth>
                } />
                <Route path="/teacher-account-management" element={
                    <RequireAuth allowedRoles={['superadmin']}>
                        <TeacherAccountManagement />
                    </RequireAuth>
                } />
                <Route path="/section-management" element={
                    <RequireAuth allowedRoles={['superadmin']}>
                        <SectionManagement />
                    </RequireAuth>
                } />
                <Route path="/notifications-sa" element={
                    <RequireAuth allowedRoles={['superadmin']}>
                        <NotificationSA />
                    </RequireAuth>
                } />

                {/* -------------------------------------------------- */}
                {/* CATCH-ALL — any unmatched URL bounces to sign-in    */}
                {/* instead of rendering a blank page.                  */}
                {/* -------------------------------------------------- */}
                <Route path="*" element={<Navigate to="/sign-in-page" replace />} />
            </Routes>
        </Router>
    );
}

export default App;