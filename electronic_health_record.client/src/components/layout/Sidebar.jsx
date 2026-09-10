import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, LayoutDashboard, Sheet, ClipboardList, ListChecks, Stethoscope, Smile, Eye, FileText, LogOut, ShieldCheck, Info, Settings, UserPlus } from 'lucide-react';
import phoLogo from '../../assets/images/PHO_logo.jpg';
import { useAuth } from '../../auth/useAuth';
import { useStationChoice } from '../../hooks/useStationChoice';
import { isSuperAdmin } from '../../lib/constants';
import ChangePasswordModal from '../ui/ChangePasswordModal';

const CHANGE_STATION_LINK = { to: '/stations', label: 'Change Station', icon: LayoutGrid };
const ACTIVITY_LOGS_LINK = { to: '/activity-logs', label: 'Activity Logs', icon: ShieldCheck };
const STATION3_LINK = { to: '/station3', label: 'Station 3: Consultation', icon: Stethoscope };
const STATION4_LINK = { to: '/station4', label: 'Station 4: Dental', icon: Smile };
const STATION5_LINK = { to: '/station5', label: 'Station 5: Vision', icon: Eye };
const ONBOARDING_LINK = { to: '/onboarding', label: 'Onboarding', icon: UserPlus };

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forms', label: 'Forms', icon: Sheet },
    { to: '/station1', label: 'Station 1: Registration', icon: ClipboardList, station: 1 },
    { to: '/station2', label: 'Station 2: Assessment', icon: ListChecks, station: 2 },

    ONBOARDING_LINK,
  ],
  doctor: [STATION3_LINK, STATION4_LINK, STATION5_LINK],
  patient: [{ to: '/my-record', label: 'My Record', icon: FileText }],
};

export default function Sidebar({ collapsed }) {
  const { user, signOut } = useAuth();
  const { station } = useStationChoice();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const superAdmin = isSuperAdmin(user);
  const links = (LINKS[user?.role] ?? []).filter((link) => {
    if (superAdmin) return link !== ONBOARDING_LINK;
    return !link.station || link.station === station;
  });
  if (superAdmin) links.push(STATION3_LINK, STATION4_LINK, STATION5_LINK, ONBOARDING_LINK, ACTIVITY_LOGS_LINK);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // DESIGN UPDATE: Active tab uses teal background with white text matching hover
  const linkClass = ({ isActive }) =>
    `cursor-pointer flex h-11 w-full items-center rounded-md px-3.5 py-2 text-sm whitespace-nowrap transition-all duration-200 ${isActive
      ? 'bg-[#37AF9B] text-white shadow-sm font-semibold'
      : 'text-white/70 hover:bg-[#37AF9B] hover:text-white font-medium'
    }`;

  const textSpanClass = `transition-all duration-300 overflow-hidden whitespace-nowrap text-left ${collapsed ? 'w-0 opacity-0 ml-0 pointer-events-none' : 'w-44 opacity-100 ml-3'
    }`;

  return (
    <nav
      // DESIGN UPDATE: Replaced gradient with solid #0A594D, added font-sans for Geist support
      className={`font-sans flex flex-col gap-1 border-r border-[#08483e] bg-[#0A594D] p-3 transition-all duration-300 shadow-xl ${collapsed ? 'w-[72px]' : 'w-64'
        }`}
    >
      <div className="flex items-center px-1.5 py-2">
        <img
          src={phoLogo}
          alt="Provincial Health Office"
          className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-sm bg-white p-0.5"
        />
        <div
          className={`flex items-baseline overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 ml-0 pointer-events-none' : 'w-36 opacity-100 ml-3'
            }`}
        >
          <span className="text-xl font-black tracking-tight text-white">eHPR</span>
          <span className="ml-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-teal-100/70">SYSTEM</span>
        </div>
      </div>

      <div className="mb-2 mt-1 border-t border-white/10 w-full" />

      <div className="flex flex-1 flex-col gap-1.5 mt-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label} className={linkClass}>
            <Icon size={20} className="shrink-0" />
            <span className={textSpanClass}>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 flex flex-col gap-1.5">
        {user?.role === 'admin' && !superAdmin && (
          <NavLink to={CHANGE_STATION_LINK.to} title={CHANGE_STATION_LINK.label} className={linkClass}>
            <CHANGE_STATION_LINK.icon size={20} className="shrink-0" />
            <span className={textSpanClass}>{CHANGE_STATION_LINK.label}</span>
          </NavLink>
        )}
        <button
          type="button"
          title="Settings"
          onClick={() => setChangePasswordOpen(true)}
          className="cursor-pointer flex h-11 w-full items-center rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white/80 transition-all duration-200 hover:bg-[#37AF9B] hover:text-white"
        >
          <Settings size={20} className="shrink-0" />
          <span className={textSpanClass}>Settings</span>
        </button>
        {!superAdmin && (
          <button
            type="button"
            title="Support"
            className="cursor-pointer flex h-11 w-full items-center rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white/80 transition-all duration-200 hover:bg-[#37AF9B] hover:text-white"
          >
            <Info size={20} className="shrink-0" />
            <span className={textSpanClass}>Support</span>
          </button>
        )}
        <button
          type="button"
          title="Log Out"
          onClick={handleSignOut}
          className="cursor-pointer flex h-11 w-full items-center rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap text-white/80 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400"
        >
          <LogOut size={20} className="shrink-0" />
          <span className={textSpanClass}>Log Out</span>
        </button>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </nav>
  );
}