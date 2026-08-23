import React from 'react';

export default function SocialHistory() {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">

            {/* Header */}
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Social History</i>
                </h3>
            </div>

            {/* Grid Content */}
            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                {/* Smoking */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Smoking: No of Sticks/Day</label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            min="0"
                            placeholder="e.g. 0"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Drinking */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">How often do you drink?</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white text-gray-700">
                            <option value="">Select frequency...</option>
                            <option value="never">Never</option>
                            <option value="occasionally">Occasionally / Socially</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            placeholder="Type (e.g. Beer)"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Exercise */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Exercise: Frequency</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white text-gray-700">
                        <option value="">Select frequency...</option>
                        <option value="none">None / Sedentary</option>
                        <option value="light">1-2 times a week</option>
                        <option value="moderate">3-4 times a week</option>
                        <option value="daily">Daily / Active</option>
                    </select>
                </div>

                {/* Tension / Drunk */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                        {/* Adjusted label slightly for cleaner flexbox alignment */}
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Sensing tension / Have been drunk?
                        </label>
                        <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm bg-white text-gray-700">
                            <option value="">Select frequency...</option>
                            <option value="never">Never</option>
                            <option value="rarely">Rarely</option>
                            <option value="sometimes">Sometimes</option>
                            <option value="often">Often</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            placeholder="Specify details"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}