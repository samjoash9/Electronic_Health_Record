/**
 * One stacked bar split by share, with a legend that always names each
 * segment and its figure -- colour never carries the meaning on its own.
 * Negative values (an over-spent budget's "remaining") are not drawn.
 */
export default function SegmentBar({ label, segments, format = (v) => v }) {
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-600">{label}</p>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                data-segment
                className="h-full"
                style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
                title={`${s.label}: ${format(s.value)}`}
              />
            ))}
      </div>
      <ul aria-label={`${label} legend`} className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <span className="font-semibold tabular-nums text-ink-900">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
