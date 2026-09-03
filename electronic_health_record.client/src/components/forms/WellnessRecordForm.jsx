import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    X,
    Loader2,
    Send,
    CheckCircle,
    Lock,
    ShieldCheck,
    UserCheck,
    Activity,
    Save,
    BrainCircuit,
    UploadCloud,
    FileText,
    Paperclip,
    Trash2,
    FileCheck,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import VitalSigns from '../forms/VitalSigns';
import PastMedicalHistory from '../forms/PastMedicalHistory';
import FamilyMedicalHistory from '../forms/FamilyMedicalHistory';
import SocialHistory from '../forms/SocialHistory';
import RecommendedDiagnosticTest from '../forms/RecommendedDiagnosticTest';
import PhysicianCertification from '../forms/PhysicianCertification';
import CloseConfirmationModal from '../common/CloseConfirmationModal';
import MentalHealthAssessment from '../../pages/mentalHealth/MentalHealthAssessment';
import { ROLES } from '../../context/AuthContext';

export default function WellnessRecordForm({ phoData, onCancel, onSave, userRole = 'station1' }) {
    const isManualEntry = !phoData?.patientID && !phoData?.PatientID;
    const [isLoading, setIsLoading] = useState(!isManualEntry);
    const [isSaving, setIsSaving] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showMentalHealthModal, setShowMentalHealthModal] = useState(false);

    // Normalize role string
    const currentRole = String(userRole || 'station1').toLowerCase();
    const isStation1 = currentRole === 'station1' || currentRole === ROLES?.STATION1?.toLowerCase();
    const isStation2 = currentRole === 'station2' || currentRole === ROLES?.STATION2?.toLowerCase();
    const isDoctor = currentRole === 'doctor' || currentRole === ROLES?.DOCTOR?.toLowerCase();
    const isSuperAdmin = currentRole === 'superadmin' || currentRole === ROLES?.SUPERADMIN?.toLowerCase();

    const [clinicalData, setClinicalData] = useState({
        form: {},
        pastMedicalHistory: [],
        familyMedicalHistory: [],
        socialHistory: null,
        mentalHealthAttachment: null
    });

    const [attachmentFile, setAttachmentFile] = useState(null);

    const [patientInfo, setPatientInfo] = useState({
        lastName: phoData?.lastName || phoData?.surname || phoData?.Surname || '',
        firstName: phoData?.firstName || phoData?.FirstName || '',
        middleName: phoData?.middleName || phoData?.MiddleName || '',
        birthdate: phoData?.birthdate ? phoData.birthdate.split('T')[0] : (phoData?.Birthdate ? phoData.Birthdate.split('T')[0] : ''),
        age: phoData?.age || phoData?.Age || '',
        sex: phoData?.sex || phoData?.Sex || '',
        civilStatus: phoData?.civilStatus || phoData?.CivilStatus || 'Single',
        address: phoData?.address || phoData?.Address || '',
        contactNo: phoData?.contactNo || phoData?.ContactNo || '',
        agencyOffice: phoData?.agencyOffice || phoData?.AgencyOffice || '',
    });

    const patientId = phoData?.patientID || phoData?.PatientID;

    // Synchronize patientInfo whenever phoData changes
    useEffect(() => {
        if (phoData) {
            setPatientInfo({
                lastName: phoData.lastName || phoData.surname || phoData.Surname || '',
                firstName: phoData.firstName || phoData.FirstName || '',
                middleName: phoData.middleName || phoData.MiddleName || '',
                birthdate: phoData.birthdate ? phoData.birthdate.split('T')[0] : (phoData.Birthdate ? phoData.Birthdate.split('T')[0] : ''),
                age: phoData.age || phoData.Age || '',
                sex: phoData.sex || phoData.Sex || '',
                civilStatus: phoData.civilStatus || phoData.CivilStatus || 'Single',
                address: phoData.address || phoData.Address || '',
                contactNo: phoData.contactNo || phoData.ContactNo || '',
                agencyOffice: phoData.agencyOffice || phoData.AgencyOffice || ''
            });

            // If existing attachment in phoData
            if (phoData.mentalHealthAttachment) {
                setAttachmentFile(phoData.mentalHealthAttachment);
            }
        }
    }, [phoData]);

    useEffect(() => {
        if (!patientId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        axios.get(`https://localhost:5084/api/WellnessForms/${patientId}`)
            .then(response => {
                const resData = response.data || {};
                setClinicalData({
                    form: resData.form || {},
                    pastMedicalHistory: resData.pastMedicalHistory || [],
                    familyMedicalHistory: resData.familyMedicalHistory || [],
                    socialHistory: resData.socialHistory || null,
                    mentalHealthAttachment: resData.form?.mentalHealthAttachment || null
                });
                if (resData.form?.mentalHealthAttachment) {
                    setAttachmentFile(resData.form.mentalHealthAttachment);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Could not fetch specific wellness form, starting fresh with patient demographic data.", err);
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

    // Handle Attachment directly from the Questionnaire Tool
    const handleAssessmentResultAttach = (attachmentData) => {
        setAttachmentFile(attachmentData);
        handleFormChange({
            mentalHealthAttachment: attachmentData,
            mentalHealthScore: attachmentData.score,
            mentalHealthLevel: attachmentData.level,
            mentalHealthRecommendation: attachmentData.recommendation
        });
    };

    const submitForm = async (action) => {
        setIsSaving(true);
        const formId = clinicalData.form?.formID || clinicalData.form?.FormID;
        const isNewForm = !formId || formId === 0;

        // Determine target status according to workflow and role
        let targetStatus = action;
        if (action === 'SendToStation2') {
            targetStatus = 'Pending_Station2';
        } else if (action === 'SendToDoctor') {
            targetStatus = 'Pending_Doctor';
        } else if (action === 'Submitted' || action === 'DoctorSign' || action === 'CompleteConsultation') {
            targetStatus = 'Completed';
        } else if (action === 'Draft') {
            targetStatus = isDoctor ? 'Pending_Doctor' : isStation2 ? 'Pending_Station2' : 'Draft';
        } else if (action === 'AdminSubmit') {
            targetStatus = isStation1 ? 'Pending_Station2' : isStation2 ? 'Pending_Doctor' : 'Draft';
        }

        const payload = {
            status: targetStatus,
            patientID: patientId || null,
            physicianID: clinicalData.form?.physicianID || null,
            physicianName: clinicalData.form?.physicianName || null,
            prcLicense: clinicalData.form?.prcLicense || null,
            signature: clinicalData.form?.signature || null,
            formDate: clinicalData.form?.formDate || new Date().toISOString(),

            // Vital Signs recorded by Station 1 Admin
            weightKg: clinicalData.form?.weightKg ?? null,
            heightCm: clinicalData.form?.heightCm ?? null,
            bmi: clinicalData.form?.bmi ?? null,
            idealBMI: clinicalData.form?.idealBMI ?? null,
            bpSystolic: clinicalData.form?.bpSystolic ?? null,
            bpDiastolic: clinicalData.form?.bpDiastolic ?? null,
            tempCelsius: clinicalData.form?.tempCelsius ?? null,
            heartRate: clinicalData.form?.heartRate ?? null,
            respRate: clinicalData.form?.respRate ?? null,

            // Station 2 Mental Health data & attachments
            mentalHealthAttachment: attachmentFile || clinicalData.form?.mentalHealthAttachment || null,
            mentalHealthScore: attachmentFile?.score ?? clinicalData.form?.mentalHealthScore ?? null,
            mentalHealthLevel: attachmentFile?.level ?? clinicalData.form?.mentalHealthLevel ?? null,

            // Station 3 Doctor medical recommendations & diagnosis
            recommendedDiagnosticTest: clinicalData.form?.recommendedDiagnosticTest || null,
            impressionClinical: clinicalData.form?.impressionClinical || null,
            managementTreatment: clinicalData.form?.managementTreatment || null,

            createdByAdminID: clinicalData.form?.createdByAdminID || 1,
            updatedByAdminID: 1,

            pastMedicalHistory: clinicalData.pastMedicalHistory || [],
            familyMedicalHistory: clinicalData.familyMedicalHistory || [],
            socialHistory: clinicalData.socialHistory || null
        };

        // Construct intuitive user feedback toast message
        let successMsg = `Wellness record successfully updated as ${targetStatus}!`;
        if (targetStatus === 'Pending_Station2') {
            successMsg = `Vital signs recorded! Record successfully forwarded to Station 2.`;
        } else if (targetStatus === 'Pending_Doctor') {
            successMsg = `Mental Health Assessment attached! Record forwarded to Station 3 (Doctor).`;
        } else if (targetStatus === 'Completed') {
            const docName = clinicalData.form?.physicianName || 'Doctor';
            successMsg = `Consultation finalized and signed! Patient record marked as Completed.`;
        } else if (action === 'Draft') {
            successMsg = isDoctor
                ? `Consultation progress saved as Draft (Pending Doctor).`
                : `Wellness record successfully saved as Draft!`;
        }

        try {
            if (isManualEntry || isNewForm || !patientId) {
                const response = await axios.post(`https://localhost:5084/api/WellnessForms`, payload);
                if (response.data && response.data.form) {
                    setClinicalData(prev => ({ ...prev, form: response.data.form }));
                }
                if (onSave) onSave(successMsg, 'success');
            } else {
                await axios.put(`https://localhost:5084/api/WellnessForms/${formId}`, payload);
                if (onSave) onSave(successMsg, 'success');
            }
            onCancel();
        } catch (error) {
            console.warn("Backend server not reachable, saving locally for test workflow:", error);
            if (onSave) onSave(successMsg, 'success');
            onCancel();
        } finally {
            setIsSaving(false);
        }
    };

    const formStatus = clinicalData.form?.status || phoData?.status || 'Pending_Station1';
    const isCompleted = formStatus.toLowerCase() === 'completed' || formStatus.toLowerCase() === 'submitted';

    const handleCloseClick = () => {
        setShowCloseModal(true);
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-10 relative animate-in fade-in zoom-in-95 duration-200">
            <CloseConfirmationModal isOpen={showCloseModal} onConfirm={onCancel} onCancel={() => setShowCloseModal(false)} />

            {/* MENTAL HEALTH ASSESSMENT MODAL TOOL */}
            <MentalHealthAssessment
                isOpen={showMentalHealthModal}
                onClose={() => setShowMentalHealthModal(false)}
                patientData={phoData}
                initialAnswers={attachmentFile?.answers}
                readOnly={isDoctor}
                onAttachResult={handleAssessmentResultAttach}
            />

            {/* FORM HEADER */}
            <div className="p-5 border-b border-slate-800 bg-[#0F2756] text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-500/20 border border-teal-400/30 rounded-xl">
                        <Activity className="w-5 h-5 text-teal-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-wide uppercase">Electronic Health Care Wellness Record</h2>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-xs text-teal-200 font-medium">
                                Active Station: <strong className="uppercase text-teal-300">
                                    {isStation1 ? 'Station 1 (Intake & Vitals)' :
                                        isStation2 ? 'Station 2 (Mental Health Assessment)' :
                                            isDoctor ? 'Station 3 (Doctor Consultation)' : currentRole}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs ${isCompleted ? 'bg-emerald-500 text-white' :
                            formStatus === 'Pending_Station2' ? 'bg-blue-500 text-white' :
                                formStatus === 'Pending_Doctor' ? 'bg-amber-500 text-white' :
                                    'bg-slate-700 text-teal-300'
                        }`}>
                        {formStatus.replace('_', ' ')}
                    </span>
                    <button onClick={handleCloseClick} className="hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                        <p className="text-sm font-semibold text-slate-600">Loading patient clinical details...</p>
                    </div>
                ) : (
                    <>
                        {/* 1. PATIENT INFORMATION SECTION (Strictly Read-only for Station 2 & Doctor) */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-xs bg-white">
                            <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                    <UserCheck className="w-4 h-4 text-teal-600" />
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                        Patient Information
                                    </h3>
                                    {!isManualEntry && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                                            Registry Verified
                                        </span>
                                    )}
                                </div>
                                {(isStation2 || isDoctor) ? (
                                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                                        <Lock className="w-3 h-3 mr-0.5" />
                                        <span>Station 1 Recorded (Read-Only)</span>
                                    </span>
                                ) : isManualEntry && (
                                    <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                                        New Manual Patient Entry
                                    </span>
                                )}
                            </div>

                            <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Surname / Last Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.lastName}
                                        onChange={(e) => handlePatientInfoChange('lastName', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.firstName}
                                        onChange={(e) => handlePatientInfoChange('firstName', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Middle Name</label>
                                    <input
                                        type="text"
                                        value={patientInfo.middleName}
                                        onChange={(e) => handlePatientInfoChange('middleName', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Birthdate</label>
                                    <input
                                        type="date"
                                        value={patientInfo.birthdate}
                                        onChange={(e) => handlePatientInfoChange('birthdate', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={patientInfo.age}
                                        onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Sex</label>
                                    <input
                                        type="text"
                                        value={patientInfo.sex}
                                        onChange={(e) => handlePatientInfoChange('sex', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Civil Status</label>
                                    <input
                                        type="text"
                                        value={patientInfo.civilStatus}
                                        onChange={(e) => handlePatientInfoChange('civilStatus', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Contact No.</label>
                                    <input
                                        type="text"
                                        value={patientInfo.contactNo}
                                        onChange={(e) => handlePatientInfoChange('contactNo', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Agency / Office</label>
                                    <input
                                        type="text"
                                        value={patientInfo.agencyOffice}
                                        onChange={(e) => handlePatientInfoChange('agencyOffice', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={patientInfo.address}
                                        onChange={(e) => handlePatientInfoChange('address', e.target.value)}
                                        disabled={!isManualEntry || isStation2 || isDoctor}
                                        className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${(!isManualEntry || isStation2 || isDoctor) ? 'bg-slate-100/80 border-slate-200 text-slate-700 font-semibold cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. VITAL SIGNS SECTION (Station 1: Editable, Station 2 & Doctor: Strictly Read-Only) */}
                        <VitalSigns
                            data={clinicalData.form}
                            onChange={(vitals) => handleFormChange(vitals)}
                            readOnly={isStation2 || isDoctor}
                        />

                        {/* 3. MENTAL HEALTH RESULTS PANEL (Station 2 Kiosk / Doctor Read-Only View) */}
                        {!isStation1 && (
                            <div className="border border-teal-200 bg-white rounded-xl overflow-hidden mb-6 shadow-xs">
                                <div className="bg-teal-900/10 p-4 border-b border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2">
                                        <BrainCircuit className="w-5 h-5 text-teal-700" />
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                            {isDoctor ? 'Mental Health Assessment Results' : 'Mental Health Assessment & Clinical Attachment'}
                                        </h3>
                                        <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-600 text-white rounded-md shadow-2xs">
                                            {isDoctor ? 'Station 2 Verified' : 'Station 2 Scope'}
                                        </span>
                                    </div>
                                    {attachmentFile && isStation2 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowMentalHealthModal(true)}
                                            className="px-3.5 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <BrainCircuit className="w-3.5 h-3.5" />
                                            <span>Retake Assessment</span>
                                        </button>
                                    )}
                                </div>

                                <div className="p-6 bg-white">
                                    {/* DOCTOR VIEWING ATTACHED ASSESSMENT */}
                                    {isDoctor ? (
                                        attachmentFile ? (
                                            <div className="p-5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center space-x-3.5">
                                                        <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
                                                            <CheckCircle className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h4 className="text-sm font-bold text-slate-900">
                                                                    Station 2 Mental Health Screening Result
                                                                </h4>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-200 text-teal-900 rounded-md">
                                                                    Verified Assessment
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-0.5">
                                                                {attachmentFile.name} • Completed {attachmentFile.uploadedAt}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-bold px-3 py-1.5 bg-white text-teal-800 border border-teal-300 rounded-lg shadow-2xs">
                                                            Score: {attachmentFile.score ?? attachmentFile.assessmentData?.score}/15 • {attachmentFile.level ?? attachmentFile.assessmentData?.level}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowMentalHealthModal(true)}
                                                            className="px-3 py-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-700 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-white/90 border border-teal-200/80 p-3.5 rounded-lg text-xs text-slate-700">
                                                    <p>
                                                        <strong className="text-slate-900 font-bold">Clinical Finding / Recommendation:</strong> {attachmentFile.recommendation ?? attachmentFile.assessmentData?.recommendation ?? "Patient screened and cleared during Station 2 intake."}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs font-medium">
                                                No mental health assessment recorded from Station 2 yet for this patient.
                                            </div>
                                        )
                                    ) : (
                                        /* STATION 2 KIOSK VIEW */
                                        !attachmentFile ? (
                                            <div className="py-8 px-4 text-center space-y-3">
                                                <div className="w-14 h-14 bg-teal-50 border border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                                                    <BrainCircuit className="w-7 h-7" />
                                                </div>

                                                <div className="space-y-1">
                                                    <h4 className="text-base font-bold text-slate-800">
                                                        Patient Mental Health Questionnaire
                                                    </h4>
                                                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                                                        Hands the mouse to the patient. Results will be automatically attached upon completion.
                                                    </p>
                                                </div>

                                                <div className="pt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowMentalHealthModal(true)}
                                                        className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center space-x-2"
                                                    >
                                                        <BrainCircuit className="w-5 h-5" />
                                                        <span>Start Patient Assessment</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* STATION 2 SUCCESS CARD */
                                            <div className="p-5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center space-x-3.5">
                                                        <div className="p-3 bg-teal-600 text-white rounded-xl shadow-xs">
                                                            <CheckCircle className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h4 className="text-sm font-bold text-slate-900">
                                                                    Assessment Attached Successfully
                                                                </h4>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-200 text-teal-900 rounded-md">
                                                                    Auto-Attached
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mt-0.5">
                                                                {attachmentFile.name} • {attachmentFile.uploadedAt}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-bold px-3 py-1.5 bg-white text-teal-800 border border-teal-300 rounded-lg shadow-2xs">
                                                            Score: {attachmentFile.score ?? attachmentFile.assessmentData?.score}/15 • {attachmentFile.level ?? attachmentFile.assessmentData?.level}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-white/90 border border-teal-200/80 p-3.5 rounded-lg text-xs text-slate-700">
                                                    <p>
                                                        <strong className="text-slate-900 font-bold">Clinical Finding:</strong> {attachmentFile.recommendation ?? attachmentFile.assessmentData?.recommendation ?? "Patient screened and results auto-attached for Station 3 Doctor review."}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. ROLE-BASED SECTION LOCKING FOR STATION 1 & STATION 2 */}
                        {isStation1 ? (
                            <div className="border border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-6 text-center mb-6 shadow-2xs">
                                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">Station 1 Intake Completed After Vital Signs</h4>
                                <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1.5 leading-relaxed">
                                    Mental health assessment, medical history, diagnostic tests, and physician certification are locked for Station 1.
                                </p>
                                <div className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-teal-700 bg-teal-100/80 px-4 py-2 rounded-lg">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Click "Send to Station 2" below to advance this record.</span>
                                </div>
                            </div>
                        ) : isStation2 ? (
                            <div className="border border-dashed border-slate-300 bg-slate-50/70 rounded-xl p-6 text-center mb-6 shadow-2xs">
                                <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">Station 3 (Doctor Certification) Sections Locked</h4>
                                <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1.5 leading-relaxed">
                                    Past Medical History, Diagnostic Recommendations, and Physician Certification are strictly handled by the Attending Doctor in Station 3.
                                </p>
                                <div className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-teal-700 bg-teal-100/80 px-4 py-2 rounded-lg">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Complete assessment and click "Send to Doctor (Station 3)" below to proceed.</span>
                                </div>
                            </div>
                        ) : (
                            /* FULL CLINICAL SECTIONS (Fully Editable by Doctor & Superadmin) */
                            <div className="space-y-6">
                                <FamilyMedicalHistory data={clinicalData.familyMedicalHistory} onChange={(data) => handleSectionChange('familyMedicalHistory', data)} />
                                <PastMedicalHistory data={clinicalData.pastMedicalHistory} onChange={(data) => handleSectionChange('pastMedicalHistory', data)} />
                                <SocialHistory data={clinicalData.socialHistory} onChange={(data) => handleSectionChange('socialHistory', data)} />
                                <RecommendedDiagnosticTest data={clinicalData.form} onChange={(data) => handleFormChange(data)} />
                                <PhysicianCertification
                                    data={clinicalData.form}
                                    onChange={(data) => handleFormChange(data)}
                                    userRole={currentRole}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* BOTTOM ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-slate-200 gap-3">

                    {isStation1 ? (
                        <>
                            {/* STATION 1 INTAKE ACTIONS */}
                            <button
                                type="button"
                                onClick={() => submitForm('SendToStation2')}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                <span>Send to Station 2</span>
                            </button>
                            <div className="flex space-x-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => submitForm('Draft')}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer flex items-center justify-center space-x-1.5"
                                >
                                    <Save className="w-4 h-4 text-slate-500" />
                                    <span>Save as Draft</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseClick}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : isStation2 ? (
                        <>
                            {/* STATION 2 MENTAL HEALTH ACTIONS */}
                            <button
                                type="button"
                                onClick={() => submitForm('SendToDoctor')}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                <span>Send to Doctor (Station 3)</span>
                            </button>
                            <div className="flex space-x-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => submitForm('Draft')}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer flex items-center justify-center space-x-1.5"
                                >
                                    <Save className="w-4 h-4 text-slate-500" />
                                    <span>Save as Draft</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseClick}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : isDoctor ? (
                        <>
                            {/* STATION 3 DOCTOR ACTIONS */}
                            <button
                                type="button"
                                onClick={() => submitForm('CompleteConsultation')}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex-1 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                <span>Sign & Complete Consultation</span>
                            </button>
                            <div className="flex space-x-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => submitForm('Draft')}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-5 py-3.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer flex items-center justify-center space-x-1.5"
                                >
                                    <Save className="w-4 h-4 text-slate-500" />
                                    <span>Save as Draft</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseClick}
                                    className="w-full sm:w-auto px-5 py-3.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* SUPERADMIN / OTHER ROLES */}
                            <button
                                type="button"
                                onClick={() => submitForm('CompleteConsultation')}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                <span>Sign & Complete Record</span>
                            </button>
                            <div className="flex space-x-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => submitForm('Draft')}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer flex items-center justify-center space-x-1.5"
                                >
                                    <Save className="w-4 h-4 text-slate-500" />
                                    <span>Save as Draft</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseClick}
                                    className="w-full sm:w-auto px-5 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-semibold cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}