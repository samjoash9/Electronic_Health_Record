/**
 * The Health Reports PDF's scope line. Station 1 is live data under the
 * page's period/office filter (station1Scope, e.g. "All offices · October
 * 2026"); Stations 2-5 are still sample figures, and the line says so
 * whenever any of them is in the report.
 */
export function pdfScopeText({ selectedStations, station1Scope, generated }) {
  const stations =
    selectedStations.length === 5 ? 'Stations 1–5' : `Station(s): ${selectedStations.join(', ')}`;

  return [
    'Official Clinical Surveillance Report',
    stations,
    ...(selectedStations.includes(1) ? [`Station 1: ${station1Scope}`] : []),
    ...(selectedStations.some((s) => s > 1) ? ['Stations 2–5: sample figures'] : []),
    `Generated: ${generated}`,
  ].join('  |  ');
}
