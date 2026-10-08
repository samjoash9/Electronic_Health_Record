import { describe, it, expect } from 'vitest';
import {
  consultationValuesFromForm, consultationChanges,
  answersFromForm, changedAnswerCount, answersPayload, formDateValue,
} from './formEditValues';

// A form as GET /wellnessforms/{id} returns it after Station 3 signed.
const consulted = {
  formDate: '2026-10-01T00:00:00.000Z',
  familyMedicalHistory: [
    { fmhid: 1, conditionID: 2, conditionOther: null, isNone: false, conditionType: null },
    { fmhid: 2, conditionID: 4, conditionOther: null, isNone: false, conditionType: 'Type 2' },
    { fmhid: 3, conditionID: null, conditionOther: 'Gout', isNone: false, conditionType: null },
  ],
  pastMedicalHistory: [
    {
      pmhid: 1, conditionID: null, conditionOther: 'Hypertension', yearDiagnosed: 2019,
      maintenanceDrugGeneric: 'Losartan', dosage: '50 mg', frequency: 'Once daily',
    },
  ],
  socialHistory: {
    smokes: true, smokesCigarette: true, cigaretteSticksPerDay: '10', cigaretteFrequency: 'Daily',
    cigaretteYearStarted: '2015', cigarettePuffsPerDay: null,
    smokesEcig: false, ecigPodsPerMonth: null, ecigFrequency: null, ecigYearStarted: null, ecigPuffsPerDay: null,
    alcoholType: 'Beer', drinkFrequency: 'Weekly', drinksPerSession: '2–3 drinks',
  },
  exercise: [{ exerciseType: 'Jogging', exerciseFrequency: '3x a week', exerciseYearStarted: '2020' }],
  recommendedDiagnosticTest: 'CBC, FBS',
  impressionClinical: 'Stage 1 Hypertension',
  managementTreatment: 'Medications:\n• Losartan — 50mg — Once Daily\n\nLifestyle advice and follow-up:\nLow-salt diet',
};

describe('consultationValuesFromForm', () => {
  it('ticks catalog conditions and lists typed ones under Others', () => {
    const { familyHistory } = consultationValuesFromForm(consulted);
    expect(familyHistory.none).toBe(false);
    expect(familyHistory.conditions).toEqual({
      2: { checked: true, conditionType: '' },
      4: { checked: true, conditionType: 'Type 2' },
    });
    expect(familyHistory.other).toEqual({
      checked: true,
      entries: [{ conditionOther: 'Gout', conditionType: '' }],
    });
  });

  it('reads a None row as the exclusive None choice', () => {
    const values = consultationValuesFromForm({
      familyMedicalHistory: [{ conditionID: 1, isNone: true, conditionType: null }],
    });
    expect(values.familyHistory.none).toBe(true);
    expect(values.familyHistory.conditions).toEqual({});
  });

  it('splits the treatment text back into medication rows and advice', () => {
    const values = consultationValuesFromForm(consulted);
    expect(values.medications).toEqual([{ drug: 'Losartan', dosage: '50mg', frequency: 'Once Daily' }]);
    expect(values.lifestyleFollowUp).toBe('Low-salt diet');
  });

  it('keeps treatment text in any other shape whole, as advice', () => {
    const values = consultationValuesFromForm({ managementTreatment: 'Rest and fluids' });
    expect(values.medications).toEqual([{ drug: '', dosage: '', frequency: '' }]);
    expect(values.lifestyleFollowUp).toBe('Rest and fluids');
  });

  it('starts an unconsulted form with one blank row per list', () => {
    const values = consultationValuesFromForm({});
    expect(values.pastMedicalHistory).toHaveLength(1);
    expect(values.exercise).toHaveLength(1);
    expect(values.socialHistory.smokes).toBeNull();
  });
});

