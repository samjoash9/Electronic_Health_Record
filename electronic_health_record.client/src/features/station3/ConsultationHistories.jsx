import { Users, HeartPulse, Link2, Pill } from 'lucide-react';
import { conditionName } from '../../lib/familyHistory';
import { sameCondition, yearsSince } from '../../lib/consultationRecord';
import { RecordSection, NotRecorded, Chip } from './RecordParts';

const years = (n) => `${n} year${n === 1 ? '' : 's'}`;

/**
 * The family's conditions, each marked when the patient has it on file too --
 * the family history matters most where it has already shown up.
 */
export function FamilyHistoryList({ id, rows, pastHistory, className }) {
  return (
    <RecordSection
      id={id}
      icon={Users}
      title="Family medical history"
      subtitle="Conditions reported among the patient's immediate family"
      className={className}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">No family medical history on file.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row, i) => {
            if (row.isNone) {
              return <li key={row.fmhID ?? i} className="py-2.5 text-sm text-ink-500 first:pt-0 last:pb-0">None reported</li>;
            }
            const name = conditionName(row);
            const alsoThePatients = pastHistory.some((past) => sameCondition(conditionName(past), name));
            return (
              <li key={row.fmhID ?? i} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{name}</span>
                  {row.conditionType && <Chip>{row.conditionType}</Chip>}
                </span>
                {alsoThePatients && (
                  <Chip tone="teal">
                    <Link2 size={12} aria-hidden />
                    Also in patient&apos;s history
                  </Chip>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </RecordSection>
  );
}

function PastCondition({ row, asOf }) {
  const held = yearsSince(row.yearDiagnosed, asOf);
  let heldFor = <NotRecorded />;
  if (held === 0) heldFor = 'Less than a year';
  else if (held !== null) heldFor = years(held);

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink-900">{conditionName(row)}</span>
        {row.maintenanceDrugGeneric && <Chip tone="teal">On maintenance</Chip>}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-ink-500">Diagnosed</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink-900">{row.yearDiagnosed ?? <NotRecorded />}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Living with it for</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink-900">{heldFor}</dd>
        </div>
      </dl>

      {row.maintenanceDrugGeneric && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9fbf6] text-[#0e7d6b]">
              <Pill size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-ink-500">Maintenance medication</p>
              <p className="text-sm font-bold text-ink-900">{row.maintenanceDrugGeneric}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {row.dosage && <Chip>{row.dosage}</Chip>}
            {row.frequency && <Chip>{row.frequency}</Chip>}
          </div>
        </div>
      )}
    </li>
  );
}

/** The patient's own diagnosed conditions; `asOf` is the visit year "living with it" counts to. */
export function PastHistoryList({ id, rows, asOf, className }) {
  return (
    <RecordSection
      id={id}
      icon={HeartPulse}
      title="Past medical history"
      subtitle="Diagnosed conditions and maintenance medication on file"
      className={className}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">No past medical history on file.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row, i) => <PastCondition key={row.pmhID ?? i} row={row} asOf={asOf} />)}
        </ul>
      )}
    </RecordSection>
  );
}
