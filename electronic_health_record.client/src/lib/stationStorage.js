import { ROLES } from './constants';

const KEY_PREFIX = 'ehr-station';

/**
 * Which station a device is serving, kept per role. Admins work stations 1-2
 * and doctors 3-5, but both can sign in on the same shared device -- on one
 * key the admin's choice would send the doctor to a station they aren't
 * allowed to open, and vice versa.
 *
 * Plain storage access with no React imports, so services (authService) and
 * hooks (useStationChoice) can both use it without an import cycle.
 */
export function stationKeyFor(role) {
  return role ? `${KEY_PREFIX}:${role}` : KEY_PREFIX;
}

export function readStation(role) {
  const raw = localStorage.getItem(stationKeyFor(role));
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export function writeStation(role, value) {
  localStorage.setItem(stationKeyFor(role), String(value));
}

/**
 * Forgets every role's station choice. Called on sign-out so the next person
 * at this device is asked which desk they are working rather than inheriting
 * the last user's; without it the picker is only ever seen once per browser.
 */
export function clearStations() {
  // The bare prefix is the pre-namespacing key, cleared too so a browser that
  // used an older build doesn't keep a stale choice forever.
  localStorage.removeItem(KEY_PREFIX);
  [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT].forEach((role) => {
    localStorage.removeItem(stationKeyFor(role));
  });
}
