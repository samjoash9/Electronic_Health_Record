import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../api/mock/db';
import {
  submitStation1, submitStation2, submitStation3, getQueue, getForm, getPatientForms,
} from '../api/forms.api';
import { getAssessmentTemplate } from '../api/assessment.api';
import { scoreAllCategories } from '../lib/scoring';
import { FORM_STATUS } from '../lib/constants';

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

const employee = {
  externalEmployeeId: 'PHO-1005',
  surname: 'Ocampo', firstName: 'Rosa', middleName: 'E',
  birthdate: '1979-02-08', sex: 'Female', civilStatus: 'Married',
  address: '5 Rizal Street', agencyOffice: 'Provincial Health Office',
  position: 'Nurse II', contactNo: '09171234567',
};

const vitals = {
  weightKg: 58, heightCm: 155, bmi: 24.1, idealBMI: 22,
  bpSystolic: 120, bpDiastolic: 80, tempCelsius: 36.5,
  heartRate: 70, respRate: 16,
};

describe('full station workflow', () => {
  it('carries one form from registration to a signed record the patient can read', async () => {
    // Station 1
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    expect(await getQueue(FORM_STATUS.PENDING_ASSESSMENT)).toHaveLength(1);
    expect(await getQueue(FORM_STATUS.PENDING_CONSULTATION)).toHaveLength(0);

    // Station 2: answer every question with its healthiest option.
    const categories = await getAssessmentTemplate();
    const answers = categories.flatMap((category) =>
      category.questions.map((question) => ({
        questionID: question.questionID,
        optionID: question.options.reduce(
          (best, o) => (o.score > best.score ? o : best),
        ).optionID,
      })),
    );
    expect(answers).toHaveLength(16);

    const assessed = await submitStation2({
      formID: created.formID, answers, adminID: 2, rowVersion: created.rowVersion,
    });
    expect(await getQueue(FORM_STATUS.PENDING_ASSESSMENT)).toHaveLength(0);
    expect(await getQueue(FORM_STATUS.PENDING_CONSULTATION)).toHaveLength(1);

    // A perfect set of answers scores 100% in every category.
    const withAnswers = await getForm(created.formID);
    const scores = scoreAllCategories(categories, withAnswers.assessmentAnswers);
    expect(scores.map((s) => s.percent)).toEqual([100, 100, 100, 100]);

    // Station 3
    await submitStation3({
      formID: created.formID, physicianID: 1, rowVersion: assessed.rowVersion,
      consultation: {
        familyMedicalHistory: [{ conditionID: 1, isNone: true }],
        pastMedicalHistory: [],
        socialHistory: { smokingSticksPerDay: 0, exerciseFrequency: 'Daily' },
        recommendedDiagnosticTest: 'CBC, Urinalysis',
        impressionClinical: 'Apparently well',
        managementTreatment: 'Annual follow-up',
        signature: 'data:image/png;base64,AAA',
      },
    });

    // Patient view
    const mine = await getPatientForms(withAnswers.patientID);
    expect(mine).toHaveLength(1);
    expect(mine[0].status).toBe(FORM_STATUS.COMPLETED);
    expect(mine[0].signedAt).toBeTruthy();
    expect(await getQueue(FORM_STATUS.PENDING_CONSULTATION)).toHaveLength(0);
  });

  it('keeps two concurrent patients independent', async () => {
    const a = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const b = await submitStation1({
      patient: { ...employee, externalEmployeeId: 'PHO-1006', surname: 'Garcia' },
      vitals, adminID: 1,
    });
    await submitStation2({
      formID: a.formID, answers: [], adminID: 2, rowVersion: a.rowVersion,
    });

    expect(await getQueue(FORM_STATUS.PENDING_ASSESSMENT)).toHaveLength(1);
    expect((await getQueue(FORM_STATUS.PENDING_ASSESSMENT))[0].formID).toBe(b.formID);
    expect(await getQueue(FORM_STATUS.PENDING_CONSULTATION)).toHaveLength(1);
  });
});
