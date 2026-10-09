import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import StationReportSection from './StationReportSection';
import { station2Charts, station2Kpis } from './station2Health';
import { useHealthReport } from './useHealthReport';

const SECTION = {
  stationNumber: 2,
  stationName: 'Wellness Assessment',
  stationSubtitle: 'Holistic screening across the 7 core dimensions of employee and community wellness',
};

/**
 * Station 2 on the Health Reports page, from GET /api/health-reports/station2.
 * chartRefs ({ scores, atRisk }) hand the chart cards to the PDF export;
 * exporting draws the charts at once, as the page's other stations do.
 */
export default function Station2HealthSection({ params, chartRefs = {}, exporting = false }) {
  const query = useHealthReport(2, params);

  if (query.isPending) {
    return (
      <StationReportSection {...SECTION}>
        <Skeleton rows={6} />
      </StationReportSection>
    );
  }

  if (query.isError) {
    return (
      <StationReportSection {...SECTION}>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </StationReportSection>
    );
  }

  const report = query.data;
  if (report.assessments === 0) {
    return (
      <StationReportSection {...SECTION}>
        <p className="py-10 text-center text-sm text-slate-500">No Station 2 assessments in this period.</p>
      </StationReportSection>
    );
  }

  const charts = station2Charts(report);

  return (
    <StationReportSection
      {...SECTION}
      kpis={station2Kpis(report)}
      kpiGridClassName="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      charts={[
        { ...charts.scores, ref: chartRefs.scores },
        { ...charts.atRisk, ref: chartRefs.atRisk },
      ]}
      stacked
      exporting={exporting}
    />
  );
}
