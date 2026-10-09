// The stations whose sections are live data under the page's filter; the
// rest are still sample figures.
const LIVE_STATIONS = [1, 2];

/**
 * The Health Reports PDF's scope line. The live stations are named with the
 * page's period/office filter (liveScope, e.g. "All offices · October
 * 2026"); Stations 3-5 are still sample figures, and the line says so
 * whenever any of them is in the report.
 */
export function pdfScopeText({ selectedStations, liveScope, generated }) {
  const stations =
    selectedStations.length === 5 ? 'Stations 1–5' : `Station(s): ${selectedStations.join(', ')}`;
  const live = LIVE_STATIONS.filter((s) => selectedStations.includes(s));
  const liveName = live.length === LIVE_STATIONS.length ? 'Stations 1–2' : `Station ${live[0]}`;

  return [
    'Official Clinical Surveillance Report',
    stations,
    ...(live.length ? [`${liveName}: ${liveScope}`] : []),
    ...(selectedStations.some((s) => !LIVE_STATIONS.includes(s)) ? ['Stations 3–5: sample figures'] : []),
    `Generated: ${generated}`,
  ].join('  |  ');
}
