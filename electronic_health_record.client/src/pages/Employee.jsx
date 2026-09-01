import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Loader2, Edit, Trash2, Mail, Search } from 'lucide-react';
import EmployeeRecord from '../components/common/EmployeeRecord';

export default function Employee() {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Control States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const empRes = await axios.get('http://localhost:5084/api/Employees');
            setEmployees(Array.isArray(empRes.data) ? empRes.data : empRes.data.items || []);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this employee?")) return;

        try {
            await axios.delete(`http://localhost:5084/api/Employees/${id}`);
            await fetchEmployees();
        } catch (error) {
            console.error("Failed to delete employee:", error);
            alert("Cannot delete employee. They may have dependent records in the system.");
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const openEditModal = (emp) => {
        setModalMode('edit');
        setSelectedEmployee(emp);
        setIsModalOpen(true);
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full max-w-7xl mx-auto pb-10 relative">

            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage system access, roles, and employee credentials.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><Search className="w-4 h-4" /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search employees..."
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* EMPLOYEES TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-6 font-semibold">Full Name</th>
                                <th className="py-3 px-6 font-semibold">Username</th>
                                <th className="py-3 px-6 font-semibold">Email</th>
                                <th className="py-3 px-6 font-semibold">System Role</th>
                                <th className="py-3 px-6 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                                        <p>Loading employees...</p>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400">
                                        <p>No employees found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.employeeID} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-slate-900">{emp.fullName}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-medium text-slate-600">@{emp.username}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                {emp.email}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${emp.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                                                    emp.role === 'Doctor' ? 'bg-teal-100 text-teal-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => openEditModal(emp)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(emp.employeeID)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MOUNT THE MODAL COMPONENT */}
            <EmployeeRecord
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                employeeData={selectedEmployee}
                onSuccess={fetchEmployees}
            />

        </div>
    );
}