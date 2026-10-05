import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getWellnessScores } from '../../api/assessment.api';
import Select from '../../components/ui/Select';
import { FILTER_TRIGGER } from './dashboardPeriod';
import { ALL_OFFICES, OFFICE_OPTIONS, officeParams } from './dashboardOffice';

// Scores are percentages of the points possible, so the axis is pinned to
// 0-100 rather than left to fit the data: a category at 60 should look like
// 60 out of 100 whichever office is picked.
const SCORE_DOMAIN = [0, 100];
const SCORE_TICKS = [0, 25, 50, 75, 100];

function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value == null) return null;

  return (
    <div className="bg-white p-3 shadow-lg rounded-md border border-slate-200 text-xs">
      <p className="font-semibold text-ink-900 mb-1">{label}</p>
      <p className="text-ink-600">
        Average score <span className="font-semibold text-ink-900 tabular-nums">{payload[0].value.toFixed(1)}%</span>
      </p>
    </div>
  );
}

export default function WellnessAspectsChart() {
  const [office, setOffice] = useState(ALL_OFFICES);

  const params = officeParams(office);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wellness-scores', params],
    queryFn: () => getWellnessScores(params),
    placeholderData: keepPreviousData,
  });

  const aspects = data?.aspects ?? [];
  const isEmpty = data?.total === 0;
  const subtitle = data
    ? `Average Assessment Scores · ${data.total} ${data.total === 1 ? 'patient' : 'patients'}`
    : 'Average Assessment Scores';

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-[#eef0f4] flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-400">7 Aspects of Wellness</p>
            <p className="text-sm font-medium text-ink-600 mt-0.5">{subtitle}</p>
          </div>
          <Select
            className="ml-auto w-56"
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
              <p>Couldn&apos;t load wellness scores.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center text-sm text-ink-500">
              <p>No assessments recorded</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aspects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={SCORE_DOMAIN}
                  ticks={SCORE_TICKS}
                />
                <Tooltip content={<ScoreTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="score" name="Score" fill="#37AF9B" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
