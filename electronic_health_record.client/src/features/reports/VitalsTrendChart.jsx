import {
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import ReportCard from './ReportCard';
import { AXIS_TEXT, GRID, SERIES } from './reportTheme';

// Both measures are a share of patients, so they can share one % axis.
const LINES = [
  { key: 'overweightPct', label: 'Overweight or obese', color: SERIES.overweight },
  { key: 'highBpPct', label: 'High blood pressure (stage 1+)', color: SERIES.highBp },
];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-ink-900">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-ink-900 tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The latest value printed at the end of each line, in ink rather than the
// line's colour; every other point is left to the tooltip.
const endLabel = (lastIndex) => function EndLabel({ x, y, value, index }) {
  if (index !== lastIndex) return null;
  return (
    <text x={x + 8} y={y} dy={4} fill="#334155" fontSize={12} fontWeight={600}>
      {value}%
    </text>
  );
};

// The axis hugs the data (5 points of headroom, snapped to 5s) instead of
// running 0-100%: a year's drift is a few points, which a full-height axis
// flattens into two straight lines. A line needs no zero baseline; a bar would.
function axisDomain(trend) {
  const values = trend.flatMap((p) => LINES.map((l) => p[l.key]));
  const lo = Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5);
  const hi = Math.min(100, Math.ceil((Math.max(...values) + 5) / 5) * 5);
  return [lo, hi];
}

// Round-number ticks: every 10 points on a wide axis, every 5 on a narrow one.
function axisTicks([lo, hi]) {
  const step = hi - lo > 20 ? 10 : 5;
  const ticks = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
  return ticks;
}

export default function VitalsTrendChart({ trend, className = '' }) {
  const lastIndex = trend.length - 1;
  const domain = axisDomain(trend);

  return (
    <ReportCard
      eyebrow="Trend"
      title="Share of patients, last 12 months"
      className={className}
      aside={(
        <ul aria-label="Trend legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
          {LINES.map((l) => (
            <li key={l.key} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 10, right: 44, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" stroke={AXIS_TEXT} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              stroke={AXIS_TEXT}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              domain={domain}
              ticks={axisTicks(domain)}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
            {LINES.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.label}
                stroke={l.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: l.color, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: l.color, stroke: '#fff', strokeWidth: 2 }}
              >
                <LabelList dataKey={l.key} content={endLabel(lastIndex)} />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ReportCard>
  );
}
