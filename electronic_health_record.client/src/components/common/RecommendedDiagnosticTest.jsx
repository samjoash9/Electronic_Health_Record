import React, { useState, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link, List, ListOrdered, Quote } from 'lucide-react';

export default function RecommendedDiagnosticTest({ data }) {
    const [diagnosticTest, setDiagnosticTest] = useState('');
    const [impression, setImpression] = useState('');
    const [management, setManagement] = useState('');

    useEffect(() => {
        if (data) {
            setDiagnosticTest(data.recommendedDiagnosticTest || '');
            setImpression(data.impressionClinical || '');
            setManagement(data.managementTreatment || '');
        }
    }, [data]);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Recommended Diagnostic Test</i>
                </h3>
            </div>

            <div className="p-4 bg-white space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recommended Diagnostic Test */}
                    <div>
                        <div className="flex justify-end mb-1">
                            <span className="text-[10px] text-gray-400">{diagnosticTest.length} characters</span>
                        </div>
                        <div className="border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                            <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex items-center space-x-2 text-gray-500">
                                <Bold className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <Italic className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <Underline className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <Strikethrough className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <div className="w-px h-3 bg-gray-300 mx-1"></div>
                                <Quote className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <List className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <ListOrdered className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                                <Link className="w-3.5 h-3.5 cursor-pointer hover:text-gray-800" />
                            </div>
                            <textarea
                                value={diagnosticTest}
                                onChange={(e) => setDiagnosticTest(e.target.value)}
                                className="w-full p-2 h-24 focus:outline-none text-sm resize-y"
                                placeholder="Enter diagnostic tests..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Impression / Clinical */}
                    <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-800">Impression/Clinical</label>
                            <span className="text-[10px] text-gray-400">{impression.length} characters</span>
                        </div>
                        <textarea
                            value={impression}
                            onChange={(e) => setImpression(e.target.value)}
                            className="w-full flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm resize-y min-h-[96px]"
                            placeholder="Enter clinical impression..."
                        ></textarea>
                    </div>
                </div>

                {/* Management / Treatment */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-800">Management/Treatment</label>
                        <span className="text-[10px] text-gray-400">{management.length} characters</span>
                    </div>
                    <textarea
                        value={management}
                        onChange={(e) => setManagement(e.target.value)}
                        className="w-full p-2 h-20 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm resize-y"
                        placeholder="Enter management or treatment protocols..."
                    ></textarea>
                </div>

            </div>
        </div>
    );
}