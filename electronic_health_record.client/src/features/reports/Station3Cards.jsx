// Station 3's hand-built cards, moved from HealthReports.jsx when the station
// went live: the lifestyle panel and the ranked lab / medication charts. Each
// card's ref is what the PDF export snapshots.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartReveal from './ChartReveal';
import { chartMotion } from './chartMotion';
import SocialChartTooltip from './SocialChartTooltip';
import { anyAnswered } from './station3Health';

const DEEP_TEAL = '#0A594D';

// Stands in for a chart with nothing to draw, at the chart's height.
function NoneRecorded({ className = 'h-52', children }) {
  return (
    <p className={`flex w-full items-center justify-center text-center text-xs text-slate-400 ${className}`}>
      {children}
    </p>
  );
}

// Dot, name (titled, since it may truncate) and count, two to a row.
function CardLegend({ data, className = 'grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs mt-2' }) {
  return (
    <div className={className}>
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between text-[11px] gap-1">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="truncate text-slate-700" title={entry.name}>{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-900 tabular-nums shrink-0">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/** A list chart's card when the list is empty: its title and why there is no chart. */
export function EmptyChartCard({ ref, title, children }) {
  return (
    <div ref={ref} className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{children}</p>
    </div>
  );
}

/**
 * Smoking, exercise and drinking side by side. exercisePatients of patients
 * reported any exercise; exercise holds the top activities.
 */
export function LifestyleCard({ ref, smoking, exercise, exercisePatients, patients, alcohol, exporting }) {
  return (
    <div
      ref={ref}
      className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/70 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Lifestyle Risk & Social History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tobacco use, physical activity and alcohol intake, from each patient&apos;s latest consultation
          </p>
        </div>
        <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs">
          Social Risk Profile
        </span>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Tobacco & Smoking */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-900">Tobacco & Smoking Profile</h4>
              <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Nicotine Intake
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Cigarettes vs. electronic vaping distribution</p>
            {anyAnswered(smoking) ? (
              <ChartReveal force={exporting} className="w-full h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={smoking}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      {...chartMotion('pie', exporting)}
                    >
                      {smoking.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SocialChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartReveal>
            ) : (
              <NoneRecorded>No smoking answers recorded.</NoneRecorded>
            )}
          </div>
          <CardLegend data={smoking} />
        </div>

        {/* Column 2: Physical Activity & Exercise */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-900">Physical Activity Engagement</h4>
              <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Top 5 Activities
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Case-insensitive aggregation of free-text inputs</p>
            {exercise.length ? (
              <ChartReveal force={exporting} className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={exercise} margin={{ top: 8, right: 32, left: 10, bottom: 5 }}>
                    <CartesianGrid horizontal={false} stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={88}
                    />
                    <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={DEEP_TEAL}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                      {...chartMotion('bar', exporting)}
                    >
                      {exercise.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="right" fontSize={10} fontWeight={600} fill="#334155" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            ) : (
              <NoneRecorded>No exercise recorded in this period.</NoneRecorded>
            )}
          </div>
          {exercise.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-600 mt-2">
              <span>
                Top: <strong className="text-slate-900">{exercise[0].name}</strong> · {exercisePatients} of{' '}
                {patients} patients exercise
              </span>
            </div>
          )}
        </div>

        {/* Column 3: Alcohol Consumption */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-900">Alcohol Consumption Frequency</h4>
              <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Intake Cadence
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Categorical patient intake frequency breakdown</p>
            {anyAnswered(alcohol) ? (
              <ChartReveal force={exporting} className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alcohol} margin={{ top: 18, right: 12, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      tickLine={false}
                      axisLine={false}
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis stroke="#64748B" tickLine={false} axisLine={false} fontSize={10} allowDecimals={false} />
                    <Tooltip content={<SocialChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar
                      dataKey="value"
                      fill={DEEP_TEAL}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                      {...chartMotion('bar', exporting)}
                    >
                      {alcohol.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="top" fontSize={10} fontWeight={600} fill="#334155" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            ) : (
              <NoneRecorded>No drinking answers recorded.</NoneRecorded>
            )}
          </div>
          <CardLegend data={alcohol} />
        </div>
      </div>
    </div>
  );
}

// A ranked bar's name and how many consultations ordered it.
function RankedTooltip({ active, payload, countLabel }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || DEEP_TEAL }} />
        <span>{item.name}</span>
      </div>
      <p className="text-slate-600">
        {countLabel}: <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
      </p>
    </div>
  );
}

/** The top labs or medications as horizontal bars; countLabel names what a bar counts. */
export function RankedBarCard({ ref, title, subtitle, countLabel, data, emptyText, exporting }) {
  return (
    <div
      ref={ref}
      className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between"
    >
      {/* Card Header */}
      <div className="mb-4 border-b border-slate-200/70 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {data.length ? (
        <>
          <ChartReveal force={exporting} className="w-full h-80" style={{ marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data} margin={{ top: 10, right: 36, left: 16, bottom: 5 }}>
                <CartesianGrid horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  interval={0}
                  width={140}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  stroke="#64748B"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<RankedTooltip countLabel={countLabel} />} cursor={{ fill: '#F8FAFC' }} />
                <Bar
                  dataKey="value"
                  fill={DEEP_TEAL}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                  {...chartMotion('bar', exporting)}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="#334155" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>

          {/* Standard 4-Column Legend */}
          <CardLegend
            data={data}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2.5 pt-3 border-t border-slate-200/80 text-xs mt-3 max-h-48 overflow-y-auto"
          />
        </>
      ) : (
        <NoneRecorded className="h-24">{emptyText}</NoneRecorded>
      )}
    </div>
  );
}
