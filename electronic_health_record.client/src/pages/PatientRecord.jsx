import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Filter, Plus, MoreVertical, ShieldAlert, Loader2, Search, Check, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import WellnessRecordForm from '../components/common/WellnessRecordForm';
import Toast from '../components/common/Toast';
import ArchivedTabs from '../components/common/ArchivedTabs';

// --- SUB-COMPONENT: PATIENT SELECTOR MODAL ---
function PatientSelectModal({ isOpen, onClose, patients, onSelectPatient }) {
    const [query, setQuery] = useState('');
    if (!isOpen) return null;

    const filtered = patients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.surname || ''}`.toLowerCase();
        return fullName.includes(query.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 bg-[#0F2756] text-white flex justify-between items-center">
                    <h3 className="text-md font-bold uppercase tracking-wide">Select Patient to Start Wellness Form</h3>
                    <button onClick={onClose} className="hover:bg-blue-800 p-1 rounded-md transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5">
                    <div className="relative mb-4">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="w-4 h-4" /></span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search system patients (e.g. Doe, John)..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
                        {filtered.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">
                                No matching patients found in the system registry.
                            </div>
                        ) : (
                            filtered.map(patient => (
                                <div key={patient.patientID} onClick={() => onSelectPatient(patient)} className="p-3 hover:bg-teal-50 cursor-pointer flex justify-between items-center transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{patient.surname}, {patient.firstName} {patient.middleName}</p>
                                        <p className="text-xs text-gray-400">Contact: {patient.contactNo || 'N/A'} | Office: {patient.agencyOffice || 'N/A'}</p>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-teal-100 text-teal-700 rounded-md">Create Form</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PatientRecord() {
    // TAB STATE
    const [activeTab, setActiveTab] = useState('active');

    // TEMPORARY DEV STATE: Role Switcher
    const [testRole, setTestRole] = useState('admin');

    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // FILTER STATES
    const [statusFilter, setStatusFilter] = useState('All');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // PAGINATION STATES
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isSelectingPatient, setIsSelectingPatient] = useState(false);
    const [pendingPatient, setPendingPatient] = useState(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'success' });

    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsFilterDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset to page 1 whenever filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, itemsPerPage]);

    const calculateAge = (birthdateString) => {
        if (!birthdateString) return '';
        const today = new Date();
        const birthDate = new Date(birthdateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const fetchPatients = () => {
        if (activeTab !== 'active') return;

        setIsLoading(true);
        axios.get('https://localhost:5084/api/WellnessForms')
            .then(res => {
                setPatients(Array.isArray(res.data) ? res.data : (res.data.data || []));
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch patients:", err);
                const serverMessage = err.response?.data;
                setError(typeof serverMessage === 'string' ? serverMessage : "Cannot connect to server. Ensure your C# API is running.");
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchPatients();
    }, [activeTab]);

    // Filter Logic
    const filteredPatients = patients.filter(patient => {
        const fullName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.surname || ''}`.toLowerCase();
        const contactInfo = (patient.contactNo || patient.contact || patient.ContactNo || '').toLowerCase();
        const currentStatus = (patient.status || patient.Status || 'Draft').toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || contactInfo.includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

    const handlePatientClick = (patient) => {
        setSelectedPatient({
            patientID: patient.patientID,
            firstName: patient.firstName || '',
            lastName: patient.surname || '',
            middleName: patient.middleName || '',
            sex: patient.sex || '',
            age: calculateAge(patient.birthdate),
            birthdate: patient.birthdate ? patient.birthdate.split('T')[0] : '',
            civilStatus: patient.civilStatus || 'Single',
            address: patient.address || '',
        });
    };

    const handleSelectPatientForNewForm = async (patient) => {
        setIsSelectingPatient(false);
        try {
            const res = await axios.get(`https://localhost:5084/api/WellnessForms/${patient.patientID}`);

            if (res.data && res.data.form) {
                setPendingPatient(patient);
                setShowDuplicateWarning(true);
            } else {
                handlePatientClick(patient);
            }
        } catch (error) {
            handlePatientClick(patient);
        }
    };

    const handleFormSave = (message, type) => {
        setToast({ message, type });
        if (type === 'success') {
            fetchPatients();
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 relative">
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: '', type: 'success' })}
            />

            {/* TAB NAVIGATION HEADER */}
            <div className="mb-6 pb-2 border-b border-gray-200">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'active'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Active Forms
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'archived'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Archived History
                    </button>
                </div>
            </div>

            {/* IF ACTIVE TAB IS SELECTED, RENDER THE NORMAL TABLE */}
            {activeTab === 'active' && (
                <div className="animate-in fade-in duration-300">
                    {selectedPatient && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                            <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200">
                                <WellnessRecordForm
                                    phoData={selectedPatient}
                                    onCancel={() => setSelectedPatient(null)}
                                    onSave={handleFormSave}
                                    userRole={testRole} // <-- ATTACHED DEV STATE HERE
                                />
                            </div>
                        </div>
                    )}

                    {/* Duplicate Warning Modal */}
                    {showDuplicateWarning && pendingPatient && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-6 text-center">
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Existing Record Found</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Patient <span className="font-semibold">{pendingPatient.surname}, {pendingPatient.firstName}</span> already has a wellness record. Redirect to it?
                                </p>
                                <div className="flex space-x-3">
                                    <button onClick={() => { setShowDuplicateWarning(false); handlePatientClick(pendingPatient); setPendingPatient(null); }} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors">Yes, Redirect</button>
                                    <button onClick={() => { setShowDuplicateWarning(false); setPendingPatient(null); }} className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors">No, Go Back</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <PatientSelectModal
                        isOpen={isSelectingPatient}
                        onClose={() => setIsSelectingPatient(false)}
                        patients={patients}
                        onSelectPatient={handleSelectPatientForNewForm}
                    />

                    {error && <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg flex items-center"><ShieldAlert className="w-4 h-4 mr-2" />{error}</div>}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><ShieldAlert className="w-5 h-5" /></div>
                                <div className="flex items-baseline space-x-2">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-teal-600" /> : <span className="text-2xl font-bold text-gray-800">{filteredPatients.length}</span>}
                                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Health Care Wellness Forms</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* SEARCH INPUT */}
                                <div className="relative min-w-[260px]">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="w-4 h-4" /></span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, contact, office..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-2xs"
                                    />
                                </div>

                                {/* FILTER DROPDOWN */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                        className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-2xs cursor-pointer ${statusFilter !== 'All'
                                            ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-xs'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-teal-50/50 hover:border-teal-200 hover:text-teal-700'
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
                                            {['All', 'Saved', 'Draft', 'Submitted'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => {
                                                        setStatusFilter(status);
                                                        setIsFilterDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 flex items-center justify-between transition-colors cursor-pointer"
                                                >
                                                    <span>{status}</span>
                                                    {statusFilter === status && <Check className="w-4 h-4 text-teal-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ADD FORM BUTTON */}
                                <button onClick={() => setIsSelectingPatient(true)} className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-600 rounded-lg text-sm font-medium text-white hover:bg-teal-700 transition-colors shadow-sm cursor-pointer">
                                    <Plus className="w-4 h-4" />
                                    <span>Add Form</span>
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
                                        <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Form Created</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Updated</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr><td colSpan="7" className="py-10 text-center text-gray-400"><Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" /><p>Loading patient records...</p></td></tr>
                                    ) : currentPatients.length === 0 ? (
                                        <tr><td colSpan="7" className="py-10 text-center text-gray-400"><p>No matching patient records found.</p></td></tr>
                                    ) : (
                                        currentPatients.map((patient, index) => {
                                            const createdDate = patient.createdAt || patient.formDate || patient.CreatedAt || patient.FormDate || null;
                                            const updatedDate = patient.updatedAt || patient.UpdatedAt || null;
                                            const contactInfo = patient.contactNo || patient.contact || patient.ContactNo || 'N/A';
                                            const currentStatus = patient.status || patient.Status || 'Draft';

                                            return (
                                                <tr key={patient.patientID || patient.formID || index} onClick={() => handlePatientClick(patient)} className="hover:bg-teal-50/40 transition-colors group cursor-pointer">
                                                    <td className="py-4 pl-6 pr-4 text-center"><span className="text-sm font-bold text-gray-400 group-hover:text-teal-600">{indexOfFirstItem + index + 1}</span></td>
                                                    <td className="py-4 px-4"><p className="text-sm font-semibold text-gray-900">{patient.firstName} {patient.surname}</p></td>
                                                    <td className="py-4 px-4"><p className="text-sm font-medium text-gray-700">{contactInfo}</p></td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {createdDate ? new Date(createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {updatedDate ? new Date(updatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded-full ${currentStatus.toLowerCase() === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
                                                            currentStatus.toLowerCase() === 'draft' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {currentStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4"><button onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {!isLoading && filteredPatients.length > 0 && (
                            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredPatients.length)}</span> of <span className="font-semibold text-gray-900">{filteredPatients.length}</span> entries
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
            )}

            {/* IF ARCHIVED TAB IS SELECTED, RENDER THE ARCHIVED COMPONENT */}
            {activeTab === 'archived' && (
                <ArchivedTabs />
            )}

            {/* TEMPORARY DEV TOOL: ROLE SWITCHER (Remove before production) */}
            <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-700 flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-teal-400">
                    Developer Mode: Test Role
                </label>
                <select
                    value={testRole}
                    onChange={(e) => setTestRole(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-600 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                    <option value="admin">Admin / Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="superadmin">Superadmin</option>
                </select>
            </div>

        </div>
    );
}