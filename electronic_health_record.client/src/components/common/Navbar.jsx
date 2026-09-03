import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import meljun from "../../assets/images/meljun.png";
import { getUser } from '../../services/auth/auth';
import { useAuth, ROLES } from '../../context/AuthContext';

export default function Navbar({ user: propUser, currentRole: propRole, onRoleChange: propOnRoleChange }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const navigate = useNavigate();
    const authContext = useAuth() || {};
    const authUser = authContext.user;
    const logout = authContext.logout;
    const switchRoleForTesting = authContext.switchRoleForTesting;

    const currentRole = propRole || authUser?.role || 'superadmin';
    const onRoleChange = propOnRoleChange || switchRoleForTesting;

    const fallbackUser = {
        name: authUser?.name || "MelJun Makunat",
        role: currentRole,
        avatar: meljun
    };

    const currentUser = propUser || authUser || {
        name: userData?.fullName || userData?.username || fallbackUser.name,
        role: fallbackUser.role,
        avatar: fallbackUser.avatar
    };

    const fetchUserData = async () => {
        try {
            setIsLoadingUser(true);
            const data = await getUser();
            setUserData({
                username: data.Username ?? data.username,
                fullName: data.FullName ?? data.fullName
            });
        } catch (err) {
            console.error("Failed to fetch user data:", err);
            setUserData(null);
        } finally {
            setIsLoadingUser(false);
        }
    };

    useEffect(() => {
        if (!propUser && !authUser) {
            fetchUserData();
        } else {
            setIsLoadingUser(false);
        }
    }, [propUser, authUser]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = () => {
        if (logout) {
            logout();
        }
        navigate('/login');
    };

    return (
        <nav className="flex items-center justify-between bg-slate-900 text-slate-100 px-6 py-2.5 shadow-sm border-b border-slate-800 z-10 relative flex-shrink-0">

            {/* LEFT SECTION: BRANDING & SYSTEM TITLE */}
            <div className="flex items-center space-x-3">
                <div className="flex items-baseline">
                    <span className="text-lg font-medium italic text-teal-400 mr-[2px]">e</span>
                    <span className="text-lg font-black text-white tracking-wide">HPR</span>
                    <span className="text-[10px] font-bold text-teal-200/70 ml-1.5 uppercase tracking-[0.2em] hidden sm:inline">System</span>
                </div>
                <div className="h-4 w-px bg-slate-800 hidden md:block"></div>
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                    Electronic Health Care Wellness Record
                </span>
            </div>

            {/* RIGHT SECTION: USER PROFILE & DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-slate-800 p-1.5 pr-2 rounded-lg transition-colors"
                >
                    <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-sm font-bold tracking-wide text-white">
                            {isLoadingUser ? "Loading..." : currentUser.name}
                        </span>
                        <span className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
                            {currentUser.role}
                        </span>
                    </div>

                    <div className="h-9 w-9 rounded-full border-2 border-teal-500 overflow-hidden bg-slate-800 flex-shrink-0">
                        <img
                            src={currentUser.avatar}
                            alt={`${currentUser.name} Profile`}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 text-slate-400 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 ring-1 ring-slate-900/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                            <p className="text-xs text-teal-600 font-medium truncate uppercase tracking-wider">{currentUser.role}</p>
                        </div>
                        <a href="#profile" className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Your Profile
                        </a>
                        <a href="#settings" className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Settings
                        </a>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            onClick={handleSignOut}
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>

        </nav>
    );
}