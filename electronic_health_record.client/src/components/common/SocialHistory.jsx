import React, { useState, useEffect } from 'react';

export default function SocialHistory({ data }) {
    const [smoking, setSmoking] = useState('');
    const [drinkFreq, setDrinkFreq] = useState('');
    const [drinksPerSession, setDrinksPerSession] = useState('');
    const [exerciseFreq, setExerciseFreq] = useState('');
    const [drunkFreq, setDrunkFreq] = useState('');
    const [exerciseType, setExerciseType] = useState('');

    useEffect(() => {
        if (data) {
            const sh = data; // Since wellnessResponse.socialHistory is passed directly as 'data'
            setSmoking(sh.smokingSticksPerDay ?? '');
            setDrinkFreq(sh.drinkFrequency || '');
            setDrinksPerSession(sh.drinksPerSession || '');
            setExerciseFreq(sh.exerciseFrequency || '');
            setDrunkFreq(sh.drunkFrequency || '');
            setExerciseType(sh.exerciseType || '');
        }
    }, [data]);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
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
                        disabled={true}
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
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
                            disabled={true}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                            placeholder="N/A"
                        />
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            value={drinksPerSession}
                            disabled={true}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                            placeholder="Per Session"
                        />
                    </div>
                </div>

                {/* Exercise (Exercise Frequency + Exercise Type) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Exercise: Frequency</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={exerciseFreq}
                            disabled={true}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                            placeholder="N/A"
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
                            disabled={true}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                            placeholder="N/A"
                        />
                    </div>
                    <div className="w-full sm:w-1/3 mt-auto">
                        <input
                            type="text"
                            value={exerciseType}
                            disabled={true}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                            placeholder="Specify"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}