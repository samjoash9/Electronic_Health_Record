import React, { useState, useEffect } from 'react';

export default function FamilyMedicalHistory({ data }) {
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

    useEffect(() => {
        if (data && data.familyMedicalHistory && data.familyMedicalHistory.length > 0) {
            const newConditions = {
                Hypertension: false, Stroke: false, Diabetes: false,
                Tuberculosis: false, Asthma: false, Cancer: false, Others: false
            };
            let foundNone = false;
            let cancerText = '';
            let otherText = '';

            data.familyMedicalHistory.forEach(item => {
                if (item.isNone) {
                    foundNone = true;
                }
                // Map based on condition IDs or names/text
                if (item.conditionOther) {
                    const text = item.conditionOther.toLowerCase();
                    if (text.includes('cancer')) {
                        newConditions.Cancer = true;
                        cancerText = item.conditionOther;
                    } else {
                        newConditions.Others = true;
                        otherText = item.conditionOther;
                    }
                }
                // If you use standard ConditionIDs (e.g., 1=Hypertension, 2=Stroke, etc.)
                if (item.conditionID === 1) newConditions.Hypertension = true;
                if (item.conditionID === 2) newConditions.Stroke = true;
                if (item.conditionID === 3) newConditions.Diabetes = true;
                if (item.conditionID === 4) newConditions.Tuberculosis = true;
                if (item.conditionID === 5) newConditions.Asthma = true;
            });

            setIsNone(foundNone);
            setConditions(newConditions);
            setCancerDetails(cancerText);
            setOtherDetails(otherText);
        }
    }, [data]);

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
                    disabled={true} // Read-only form view when clicked from table
                    className="rounded border-gray-300 text-blue-600 w-4 h-4"
                />
                <span className={`text-sm select-none ${isNone ? 'text-gray-400' : isChecked ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                    {label}
                </span>
            </label>
        );
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Family Medical History</i> <span className="font-normal italic text-gray-500">(Mapped from Database)</span>
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label
                    className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-all duration-200 
                    ${isNone ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white border-gray-200'}`}
                >
                    <input
                        type="checkbox"
                        checked={isNone}
                        disabled={true}
                        className="rounded border-gray-300 text-emerald-600 w-4 h-4"
                    />
                    <span className={`text-sm select-none ${isNone ? 'text-emerald-800 font-bold' : 'text-gray-700 font-bold'}`}>
                        None (No known history)
                    </span>
                </label>

                <CheckboxPill label="Hypertension" stateKey="Hypertension" />
                <CheckboxPill label="Stroke" stateKey="Stroke" />
                <CheckboxPill label="Diabetes Mellitus" stateKey="Diabetes" />
                <CheckboxPill label="Tuberculosis" stateKey="Tuberculosis" />
                <CheckboxPill label="Bronchial Asthma" stateKey="Asthma" />

                <CheckboxPill label="Cancer" stateKey="Cancer" />
                <div>
                    <input
                        type="text"
                        value={cancerDetails}
                        disabled={true}
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600"
                        placeholder="N/A"
                    />
                </div>

                <CheckboxPill label="Others (Specify)" stateKey="Others" />
                <div className="md:col-span-3">
                    <input
                        type="text"
                        value={otherDetails}
                        disabled={true}
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600"
                        placeholder="N/A"
                    />
                </div>
            </div>
        </div>
    );
}