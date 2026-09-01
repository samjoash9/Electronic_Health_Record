import React from 'react';
import { CalendarDays, Clock } from 'lucide-react';

export default function Appoinment() {
    return (
        <div className="w-full max-w-7xl mx-auto pb-10">

            {/* PAGE HEADER */}
            <div className="mb-6 pb-4 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">
                    Calendar & Scheduling
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Manage appointments and scheduling activities.
                </p>
            </div>

            {/* COMING SOON */}
            <div className="min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                <div className="text-center px-6">

                    {/* ICON */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                        <CalendarDays className="w-10 h-10 text-teal-600" />
                    </div>

                    {/* TITLE */}
                    <h2 className="text-3xl font-bold text-slate-900">
                        Soon to be Available
                    </h2>

                    {/* DESCRIPTION */}
                    <p className="max-w-md mx-auto mt-3 text-sm leading-6 text-slate-500">
                        The calendar and scheduling system is currently under
                        development. Appointment management and scheduling
                        features will be available here soon.
                    </p>

                    {/* STATUS */}
                    <div className="inline-flex items-center mt-6 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Coming Soon
                        </span>
                    </div>

                </div>
            </div>

        </div>
    );
}
