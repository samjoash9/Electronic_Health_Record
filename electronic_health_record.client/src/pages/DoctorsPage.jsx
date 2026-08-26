import React, { useState } from 'react';
import {
    Calendar,
    Clock,
    Mail,
    Phone,
    X,
    ChevronRight,
} from 'lucide-react';
import { doctorsList } from '../data/mockDoctors'

export default function DoctorsPage() {
    // State to manage the currently selected doctor for the modal view
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 relative">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Medical Staff Directory</h1>
                    <p className="text-sm text-slate-500 mt-0.5">View attending physicians, professional profiles, and weekly clinic schedules.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>4 Active Doctors Listed</span>
                </div>
            </div>

            {/* DOCTORS GRID (6 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctorsList.map((doc) => (
                    <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-teal-400 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div>
                            {/* Top Badge & Avatar */}
                            <div className="flex items-start justify-between mb-4">
                                <img
                                    src={doc.avatar}
                                    alt={doc.name}
                                    className="w-16 h-16 rounded-full border-2 border-teal-500 object-cover shadow-sm"
                                />
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${doc.status === 'Online'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : doc.status === 'In Surgery'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {doc.status}
                                </span>
                            </div>

                            {/* Name & Specialty */}
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                                {doc.name}
                            </h3>
                            <p className="text-xs font-medium text-teal-600 mt-0.5">{doc.specialty}</p>

                            <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                                {doc.bio}
                            </p>
                        </div>

                        {/* Card Footer action */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-teal-600">
                            <span>View Profile & Schedule</span>
                            <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>

            {/* DOCTOR DETAILS & SCHEDULE MODAL */}
            {selectedDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-auto border border-slate-200">

                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-start relative">
                            <div className="flex items-space space-x-4">
                                <img
                                    src={selectedDoctor.avatar}
                                    alt={selectedDoctor.name}
                                    className="w-16 h-16 rounded-full border-2 border-teal-400 object-cover shadow-md"
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{selectedDoctor.name}</h2>
                                    <p className="text-xs text-teal-400 font-semibold mt-0.5">{selectedDoctor.specialty}</p>
                                    <p className="text-xs text-slate-300 mt-1">PRC License No: <span className="font-mono font-bold text-white">{selectedDoctor.prcNumber}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors focus:outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <Mail className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                    <span className="font-medium truncate">{selectedDoctor.email}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <Phone className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                    <span className="font-medium">{selectedDoctor.phone}</span>
                                </div>
                            </div>

                            {/* Bio Description */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Professional Background</h4>
                                <p className="text-sm text-slate-600">{selectedDoctor.bio}</p>
                            </div>

                            {/* Schedule Table */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5 text-teal-600" />
                                    Weekly Duty & Time Schedule
                                </h4>

                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wider">
                                                <th className="py-2.5 px-4">Day</th>
                                                <th className="py-2.5 px-4">Time Slot</th>
                                                <th className="py-2.5 px-4 text-right">Availability</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedDoctor.schedule.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 font-semibold text-slate-800">{item.day}</td>
                                                    <td className="py-3 px-4 text-slate-600 flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                        {item.hours}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Available'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedDoctor(null)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                                Close Profile
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}