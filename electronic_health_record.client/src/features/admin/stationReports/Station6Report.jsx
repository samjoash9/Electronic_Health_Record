import { formatDate, peso } from '../../../lib/formatters';
import { SERIES, STATUS } from '../../reports/reportTheme';
import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import SegmentBar from './SegmentBar';
import { FlagList, RankedList } from './ReportLists';
import { toRanked } from './format';
import { useStationReport } from './useStationReport';

// Past this share of capital the period is flagged before it runs out.
const BUDGET_WARN_PERCENT = 80;

/**
 * Station 6: the billing period covering the end of the filter range.
 * Capital is pooled across offices, so the office filter does not apply.
 */
export default function Station6Report({ params }) {
  const query = useStationReport(6, params);
  const station = stationById(6);

  return (
    <StationReportCard
      station={station}
      title="Billing"
      query={query}
      isEmpty={(d) => d.period == null}
      emptyText="No billing period covers this date."
      caption={(d) =>
        `${d.period.title} · ${formatDate(d.period.startDate)} – ${formatDate(d.period.endDate)} · All offices`
      }
      kpis={(d) => [
        { label: 'Capital', value: peso(d.period.capital) },
        { label: 'Consumed', value: peso(d.period.consumed) },
        { label: 'Remaining', value: peso(d.period.remaining) },
      ]}
      flags={(d) => {
        const { percentUsed, remaining } = d.period;
        return (
          <FlagList
            items={[
              { label: 'Budget used', value: `${percentUsed}%`, alert: percentUsed >= BUDGET_WARN_PERCENT },
              ...(remaining < 0 ? [{ label: 'Over budget by', value: peso(-remaining), alert: true }] : []),
              { label: 'Unpriced charges', value: d.unpricedCount, alert: d.unpricedCount > 0 },
            ]}
          />
        );
      }}
    >
      {(d) => (
        <div className="flex flex-col gap-4">
          <SegmentBar
            label="Budget"
            format={peso}
            segments={[
              {
                key: 'used',
                label: 'Consumed',
                value: d.period.consumed,
                color: d.period.percentUsed >= BUDGET_WARN_PERCENT ? STATUS.critical : station.hex,
              },
              { key: 'left', label: 'Remaining', value: Math.max(d.period.remaining, 0), color: '#e2e8f0' },
            ]}
          />
          <SegmentBar
            label="Lab vs medication"
            format={peso}
            segments={[
              { key: 'lab', label: 'Lab', value: d.byType.lab, color: SERIES.overweight },
              { key: 'medication', label: 'Medication', value: d.byType.medication, color: SERIES.highBp },
            ]}
          />
          <RankedList title="Top items" format={peso} items={toRanked(d.topItems, 'amount')} />
        </div>
      )}
    </StationReportCard>
  );
}
