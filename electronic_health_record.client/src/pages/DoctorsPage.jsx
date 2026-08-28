import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, X, Loader2, Award, User, Hash } from 'lucide-react';

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // FIX: Match the exact property casing of the C# CreatePhysicianDto
    const [formData, setFormData] = useState({
        surname: '',
        firstName: '',
        middleName: '',
        PRCLicenseNo: ''
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://localhost:7165/api/Physicians');
            const data = Array.isArray(response.data) ? response.data : response.data.data || response.data.items || [];
            setDoctors(data);
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Send the exact payload to the backend
            await axios.post('https://localhost:7165/api/Physicians', formData);

            // Refresh list and reset form on success
            await fetchDoctors();
            setShowAddModal(false);
            setFormData({ surname: '', firstName: '', middleName: '', PRCLicenseNo: '' });
            alert("Doctor successfully added!");

        } catch (error) {
            console.error("Backend Error Details:", error.response || error);

            const serverMessage = error.response?.data;
            alert(typeof serverMessage === 'string'
                ? `Server rejected it: ${serverMessage}`
                : "The server crashed (500 Error). Please check the console and inform the backend developer.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 relative">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Medical Staff Directory</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage attending physicians and professional profiles.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                        <span>{doctors.length} Registered Doctors</span>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Doctor
                    </button>
                </div>
            </div>

            {/* DOCTORS GRID */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Loading physician directory...</p>
                </div>
            ) : doctors.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No Doctors Found</h3>
                    <p className="text-sm text-slate-500 mt-1">Click "Add Doctor" to register your first physician.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doc, index) => (
                        <div
                            key={doc.physicianID || index}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-teal-400 transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl shadow-sm">
                                        {doc.firstName?.charAt(0) || ''}{doc.surname?.charAt(0) || ''}
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700">
                                        Active
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                                    Dr. {doc.firstName} {doc.middleName ? doc.middleName.charAt(0) + '.' : ''} {doc.surname}
                                </h3>
                                <p className="text-xs font-medium text-teal-600 mt-1 flex items-center">
                                    <Award className="w-3.5 h-3.5 mr-1" /> General Physician
                                </p>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 flex items-center">
                                        <Hash className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        PRC License: <span className="font-bold text-slate-700 ml-1">{doc.prcLicenseNo || 'N/A'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD DOCTOR MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200">

                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">Register New Physician</h2>
                                <p className="text-xs text-slate-300 mt-0.5">Enter the professional details below.</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDoctor} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Juan"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Surname *</label>
                                    <input
                                        type="text"
                                        name="surname"
                                        required
                                        value={formData.surname}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Dela Cruz"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        name="middleName"
                                        value={formData.middleName}
                                        onChange={handleInputChange}
                                        placeholder="Optional"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">PRC License No. *</label>
                                    <input
                                        type="text"
                                        name="PRCLicenseNo" // IMPORTANT: Match state key!
                                        required
                                        value={formData.PRCLicenseNo}
                                        onChange={handleInputChange}
                                        placeholder="0000000"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm cursor-pointer disabled:opacity-70"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {isSaving ? 'Saving...' : 'Save Physician'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}