import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, LayoutDashboard, Table, ClipboardList, ListChecks, Stethoscope, FileText, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useStationChoice } from '../../hooks/useStationChoice';
import { isSuperAdmin } from '../../lib/constants';
import Button from '../ui/Button';

const CHANGE_STATION_LINK = { to: '/stations', label: 'Change Station', icon: LayoutGrid };
const ACTIVITY_LOGS_LINK = { to: '/activity-logs', label: 'Activity Logs', icon: ShieldCheck };

const LINKS = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forms', label: 'Forms', icon: Table },
    { to: '/station1', label: 'Station 1 — Registration', icon: ClipboardList, station: 1 },
    { to: '/station2', label: 'Station 2 — Assessment', icon: ListChecks, station: 2 },
  ],
  doctor: [{ to: '/station3', label: 'Station 3 — Consultation', icon: Stethoscope }],
  patient: [{ to: '/my-record', label: 'My Record', icon: FileText }],
};

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const { station } = useStationChoice();
  const navigate = useNavigate();

  const links = (LINKS[user?.role] ?? []).filter(
    (link) => !link.station || link.station === station,
  );
  if (isSuperAdmin(user)) links.push(ACTIVITY_LOGS_LINK);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-line bg-surface p-3">
      <div className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-line pt-3">
        {user?.role === 'admin' && (
          <NavLink
            to={CHANGE_STATION_LINK.to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-gray-100'
              }`
            }
          >
            <CHANGE_STATION_LINK.icon size={16} />
            {CHANGE_STATION_LINK.label}
          </NavLink>
        )}
        <div className="px-3 pb-2 pt-2">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
          <p className="text-xs capitalize text-ink-500">{user?.adminRole ?? user?.role}</p>
        </div>
        <Button type="button" variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut size={16} className="mr-1" />
          Sign out
        </Button>
      </div>
    </nav>
  );
}
