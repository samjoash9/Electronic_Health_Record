import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import VitalSigns from './VitalSigns';
import PastMedicalHistory from './PastMedicalHistory';
import FamilyMedicalHistory from './FamilyMedicalHistory';
import SocialHistory from './SocialHistory';
import RecommendedDiagnosticTest from './RecommendedDiagnosticTest';
import PhysicianCertification from './PhysicianCertification';

export default function WellnessRecordForm({ phoData, onCancel }) {
    const [wellnessResponse, setWellnessResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const patientId = phoData?.patientID || phoData?.id || 1;

        axios.get(`http://localhost:5084/api/WellnessForms/${patientId}`)
            .then(response => {
                setWellnessResponse(response.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Could not fetch specific wellness form.", err);
                setIsLoading(false);
            });
    }, [phoData]);

    // Extract status safely from backend response (defaults to 'Draft' if not found)
    const formStatus = wellnessResponse?.form?.status || 'Draft';
    const isSubmitted = formStatus.toLowerCase() === 'submitted';

    // Smart Close Handler with Confirmation Prompt
    const handleCloseClick = () => {
        const confirmClose = window.confirm(
            "Are you sure you want to close? Any unsaved changes will be lost unless saved as a draft."
        );
        if (confirmClose) {
            onCancel();
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-10">

            {/* HEADER WITH DYNAMIC STATUS BADGE */}
            <div className="p-4 border-b border-gray-200 bg-[#0F2756] text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold tracking-wide uppercase">
                        Electronic Health Care Wellness Record
                    </h2>
                    <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-2xs ${isSubmitted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-400 text-gray-900'
                        }`}>
                        {formStatus}
                    </span>
                </div>
                <button onClick={handleCloseClick} className="hover:bg-blue-800 p-1 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                        <p className="text-sm text-gray-500">Loading patient clinical details...</p>
                    </div>
                ) : (
                    <>
                        {/* Patient Information Box */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                <h3 className="text-md font-bold text-gray-800">
                                    <i>Patient Information</i>
                                </h3>
                            </div>
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Surname</label>
                                    <input type="text" value={phoData?.lastName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                                    <input type="text" value={phoData?.firstName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Middle Name</label>
                                    <input type="text" value={phoData?.middleName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Birthdate</label>
                                    <input type="date" value={phoData?.birthdate || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
                                    <input type="number" value={phoData?.age || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sex</label>
                                    <input type="text" value={phoData?.sex || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Civil Status</label>
                                    <input type="text" value={phoData?.civilStatus || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                    <input type="text" value={phoData?.address || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* PASS DATA SLICES TO CHILD COMPONENTS */}
                        <VitalSigns data={wellnessResponse?.form} />
                        <PastMedicalHistory data={wellnessResponse?.pastMedicalHistory} />
                        <FamilyMedicalHistory data={wellnessResponse?.familyMedicalHistory} />
                        <SocialHistory data={wellnessResponse?.socialHistory} />
                        <RecommendedDiagnosticTest data={wellnessResponse?.form} />
                        <PhysicianCertification data={wellnessResponse?.form} />
                    </>
                )}

                {/* FOOTER ACTION BUTTONS WITH TEAL SUBMIT BUTTON */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-3">
                    <button className="cursor-pointer  uppercase w-full sm:w-auto flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold shadow-sm">
                        Submit 
                    </button>
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <button className="cursor-pointer w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                            Save as Draft
                        </button>
                        <button onClick={handleCloseClick} className="cursor-pointer  w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}