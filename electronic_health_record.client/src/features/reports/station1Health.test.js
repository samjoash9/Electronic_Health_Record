import { describe, it, expect } from 'vitest';
import AGENCY_POSITION_MAP from '../../lib/agencyPositions.json';
import { STATION1_HEALTH } from './healthReportFixtures';
import { NO_OFFICE, shortOfficeName, station1Charts, station1Kpis } from './station1Health';

describe('shortOfficeName', () => {
  it('shortens an office with an acronym to the acronym and its division', () => {
    expect(shortOfficeName('PROVINCIAL ASSESSMENT AND TREASURY OFFICE (PASTO) - TREASURY OPERATION'))
      .toBe('PASTO - TREASURY OPERATION');
    expect(shortOfficeName('SUBSTANCE USE RECOVERY AND ENLIGHTENMENT (SURE) PROGRAM')).toBe('SURE');
  });

  it('abbreviates PROVINCIAL and keeps a short name whole', () => {
    expect(shortOfficeName('PROVINCIAL HEALTH OFFICE')).toBe('PROV. HEALTH OFFICE');
    expect(shortOfficeName('D.O.P. MEMORIAL HOSPITAL')).toBe('D.O.P. MEMORIAL HOSPITAL');
  });

  it('cuts a long name to 30 characters', () => {
    const label = shortOfficeName('PROVINCIAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE');

    expect(label).toBe('PROV. DISASTER RISK REDUCTION…');
    expect(label.length).toBeLessThanOrEqual(30);
  });

  it('gives every known office a label of its own', () => {
    const offices = Object.keys(AGENCY_POSITION_MAP);

    expect(new Set(offices.map(shortOfficeName)).size).toBe(offices.length);
  });
});

describe('station1Kpis', () => {
  const kpi = (label, report = STATION1_HEALTH) => station1Kpis(report).find((k) => k.label === label);

  it('counts patients, with their visits beside them', () => {
    expect(kpi('Patients Registered & Screened')).toMatchObject({ value: 10, subtext: '12 visits' });
    expect(kpi('Patients Registered & Screened', { ...STATION1_HEALTH, visits: 1 }).subtext).toBe('1 visit');
  });

  it('takes the BMI and BP shares of the patients actually measured', () => {
    expect(kpi('Healthy Normal BMI')).toMatchObject({ value: '33.3%', subtext: '3 of 9 measured' });
    expect(kpi('High BP Flagged (Stage 1+)')).toMatchObject({ value: '40%', subtext: '4 of 10 measured' });
  });

  it('shows a dash, not 0%, when nobody was measured', () => {
    const report = { ...STATION1_HEALTH, bmi: { underweight: 0, normal: 0, overweight: 0, obese1: 0, obese2: 0 } };

    expect(kpi('Healthy Normal BMI', report).value).toBe('—');
  });
});

describe('station1Charts', () => {
  it('lists every office, short name on the axis and full name for the tooltip', () => {
    const { byOffice } = station1Charts(STATION1_HEALTH);

    expect(byOffice.data.map((d) => [d.name, d.value, d.subtext])).toEqual([
      ['PROV. HEALTH OFFICE', 6, 'PROVINCIAL HEALTH OFFICE'],
      ['PROV. ENGINEERING OFFICE', 3, 'PROVINCIAL ENGINEERING OFFICE'],
      [NO_OFFICE, 1, undefined],
    ]);
  });

  it('marks the picked office whatever its case', () => {
    const { byOffice } = station1Charts(STATION1_HEALTH, 'provincial engineering office');

    expect(byOffice.data.map((d) => d.color)).toEqual(['#0A594D', '#37AF9B', '#0A594D']);
  });

  it('splits BMI into five classes in order, as shares of those measured', () => {
    const { bmi } = station1Charts(STATION1_HEALTH);

    expect(bmi.data.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Underweight', 1, 11.1],
      ['Normal', 3, 33.3],
      ['Overweight', 2, 22.2],
      ['Obese Class I', 2, 22.2],
      ['Obese Class II', 1, 11.1],
    ]);
  });

  it('stages blood pressure in order', () => {
    const { bp } = station1Charts(STATION1_HEALTH);

    expect(bp.data.map((d) => [d.name, d.value, d.pct])).toEqual([
      ['Normal (<120/<80)', 4, 40],
      ['Elevated (120-129)', 2, 20],
      ['Stage 1 HTN', 2, 20],
      ['Stage 2 HTN', 1, 10],
      ['Hypertensive Crisis', 1, 10],
    ]);
  });
});
