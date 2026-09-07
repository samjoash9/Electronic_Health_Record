import { Check } from 'lucide-react';

export default function OptionPills({ question, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={question.questionText} className="flex flex-wrap gap-2">
      {question.options.map((option) => {
        const selected = value === option.optionID;
        return (
          <button
            key={option.optionID}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.optionID)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-base font-medium transition active:scale-95
              ${selected
                ? 'border-[#129883] bg-[#129883] text-white shadow-sm shadow-[#129883]/30'
                : 'border-line bg-surface text-ink-700 hover:border-[#129883]/50 hover:bg-[#f3fdfb] hover:text-[#0e7d6b]'}`}
          >
            {selected && <Check size={15} strokeWidth={3} />}
            {option.optionText}
          </button>
        );
      })}
    </div>
  );
}
