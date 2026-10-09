import { describe, it, expect } from 'vitest';
import { STATION2_HEALTH } from './healthReportFixtures';
import { station2Charts, station2Kpis } from './station2Health';

describe('station2Kpis', () => {
  const kpi = (label, report = STATION2_HEALTH) => station2Kpis(report).find((k) => k.label === label);

  it('counts assessments, with the patients they came from beside them', () => {
    expect(kpi('Total Assessments Completed')).toMatchObject({ value: 12, subtext: '10 patients' });
    expect(kpi('Total Assessments Completed', { ...STATION2_HEALTH, patients: 1 }).subtext).toBe('1 patient');
  });

  it('gives the overall score out of 100 with its band', () => {
    expect(kpi('Average Global Wellness Score')).toMatchObject({ value: '71.4 / 100', subtext: 'Fair' });
    expect(kpi('Average Global Wellness Score', { ...STATION2_HEALTH, overallScore: 75 }).value).toBe('75.0 / 100');
  });

  it('shows a dash, not 0, when nobody answered', () => {
    expect(kpi('Average Global Wellness Score', { ...STATION2_HEALTH, overallScore: null }).value).toBe('—');
  });
});

describe('station2Charts', () => {
  it('scores every aspect in order, captioned with its band', () => {
    const { scores } = station2Charts(STATION2_HEALTH);

    expect(scores.data.map((d) => [d.name, d.value, d.subtext])).toEqual([
      ['Spiritual', 82.5, 'Good'],
      ['Psychological', 74, 'Fair'],
      ['Mental', 66.3, 'Fair'],
      ['Emotional', null, 'No answers in this period'],
      ['Physical', 90, 'Excellent'],
      ['Financial', 48.8, 'Needs support'],
      ['Social', 77.5, 'Good'],
    ]);
  });

  it('shows a dash in the legend for an aspect nobody answered', () => {
    const emotional = station2Charts(STATION2_HEALTH).scores.data.find((d) => d.name === 'Emotional');

    expect(emotional.value ?? emotional.count).toBe('—');
  });

  it('ranks the aspects by patients at risk, ties in questionnaire order', () => {
    const { atRisk } = station2Charts(STATION2_HEALTH);

    expect(atRisk.data.map((d) => [d.name, d.value])).toEqual([
      ['Financial', 4],
      ['Mental', 2],
      ['Psychological', 1],
      ['Social', 1],
      ['Spiritual', 0],
      ['Emotional', 0],
      ['Physical', 0],
    ]);
    expect(atRisk.data[0].subtext).toBe('4 of 8 who answered');
  });

  it('colours an aspect the same in both charts', () => {
    const { scores, atRisk } = station2Charts(STATION2_HEALTH);
    const colorOf = (data, name) => data.find((d) => d.name === name).color;

    for (const { name } of scores.data) {
      expect(colorOf(atRisk.data, name)).toBe(colorOf(scores.data, name));
    }
  });
});
