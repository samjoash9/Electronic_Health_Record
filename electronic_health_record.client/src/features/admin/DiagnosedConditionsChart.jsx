import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getDiagnosedConditions } from '../../api/reference.api';
import Select from '../../components/ui/Select';
import {
  FILTER_TRIGGER,
  GRANULARITY_OPTIONS,
  MONTH_NAMES,
  MONTH_OPTIONS,
  daysInMonth,
  manilaToday,
  yearOptions,
} from './dashboardPeriod';

// Keyed by conditionID rather than by rank, so a condition keeps its colour
// when a different period reorders the slices.
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#6366f1',
];
const OTHERS_COLOR = '#94a3b8';
const EMPTY_RING = [{ name: 'none', count: 1 }];

const colorFor = (conditionID) =>
  conditionID == null ? OTHERS_COLOR : PALETTE[conditionID % PALETTE.length];

// "HYPERTENSION (Heart Attack)" -> "Hypertension": the catalog's names are
// written for the Station 3 form, too long and too loud for a legend.
function displayName(name) {
  return name
    .replace(/\s*\(.*\)\s*$/, '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function queryParams(granularity, year, month, day) {
  if (granularity === 'year') return { granularity, year };
  if (granularity === 'month') return { granularity, year, month };
  return { granularity, year, month, day };
}

function periodCaption(granularity, year, month, day) {
  if (granularity === 'year') return String(year);
  if (granularity === 'month') return `${MONTH_NAMES[month - 1]} ${year}`;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export default function DiagnosedConditionsChart() {
  const [initial] = useState(manilaToday);
  const [granularity, setGranularity] = useState('month');
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [chosenDay, setChosenDay] = useState(initial.day);

  // The chosen day is kept as picked and clamped on read, so 31 -> February
  // shows 28, and going back to a 31-day month restores 31.
  const lastDay = daysInMonth(year, month);
  const day = Math.min(chosenDay, lastDay);

  const params = queryParams(granularity, year, month, day);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['diagnosed-conditions', params],
    queryFn: () => getDiagnosedConditions(params),
    placeholderData: keepPreviousData,
  });

  const caption = periodCaption(granularity, year, month, day);
  const slices = (data?.conditions ?? []).map((c) => ({
    ...c,
    label: displayName(c.name),
    color: colorFor(c.conditionID),
  }));
  const sliceTotal = slices.reduce((sum, s) => sum + s.count, 0);
  const dayOptions = Array.from({ length: lastDay }, (_, i) => String(i + 1));

  return (
    <div className="lg:col-span-1 rounded-2xl border border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
      <div>
        {/* Filters sit top-right; on a card too narrow for both they wrap
            under the title, still right-aligned. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">Diagnosed Conditions</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900 tabular-nums">
              {data ? data.total : '—'}
            </p>
            <p className="text-xs text-ink-500">{caption}</p>
          </div>

          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Select
              className="w-22"
              triggerClassName={FILTER_TRIGGER}
              options={GRANULARITY_OPTIONS}
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
            />
            {granularity !== 'year' && (
              <Select
                className="w-28"
                triggerClassName={FILTER_TRIGGER}
                options={MONTH_OPTIONS}
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            )}
            {granularity === 'day' && (
              <Select
                className="w-16"
                triggerClassName={FILTER_TRIGGER}
                options={dayOptions}
                value={String(day)}
                onChange={(e) => setChosenDay(Number(e.target.value))}
              />
            )}
            <Select
              className="w-20"
              triggerClassName={FILTER_TRIGGER}
              options={yearOptions(data?.years, year)}
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="h-56 w-full mt-4">
          {isLoading ? (
            <div className="mx-auto h-full w-56 animate-pulse rounded-full bg-slate-100" />
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-500">
              <p>Couldn&apos;t load conditions.</p>
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
              <PieChart>
                {slices.length === 0 ? (
                  <Pie data={EMPTY_RING} dataKey="count" innerRadius={55} outerRadius={80} isAnimationActive={false}>
                    <Cell fill="#e2e8f0" />
                  </Pie>
                ) : (
                  <Pie data={slices} dataKey="count" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={4}>
                    {slices.map((s) => (
                      <Cell key={s.conditionID ?? 'others'} fill={s.color} />
                    ))}
                  </Pie>
                )}
                {slices.length > 0 && <Tooltip />}
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line text-xs">
        {!isLoading && !error && slices.length === 0 ? (
          <p className="text-center text-ink-500">No conditions recorded for {caption}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {slices.map((s) => (
              <div key={s.conditionID ?? 'others'} className="flex items-center gap-2" title={s.name}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-ink-500 truncate">{s.label}</span>
                <span className="ml-auto text-ink-500 tabular-nums">{s.count}</span>
                <span className="font-medium text-ink-800 tabular-nums">
                  {Math.round((s.count / sliceTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
