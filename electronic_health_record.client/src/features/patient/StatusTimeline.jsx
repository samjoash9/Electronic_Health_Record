import { formatDateTime } from '../../lib/formatters';

const STEPS = [
  { key: 'station1SubmittedAt', label: 'Registered',
    detail: 'Personal details and vital signs recorded' },
  { key: 'station2SubmittedAt', label: 'Assessed',
    detail: 'Health assessment completed' },
  { key: 'station3SubmittedAt', label: 'Consulted',
    detail: 'Reviewed by the attending physician' },
  { key: 'signedAt', label: 'Signed',
    detail: 'Signed by the physician — your record is now available' },
];

export default function StatusTimeline({ form }) {
  return (
    <ol className="flex flex-col gap-4">
      {STEPS.map((step) => {
        const timestamp = form[step.key];
        const done = Boolean(timestamp);
        return (
          <li key={step.key} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-surface'
              }`}
            />
            <div>
              <p className={`text-sm font-medium ${done ? 'text-ink-900' : 'text-ink-500'}`}>
                {step.label}
              </p>
              <p className="text-xs text-ink-500">
                {done ? formatDateTime(timestamp) : 'Pending'} — {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
