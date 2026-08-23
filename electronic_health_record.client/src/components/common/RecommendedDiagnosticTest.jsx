import React from 'react';
import { Bold, Italic, Underline, Strikethrough, Link, List, ListOrdered, Quote } from 'lucide-react';

export default function RecommendedDiagnosticTest() {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Recommended Diagnostic Test</i>
                </h3>
            </div>

            <div className="p-4 bg-white space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rich Text Editor Placeholder */}
                    <div>
                        <div className="flex justify-end mb-1">
                            <span className="text-[10px] text-gray-400">0 characters</span>
                        </div>
                        <div className="border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                            {/* Fake Toolbar */}
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
                            <textarea className="w-full p-2 h-24 focus:outline-none text-sm resize-y" placeholder="Enter diagnostic tests..."></textarea>
                        </div>
                    </div>

                    {/* Impression / Clinical */}
                    <div className="flex flex-col">
                        <div className="flex justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-800">Impression/Clinical</label>
                            <span className="text-[10px] text-gray-400">0 characters</span>
                        </div>
                        <textarea className="w-full flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm resize-y min-h-[96px]"></textarea>
                    </div>
                </div>

                {/* Management / Treatment */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-800">Management/Treatment</label>
                        <span className="text-[10px] text-gray-400">0 characters</span>
                    </div>
                    <textarea className="w-full p-2 h-20 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm resize-y"></textarea>
                </div>

            </div>
        </div>
    );
}