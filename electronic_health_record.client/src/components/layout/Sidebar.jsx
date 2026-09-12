import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, LayoutDashboard, Table, ClipboardList, ListChecks, Stethoscope, Smile, Eye, FileText, LogOut, ShieldCheck, LifeBuoy, Settings, UserPlus } from 'lucide-react';
import phoLogo from '../../assets/images/PHO_logo.jpg';
import { useAuth } from '../../auth/useAuth';
import { useStationChoice } from '../../hooks/useStationChoice';
import { ROLES, isSuperAdmin } from '../../lib/constants';
import ChangePasswordModal from '../ui/ChangePasswordModal';
import SignOutModal from '../ui/SignOutModal';

const CHANGE_STATION_LINK = { to: '/stations', label: 'Change Station', icon: LayoutGrid };
const ACTIVITY_LOGS_LINK = { to: '/activity-logs', label: 'Activity Logs', icon: ShieldCheck };
// `station` gates each link to a desk -- stations 3-5 are staffed by doctors,
// each assigned exactly one station by an admin (`user.station`), so only
// that assigned station belongs in the sidebar. Stations 1-2 are still a
// per-device admin choice, gated on the device `station` from useStationChoice().
// A superadmin is pushed all three below, bypassing that filter.
const STATION3_LINK = { to: '/station3', label: 'Station 3: Consultation', icon: Stethoscope, station: 3 };
const STATION4_LINK = { to: '/station4', label: 'Station 4: Dental', icon: Smile, station: 4 };
const STATION5_LINK = { to: '/station5', label: 'Station 5: Vision', icon: Eye, station: 5 };
const ONBOARDING_LINK = { to: '/onboarding', label: 'Onboarding', icon: UserPlus };

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forms', label: 'Forms', icon: Table },
    { to: '/station1', label: 'Station 1: Registration', icon: ClipboardList, station: 1 },
    { to: '/station2', label: 'Station 2: Assessment', icon: ListChecks, station: 2 },
    // No `station`: onboarding is not a station desk, so it stays available
    // whichever station an admin picked.
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
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const superAdmin = isSuperAdmin(user);
  // Doctors' station links are gated on their admin-assigned `user.station`;
  // admins' station links are still gated on the device choice from useStationChoice().
  const gateStation = user?.role === ROLES.DOCTOR ? user?.station : station;
  const links = (LINKS[user?.role] ?? []).filter((link) => {
    if (superAdmin) return link !== ONBOARDING_LINK;
    return !link.station || link.station === gateStation;
  });
  if (superAdmin) links.push(STATION3_LINK, STATION4_LINK, STATION5_LINK, ONBOARDING_LINK, ACTIVITY_LOGS_LINK);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // signOut() clears the local session even when the server call fails
      // (an already-expired token answers 401), so the redirect below is
      // correct either way -- there is no signed-in state left to return to.
      await signOut();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
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
        {user?.role === ROLES.ADMIN && !superAdmin && (
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
        {!superAdmin && (
          <button
            type="button"
            title="Support"
            className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''
              }`}
          >
            <LifeBuoy size={18} className="shrink-0" />
            {!collapsed && 'Support'}
          </button>
        )}
        <button
          type="button"
          title="Log Out"
          onClick={() => setSignOutOpen(true)}
          className={`flex h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-medium whitespace-nowrap text-white/80 transition hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''
            }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Log Out'}
        </button>
      </div>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

      <SignOutModal
        open={signOutOpen}
        pending={signingOut}
        onConfirm={handleSignOut}
        onClose={() => setSignOutOpen(false)}
      />
    </nav>
  );
}
