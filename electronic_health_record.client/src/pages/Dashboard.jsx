import React from 'react';
import {
    ContactRound,
    Users,
    MessageSquareHeart,
} from 'lucide-react';

export default function Dashboard() {
    const currentUser = {
        name: "MelJun Makunat",
        role: "Nurse",
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 space-y-6">

            {/* TOP HEADER & QUICK ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{currentUser.role} Dashboard</h1>
                    <p className="text-sm text-slate-500">Welcome back, {currentUser.role} {currentUser.name} — Agusan del Sur Provincial Hospital</p>
                </div>

            </div>

            {/* TOP ROW: 3 KEY METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">658</h3>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Health Record</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <MessageSquareHeart className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">125</h3>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Doctor's</span>
                        <div className="p-2 bg-yellow-50 text-yellow-600  rounded-xl">
                            <ContactRound className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">35</h3>
                    </div>
                </div>

            </div>

            {/* SECOND ROW: UPCOMING APPOINTMENT PREVIEW & ANALYTICS CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Right: Appointments Analytics Chart Mock */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Patient's Overview</h3>
                            <p className="text-xs text-slate-400">Monthly breakdown of total vs completed visits</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">Monthly</span>
                    </div>

                    {/* Visual Bar Representation */}
                    <div className="h-64 flex items-end justify-between gap-2 px-2 pt-8 pb-2 border-b border-slate-100">
                        {[
                            { month: 'Jan', total: '80%', completed: '60%' },
                            { month: 'Feb', total: '60%', completed: '45%' },
                            { month: 'Mar', total: '70%', completed: '55%' },
                            { month: 'Apr', total: '85%', completed: '70%' },
                            { month: 'May', total: '65%', completed: '50%' },
                            { month: 'Jun', total: '85%', completed: '75%' },
                            { month: 'Jul', total: '70%', completed: '55%' },
                            { month: 'Aug', total: '50%', completed: '40%' },
                            { month: 'Sep', total: '60%', completed: '50%' },
                            { month: 'Oct', total: '45%', completed: '35%' },
                            { month: 'Nov', total: '95%', completed: '85%' },
                            { month: 'Dec', total: '100%', completed: '90%' },
                        ].map((bar, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                {/* Tooltip on hover */}
                                <div className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {bar.month}: {bar.total} Volume
                                </div>
                                <div className="w-full max-w-[24px] bg-teal-500/20 rounded-t-lg group-hover:bg-teal-500/40 transition-colors flex items-end justify-center" style={{ height: bar.total }}>
                                    <div className="w-full bg-teal-600 rounded-t-lg transition-all" style={{ height: bar.completed }}></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold mt-2">{bar.month}</span>
                            </div>
                        ))}
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-teal-600 rounded-sm"></span>
                            <span>Total Patient's</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-teal-500/30 rounded-sm"></span>
                            <span>Completed Patient's</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}