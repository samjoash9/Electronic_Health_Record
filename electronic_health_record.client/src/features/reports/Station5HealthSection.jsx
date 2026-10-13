import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import ChartReveal from './ChartReveal';
import { chartMotion } from './chartMotion';
import SocialChartTooltip from './SocialChartTooltip';
import { FrameKpis, StationFrame } from './StationFrame';
import { station5Charts, station5Kpis } from './station5Health';
import { useHealthReport } from './useHealthReport';

const SECTION = {
  number: 5,
  title: 'Station 5: Vision Screening Graphical Reports',
  subtitle:
    'Prevalence of reported ocular symptoms, history of eye conditions, and visual acuity impairment screening',
};

/**
 * Station 5 on the Health Reports page, from GET /api/health-reports/station5.
 * chartRefs ({ symptoms }) hand the chart card to the PDF export; exporting
 * draws the chart at once, as the page's other stations do.
 */
export default function Station5HealthSection({ params, chartRefs = {}, exporting = false }) {
  const query = useHealthReport(5, params);

  if (query.isPending) {
    return (
      <StationFrame {...SECTION}>
        <Skeleton rows={6} />
      </StationFrame>
    );
  }

  if (query.isError) {
    return (
      <StationFrame {...SECTION}>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </StationFrame>
    );
  }

  const report = query.data;
  if (report.screenings === 0) {
    return (
      <StationFrame {...SECTION}>
        <p className="py-10 text-center text-sm text-slate-500">No Station 5 vision screenings in this period.</p>
      </StationFrame>
    );
  }

  const { symptoms: symptomsRef } = chartRefs;
  const { symptoms } = station5Charts(report);

  return (
    <StationFrame {...SECTION}>
      <FrameKpis kpis={station5Kpis(report)} />

      {/* Chart 1: Visual Symptoms Prevalence (Vertical Bar Chart) */}
      <div ref={symptomsRef} className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">Prevalence of Reported Visual Symptoms</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients answering &quot;Yes&quot; to each of the 5 primary ocular symptom questions, from their latest
            vision screening
          </p>
        </div>

        <ChartReveal force={exporting} className="w-full h-80" style={{ marginTop: '0.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={symptoms} margin={{ top: 20, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} fontSize={10} interval={0} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
              <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Bar
                dataKey="value"
                fill="#0A594D"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
                {...chartMotion('bar', exporting)}
              >
                {symptoms.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="top" fill="#334155" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartReveal>

        {/* Standard Custom Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100 text-sm mt-4">
          {symptoms.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center justify-start gap-2.5 text-sm text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
              <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                {entry.value} ({entry.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </StationFrame>
  );
}
