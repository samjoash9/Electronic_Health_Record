import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function PastMedicalHistory({ data, onChange }) { // <--- Added onChange prop
    // State to manage dynamic rows
    const [records, setRecords] = useState([
        { id: 1, condition: '', year: '', drugs: '' }
    ]);

    // Populate rows from backend database array
    useEffect(() => {
        if (Array.isArray(data) && data.length > 0) {
            const mappedRecords = data.map((item, index) => ({
                id: item.pmhid || index + 1,
                condition: item.conditionID ? `Condition ID: ${item.conditionID}` : (item.conditionOther || 'Condition'),
                year: item.yearDiagnosed ? String(item.yearDiagnosed) : '',
                drugs: [item.maintenanceDrugGeneric, item.dosage, item.frequency].filter(Boolean).join(', ')
            }));
            setRecords(mappedRecords);
        }
    }, [data]);

    // Helper to format and send data to parent
    const notifyParent = (updatedRecords) => {
        if (onChange) {
            // Translating the UI state back to the DTO structure your C# API likely expects
            const payload = updatedRecords.map(record => ({
                pmhid: typeof record.id === 'number' && record.id < 1000000000000 ? record.id : 0,
                conditionOther: record.condition,
                yearDiagnosed: parseInt(record.year) || null,
                maintenanceDrugGeneric: record.drugs,
                dosage: '',
                frequency: ''
            }));
            onChange(payload);
        }
    };

    const addRecord = () => {
        const newRecords = [...records, { id: Date.now(), condition: '', year: '', drugs: '' }];
        setRecords(newRecords);
        notifyParent(newRecords); // <--- Sync with parent
    };

    const removeRecord = (id) => {
        if (records.length > 1) {
            const newRecords = records.filter(record => record.id !== id);
            setRecords(newRecords);
            notifyParent(newRecords); // <--- Sync with parent
        }
    };

    // Handle typing in the inputs
    const handleInputChange = (id, field, value) => {
        const newRecords = records.map(record => {
            if (record.id === id) {
                return { ...record, [field]: value };
            }
            return record;
        });
        setRecords(newRecords);
        notifyParent(newRecords); // <--- Sync with parent
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">

            {/* Header Title */}
            <div className="bg-gray-50 p-3 border-b border-gray-200">
                <h3 className="text-md font-bold text-gray-800">
                    <i>Past Medical History</i>
                </h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-2 px-3 w-12 border-r border-gray-200 text-center text-xs font-bold text-gray-400">#</th>
                            <th className="py-2 px-3 text-xs font-bold text-gray-800 border-r border-gray-200 w-1/4">Condition</th>
                            <th className="py-2 px-3 text-xs font-bold text-gray-800 border-r border-gray-200 w-1/4">Year Diagnosed</th>
                            <th className="py-2 px-3 text-xs font-bold text-gray-800 border-r border-gray-200 w-2/4">Maintenance Drugs (Generic, Dosage, Frequency)</th>
                            <th className="py-2 px-3 w-12 text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, index) => (
                            <tr key={record.id} className="border-b border-gray-100 last:border-0 bg-white group hover:bg-blue-50/30 transition-colors">

                                <td className="py-2 px-3 border-r border-gray-200 text-center">
                                    <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                        {index + 1}
                                    </span>
                                </td>

                                {/* Condition Input */}
                                <td className="py-2 px-3 border-r border-gray-200">
                                    <input
                                        type="text"
                                        value={record.condition}
                                        onChange={(e) => handleInputChange(record.id, 'condition', e.target.value)}
                                        placeholder="e.g. Hypertension"
                                        className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                                    />
                                </td>

                                {/* Year Input */}
                                <td className="py-2 px-3 border-r border-gray-200">
                                    <input
                                        type="text"
                                        value={record.year}
                                        onChange={(e) => handleInputChange(record.id, 'year', e.target.value)}
                                        placeholder="YYYY"
                                        className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white"
                                    />
                                </td>

                                {/* Maintenance Drugs Input */}
                                <td className="py-2 px-3 border-r border-gray-200 relative">
                                    <input
                                        type="text"
                                        value={record.drugs}
                                        onChange={(e) => handleInputChange(record.id, 'drugs', e.target.value)}
                                        placeholder="Enter maintenance drugs..."
                                        className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm bg-white transition-all"
                                    />
                                </td>

                                {/* Delete Button */}
                                <td className="py-2 px-3 text-center">
                                    <button
                                        onClick={() => removeRecord(record.id)}
                                        className="text-gray-300 hover:text-red-500 focus:outline-none transition-colors"
                                        title="Delete Row"
                                        disabled={records.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4 mx-auto" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Footer */}
            <div className="p-3 bg-white border-t border-gray-200">
                <button
                    onClick={addRecord}
                    className="px-4 py-1.5 bg-[#198754] text-white text-sm font-medium rounded hover:bg-green-700 transition-colors shadow-sm"
                >
                    + Add New Condition
                </button>
            </div>
        </div>
    );
}