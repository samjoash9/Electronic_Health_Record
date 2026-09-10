import { useState } from 'react';
import { Stethoscope, Users } from 'lucide-react';
import DoctorsPanel from './DoctorsPanel';
import EmployeesPanel from './EmployeesPanel';

const TABS = [
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'employees', label: 'Employees', icon: Users },
];

/**
 * Where accounts and records enter the system: doctor sign-ins (which drive the
 * Station 3 physician list) and the employee directory Station 1 searches.
 */
export default function OnboardingPage() {
  const [tab, setTab] = useState('doctors');

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-ink-900">Onboarding</h1>
        <p className="text-sm text-ink-500">
          Register the doctors who sign consultations and keep the employee directory current.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Onboarding sections"
        className="flex w-fit rounded-xl border border-line bg-surface p-1 shadow-sm"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
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

      {tab === 'doctors' ? <DoctorsPanel /> : <EmployeesPanel />}
    </div>
  );
}
