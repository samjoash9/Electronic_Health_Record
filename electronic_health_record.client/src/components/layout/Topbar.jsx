import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, IdCard, Briefcase, ShieldCheck, Hash } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const ACCOUNT_FIELDS = [
  { key: 'username', label: 'Username', icon: IdCard },
  { key: 'role', label: 'Role', icon: Briefcase, className: 'capitalize' },
  { key: 'adminRole', label: 'Admin Tier', icon: ShieldCheck, className: 'capitalize', adminOnly: true },
  { key: 'accountId', label: 'Account ID', icon: Hash },
];

export default function Topbar({ collapsed, onToggleSidebar }) {
  const { user } = useAuth();
  const [showAccount, setShowAccount] = useState(false);

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

      <button
        type="button"
        onClick={() => setShowAccount(true)}
        className="flex items-center gap-3 rounded-lg bg-white/10 py-1 px-6 transition hover:bg-white/15"
      >
        <div className="leading-tight text-left">
          <p className="text-sm font-semibold text-white">{user?.fullName}</p>
          {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{user?.adminRole ?? user?.role}</p>
        </div>
      </button>

      <Modal
        open={showAccount}
        title="Account Details"
        size="xl"
        onClose={() => setShowAccount(false)}
        footer={
          <Button type="button" variant="teal" size="lg" onClick={() => setShowAccount(false)}>
            Close
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 rounded-xl bg-linear-to-r from-[#e9fbf6] to-[#f3fdfb] p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#14a690] to-[#0e7d6b] text-xl font-bold text-white shadow-sm ring-4 ring-white">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-900">{user?.fullName}</p>
              {/* admins show their tier, so a superadmin is not labelled plain "admin" */}
              <p className="text-sm text-ink-500 capitalize">{user?.adminRole ?? user?.role}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACCOUNT_FIELDS.filter((f) => !f.adminOnly || user?.adminRole).map(({ key, label, icon: Icon, className }) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e9fbf6] text-[#0e7d6b]">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                  <dd className={`mt-0.5 truncate text-sm font-medium text-ink-900 ${className ?? ''}`}>
                    {user?.[key] || '—'}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </Modal>
    </header>
  );
}
