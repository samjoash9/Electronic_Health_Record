import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, ArchiveRestore, ShieldAlert, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Toast from '../common/Toast';

export default function ArchivedTabs() {
    const [archivedRecords, setArchivedRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'success' });

    // PAGINATION STATES
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Reset to page 1 whenever search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    useEffect(() => {
        fetchArchivedRecords();
    }, []);

    const fetchArchivedRecords = async () => {
        setIsLoading(true);
        try {
            // Adjust this endpoint to your C# backend's archived route
            const res = await axios.get('http://localhost:5084/api/WellnessForms/archived');
            setArchivedRecords(Array.isArray(res.data) ? res.data : (res.data.items || res.data.data || []));
        } catch (error) {
            console.error("Failed to fetch archived records:", error);
            // Mock data so you can see the UI immediately if the endpoint isn't built yet
            setArchivedRecords([
                { formID: 101, firstName: 'John', surname: 'Doe', contactNo: '09171234567', archivedAt: '2023-11-01T10:00:00Z', reason: 'Discharged' },
                { formID: 102, firstName: 'Jane', surname: 'Smith', contactNo: '09181234567', archivedAt: '2023-12-15T14:30:00Z', reason: 'Transferred' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (id) => {
        if (!window.confirm("Are you sure you want to restore this record to the active list?")) return;

        try {
            // Adjust this endpoint to match your C# restore logic
            await axios.put(`http://localhost:5084/api/WellnessForms/${id}/restore`);
            setToast({ message: 'Record successfully restored!', type: 'success' });
            fetchArchivedRecords();
        } catch (error) {
            console.error("Failed to restore record:", error);
            setToast({ message: 'Error restoring record. Check server connection.', type: 'error' });
        }
    };

    // Filter Logic
    const filteredRecords = archivedRecords.filter(record => {
        const fullName = `${record.firstName || ''} ${record.surname || ''}`.toLowerCase();
        const contactInfo = (record.contactNo || record.contact || '').toLowerCase();

        return fullName.includes(searchQuery.toLowerCase()) || contactInfo.includes(searchQuery.toLowerCase());
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

    return (
        <div className="w-full relative animate-in fade-in duration-300">
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: 'success' })}
            />

            {/* TABLE CONTAINER */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">

                {/* TOOLBAR */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <ArchiveRestore className="w-5 h-5" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                            ) : (
                                <span className="text-2xl font-bold text-slate-800">{filteredRecords.length}</span>
                            )}
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">Archived Forms</span>
                        </div>
                    </div>

                    <div className="relative min-w-[260px]">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or contact..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-2xs"
                        />
                    </div>
                </div>

                {/* DATA TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-slate-50">
                                <th className="py-4 pl-6 pr-4 w-12 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Archived</th>
                                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                                        <p>Loading archived records...</p>
                                    </td>
                                </tr>
                            ) : currentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                        <ShieldAlert className="w-8 h-8 text-slate-300 mb-2 mx-auto mt-6" />
                                        <p className="mb-6">No archived records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                currentRecords.map((record, index) => {
                                    const archivedDate = record.archivedAt || record.ArchivedAt || record.updatedAt || null;
                                    const contactInfo = record.contactNo || record.contact || 'N/A';

                                    return (
                                        <tr key={record.formID || record.patientID || index} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-4 pl-6 pr-4 text-center">
                                                <span className="text-sm font-bold text-gray-400">{indexOfFirstItem + index + 1}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-semibold text-slate-900">{record.firstName} {record.surname}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-medium text-slate-600">{contactInfo}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {archivedDate ? new Date(archivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-200 text-slate-700">
                                                    Archived
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        title="View Record Details"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestore(record.formID || record.patientID)}
                                                        title="Restore to Active"
                                                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                                                    >
                                                        <ArchiveRestore className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {!isLoading && filteredRecords.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredRecords.length)}</span> of <span className="font-semibold text-gray-900">{filteredRecords.length}</span> entries
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Rows per page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-1.5 cursor-pointer outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium text-gray-700 px-3">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}