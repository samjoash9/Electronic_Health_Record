export default function ScoreBar({ label, percent, total, max }) {
  const pct = percent ?? 0;
  const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-700">{label}</span>
        <span className="text-xs font-semibold text-ink-900">
          {percent === null ? '—' : `${pct}%`}
          <span className="ml-1 font-normal text-ink-500">({total}/{max})</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
