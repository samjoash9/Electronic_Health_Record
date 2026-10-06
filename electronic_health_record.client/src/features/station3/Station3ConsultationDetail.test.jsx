import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { formatDateAtTime } from '../../lib/formatters';
import Station3ConsultationDetail from './Station3ConsultationDetail';

const at = '2026-10-06T05:36:00Z';

// The record the design was drawn from.
const signed = {
  formDate: '2026-10-06T00:00:00',
  signedAt: at,
  signature: 'data:image/png;base64,AAAA',
  physician: { firstName: 'Diana', surname: 'Caingat', prcLicenseNo: '6154763' },
  familyMedicalHistory: [
    { fmhID: 1, conditionID: 2, conditionOther: null, isNone: false, conditionType: null },
    { fmhID: 2, conditionID: 4, conditionOther: null, isNone: false, conditionType: 'Type 1' },
  ],
  pastMedicalHistory: [
    {
      pmhID: 1,
      conditionID: null,
      conditionOther: 'Hypertension',
      yearDiagnosed: 2019,
      maintenanceDrugGeneric: 'Losartan',
      dosage: '50 mg',
      frequency: 'Once daily',
    },
  ],
  socialHistory: {
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
  },
  exercise: [{ exerciseID: 1, exerciseType: 'Pickleball', exerciseFrequency: '2× a week', exerciseYearStarted: '2026' }],
  impressionClinical: 'Stage 1 hypertension',
  managementTreatment: 'Medications:\n• Losartan — 50 mg — Once daily',
  recommendedDiagnosticTest: 'CBC, SUA, TT3, TSH, Drug Test',
};

describe('Station3ConsultationDetail', () => {
  it("names family conditions and marks the ones the patient has too", () => {
    render(<Station3ConsultationDetail form={signed} />);
    const family = screen.getByRole('region', { name: 'Family medical history' });

    expect(within(family).getByText('Hypertension')).toBeInTheDocument();
    expect(within(family).getByText('Diabetes mellitus')).toBeInTheDocument();
    expect(within(family).getByText('Type 1')).toBeInTheDocument();
    expect(within(family).getAllByText("Also in patient's history")).toHaveLength(1);
  });

  it('shows each past condition with how long the patient has lived with it and its medication', () => {
    render(<Station3ConsultationDetail form={signed} />);
    const past = screen.getByRole('region', { name: 'Past medical history' });

    expect(within(past).getByText('Hypertension')).toBeInTheDocument();
    expect(within(past).getByText('On maintenance')).toBeInTheDocument();
    expect(within(past).getByText('2019')).toBeInTheDocument();
    expect(within(past).getByText('7 years')).toBeInTheDocument();
    expect(within(past).getByText('Losartan')).toBeInTheDocument();
    expect(within(past).getByText('50 mg')).toBeInTheDocument();
    expect(within(past).getByText('Once daily')).toBeInTheDocument();
  });

  it('lays social history out as a row per habit', () => {
    render(<Station3ConsultationDetail form={signed} />);
    const table = screen.getByRole('table', { name: 'Social history' });

    const smoking = within(table).getByRole('row', { name: /Smoking/ });
    expect(within(smoking).getByText('E-cigarette')).toBeInTheDocument();
    expect(within(smoking).getByText('Daily')).toBeInTheDocument();
    expect(within(smoking).getByText('15 puffs a day')).toBeInTheDocument();
    expect(within(smoking).getByText('2 pods a month')).toBeInTheDocument();
    expect(within(smoking).getByText('2021')).toBeInTheDocument();
    expect(within(smoking).getByText('5 years')).toBeInTheDocument();

    const exercise = within(table).getByRole('row', { name: /Exercise/ });
    expect(within(exercise).getByText('Pickleball')).toBeInTheDocument();
    expect(within(exercise).getByText('2× a week')).toBeInTheDocument();
    expect(within(exercise).getByText('This year')).toBeInTheDocument();

    const alcohol = within(table).getByRole('row', { name: /Alcohol/ });
    expect(within(alcohol).getByText('Spirits / hard liquor')).toBeInTheDocument();
    expect(within(alcohol).getAllByText('Not recorded')).toHaveLength(2);
  });

  it('reads the management plan back as medication and advice', () => {
    render(<Station3ConsultationDetail form={signed} />);
    const assessment = screen.getByRole('region', { name: "Physician's assessment" });

    expect(within(assessment).getByText('Stage 1 hypertension')).toBeInTheDocument();
    expect(within(assessment).getByText('Losartan')).toBeInTheDocument();
    expect(within(assessment).getByText('Same as maintenance medication on file')).toBeInTheDocument();
    expect(within(assessment).getByText('Not recorded')).toBeInTheDocument();
  });

  it('keeps a plan written in an older free-text shape whole', () => {
    render(<Station3ConsultationDetail form={{ ...signed, managementTreatment: 'Start losartan 50mg OD' }} />);

    expect(screen.getByText('Start losartan 50mg OD')).toBeInTheDocument();
  });

  it('prices the ordered tests and totals the priced ones', () => {
    render(<Station3ConsultationDetail form={signed} />);
    const tests = screen.getByRole('table', { name: 'Recommended diagnostic tests' });

    expect(within(tests).getByText('CBC')).toBeInTheDocument();
    expect(within(tests).getByText('Complete blood count')).toBeInTheDocument();
    expect(within(tests).getByText('₱180.00')).toBeInTheDocument();
    expect(within(tests).getByText('No set price')).toBeInTheDocument();
    expect(within(tests).getByText('₱1,280.00')).toBeInTheDocument();
    expect(within(tests).getByText('Excludes TSH, which has no set price')).toBeInTheDocument();
  });

  it('signs off with the attending physician', () => {
    render(<Station3ConsultationDetail form={signed} />);

    expect(screen.getByText('DC')).toBeInTheDocument();
    expect(screen.getByText('Dr. Diana Caingat')).toBeInTheDocument();
    expect(screen.getByText('PRC License No. 6154763')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Physician signature' })).toBeInTheDocument();
    expect(screen.getByText(`Signed ${formatDateAtTime(at)}`)).toBeInTheDocument();
  });

  it('holds the assessment back until the consultation is signed', () => {
    render(<Station3ConsultationDetail form={{ ...signed, signedAt: null }} />);
    const assessment = screen.getByRole('region', { name: "Physician's assessment" });

    expect(within(assessment).getByText('Not yet completed.')).toBeInTheDocument();
    expect(screen.queryByText('Dr. Diana Caingat')).not.toBeInTheDocument();
  });

  it('says so when no history is on file', () => {
    render(<Station3ConsultationDetail form={{ ...signed, familyMedicalHistory: [], pastMedicalHistory: [] }} />);

    expect(screen.getByText('No family medical history on file.')).toBeInTheDocument();
    expect(screen.getByText('No past medical history on file.')).toBeInTheDocument();
  });
});
