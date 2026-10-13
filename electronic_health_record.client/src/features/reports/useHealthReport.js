import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getHealthReport } from '../../api/reports.api';

/** One Health Reports section's data for the page's period/office filter. */
export function useHealthReport(station, params) {
  return useQuery({
    queryKey: ['health-report', station, params],
    queryFn: () => getHealthReport(station, params),
    // Keep the last figures on screen while the next filter loads.
    placeholderData: keepPreviousData,
  });
}
