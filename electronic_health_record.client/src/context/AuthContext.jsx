import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
    SUPERADMIN: 'superadmin',
    STATION1: 'station1',     // Vitals & Demographic Intake
    STATION2: 'station2',     // Mental Health Assessment
    DOCTOR: 'doctor',         // Consultation & Sign-off
    PATIENT: 'patient'        // Self-Service Record Viewer
};

// HARDCODED MOCK DATABASE FOR FRONTEND TESTING
const MOCK_USERS = {
    'super@ehpr.local': { id: 1, name: 'Root Superadmin', role: ROLES.SUPERADMIN, email: 'super@ehpr.local' },
    'station1@ehpr.local': { id: 2, name: 'Nurse Sarah', role: ROLES.STATION1, email: 'station1@ehpr.local' },
    'station2@ehpr.local': { id: 3, name: 'Assessor Mike', role: ROLES.STATION2, email: 'station2@ehpr.local' },
    'doctor@ehpr.local': { id: 4, name: 'Dr. Smith', role: ROLES.DOCTOR, email: 'doctor@ehpr.local', prcLicense: '0098765' },
    'patient@ehpr.local': { id: 5, name: 'John Doe', role: ROLES.PATIENT, email: 'patient@ehpr.local' },
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if we already logged in during a previous refresh
        const storedUser = localStorage.getItem('ehpr_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // Simulate a tiny network delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 600));

        const mockUser = MOCK_USERS[email.toLowerCase()];

        if (mockUser) {
            // Success! Save to local storage
            localStorage.setItem('ehpr_user', JSON.stringify(mockUser));
            setUser(mockUser);
            return { success: true };
        } else {
            // Failed
            return {
                success: false,
                message: 'Account not found. Use the test emails provided below.'
            };
        }
    };

    const switchRoleForTesting = (roleKey) => {
        const roleEmailMap = {
            [ROLES.SUPERADMIN]: 'super@ehpr.local',
            [ROLES.STATION1]: 'station1@ehpr.local',
            [ROLES.STATION2]: 'station2@ehpr.local',
            [ROLES.DOCTOR]: 'doctor@ehpr.local',
            [ROLES.PATIENT]: 'patient@ehpr.local'
        };

        const targetUser = MOCK_USERS[roleEmailMap[roleKey]];
        if (targetUser) {
            localStorage.setItem('ehpr_user', JSON.stringify(targetUser));
            setUser(targetUser);
        }
    };

    const logout = () => {
        localStorage.removeItem('ehpr_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, switchRoleForTesting, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);