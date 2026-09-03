import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ROLES } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layout/MainLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import PatientRecord from './pages/records/PatientRecord';
import Employee from './pages/admin/Employee';
import ActivityPage from './pages/ActivityPage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />

                    {/* All Authenticated Protected Routes wrapped in MainLayout */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            {/* Dashboard - visible to all authenticated users */}
                            <Route path="/dashboard" element={<Dashboard />} />

                            {/* Station 1, Station 2, Station 3 (Doctor), and Superadmin (Patient Medical Records) */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.STATION1, ROLES.STATION2, ROLES.DOCTOR]} />}>
                                <Route path="/patient-records" element={<PatientRecord />} />
                            </Route>

                            {/* Super Admin, Station 1, and Station 2 (Activity Logs) */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.STATION1, ROLES.STATION2]} />}>
                                <Route path="/activity" element={<ActivityPage />} />
                            </Route>

                            {/* Super Admin Only (Employee Management) */}
                            <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} />}>
                                <Route path="/employees" element={<Employee />} />
                                <Route path="/employee" element={<Navigate to="/employees" replace />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}