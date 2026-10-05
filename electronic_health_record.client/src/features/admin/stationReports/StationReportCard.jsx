import ErrorState from '../../../components/ui/ErrorState';
import Skeleton from '../../../components/ui/Skeleton';

/**
 * Shell shared by the six station report cards: station-coloured top edge,
 * title, KPI strip, body, flags line. Loading, error and empty states live
 * here so every card handles them the same way.
 *
 * kpis, caption, flags and children are functions of the loaded report,
 * called only once there is something to show.
 */
export default function StationReportCard({
  station, title, query, isEmpty, emptyText = 'No visits in this period.',
  kpis, caption, flags, footer, children,
}) {
  const { data, isLoading, error, refetch } = query;

  let body;
  if (isLoading) {
    body = <Skeleton rows={4} />;
  } else if (error) {
    body = <ErrorState error={error} onRetry={() => refetch()} />;
  } else if (!data || isEmpty(data)) {
    body = <p className="py-10 text-center text-sm text-ink-500">{emptyText}</p>;
  } else {
    body = (
      <>
        {caption && <p className="-mt-2 text-xs text-ink-500">{caption(data)}</p>}
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          {kpis(data).map((kpi) => (
            <div key={kpi.label}>
              <dt className="text-xs text-ink-500">{kpi.label}</dt>
              <dd className="text-xl font-bold tracking-tight text-ink-900 tabular-nums">{kpi.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex-1">{children(data)}</div>
        {flags && <div className="border-t border-line pt-3">{flags(data)}</div>}
        {footer}
      </>
    );
  }

  return (
    <section
      aria-label={`${station.name} report`}
      className="flex flex-col gap-4 rounded-2xl border border-t-4 border-[#eef0f4] bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      style={{ borderTopColor: station.hex }}
    >
      <h3 className="text-sm font-semibold tracking-wide text-ink-900">
        {station.name} · {title}
      </h3>
      {body}
    </section>
  );
}
