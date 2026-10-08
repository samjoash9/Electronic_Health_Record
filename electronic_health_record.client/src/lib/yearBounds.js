/**
 * The years a "year started" / "year diagnosed" answer may fall in: no earlier
 * than the patient was born and no later than the visit. The server checks the
 * same rule (WellnessFormsController), so the two must change together.
 */

const FLOOR = 1900;

/**
 * `birthdate` is the API's ISO string; its year is read off the text so no
 * timezone can shift it. A missing or placeholder birthdate (HR sync stores
 * DateTime.MinValue for an unknown one) falls back to 1900 rather than
 * rejecting every year.
 */
export function yearBounds(birthdate, asOf) {
  const birthYear = Number(String(birthdate ?? '').slice(0, 4));
  const usable = Number.isInteger(birthYear) && birthYear >= FLOOR && birthYear <= asOf;
  return { min: usable ? birthYear : FLOOR, max: asOf, fromBirthdate: usable };
}

/** An error message for a typed year, or undefined when it is blank or in bounds. */
export function validateYear(value, { min, max, fromBirthdate }) {
  const text = String(value ?? '').trim();
  if (text === '') return undefined;
  if (!/^\d{4}$/.test(text)) return 'Enter a 4-digit year.';

  const year = Number(text);
  if (year < min) {
    return fromBirthdate ? `Before the patient's birth year (${min}).` : `Can't be before ${min}.`;
  }
  if (year > max) return `Can't be after ${max}.`;
  return undefined;
}
