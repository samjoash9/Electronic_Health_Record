import React from 'react';
import { Activity, Lock } from 'lucide-react';

export default function VitalSigns({ data, onChange, readOnly = false }) {
    const weight = data?.weightKg ?? '';
    const height = data?.heightCm ?? '';
    const bmi = data?.bmi ?? '';
    const bpSys = data?.bpSystolic ?? '';
    const bpDia = data?.bpDiastolic ?? '';
    const temp = data?.tempCelsius ?? '';
    const heartRate = data?.heartRate ?? '';
    const respRate = data?.respRate ?? '';

    const handleChange = (field, value) => {
        if (readOnly || !onChange) return;

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
        if (!bmi) return 'text-slate-500';
        const bmiValue = parseFloat(bmi);
        if (bmiValue < 18.5) return 'text-blue-600 font-bold';
        if (bmiValue >= 18.5 && bmiValue <= 24.9) return 'text-emerald-600 font-bold';
        if (bmiValue >= 25.0 && bmiValue <= 29.9) return 'text-orange-500 font-bold';
        return 'text-red-600 font-bold';
    };

    const inputClasses = readOnly
        ? 'w-full p-2.5 border border-slate-200 rounded-l-md text-sm bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed outline-none'
        : 'w-full p-2.5 border border-slate-300 rounded-l-md text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all';

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-xs bg-white">
            <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Vital Signs
                    </h3>
                </div>
                {readOnly ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md">
                        <Lock className="w-3 h-3 mr-0.5" />
                        <span>Station 1 Recorded (Read-Only)</span>
                    </span>
                ) : (
                    <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Station 1 Editable
                    </span>
                )}
            </div>

            <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Weight [kg]</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            step="0.1" 
                            value={weight} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('weightKg', e.target.value)} 
                            className={inputClasses} 
                            placeholder="0.0" 
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 p-2.5 rounded-r-md text-slate-600 text-sm px-3 font-semibold">kg</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Height [cm]</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            step="0.1" 
                            value={height} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('heightCm', e.target.value)} 
                            className={inputClasses} 
                            placeholder="0.0" 
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 p-2.5 rounded-r-md text-slate-600 text-sm px-3 font-semibold">cm</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">BMI</label>
                    <input 
                        type="text" 
                        value={bmi || (readOnly ? 'N/A' : 'Auto-calculated')} 
                        className={`w-full p-2.5 border border-slate-200 rounded-md bg-slate-50 outline-none text-sm font-bold ${getBmiTextColor()}`} 
                        disabled 
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Ideal BMI</label>
                    <input 
                        type="text" 
                        value="18.5 - 24.9" 
                        className="w-full p-2.5 border border-slate-200 rounded-md bg-slate-50 text-slate-500 text-sm font-medium outline-none" 
                        disabled 
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">BP [mmHg] (Sys/Dia)</label>
                    <div className={`flex items-center border rounded-md overflow-hidden ${readOnly ? 'bg-slate-100/80 border-slate-200' : 'bg-white border-slate-300 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all'}`}>
                        <input 
                            type="number" 
                            value={bpSys} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('bpSystolic', e.target.value)} 
                            className={`w-full p-2.5 text-center text-sm outline-none bg-transparent font-medium ${readOnly ? 'text-slate-700 font-semibold cursor-not-allowed' : ''}`} 
                            placeholder="Sys" 
                        />
                        <span className="text-slate-400 font-bold px-1">/</span>
                        <input 
                            type="number" 
                            value={bpDia} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('bpDiastolic', e.target.value)} 
                            className={`w-full p-2.5 text-center text-sm outline-none bg-transparent font-medium ${readOnly ? 'text-slate-700 font-semibold cursor-not-allowed' : ''}`} 
                            placeholder="Dia" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Temp [°C]</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            step="0.1" 
                            value={temp} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('tempCelsius', e.target.value)} 
                            className={inputClasses} 
                            placeholder="0.0" 
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 p-2.5 rounded-r-md text-slate-600 text-sm px-3 font-semibold">°C</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Heart Rate [bpm]</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            value={heartRate} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('heartRate', e.target.value)} 
                            className={inputClasses} 
                            placeholder="00" 
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 p-2.5 rounded-r-md text-slate-600 text-sm px-2.5 font-semibold">bpm</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Resp Rate [bpm]</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            value={respRate} 
                            disabled={readOnly}
                            onChange={(e) => handleChange('respRate', e.target.value)} 
                            className={inputClasses} 
                            placeholder="00" 
                        />
                        <span className="bg-slate-100 border border-l-0 border-slate-200 p-2.5 rounded-r-md text-slate-600 text-sm px-2.5 font-semibold">bpm</span>
                    </div>
                </div>
            </div>
        </div>
    );
}