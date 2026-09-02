import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Mail, Shield, KeyRound } from 'lucide-react';

export default function EmployeeRecord({ isOpen, onClose, mode, employeeData, onSuccess }) {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Searchable Email Dropdown States
    const [emailSearchTerm, setEmailSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const defaultPassword = 'Password123!';
    const initialFormState = {
        employeeID: null,
        email: '',
        fullName: '',
        password: defaultPassword,
        role: '' // Set to empty so the 'required' attribute enforces a selection
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch available users and set up form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === 'add') {
                setFormData(initialFormState);
                setEmailSearchTerm('');
                fetchAvailableUsers();
            } else if (mode === 'edit' && employeeData) {
                setFormData({
                    employeeID: employeeData.employeeID,
                    email: employeeData.email || '',
                    fullName: employeeData.fullName || '',
                    password: '••••••••', // Masked for edit mode
                    role: employeeData.role || ''
                });
                setEmailSearchTerm(employeeData.email || '');
            }
        }
    }, [isOpen, mode, employeeData]);

    const fetchAvailableUsers = async () => {
        try {
            const userRes = await axios.get('/api/Users/Available');
            setAvailableUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data.items || []);
        } catch (error) {
            console.error("Failed to fetch available users:", error);
            // UPDATED MOCK DATA: id, email, firstName, lastName, contact
            setAvailableUsers([
                { id: 1, email: 'jdelacruz@ehpr.local', firstName: 'Juan', lastName: 'Dela Cruz', contact: '09171234567' },
                { id: 2, email: 'msmith@ehpr.local', firstName: 'Maria', lastName: 'Smith', contact: '09181234567' },
                { id: 3, email: 'santonio@ehpr.local', firstName: 'Sam', lastName: 'Antonio', contact: '09191234567' }
            ]);
        }
    };

    const handleEmailType = (e) => {
        const val = e.target.value;
        setEmailSearchTerm(val);
        setShowSuggestions(true);

        if (val !== formData.email) {
            setFormData(prev => ({ ...prev, email: '', fullName: '' }));
        }
    };

    const handleUserSelect = (user) => {
        setEmailSearchTerm(user.email);

        setFormData(prev => ({
            ...prev,
            email: user.email,
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        }));
        setShowSuggestions(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (mode === 'add' && !formData.email) {
            alert("Please select a valid user from the dropdown.");
            return;
        }

        setIsSaving(true);
        try {
            if (mode === 'add') {
                await axios.post('/api/Employees', formData);
            } else {
                await axios.put(`/api/Employees/${formData.employeeID}`, formData);
            }

            alert(`Employee successfully ${mode === 'add' ? 'added' : 'updated'}!`);
            onSuccess(); // Triggers table refresh in parent
            onClose();   // Closes the modal
        } catch (error) {
            console.error("Failed to save employee:", error);
            const serverMessage = error.response?.data;
            alert(typeof serverMessage === 'string' ? serverMessage : "Error saving employee. Check connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const dropdownSuggestions = availableUsers.filter(u =>
        (u.email || '').toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
        ((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase().includes(emailSearchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

                <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{mode === 'add' ? 'Register New Employee' : 'Edit Employee'}</h2>
                        <p className="text-sm text-slate-300 mt-0.5">Link an account and assign system roles.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {/* SEARCHABLE EMAIL DROPDOWN */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Search & Select Registered Email</label>
                        {mode === 'add' ? (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-teal-500" />
                                </div>
                                <input
                                    type="text"
                                    required // ENFORCES INPUT
                                    value={emailSearchTerm}
                                    onChange={handleEmailType}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    placeholder="Type name or email to search..."
                                    className="w-full pl-11 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white"
                                    autoComplete="off"
                                />

                                {showSuggestions && emailSearchTerm.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                        {dropdownSuggestions.length > 0 ? (
                                            dropdownSuggestions.map(user => (
                                                <div
                                                    key={user.id || user.email}
                                                    onClick={() => handleUserSelect(user)}
                                                    className="px-5 py-3 hover:bg-teal-50 border-b border-slate-100 last:border-0 cursor-pointer transition-colors flex justify-between items-center"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                        {user.contact}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-5 py-4 text-sm text-slate-500 italic">No matches found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed">
                                {formData.email}
                            </div>
                        )}
                    </div>

                    {/* AUTO-FILLED ROW */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            readOnly
                            value={formData.fullName}
                            className="w-full p-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600 outline-none"
                            placeholder="Auto-filled"
                        />
                    </div>

                    {/* ROLE & PASSWORD ROW */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign Role</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-teal-500" />
                                </div>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required // ENFORCES SELECTION
                                    className="w-full pl-11 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white cursor-pointer"
                                >
                                    <option value="" disabled>-- Select a Role --</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Nurse">Nurse</option>
                                    <option value="Doctor">Doctor</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Temporary Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-teal-500" />
                                </div>
                                <input
                                    type="text"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={mode === 'edit'}
                                    className={`w-full pl-11 p-3 border rounded-lg text-sm outline-none transition-all ${mode === 'edit' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-800'
                                        }`}
                                />
                            </div>
                            {mode === 'add' && (
                                <p className="text-xs text-slate-400 mt-1.5">User will be prompted to change this on login.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving || (mode === 'add' && !formData.email)} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}