import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import StationReportSection from './StationReportSection';
import { EmptyChartCard, LifestyleCard, RankedBarCard } from './Station3Cards';
import { station3Charts, station3Kpis } from './station3Health';
import { useHealthReport } from './useHealthReport';

const SECTION = {
  stationNumber: 3,
  stationName: 'Consultation',
  stationSubtitle:
    'Attending physician impressions, primary clinical morbidity, pharmacotherapy, and care plan outcomes',
};

/**
 * Station 3 on the Health Reports page, from GET /api/health-reports/station3.
 * chartRefs ({ conditions, maintenance, social, labs, medications }) hand the
 * chart cards to the PDF export; exporting draws the charts at once, as the
 * page's other stations do.
 */
export default function Station3HealthSection({ params, chartRefs = {}, exporting = false }) {
  const query = useHealthReport(3, params);

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
  if (report.consultations === 0) {
    return (
      <StationReportSection {...SECTION}>
        <p className="py-10 text-center text-sm text-slate-500">No Station 3 consultations in this period.</p>
      </StationReportSection>
    );
  }

  const { conditions: conditionsRef, maintenance: maintenanceRef, social: socialRef, labs: labsRef, medications: medicationsRef } =
    chartRefs;
  const charts = station3Charts(report);
  const lists = [
    { config: charts.conditions, ref: conditionsRef, empty: 'No conditions recorded in this period.' },
    { config: charts.maintenance, ref: maintenanceRef, empty: 'No maintenance drugs recorded in this period.' },
  ];

  return (
    <StationReportSection
      {...SECTION}
      kpis={station3Kpis(report)}
      kpiGridClassName="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      charts={lists.filter((l) => l.config.data.length).map((l) => ({ ...l.config, ref: l.ref }))}
      stacked
      exporting={exporting}
    >
      {lists
        .filter((l) => !l.config.data.length)
        .map((l) => (
          <EmptyChartCard key={l.config.title} ref={l.ref} title={l.config.title}>
            {l.empty}
          </EmptyChartCard>
        ))}

      <LifestyleCard
        ref={socialRef}
        smoking={charts.smoking}
        exercise={charts.exercise}
        exercisePatients={report.exercise.patients}
        patients={report.patients}
        alcohol={charts.alcohol}
        exporting={exporting}
      />

      <RankedBarCard
        ref={labsRef}
        title="Recommended Diagnostic & Laboratory Tests"
        subtitle="Top 10 laboratory and diagnostic tests by the consultations that ordered them"
        countLabel="Orders"
        data={charts.labs}
        emptyText="No labs ordered in this period."
        exporting={exporting}
      />

      <RankedBarCard
        ref={medicationsRef}
        title="Top Prescribed Medications (Inventory Demand)"
        subtitle="Top 10 medications by the consultations that prescribed them, for pharmacy inventory forecasting"
        countLabel="Prescriptions"
        data={charts.medications}
        emptyText="No medications prescribed in this period."
        exporting={exporting}
      />
    </StationReportSection>
  );
}
