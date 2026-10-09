import ReportFilterBar from '../ReportFilterBar';
import { useReportFilter } from '../useReportFilter';
import Station1Report from './Station1Report';
import Station2Report from './Station2Report';
import Station3Report from './Station3Report';
import Station4Report from './Station4Report';
import Station5Report from './Station5Report';
import Station6Report from './Station6Report';

/**
 * The dashboard's six station report cards under one period + office
 * filter. Each card fetches its own report, so one slow or failing station
 * never blanks the others.
 */
export default function StationReportsSection() {
  const filter = useReportFilter();
  const { params } = filter;

  return (
    <section aria-label="Station reports" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink-900">Station Reports</h2>
        <ReportFilterBar filter={filter} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Station1Report params={params} />
        <Station2Report params={params} />
        <Station3Report params={params} />
        <Station4Report params={params} />
        <Station5Report params={params} />
        <Station6Report params={params} />
      </div>
    </section>
  );
}
