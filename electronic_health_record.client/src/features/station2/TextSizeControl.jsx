import { Minus, Plus } from 'lucide-react';
import { ZOOM_LEVELS } from '../../lib/kioskZoom';

/**
 * Text-size stepper for the kiosk header. Scales the question area only --
 * the header, step dots and Next button keep their size so the screen's
 * layout stays where a patient last saw it.
 */
export default function TextSizeControl({ index, onChange }) {
  const atMin = index <= 0;
  const atMax = index >= ZOOM_LEVELS.length - 1;
  const percent = Math.round(ZOOM_LEVELS[index] * 100);

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5">
      <span className="hidden pl-1 text-xs font-medium text-ink-500 sm:inline">Text size</span>
      <button
        type="button"
        onClick={() => onChange(index - 1)}
        disabled={atMin}
        aria-label="Make the questions smaller"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-700 transition active:scale-95 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-ink-300 disabled:opacity-60 disabled:hover:bg-transparent"
      >
        <Minus size={18} strokeWidth={2.75} />
      </button>
      {/* aria-live so a change is announced; the buttons themselves keep
          static labels, which screen readers handle better than a label
          that changes under the user's finger. */}
      <span
        aria-live="polite"
        className="min-w-14 text-center text-sm font-semibold tabular-nums text-ink-700"
      >
        {percent}%
      </span>
      <button
        type="button"
        onClick={() => onChange(index + 1)}
        disabled={atMax}
        aria-label="Make the questions bigger"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-700 transition active:scale-95 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-ink-300 disabled:opacity-60 disabled:hover:bg-transparent"
      >
        <Plus size={18} strokeWidth={2.75} />
      </button>
    </div>
  );
}
