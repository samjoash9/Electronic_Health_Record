import { Check } from 'lucide-react';

export default function StationStepIndicator({ steps, current, unlockedUpTo, onSelect }) {
  return (
    <ol className="flex items-center justify-center">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;
        const isUnlocked = stepNumber <= unlockedUpTo;
        const isLast = stepNumber === steps.length;

        return (
          <li key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(stepNumber)}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-md px-2 ${
                isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#1fc8a8] text-white ring-4 ring-[#1fc8a8]/20'
                    : isDone
                      ? 'bg-[#0e7d6b] text-white'
                      : 'border-2 border-gray-300 bg-white text-ink-700'
                }`}
              >
                {isDone ? <Check size={16} /> : stepNumber}
              </span>
              <span
                className={`whitespace-nowrap text-xs ${
                  isActive ? 'font-bold text-[#0e7d6b]' : isDone ? 'font-medium text-ink-700' : 'text-ink-500'
                }`}
              >
                {step}
              </span>
            </button>
            {!isLast && (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full ${isDone ? 'bg-[#0e7d6b]' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
