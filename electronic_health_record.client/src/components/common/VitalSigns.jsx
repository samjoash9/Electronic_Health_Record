import React, { useState, useEffect } from 'react';

export default function VitalSigns() {
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState('');

    useEffect(() => {
        const weightNum = parseFloat(weight);
        const heightNum = parseFloat(height);

        if (weightNum > 0 && heightNum > 0) {
            const heightInMeters = heightNum / 100;
            const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
            setBmi(calculatedBmi.toFixed(2));
        } else {
            setBmi('');
        }
    }, [weight, height]);

    const getBmiTextColor = () => {
        if (!bmi) return 'text-gray-500';
        const bmiValue = parseFloat(bmi);
        if (bmiValue < 18.5) return 'text-blue-500 font-bold';
        if (bmiValue >= 18.5 && bmiValue <= 24.9) return 'text-emerald-600 font-bold';
        if (bmiValue >= 25.0 && bmiValue <= 29.9) return 'text-orange-500 font-bold';
        return 'text-red-600 font-bold';
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">

            {/* Standardized Header with Legend */}
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Vital Signs</i>
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-medium text-gray-600">
                    <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> Underweight
                    </span>
                    <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 mr-1.5"></span> Normal
                    </span>
                    <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5"></span> Overweight
                    </span>
                    <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-red-600 mr-1.5"></span> Obese
                    </span>
                </div>
            </div>

            {/* Grid Content - Now a perfect 4x2 Grid */}
            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* ROW 1 ------------------------------------------- */}
                {/* Weight */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Weight [kg]</label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            placeholder="0.0"
                        />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-500 text-sm font-medium px-3">kg</span>
                    </div>
                </div>

                {/* Height */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Height [cm]</label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            placeholder="0.0"
                        />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-500 text-sm font-medium px-3">cm</span>
                    </div>
                </div>

                {/* BMI */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">BMI</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={bmi || 'Auto-calculated'}
                            className={`w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none ${getBmiTextColor()}`}
                            disabled
                        />
                    </div>
                </div>

                {/* Ideal BMI */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ideal BMI</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            value="18.5 - 24.9"
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 focus:outline-none font-medium"
                            disabled
                        />
                    </div>
                </div>


                {/* ROW 2 ------------------------------------------- */}
                {/* Blood Pressure - UI IMPROVED */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">BP [mmHg] (Sys/Dia)</label>
                    {/* Wrapped the two inputs in a single border to save space and look cohesive */}
                    <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 overflow-hidden bg-white">
                        <input type="number" min="0" className="w-full p-2 text-center focus:outline-none" placeholder="Sys" />
                        <span className="text-gray-300 select-none">/</span>
                        <input type="number" min="0" className="w-full p-2 text-center focus:outline-none" placeholder="Dia" />
                    </div>
                </div>

                {/* Temperature */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Temp [°C]</label>
                    <div className="flex items-center">
                        <input type="number" step="0.1" className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400 focus:outline-none" placeholder="0.0" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-500 text-sm font-medium px-3">°C</span>
                    </div>
                </div>

                {/* Heart Rate */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Heart Rate [bpm]</label>
                    <div className="flex items-center">
                        <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400 focus:outline-none" placeholder="00" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-500 text-sm font-medium px-2">bpm</span>
                    </div>
                </div>

                {/* Respiratory Rate - Now fits perfectly on row 2! */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">RR [bpm]</label>
                    <div className="flex items-center">
                        <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-400 focus:outline-none" placeholder="00" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-500 text-sm font-medium px-2">bpm</span>
                    </div>
                </div>

            </div>
        </div>
    );
}