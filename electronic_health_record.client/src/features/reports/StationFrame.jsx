// The numbered frame and KPI cards Stations 4 and 5 are drawn in, moved from
// HealthReports.jsx when those stations went live. (Stations 1-3 use
// StationReportSection's own frame.)

/** A station's card: numbered header banner, then its content. */
export function StationFrame({ number, title, subtitle, children }) {
  return (
    <section className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8 mb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A594D] text-xs font-bold text-white shadow-2xs">
              {number}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 pl-10 max-w-2xl">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

/** The KPI cards, four to a row on wide screens, each with its subtext under the value. */
export function FrameKpis({ kpis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{kpi.label}</p>
              {Icon && (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A594D]/10 text-[#0A594D]">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{kpi.value}</p>
            {kpi.subtext && <p className="mt-1 text-xs text-slate-500">{kpi.subtext}</p>}
          </div>
        );
      })}
    </div>
  );
}
