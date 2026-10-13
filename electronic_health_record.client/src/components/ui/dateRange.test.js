import { describe, it, expect } from 'vitest';
import {
  presetRange,
  monthGrid,
  normalizeRange,
  dayCount,
  addMonths,
  formatRange,
} from './dateRange';

describe('presetRange', () => {
  it.each([
    ['today', '2026-10-09', '2026-10-09'],
    ['yesterday', '2026-10-08', '2026-10-08'],
    ['last7', '2026-10-03', '2026-10-09'],
    ['last30', '2026-09-10', '2026-10-09'],
    ['thisMonth', '2026-10-01', '2026-10-09'],
    ['lastMonth', '2026-09-01', '2026-09-30'],
  ])('%s ends where it should for 2026-10-09', (key, from, to) => {
    expect(presetRange(key, '2026-10-09')).toEqual({ from, to });
  });

  it('steps back across a month boundary for yesterday', () => {
    expect(presetRange('yesterday', '2026-03-01')).toEqual({ from: '2026-02-28', to: '2026-02-28' });
  });

  it('ends last month on its real last day', () => {
    expect(presetRange('lastMonth', '2028-03-15')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('reaches into the previous year for last month in January', () => {
    expect(presetRange('lastMonth', '2026-01-05')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });
});

describe('monthGrid', () => {
  it('fills six Sunday-first weeks around the month', () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-09-27');
    expect(grid[4]).toBe('2026-10-01');
    expect(grid[41]).toBe('2026-11-07');
  });

  it('starts on the 1st when the month opens on a Sunday', () => {
    expect(monthGrid(2026, 2)[0]).toBe('2026-02-01');
  });
});

describe('normalizeRange', () => {
  it('puts the earlier date first', () => {
    expect(normalizeRange('2026-10-09', '2026-10-03')).toEqual({ from: '2026-10-03', to: '2026-10-09' });
  });

  it('keeps an already ordered pair', () => {
    expect(normalizeRange('2026-10-03', '2026-10-09')).toEqual({ from: '2026-10-03', to: '2026-10-09' });
  });
});

describe('dayCount', () => {
  it.each([
    ['2026-10-03', '2026-10-09', 7],
    ['2026-10-09', '2026-10-09', 1],
    ['2026-09-30', '2026-10-01', 2],
    ['2025-12-31', '2026-01-01', 2],
  ])('counts %s to %s inclusive as %i', (from, to, want) => {
    expect(dayCount(from, to)).toBe(want);
  });
});

describe('addMonths', () => {
  it.each([
    [{ year: 2026, month: 10 }, 1, { year: 2026, month: 11 }],
    [{ year: 2026, month: 12 }, 1, { year: 2027, month: 1 }],
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
  ])('moves %o by %i', (view, delta, want) => {
    expect(addMonths(view, delta)).toEqual(want);
  });
});

describe('formatRange', () => {
  it('writes both ends as mm/dd/yyyy', () => {
    expect(formatRange('2026-10-03', '2026-10-09')).toBe('10/03/2026 – 10/09/2026');
  });

  it('writes a single day once', () => {
    expect(formatRange('2026-10-09', '2026-10-09')).toBe('10/09/2026');
  });
});
