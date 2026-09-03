import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Aside from './Aside';
import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
    const { user, switchRoleForTesting } = useAuth() || {};

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-100">
            {/* Left Sidebar */}
            <Aside currentRole={user?.role} />

            {/* Right Content Area */}
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                <Header
                    user={user}
                    currentRole={user?.role}
                    onRoleChange={switchRoleForTesting}
                />

                {/* Main Content Area (Scrollable) */}
                <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}