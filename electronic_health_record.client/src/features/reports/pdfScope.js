// The stations whose sections are live data under the page's filter; the
// rest are still sample figures.
const LIVE_STATIONS = [1, 2, 3];

function liveName(live) {
  if (live.length === LIVE_STATIONS.length) return 'Stations 1–3';
  return live.length === 1 ? `Station ${live[0]}` : `Stations ${live.join(', ')}`;
}

/**
 * The Health Reports PDF's scope line. The live stations are named with the
 * page's period/office filter (liveScope, e.g. "All offices · October
 * 2026"); Stations 4-5 are still sample figures, and the line says so
 * whenever either is in the report.
 */
export function pdfScopeText({ selectedStations, liveScope, generated }) {
  const stations =
    selectedStations.length === 5 ? 'Stations 1–5' : `Station(s): ${selectedStations.join(', ')}`;
  const live = LIVE_STATIONS.filter((s) => selectedStations.includes(s));

  return [
    'Official Clinical Surveillance Report',
    stations,
    ...(live.length ? [`${liveName(live)}: ${liveScope}`] : []),
    ...(selectedStations.some((s) => !LIVE_STATIONS.includes(s)) ? ['Stations 4–5: sample figures'] : []),
    `Generated: ${generated}`,
  ].join('  |  ');
}
