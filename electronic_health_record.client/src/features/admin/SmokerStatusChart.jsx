import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getSmokingStatus } from '../../api/patients.api';
import Select from '../../components/ui/Select';
import { FILTER_TRIGGER } from './dashboardPeriod';
import { ALL_OFFICES, OFFICE_OPTIONS, officeParams } from './dashboardOffice';

// Bottom-to-top stacking order. Smoker segments share the "Smoker" column;
// nonSmoker has the other column to itself. Colours are fixed so the legend
// reads the same whatever the numbers are.
const SEGMENTS = [
  { key: 'traditional', label: 'Traditional', color: '#0F766E' },
  { key: 'eCigarette', label: 'E-Cigarette', color: '#99F6E4' },
  { key: 'both', label: 'Both', color: '#2DD4BF' },
  { key: 'unspecified', label: 'Unspecified', color: '#CBD5E1' },
  { key: 'nonSmoker', label: 'Non-Smoker', color: '#94A3B8' },
];

const TOP_RADIUS = [12, 12, 0, 0];

function toColumns(data) {
  const smokers = data?.smokers ?? {};
  const zero = { traditional: 0, eCigarette: 0, both: 0, unspecified: 0, nonSmoker: 0 };
  return [
    {
      ...zero,
      category: 'Smoker',
      traditional: smokers.traditional ?? 0,
      eCigarette: smokers.eCigarette ?? 0,
      both: smokers.both ?? 0,
      unspecified: smokers.unspecified ?? 0,
    },
    { ...zero, category: 'Non Smoker', nonSmoker: data?.nonSmokers ?? 0 },
  ];
}

// Only the highest non-empty segment of a column gets rounded corners;
// rounding every segment would notch the stack where they meet.
const topSegmentOf = (column) =>
  [...SEGMENTS].reverse().find((s) => column[s.key] > 0)?.key;

/** Tooltip that leaves out zero segments, so hovering a column lists only what is in it. */
function NonZeroTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const filteredPayload = payload.filter((item) => item.value > 0);
  if (!filteredPayload.length) return null;

  return (
    <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200 text-xs">
      <p className="font-semibold text-ink-900 mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {filteredPayload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: item.color }}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-ink-900 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SmokerStatusChart() {
  const [office, setOffice] = useState(ALL_OFFICES);

  const params = officeParams(office);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['smoking-status', params],
    queryFn: () => getSmokingStatus(params),
    placeholderData: keepPreviousData,
  });

  const columns = toColumns(data);
  const tops = columns.map(topSegmentOf);
  const officeLabel = office === ALL_OFFICES ? 'All offices' : office;
  const legend = SEGMENTS
    .map((s) => ({ ...s, count: columns.reduce((sum, c) => sum + c[s.key], 0) }))
    .filter((s) => s.key !== 'unspecified' || s.count > 0);
  const isEmpty = data?.total === 0;

  return (
    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-[#eef0f4] flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">Smoker Status</p>
            <p className="text-sm font-medium text-ink-600 mt-0.5">
              {data ? `${data.total} patients · ${officeLabel}` : 'Distribution Overview'}
            </p>
          </div>
          <Select
            className="ml-auto w-44"
            triggerClassName={FILTER_TRIGGER}
            options={OFFICE_OPTIONS}
            value={office}
            onChange={(e) => setOffice(e.target.value)}
          />
        </div>

        <div className="h-64 w-full mt-2">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-500">
              <p>Couldn&apos;t load smoking status.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={columns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip content={<NonZeroTooltip />} cursor={{ fill: 'transparent' }} />
                {SEGMENTS.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="status" fill={s.color} maxBarSize={55}>
                    {columns.map((column, i) => (
                      <Cell key={column.category} radius={tops[i] === s.key ? TOP_RADIUS : 0} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line text-xs text-ink-500">
        {isEmpty ? (
          <p className="text-center">No smoking history recorded</p>
        ) : (
          <ul aria-label="Smoker status legend" className="flex flex-wrap items-center justify-between gap-2">
            {legend.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
                <span className="font-semibold text-ink-800 tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
