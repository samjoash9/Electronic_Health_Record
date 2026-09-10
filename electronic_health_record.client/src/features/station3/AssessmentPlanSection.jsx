import { ClipboardList, FlaskConical, Stethoscope, Pill, Check } from 'lucide-react';
import Textarea from '../../components/ui/Textarea';
import SectionCard, { SubPanel } from './SectionCard';
import { DIAGNOSTIC_TESTS } from '../../lib/constants';

// Same tile pattern as Family Medical History: a hidden native checkbox under
// a styled tile, so the whole tile is the hit target and focus styling comes
// from the peer relationship instead of manual state.
const TILE_LABEL =
  'relative flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors';
const HIDDEN_CHECKBOX =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0';
const TILE_ON = 'border-[#0e7d6b]/40 bg-[#f3fdfb]';
const TILE_OFF = 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]';

function CheckMark({ checked }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e7d6b]/40 peer-focus-visible:ring-offset-1 ${
        checked ? 'border-[#0e7d6b] bg-[#0e7d6b] text-white' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && <Check size={11} strokeWidth={3.5} />}
    </span>
  );
}

// The field is stored as one comma-joined string ("CBC, FBS"), matching how
// it's already persisted server-side, so no DTO/model shape change is needed
// for what is otherwise a fixed multi-select.
function DiagnosticTestGrid({ watch, setValue }) {
  const value = watch('recommendedDiagnosticTest') || '';
  const selected = new Set(value.split(', ').filter(Boolean));

  const toggle = (test) => {
    const next = new Set(selected);
    if (next.has(test)) next.delete(test);
    else next.add(test);
    // List order, not click order, so the stored string is deterministic.
    const joined = DIAGNOSTIC_TESTS.filter((t) => next.has(t)).join(', ');
    setValue('recommendedDiagnosticTest', joined, { shouldDirty: true });
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {DIAGNOSTIC_TESTS.map((test) => {
        const checked = selected.has(test);
        return (
          <label key={test} className={`${TILE_LABEL} ${checked ? TILE_ON : TILE_OFF}`}>
            <input
              type="checkbox"
              className={HIDDEN_CHECKBOX}
              checked={checked}
              onChange={() => toggle(test)}
              aria-label={test}
            />
            <CheckMark checked={checked} />
            <span className={`text-sm leading-snug ${checked ? 'font-semibold text-ink-900' : 'text-ink-700'}`}>
              {test}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// An icon rail per entry matches the Social History panels, so the physician's
// free-text answers read as distinct steps rather than one wall of boxes.
const ENTRIES = [
  {
    name: 'impressionClinical',
    label: 'Impression / Clinical',
    hint: 'Working diagnosis based on the findings above.',
    icon: Stethoscope,
    placeholder: 'e.g. Stage 1 hypertension, overweight',
  },
  {
    name: 'managementTreatment',
    label: 'Management / Treatment',
    hint: 'Medication, lifestyle advice, and follow-up.',
    icon: Pill,
    placeholder: 'e.g. Start lifestyle modification, recheck BP in 4 weeks',
  },
];

export default function AssessmentPlanSection({ register, watch, setValue }) {
  return (
    <SectionCard
      step={4}
      title="Assessment and Plan"
      subtitle="Record the impression and the plan of care for this consultation."
      icon={ClipboardList}
    >
      <div className="flex flex-col gap-4">
        <SubPanel icon={FlaskConical} title="Recommended Diagnostic Test" subtitle="Labs, imaging, or referrals to order.">
          <DiagnosticTestGrid watch={watch} setValue={setValue} />
        </SubPanel>
        {ENTRIES.map(({ name, label, hint, icon, placeholder }) => (
          <SubPanel key={name} icon={icon} title={label} subtitle={hint}>
            {/* The rail heading already names this field visually, so the
                textarea takes its accessible name from aria-label instead of
                repeating the heading as a second visible label. */}
            <Textarea
              id={name}
              rows={4}
              aria-label={label}
              placeholder={placeholder}
              className="w-full"
              {...register(name)}
            />
          </SubPanel>
        ))}
      </div>
    </SectionCard>
  );
}
