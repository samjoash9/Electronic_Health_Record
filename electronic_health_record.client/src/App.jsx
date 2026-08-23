import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Pages
import MainLayout from './layout/MainLayout';
import LandingPage from './pages/LandingPage'; // Your public landing/login page
import Dashboard from './pages/Dashboard';
import PatientRecord from './pages/PatientRecord';
import Appointment from './pages/Appointment';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/*LANDING PAGE LOGIN */}
                <Route path="/" element={<LandingPage />} />

                {/* ROUTES PAGES*/}
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/patient-records" element={<PatientRecord />} />
                    <Route path="/appointment" element={<Appointment />} />
                </Route>

                {/* Fallback catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}