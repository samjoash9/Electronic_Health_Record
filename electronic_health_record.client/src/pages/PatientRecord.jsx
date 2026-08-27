import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Filter, Plus, MoreVertical, ShieldAlert, Loader2, Search, Check } from 'lucide-react';
import WellnessRecordForm from '../components/common/WellnessRecordForm';

export default function PatientRecord() {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // FILTER STATE: 'All', 'Submitted', or 'Draft'
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Tracks which patient was clicked to open the modal
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to calculate age from birthdate string
    const calculateAge = (birthdateString) => {
        if (!birthdateString) return '';
        const today = new Date();
        const birthDate = new Date(birthdateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        // Proxied to C# backend by Vite (see vite.config.js) — avoids cross-origin/CORS entirely
        axios.get('/api/patients')
            .then(response => {
                const patientData = Array.isArray(response.data)
                    ? response.data
                    : (response.data.data || []);

                setPatients(patientData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch patients from backend:", err);
                setError("Cannot connect to server. Please ensure your C# API is running.");
                setIsLoading(false);
            });
    }, []);

    // Combined filtering logic (Search query + Status dropdown filter)
    const filteredPatients = patients.filter(patient => {
        const fullName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.surname || ''}`.toLowerCase();
        const contact = (patient.contactNo || '').toLowerCase();
        const office = (patient.agencyOffice || '').toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch = fullName.includes(query) || contact.includes(query) || office.includes(query);

        // Status matching (assuming default status or mock property if applicable)
        const patientStatus = patient.status || 'Submitted';
        const matchesStatus = statusFilter === 'All' || patientStatus.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const handlePatientClick = (patient) => {
        const formattedPhoData = {
            patientID: patient.patientID,
            firstName: patient.firstName || '',
            lastName: patient.surname || '',
            middleName: patient.middleName || '',
            sex: patient.sex || '',
            age: calculateAge(patient.birthdate),
            birthdate: patient.birthdate ? patient.birthdate.split('T')[0] : '',
            civilStatus: patient.civilStatus || 'Single',
            address: patient.address || '',
        };

        setSelectedPatient(formattedPhoData);
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 relative">

            {/* MODAL OVERLAY */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
                    <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200">
                        <WellnessRecordForm
                            phoData={selectedPatient}
                            onCancel={() => setSelectedPatient(null)}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-800">{filteredPatients.length}</span>
                            )}
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Patients</span>
                        </div>
                    </div>

                    {/* SEARCH INPUT & CONTROLS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

                        {/* SEARCH INPUT BAR */}
                        <div className="relative min-w-[260px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, contact, office..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                            />
                        </div>

                        {/* INTERACTIVE FILTER DROPDOWN */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-2xs ${statusFilter !== 'All'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span>{statusFilter === 'All' ? 'Filters' : `Status: ${statusFilter}`}</span>
                            </button>

                            {isFilterDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Filter By Status
                                    </div>
                                    {['All', 'Submitted', 'Draft'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between transition-colors"
                                        >
                                            <span>{status}</span>
                                            {statusFilter === status && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>Add Patient</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-4 pl-6 pr-4 w-12 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Visit</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                            <p>Loading patient records from server...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-gray-400">
                                        <p>No matching patient records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient, index) => {
                                    const fullName = `${patient.firstName || ''} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.surname || ''}`.trim();
                                    const age = calculateAge(patient.birthdate);
                                    const demographics = `${patient.sex || 'N/A'}, ${age ? age + ' yrs' : 'N/A'}`;
                                    const lastVisitFormatted = patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

                                    return (
                                        <tr
                                            key={patient.patientID || index}
                                            onClick={() => handlePatientClick(patient)}
                                            className="hover:bg-blue-50 transition-colors group cursor-pointer"
                                        >
                                            <td className="py-4 pl-6 pr-4 text-center">
                                                <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                                    {index + 1}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                                                        <p className="text-xs text-gray-400">{demographics}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm font-medium text-gray-700">{patient.contactNo || 'N/A'}</p>
                                                <span className="text-xs text-gray-400">{patient.position || patient.agencyOffice || 'Patient'}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-medium text-gray-600">{lastVisitFormatted}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-700">
                                                    Submitted
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg focus:outline-none transition-colors"
                                                    title="More Actions"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}