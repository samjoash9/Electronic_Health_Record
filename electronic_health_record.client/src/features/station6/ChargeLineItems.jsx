import { FlaskConical, Pill } from 'lucide-react';
import { peso } from '../../lib/formatters';

// Same category pill palette Station 3's AssessmentPlanSection and the old
// mock invoice used, kept here since Station 6 is where it is actually shown.
const CATEGORY_COLORS = {
  Antibiotic: 'bg-purple-50 text-purple-700 border-purple-200',
  Maintenance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pain Relief': 'bg-rose-50 text-rose-700 border-rose-200',
  Vitamins: 'bg-amber-50 text-amber-700 border-amber-200',
  Gastrointestinal: 'bg-sky-50 text-sky-700 border-sky-200',
};

function LineTotal({ line }) {
  // null (decision 6b: a catalog price may be unset) must never render as
  // "₱0.00" -- that would look like a correct, free charge instead of an
  // unquoted one.
  if (line.lineTotal == null) {
    return <span className="text-xs font-medium text-amber-600">Quote pending</span>;
  }
  return <span className="font-semibold text-gray-900">{peso(line.lineTotal)}</span>;
}

function MedicationLine({ line }) {
  const detail = [line.dosage, line.frequency].filter(Boolean).join(' — ');
  const tagColor = CATEGORY_COLORS[line.category] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex flex-col items-start gap-1">
        <span className="font-medium text-gray-800">
          {line.name}
          {line.quantity > 1 ? ` ×${line.quantity}` : ''}
        </span>
        {detail && <span className="text-xs text-gray-500">{detail}</span>}
        {line.category && (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tagColor}`}>
            {line.category}
          </span>
        )}
      </div>
      <LineTotal line={line} />
    </div>
  );
}

function LabLine({ line }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="font-medium text-gray-800">
        {line.name}
        {line.quantity > 1 ? ` ×${line.quantity}` : ''}
      </span>
      <LineTotal line={line} />
    </div>
  );
}

/**
 * Charge rows grouped by type (Lab / Medication), matching the section split
 * Station 3's Assessment Plan already uses so a bill reads the same way it
 * was written.
 */
export default function ChargeLineItems({ charges }) {
  const labs = charges.filter((c) => c.itemType === 'Lab');
  const medications = charges.filter((c) => c.itemType === 'Medication');

  if (charges.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No charges recorded for this visit yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {labs.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <FlaskConical size={13} />
            <span>Laboratory Tests</span>
          </div>
          <div className="divide-y divide-gray-100">
            {labs.map((line) => (
              <LabLine key={line.chargeID} line={line} />
            ))}
          </div>
        </div>
      )}

      {medications.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Pill size={13} />
            <span>Medications</span>
          </div>
          <div className="divide-y divide-gray-100">
            {medications.map((line) => (
              <MedicationLine key={line.chargeID} line={line} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
