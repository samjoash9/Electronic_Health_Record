import { Check } from 'lucide-react';

/**
 * `compact` is the phone layout: the labels under the circles collide at that
 * width, so the circles stand alone, a size smaller so seven still fit, and the
 * current step is named once, underneath the row. `captioned={false}` drops
 * that name, for a screen that already shows it right below.
 */
export default function StationStepIndicator({
  steps, current, unlockedUpTo, onSelect, compact = false, captioned = true,
}) {
  const circle = compact ? 'h-8 w-8' : 'h-9 w-9';

  // px-16: the labels below are centred on their circles and overhang them (see
  // the note on the label span). The first and last circles sit at the row's
  // edges, so without this gutter their labels are clipped by the container.
  // Compact drops the labels, so it drops the gutter with them.
  const list = (
    <ol className={`flex items-start ${compact ? '' : 'justify-center px-16 pb-6'}`}>
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;
        const isUnlocked = stepNumber <= unlockedUpTo;
        const isLast = stepNumber === steps.length;

        return (
          <li key={step} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(stepNumber)}
              // With no label on screen, the step's name has to come from here.
              aria-label={compact ? step : undefined}
              className={`relative flex ${circle} shrink-0 items-center justify-center rounded-md ${
                isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span
                className={`flex ${circle} shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#1fc8a8] text-white ring-4 ring-[#1fc8a8]/20'
                    : isDone
                      ? 'bg-[#0e7d6b] text-white'
                      : 'border-2 border-gray-300 bg-white text-ink-700'
                }`}
              >
                {isDone ? <Check size={16} /> : stepNumber}
              </span>
              {/* Taken out of flow and centred on the circle: a label is wider
                  than the 36px circle it belongs to, and while it takes up
                  layout width it eats into the connector beside it, so a long
                  name like "Psychological" leaves a visibly shorter line than
                  "Mental". Positioned this way, every connector is identical
                  whatever the labels say. */}
              {!compact && (
                <span
                  className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-xs ${
                    isActive ? 'font-bold text-[#0e7d6b]' : isDone ? 'font-medium text-ink-700' : 'text-ink-500'
                  }`}
                >
                  {step}
                </span>
              )}
            </button>
            {!isLast && (
              <span
                className={`${compact ? 'mx-1.5 mt-3.75' : 'mx-3 mt-4.5'} h-0.5 flex-1 rounded-full ${isDone ? 'bg-[#0e7d6b]' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );

  if (!compact || !captioned) return list;

  return (
    <div className="flex flex-col gap-3">
      {list}
      <p className="text-center">
        <span className="block text-[11px] font-semibold tracking-wider text-ink-500 uppercase">
          Step {current} of {steps.length}
        </span>
        <span className="block text-sm font-bold text-[#0e7d6b]">{steps[current - 1]}</span>
      </p>
    </div>
  );
}
