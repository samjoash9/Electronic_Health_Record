import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import VitalSigns from './VitalSigns';
import PastMedicalHistory from './PastMedicalHistory';
import FamilyMedicalHistory from './FamilyMedicalHistory';
import SocialHistory from './SocialHistory';
import RecommendedDiagnosticTest from './RecommendedDiagnosticTest';
import PhysicianCertification from './PhysicianCertification';

export default function WellnessRecordForm({ phoData, onCancel, onSave }) {
    const [wellnessResponse, setWellnessResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editable state for manual or existing patient entries
    const [patientInfo, setPatientInfo] = useState({
        lastName: phoData?.lastName || '',
        firstName: phoData?.firstName || '',
        middleName: phoData?.middleName || '',
        birthdate: phoData?.birthdate || '',
        age: phoData?.age || '',
        sex: phoData?.sex || '',
        civilStatus: phoData?.civilStatus || 'Single',
        address: phoData?.address || '',
    });

    const isManualEntry = !phoData?.patientID;

    useEffect(() => {
        const patientId = phoData?.patientID;

        if (!patientId) {
            setIsLoading(false);
            setWellnessResponse(null);
            return;
        }

        axios.get(`/api/WellnessForms/${patientId}`)
            .then(response => {
                setWellnessResponse(response.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Could not fetch specific wellness form.", err);
                setIsLoading(false);
            });
    }, [phoData]);

    const handlePatientInfoChange = (field, value) => {
        setPatientInfo(prev => ({ ...prev, [field]: value }));
    };

    // FUNCTIONAL SAVE HANDLER TO UPDATE THE DATABASE
    const handleSaveRecord = async () => {
        setIsSaving(true);

        const patientId = phoData?.patientID;

        // Construct payload matching your backend DTO expectations
        const payload = {
            status: "Saved",
            patientID: patientId || null,
            physicianID: wellnessResponse?.form?.physicianID || 1,
            formDate: new Date().toISOString(),
            weightKg: wellnessResponse?.form?.weightKg || null,
            heightCm: wellnessResponse?.form?.heightCm || null,
            bmi: wellnessResponse?.form?.bmi || null,
            idealBMI: wellnessResponse?.form?.idealBMI || null,
            bpSystolic: wellnessResponse?.form?.bpSystolic || null,
            bpDiastolic: wellnessResponse?.form?.bpDiastolic || null,
            tempCelsius: wellnessResponse?.form?.tempCelsius || null,
            heartRate: wellnessResponse?.form?.heartRate || null,
            respRate: wellnessResponse?.form?.respRate || null,
            recommendedDiagnosticTest: wellnessResponse?.form?.recommendedDiagnosticTest || null,
            impressionClinical: wellnessResponse?.form?.impressionClinical || null,
            managementTreatment: wellnessResponse?.form?.managementTreatment || null,
            createdByAdminID: 1,
            pastMedicalHistory: wellnessResponse?.pastMedicalHistory || [],
            familyMedicalHistory: wellnessResponse?.familyMedicalHistory || [],
            socialHistory: wellnessResponse?.socialHistory || null,
            // If it's a manual entry, include patient details so backend can create or link them
            newPatientInfo: isManualEntry ? patientInfo : null
        };

        try {
            if (isManualEntry || !patientId) {
                // POST for creating a brand-new record
                await axios.post(`http://localhost:5084/api/WellnessForms`, payload);
                alert("New wellness record successfully created and saved!");
            } else {
                // PUT for updating an existing record
                await axios.put(`http://localhost:5084/api/WellnessForms/${patientId}`, payload);
                alert("Wellness record successfully updated!");
            }
            if (onSave) onSave();
            onCancel();
        } catch (error) {
            console.error("Failed to save wellness record:", error);
            alert("Error saving record. Please verify your backend server connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const formStatus = wellnessResponse?.form?.status || 'Draft';
    const isSubmitted = formStatus.toLowerCase() === 'submitted';

    const handleCloseClick = () => {
        if (window.confirm("Are you sure you want to close? Any unsaved changes will be lost.")) {
            onCancel();
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-10">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-[#0F2756] text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold tracking-wide uppercase">
                        Electronic Health Care Wellness Record
                    </h2>
                    <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-2xs ${isSubmitted ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-gray-900'
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
                                    <i>Patient Information</i> {isManualEntry && <span className="text-xs text-teal-600 font-normal">(New Manual Entry)</span>}
                                </h3>
                            </div>
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Surname</label>
                                    <input
                                        type="text"
                                        value={patientInfo.lastName}
                                        onChange={(e) => handlePatientInfoChange('lastName', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.firstName}
                                        onChange={(e) => handlePatientInfoChange('firstName', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.middleName}
                                        onChange={(e) => handlePatientInfoChange('middleName', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Birthdate</label>
                                    <input
                                        type="date"
                                        value={patientInfo.birthdate}
                                        onChange={(e) => handlePatientInfoChange('birthdate', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={patientInfo.age}
                                        onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sex</label>
                                    <input
                                        type="text"
                                        value={patientInfo.sex}
                                        onChange={(e) => handlePatientInfoChange('sex', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Civil Status</label>
                                    <input
                                        type="text"
                                        value={patientInfo.civilStatus}
                                        onChange={(e) => handlePatientInfoChange('civilStatus', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={patientInfo.address}
                                        onChange={(e) => handlePatientInfoChange('address', e.target.value)}
                                        disabled={!isManualEntry}
                                        className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clinical Sections */}
                        <VitalSigns data={wellnessResponse?.form} />
                        <PastMedicalHistory data={wellnessResponse?.pastMedicalHistory} />
                        <FamilyMedicalHistory data={wellnessResponse?.familyMedicalHistory} />
                        <SocialHistory data={wellnessResponse?.socialHistory} />
                        <RecommendedDiagnosticTest data={wellnessResponse?.form} />
                        <PhysicianCertification data={wellnessResponse?.form} />
                    </>
                )}

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={handleSaveRecord}
                        disabled={isSaving}
                        className="uppercase w-full sm:w-auto flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold shadow-sm cursor-pointer flex items-center justify-center"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save
                    </button>
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer">
                            Save as Draft
                        </button>
                        <button onClick={handleCloseClick} className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}