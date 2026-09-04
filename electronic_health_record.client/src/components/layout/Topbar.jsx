import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export default function Topbar({ collapsed, onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-black/10 bg-linear-to-r from-[#14a690] to-[#0e7d6b] px-4 text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button>
        <span className="hidden text-base font-bold text-white sm:block">Electronic Health Care Wellness Record</span>
      </div>

      <div className="flex items-center gap-3 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 transition hover:bg-white/15">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-white/90 to-white/70 text-sm font-bold text-[#0e7d6b] shadow-sm ring-2 ring-white/40">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">{user?.name}</p>
          {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{user?.adminRole ?? user?.role}</p>
        </div>
      </div>
    </header>
  );
}
