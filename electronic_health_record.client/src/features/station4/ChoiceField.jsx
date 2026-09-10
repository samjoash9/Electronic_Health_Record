import { useController } from 'react-hook-form';
import { Check } from 'lucide-react';
import Field from '../../components/ui/Field';

// Sized to its label rather than Tailwind's sr-only: a 1px box with a negative
// margin makes the browser's focus-scroll jump the whole shell. Same reason as
// SocialHistorySection's HIDDEN_INPUT.
const HIDDEN_INPUT =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0';

/**
 * Single-select over N string options, generalizing station 3's YesNoField.
 * Null stays distinct from any listed value, so "not assessed" reads
 * differently from a recorded "None" -- a dentist who skipped an indicator and
 * one who found nothing are not saying the same thing.
 *
 * Options wrap rather than sitting in a fixed grid: the dental indicators run
 * from two options ("No"/"Yes") to five, and the longest label is a full
 * phrase, so a fixed column count would either truncate or leave dead space.
 */
export default function ChoiceField({ control, name, label, options }) {
  const { field } = useController({ control, name });

  return (
    <Field label={label}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = field.value === option;
          return (
            <label
              key={option}
              className={`relative flex h-11 min-w-0 flex-auto items-center gap-2.5 rounded-lg border px-3.5 transition-colors ${
                selected
                  ? 'border-[#0e7d6b]/40 bg-[#f3fdfb]'
                  : 'border-line bg-canvas hover:border-[#0e7d6b]/30 hover:bg-[#f9fefd]'
              }`}
            >
              {/* The visible text is a decorative sibling, so the radio names
                  itself rather than relying on the wrapping label. */}
              <input
                type="radio"
                name={field.name}
                aria-label={option}
                checked={selected}
                onChange={() => field.onChange(option)}
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
                className={`text-sm leading-snug transition-colors ${
                  selected ? 'font-semibold text-ink-900' : 'font-medium text-ink-700'
                }`}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}
