import React, { useState } from 'react';
import {
    Activity,
    Search,
    FileText,
    ShieldAlert,
    Clock,
} from 'lucide-react';
import { logs } from '../data/mockActivityLogs';

export default function ActivityPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    

    // Filter logic
    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.admin.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedFilter === 'ALL' || log.category === selectedFilter;
        return matchesSearch && matchesCategory;
    });

    // Icon switcher based on category
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'PATIENT':
                return <FileText className="w-4 h-4 text-teal-600" />;
            case 'SECURITY':
                return <ShieldAlert className="w-4 h-4 text-orange-500" />;
            case 'SYSTEM':
                return <Activity className="w-4 h-4 text-blue-500" />;
            default:
                return <Clock className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Activity Logs & Audit Trail</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Monitor administrative changes, security events, and clinical record updates.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Tracking Active</span>
                </div>
            </div>

            {/* Toolbar: Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search logs by action, details, or admin name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                    />
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'PATIENT', 'SECURITY', 'SYSTEM'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedFilter(cat)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${selectedFilter === cat
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="py-3.5 px-6">Event / Action</th>
                                <th className="py-3.5 px-4">Description</th>
                                <th className="py-3.5 px-4">Admin / User</th>
                                <th className="py-3.5 px-4">Timestamp</th>
                                <th className="py-3.5 px-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 flex-shrink-0">
                                                    {getCategoryIcon(log.category)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{log.action}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{log.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-semibold text-slate-800">{log.admin}</p>
                                            <p className="text-xs text-slate-400">{log.role}</p>
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                                            {log.timestamp}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${log.status === 'SUCCESS'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400">
                                        <p className="font-medium">No activity logs found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}