import { stationById } from '../stationConfig';
import StationReportCard from './StationReportCard';
import { FlagList, RankedList } from './ReportLists';
import { minutes, pct, toRanked } from './format';
import { useStationReport } from './useStationReport';

/** Station 3: what the physicians ordered, who saw whom, and the risk factors found. */
export default function Station3Report({ params }) {
  const query = useStationReport(3, params);

  return (
    <StationReportCard
      station={stationById(3)}
      title="Physician Consultation"
      query={query}
      isEmpty={(d) => d.completed === 0}
      kpis={(d) => [
        { label: 'Consultations', value: d.completed },
        { label: 'Median time', value: minutes(d.medianMinutes) },
      ]}
      flags={(d) => {
        // Smoking and drinking are shares of the patients whose answer was
        // recorded, so a blank answer never counts as "no".
        const share = (count, of) => `${count} (${pct(count, of)})`;
        return (
          <FlagList
            items={[
              { label: 'Chronic condition', value: share(d.riskFactors.chronicCondition, d.patients), alert: false },
              { label: 'Smokers', value: share(d.riskFactors.smokers, d.answered.smokers), alert: false },
              { label: 'Drinkers', value: share(d.riskFactors.drinkers, d.answered.drinkers), alert: false },
            ]}
          />
        );
      }}
    >
      {(d) => (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <RankedList title="Top labs" items={toRanked(d.topLabs, 'count')} />
            <RankedList title="Top medications" items={toRanked(d.topMeds, 'count')} />
          </div>
          <RankedList title="By physician" items={toRanked(d.byPhysician, 'count')} />
        </div>
      )}
    </StationReportCard>
  );
}
