import { SERIES, STATUS } from '../../reports/reportTheme';
import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import SegmentBar from './SegmentBar';
import { FlagList, PrevalenceList } from './ReportLists';
import { minutes, pct, toSegments } from './format';
import { useStationReport } from './useStationReport';

// "Refractive error" takes the categorical blue (SERIES slot 1): it is a
// kind of finding, not a severity.
const CONDITIONS = [
  { key: 'none', label: 'None', color: STATUS.good },
  { key: 'refractiveError', label: 'Refractive error', color: SERIES.overweight },
  { key: 'other', label: 'Other', color: STATUS.serious },
];

/** Station 5: vision symptoms, conditions found, and what was advised. */
export default function Station5Report({ params }) {
  const query = useStationReport(5, params);
  const station = stationById(5);

  return (
    <StationReportCard
      station={station}
      title="Vision"
      query={query}
      isEmpty={(d) => d.completed === 0 && d.patients === 0}
      kpis={(d) => [
        { label: 'Screenings', value: d.completed },
        { label: 'Median time', value: minutes(d.medianMinutes) },
      ]}
      flags={(d) => (
        <FlagList
          items={[
            { label: 'Lenses recommended', value: d.outcomes.lensesRecommended, alert: false },
            { label: 'Specialist referral', value: d.outcomes.specialistReferral, alert: d.outcomes.specialistReferral > 0 },
            { label: 'Follow-up advised', value: d.outcomes.followUp, alert: false },
          ]}
        />
      )}
    >
      {(d) => (
        <div className="flex flex-col gap-4">
          <PrevalenceList
            title="Symptoms"
            total={d.patients}
            color={station.hex}
            items={[
              { key: 'blurred', label: 'Blurred vision', count: d.symptoms.blurred },
              { key: 'near', label: 'Trouble seeing near', count: d.symptoms.near },
              { key: 'distant', label: 'Trouble seeing far', count: d.symptoms.distant },
              { key: 'eyeStrain', label: 'Headache / eye strain', count: d.symptoms.eyeStrain },
              { key: 'eyePain', label: 'Eye pain', count: d.symptoms.eyePain },
            ]}
          />
          <SegmentBar label="Eye condition" segments={toSegments(CONDITIONS, d.conditions)} />
          <p className="text-xs text-ink-600">
            Already wears glasses or contacts:{' '}
            <span className="font-semibold text-ink-900 tabular-nums">
              {`${d.usesCorrection} (${pct(d.usesCorrection, d.patients)})`}
            </span>
          </p>
        </div>
      )}
    </StationReportCard>
  );
}
