import { NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardList, ListChecks, Stethoscope, FileText } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useStationChoice } from '../../hooks/useStationChoice';

const LINKS = {
  admin: [
    { to: '/stations', label: 'Change Station', icon: LayoutGrid },
    { to: '/station1', label: 'Station 1 — Registration', icon: ClipboardList, station: 1 },
    { to: '/station2', label: 'Station 2 — Assessment', icon: ListChecks, station: 2 },
  ],
  doctor: [{ to: '/station3', label: 'Station 3 — Consultation', icon: Stethoscope }],
  patient: [{ to: '/my-record', label: 'My Record', icon: FileText }],
};

export default function Sidebar() {
  const { user } = useAuth();
  const { station } = useStationChoice();

  const links = (LINKS[user?.role] ?? []).filter(
    (link) => !link.station || link.station === station,
  );

  return (
    <nav className="flex w-56 flex-col gap-1 border-r border-line bg-surface p-3">
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
    </nav>
  );
}
