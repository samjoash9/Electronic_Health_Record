import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { KeyRound, Mail, Loader2, ShieldCheck, Terminal, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { login, switchRoleForTesting } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Dev Tools State
    const [showDevTools, setShowDevTools] = useState(false);

    const handleFormLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await login(email, password);
        setIsSubmitting(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    const handleQuickFill = (testEmail) => {
        setEmail(testEmail);
        setPassword('Welcome123!');
    };

    const handleQuickSwitch = (roleKey) => {
        switchRoleForTesting(roleKey);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-teal-500/30 relative overflow-hidden">

            {/* Ambient Background Circles (Optional, adds to the modern feel) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-300/30 rounded-full blur-[100px] pointer-events-none"></div>

            {/* ============================================================================== */}
            {/* PRODUCTION LOGIN CARD (Backend Dev: Keep this)                                 */}
            {/* ============================================================================== */}
            <div className="w-full max-w-[900px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row relative z-10 overflow-hidden min-h-[550px] animate-in fade-in zoom-in-95 duration-500">

                {/* LEFT PANE: Branding & Welcome (Teal Side) */}
                <div className="relative w-full md:w-5/12 bg-teal-600 text-white flex flex-col justify-center items-center p-10 overflow-hidden">
                    {/* Abstract overlapping circles matching the reference design */}
                    <div className="absolute -top-24 -left-24 w-80 h-80 bg-teal-500 rounded-full mix-blend-screen opacity-70"></div>
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-700 rounded-full mix-blend-multiply opacity-50"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-4">Welcome Back!</h1>
                        <p className="text-teal-50 text-sm leading-relaxed max-w-[240px] font-medium">
                            To stay connected with us please login with your personal info.
                        </p>
                    </div>
                </div>

                {/* RIGHT PANE: Login Form (White Side) */}
                <div className="w-full md:w-7/12 p-8 md:p-14 flex flex-col justify-center bg-white">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-teal-600 mb-2">Sign in</h2>
                        <p className="text-sm text-slate-400 font-medium">Login in to your account to continue</p>
                    </div>

                    <form onSubmit={handleFormLogin} className="space-y-5 max-w-[340px] mx-auto w-full">
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-2xl text-center font-medium">
                                {error}
                            </div>
                        )}

                        {/* Pill-shaped Email Input */}
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full h-14 pl-12 pr-6 bg-slate-100 border-2 border-transparent rounded-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                            />
                        </div>

                        {/* Pill-shaped Password Input */}
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                                <KeyRound className="w-4 h-4" />
                            </span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full h-14 pl-12 pr-6 bg-slate-100 border-2 border-transparent rounded-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                            />
                        </div>

                        <div className="text-right pb-2">
                            <a href="#" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">Forgot your password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full text-sm tracking-wide transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                            {isSubmitting ? 'AUTHENTICATING...' : 'LOG IN'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ============================================================================== */}
            {/* FRONTEND DEV TOOLS (Backend Dev: DELETE THIS ENTIRE BLOCK BELOW IN PROD)       */}
            {/* ============================================================================== */}
            <div className="fixed bottom-6 z-50 flex flex-col items-center w-full px-4">
                {showDevTools && (
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 mb-4 w-full max-w-3xl animate-in slide-in-from-bottom-4">
                        <div className="flex flex-col md:flex-row gap-6">

                            {/* Auto-Fill Section */}
                            <div className="flex-1">
                                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">Auto-Fill Credentials</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button type="button" onClick={() => handleQuickFill('super@ehpr.local')} className="text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-colors cursor-pointer">super@ehpr.local</button>
                                    <button type="button" onClick={() => handleQuickFill('station1@ehpr.local')} className="text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-colors cursor-pointer">station1@ehpr.local</button>
                                    <button type="button" onClick={() => handleQuickFill('station2@ehpr.local')} className="text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-colors cursor-pointer">station2@ehpr.local</button>
                                    <button type="button" onClick={() => handleQuickFill('doctor@ehpr.local')} className="text-left px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-teal-400 hover:border-teal-500/50 transition-colors cursor-pointer">doctor@ehpr.local</button>
                                </div>
                            </div>

                            {/* 1-Click Bypass Section */}
                            <div className="flex-1">
                                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">1-Click Fast Bypass</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => handleQuickSwitch(ROLES.SUPERADMIN)} className="px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-400 hover:bg-teal-500/20 transition-colors flex justify-between items-center cursor-pointer">Super Admin <ArrowRight className="w-3 h-3 opacity-50" /></button>
                                    <button type="button" onClick={() => handleQuickSwitch(ROLES.STATION1)} className="px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-400 hover:bg-teal-500/20 transition-colors flex justify-between items-center cursor-pointer">Station 1 <ArrowRight className="w-3 h-3 opacity-50" /></button>
                                    <button type="button" onClick={() => handleQuickSwitch(ROLES.STATION2)} className="px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-400 hover:bg-teal-500/20 transition-colors flex justify-between items-center cursor-pointer">Station 2 <ArrowRight className="w-3 h-3 opacity-50" /></button>
                                    <button type="button" onClick={() => handleQuickSwitch(ROLES.DOCTOR)} className="px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-400 hover:bg-teal-500/20 transition-colors flex justify-between items-center cursor-pointer">Station 3 (Doc) <ArrowRight className="w-3 h-3 opacity-50" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowDevTools(!showDevTools)}
                    className="flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xl cursor-pointer"
                >
                    <Terminal className="w-4 h-4 mr-2 text-teal-400" />
                    Frontend Dev Tools
                    {showDevTools ? <ChevronDown className="w-4 h-4 ml-2 opacity-60" /> : <ChevronUp className="w-4 h-4 ml-2 opacity-60" />}
                </button>
            </div>
            {/* ============================================================================== */}
            {/* END FRONTEND DEV TOOLS                                                         */}
            {/* ============================================================================== */}

        </div>
    );
}