import { describe, it, expect } from 'vitest';
import { STATION3_HEALTH } from './healthReportFixtures';
import { station3Charts, station3Kpis } from './station3Health';

describe('station3Kpis', () => {
  const kpi = (label, report = STATION3_HEALTH) => station3Kpis(report).find((k) => k.label === label);

  it('counts consultations, with the patients they came from beside them', () => {
    expect(kpi('Consultations Completed')).toMatchObject({ value: 12, subtext: '10 patients' });
  });

  it('gives the prescribing and lab rates as shares of consultations', () => {
    expect(kpi('Prescription Issuance Rate')).toMatchObject({ value: '66.7%', subtext: '8 of 12 consultations' });
    expect(kpi('Diagnostic Labs Ordered')).toMatchObject({ value: '41.7%', subtext: '5 of 12 consultations' });
  });

  it('shows a dash, not 0%, with no consultations', () => {
    const none = { ...STATION3_HEALTH, consultations: 0, withPrescription: 0, withLabs: 0 };

    expect(kpi('Prescription Issuance Rate', none).value).toBe('—');
  });
});

describe('station3Charts', () => {
  it('ranks conditions and maintenance drugs as bars, not a line', () => {
    const { conditions, maintenance } = station3Charts(STATION3_HEALTH);

    expect(conditions.data.map((d) => [d.name, d.value])).toEqual([['Hypertension', 4], ['Diabetes', 2]]);
    expect(maintenance.type).toBe('horizontal-bar');
    expect(maintenance.data.map((d) => [d.name, d.value])).toEqual([['Amlodipine', 3], ['Metformin', 2]]);
  });

  it('splits smokers as shares of those who answered, Both included', () => {
    const { smoking } = station3Charts(STATION3_HEALTH);

    expect(smoking.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Non-Smoker', 6, 60],
      ['Cigarettes Only', 2, 20],
      ['E-Cigarette / Vape', 1, 10],
      ['Both', 1, 10],
    ]);
  });

  it('adds a slice for smokers who ticked neither kind, only when there are some', () => {
    const report = { ...STATION3_HEALTH, smoking: { ...STATION3_HEALTH.smoking, unspecified: 2 } };

    expect(station3Charts(report).smoking.at(-1)).toMatchObject({ name: 'Type Not Recorded', value: 2 });
  });

  it('buckets drinking as the page always has', () => {
    const { alcohol } = station3Charts(STATION3_HEALTH);

    expect(alcohol.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Non-Drinker', 5, 50],
      ['Occasional', 3, 30],
      ['Weekly', 1, 10],
      ['Frequent/Daily', 1, 10],
    ]);
  });

  it('lists the top activities', () => {
    const { exercise } = station3Charts(STATION3_HEALTH);

    expect(exercise.map((d) => [d.name, d.value])).toEqual([['Walking', 4], ['Jogging', 2]]);
  });

  it('shades labs and medications by rank', () => {
    const { labs, medications } = station3Charts(STATION3_HEALTH);

    expect(labs.map((d) => [d.name, d.value])).toEqual([
      ['CBC', 5],
      ['Lipid Profile', 3],
      ['FBS', 2],
      ['Urinalysis', 1],
    ]);
    expect(labs.map((d) => d.color)).toEqual(['#0A594D', '#0A594D', '#0A594D', '#37AF9B']);
    expect(medications.map((d) => [d.name, d.value])).toEqual([['Losartan', 4], ['Paracetamol', 3]]);
  });
});
