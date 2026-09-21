import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// =====================================================================
// IMPORTING ALL PAGE COMPONENTS
// We must import every screen (page) we created so the router knows 
// what to display when a user visits a specific link.
// =====================================================================

// --- Public Pages ---
import LandingPageINSEC from './Landing Page/landing-page.jsx';
import SignIn from './Login Page/sign-in-page.jsx';

// --- Admin Pages ---
import AdminDashboard from './Admin Dashboard/admin-dashboard.jsx';
import GameManagement from './Game Management/game-management.jsx';
import StudentAccountManagement from './Student Acc Management/student-account-management.jsx';
import StudentAssessment from './Student Assessment/student-assessment.jsx';
import StudentGameProgress from './Student Game Progress/student-game-progress.jsx';

// --- Super Admin Pages ---
import StudentAccountManagementSA from './Student Acc Management SA/student-account-managementSA.jsx';
import TeacherAccountManagement from './Teacher Account Management/teacher-account-management.jsx';

// =====================================================================
// MAIN APP COMPONENT (THE TRAFFIC CONTROLLER)
// What is this?: This file acts as the map for our entire application. 
// Instead of jumping between standard HTML files (which reloads the whole 
// browser and makes the site slow), React Router instantly swaps these 
// components in and out, making the IN-SEC platform feel incredibly fast.
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
                {/* path="/" is the default homepage when the site first loads */}
                <Route path="/" element={<LandingPageINSEC />} />
                <Route path="/sign-in-page" element={<SignIn />} />

                {/* -------------------------------------------------- */}
                {/* ADMIN ROUTES                                       */}
                {/* -------------------------------------------------- */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/game-management" element={<GameManagement />} />
                <Route path="/student-account-management" element={<StudentAccountManagement />} />
                <Route path="/student-assessment" element={<StudentAssessment />} />
                <Route path="/student-game-progress" element={<StudentGameProgress />} />

                {/* -------------------------------------------------- */}
                {/* SUPER ADMIN ROUTES                                 */}
                {/* -------------------------------------------------- */}
                <Route path="/student-account-management-sa" element={<StudentAccountManagementSA />} />
                <Route path="/teacher-account-management" element={<TeacherAccountManagement />} />

            </Routes>
        </Router>
    );
}

export default App;