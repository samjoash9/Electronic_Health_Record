import { Check } from 'lucide-react';
import { optionText, questionText } from '../../lib/assessmentText';

export default function OptionPills({ question, value, onChange, lang = 'en' }) {
  return (
    <div
      role="radiogroup"
      aria-label={questionText(question, lang)}
      className="flex flex-wrap gap-[0.5em]"
    >
      {question.options.map((option) => {
        const selected = value === option.optionID;
        return (
          <button
            key={option.optionID}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.optionID)}
            // Sized in `em` so the pills grow with the question text set on
            // the card; min-h-11 stays as a floor to keep the touch target
            // tappable at the smallest size.
            className={`inline-flex min-h-11 items-center gap-[0.35em] rounded-full border px-[1em] py-[0.5em] text-[1em] font-medium transition active:scale-95
              ${selected
                ? 'border-[#129883] bg-[#129883] text-white shadow-sm shadow-[#129883]/30'
                : 'border-line bg-surface text-ink-700 hover:border-[#129883]/50 hover:bg-[#f3fdfb] hover:text-[#0e7d6b]'}`}
          >
            {/* "1em" rather than a fixed px size so the tick tracks the
                label instead of shrinking away as the text grows. */}
            {selected && <Check size="1em" strokeWidth={3} className="shrink-0" />}
            {optionText(option, lang)}
          </button>
        );
      })}
    </div>
  );
}
