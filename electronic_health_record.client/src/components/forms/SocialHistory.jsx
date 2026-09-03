import React, { useState, useEffect } from 'react';

export default function SocialHistory({ data, onChange }) {
    const [smoking, setSmoking] = useState('');
    const [drinkFreq, setDrinkFreq] = useState('');
    const [drinksPerSession, setDrinksPerSession] = useState('');
    const [exerciseFreq, setExerciseFreq] = useState('');
    const [drunkFreq, setDrunkFreq] = useState('');
    const [exerciseType, setExerciseType] = useState('');

    useEffect(() => {
        if (data) {
            const sh = data;
            setSmoking(sh.smokingSticksPerDay ?? '');
            setDrinkFreq(sh.drinkFrequency || '');
            setDrinksPerSession(sh.drinksPerSession || '');
            setExerciseFreq(sh.exerciseFrequency || '');
            setDrunkFreq(sh.drunkFrequency || '');
            setExerciseType(sh.exerciseType || '');
        }
    }, [data]);

    // Helper to update state and bubble changes up safely
    const handleChange = (field, value) => {
        if (field === 'smoking') setSmoking(value);
        if (field === 'drinkFreq') setDrinkFreq(value);
        if (field === 'drinksPerSession') setDrinksPerSession(value);
        if (field === 'exerciseFreq') setExerciseFreq(value);
        if (field === 'drunkFreq') setDrunkFreq(value);
        if (field === 'exerciseType') setExerciseType(value);

        if (onChange) {
            // Safely parse smoking to an integer or null for the C# backend
            let parsedSmoking = field === 'smoking' ? value : smoking;
            if (parsedSmoking === '') {
                parsedSmoking = null;
            } else if (parsedSmoking !== null && !isNaN(parsedSmoking)) {
                parsedSmoking = parseInt(parsedSmoking, 10);
            }

            onChange({
                smokingSticksPerDay: parsedSmoking,
                drinkFrequency: field === 'drinkFreq' ? value : drinkFreq,
                drinksPerSession: field === 'drinksPerSession' ? value : drinksPerSession,
                exerciseFrequency: field === 'exerciseFreq' ? value : exerciseFreq,
                drunkFrequency: field === 'drunkFreq' ? value : drunkFreq,
                exerciseType: field === 'exerciseType' ? value : exerciseType,
            });
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-xs">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Social History</i>
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Smoking */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Smoking: No of Sticks/Day</label>
                    <input
                        type="number"
                        value={smoking}
                        onChange={(e) => handleChange('smoking', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                        placeholder="0"
                    />
                </div>

                {/* Drinking (Drink Frequency + Drinks Per Session) */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">How often do you drink?</label>
                        <input
                            type="text"
                            value={drinkFreq}
                            onChange={(e) => handleChange('drinkFreq', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                            placeholder="e.g. Occasional"
                        />
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            value={drinksPerSession}
                            onChange={(e) => handleChange('drinksPerSession', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                            placeholder="Per Session"
                        />
                    </div>
                </div>

                {/* Exercise (Exercise Frequency) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Exercise: Frequency</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={exerciseFreq}
                            onChange={(e) => handleChange('exerciseFreq', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                            placeholder="e.g. 3x a week"
                        />
                    </div>
                </div>

                {/* Tension / Drunk (Drunk Frequency + Exercise Type / Details) */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Sensing tension / Have been drunk?
                        </label>
                        <input
                            type="text"
                            value={drunkFreq}
                            onChange={(e) => handleChange('drunkFreq', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                            placeholder="e.g. Never"
                        />
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            value={exerciseType}
                            onChange={(e) => handleChange('exerciseType', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm text-gray-700 transition-all"
                            placeholder="Specify"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}