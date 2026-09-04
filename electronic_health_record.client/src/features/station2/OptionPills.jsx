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
            className={`min-h-11 rounded-full border px-4 py-2 text-base font-medium transition
              ${selected
                ? 'border-[#129883] bg-[#129883] text-white shadow-sm'
                : 'border-line bg-surface text-ink-700 hover:border-[#129883] hover:bg-[#f3fdfb] hover:text-[#0e7d6b]'}`}
          >
            {option.optionText}
          </button>
        );
      })}
    </div>
  );
}
