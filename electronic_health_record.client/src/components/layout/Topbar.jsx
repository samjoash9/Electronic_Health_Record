import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export default function Topbar({ collapsed, onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="font-sans flex h-16 items-center justify-between border-b border-[#08483e] bg-[#0A594D] px-4 text-white shadow-sm relative z-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
        </button>
        <span className="hidden text-[15px] font-bold tracking-wide text-white sm:block">
          Electronic Health Care Wellness Record
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-full bg-white/10 py-1 pl-1 pr-4 transition-all duration-200 hover:bg-white/15 cursor-default border border-white/5">
        {/* DESIGN UPDATE: Avatar pill uses solid white with #0A594D text to match the theme */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0A594D] shadow-sm">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="leading-tight flex flex-col justify-center">
          <p className="text-sm font-semibold text-white tracking-wide">{user?.name || 'System User'}</p>
          {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200/70 mt-0.5">
            {user?.adminRole ?? user?.role ?? 'Role'}
          </p>
        </div>
      </div>
    </header>
  );
}