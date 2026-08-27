import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DuplicateRecordModal({ isOpen, patientName, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
                
                {/* Alert Icon */}
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                
                {/* Text Content */}
                <h3 className="text-lg font-bold text-[#0F2756] mb-2">Existing Record Found</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Patient <span className="font-bold text-gray-700">{patientName}</span> already has a wellness record. Redirect to it?
                </p>
                
                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
                    >
                        Yes, Redirect
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                        No, Go Back
                    </button>
                </div>
                
            </div>
        </div>
    );
}