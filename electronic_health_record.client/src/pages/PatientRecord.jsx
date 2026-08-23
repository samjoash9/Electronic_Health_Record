import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Plus, MoreVertical, ShieldAlert, Loader2 } from 'lucide-react';
import { mockDataFallback } from '../data/mockPatients';
import WellnessRecordForm from '../components/common/WellnessRecordForm';

export default function PatientRecord() {
    const [activeTab, setActiveTab] = useState('Active Patients');
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tracks which patient was clicked to open the modal
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        axios.get('https://localhost:7000/api/patients')
            .then(response => {
                setPatients(response.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Backend not reached. Using mock data instead.");
                setError("Cannot connect to server. Displaying offline mock data.");
                setPatients(mockDataFallback);
                setIsLoading(false);
            });
    }, []);

    const handlePatientClick = (patient) => {
        const nameParts = patient.name.split(' ');
        const demoParts = patient.demographics.split(',');

        const formattedPhoData = {
            firstName: nameParts[0] || '',
            lastName: nameParts[1] || '',
            middleName: "",
            sex: demoParts[0] ? demoParts[0].trim() : '',
            age: demoParts[1] ? parseInt(demoParts[1]) : '',
            birthdate: "1981-01-01",
            civilStatus: "Single",
            address: "Patin-ay, Prosperidad, Agusan del Sur",
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

            <div className="flex border-b border-gray-200 mb-6 space-x-8">
                {['Active Patients', 'Archived Records'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-semibold transition-colors focus:outline-none ${activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-800">{patients.length}</span>
                            )}
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Patients</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>Add Patient</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {/* Changed Header to '#' */}
                                <th className="py-4 pl-6 pr-4 w-12 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Visit</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Condition</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="py-10 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                            <p>Loading patient records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                // Added 'index' here to generate the numbers
                                patients.map((patient, index) => (
                                    <tr
                                        key={patient.id}
                                        onClick={() => handlePatientClick(patient)}
                                        className="hover:bg-blue-50 transition-colors group cursor-pointer"
                                    >
                                        {/* Replaced Checkbox with Row Number */}
                                        <td className="py-4 pl-6 pr-4 text-center">
                                            <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                                {index + 1}
                                            </span>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <img src={patient.avatar || "https://ui-avatars.com/api/?name=" + patient.name} alt={patient.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
                                                    <p className="text-xs text-gray-400">{patient.demographics}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-sm font-medium text-gray-700">{patient.phone}</p>
                                            <a className="text-xs text-blue-600">{patient.email}</a>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-medium text-gray-600">{patient.lastVisit}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm text-gray-700 truncate block max-w-[200px]" title={patient.condition}>
                                                {patient.condition}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${patient.status === 'PRIORITY'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {patient.status}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}