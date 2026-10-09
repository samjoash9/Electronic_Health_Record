import { describe, it, expect } from 'vitest';
import { pdfScopeText } from './pdfScope';

const scope = (selectedStations) =>
  pdfScopeText({
    selectedStations,
    liveScope: 'PROVINCIAL HEALTH OFFICE · October 2026',
    generated: 'October 8, 2026',
  });

describe('pdfScopeText', () => {
  it("names the live stations' filter and flags the sample ones", () => {
    expect(scope([1, 2, 3, 4, 5])).toBe(
      'Official Clinical Surveillance Report  |  Stations 1–5  |  Stations 1–3: PROVINCIAL HEALTH OFFICE · October 2026  |  Stations 4–5: sample figures  |  Generated: October 8, 2026'
    );
  });

  it('names a single live station on its own', () => {
    expect(scope([2, 4])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 2, 4  |  Station 2: PROVINCIAL HEALTH OFFICE · October 2026  |  Stations 4–5: sample figures  |  Generated: October 8, 2026'
    );
  });

  it('lists some of the live stations by number', () => {
    expect(scope([1, 3])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 1, 3  |  Stations 1, 3: PROVINCIAL HEALTH OFFICE · October 2026  |  Generated: October 8, 2026'
    );
  });

  it('leaves out the sample-figures note when only live stations are exported', () => {
    expect(scope([1, 2, 3])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 1, 2, 3  |  Stations 1–3: PROVINCIAL HEALTH OFFICE · October 2026  |  Generated: October 8, 2026'
    );
  });

  it('leaves out the filter when no live station is exported', () => {
    expect(scope([4, 5])).toBe(
      'Official Clinical Surveillance Report  |  Station(s): 4, 5  |  Stations 4–5: sample figures  |  Generated: October 8, 2026'
    );
  });
});
