import React, { useState } from 'react';

export default function FamilyMedicalHistory() {
    // 1. Centralized State for all conditions
    const [isNone, setIsNone] = useState(false);
    const [conditions, setConditions] = useState({
        Hypertension: false,
        Stroke: false,
        Diabetes: false,
        Tuberculosis: false,
        Asthma: false,
        Cancer: false,
        Others: false
    });

    const [cancerDetails, setCancerDetails] = useState('');
    const [otherDetails, setOtherDetails] = useState('');

    // 2. Logic: Checking "None" clears and disables everything else
    const handleNoneToggle = () => {
        const newNoneState = !isNone;
        setIsNone(newNoneState);
        if (newNoneState) {
            setConditions({
                Hypertension: false, Stroke: false, Diabetes: false,
                Tuberculosis: false, Asthma: false, Cancer: false, Others: false
            });
            setCancerDetails('');
            setOtherDetails('');
        }
    };

    // 3. Logic: Checking a condition automatically unchecks "None"
    const handleConditionToggle = (key) => {
        if (isNone) setIsNone(false);

        setConditions(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            // Clear text inputs if the user unchecks the box
            if (key === 'Cancer' && !newState.Cancer) setCancerDetails('');
            if (key === 'Others' && !newState.Others) setOtherDetails('');
            return newState;
        });
    };

    // 4. Reusable UI Component for standard checkboxes to keep code clean
    const CheckboxPill = ({ label, stateKey }) => {
        const isChecked = conditions[stateKey];
        return (
            <label
                className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-all duration-200 
                ${isNone ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                        : isChecked ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                            : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleConditionToggle(stateKey)}
                    disabled={isNone}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className={`text-sm select-none ${isNone ? 'text-gray-400' : isChecked ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                    {label}
                </span>
            </label>
        );
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">

            {/* Header */}
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Family Medical History</i> <span className="font-normal italic text-gray-500">(Check applicable and identify family members)</span>
                </h3>
            </div>

            {/* Grid Content */}
            <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

                {/* The "None" Checkbox - Prominently placed */}
                <label
                    className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-all duration-200 
                    ${isNone ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                >
                    <input
                        type="checkbox"
                        checked={isNone}
                        onChange={handleNoneToggle}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm select-none ${isNone ? 'text-emerald-800 font-bold' : 'text-gray-700 font-bold'}`}>
                        None (No known history)
                    </span>
                </label>

                {/* Standard Conditions */}
                <CheckboxPill label="Hypertension" stateKey="Hypertension" />
                <CheckboxPill label="Stroke" stateKey="Stroke" />
                <CheckboxPill label="Diabetes Mellitus" stateKey="Diabetes" />
                <CheckboxPill label="Tuberculosis" stateKey="Tuberculosis" />
                <CheckboxPill label="Bronchial Asthma" stateKey="Asthma" />

                {/* Cancer with linked Input */}
                <CheckboxPill label="Cancer" stateKey="Cancer" />
                <div>
                    <input
                        type="text"
                        placeholder="Specify type of cancer..."
                        value={cancerDetails}
                        onChange={(e) => setCancerDetails(e.target.value)}
                        disabled={!conditions.Cancer || isNone}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    />
                </div>

                {/* Others with linked Input (Spans 2 columns for longer text) */}
                <CheckboxPill label="Others (Specify)" stateKey="Others" />
                <div className="md:col-span-3">
                    <input
                        type="text"
                        placeholder="e.g. Arthritis, Eye Disease, Heart Condition"
                        value={otherDetails}
                        onChange={(e) => setOtherDetails(e.target.value)}
                        disabled={!conditions.Others || isNone}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    />
                </div>

            </div>
        </div>
    );
}