describe('consultationChanges', () => {
  it('finds nothing when nothing was edited', () => {
    const values = consultationValuesFromForm(consulted);
    expect(consultationChanges(values, consultationValuesFromForm(consulted))).toEqual({});
  });

  it('finds nothing on a legacy treatment text left alone', () => {
    const legacy = { ...consulted, managementTreatment: 'Rest and fluids' };
    expect(consultationChanges(
      consultationValuesFromForm(legacy),
      consultationValuesFromForm(legacy),
    )).toEqual({});
  });

  it('sends only the section that moved', () => {
    const before = consultationValuesFromForm(consulted);
    const after = consultationValuesFromForm(consulted);
    after.impressionClinical = 'Stage 2 Hypertension';

    expect(consultationChanges(before, after)).toEqual({ impressionClinical: 'Stage 2 Hypertension' });
  });

  it('sends the whole list when one row changes', () => {
    const before = consultationValuesFromForm(consulted);
    const after = consultationValuesFromForm(consulted);
    after.exercise = [...after.exercise, { exerciseType: 'Swimming', exerciseFrequency: '', exerciseYearStarted: '' }];

    expect(consultationChanges(before, after).exercise).toEqual([
      { exerciseType: 'Jogging', exerciseFrequency: '3x a week', exerciseYearStarted: '2020' },
      { exerciseType: 'Swimming', exerciseFrequency: null, exerciseYearStarted: null },
    ]);
  });

  it('rebills the visit when the ordered tests change', () => {
    const before = consultationValuesFromForm(consulted);
    const after = consultationValuesFromForm(consulted);
    after.recommendedDiagnosticTest = 'CBC';

    const changes = consultationChanges(before, after);
    expect(changes.recommendedDiagnosticTest).toBe('CBC');
    expect(changes.charges).toEqual([expect.objectContaining({ itemType: 'Lab', name: 'CBC', quantity: 1 })]);
  });

  it('does not count the grid reordering the same tests as a change', () => {
    const before = consultationValuesFromForm(consulted);
    const after = consultationValuesFromForm(consulted);
    after.recommendedDiagnosticTest = 'FBS, CBC';

    expect(consultationChanges(before, after)).toEqual({});
  });

  it('keeps a catalog-coded past condition when another row is added', () => {
    const coded = {
      pastMedicalHistory: [{ conditionID: 3, conditionOther: null, yearDiagnosed: 2010 }],
    };
    const before = consultationValuesFromForm(coded);
    const after = consultationValuesFromForm(coded);
    after.pastMedicalHistory = [...after.pastMedicalHistory, {
      conditionOther: 'Asthma', yearDiagnosed: '', maintenanceDrugGeneric: '', dosage: '', frequency: '',
    }];

    expect(consultationChanges(before, after).pastMedicalHistory).toEqual([
      expect.objectContaining({ conditionID: 3, conditionOther: null, yearDiagnosed: 2010 }),
      expect.objectContaining({ conditionID: null, conditionOther: 'Asthma' }),
    ]);
  });
});

describe('Station 2 answers', () => {
  const form = { assessmentAnswers: [{ questionID: 2, optionID: 7 }, { questionID: 1, optionID: 3 }] };

  it('maps the stored rows by question', () => {
    expect(answersFromForm(form)).toEqual({ 1: 3, 2: 7 });
  });

  it('counts each question whose answer moved', () => {
    const initial = answersFromForm(form);
    expect(changedAnswerCount(initial, { ...initial })).toBe(0);
    expect(changedAnswerCount(initial, { ...initial, 2: 8, 5: 1 })).toBe(2);
  });

  it('sends the full set in question order', () => {
    expect(answersPayload({ 2: 8, 1: 3 })).toEqual([
      { questionID: 1, optionID: 3 },
      { questionID: 2, optionID: 8 },
    ]);
  });
});

describe('formDateValue', () => {
  it('reads the stored visit date as its calendar day', () => {
    expect(formDateValue({ formDate: '2026-10-01T00:00:00.000Z' })).toBe('2026-10-01');
    expect(formDateValue({})).toBe('');
  });
});
