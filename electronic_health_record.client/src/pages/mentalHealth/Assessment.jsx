import React, { useState } from 'react';
import { 
    BrainCircuit, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight, 
    CheckCircle2, 
    HeartHandshake, 
    RotateCcw, 
    Lock, 
    ChevronLeft,
    Smile,
    HelpCircle
} from 'lucide-react';
import PHO_logo from '../../assets/images/PHO_logo.jpg';

const ASSESSMENT_QUESTIONS = [
    {
        id: 1,
        title: "Interest & Engagement",
        question: "Little interest or pleasure in doing daily tasks, work, or hobbies",
        description: "How often have you felt unmotivated or disconnected from daily activities?"
    },
    {
        id: 2,
        title: "Mood & Wellbeing",
        question: "Feeling down, depressed, irritable, fatigued, or hopeless",
        description: "How often have you experienced persistent sadness, mood drops, or emotional heaviness?"
    },
    {
        id: 3,
        title: "Sleep Quality",
        question: "Trouble falling asleep, staying asleep, or sleeping excessively",
        description: "How often has your natural sleep rhythm or restfulness been disrupted?"
    },
    {
        id: 4,
        title: "Energy & Vitality",
        question: "Feeling tired, lethargic, or having persistently low energy levels",
        description: "How often have you felt physically drained even after resting?"
    },
    {
        id: 5,
        title: "Anxiety & Stress Response",
        question: "Feeling nervous, anxious, on edge, or easily overwhelmed by routine stressors",
        description: "How often have you felt tense, worried, or pressured by work or personal tasks?"
    }
];

const RATING_OPTIONS = [
    { value: 0, label: "Not at all", description: "0 days" },
    { value: 1, label: "Several days", description: "1-6 days" },
    { value: 2, label: "More than half the days", description: "7-11 days" },
    { value: 3, label: "Nearly every day", description: "12-14 days" }
];

export default function Assessment() {
    const [step, setStep] = useState('welcome'); // 'welcome' | 'questions' | 'completed'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({
        1: null,
        2: null,
        3: null,
        4: null,
        5: null
    });

    const handleSelectOption = (value) => {
        const questionId = ASSESSMENT_QUESTIONS[currentQuestionIndex].id;
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setStep('completed');
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleReset = () => {
        setAnswers({ 1: null, 2: null, 3: null, 4: null, 5: null });
        setCurrentQuestionIndex(0);
        setStep('welcome');
    };

    const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;
    const answeredCount = Object.values(answers).filter(val => val !== null).length;
    const progressPercentage = (answeredCount / ASSESSMENT_QUESTIONS.length) * 100;

    return (
        <div className="min-h-full bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
            
            {/* BACKGROUND GLOW ACCENTS */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

            {/* TOP HEADER */}
            <header className="flex items-center justify-between z-10 max-w-4xl mx-auto w-full pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 bg-white rounded-xl p-1 shadow-md flex items-center justify-center">
                        <img src={PHO_logo} alt="PHO Logo" className="h-full w-full object-cover rounded-lg" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-base font-bold text-white tracking-wide">eHPR Wellness Kiosk</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                                Station 2
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">Provincial Health Office • Agusan del Sur</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span className="hidden sm:inline">RA 11036 Protected & Confidential</span>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex items-center justify-center py-6 z-10">
                
                {/* 1. WELCOME SCREEN */}
                {step === 'welcome' && (
                    <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                            <BrainCircuit className="w-8 h-8 text-white" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs uppercase font-bold tracking-widest text-teal-400">
                                Employee Wellness Screening
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Mental Health & Wellbeing Assessment
                            </h1>
                            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                                Welcome! Please take a few moments to answer 5 simple wellness questions. Your truthful responses help us provide appropriate healthcare recommendations.
                            </p>
                        </div>

                        {/* KEY HIGHLIGHTS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                                <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-bold">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Private & Secure</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    Only authorized health personnel review your summary.
                                </p>
                            </div>

                            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                                <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Quick 2-Min</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    Short 5-question standard check for your convenience.
                                </p>
                            </div>

                            <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
                                <div className="flex items-center space-x-1.5 text-teal-400 text-xs font-bold">
                                    <HeartHandshake className="w-3.5 h-3.5" />
                                    <span>Supportive</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    Helps formulate tailored guidance during Station 3.
                                </p>
                            </div>
                        </div>

                        {/* CTA ACTION */}
                        <div className="pt-2">
                            <button
                                onClick={() => setStep('questions')}
                                className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm tracking-wide rounded-2xl transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 mx-auto cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Start Assessment</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. QUESTIONNAIRE SCREEN */}
                {step === 'questions' && (
                    <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-6 sm:p-10 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* PROGRESS BAR */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-teal-400 uppercase tracking-wider">
                                    Question {currentQuestionIndex + 1} of {ASSESSMENT_QUESTIONS.length}
                                </span>
                                <span className="text-slate-400">
                                    {Math.round(progressPercentage)}% Complete
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
                                    style={{ width: `${((currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* QUESTION CARD */}
                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                                {currentQuestion.title}
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                                {currentQuestion.question}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {currentQuestion.description}
                            </p>
                        </div>

                        {/* RATING OPTIONS */}
                        <div className="space-y-2.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Over the last 2 weeks, how often have you felt this way?
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {RATING_OPTIONS.map((option) => {
                                    const isSelected = selectedAnswer === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleSelectOption(option.value)}
                                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-500/40 shadow-md'
                                                    : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className={`text-sm font-bold ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                                                    {option.label}
                                                </span>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                                    isSelected ? 'border-teal-400 bg-teal-400 text-slate-950 font-black' : 'border-slate-600'
                                                }`}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                                                </div>
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                {option.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* NAVIGATION FOOTER */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-700/80">
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={selectedAnswer === null}
                                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-500"
                            >
                                <span>{currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1 ? 'Finish Assessment' : 'Next Question'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                )}

                {/* 3. COMPLETED KIOSK SCREEN */}
                {step === 'completed' && (
                    <div className="max-w-xl w-full bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/80 p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                                Assessment Finished
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white">
                                Thank You for Completing Your Screening!
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                                Your responses have been saved securely. Please hand the device back to the Station 2 Nurse / Assessor to attach your screening to your Health Record.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-900/70 border border-slate-700/70 rounded-2xl flex items-center justify-center space-x-3 text-xs text-slate-300">
                            <Smile className="w-5 h-5 text-teal-400 flex-shrink-0" />
                            <span>You may proceed to Station 3 for doctor consultation when called.</span>
                        </div>

                        <div className="pt-3">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 mx-auto cursor-pointer shadow-xs"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Reset for Next Patient (Assessor Action)</span>
                            </button>
                        </div>
                    </div>
                )}

            </main>

            {/* FOOTER */}
            <footer className="max-w-4xl mx-auto w-full pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500 z-10">
                <p>© {new Date().getFullYear()} Electronic Health Care Wellness Record (eHPR) • PHO Agusan del Sur</p>
                <p className="flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Station 2 Kiosk Terminal</span>
                </p>
            </footer>

        </div>
    );
}
