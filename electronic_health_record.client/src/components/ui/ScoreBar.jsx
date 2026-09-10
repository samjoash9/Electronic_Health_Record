export default function ScoreBar({ label, percent, total, max, icon: Icon, badgeClassName }) {
  const pct = percent ?? 0;
  const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const scoreColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
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
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className={`shrink-0 text-right text-base font-extrabold ${percent === null ? 'text-ink-500' : scoreColor}`}>
        {percent === null ? '—' : `${pct}%`}
        <span className="block text-right text-[11px] font-medium text-ink-500">{total}/{max}</span>
      </span>
    </div>
  );
}
