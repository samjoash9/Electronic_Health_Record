import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
    // Auto-close the toast after 3.5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => onClose(), 3500);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const isSuccess = type === 'success';

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`flex items-center p-4 rounded-xl shadow-xl border w-80 bg-white ${isSuccess ? 'border-teal-100' : 'border-red-100'
                }`}>

                {/* Icon Box */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isSuccess ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'
                    }`}>
                    {isSuccess ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                {/* Text Content */}
                <div className="flex-1">
                    <p className={`text-sm font-bold ${isSuccess ? 'text-teal-900' : 'text-red-900'}`}>
                        {isSuccess ? 'Success' : 'Error'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{message}</p>
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                </button>

            </div>
        </div>,
        document.body
    );
}