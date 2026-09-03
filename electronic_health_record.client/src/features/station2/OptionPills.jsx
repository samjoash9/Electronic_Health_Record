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
            className={`min-h-11 rounded-full border px-4 py-2 text-base transition
              ${selected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-surface text-ink-700 hover:border-brand-500'}`}
          >
            {option.optionText}
          </button>
        );
      })}
    </div>
  );
}
