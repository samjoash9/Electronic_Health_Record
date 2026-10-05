import { Thermometer, HeartPulse, Activity, Wind } from 'lucide-react';
import ReportCard from './ReportCard';

// !! NEEDS CLINICAL REVIEW !! -- adult resting cutoffs, a developer's
// placeholder until the physicians confirm what the clinic flags.
const FLAGS = [
  { key: 'fever', label: 'Fever', rule: 'Temp ≥ 37.5 °C', icon: Thermometer },
  { key: 'tachycardia', label: 'Fast heart rate', rule: 'HR > 100 bpm', icon: HeartPulse },
  { key: 'bradycardia', label: 'Slow heart rate', rule: 'HR < 60 bpm', icon: Activity },
  { key: 'tachypnea', label: 'Fast breathing', rule: 'RR > 20 /min', icon: Wind },
];

/** How many patients came in with each out-of-range vital at Station 1. */
export default function IntakeFlagsCard({ flags, total }) {
  return (
    <ReportCard eyebrow="Flagged at intake" title="Out-of-range vitals at Station 1">
      <ul aria-label="Intake flags" className="flex flex-col divide-y divide-line">
        {FLAGS.map(({ key, label, rule, icon: Icon }) => {
          const count = flags[key] ?? 0;
          return (
            <li key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                <Icon size={17} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-800">{label}</p>
                <p className="text-xs text-ink-500">{rule}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-semibold text-ink-900">{count}</p>
                <p className="text-xs text-ink-500 tabular-nums">
                  {total ? `${Math.round((count / total) * 1000) / 10}%` : '—'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </ReportCard>
  );
}
