import React, { useState, useEffect } from 'react';

export default function FamilyMedicalHistory({ data, onChange }) {
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

    // Populate state from API data on load
    useEffect(() => {
        if (Array.isArray(data) && data.length > 0) {
            const newConditions = {
                Hypertension: false, Stroke: false, Diabetes: false,
                Tuberculosis: false, Asthma: false, Cancer: false, Others: false
            };
            let foundNone = false;
            let cancerText = '';
            let otherText = [];

            data.forEach(item => {
                if (item.isNone) foundNone = true;

                // FIX 1: Safely check for string type to prevent dropping empty fields
                if (typeof item.conditionOther === 'string') {
                    const text = item.conditionOther.toLowerCase();

                    if (text === 'cancer' || text.includes('cancer')) {
                        newConditions.Cancer = true;
                        // Prevent the input from auto-filling with the backend fallback string
                        if (text !== 'cancer') {
                            cancerText = item.conditionOther;
                        }
                    } else {
                        newConditions.Others = true;
                        if (item.conditionOther.trim() !== '') {
                            otherText.push(item.conditionOther);
                        }
                    }
                }

                if (item.conditionID === 1) newConditions.Hypertension = true;
                if (item.conditionID === 2) newConditions.Stroke = true;
                if (item.conditionID === 3) newConditions.Diabetes = true;
                if (item.conditionID === 4) newConditions.Tuberculosis = true;
                if (item.conditionID === 5) newConditions.Asthma = true;
            });

            setIsNone(foundNone);
            setConditions(newConditions);
            setCancerDetails(cancerText);
            setOtherDetails(otherText.join(', '));
        }
    }, [data]);

    // Helper to package and send updated data upstream
    const triggerChange = (updatedNone, updatedConds, updatedCancer, updatedOther) => {
        if (!onChange) return;

        const formattedList = [];
        if (updatedNone) {
            formattedList.push({ isNone: true });
        } else {
            if (updatedConds.Hypertension) formattedList.push({ conditionID: 1 });
            if (updatedConds.Stroke) formattedList.push({ conditionID: 2 });
            if (updatedConds.Diabetes) formattedList.push({ conditionID: 3 });
            if (updatedConds.Tuberculosis) formattedList.push({ conditionID: 4 });
            if (updatedConds.Asthma) formattedList.push({ conditionID: 5 });

            if (updatedConds.Cancer) {
                // Send typed text, or fallback to 'Cancer' so the backend registers the checkbox
                formattedList.push({ conditionOther: updatedCancer.trim() !== '' ? updatedCancer : 'Cancer' });
            }

            if (updatedConds.Others) {
                // FIX 2: Removed the trim() block. Always push the object so the React UI keeps the box checked
                formattedList.push({ conditionOther: updatedOther || '' });
            }
        }

        onChange(formattedList);
    };

    const handleNoneToggle = () => {
        const nextNone = !isNone;
        setIsNone(nextNone);
        if (nextNone) {
            const clearedConditions = {
                Hypertension: false, Stroke: false, Diabetes: false,
                Tuberculosis: false, Asthma: false, Cancer: false, Others: false
            };
            setConditions(clearedConditions);
            setCancerDetails('');
            setOtherDetails('');
            triggerChange(true, clearedConditions, '', '');
        } else {
            triggerChange(false, conditions, cancerDetails, otherDetails);
        }
    };

    const handleConditionToggle = (stateKey) => {
        if (isNone) return;
        const nextConditions = { ...conditions, [stateKey]: !conditions[stateKey] };
        setConditions(nextConditions);
        triggerChange(false, nextConditions, cancerDetails, otherDetails);
    };

    const handleTextChange = (field, value) => {
        if (field === 'cancer') {
            setCancerDetails(value);
            triggerChange(false, conditions, value, otherDetails);
        } else {
            setOtherDetails(value);
            triggerChange(false, conditions, cancerDetails, value);
        }
    };

    const CheckboxPill = ({ label, stateKey }) => {
        const isChecked = conditions[stateKey];
        return (
            <label
                className={`flex items-center space-x-2 border p-2 rounded-md transition-all duration-200 
                ${isNone ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                        : isChecked ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-400 cursor-pointer'
                            : 'bg-white border-gray-200 hover:bg-teal-50/30 cursor-pointer'}`}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isNone}
                    onChange={() => handleConditionToggle(stateKey)}
                    className={`rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4 ${isNone ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <span className={`text-sm select-none ${isNone ? 'text-gray-400' : isChecked ? 'text-teal-900 font-medium' : 'text-gray-700'}`}>
                    {label}
                </span>
            </label>
        );
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-xs">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Family Medical History</i>
                </h3>
            </div>

            <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* None Checkbox */}
                <label
                    className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-all duration-200 
                    ${isNone ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-gray-200 hover:bg-teal-50/30'}`}
                >
                    <input
                        type="checkbox"
                        checked={isNone}
                        onChange={handleNoneToggle}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-sm select-none ${isNone ? 'text-teal-900 font-bold' : 'text-gray-700 font-bold'}`}>
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
                        disabled={isNone || !conditions.Cancer}
                        onChange={(e) => handleTextChange('cancer', e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm transition-all ${isNone || !conditions.Cancer ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 text-gray-700 outline-none'}`}
                        placeholder="Specify Cancer type..."
                    />
                </div>

                <CheckboxPill label="Others (Specify)" stateKey="Others" />
                <div className="md:col-span-3">
                    <input
                        type="text"
                        value={otherDetails}
                        disabled={isNone || !conditions.Others}
                        onChange={(e) => handleTextChange('other', e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm transition-all ${isNone || !conditions.Others ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300 focus:ring-2 focus:ring-teal-500 text-gray-700 outline-none'}`}
                        placeholder="Specify other conditions..."
                    />
                </div>
            </div>
        </div>
    );
}