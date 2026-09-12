import { useState } from 'react';
import { Stethoscope, Users, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth';
import { isSuperAdmin } from '../../../lib/constants';
import AdminsPanel from './AdminsPanel';
import DoctorsPanel from './DoctorsPanel';
import EmployeesPanel from './EmployeesPanel';
import PatientsPanel from './PatientsPanel';

const ADMINS_TAB = { id: 'admins', label: 'Admins', icon: ShieldCheck };

const TABS = [
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'patients', label: 'Patients', icon: UserRound },
];

const PANELS = {
  admins: AdminsPanel,
  doctors: DoctorsPanel,
  employees: EmployeesPanel,
  patients: PatientsPanel,
};

/**
 * Where accounts and records enter the system: staff sign-ins, doctor sign-ins
 * (which drive the Station 3 physician list), the employee directory Station 1
 * searches, and the patient portal logins Station 1 issues.
 *
 * The Admins tab is superadmin-only, matching the server: creating an admin is
 * the one provisioning endpoint a plain admin cannot call.
 */
export default function OnboardingPage() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const tabs = superAdmin ? [ADMINS_TAB, ...TABS] : TABS;
  const [tab, setTab] = useState(tabs[0].id);

  const Panel = PANELS[tab] ?? DoctorsPanel;

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-ink-900">Onboarding</h1>
        <p className="text-sm text-ink-500">
          Register the doctors who sign consultations, keep the employee directory current, and
          look up the portal usernames issued to patients at Station 1.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Onboarding sections"
        className="flex w-fit rounded-xl border border-line bg-surface p-1 shadow-sm"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-[#129883] text-white shadow-sm'
                : 'text-ink-600 hover:bg-[#e9fbf6] hover:text-[#0e7d6b]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <Panel />
    </div>
  );
}
