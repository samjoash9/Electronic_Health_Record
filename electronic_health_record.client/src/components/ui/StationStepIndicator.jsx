import { Check } from 'lucide-react';

export default function StationStepIndicator({ steps, current, unlockedUpTo, onSelect }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;
        const isUnlocked = stepNumber <= unlockedUpTo;

        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(stepNumber)}
              className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-sm transition ${
                isActive
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : isDone
                    ? 'border-line bg-surface text-ink-700 hover:bg-gray-50'
                    : 'border-line bg-gray-50 text-ink-400'
              } ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : isDone
                      ? 'bg-brand-700 text-white'
                      : 'bg-gray-200 text-ink-500'
                }`}
              >
                {isDone ? <Check size={12} /> : stepNumber}
              </span>
              <span className="font-medium">{step}</span>
            </button>
            {stepNumber < steps.length && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
