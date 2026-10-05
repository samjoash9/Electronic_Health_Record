import { STATUS } from '../../reports/reportTheme';
import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import SegmentBar from './SegmentBar';
import { FlagList, PrevalenceList } from './ReportLists';
import { minutes, toSegments } from './format';
import { useStationReport } from './useStationReport';

const HYGIENE = [
  { key: 'good', label: 'Good', color: STATUS.good },
  { key: 'fair', label: 'Fair', color: STATUS.warning },
  { key: 'poor', label: 'Poor', color: STATUS.critical },
];

/** Station 4: the dental screening's findings and referrals. */
export default function Station4Report({ params }) {
  const query = useStationReport(4, params);
  const station = stationById(4);

  return (
    <StationReportCard
      station={station}
      title="Dental"
      query={query}
      isEmpty={(d) => d.completed === 0 && d.patients === 0}
      kpis={(d) => [
        { label: 'Screenings', value: d.completed },
        { label: 'Median time', value: minutes(d.medianMinutes) },
      ]}
      flags={(d) => (
        <FlagList
          items={[
            { label: 'Routine referral', value: d.referrals.routine, alert: false },
            { label: 'Urgent referral', value: d.referrals.urgent, alert: d.referrals.urgent > 0 },
          ]}
        />
      )}
    >
      {(d) => (
        <div className="flex flex-col gap-4">
          <SegmentBar label="Oral hygiene" segments={toSegments(HYGIENE, d.hygiene)} />
          <PrevalenceList
            title="Findings"
            total={d.patients}
            color={station.hex}
            items={[
              { key: 'caries', label: 'Dental caries', count: d.findings.caries },
              { key: 'gum', label: 'Gum problem', count: d.findings.gumProblem },
              { key: 'tooth', label: 'Missing / needs treatment', count: d.findings.toothProblem },
              { key: 'lesions', label: 'Oral lesions', count: d.findings.oralLesions },
            ]}
          />
        </div>
      )}
    </StationReportCard>
  );
}
