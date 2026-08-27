import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, Trash2, Check } from 'lucide-react';

export default function PhysicianCertification() {
    const [prcLicense, setPrcLicense] = useState('');

    // 1. Signature Pad States
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // NEW QA FIX: Lock state for the canvas
    const [isSignMode, setIsSignMode] = useState(false);

    // 2. Initialize Canvas dimensions and "ink" style
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#0F2756'; // Professional dark blue ink
        }
    }, []);

    // 3. Drawing Logic
    const startDrawing = (e) => {
        // QA FIX: Prevent drawing if the user hasn't clicked "Sign"
        if (!isSignMode) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        if (e.cancelable) e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        // QA FIX: Double check sign mode
        if (!isDrawing || !isSignMode) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        if (e.cancelable) e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
        }
    };

    // 4. Actions
    const handleSave = () => {
        setIsSignMode(false); // Lock the canvas
        // In a real app, you would also do: const imageData = canvasRef.current.toDataURL(); here
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setIsSignMode(false); // Reset lock state
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">

            {/* Header */}
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    Physician Certification
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Side: Physician Details */}
                <div className="flex flex-col space-y-5 justify-center">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name of Physician</label>
                        <input
                            type="text"
                            placeholder="e.g. Dr. Juan Dela Cruz"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm transition-shadow"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">PRC License No.</label>
                            <span className={`text-[10px] font-medium transition-colors ${prcLicense.length > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                {prcLicense.length} characters
                            </span>
                        </div>
                        <input
                            type="text"
                            value={prcLicense}
                            onChange={(e) => setPrcLicense(e.target.value)}
                            placeholder="0000000"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm transition-shadow"
                        />
                    </div>
                </div>

                {/* Right Side: Signature Pad Area */}
                <div className="flex flex-col h-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Digital Signature Pad</label>

                    {/* Pad Container - Adds a blue border when actively signing */}
                    <div className={`flex-1 flex flex-col border rounded-lg overflow-hidden transition-all touch-none ${isSignMode ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}`}>

                        {/* Drawing Canvas Area */}
                        <div className={`flex-1 min-h-[120px] ${isSignMode ? 'bg-blue-50/30' : 'bg-gray-50/50'} relative`}>

                            {/* Placeholder / Status Text */}
                            {!hasSignature && !isSignMode && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <span className="text-gray-400 select-none text-sm font-medium">Click "Sign" to unlock</span>
                                </div>
                            )}

                            {/* Visual guide line */}
                            <div className="absolute bottom-4 left-4 right-4 border-b-2 border-dashed border-gray-200 pointer-events-none z-0"></div>

                            {/* The Actual Canvas Element */}
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                // QA FIX: Change cursor based on sign mode
                                className={`absolute inset-0 w-full h-full z-10 ${isSignMode ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
                            />
                        </div>

                        {/* Action Toolbar */}
                        <div className="p-2.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-2">

                            {/* QA FIX: Dynamic Button (Sign vs Save) */}
                            {isSignMode ? (
                                <button
                                    onClick={handleSave}
                                    className="flex-1 sm:flex-none px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-sm"
                                >
                                    <Check className="w-3.5 h-3.5 mr-1.5" />
                                    Save
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsSignMode(true)}
                                    className="flex-1 sm:flex-none px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                                >
                                    <PenTool className="w-3.5 h-3.5 mr-1.5" />
                                    Sign
                                </button>
                            )}

                            <button
                                disabled={isSignMode}
                                className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Upload
                            </button>

                            <button
                                onClick={clearSignature}
                                className="px-3 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded text-xs font-medium transition-colors flex items-center justify-center sm:ml-auto"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Clear
                            </button>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}