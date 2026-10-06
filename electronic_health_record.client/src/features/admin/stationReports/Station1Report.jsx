import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BMI_CLASSES, BP_CLASS_LIST } from '../../reports/reportTheme';
import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import SegmentBar from './SegmentBar';
import { FlagList } from './ReportLists';
import { toSegments } from './format';
import { useStationReport } from './useStationReport';

/** Station 1: who came in, and how their intake vitals classed. */
export default function Station1Report({ params }) {
  const query = useStationReport(1, params);

  return (
    <StationReportCard
      station={stationById(1)}
      title="Intake & Vitals"
      query={query}
      isEmpty={(d) => d.completed === 0}
      kpis={(d) => [
        { label: 'Visits', value: d.completed },
        { label: 'Patients', value: d.patients },
      ]}
      flags={(d) => (
        <FlagList
          items={[
            { label: 'Fever', value: d.flags.fever, alert: d.flags.fever > 0 },
            { label: 'Fast heart rate', value: d.flags.tachycardia, alert: d.flags.tachycardia > 0 },
            { label: 'Slow heart rate', value: d.flags.bradycardia, alert: d.flags.bradycardia > 0 },
            { label: 'Fast breathing', value: d.flags.tachypnea, alert: d.flags.tachypnea > 0 },
          ]}
        />
      )}
      footer={
        <Link
          to="/health-reports"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-brand-600"
        >
          Full health report
          <ArrowRight size={13} />
        </Link>
      }
    >
      {(d) => (
        <div className="flex flex-col gap-4">
          <SegmentBar label="BMI" segments={toSegments(BMI_CLASSES, d.bmi)} />
          <SegmentBar label="Blood pressure" segments={toSegments(BP_CLASS_LIST, d.bp)} />
        </div>
      )}
    </StationReportCard>
  );
}
