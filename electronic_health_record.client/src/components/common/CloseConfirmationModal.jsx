import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

export default function CloseConfirmationModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    // createPortal renders this completely outside of the form's CSS structure
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">

                {/* Alert Icon */}
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>

                {/* Text Content */}
                <h3 className="text-lg font-bold text-[#0F2756] mb-2">Unsaved Changes</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to close? Any unsaved changes will be lost.
                </p>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
                    >
                        Yes, Close
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                        No, Go Back
                    </button>
                </div>

            </div>
        </div>,
        document.body 
    );
}