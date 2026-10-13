import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import ChartReveal from './ChartReveal';
import { chartMotion } from './chartMotion';
import SocialChartTooltip from './SocialChartTooltip';
import { FrameKpis, StationFrame } from './StationFrame';
import { station4Charts, station4Kpis } from './station4Health';
import { useHealthReport } from './useHealthReport';

const SECTION = {
  number: 4,
  title: 'Station 4: Dental Assessment Graphical Reports',
  subtitle:
    'Oral hygiene indexing, caries prevalence, periodontal evaluation, and recommended dental interventions',
};

/**
 * Station 4 on the Health Reports page, from GET /api/health-reports/station4.
 * chartRefs ({ hygiene, gum }) hand the chart cards to the PDF export;
 * exporting draws the charts at once, as the page's other stations do.
 */
export default function Station4HealthSection({ params, chartRefs = {}, exporting = false }) {
  const query = useHealthReport(4, params);

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
        <p className="py-10 text-center text-sm text-slate-500">No Station 4 dental screenings in this period.</p>
      </StationFrame>
    );
  }

  const { hygiene: hygieneRef, gum: gumRef } = chartRefs;
  const { hygiene, gum } = station4Charts(report);

  return (
    <StationFrame {...SECTION}>
      <FrameKpis kpis={station4Kpis(report)} />

      {/* Chart 1: Oral Hygiene Status (Donut Chart) */}
      <div ref={hygieneRef} className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">Oral Hygiene Status Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Oral hygiene status from each patient&apos;s latest dental screening, as a share of those assessed
          </p>
        </div>

        <ChartReveal force={exporting} className="w-full h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hygiene}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                {...chartMotion('pie', exporting)}
              >
                {hygiene.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<SocialChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartReveal>

        {/* Custom Flex-Wrap Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-100 text-xs mt-3">
          {hygiene.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700 font-medium">{entry.name}</span>
              <span className="text-slate-400">({entry.pct}%)</span>
              <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Gum Condition (Vertical Bar Chart) */}
      <div ref={gumRef} className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900">Periodontal & Gum Condition Assessment</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gingivitis and suspected periodontal disease from each patient&apos;s latest dental screening
          </p>
        </div>

        <ChartReveal force={exporting} className="w-full h-80" style={{ marginTop: '0.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gum} margin={{ top: 20, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
              <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Bar
                dataKey="value"
                fill="#0A594D"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                {...chartMotion('bar', exporting)}
              >
                {gum.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="top" fill="#334155" fontSize={11} fontWeight={600} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartReveal>

        {/* 4-Column Grid Custom Legend for clean alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs mt-3">
          {gum.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-[11px] gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate text-slate-700" title={entry.name}>
                  {entry.name}
                </span>
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
