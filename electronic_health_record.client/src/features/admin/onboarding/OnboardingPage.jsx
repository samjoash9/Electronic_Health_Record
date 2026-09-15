import { useState } from 'react';
import { Stethoscope, Users, ShieldCheck, UserRound, Receipt } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth';
import { isSuperAdmin } from '../../../lib/constants';
import AdminsPanel from './AdminsPanel';
import DoctorsPanel from './DoctorsPanel';
import EmployeesPanel from './EmployeesPanel';
import PatientsPanel from './PatientsPanel';
import ChargeCatalogPanel from './ChargeCatalogPanel';

const ADMINS_TAB = { id: 'admins', label: 'Admins', icon: ShieldCheck };
// Superadmin-only, same as Admins: the catalog is what Station 6 bills
// against, and writing to it is a superadmin capability server-side
// (see ChargeItemsController).
const BILLING_TAB = { id: 'billing', label: 'Billing Catalog', icon: Receipt };

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
  billing: ChargeCatalogPanel,
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

  const tabs = superAdmin ? [ADMINS_TAB, ...TABS, BILLING_TAB] : TABS;
  const [tab, setTab] = useState(tabs[0].id);

  const Panel = PANELS[tab] ?? DoctorsPanel;

  return (
    <div className="flex flex-col gap-4 p-5">
      <h1 className="text-lg font-semibold text-ink-900">Onboarding</h1>

      <div className="@container">
        <div
          role="tablist"
          aria-label="Onboarding sections"
          // Below the threshold the strip is a grid so the tabs divide the row
          // evenly instead of wrapping one orphan onto a second line; above it
          // they sit inline at their natural widths.
          className={`grid gap-1 rounded-xl border border-line bg-surface p-1 shadow-sm @3xl:flex @3xl:w-fit ${
            tabs.length > 3 ? 'grid-cols-3 @lg:grid-cols-5' : 'grid-cols-3'
          }`}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors @3xl:justify-start @3xl:px-4 ${
                tab === id
                  ? 'bg-[#129883] text-white shadow-sm'
                  : 'text-ink-600 hover:bg-[#e9fbf6] hover:text-[#0e7d6b]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Panel />
    </div>
  );
}
