import { ROLES } from './constants';

const KEY_PREFIX = 'ehr-station';

/**
 * Which station a device is serving. Admins only: stations 1-2 are a property
 * of the tablet (the registration desk vs. the kiosk), so the choice belongs to
 * the device. A doctor's desk is a property of their account -- assigned by an
 * admin at onboarding and delivered in the session -- so it is never stored
 * here.
 *
 * Kept keyed by role rather than flattened to one key: an admin and a doctor
 * can share a device, and the namespacing already shipped.
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
 * Forgets the device's station choice. Called on sign-out so the next admin at
 * this device is asked which desk they are working rather than inheriting the
 * last user's; without it the picker is only ever seen once per browser.
 */
export function clearStations() {
  // The bare prefix is the pre-namespacing key, cleared too so a browser that
  // used an older build doesn't keep a stale choice forever. The doctor key is
  // cleared for the same reason: builds before admin-assigned stations wrote
  // one, and a leftover value would otherwise sit in storage forever.
  localStorage.removeItem(KEY_PREFIX);
  [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT].forEach((role) => {
    localStorage.removeItem(stationKeyFor(role));
  });
}
