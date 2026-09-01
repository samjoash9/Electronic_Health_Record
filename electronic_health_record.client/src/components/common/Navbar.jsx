import { useState, useEffect, useRef } from 'react';
import meljun from "../../assets/images/meljun.png";
import { getUser } from '../../services/auth/auth'; 

export default function Navbar({ user }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const fallbackUser = {
        name: "MelJun Makunat",
        role: "System Admin",
        avatar: meljun
    };

    // Prefer: explicit `user` prop > fetched userData > fallback
    const currentUser = user || {
        name: userData?.fullName || userData?.username || fallbackUser.name,
        role: fallbackUser.role, // backend /me doesn't return a role yet
        avatar: fallbackUser.avatar // backend /me doesn't return an avatar yet
    };

    const fetchUserData = async () => {
        try {
            setIsLoadingUser(true);
            const data = await getUser();
            // Me() returns { Username, FullName } (PascalCase from ASP.NET)
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
        // Skip the fetch if a user was already passed in via props
        if (!user) {
            fetchUserData();
        } else {
            setIsLoadingUser(false);
        }
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        // UX UPGRADE: Changed justify-between to justify-end to keep the profile on the right
        <nav className="flex items-center justify-end bg-slate-900 text-slate-100 px-4 py-2 shadow-sm border-b border-slate-800 z-10 relative">

            {/* Right Section: User Profile & Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-slate-800 p-1.5 pr-2 rounded-lg transition-colors"
                >
                    {/* User Details */}
                    <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-sm font-bold tracking-wide text-white">
                            {isLoadingUser ? "Loading..." : currentUser.name}
                        </span>
                        <span className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
                            {currentUser.role}
                        </span>
                    </div>

                    {/* Profile Image */}
                    <div className="h-9 w-9 rounded-full border-2 border-teal-500 overflow-hidden bg-slate-800 flex-shrink-0">
                        <img
                            src={currentUser.avatar}
                            alt={`${currentUser.name} Profile`}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Dropdown Arrow Icon */}
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

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-slate-900/10 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 sm:hidden bg-slate-50">
                            <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                            <p className="text-xs text-teal-600 font-medium truncate">{currentUser.role}</p>
                        </div>
                        <a href="#profile" className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Your Profile
                        </a>
                        <a href="#settings" className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Settings
                        </a>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            onClick={() => console.log('Logout clicked')}
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>

        </nav>
    );
}