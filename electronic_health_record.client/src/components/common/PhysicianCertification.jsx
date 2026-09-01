import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, Trash2, Check } from 'lucide-react';

export default function PhysicianCertification({ data, onChange, userRole = 'admin' }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [isSignMode, setIsSignMode] = useState(false);

    const isDoctor = userRole === 'doctor';

    const physicianName = data?.physicianName || '';
    const prcLicense = data?.prcLicense || '';

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
        if (!isSignMode || !isDoctor) return;
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
        if (!isDrawing || !isSignMode || !isDoctor) return;
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
        if (isDrawing) setIsDrawing(false);
    };

    const handleSaveSignature = () => {
        setIsSignMode(false);
        const canvas = canvasRef.current;
        const base64Signature = canvas.toDataURL('image/png');
        notifyParent('signature', base64Signature);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setIsSignMode(false);
        notifyParent('signature', null);
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-xs">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Physician Certification</i>
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col space-y-5 justify-center">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name of Physician</label>
                        <input
                            type="text"
                            value={physicianName}
                            onChange={(e) => notifyParent('physicianName', e.target.value)}
                            placeholder="e.g. Dr. Juan Dela Cruz"
                            disabled={isDoctor} // Doctors shouldn't overwrite the nurse's assignment
                            className={`w-full p-2 border rounded-md text-sm transition-shadow outline-none ${isDoctor ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 text-gray-700'}`}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">PRC License No.</label>
                            <span className={`text-[10px] font-medium transition-colors ${prcLicense.length > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                                {prcLicense.length} characters
                            </span>
                        </div>
                        <input
                            type="text"
                            value={prcLicense}
                            onChange={(e) => notifyParent('prcLicense', e.target.value)}
                            placeholder="0000000"
                            disabled={isDoctor}
                            className={`w-full p-2 border rounded-md text-sm transition-shadow outline-none ${isDoctor ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 text-gray-700'}`}
                        />
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Digital Signature Pad</label>
                    <div className={`flex-1 flex flex-col border rounded-lg overflow-hidden transition-all touch-none ${isSignMode ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-300'}`}>
                        <div className={`flex-1 min-h-[120px] ${isSignMode ? 'bg-teal-50/30' : 'bg-gray-50/50'} relative`}>
                            {!hasSignature && !isSignMode && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <span className="text-gray-400 select-none text-sm font-medium">
                                        {isDoctor ? 'Click "Sign" to unlock' : 'Pending Physician Signature...'}
                                    </span>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 border-b-2 border-dashed border-gray-200 pointer-events-none z-0"></div>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className={`absolute inset-0 w-full h-full z-10 ${isSignMode ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
                            />
                        </div>

                        {/* ROLE CHECK: Only render buttons if the user is a doctor */}
                        {isDoctor && (
                            <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-2">
                                {isSignMode ? (
                                    <button onClick={handleSaveSignature} className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-sm cursor-pointer">
                                        <Check className="w-3.5 h-3.5 mr-1.5" /> Save
                                    </button>
                                ) : (
                                    <button onClick={() => setIsSignMode(true)} className="flex-1 sm:flex-none px-4 py-1.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 transition-colors flex items-center justify-center shadow-sm cursor-pointer">
                                        <PenTool className="w-3.5 h-3.5 mr-1.5" /> Sign
                                    </button>
                                )}
                                <button disabled={isSignMode} className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm cursor-pointer">
                                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                                </button>
                                <button onClick={clearSignature} className="px-3 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded text-xs font-medium transition-colors flex items-center justify-center sm:ml-auto cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}