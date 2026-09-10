import { useController } from 'react-hook-form';
import { Check } from 'lucide-react';
import Field from '../../components/ui/Field';
import Input from '../../components/ui/Input';

// Sized to its label rather than Tailwind's sr-only: a 1px box with a negative
// margin makes the browser's focus-scroll jump the whole shell. Same reason as
// station4/ChoiceField's HIDDEN_INPUT.
const HIDDEN_INPUT =
  'peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0';

/**
 * ChoiceField (station4) plus a specify field that appears only when "Other"
 * is selected -- same reveal pattern as FAMILY_CONDITIONS' isOther entries in
 * Station 3's family history grid. Not a generalization of ChoiceField itself:
 * every other vision/dental indicator is a plain single-select, so folding the
 * "other" case into that component would make its common path carry a prop
 * every other caller ignores.
 */
export default function ChoiceWithOtherField({
  control, register, name, otherName, label, options, otherPlaceholder,
}) {
  const { field } = useController({ control, name });
  const isOther = field.value === 'Other';

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
      {isOther && (
        <Input
          aria-label={`Specify — ${label}`}
          placeholder={otherPlaceholder}
          className="mt-1 w-full"
          {...register(otherName)}
        />
      )}
    </Field>
  );
}
