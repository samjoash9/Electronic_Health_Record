// Kiosk text-size (zoom) preference.
//
// A property of the tablet, not of a patient or a form: a clinic device
// parked in a room with poor lighting -- or serving mostly older patients
// -- should stay enlarged across handoffs rather than snapping back to the
// default for every new assessment. Stored like the station choice in
// stationStorage.js (bare localStorage, no React imports) rather than in
// station2Draft.js, which is per-form and cleared on reset.

const KEY = 'ehr:kiosk-text-size';

/** Scale factors the stepper walks through, smallest to largest. */
export const ZOOM_LEVELS = [1, 1.15, 1.3, 1.5, 1.75];

/** Index into ZOOM_LEVELS used when nothing is stored. */
export const DEFAULT_ZOOM_INDEX = 0;

function clampIndex(index) {
  if (!Number.isInteger(index)) return DEFAULT_ZOOM_INDEX;
  return Math.min(Math.max(index, 0), ZOOM_LEVELS.length - 1);
}

/**
 * Read this device's stored text size.
 * @returns {number} an index into ZOOM_LEVELS, always in range.
 */
export function readZoomIndex() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return DEFAULT_ZOOM_INDEX;
    // Clamped rather than rejected: a value left by a build with more
    // levels should land on the largest one, not silently reset to normal.
    return clampIndex(Number(raw));
  } catch {
    // Storage disabled; the preference is a convenience, not a requirement.
    return DEFAULT_ZOOM_INDEX;
  }
}

export function writeZoomIndex(index) {
  try {
    localStorage.setItem(KEY, String(clampIndex(index)));
  } catch {
    // Nothing to recover from -- the size still applies for this session.
  }
}
