// Tooltip for the Health Reports page's hand-built Recharts cards (Station 3
// lifestyle, Stations 4-5): the entry's name, its count and, when it has one,
// its share.
export default function SocialChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const color = item.payload?.color || item.color || '#0A594D';
  const name = item.payload?.name || label || item.name;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-0.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{name}</span>
      </div>
      <p className="text-slate-600">
        Count: <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
        {item.payload?.pct !== undefined && (
          <span className="text-slate-400 ml-1">({item.payload.pct}%)</span>
        )}
      </p>
    </div>
  );
}
