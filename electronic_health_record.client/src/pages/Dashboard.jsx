import React from 'react';
import {
    Users,
    Calendar,
    Clock,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    UserCheck,
    FileText,
    CheckCircle2,
    MessageSquareHeart,
} from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="w-full max-w-7xl mx-auto pb-10 space-y-6">

            {/* TOP HEADER & QUICK ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Dashboard</h1>
                    <p className="text-sm text-slate-500">Welcome back, Dr. Meljun Makunat — Agusan del Sur Provincial Hospital</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                        <Calendar className="w-4 h-4" />
                        <span>New Appointment</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>Schedule Availability</span>
                    </button>
                </div>
            </div>

            {/* TOP ROW: 3 KEY METRIC CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Appointments</span>
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">658</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3 mr-1" /> +95%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">+21% vs in last 7 days</p>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Face To Face Consultations</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <MessageSquareHeart className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">125</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            <TrendingDown className="w-3 h-3 mr-1" /> -15%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">+21% vs in last 7 days</p>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelled Appointments</span>
                        <div className="p-2 bg-yellow-50 text-yellow-600  rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-4">
                        <h3 className="text-3xl font-black text-slate-900">35</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3 mr-1" /> +45%
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">+31% vs in last 7 days</p>
                </div>

            </div>

            {/* SECOND ROW: UPCOMING APPOINTMENT PREVIEW & ANALYTICS CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Upcoming Appointment Card */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Upcoming Appointments</h3>
                            <span className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full">Today</span>
                        </div>

                        {/* Patient info box */}
                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                            <img
                                src="https://ui-avatars.com/api/?name=Andrew+Billard&background=0f172a&color=2dd4bf&bold=true"
                                alt="Patient"
                                className="w-12 h-12 rounded-full object-cover border border-teal-500"
                            />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Andrew Billard</h4>
                                <p className="text-xs text-slate-400 font-mono">#AP455698</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-400 font-medium">Reason / Visit</span>
                                <span className="font-bold text-slate-800">General Checkup</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-400 font-medium">Date & Time</span>
                                <span className="font-bold text-slate-800">Mon, 31 Mar 2026 • 06:30 PM</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-400 font-medium">Department</span>
                                <span className="font-bold text-slate-800">Cardiology</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-slate-400 font-medium">Type</span>
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded">Face to Face Consultation</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right: Appointments Analytics Chart Mock */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Appointments Overview</h3>
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
                            <span>Total Appointments</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-teal-500/30 rounded-sm"></span>
                            <span>Completed Appointments</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* THIRD ROW: 6 SMALL METRIC CARDS AT THE BOTTOM */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Users className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Patient</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">658</h4>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+31% Last Week</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <MessageSquareHeart className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Face To Face Consult</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">256</h4>
                    <span className="text-[10px] text-rose-600 font-bold mt-1 block">-21% Last Week</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Clock className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Rescheduled</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">141</h4>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+64% Last Week</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <FileText className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Pre Bookings</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">524</h4>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+38% Last Week</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <UserCheck className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Walk-in Bookings</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">21</h4>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+95% Last Week</span>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mb-2" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Follow Ups</span>
                    <h4 className="text-xl font-black text-slate-900 mt-1">451</h4>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+76% Last Week</span>
                </div>

            </div>

        </div>
    );
}