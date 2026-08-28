import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import VitalSigns from './VitalSigns';
import PastMedicalHistory from './PastMedicalHistory';
import FamilyMedicalHistory from './FamilyMedicalHistory';
import SocialHistory from './SocialHistory';
import RecommendedDiagnosticTest from './RecommendedDiagnosticTest';
import PhysicianCertification from './PhysicianCertification';
import CloseConfirmationModal from './CloseConfirmationModal';

export default function WellnessRecordForm({ phoData, onCancel, onSave }) {
    const isManualEntry = !phoData?.patientID && !phoData?.PatientID;
    const [isLoading, setIsLoading] = useState(!isManualEntry);
    const [isSaving, setIsSaving] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    const [clinicalData, setClinicalData] = useState({
        form: {},
        pastMedicalHistory: [],
        familyMedicalHistory: [],
        socialHistory: null
    });

    const [patientInfo, setPatientInfo] = useState({
        lastName: phoData?.lastName || phoData?.Surname || '',
        firstName: phoData?.firstName || '',
        middleName: phoData?.middleName || '',
        birthdate: phoData?.birthdate ? phoData.birthdate.split('T')[0] : '',
        age: phoData?.age || '',
        sex: phoData?.sex || '',
        civilStatus: phoData?.civilStatus || 'Single',
        address: phoData?.address || '',
    });

    const patientId = phoData?.patientID || phoData?.PatientID;

    useEffect(() => {
        if (!patientId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        axios.get(`/api/WellnessForms/${patientId}`)
            .then(response => {
                const resData = response.data || {};
                setClinicalData({
                    form: resData.form || {},
                    pastMedicalHistory: resData.pastMedicalHistory || [],
                    familyMedicalHistory: resData.familyMedicalHistory || [],
                    socialHistory: resData.socialHistory || null
                });
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Could not fetch specific wellness form, starting fresh.", err);
                setIsLoading(false);
            });
    }, [phoData, patientId]);

    const handlePatientInfoChange = (field, value) => {
        setPatientInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleFormChange = (updatedFields) => {
        setClinicalData(prev => ({ ...prev, form: { ...prev.form, ...updatedFields } }));
    };

    const handleSectionChange = (sectionName, data) => {
        setClinicalData(prev => ({ ...prev, [sectionName]: data }));
    };

    const submitForm = async (targetStatus) => {
        setIsSaving(true);
        const formId = clinicalData.form?.formID || clinicalData.form?.FormID;
        const isNewForm = !formId || formId === 0;

        // THE FIX: Explicitly map every property. This bypasses any spread operator bugs 
        // and guarantees the JSON strictly matches your C# UpdateWellnessFormDto.
        const payload = {
            status: targetStatus,
            patientID: patientId || null,
            physicianID: clinicalData.form?.physicianID || null,
            signature: clinicalData.form?.signature || null,
            formDate: clinicalData.form?.formDate || new Date().toISOString(),

            // Explicitly Map Vital Signs
            weightKg: clinicalData.form?.weightKg ?? null,
            heightCm: clinicalData.form?.heightCm ?? null,
            bmi: clinicalData.form?.bmi ?? null,
            idealBMI: clinicalData.form?.idealBMI ?? null,
            bpSystolic: clinicalData.form?.bpSystolic ?? null,
            bpDiastolic: clinicalData.form?.bpDiastolic ?? null,
            tempCelsius: clinicalData.form?.tempCelsius ?? null,
            heartRate: clinicalData.form?.heartRate ?? null,
            respRate: clinicalData.form?.respRate ?? null,

            // Explicitly Map Diagnostic Tests
            recommendedDiagnosticTest: clinicalData.form?.recommendedDiagnosticTest || null,
            impressionClinical: clinicalData.form?.impressionClinical || null,
            managementTreatment: clinicalData.form?.managementTreatment || null,

            createdByAdminID: clinicalData.form?.createdByAdminID || 1,
            updatedByAdminID: 1,

            // History Sections
            pastMedicalHistory: clinicalData.pastMedicalHistory || [],
            familyMedicalHistory: clinicalData.familyMedicalHistory || [],
            socialHistory: clinicalData.socialHistory || null
        };

        try {
            if (isManualEntry || isNewForm || !patientId) {
                const response = await axios.post(`/api/WellnessForms`, payload);
                if (response.data && response.data.form) {
                    setClinicalData(prev => ({ ...prev, form: response.data.form }));
                }
                if (onSave) onSave(`New wellness record successfully created and marked as ${targetStatus}!`, 'success');
            } else {
                await axios.put(`/api/WellnessForms/${formId}`, payload);
                if (onSave) onSave(`Wellness record successfully updated as ${targetStatus}!`, 'success');
            }
            onCancel();
        } catch (error) {
            console.error("Failed to save wellness record:", error);
            if (onSave) onSave("Error saving record. Please verify your backend server connection.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const formStatus = clinicalData.form?.status || 'Draft';
    const isSubmitted = formStatus.toLowerCase() === 'saved' || formStatus.toLowerCase() === 'submitted';

    const handleCloseClick = () => {
        setShowCloseModal(true);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-10 relative">
            <CloseConfirmationModal isOpen={showCloseModal} onConfirm={onCancel} onCancel={() => setShowCloseModal(false)} />

            <div className="p-4 border-b border-gray-200 bg-[#0F2756] text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold tracking-wide uppercase">Electronic Health Care Wellness Record</h2>
                    <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-2xs ${isSubmitted ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-gray-900'}`}>
                        {formStatus}
                    </span>
                </div>
                <button onClick={handleCloseClick} className="hover:bg-blue-800 p-1 rounded-md transition-colors cursor-pointer">
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
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                <h3 className="text-md font-bold text-gray-800">
                                    <i>Patient Information</i> {isManualEntry && <span className="text-xs text-teal-600 font-normal">(New Manual Entry)</span>}
                                </h3>
                            </div>
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Surname</label><input type="text" value={patientInfo.lastName} onChange={(e) => handlePatientInfoChange('lastName', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label><input type="text" value={patientInfo.firstName} onChange={(e) => handlePatientInfoChange('firstName', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Middle Name</label><input type="text" value={patientInfo.middleName} onChange={(e) => handlePatientInfoChange('middleName', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Birthdate</label><input type="date" value={patientInfo.birthdate} onChange={(e) => handlePatientInfoChange('birthdate', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Age</label><input type="number" value={patientInfo.age} onChange={(e) => handlePatientInfoChange('age', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Sex</label><input type="text" value={patientInfo.sex} onChange={(e) => handlePatientInfoChange('sex', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Civil Status</label><input type="text" value={patientInfo.civilStatus} onChange={(e) => handlePatientInfoChange('civilStatus', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                                <div className="md:col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input type="text" value={patientInfo.address} onChange={(e) => handlePatientInfoChange('address', e.target.value)} disabled={!isManualEntry} className={`w-full p-2 border rounded-md text-sm ${!isManualEntry ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500'}`} /></div>
                            </div>
                        </div>

                        {/* Clinical Sections */}
                        <VitalSigns
                            data={clinicalData.form}
                            onChange={(vitals) => handleFormChange(vitals)}
                        />
                        <PastMedicalHistory
                            data={clinicalData.pastMedicalHistory}
                            onChange={(data) => handleSectionChange('pastMedicalHistory', data)}
                        />
                        <FamilyMedicalHistory
                            data={clinicalData.familyMedicalHistory}
                            onChange={(data) => handleSectionChange('familyMedicalHistory', data)}
                        />
                        <SocialHistory
                            data={clinicalData.socialHistory}
                            onChange={(data) => handleSectionChange('socialHistory', data)}
                        />
                        <RecommendedDiagnosticTest
                            data={clinicalData.form}
                            onChange={(data) => handleFormChange(data)}
                        />
                        <PhysicianCertification
                            data={clinicalData.form}
                            onChange={(data) => handleFormChange(data)}
                        />
                    </>
                )}

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-200 space-y-3 sm:space-y-0 sm:space-x-3">
                    <button onClick={() => submitForm('Submitted')} disabled={isSaving} className="uppercase w-full sm:w-auto flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold shadow-sm cursor-pointer flex items-center justify-center">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Submit
                    </button>
                    <div className="flex space-x-3 w-full sm:w-auto">
                        <button onClick={() => submitForm('Draft')} disabled={isSaving} className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium cursor-pointer flex items-center justify-center">
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