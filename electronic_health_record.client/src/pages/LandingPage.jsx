import React from 'react';
import Login from '../components/common/Login'; // Adjust path based on your folders
import { Activity, Shield, Users, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">

            {/* Background Decorative Gradients */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Navbar */}
            <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl font-black tracking-wide">
                        e<span className="text-teal-400">HPR</span> SYSTEM
                    </span>
                </div>
            </header>

            {/* Main Hero Grid */}
            <main className="w-full max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">

                {/* Left Column: Value Proposition for Doctors */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-teal-400 text-xs font-semibold tracking-wider">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <span><i>e</i>HR SOLUTION</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                        Modernizing Patient Wellness & <span className="text-teal-400">Clinical Records.</span>
                    </h1>

                    <p className="text-slate-400 text-base sm:text-lg max-w-xl">
                        A seamless, fast, and secure platform built for medical professionals to manage patient demographics, track live vital signs with WHO metrics, and certify records effortlessly.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-white">Smart Auto-Calculations</h3>
                                <p className="text-xs text-slate-400">Instant BMI and diagnostic drug lookups.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-white">Digital Signatures</h3>
                                <p className="text-xs text-slate-400">Secure lock-by-default canvas authentication.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: The Login Component */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                    <Login />
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500 z-10">
                POWERED BY SAMIELOB 2026 • Electronic Health Care Wellness Record
            </footer>

        </div>
    );
}