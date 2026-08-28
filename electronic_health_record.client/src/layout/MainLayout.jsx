import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Aside from './Aside';
// import Footer from './Footer';

export default function MainLayout() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-100">
            {/* Left Sidebar */}
            <Aside />

            {/* Right Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />

                {/* Main Content Area (Scrollable) */}
                <main className="flex flex-col flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6">
                    <div className="flex-1">
                        {/* Outlet dynamically renders whatever child route matches the URL */}
                        <Outlet />
                    </div>

                    <div className="mt-8">
                        {/* <Footer /> */}
                    </div>
                </main>
            </div>
        </div>
    );
}