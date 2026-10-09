import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import StationReportSection from './StationReportSection';
import { station1Charts, station1Kpis } from './station1Health';
import { useHealthReport } from './useHealthReport';

const SECTION = {
  stationNumber: 1,
  stationName: 'Registration & Vitals',
  stationSubtitle:
    'Patient intake volume, triage vital signs, BMI classification, and cardiovascular staging',
};

// Employment status (Permanent / Contract of Service / Job Order / Casual)
// is not in the HR feed or the database, so there is nothing to count yet.
// Swap this card for a chart once iHRIS supplies the field.
function ClassificationPlaceholder() {
  return (
    <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-5">
      <h3 className="text-sm font-semibold text-slate-900">Patient Classification Breakdown</h3>
      <p className="mt-1 text-xs text-slate-500">
        Not tracked yet: employment status (Permanent, Contract of Service, Job Order, Casual) is
        not part of the HR records this system receives.
      </p>
    </div>
  );
}

/**
 * Station 1 on the Health Reports page, from GET /api/health-reports/station1.
 * chartRefs ({ byOffice, bmi, bp }) hand the chart cards to the PDF export;
 * exporting draws the charts at once, as the page's other stations do.
 */
export default function Station1HealthSection({ params, chartRefs = {}, exporting = false }) {
  const query = useHealthReport(1, params);

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
  if (report.patients === 0) {
    return (
      <StationReportSection {...SECTION}>
        <p className="py-10 text-center text-sm text-slate-500">No Station 1 visits in this period.</p>
      </StationReportSection>
    );
  }

  const charts = station1Charts(report, params.office);

  return (
    <StationReportSection
      {...SECTION}
      kpis={station1Kpis(report)}
      charts={[
        { ...charts.byOffice, ref: chartRefs.byOffice },
        { ...charts.bmi, ref: chartRefs.bmi },
        { ...charts.bp, ref: chartRefs.bp },
      ]}
      stacked
      exporting={exporting}
    >
      <ClassificationPlaceholder />
    </StationReportSection>
  );
}
