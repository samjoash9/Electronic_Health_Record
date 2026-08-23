import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Minimize2,
    LayoutDashboard,
    Users,
    ClipboardClock,
    LogOut,
    Info
} from 'lucide-react';
import PHO_logo from '../../assets/images/PHO_logo.jpg';

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(true);

    const navLinks = [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { id: 'patient-records', label: 'Patient Records', path: '/patient-records', icon: Users },
        { id: 'appointment', label: 'Appointment', path: '/appointment', icon: ClipboardClock },
    ];

    return (
        <aside
            className={`bg-slate-900 h-screen flex flex-col shadow-xl transition-all duration-500 ease-in-out relative z-20 whitespace-nowrap overflow-hidden ${isExpanded ? 'w-64' : 'w-20'
                }`}
        >
            {/* Top Section: Logo & Toggle Behavior */}
            <div className="flex items-center min-h-[72px] mt-2 px-5">
                <button
                    onClick={() => !isExpanded && setIsExpanded(true)}
                    className={`flex-shrink-0 h-10 w-10 bg-white rounded-[10px] p-0.5 shadow-sm transition-all duration-300 focus:outline-none ${!isExpanded ? 'hover:ring-2 hover:ring-teal-500 cursor-pointer shadow-md' : 'cursor-default'
                        }`}
                    title={!isExpanded ? "Click to Expand Sidebar" : ""}
                >
                    <img
                        src={PHO_logo}
                        alt="PHO Logo"
                        className="h-full w-full object-cover rounded-[10px] p-0.5"
                    />
                </button>

                <div
                    className={`flex items-baseline transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 ml-3 w-36' : 'opacity-0 ml-0 w-0'
                        }`}
                >
                    <span className="text-xl font-medium italic text-teal-400 mr-[2px]">
                        e
                    </span>
                    <span className="text-xl font-black text-white tracking-wide">
                        HPR
                    </span>
                    <span className="text-[10px] font-bold text-teal-200/70 ml-1.5 uppercase tracking-[0.2em]">
                        System
                    </span>
                </div>

                <button
                    onClick={() => setIsExpanded(false)}
                    className={`cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-md transition-all duration-300 focus:outline-none ${isExpanded ? 'opacity-100 w-9 ml-auto' : 'opacity-0 w-0 p-0 pointer-events-none'
                        }`}
                    title="Minimize Sidebar"
                >
                    <Minimize2 className="h-5 w-5" />
                </button>
            </div>

            <div className="border-t border-slate-800 mt-4 mb-2 w-full flex-shrink-0"></div>

            {/* Navigation Links Group */}
            <div className="flex flex-col space-y-2 mt-2">
                {navLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                        <NavLink
                            key={link.id}
                            to={link.path}
                            title={link.label}
                            className={({ isActive }) => `flex items-center h-12 w-full transition-all duration-300 focus:outline-none justify-start rounded-r-lg
                                ${isActive
                                    // UPDATED: Active state now uses teal text and a teal left border
                                    ? 'bg-slate-800 text-teal-300 border-l-4 border-teal-400 font-semibold'
                                    : 'text-slate-400 hover:text-teal-300 hover:bg-slate-800 border-l-4 border-transparent'
                                } 
                                ${isExpanded ? 'pl-5' : 'pl-6'} 
                            `}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-300" />
                            <span
                                className={`text-sm transition-all duration-300 overflow-hidden text-left ${isExpanded ? 'opacity-100 ml-4 w-32' : 'opacity-0 ml-0 w-0'
                                    }`}
                            >
                                {link.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>

            <div className="flex-grow"></div>

            {/* Bottom Actions Area with Clean Spacing & Divider */}
            <div className="mb-4 px-4 pt-2 border-t border-slate-800 flex flex-col space-y-2">

                {/* Support Button */}
                <button
                    title="Support"
                    className={`cursor-pointer flex items-center h-11 w-full text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded-md transition-all duration-300 focus:outline-none justify-start ${isExpanded ? 'pl-3' : 'pl-4'
                        }`}
                >
                    <Info className="h-5 w-5 flex-shrink-0 transition-transform duration-300" />
                    <span
                        className={`text-sm font-medium transition-all duration-300 overflow-hidden text-left ${isExpanded ? 'opacity-100 ml-3 w-32' : 'opacity-0 ml-0 w-0'
                            }`}
                    >
                        Support
                    </span>
                </button>

                {/* Log Out Button */}
                <button
                    title="Log Out"
                    className={`cursor-pointer flex items-center h-11 w-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-all duration-300 focus:outline-none justify-start ${isExpanded ? 'pl-3' : 'pl-4'
                        }`}
                >
                    <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-300" />
                    <span
                        className={`text-sm font-medium transition-all duration-300 overflow-hidden text-left ${isExpanded ? 'opacity-100 ml-3 w-32' : 'opacity-0 ml-0 w-0'
                            }`}
                    >
                        Log Out
                    </span>
                </button>
            </div>
        </aside>
    );
}