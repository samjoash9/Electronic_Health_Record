import { useController, useFieldArray } from 'react-hook-form';
import {
  Cigarette, Dumbbell, Wine, Activity, Wind,
  Plus, CalendarDays, Beer, GlassWater, Check, Trash2,
} from 'lucide-react';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SectionCard, { SubPanel } from './SectionCard';

const BLANK_EXERCISE_ROW = { exerciseType: '', exerciseFrequency: '', exerciseYearStarted: '' };

const ALCOHOL_TYPES = ['Beer', 'Wine', 'Spirits / hard liquor', 'Mixed drinks', 'Other'];
const DRINK_FREQUENCY = [
  'Never', 'Occasionally', 'Monthly', 'Weekly', 'Several times a week', 'Daily',
];
const DRINKS_PER_SESSION = [
  '1 drink', '2–3 drinks', '4–5 drinks', '6 or more drinks',
];

// Sized to its label rather than Tailwind's sr-only: a 1px box with a negative
// margin makes the browser's focus-scroll jump the whole shell, which left a
// blank gap below the form when answering revealed another field.
const HIDDEN_INPUT =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0';

/**
 * Select with a leading glyph, so a row of dropdowns is scannable by icon.
 * Driven through useController because Select keeps its own display state and
 * needs a controlled value to reflect a restored draft.
 */
function IconSelect({ icon: Icon, control, name, id, options }) {
  const { field } = useController({ control, name });

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#0e7d6b]"
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <Select id={id} options={options} triggerClassName="pl-9" {...field} value={field.value ?? ''} />
    </div>
  );
}

/**
 * Free-text input with a leading glyph, matching IconSelect's layout so the
 * two can sit in the same row. Driven through useController for the same
 * reason as IconSelect: a controlled value to reflect a restored draft.
 */
function IconInput({ icon: Icon, control, name, id, placeholder, ...props }) {
  const { field } = useController({ control, name });

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#0e7d6b]"
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <Input id={id} placeholder={placeholder} className="w-full pl-9" {...field} value={field.value ?? ''} {...props} />
    </div>
  );
}

/**
 * Checkbox tile, visually similar to YesNoField's Yes/No pair but independent
 * rather than mutually exclusive — Cigarette and E-cigarette can both be
 * checked, since a patient may use either or both.
 */
// Each toggle echoes its own field-block's accent color once checked, so the
// choice hints at which colored box it's about to reveal before it appears.
const TOGGLE_ACCENT = {
  teal: { border: 'border-[#0e7d6b]/40', bg: 'bg-[#f3fdfb]', check: 'border-[#0e7d6b] bg-[#0e7d6b]', icon: 'text-[#0e7d6b]' },
  amber: { border: 'border-amber-400/60', bg: 'bg-amber-50', check: 'border-amber-600 bg-amber-600', icon: 'text-amber-700' },
  sky: { border: 'border-sky-400/60', bg: 'bg-sky-50', check: 'border-sky-600 bg-sky-600', icon: 'text-sky-700' },
};

function ToggleField({ control, name, label, id, icon: Icon, accent = 'teal' }) {
  const { field } = useController({ control, name });
  const checked = Boolean(field.value);
  const tone = TOGGLE_ACCENT[accent];

  return (
    <label
      htmlFor={id}
      className={`relative flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 transition-colors ${
        checked
          ? `${tone.border} ${tone.bg}`
          : 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]'
      }`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => field.onChange(e.target.checked)}
        onBlur={field.onBlur}
        className={HIDDEN_INPUT}
      />
      <span
        aria-hidden
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e7d6b]/40 peer-focus-visible:ring-offset-1 ${
          checked ? `${tone.check} text-white` : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Check size={11} strokeWidth={3.5} />}
      </span>
      {Icon && <Icon size={15} className={checked ? tone.icon : 'text-ink-400'} />}
      <span
        className={`text-sm transition-colors ${
          checked ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'
        }`}
      >
        {label}
      </span>
    </label>
  );
}

/**
 * Yes / No pair over a boolean. Two explicit choices keep "not answered"
 * visually distinct from "no", which a lone checkbox cannot express.
 */
