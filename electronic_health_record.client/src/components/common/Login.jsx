import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import PHO_logo from '../../assets/images/PHO_logo.jpg';
import { login } from '../../services/auth/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const data = await login({ email, password });

            localStorage.setItem('token', data.token);

            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid email or password.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-8">

            {/* Header Branding */}
            <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 bg-slate-900 rounded-xl p-1 shadow-md mb-3 flex items-center justify-center">
                    <img src={PHO_logo} alt="PHO Logo" className="h-full w-full object-cover rounded-lg" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-wide">
                    e<span className="text-teal-600">HPR</span> SYSTEM
                </h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Province Health Office - Medical Portal
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <div className="relative flex items-center">
                        <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@pgas.gov.com"
                            className="text-black w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <div className="relative flex items-center">
                        <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className=" text-black w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 mr-2" />
                        Remember this device
                    </label>
                    <a href="#forgot" className="text-teal-600 hover:underline font-medium">Forgot password?</a>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm transition-colors shadow-md flex items-center justify-center group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <span>Sign In to Portal</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Security Footer Note */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center text-slate-400 text-xs">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-teal-600" />
                <span>Secured PHO Health Network</span>
            </div>

        </div>
    );
}