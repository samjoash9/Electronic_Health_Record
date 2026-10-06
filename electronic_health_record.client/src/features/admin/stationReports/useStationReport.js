import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getStationReport } from '../../../api/reports.api';

/** One station's report for the dashboard's shared period/office filter. */
export function useStationReport(station, params) {
  return useQuery({
    queryKey: ['station-report', station, params],
    queryFn: () => getStationReport(station, params),
    // Keep the last report on screen while the next filter loads, instead
    // of collapsing the card to a skeleton on every change.
    placeholderData: keepPreviousData,
  });
}
