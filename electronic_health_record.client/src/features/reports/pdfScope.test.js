import { describe, it, expect } from 'vitest';
import { pdfScopeText } from './pdfScope';

const scope = (selectedStations) =>
  pdfScopeText({
    selectedStations,
    station1Scope: 'PROVINCIAL HEALTH OFFICE · October 2026',
    generated: 'October 8, 2026',
  });

describe('pdfScopeText', () => {
  it("names Station 1's filter and flags the sample stations", () => {
    expect(scope([1, 2, 3, 4, 5])).toBe(
      'Official Clinical Surveillance Report  |  Stations 1–5  |  Station 1: PROVINCIAL HEALTH OFFICE · October 2026  |  Stations 2–5: sample figures  |  Generated: October 8, 2026'
    );
  });

  it('leaves out the sample-figures note when only Station 1 is exported', () => {
    expect(scope([1])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 1  |  Station 1: PROVINCIAL HEALTH OFFICE · October 2026  |  Generated: October 8, 2026'
    );
  });

  it("leaves out Station 1's filter when Station 1 is not exported", () => {
    expect(scope([3, 4])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 3, 4  |  Stations 2–5: sample figures  |  Generated: October 8, 2026'
    );
  });
});
