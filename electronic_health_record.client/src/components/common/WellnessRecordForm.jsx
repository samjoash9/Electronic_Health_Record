import React from 'react';
import { X } from 'lucide-react';
import VitalSigns from './VitalSigns';
import PastMedicalHistory from './PastMedicalHistory';
import FamilyMedicalHistory from './FamilyMedicalHistory';
// 1. Import the new components
import SocialHistory from './SocialHistory';
import RecommendedDiagnosticTest from './RecommendedDiagnosticTest';
import PhysicianCertification from './PhysicianCertification';

export default function WellnessRecordForm({ phoData, onCancel }) {
    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-10">

            <div className="p-4 border-b border-gray-200 bg-[#0F2756] text-white flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-wide uppercase"> 
                    Electronic Health Care Wellness Record
                </h2>
                <button onClick={onCancel} className="hover:bg-blue-800 p-1 rounded-md transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6">
                {/* SECTION 1: Patient Information */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h3 className="text-md font-bold text-gray-800">
                            <i>Patient Information</i>
                        </h3>
                    </div>
                    <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Surname</label>
                            <input type="text" value={phoData?.lastName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                            <input type="text" value={phoData?.firstName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Middle Name</label>
                            <input type="text" value={phoData?.middleName || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Birthdate</label>
                            <input type="date" value={phoData?.birthdate || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
                            <input type="number" value={phoData?.age || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sex</label>
                            <input type="text" value={phoData?.sex || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Civil Status</label>
                            <input type="text" value={phoData?.civilStatus || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                            <input type="text" value={phoData?.address || ''} disabled className="w-full p-2 border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-sm" />
                        </div>
                    </div>
                </div>

                <VitalSigns />
                <PastMedicalHistory />
                <FamilyMedicalHistory />
                <SocialHistory />
                <RecommendedDiagnosticTest />
                <PhysicianCertification />

                {/* 3. Updated Footer Actions based on your latest mockup */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-3">
                    <button className="w-full sm:w-auto flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm">
                        Submit
                    </button>
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                            Save as Draft
                        </button>
                        <button onClick={onCancel} className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                            Cancel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}