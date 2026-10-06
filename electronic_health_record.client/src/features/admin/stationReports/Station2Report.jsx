import { STATUS } from '../../reports/reportTheme';
import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import SegmentBar from './SegmentBar';
import { FlagList } from './ReportLists';
import { minutes, toSegments } from './format';
import { useStationReport } from './useStationReport';

// Best to worst, worded as the kiosk's results screen words them
// (i18n/resultsTranslations.js). "Good" sits between the status palette's
// good and warning so the five read as one ordered scale.
const BANDS = [
  { key: 'excellent', label: 'Excellent', color: STATUS.good },
  { key: 'good', label: 'Good', color: '#7bc96f' },
  { key: 'fair', label: 'Fair', color: STATUS.warning },
  { key: 'attention', label: 'Needs attention', color: STATUS.serious },
  { key: 'support', label: 'Needs support', color: STATUS.critical },
];

/** Station 2: how patients scored themselves on the wellness kiosk. */
export default function Station2Report({ params }) {
  const query = useStationReport(2, params);

  return (
    <StationReportCard
      station={stationById(2)}
      title="Wellness Self-Assessment"
      query={query}
      isEmpty={(d) => d.completed === 0 && d.patients === 0}
      kpis={(d) => [
        { label: 'Assessments', value: d.completed },
        { label: 'Median time', value: minutes(d.medianMinutes) },
      ]}
      flags={(d) => (
        <FlagList
          items={[
            {
              label: 'Focus area',
              value: d.focusArea ? `${d.focusArea.category} (${d.focusArea.percent}%)` : '—',
              alert: false,
            },
          ]}
        />
      )}
    >
      {(d) => <SegmentBar label="Overall wellness" segments={toSegments(BANDS, d.bands)} />}
    </StationReportCard>
  );
}
