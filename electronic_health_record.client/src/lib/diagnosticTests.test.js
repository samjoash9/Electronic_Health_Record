import { describe, it, expect } from 'vitest';
import { parseDiagnosticTests, diagnosticTestsTotal, catalogPrice } from './diagnosticTests';

describe('parseDiagnosticTests', () => {
  it('prices catalog tests stored bare', () => {
    expect(parseDiagnosticTests('CBC, FBS')).toEqual([
      { name: 'CBC', price: 180 },
      { name: 'FBS', price: 120 },
    ]);
  });

  it('reads a quoted amount for a test with no fixed rate', () => {
    expect(parseDiagnosticTests('ECG (500)')).toEqual([{ name: 'ECG', price: 500 }]);
  });

  it('lets a quoted amount override the catalog rate', () => {
    expect(parseDiagnosticTests('CBC (200)')).toEqual([{ name: 'CBC', price: 200 }]);
  });

  it('keeps a catalog test unpriced when it has no rate and none was quoted', () => {
    expect(parseDiagnosticTests('TSH')).toEqual([{ name: 'TSH', price: null }]);
  });

  it('resolves a renamed test through its alias', () => {
    expect(parseDiagnosticTests('Liquid Profile')).toEqual([
      { name: 'Lipid Profile', price: 900 },
    ]);
  });

  it('treats trailing non-numeric parentheses as part of the name', () => {
    expect(parseDiagnosticTests('CA 125 (blood)')).toEqual([
      { name: 'CA 125 (blood)', price: null },
    ]);
  });

  it('reads a four-figure amount written without a separator', () => {
    expect(parseDiagnosticTests('UTZ (1250)')).toEqual([{ name: 'UTZ', price: 1250 }]);
  });

  // The stored format is comma-joined, so the comma splits the entry before
  // any amount is parsed. The picker writes amounts unseparated, so this only
  // bites a hand-edited string -- recorded here so the split is a known limit
  // of the format rather than a surprise.
  it('cannot read an amount containing a thousands separator', () => {
    const rows = parseDiagnosticTests('UTZ (1,250)');
    expect(rows).toHaveLength(2);
    expect(rows[0].price).toBeNull();
  });

  it('ignores empty segments and surrounding whitespace', () => {
    expect(parseDiagnosticTests('  CBC ,, FBS  ')).toHaveLength(2);
  });

  it('returns nothing for empty or absent input', () => {
    expect(parseDiagnosticTests('')).toEqual([]);
    expect(parseDiagnosticTests(null)).toEqual([]);
    expect(parseDiagnosticTests(undefined)).toEqual([]);
  });
});

describe('diagnosticTestsTotal', () => {
  it('sums the screenshot case', () => {
    // ASO 180 + NaK 800 + TT4 650 + H. Pylori 450
    expect(diagnosticTestsTotal('ASO, NaK, TT4, H. Pylori')).toEqual({
      total: 2080,
      pricedCount: 4,
      unpricedCount: 0,
    });
  });

  it('counts unpriced tests separately rather than treating them as zero', () => {
    expect(diagnosticTestsTotal('CBC, TSH')).toEqual({
      total: 180,
      pricedCount: 1,
      unpricedCount: 1,
    });
  });

  it('adds quoted amounts to catalog ones', () => {
    expect(diagnosticTestsTotal('CBC, ECG (500)').total).toBe(680);
  });

  it('is zero with nothing priced for an empty string', () => {
    expect(diagnosticTestsTotal('')).toEqual({
      total: 0,
      pricedCount: 0,
      unpricedCount: 0,
    });
  });
});

describe('catalogPrice', () => {
  it('returns null for a test the office has no fixed rate for', () => {
    expect(catalogPrice('ECG')).toBeNull();
  });

  it('returns null for a name that is not in the catalog', () => {
    expect(catalogPrice('Not A Real Test')).toBeNull();
  });
});
