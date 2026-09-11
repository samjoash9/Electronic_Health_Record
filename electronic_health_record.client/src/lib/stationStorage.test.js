import { describe, it, expect, beforeEach } from 'vitest';
import { readStation, writeStation, clearStations, stationKeyFor } from './stationStorage';
import { ROLES } from './constants';

beforeEach(() => localStorage.clear());

describe('stationStorage', () => {
  it('round-trips a station per role', () => {
    writeStation(ROLES.ADMIN, 1);
    writeStation(ROLES.DOCTOR, 4);

    expect(readStation(ROLES.ADMIN)).toBe(1);
    expect(readStation(ROLES.DOCTOR)).toBe(4);
  });

  it('reports no station when none was chosen', () => {
    expect(readStation(ROLES.ADMIN)).toBeNull();
  });

  it('keeps each role on its own key', () => {
    writeStation(ROLES.ADMIN, 2);
    expect(localStorage.getItem(stationKeyFor(ROLES.ADMIN))).toBe('2');
    expect(localStorage.getItem(stationKeyFor(ROLES.DOCTOR))).toBeNull();
  });

  // The bug this guards: clearing only the session left the station behind, so
  // the picker appeared once per browser and every later login skipped it.
  it('forgets every role on clearStations', () => {
    writeStation(ROLES.ADMIN, 1);
    writeStation(ROLES.DOCTOR, 5);
    localStorage.setItem('ehr-station', '3');

    clearStations();

    expect(readStation(ROLES.ADMIN)).toBeNull();
    expect(readStation(ROLES.DOCTOR)).toBeNull();
    expect(localStorage.getItem('ehr-station')).toBeNull();
  });

  // A doctor's station is on their account, not the device, so there is no
  // doctor key to clear -- only the admin's choice is device state.
  it('clears the admin station but leaves an unrelated key alone', () => {
    writeStation(ROLES.ADMIN, 1);
    localStorage.setItem('unrelated', 'keep me');

    clearStations();

    expect(readStation(ROLES.ADMIN)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep me');
  });
});
