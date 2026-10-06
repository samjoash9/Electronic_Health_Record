import { client, toApiError } from './client';

/**
 * One station's dashboard report (station 1-6) for { from, to, office? }:
 * from and to are inclusive yyyy-MM-dd FormDate bounds, office omitted for
 * every office. Shapes are in the station reports design spec. No USE_MOCK
 * branch, same as getOnboardedStats.
 */
export async function getStationReport(station, params) {
  try {
    const { data } = await client.get(`/reports/station${station}`, { params });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}
