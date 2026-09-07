import { useController } from 'react-hook-form';
import {
  Cigarette, Dumbbell, Wine, Activity, Info,
  Minus, Plus, CalendarDays, PersonStanding, Beer, GlassWater, Check,
} from 'lucide-react';
import Field from '../../components/ui/Field';
import Select from '../../components/ui/Select';
import SectionCard, { SubPanel } from './SectionCard';

const EXERCISE_FREQUENCY = [
  'Rarely / never', '1–2× per week', '3–4× per week', '5–6× per week', 'Daily',
];
const EXERCISE_TYPES = [
  'Brisk walking', 'Running / jogging', 'Cycling', 'Swimming',
  'Gym / weight training', 'Sports', 'Yoga / stretching', 'Other',
];
const ALCOHOL_TYPES = ['Beer', 'Wine', 'Spirits / hard liquor', 'Mixed drinks', 'Other'];
const DRINK_FREQUENCY = [
  'Never', 'Occasionally', 'Monthly', 'Weekly', 'Several times a week', 'Daily',
];
const DRINKS_PER_SESSION = [
  '1 drink', '2–3 drinks', '4–5 drinks', '6 or more drinks',
];
const DRUNK_FREQUENCY = [
  'Once or twice ever', 'A few times a year', 'Monthly', 'Weekly or more',
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
 * Stepper for a small count. Typing stays available for large values, while
 * the buttons cover the common 0–2 answers without opening the keyboard.
 */
function CounterField({ control, name, id, min = 0, max = 99 }) {
  const { field } = useController({ control, name });
  const current = Number(field.value) || 0;
  const step = (delta) => field.onChange(String(Math.min(max, Math.max(min, current + delta))));

  const BTN =
    'flex h-10 w-11 shrink-0 items-center justify-center text-ink-500 transition-colors hover:bg-[#f3fdfb] hover:text-[#0e7d6b] disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent';

  return (
    <div className="flex h-10 w-40 items-stretch overflow-hidden rounded-lg border border-line bg-surface transition focus-within:border-[#129883] focus-within:ring-4 focus-within:ring-[#129883]/10">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={current <= min}
        aria-label="Decrease"
        className={`${BTN} border-r border-line`}
      >
        <Minus size={15} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        {...field}
        value={field.value ?? ''}
        placeholder="0"
        className="w-full min-w-0 border-0 bg-transparent text-center text-sm font-semibold tabular-nums text-ink-900 outline-none [appearance:textfield] placeholder:font-normal placeholder:text-ink-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={current >= max}
        aria-label="Increase"
        className={`${BTN} border-l border-line`}
      >
        <Plus size={15} />
      </button>
    </div>
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
  const hasBeenDrunk = watch('socialHistory.hasBeenDrunk');
  const selectProps = (name) => ({ control, name: `socialHistory.${name}`, id: name });

  return (
    <SectionCard
      step={3}
      title="Social History"
      subtitle="Lifestyle habits that inform screening and advice."
      icon={Activity}
    >
      <div className="flex flex-col gap-4">
        <SubPanel icon={Cigarette} title="Smoking" subtitle="Cigarette usage">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Field label="Sticks per day" htmlFor="smokingSticksPerDay">
              <CounterField
                control={control}
                name="socialHistory.smokingSticksPerDay"
                id="smokingSticksPerDay"
              />
            </Field>
            <p className="flex items-start gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink-500">
              <Info size={14} className="mt-px shrink-0 text-ink-400" />
              Enter 0 if the patient does not smoke.
            </p>
          </div>
        </SubPanel>

        <SubPanel icon={Dumbbell} title="Exercise" subtitle="Physical activity">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Frequency" htmlFor="exerciseFrequency">
              <IconSelect
                icon={CalendarDays}
                options={EXERCISE_FREQUENCY}
                {...selectProps('exerciseFrequency')}
              />
            </Field>
            <Field label="Type of exercise" htmlFor="exerciseType">
              <IconSelect
                icon={PersonStanding}
                options={EXERCISE_TYPES}
                {...selectProps('exerciseType')}
              />
            </Field>
          </div>
        </SubPanel>

        <SubPanel icon={Wine} title="Alcohol" subtitle="Alcohol consumption">
          <div className="flex flex-col gap-4">
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

            <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <YesNoField
                control={control}
                name="socialHistory.hasBeenDrunk"
                label="Have you ever been drunk?"
                htmlFor="hasBeenDrunk"
              />

              {/* The follow-up fades in beside its trigger, so revealing it
                  reads as an answer rather than the row jumping. */}
              {hasBeenDrunk === true && (
                <Field
                  label="How often have you been drunk?"
                  htmlFor="drunkFrequency"
                  className="motion-safe:animate-[fade-in_150ms_ease-out]"
                >
                  <IconSelect
                    icon={GlassWater}
                    options={DRUNK_FREQUENCY}
                    {...selectProps('drunkFrequency')}
                  />
                </Field>
              )}
            </div>
          </div>
        </SubPanel>
      </div>
    </SectionCard>
  );
}
