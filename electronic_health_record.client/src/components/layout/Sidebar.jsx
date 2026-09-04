import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, LayoutDashboard, Table, ClipboardList, ListChecks, Stethoscope, FileText, LogOut, ShieldCheck, LifeBuoy, Settings } from 'lucide-react';
import phoLogo from '../../assets/images/PHO_logo.jpg';
import { useAuth } from '../../auth/useAuth';
import { useStationChoice } from '../../hooks/useStationChoice';
import { isSuperAdmin } from '../../lib/constants';
import ChangePasswordModal from '../ui/ChangePasswordModal';

const CHANGE_STATION_LINK = { to: '/stations', label: 'Change Station', icon: LayoutGrid };
const ACTIVITY_LOGS_LINK = { to: '/activity-logs', label: 'Activity Logs', icon: ShieldCheck };

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forms', label: 'Forms', icon: Table },
    { to: '/station1', label: 'Station 1: Registration', icon: ClipboardList, station: 1 },
    { to: '/station2', label: 'Station 2: Assessment', icon: ListChecks, station: 2 },
  ],
  doctor: [{ to: '/station3', label: 'Station 3: Consultation', icon: Stethoscope }],
  patient: [{ to: '/my-record', label: 'My Record', icon: FileText }],
};

export default function Sidebar({ collapsed }) {
  const { user, signOut } = useAuth();
  const { station } = useStationChoice();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const links = (LINKS[user?.role] ?? []).filter(
    (link) => !link.station || link.station === station,
  );
  if (isSuperAdmin(user)) links.push(ACTIVITY_LOGS_LINK);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex h-11 items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap transition ${collapsed ? 'justify-center' : ''
    } ${isActive ? 'bg-white text-[#0e7d6b]' : 'text-white/80 hover:bg-white/10 hover:text-white'}`;

  return (
    <nav
      className={`flex flex-col gap-1 border-r border-black/10 bg-linear-to-b from-[#14a690] to-[#0e7d6b] p-3 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'
        }`}
    >
      <div className={`flex items-center gap-2 px-1 py-2 ${collapsed ? 'justify-center' : ''}`}>
        <img src={phoLogo} alt="Provincial Health Office" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
        {!collapsed && (
          <span className="text-base font-bold text-white">
            eHPR <span className="text-xs font-semibold tracking-wide text-white/70">SYSTEM</span>
          </span>
        )}
      </div>

      <div className="mb-2 border-t border-white/15" />

      <div className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={label} className={linkClass}>
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-white/15 pt-3">
        {user?.role === 'admin' && (
          <NavLink to={CHANGE_STATION_LINK.to} title={CHANGE_STATION_LINK.label} className={linkClass}>
            <CHANGE_STATION_LINK.icon size={18} className="shrink-0" />
            {!collapsed && CHANGE_STATION_LINK.label}
          </NavLink>
        )}
        <button
          type="button"
          title="Settings"
          onClick={() => setChangePasswordOpen(true)}
          className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''
            }`}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && 'Settings'}
        </button>
        <button
          type="button"
          title="Support"
          className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''
            }`}
        >
          <LifeBuoy size={18} className="shrink-0" />
          {!collapsed && 'Support'}
        </button>
        <button
          type="button"
          title="Log Out"
          onClick={handleSignOut}
          className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''
            }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Log Out'}
        </button>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </nav>
  );
}
