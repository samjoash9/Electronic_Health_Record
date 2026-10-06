import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  LineChart,
  Line,
  LabelList,
} from 'recharts';

const THEME = {
  deepTeal: '#0A594D',
  vibrantTeal: '#37AF9B',
  mint: '#99F6E4',
  lightTeal: '#CCFBF1',
  darkTealHover: '#08483e',
  gridLine: '#F1F5F9',
  axisText: '#94A3B8',
};

// Custom Tooltip for Vertical & Horizontal Bar Charts
function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const itemColor = data.payload?.color || data.color || THEME.deepTeal;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemColor }} />
        <span>{data.payload?.name || label}</span>
      </div>
      <p className="text-slate-600">
        Value: <span className="font-semibold text-slate-900 tabular-nums">{data.value}</span>
        {data.payload?.unit && <span className="text-slate-500 ml-1">{data.payload.unit}</span>}
        {data.payload?.pct !== undefined && (
          <span className="text-slate-400 ml-1">({data.payload.pct}%)</span>
        )}
      </p>
      {data.payload?.subtext && (
        <p className="text-[11px] text-slate-400 mt-0.5">{data.payload.subtext}</p>
      )}
    </div>
  );
}

CustomBarTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Custom Tooltip for Donut / Pie Charts
function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const itemColor = data.payload?.color || data.color || THEME.vibrantTeal;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-md">
      <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: itemColor }} />
        <span>{data.name}</span>
      </div>
      <p className="text-slate-600">
        Count: <span className="font-semibold text-slate-900 tabular-nums">{data.value}</span>
        {data.payload?.pct !== undefined && (
          <span className="text-slate-400 ml-1">({data.payload.pct}%)</span>
        )}
      </p>
      {data.payload?.desc && (
        <p className="text-[11px] text-slate-400 mt-0.5">{data.payload.desc}</p>
      )}
    </div>
  );
}

CustomPieTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

/**
 * Reusable Station Report Section Component
 * Displays Station Header, 4 KPI Summary Cards, and either full-width stacked
 * charts or a 2-column Recharts layout.
 */
