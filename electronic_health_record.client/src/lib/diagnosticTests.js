import { DIAGNOSTIC_TEST_CATALOG } from './constants';

const BY_NAME = new Map(DIAGNOSTIC_TEST_CATALOG.map((t) => [t.name, t]));

// A test stored under a name it has since been renamed from still resolves to
// its current entry, so an older form prices the right test.
const ALIASES = new Map(
  DIAGNOSTIC_TEST_CATALOG.filter((t) => t.was).map((t) => [t.was, t.name]),
);

export const canonical = (name) => ALIASES.get(name) ?? name;

export const catalogPrice = (name) => BY_NAME.get(canonical(name))?.price ?? null;

// An entry may carry a quoted amount in trailing parentheses -- "ECG (500)" --
// used for the tests the office has no fixed rate for and for typed-in ones.
// Catalog tests at their list price are stored bare, so a form saved before
// prices existed still reads back unchanged.
// Only a bare number counts as a price, so a typed name that happens to end in
// parentheses -- "CA 125 (blood)" -- stays part of the name.
const ENTRY = /^(.*?)\s*\((\d[\d,]*(?:\.\d+)?)\)$/;

/** One stored entry -> its name and the amount written beside it, if any. */
export function parseEntry(part) {
  const match = ENTRY.exec(part);
  if (!match) return { name: canonical(part), price: null };
  const price = Number(match[2].replace(/,/g, ''));
  return {
    name: canonical(match[1].trim()),
    price: Number.isFinite(price) ? price : null,
  };
}

/**
 * The stored "CBC, ECG (500)" string -> one row per test, each with the amount
 * it should be billed at.
 *
 * A quoted amount wins over the catalog's: it is what the physician actually
 * committed to for this patient, and the tests that carry one are precisely
 * those with no fixed office rate. `price` is null for a test that has neither,
 * which is a genuine "not priced yet" rather than a zero.
 */
export function parseDiagnosticTests(value) {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const { name, price } = parseEntry(part);
      return { name, price: price ?? catalogPrice(name) };
    });
}

/**
 * Total billable amount for a stored diagnostic-test string.
 *
 * Returns the sum and how many rows carried no price, so a caller can show the
 * total without implying it covers tests that are still unpriced.
 */
export function diagnosticTestsTotal(value) {
  const rows = parseDiagnosticTests(value);
  const priced = rows.filter((row) => row.price != null);

  return {
    total: priced.reduce((sum, row) => sum + row.price, 0),
    pricedCount: priced.length,
    unpricedCount: rows.length - priced.length,
  };
}
