import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import ReportCard from './ReportCard';
import { AXIS_TEXT, GRID } from './reportTheme';

const pct = (count, total) => (total ? Math.round((count / total) * 1000) / 10 : 0);

function ClassTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink-900">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
        {row.label}
        <span className="font-normal text-ink-500">{row.range}</span>
      </p>
      <p className="text-ink-600">
        <span className="font-semibold text-ink-900 tabular-nums">{row.count}</span> patients ·{' '}
        <span className="tabular-nums">{row.pct}%</span>
      </p>
    </div>
  );
}

/**
 * One column per class (BMI category, BP stage), count on the cap. The
 * legend below repeats every class with its range, count and share, so no
 * value is only reachable by hovering.
 */
export default function ClassBarChart({ eyebrow, title, classes, counts, total, legendLabel }) {
  const rows = classes.map((c) => ({ ...c, count: counts[c.key] ?? 0, pct: pct(counts[c.key] ?? 0, total) }));

  return (
    <ReportCard eyebrow={eyebrow} title={title}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" stroke={AXIS_TEXT} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke={AXIS_TEXT} tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip content={<ClassTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {rows.map((r) => <Cell key={r.key} fill={r.color} />)}
              <LabelList dataKey="count" position="top" fill="#334155" fontSize={12} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul aria-label={legendLabel} className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t border-line pt-3 text-xs sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: r.color }} />
            <span className="text-ink-700">{r.label}</span>
            <span className="truncate text-ink-400">{r.range}</span>
            <span className="ml-auto font-semibold text-ink-800 tabular-nums">{r.count}</span>
            <span className="w-11 text-right text-ink-500 tabular-nums">{r.pct}%</span>
          </li>
        ))}
      </ul>
    </ReportCard>
  );
}
