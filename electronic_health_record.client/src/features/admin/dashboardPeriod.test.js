import { describe, it, expect } from 'vitest';
import { isoDate, periodLabel, periodRange, recentYears } from './dashboardPeriod';

describe('isoDate', () => {
  it('zero-pads month and day', () => {
    expect(isoDate(2026, 3, 7)).toBe('2026-03-07');
  });
});

describe('periodRange', () => {
  it('covers one day for Day', () => {
    expect(periodRange('day', { date: '2026-10-05' })).toEqual({ from: '2026-10-05', to: '2026-10-05' });
  });

  it('covers the whole month for Month, leap February and December included', () => {
    expect(periodRange('month', { year: 2028, month: 2 })).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(periodRange('month', { year: 2026, month: 2 })).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('month', { year: 2026, month: 12 })).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('covers the calendar year for Year', () => {
    expect(periodRange('year', { year: 2026 })).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
});

describe('periodLabel', () => {
  it('names a day, a month or a year the way a heading reads', () => {
    expect(periodLabel('day', { date: '2026-10-05' })).toBe('October 5, 2026');
    expect(periodLabel('month', { year: 2026, month: 10 })).toBe('October 2026');
    expect(periodLabel('year', { year: 2026 })).toBe('2026');
  });
});

describe('recentYears', () => {
  it('lists the current year and the four before it, newest first', () => {
    expect(recentYears(2026)).toEqual([2026, 2025, 2024, 2023, 2022]);
  });
});
