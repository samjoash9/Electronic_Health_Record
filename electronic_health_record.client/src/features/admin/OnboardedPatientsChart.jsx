import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getOnboardedStats } from '../../api/patients.api';
import Select from '../../components/ui/Select';
import {
  FILTER_TRIGGER,
  GRANULARITY_OPTIONS,
  MONTH_NAMES,
  MONTH_OPTIONS,
  manilaToday,
  shortMonth,
  yearOptions,
} from './dashboardPeriod';

function queryParams(granularity, year, month) {
  if (granularity === 'year') return { granularity };
  if (granularity === 'month') return { granularity, year };
  return { granularity, year, month };
}

/** Caption under the total, and the two legend names, for the current filter. */
function periodLabels(granularity, year, month) {
  if (granularity === 'year') {
    return { caption: 'All years', current: 'Onboarded', previous: null };
  }
  if (granularity === 'month') {
    return { caption: String(year), current: String(year), previous: String(year - 1) };
  }
  const previous = month === 1 ? `Dec ${year - 1}` : `${shortMonth(month - 1)} ${year}`;
  return {
    caption: `${MONTH_NAMES[month - 1]} ${year}`,
    current: `${shortMonth(month)} ${year}`,
    previous,
  };
}

export default function OnboardedPatientsChart() {
  const [initial] = useState(manilaToday);
  const [granularity, setGranularity] = useState('month');
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const params = queryParams(granularity, year, month);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients-onboarded', params],
    queryFn: () => getOnboardedStats(params),
    // Keep the last series on screen while the next filter loads, instead
    // of collapsing the card to a placeholder on every change.
    placeholderData: keepPreviousData,
  });

  const labels = periodLabels(granularity, year, month);

  return (
    <div className="lg:col-span-2 rounded-2xl border border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">Total Patients Onboarded</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900 tabular-nums">
              {data ? data.total : '—'}
            </p>
            <p className="text-xs text-ink-500">{labels.caption}</p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              className="w-24"
              triggerClassName={FILTER_TRIGGER}
              options={GRANULARITY_OPTIONS}
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
            />
            {granularity === 'day' && (
              <Select
                className="w-32"
                triggerClassName={FILTER_TRIGGER}
                options={MONTH_OPTIONS}
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            )}
            {granularity !== 'year' && (
              <Select
                className="w-24"
                triggerClassName={FILTER_TRIGGER}
                options={yearOptions(data?.years, year)}
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            )}
          </div>
        </div>

        <div className="h-56 w-full mt-4">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-500">
              <p>Couldn&apos;t load onboarding data.</p>
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
              <LineChart data={data.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="current"
                  name={labels.current}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
                {labels.previous && (
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name={labels.previous}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-3 border-t border-line text-xs text-ink-500">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span data-legend>{labels.current}</span>
        </div>
        {labels.previous && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span data-legend>{labels.previous}</span>
          </div>
        )}
      </div>
    </div>
  );
}
