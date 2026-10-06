import { describe, it, expect } from 'vitest';
import { familyHistoryLabel, conditionName } from './familyHistory';

describe('familyHistoryLabel', () => {
  it('names a checked condition from the catalog, since the row stores only its id', () => {
    expect(familyHistoryLabel({ conditionID: 2, conditionOther: null, isNone: false, conditionType: null }))
      .toBe('HYPERTENSION');
  });

  it('adds the type the physician specified', () => {
    expect(familyHistoryLabel({ conditionID: 4, conditionOther: null, isNone: false, conditionType: 'Type 1' }))
      .toBe('DIABETES MELLITUS — Type 1');
  });

  it('uses the typed-in name of an "Others" row', () => {
    expect(familyHistoryLabel({ conditionID: null, conditionOther: 'Gout', isNone: false, conditionType: 'Chronic' }))
      .toBe('Gout — Chronic');
  });

  it('reads a "None" row as none reported', () => {
    expect(familyHistoryLabel({ conditionID: 1, isNone: true, conditionType: null })).toBe('None reported');
  });

  it('still shows an id the catalog no longer lists rather than dropping the row', () => {
    expect(familyHistoryLabel({ conditionID: 7, conditionOther: null, isNone: false, conditionType: null }))
      .toBe('Condition #7');
  });
});

describe('conditionName', () => {
  it('sets a catalog name in sentence case', () => {
    expect(conditionName({ conditionID: 4, conditionOther: null })).toBe('Diabetes mellitus');
  });

  it("keeps a typed-in name as the physician wrote it", () => {
    expect(conditionName({ conditionID: null, conditionOther: 'Gout' })).toBe('Gout');
  });

  it('still shows an id the catalog no longer lists', () => {
    expect(conditionName({ conditionID: 7, conditionOther: null })).toBe('Condition #7');
  });
});
