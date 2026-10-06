import { describe, it, expect } from 'vitest';
import {
  visitYear, yearsSince, daysPerWeek, parseManagement, sameCondition, sameDrug, socialHistoryRows, listNames,
} from './consultationRecord';

describe('visitYear', () => {
  it('reads the year the visit took place', () => {
    expect(visitYear({ formDate: '2026-10-06T00:00:00' })).toBe(2026);
  });

  it('falls back to the signing time when the form has no date', () => {
    expect(visitYear({ signedAt: '2025-03-01T02:00:00Z' })).toBe(2025);
  });
});

describe('yearsSince', () => {
  it('counts whole years up to the visit', () => {
    expect(yearsSince('2019', 2026)).toBe(7);
    expect(yearsSince(2026, 2026)).toBe(0);
  });

  it('gives nothing for a year it cannot use', () => {
    expect(yearsSince('', 2026)).toBeNull();
    expect(yearsSince('around 2015', 2026)).toBeNull();
    expect(yearsSince('2030', 2026)).toBeNull();
  });
});

describe('daysPerWeek', () => {
  it('reads frequencies that state a count plainly', () => {
    expect(daysPerWeek('Daily')).toBe(7);
    expect(daysPerWeek('Weekly')).toBe(1);
    expect(daysPerWeek('2× a week')).toBe(2);
    expect(daysPerWeek('3x a week')).toBe(3);
    expect(daysPerWeek('4 times a week')).toBe(4);
    expect(daysPerWeek('twice a week')).toBe(2);
  });

  it('does not guess at a vague one', () => {
    expect(daysPerWeek('Several times a week')).toBeNull();
    expect(daysPerWeek('Occasionally')).toBeNull();
    expect(daysPerWeek(null)).toBeNull();
  });
});

describe('parseManagement', () => {
  it('splits what Station 3 wrote back into medications and advice', () => {
    const text = 'Medications:\n• Losartan — 50 mg — Once daily\n• Metformin\n\nLifestyle advice and follow-up:\nLow-salt diet.\n\nRecheck BP in 4 weeks.';

    expect(parseManagement(text)).toEqual({
      medications: [
        { drug: 'Losartan', details: ['50 mg', 'Once daily'] },
        { drug: 'Metformin', details: [] },
      ],
      advice: 'Low-salt diet.\n\nRecheck BP in 4 weeks.',
      other: null,
    });
  });

  it('reads advice written without any medication', () => {
    expect(parseManagement('Lifestyle advice and follow-up:\nWalk daily.'))
      .toEqual({ medications: [], advice: 'Walk daily.', other: null });
  });

  it('keeps text in any other shape whole rather than dropping it', () => {
    expect(parseManagement('Start losartan 50mg OD'))
      .toEqual({ medications: [], advice: null, other: 'Start losartan 50mg OD' });
  });

  it('has nothing for an empty plan', () => {
    expect(parseManagement(null)).toEqual({ medications: [], advice: null, other: null });
  });
});

describe('sameCondition', () => {
  it('matches across case and a bracketed note', () => {
    expect(sameCondition('HYPERTENSION', 'Hypertension')).toBe(true);
    expect(sameCondition('Hypertension (Heart Attack)', 'hypertension')).toBe(true);
  });

  it('matches a name that only adds detail', () => {
    expect(sameCondition('Diabetes mellitus', 'Diabetes')).toBe(true);
  });

  it('does not match a different word that shares a stem', () => {
    expect(sameCondition('Hypertension', 'Hypertensive heart disease')).toBe(false);
    expect(sameCondition('Hypertension', '')).toBe(false);
  });
});

describe('sameDrug', () => {
  it('ignores case and stray spaces', () => {
    expect(sameDrug(' losartan ', 'Losartan')).toBe(true);
    expect(sameDrug('Losartan', 'Amlodipine')).toBe(false);
    expect(sameDrug('Losartan', null)).toBe(false);
  });
});

describe('socialHistoryRows', () => {
  const social = {
    smokes: true,
    smokesCigarette: false,
    smokesEcig: true,
    ecigFrequency: 'Daily',
    ecigPuffsPerDay: '15',
    ecigPodsPerMonth: '2',
    ecigYearStarted: '2021',
    alcoholType: 'Spirits / hard liquor',
    drinkFrequency: 'Daily',
    drinksPerSession: null,
  };
  const exercise = [{ exerciseType: 'Pickleball', exerciseFrequency: '2× a week', exerciseYearStarted: '2026' }];

  it('gives one row per habit the patient reported', () => {
    expect(socialHistoryRows(social, exercise)).toEqual([
      { habit: 'smoking', type: 'E-cigarette', frequency: 'Daily', amount: ['15 puffs a day', '2 pods a month'], yearStarted: '2021' },
      { habit: 'exercise', type: 'Pickleball', frequency: '2× a week', amount: [], yearStarted: '2026' },
      { habit: 'alcohol', type: 'Spirits / hard liquor', frequency: 'Daily', amount: [], yearStarted: null },
    ]);
  });

  it('says plainly when the patient does not smoke or drink', () => {
    const rows = socialHistoryRows({ smokes: false, drinkFrequency: 'Never' }, []);

    expect(rows[0]).toMatchObject({ habit: 'smoking', none: 'Does not smoke' });
    expect(rows[1]).toMatchObject({ habit: 'exercise', type: null });
    expect(rows[2]).toMatchObject({ habit: 'alcohol', none: 'Does not drink' });
  });

  it('gives a row for each product a smoker uses', () => {
    const rows = socialHistoryRows({
      smokes: true,
      smokesCigarette: true,
      cigaretteSticksPerDay: '1',
      cigaretteFrequency: 'Daily',
      smokesEcig: true,
    }, []);

    expect(rows.filter((r) => r.habit === 'smoking').map((r) => r.type)).toEqual(['Cigarette', 'E-cigarette']);
    expect(rows[0].amount).toEqual(['1 stick a day']);
  });
});

describe('listNames', () => {
  it('joins names the way a sentence would', () => {
    expect(listNames(['TSH'])).toBe('TSH');
    expect(listNames(['ECG', 'UTZ'])).toBe('ECG and UTZ');
    expect(listNames(['ECG', 'UTZ', 'TSH'])).toBe('ECG, UTZ and TSH');
  });
});
