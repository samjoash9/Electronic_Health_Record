import { Check } from 'lucide-react';
import { formatDateTime } from '../../lib/formatters';
import { STEPS, currentStepIndex } from './visitSteps';

export default function StatusTimeline({ form }) {
  const current = currentStepIndex(form);

  return (
    <ol className="flex flex-col">
      {STEPS.map((step, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.key} className="flex gap-3.5">
            {/* Rail: the marker plus the segment running down to the next stop.
                A solid teal segment reads as ground already covered. */}
            <div className="flex flex-col items-center">
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-[#129883]/25 motion-safe:animate-ping" />
                )}
                <span
                  className={`relative flex h-5 w-5 items-center justify-center rounded-full ${
                    done
                      ? 'bg-[#129883] text-white'
                      : isCurrent
                        ? 'border-2 border-[#129883] bg-surface'
                        : 'border-2 border-ink-200 bg-surface'
                  }`}
                >
                  {done && <Check size={12} strokeWidth={3} />}
                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[#129883]" />}
                </span>
              </span>
              {!isLast && (
                <span className={`w-0.5 flex-1 rounded-full ${done ? 'bg-[#129883]/35' : 'bg-ink-200'}`} />
              )}
            </div>

            <div className={isLast ? '' : 'pb-5'}>
              <p
                className={`text-sm leading-5 ${
                  isCurrent
                    ? 'font-semibold text-[#0e7d6b]'
                    : done
                      ? 'font-medium text-ink-900'
                      : 'font-medium text-ink-400'
                }`}
              >
                {step.label}
              </p>
              <p className={`mt-0.5 text-xs leading-5 ${done ? 'text-ink-500' : 'text-ink-400'}`}>
                {done ? step.done : step.waiting}
              </p>
              {done && (
                <p className="mt-0.5 text-xs leading-5 text-ink-400">{formatDateTime(form[step.key])}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
