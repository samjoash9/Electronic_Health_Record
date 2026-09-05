const SIZE = 76;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TONE = {
  high: { ring: 'stroke-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  mid: { ring: 'stroke-amber-500', text: 'text-amber-600', dot: 'bg-amber-500' },
  low: { ring: 'stroke-rose-500', text: 'text-rose-600', dot: 'bg-rose-500' },
};

function toneFor(pct) {
  if (pct >= 75) return TONE.high;
  if (pct >= 50) return TONE.mid;
  return TONE.low;
}

export default function ScoreRing({ label, percent, total, max }) {
  const pct = percent ?? 0;
  const tone = toneFor(pct);
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const empty = percent === null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface px-4 py-4 shadow-sm">
      <div className="relative h-19 w-19 shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-full w-full">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-gray-100"
          />
          {!empty && pct > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              className={`transition-[stroke-dashoffset] duration-500 ${tone.ring}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-base leading-none font-extrabold tabular-nums ${empty ? 'text-ink-500' : tone.text}`}
          >
            {empty ? '—' : `${pct}%`}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${empty ? 'bg-gray-300' : tone.dot}`} />
          <span className="truncate text-xs font-semibold tracking-wide text-ink-500 uppercase">
            {label}
          </span>
        </div>
        <p className="mt-1.5 text-lg leading-none font-bold tabular-nums text-ink-900">
          {total}
          <span className="text-sm font-medium text-ink-500">/{max}</span>
        </p>
        <p className="mt-1 text-[11px] text-ink-500">points scored</p>
      </div>
    </div>
  );
}
