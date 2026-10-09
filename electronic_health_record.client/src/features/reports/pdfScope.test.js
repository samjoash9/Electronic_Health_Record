import { describe, it, expect } from 'vitest';
import { pdfScopeText } from './pdfScope';

const scope = (selectedStations) =>
  pdfScopeText({
    selectedStations,
    scope: 'PROVINCIAL HEALTH OFFICE · October 2026',
    generated: 'October 8, 2026',
  });

describe('pdfScopeText', () => {
  it('names every station and the filter the figures are under', () => {
    expect(scope([1, 2, 3, 4, 5])).toBe(
      'Official Clinical Surveillance Report  |  Stations 1–5  |  Scope: PROVINCIAL HEALTH OFFICE · October 2026  |  Generated: October 8, 2026'
    );
  });

  it('lists the stations picked when not all of them are', () => {
    expect(scope([2, 4])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 2, 4  |  Scope: PROVINCIAL HEALTH OFFICE · October 2026  |  Generated: October 8, 2026'
    );
  });
});
