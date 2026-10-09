import { describe, it, expect } from 'vitest';
import { STATION4_HEALTH, STATION5_HEALTH } from './healthReportFixtures';
import { station4Charts, station4Kpis } from './station4Health';
import { station5Charts, station5Kpis } from './station5Health';

describe('station4Kpis', () => {
  const kpi = (label, report = STATION4_HEALTH) => station4Kpis(report).find((k) => k.label === label);

  it('counts screenings, with the patients they came from beside them', () => {
    expect(kpi('Dental Screenings')).toMatchObject({ value: 12, subtext: '10 patients' });
  });

  it('takes the caries and gum rates of the patients who were asked', () => {
    expect(kpi('Active Dental Caries Rate')).toMatchObject({ value: '60%', subtext: '6 of 10 answered' });
    expect(kpi('Periodontal / Gingivitis')).toMatchObject({ value: '44.4%', subtext: '4 of 9 answered' });
  });

  it('counts the patients needing restorative work or an extraction', () => {
    expect(kpi('Restorative & Extraction Needed')).toMatchObject({ value: 4, subtext: 'of 10 answered' });
  });

  it('shows a dash, not 0%, when nobody was asked', () => {
    const report = { ...STATION4_HEALTH, caries: { none: 0, present: 0 } };

    expect(kpi('Active Dental Caries Rate', report).value).toBe('—');
  });
});

describe('station4Charts', () => {
  it('splits oral hygiene and gum condition as shares of those answered', () => {
    const { hygiene, gum } = station4Charts(STATION4_HEALTH);

    expect(hygiene.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Good', 4, 40],
      ['Fair', 4, 40],
      ['Poor', 2, 20],
    ]);
    expect(gum.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Healthy', 5, 55.6],
      ['Gingivitis', 3, 33.3],
      ['Suspected Periodontal Problem', 1, 11.1],
    ]);
  });
});

describe('station5Kpis', () => {
  const kpi = (label, report = STATION5_HEALTH) => station5Kpis(report).find((k) => k.label === label);

  it('counts screenings, with the patients they came from beside them', () => {
    expect(kpi('Vision Screenings Performed')).toMatchObject({ value: 12, subtext: '10 patients' });
  });

  it('gives eye pain as a share of those who answered', () => {
    expect(kpi('Reported Eye Pain / Discomfort')).toMatchObject({ value: '10%', subtext: '1 of 10 answered' });
  });

  it('counts near and distant difficulty, with their share beside them', () => {
    expect(kpi('Near Vision Difficulty (Presbyopia Risk)')).toMatchObject({ value: 3, subtext: '37.5% of 8 answered' });
    expect(kpi('Distant Vision Difficulty (Myopia Risk)')).toMatchObject({ value: 2, subtext: '20% of 10 answered' });
  });
});

describe('station5Charts', () => {
  it('charts the five symptoms in the form’s order, as shares of those who answered each', () => {
    const { symptoms } = station5Charts(STATION5_HEALTH);

    expect(symptoms.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['History of Eye Problems', 2, 20],
      ['Eye Pain / Discomfort', 1, 10],
      ['Blurred Vision', 4, 40],
      ['Difficulty Seeing Near Objects', 3, 37.5],
      ['Difficulty Seeing Distant Objects', 2, 20],
    ]);
  });
});
