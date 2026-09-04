import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ClipboardList, Stethoscope } from 'lucide-react';
import { useStationChoice } from '../../hooks/useStationChoice';

const STATIONS = [
  {
    number: 1,
    title: 'Station 1',
    subtitle: 'Registration & Vital Signs',
    description: 'Register the employee and record their vital signs.',
    path: '/station1',
    Icon: ClipboardList,
  },
  {
    number: 2,
    title: 'Station 2',
    subtitle: 'Assessment',
    description: 'Hand the tablet to the patient for the health assessment.',
    path: '/station2',
    Icon: Stethoscope,
  },
];

export default function StationPickerPage() {
  const navigate = useNavigate();
  const { station, setStation } = useStationChoice();
  const [selected, setSelected] = useState(station ?? STATIONS[0].number);

  const continueToStation = () => {
    const target = STATIONS.find((s) => s.number === selected);
    if (!target) return;
    setStation(target.number);
    navigate(target.path);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#e9fbf6] to-[#eef2f6] p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#1fc8a8] to-[#0e7d6b] px-12 py-16 text-center text-white sm:flex">
          <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-black/10" />

          <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
            <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
          </div>

          <h1 className="relative z-10 text-3xl font-bold">Choose Your Station</h1>
          <p className="relative z-10 mt-3 max-w-64 text-base text-white/90">
            Select the station assigned to your workflow to continue.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center px-10 py-16 sm:w-1/2 sm:px-14">
          <h2 className="text-center text-3xl font-bold text-[#0e7d6b]">Select Station</h2>
          <p className="mt-1 text-center text-sm text-ink-500">Choose where you want to continue.</p>

          <div className="mt-6 flex flex-col gap-4">
            {STATIONS.map((s) => {
              const isSelected = selected === s.number;
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setSelected(s.number)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-[#1fc8a8] bg-[#f3fdfb]'
                      : 'border-line bg-white hover:border-[#1fc8a8]/40'
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6] text-[#0e7d6b]">
                    <s.Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#0e7d6b]">{s.title}</p>
                    <p className="font-bold text-[#0e7d6b]">{s.subtitle}</p>
                    <p className="mt-1 text-sm text-ink-500">{s.description}</p>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-[#1fc8a8]' : 'border-line'
                    }`}
                  >
                    {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#1fc8a8]" />}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={continueToStation}
            className="mt-6 h-12 w-full rounded-full bg-linear-to-r from-[#1fc8a8] to-[#14a690] text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-105"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
