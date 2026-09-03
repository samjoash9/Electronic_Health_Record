import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, Trash2, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PhysicianCertification({ data, onChange, userRole = 'admin' }) {
    const { user } = useAuth() || {};
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [isSignMode, setIsSignMode] = useState(true);

    const isDoctor = String(userRole || '').toLowerCase() === 'doctor' || String(userRole || '').toLowerCase() === 'superadmin';

    const physicianName = data?.physicianName || (isDoctor ? (user?.name || 'Dr. Juan Dela Cruz, MD') : '');
    const prcLicense = data?.prcLicense || (isDoctor ? '0123456' : '');

    useEffect(() => {
        // Pre-fill physician data if empty and logged in as doctor
        if (isDoctor && (!data?.physicianName || !data?.prcLicense)) {
            if (onChange) {
                onChange({
                    physicianName: data?.physicianName || user?.name || 'Dr. Juan Dela Cruz, MD',
                    prcLicense: data?.prcLicense || '0123456'
                });
            }
        }
    }, [isDoctor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#0F2756';

            if (data?.signature && !hasSignature) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setHasSignature(true);
                };
                img.src = data.signature;
            }
        }
    }, [data?.signature, hasSignature]);

    const notifyParent = (field, value) => {
        if (onChange) onChange({ [field]: value });
    };

    const startDrawing = (e) => {
        if (!isDoctor) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        if (e.cancelable) e.preventDefault();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing || !isDoctor) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        if (e.cancelable) e.preventDefault();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            if (canvas) {
                const base64Signature = canvas.toDataURL('image/png');
                notifyParent('signature', base64Signature);
            }
        }
    };

    const handleSaveSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const base64Signature = canvas.toDataURL('image/png');
            notifyParent('signature', base64Signature);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSignature(false);
            notifyParent('signature', null);
        }
    };

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-xs bg-white">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Physician Certification & Clinical Clearance
                    </h3>
                </div>
                {isDoctor && (
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                        Station 3 Active Doctor
                    </span>
                )}
            </div>

            <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-4 justify-center">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Name of Attending Physician</label>
                        <input
                            type="text"
                            value={physicianName}
                            onChange={(e) => notifyParent('physicianName', e.target.value)}
                            placeholder="e.g. Dr. Juan Dela Cruz, MD"
                            disabled={!isDoctor}
                            className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${!isDoctor ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-800'}`}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">PRC License No.</label>
                            <span className="text-[11px] font-medium text-slate-400">
                                {prcLicense.length} characters
                            </span>
                        </div>
                        <input
                            type="text"
                            value={prcLicense}
                            onChange={(e) => notifyParent('prcLicense', e.target.value)}
                            placeholder="e.g. 0123456"
                            disabled={!isDoctor}
                            className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-all ${!isDoctor ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-800'}`}
                        />
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-700">Attending Physician Digital Signature</label>
                        {isDoctor && (
                            <span className="text-[11px] font-semibold text-teal-600">
                                {hasSignature ? 'Signature Drawn' : 'Draw your signature below'}
                            </span>
                        )}
                    </div>

                    <div className={`flex-1 flex flex-col border rounded-xl overflow-hidden transition-all touch-none ${isDoctor ? 'border-teal-300 ring-2 ring-teal-500/10' : 'border-slate-200 bg-slate-50'}`}>
                        <div className={`flex-1 min-h-[130px] ${isDoctor ? 'bg-white' : 'bg-slate-50'} relative`}>
                            {!hasSignature && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <span className="text-slate-400 select-none text-xs font-medium">
                                        {isDoctor ? 'Use mouse or stylus to sign here' : 'Pending Physician Signature...'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 border-b-2 border-dashed border-slate-200 pointer-events-none z-0"></div>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className={`absolute inset-0 w-full h-full z-10 ${isDoctor ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
                            />
                        </div>

                        {/* DOCTOR SIGNATURE TOOLBAR */}
                        {isDoctor && (
                            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                    <button 
                                        type="button"
                                        onClick={handleSaveSignature} 
                                        className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Confirm Signature</span>
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={clearSignature} 
                                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}