export default function StationReportSection({
  stationNumber,
  stationName,
  stationSubtitle,
  kpis = [],
  kpiGridClassName,
  chartData1,
  chartData2,
  chartData3,
  chartData4,
  charts = null,
  stacked = true,
  chart1Ref,
  chart2Ref,
  chart3Ref,
  chart4Ref,
  children,
}) {
  const isStacked = stacked !== false;

  const headingText = `Station ${stationNumber}: ${stationName} Graphical Reports`;
  const chartList = charts || [chartData1, chartData2, chartData3, chartData4].filter(Boolean);

  const getChartRef = (chart, idx) => {
    if (chart?.ref) return chart.ref;
    if (idx === 0) return chart1Ref;
    if (idx === 1) return chart2Ref;
    if (idx === 2) return chart3Ref;
    if (idx === 3) return chart4Ref;
    return undefined;
  };

  const renderSingleChartCard = (chart, idx) => {
    if (!chart) return null;
    const isDense = chart.data?.length > 7 || chart.scrollable;
    const isHorizontalBar = chart.type === 'horizontal-bar' || chart.layout === 'vertical';
    const isDonutOrPie = chart.type === 'donut' || chart.type === 'pie';
    const isLine = chart.type === 'line';
    const cardRef = getChartRef(chart, idx);

    return (
      <div
        key={idx}
        ref={cardRef}
        className="w-full rounded-xl border border-slate-100 bg-slate-50/40 p-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{chart.title}</h3>
              {chart.subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{chart.subtitle}</p>
              )}
            </div>
            {chart.tag && (
              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs">
                {chart.tag}
              </span>
            )}
          </div>

          {/* Chart Rendering */}
          {isHorizontalBar ? (
            // Horizontal Bar Chart
            <div className="w-full h-72" style={{ marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chart.data}
                  margin={{ top: 10, right: 36, left: 16, bottom: 5 }}
                >
                  <CartesianGrid horizontal={false} stroke={THEME.gridLine} />
                  <XAxis
                    type="number"
                    stroke={THEME.axisText}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    allowDecimals={false}
                    domain={chart.domain || [0, 'auto']}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={THEME.axisText}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={chart.yAxisWidth || 120}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey={chart.dataKey || 'value'}
                    fill={chart.barColor || '#EF4444'}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  >
                    {chart.data.map((entry, index) => (
                      <Cell
                        key={`h-cell-${index}`}
                        fill={entry.color || chart.barColor || '#EF4444'}
                      />
                    ))}
                    <LabelList
                      dataKey={chart.dataKey || 'value'}
                      position="right"
                      fill="#334155"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : isDonutOrPie ? (
            // Centered Donut / Pie Chart
            <div
              className={
                isStacked
                  ? 'w-full h-72 flex items-center justify-center'
                  : 'w-full h-60'
              }
              style={{ marginTop: '0.5rem' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={isStacked ? 65 : chart.type === 'donut' ? 55 : 0}
                    outerRadius={isStacked ? 95 : 82}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={entry.color || THEME.vibrantTeal}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : isLine ? (
            // Line Chart
            <div className="w-full h-72" style={{ marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chart.data}
                  margin={{ top: 20, right: 32, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.gridLine} />
                  <XAxis
                    dataKey="name"
                    stroke={THEME.axisText}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    stroke={THEME.axisText}
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    allowDecimals={false}
                    domain={chart.domain || [0, 'auto']}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey={chart.dataKey || 'value'}
                    stroke={chart.lineColor || THEME.deepTeal}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: chart.lineColor || THEME.deepTeal, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, stroke: THEME.vibrantTeal, strokeWidth: 2 }}
                  >
                    <LabelList
                      dataKey={chart.dataKey || 'value'}
                      position="top"
                      offset={10}
                      fill="#334155"
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // Standard Vertical Bar Chart (with angled ticks if dense)
            <div className={isDense ? 'w-full overflow-x-auto pb-2' : 'w-full'}>
              <div
                className={
                  isStacked
                    ? isDense
                      ? 'w-full min-w-[700px] lg:min-w-0 h-80'
                      : 'w-full h-80'
                    : isDense
                    ? 'min-w-[850px] h-72'
                    : 'w-full h-60'
                }
                style={{ marginTop: '0.5rem' }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chart.data}
                    margin={{
                      top: 18,
                      right: 16,
                      left: -16,
                      bottom: isDense ? 25 : 0,
                    }}
                  >
                    <CartesianGrid vertical={false} stroke={THEME.gridLine} />
                    <XAxis
                      dataKey="name"
                      stroke={THEME.axisText}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={isDense ? -45 : 0}
                      textAnchor={isDense ? 'end' : 'middle'}
                      height={isDense ? 85 : 30}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      stroke={THEME.axisText}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      domain={chart.domain || [0, 'auto']}
                      ticks={chart.ticks}
                      allowDecimals={false}
                      unit={chart.yUnit || ''}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar
                      dataKey="value"
                      fill={chart.barColor || THEME.deepTeal}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={isStacked ? 48 : 42}
                    >
                      {chart.data.map((entry, index) => (
                        <Cell
                          key={`v-cell-${index}`}
                          fill={entry.color || chart.barColor || THEME.deepTeal}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        fill="#334155"
                        fontSize={11}
                        fontWeight={600}
                        formatter={chart.valueFormatter}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {chart.data && (
          <div
            className={
              isDonutOrPie && !chart.legendGrid
                ? 'flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-3 border-t border-slate-200/80 text-xs mt-3 max-h-48 overflow-y-auto'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 pt-3 border-t border-slate-200/80 text-xs mt-3 max-h-48 overflow-y-auto'
            }
          >
            {chart.data.map((entry, i) => (
              <div
                key={i}
                className={
                  isDonutOrPie && !chart.legendGrid
                    ? 'flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/70 px-3 py-1.5 shadow-2xs'
                    : 'flex items-center justify-start gap-1.5 min-w-0'
                }
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || THEME.deepTeal }}
                />
                <span className="truncate text-slate-700 text-[11px]" title={entry.name}>
                  {entry.name}
                </span>
                <span className="ml-auto font-semibold text-slate-900 tabular-nums text-[11px] pl-1 shrink-0">
                  {entry.value ?? entry.count}
                </span>
                {entry.pct !== undefined && (
                  <span className="text-slate-400 text-[10px] shrink-0">({entry.pct}%)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 mb-8 transition-all hover:shadow-md">
      {/* 1. Station Section Header */}
      <div className="mb-6 border-b-2 border-[#37AF9B]/20 pb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-[#0A594D] tracking-tight">
            {headingText}
          </h2>
          {stationSubtitle && (
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
              {stationSubtitle}
            </p>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-[#0A594D]/10 px-3 py-1 text-xs font-semibold text-[#0A594D]">
          Station {stationNumber} Pipeline
        </span>
      </div>

      {/* 2. KPI Summary Cards Grid */}
      <div
        className={
          kpiGridClassName ||
          (kpis.length === 3
            ? 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6')
        }
      >
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:border-[#37AF9B]/30 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  {kpi.label}
                </p>
                {Icon && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A594D]/10 text-[#0A594D]">
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {kpi.value}
              </p>
              {kpi.subtext && (
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {kpi.badgeTone === 'positive' && (
                    <span className="font-medium text-emerald-600">● {kpi.subtext}</span>
                  )}
                  {kpi.badgeTone === 'warning' && (
                    <span className="font-medium text-amber-600">▲ {kpi.subtext}</span>
                  )}
                  {kpi.badgeTone === 'alert' && (
                    <span className="font-medium text-rose-600">! {kpi.subtext}</span>
                  )}
                  {(!kpi.badgeTone || kpi.badgeTone === 'neutral') && (
                    <span className="text-slate-400">{kpi.subtext}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Charts Section Layout (Strict Single-Column Full-Width Stack) */}
      <div className="flex flex-col gap-8 w-full">
        {chartList.map((chart, index) => renderSingleChartCard(chart, index))}
        {children}
      </div>
    </section>
  );
}

StationReportSection.propTypes = {
  stationNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  stationName: PropTypes.string.isRequired,
  stationSubtitle: PropTypes.string,
  kpiGridClassName: PropTypes.string,
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      subtext: PropTypes.string,
      badgeTone: PropTypes.oneOf(['positive', 'warning', 'alert', 'neutral']),
      icon: PropTypes.elementType,
    })
  ),
  chartData1: PropTypes.object,
  chartData2: PropTypes.object,
  chartData3: PropTypes.object,
  chartData4: PropTypes.object,
  charts: PropTypes.array,
  stacked: PropTypes.bool,
  chart1Ref: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  chart2Ref: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  chart3Ref: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  chart4Ref: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  children: PropTypes.node,
};
