import React, { useState } from 'react';
import { 
    BrainCircuit, 
    X, 
    CheckCircle2, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight, 
    HeartHandshake,
    Smile,
    Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PHO_logo from '../../assets/images/PHO_logo.jpg';

export const MENTAL_HEALTH_QUESTIONS = [
    {
        id: 1,
        title: "Interest & Motivation",
        question: "Little interest or pleasure in doing daily tasks, work, or hobbies",
        category: "Anhedonia"
    },
    {
        id: 2,
        title: "Mood & Wellbeing",
        question: "Feeling down, depressed, irritable, fatigued, or hopeless",
        category: "Affect"
    },
    {
        id: 3,
        title: "Sleep Quality",
        question: "Trouble falling or staying asleep, or sleeping excessively",
        category: "Sleep"
    },
    {
        id: 4,
        title: "Energy Levels",
        question: "Feeling tired, lethargic, or having persistently low energy levels",
        category: "Vitality"
    },
    {
        id: 5,
        title: "Stress & Anxiety",
        question: "Feeling nervous, anxious, on edge, or easily overwhelmed by routine stressors",
        category: "Anxiety"
    }
];

export const RATING_SCALE = [
    { value: 0, label: "Not at all", points: 0 },
    { value: 1, label: "Several days", points: 1 },
    { value: 2, label: "More than half the days", points: 2 },
    { value: 3, label: "Nearly every day", points: 3 }
];

export default function MentalHealthAssessment({ 
    isOpen = true, 
    onClose, 
    patientData, 
    onAttachResult,
    initialAnswers = null,
    readOnly = false
}) {
    const { user } = useAuth() || {};
    const [answers, setAnswers] = useState(() => {
        if (initialAnswers) return initialAnswers;
        if (patientData?.mentalHealthAttachment?.answers) return patientData.mentalHealthAttachment.answers;
        return {
            1: null,
            2: null,
            3: null,
            4: null,
            5: null
        };
    });

    if (!isOpen) return null;

    const patientName = patientData 
        ? `${patientData.firstName || ''} ${patientData.surname || patientData.lastName || ''}`.trim()
        : "Patient";

    const patientId = patientData?.patientID || patientData?.PatientID || "N/A";
    const patientAge = patientData?.age || "N/A";
    const patientSex = patientData?.sex || "N/A";
    const agencyOffice = patientData?.agencyOffice || patientData?.AgencyOffice || "Provincial Government";

    const handleOptionSelect = (questionId, value) => {
        if (readOnly) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const answeredCount = Object.values(answers).filter(val => val !== null).length;
    const totalScore = Object.values(answers).reduce((sum, val) => sum + (val !== null ? val : 0), 0);
    const isComplete = answeredCount === MENTAL_HEALTH_QUESTIONS.length;

    // Clinical Interpretation Logic
    const getAssessmentInterpretation = (score) => {
        if (score <= 4) {
            return {
                level: "Minimal / Normal Distress",
                badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
                recommendation: "Healthy emotional wellbeing noted. Cleared for standard annual wellness monitoring."
            };
        } else if (score <= 9) {
            return {
                level: "Mild Emotional Distress",
                badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
                recommendation: "Mild stress indicators noted. Workplace stress-management debriefing recommended."
            };
        } else {
            return {
                level: "Moderate to Significant Distress",
                badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
                recommendation: "Elevated psychological distress detected. Physician consultation in Station 3 recommended."
            };
        }
    };

    const assessmentResult = getAssessmentInterpretation(totalScore);

    const handleCompleteAssessment = () => {
        if (!isComplete || readOnly) return;

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const generatedAttachment = {
            name: `Mental_Health_Screening_${patientName.replace(/\s+/g, '_')}.pdf`,
            type: 'application/pdf',
            size: '48.2 KB',
            uploadedAt: `${dateStr} at ${timeStr}`,
            source: 'Patient Kiosk Self-Assessment',
            score: totalScore,
            maxScore: 15,
            level: assessmentResult.level,
            badgeBg: assessmentResult.badgeBg,
            recommendation: assessmentResult.recommendation,
            assessedBy: user?.name || "Station 2 Assessor",
            assessedAt: new Date().toISOString(),
            answers: answers
        };

        if (onAttachResult) {
            onAttachResult(generatedAttachment);
        }
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* KIOSK MODAL HEADER */}
                <div className="p-5 sm:p-6 bg-[#0F2756] text-white flex justify-between items-center">
                    <div className="flex items-center space-x-3.5">
                        <div className="h-10 w-10 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center flex-shrink-0">
                            <img src={PHO_logo} alt="PHO Logo" className="h-full w-full object-cover rounded-lg" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-base sm:text-lg font-bold tracking-wide">
                                    Patient Mental Health Assessment
                                </h2>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-400/20 text-teal-300 rounded border border-teal-400/30">
                                    Station 2 Kiosk
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Agusan del Sur Provincial Health Office • Employee Wellness Screening
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="hover:bg-white/10 p-2 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Cancel & Return"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* PATIENT GREETING STRIP */}
                <div className="bg-teal-50 px-6 py-3 border-b border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                        <Smile className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold text-teal-950">
                            Welcome, {patientName}!
                        </span>
                        <span className="text-xs text-teal-800">
                            ({patientAge} yrs • {patientSex} • {agencyOffice})
                        </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-teal-800 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-teal-600" />
                        <span>Confidential (RA 11036)</span>
                    </div>
                </div>

                {/* QUESTIONNAIRE INSTRUCTIONS & PROGRESS */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Please Answer the 5 Screening Questions Below
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Over the last 2 weeks, how often have you been bothered by any of the following?
                            </p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-full text-teal-700 shadow-2xs">
                            {answeredCount} of 5 Answered
                        </span>
                    </div>

                    {/* 5 STANDARDIZED QUESTIONS */}
                    <div className="space-y-4">
                        {MENTAL_HEALTH_QUESTIONS.map((item, index) => {
                            const currentVal = answers[item.id];
                            const isAnswered = currentVal !== null;

                            return (
                                <div 
                                    key={item.id} 
                                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                        isAnswered 
                                            ? 'bg-white border-teal-200 shadow-xs' 
                                            : 'bg-white border-slate-200 shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-start space-x-3 mb-3">
                                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                            isAnswered ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                                                {item.question}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 4 RADIO BUTTON CHOICES */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-9">
                                        {RATING_SCALE.map((scale) => {
                                            const isSelected = currentVal === scale.value;

                                            return (
                                                <button 
                                                    key={scale.value}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(item.id, scale.value)}
                                                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                                                        isSelected 
                                                            ? 'bg-teal-600 border-teal-600 text-white ring-2 ring-teal-600/20 shadow-xs' 
                                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span>{scale.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* MODAL FOOTER */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <HeartHandshake className="w-4 h-4 text-teal-600" />
                        <span>{readOnly ? "Station 2 Mental Health Screening Result (Read-Only Consultation Mode)" : "Thank you for participating in your employee wellness check!"}</span>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                        {readOnly ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Print / Save PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                    Close Review
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCompleteAssessment}
                                    disabled={!isComplete}
                                    className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Complete Assessment</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
