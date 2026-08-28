import React from 'react';

export default function VitalSigns({ data, onChange }) {
    const weight = data?.weightKg ?? '';
    const height = data?.heightCm ?? '';
    const bmi = data?.bmi ?? '';
    const bpSys = data?.bpSystolic ?? '';
    const bpDia = data?.bpDiastolic ?? '';
    const temp = data?.tempCelsius ?? '';
    const heartRate = data?.heartRate ?? '';
    const respRate = data?.respRate ?? '';

    const handleChange = (field, value) => {
        if (!onChange) return;

        let finalValue = value === '' ? null : parseFloat(value);
        let updates = { [field]: finalValue };

        // Auto-calculate BMI if weight or height changes
        if (field === 'weightKg' || field === 'heightCm') {
            const currentWeight = field === 'weightKg' ? finalValue : parseFloat(weight);
            const currentHeight = field === 'heightCm' ? finalValue : parseFloat(height);

            if (currentWeight > 0 && currentHeight > 0) {
                const heightInMeters = currentHeight / 100;
                const calculatedBmi = currentWeight / (heightInMeters * heightInMeters);
                updates.bmi = parseFloat(calculatedBmi.toFixed(2));
            } else {
                updates.bmi = null;
            }
        }
        onChange(updates);
    };

    const getBmiTextColor = () => {
        if (!bmi) return 'text-gray-500';
        const bmiValue = parseFloat(bmi);
        if (bmiValue < 18.5) return 'text-blue-500 font-bold';
        if (bmiValue >= 18.5 && bmiValue <= 24.9) return 'text-emerald-600 font-bold';
        if (bmiValue >= 25.0 && bmiValue <= 29.9) return 'text-orange-500 font-bold';
        return 'text-red-600 font-bold';
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-xs">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Vital Signs</i>
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Weight [kg]</label>
                    <div className="flex items-center">
                        <input type="number" step="0.1" value={weight} onChange={(e) => handleChange('weightKg', e.target.value)} className="w-full p-2 border border-gray-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="0.0" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600 text-sm px-3 font-medium">kg</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Height [cm]</label>
                    <div className="flex items-center">
                        <input type="number" step="0.1" value={height} onChange={(e) => handleChange('heightCm', e.target.value)} className="w-full p-2 border border-gray-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="0.0" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600 text-sm px-3 font-medium">cm</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">BMI</label>
                    <input type="text" value={bmi || 'Auto-calculated'} className={`w-full p-2 border border-gray-300 rounded-md bg-gray-50 outline-none ${getBmiTextColor()}`} disabled />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ideal BMI</label>
                    <input type="text" value="18.5 - 24.9" className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm outline-none" disabled />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">BP [mmHg] (Sys/Dia)</label>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
                        <input type="number" value={bpSys} onChange={(e) => handleChange('bpSystolic', e.target.value)} className="w-full p-2 text-center text-sm outline-none bg-transparent" placeholder="Sys" />
                        <span className="text-gray-400 font-bold px-1">/</span>
                        <input type="number" value={bpDia} onChange={(e) => handleChange('bpDiastolic', e.target.value)} className="w-full p-2 text-center text-sm outline-none bg-transparent" placeholder="Dia" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Temp [°C]</label>
                    <div className="flex items-center">
                        <input type="number" step="0.1" value={temp} onChange={(e) => handleChange('tempCelsius', e.target.value)} className="w-full p-2 border border-gray-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="0.0" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600 text-sm px-3 font-medium">°C</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Heart Rate [bpm]</label>
                    <div className="flex items-center">
                        <input type="number" value={heartRate} onChange={(e) => handleChange('heartRate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="00" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600 text-sm px-2 font-medium">bpm</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">RR [bpm]</label>
                    <div className="flex items-center">
                        <input type="number" value={respRate} onChange={(e) => handleChange('respRate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all" placeholder="00" />
                        <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600 text-sm px-2 font-medium">bpm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}