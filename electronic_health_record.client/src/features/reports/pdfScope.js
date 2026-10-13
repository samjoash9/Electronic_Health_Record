/**
 * The Health Reports PDF's scope line: the stations exported and the page's
 * period/office filter every figure is under (scope, e.g. "All offices ·
 * October 2026").
 */
export function pdfScopeText({ selectedStations, scope, generated }) {
  const stations =
    selectedStations.length === 5 ? 'Stations 1–5' : `Station(s): ${selectedStations.join(', ')}`;

  return ['Official Clinical Surveillance Report', stations, `Scope: ${scope}`, `Generated: ${generated}`].join(
    '  |  '
  );
}
