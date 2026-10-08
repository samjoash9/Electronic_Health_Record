import { describe, it, expect } from 'vitest';
import { yearBounds, validateYear } from './yearBounds';

describe('yearBounds', () => {
  it('runs from the birth year to the visit year', () => {
    expect(yearBounds('1979-02-08', 2026)).toEqual({ min: 1979, max: 2026, fromBirthdate: true });
  });

  it('reads the year straight off an ISO timestamp, so no timezone can shift it', () => {
    expect(yearBounds('1980-01-01T00:00:00', 2026).min).toBe(1980);
  });

  it('falls back to 1900 when the birthdate is missing or a placeholder', () => {
    expect(yearBounds(null, 2026)).toEqual({ min: 1900, max: 2026, fromBirthdate: false });
    expect(yearBounds('', 2026).min).toBe(1900);
    // HR sync stores DateTime.MinValue for an unknown birthdate.
    expect(yearBounds('0001-01-01T00:00:00', 2026).min).toBe(1900);
    expect(yearBounds('not a date', 2026).min).toBe(1900);
  });

  it('ignores a birthdate after the visit year rather than allowing no year at all', () => {
    expect(yearBounds('2030-05-01', 2026).min).toBe(1900);
  });
});

describe('validateYear', () => {
  const bounds = yearBounds('1979-02-08', 2026);

  it('allows a blank value, since every year field is optional', () => {
    expect(validateYear('', bounds)).toBeUndefined();
    expect(validateYear('   ', bounds)).toBeUndefined();
    expect(validateYear(null, bounds)).toBeUndefined();
    expect(validateYear(undefined, bounds)).toBeUndefined();
  });

  it('allows any year from the birth year to the visit year, both included', () => {
    expect(validateYear('1979', bounds)).toBeUndefined();
    expect(validateYear('2000', bounds)).toBeUndefined();
    expect(validateYear('2026', bounds)).toBeUndefined();
    expect(validateYear(2010, bounds)).toBeUndefined();
  });

  it('rejects anything that is not a 4-digit year', () => {
    expect(validateYear('99', bounds)).toBe('Enter a 4-digit year.');
    expect(validateYear('20a5', bounds)).toBe('Enter a 4-digit year.');
    expect(validateYear('2015.5', bounds)).toBe('Enter a 4-digit year.');
  });

  it("rejects a year before the patient's birth year, naming it", () => {
    expect(validateYear('1978', bounds)).toBe("Before the patient's birth year (1979).");
  });

  it('rejects a year after the visit year', () => {
    expect(validateYear('2027', bounds)).toBe("Can't be after 2026.");
  });

  it('names the 1900 floor rather than a birth year when the birthdate is unknown', () => {
    expect(validateYear('1899', yearBounds(null, 2026))).toBe("Can't be before 1900.");
  });

  it('accepts a padded year typed with stray spaces', () => {
    expect(validateYear(' 2015 ', bounds)).toBeUndefined();
  });
});