function YesNoField({ control, name, label, htmlFor }) {
  const { field } = useController({ control, name });

  return (
    <Field label={label} htmlFor={htmlFor}>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-3">
        {[
          { value: true, text: 'Yes' },
          { value: false, text: 'No' },
        ].map(({ value, text }) => {
          const selected = field.value === value;
          return (
            <label
              key={text}
              className={`relative flex h-11 items-center gap-2.5 rounded-lg border px-3.5 transition-colors ${
                selected
                  ? 'border-[#0e7d6b]/40 bg-[#f3fdfb]'
                  : 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]'
              }`}
            >
              {/* The visible text is a decorative sibling, so the radio names
                  itself rather than relying on the wrapping label. */}
              <input
                type="radio"
                id={value ? htmlFor : undefined}
                name={field.name}
                aria-label={text}
                checked={selected}
                onChange={() => field.onChange(value)}
                onBlur={field.onBlur}
                className={HIDDEN_INPUT}
              />
              <span
                aria-hidden
                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0e7d6b]/40 peer-focus-visible:ring-offset-1 ${
                  selected ? 'border-[#0e7d6b] bg-[#0e7d6b] text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {selected && <Check size={11} strokeWidth={3.5} />}
              </span>
              <span
                className={`text-sm transition-colors ${
                  selected ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'
                }`}
              >
                {text}
              </span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

export default function SocialHistorySection({ control, watch }) {
  const smokes = watch('socialHistory.smokes');
  const smokesCigarette = watch('socialHistory.smokesCigarette');
  const smokesEcig = watch('socialHistory.smokesEcig');
  const selectProps = (name) => ({ control, name: `socialHistory.${name}`, id: name });
  const inputProps = (name) => ({ control, name: `socialHistory.${name}`, id: name });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercise',
  });

  // Keep at least one row on screen: emptying the last row resets it instead
  // of leaving the section with nothing to type into.
  const handleRemoveExercise = (index) => {
    if (exerciseFields.length === 1) {
      removeExercise(0);
      appendExercise({ ...BLANK_EXERCISE_ROW });
      return;
    }
    removeExercise(index);
  };

  return (
    <SectionCard
      step={3}
      title="Social History"
      subtitle="Lifestyle habits that inform screening and advice."
      icon={Activity}
    >
      <div className="flex flex-col gap-4">
        <SubPanel icon={Cigarette} title="Smoking" subtitle="Cigarette and e-cigarette usage">
          <YesNoField
            control={control}
            name="socialHistory.smokes"
            label="Does the patient smoke?"
            htmlFor="smokes"
          />

          {/* The choice and its fields fade in beside the trigger, so
              revealing them reads as an answer rather than the section
              jumping. Both may be checked: a patient can use either or both. */}
          {smokes === true && (
            <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 motion-safe:animate-[fade-in_150ms_ease-out]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ToggleField
                  control={control}
                  name="socialHistory.smokesCigarette"
                  label="Cigarette"
                  id="smokesCigarette"
                  icon={Cigarette}
                  accent="amber"
                />
                <ToggleField
                  control={control}
                  name="socialHistory.smokesEcig"
                  label="E-cigarette"
                  id="smokesEcig"
                  icon={Wind}
                  accent="sky"
                />
              </div>

              {/* Each block carries its own header, icon, and accent color so
                  the two stay visually distinct even at a glance. Side by side
                  as two full-height columns when both are checked, so neither
                  reads as the other's continuation; a lone block takes the
                  full width instead of leaving an empty half beside it. */}
              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
                {smokesCigarette && (
                  <div
                    className={`overflow-hidden rounded-lg border border-amber-300/50 bg-amber-50/60 ${
                      smokesEcig ? '' : 'sm:col-span-2'
                    }`}
                  >
                    <div className="flex items-center gap-2 border-b border-amber-300/40 bg-amber-100/50 px-3.5 py-2">
                      <Cigarette size={15} className="text-amber-700" />
                      <span className="text-xs font-semibold tracking-wide text-amber-800">Cigarette details</span>
                    </div>
                    <div className="flex flex-col gap-4 p-3.5">
                      <Field label="Sticks per day" htmlFor="cigaretteSticksPerDay">
                        <IconInput icon={Cigarette} placeholder="e.g. 10-15" {...inputProps('cigaretteSticksPerDay')} />
                      </Field>
                      <Field label="Cigarette frequency" htmlFor="cigaretteFrequency">
                        <IconInput icon={CalendarDays} placeholder="e.g. Daily" {...inputProps('cigaretteFrequency')} />
                      </Field>
                      <Field label="Cigarette — year started" htmlFor="cigaretteYearStarted">
                        <IconInput
                          icon={CalendarDays}
                          placeholder="e.g. 2015"
                          inputMode="numeric"
                          maxLength={4}
                          {...inputProps('cigaretteYearStarted')}
                        />
                      </Field>
                      <Field label="Cigarette puffs per day" htmlFor="cigarettePuffsPerDay">
                        <IconInput icon={Cigarette} placeholder="e.g. 20" {...inputProps('cigarettePuffsPerDay')} />
                      </Field>
                    </div>
                  </div>
                )}

                {smokesEcig && (
                  <div
                    className={`overflow-hidden rounded-lg border border-sky-300/50 bg-sky-50/60 ${
                      smokesCigarette ? '' : 'sm:col-span-2'
                    }`}
                  >
                    <div className="flex items-center gap-2 border-b border-sky-300/40 bg-sky-100/50 px-3.5 py-2">
                      <Wind size={15} className="text-sky-700" />
                      <span className="text-xs font-semibold tracking-wide text-sky-800">E-cigarette details</span>
                    </div>
                    <div className="flex flex-col gap-4 p-3.5">
                      <Field label="Pods per month" htmlFor="ecigPodsPerMonth">
                        <IconInput icon={Wind} placeholder="e.g. 2" {...inputProps('ecigPodsPerMonth')} />
                      </Field>
                      <Field label="E-cigarette frequency" htmlFor="ecigFrequency">
                        <IconInput icon={CalendarDays} placeholder="e.g. Daily" {...inputProps('ecigFrequency')} />
                      </Field>
                      <Field label="E-cigarette — year started" htmlFor="ecigYearStarted">
                        <IconInput
                          icon={CalendarDays}
                          placeholder="e.g. 2021"
                          inputMode="numeric"
                          maxLength={4}
                          {...inputProps('ecigYearStarted')}
                        />
                      </Field>
                      <Field label="E-cigarette puffs per day" htmlFor="ecigPuffsPerDay">
                        <IconInput icon={Wind} placeholder="e.g. 15" {...inputProps('ecigPuffsPerDay')} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SubPanel>

        <SubPanel icon={Dumbbell} title="Exercise" subtitle="Physical activity">
          {/* Column labels shown once above the rows, same convention as
              Past Medical History's table and Family History's "Others"
              rows — a per-row visible label would repeat once per entry. */}
          <div className="mb-1.5 hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 md:grid">
            <span className="text-xs font-medium tracking-wide text-ink-600">Type of exercise</span>
            <span className="text-xs font-medium tracking-wide text-ink-600">Frequency</span>
            <span className="text-xs font-medium tracking-wide text-ink-600">Year started</span>
            <span className="w-9" aria-hidden />
          </div>
          <div className="space-y-3">
            {exerciseFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <div>
                  <label className="text-xs font-medium tracking-wide text-ink-600 md:sr-only" htmlFor={`exerciseType-${index}`}>
                    {`Type of exercise, row ${index + 1}`}
                  </label>
                  <IconInput
                    icon={Dumbbell}
                    control={control}
                    name={`exercise.${index}.exerciseType`}
                    id={`exerciseType-${index}`}
                    placeholder="e.g. Jogging"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-wide text-ink-600 md:sr-only" htmlFor={`exerciseFrequency-${index}`}>
                    {`Frequency, row ${index + 1}`}
                  </label>
                  <IconInput
                    icon={CalendarDays}
                    control={control}
                    name={`exercise.${index}.exerciseFrequency`}
                    id={`exerciseFrequency-${index}`}
                    placeholder="e.g. 3x a week"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-wide text-ink-600 md:sr-only" htmlFor={`exerciseYearStarted-${index}`}>
                    {`Year started, row ${index + 1}`}
                  </label>
                  <IconInput
                    icon={CalendarDays}
                    control={control}
                    name={`exercise.${index}.exerciseYearStarted`}
                    id={`exerciseYearStarted-${index}`}
                    placeholder="e.g. 2019"
                    inputMode="numeric"
                    maxLength={4}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove row ${index + 1}`}
                  onClick={() => handleRemoveExercise(index)}
                  className="flex h-9 w-9 items-center justify-center self-end rounded-lg text-ink-300 transition hover:bg-rose-50 hover:text-rose-600 md:self-center"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendExercise({ ...BLANK_EXERCISE_ROW })}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-ink-500 transition-colors hover:border-[#0e7d6b]/40 hover:bg-[#f9fefd] hover:text-[#0e7d6b]"
          >
            <Plus size={14} />
            Add another exercise
          </button>
        </SubPanel>

        <SubPanel icon={Wine} title="Alcohol" subtitle="Alcohol consumption">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Type" htmlFor="alcoholType">
              <IconSelect icon={Beer} options={ALCOHOL_TYPES} {...selectProps('alcoholType')} />
            </Field>
            <Field label="How often?" htmlFor="drinkFrequency">
              <IconSelect
                icon={CalendarDays}
                options={DRINK_FREQUENCY}
                {...selectProps('drinkFrequency')}
              />
            </Field>
            <Field label="How much per session?" htmlFor="drinksPerSession">
              <IconSelect
                icon={GlassWater}
                options={DRINKS_PER_SESSION}
                {...selectProps('drinksPerSession')}
              />
            </Field>
          </div>
        </SubPanel>
      </div>
    </SectionCard>
  );
}
