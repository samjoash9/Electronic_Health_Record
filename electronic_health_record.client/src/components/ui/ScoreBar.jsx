import { scoreBand } from '../../lib/interpretation';

// Colour follows the band so a bar never disagrees with the band chip shown
// beside it: the two good bands are green, the two middle ones amber.
const TONES = {
  excellent: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  good: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  fair: { bar: 'bg-amber-500', text: 'text-amber-600' },
  attention: { bar: 'bg-amber-500', text: 'text-amber-600' },
  support: { bar: 'bg-rose-500', text: 'text-rose-600' },
};

export default function ScoreBar({ label, percent, total, max, icon: Icon, badgeClassName }) {
  const pct = percent ?? 0;
  const tone = TONES[scoreBand(pct)];
  return (
    <div className="flex flex-1 items-center gap-3">
      {Icon && (
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 ${badgeClassName ?? ''}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="text-sm font-bold text-ink-900">{label}</span>
        <div className="h-2 overflow-hidden rounded-full bg-white/60">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={`shrink-0 text-right text-base font-extrabold ${percent === null ? 'text-ink-500' : tone.text}`}>
        {percent === null ? '—' : `${pct}%`}
        <span className="block text-right text-[11px] font-medium text-ink-500">{total}/{max}</span>
      </span>
    </div>
  );
}
