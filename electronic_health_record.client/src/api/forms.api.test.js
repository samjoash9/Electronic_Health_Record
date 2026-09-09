import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './mock/db';
import {
  submitStation1, submitStation2, submitStation3, submitStation4, getQueue, getForm,
} from './forms.api';
import { FORM_STATUS } from '../lib/constants';

const employee = {
  externalEmployeeId: 'PHO-9001',
  surname: 'Santos', firstName: 'Maria', middleName: 'A',
  birthdate: '1985-04-12', sex: 'Female', civilStatus: 'Married',
  address: '1 Rizal Street', agencyOffice: 'Provincial Health Office',
  position: 'Nurse II', contactNo: '09171234567',
};

const vitals = {
  weightKg: 62, heightCm: 158, bmi: 24.8, idealBMI: 22,
  bpSystolic: 118, bpDiastolic: 76, tempCelsius: 36.6,
  heartRate: 72, respRate: 16,
};

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

describe('station submissions', () => {
  it('station 1 creates a form awaiting assessment', async () => {
    const form = await submitStation1({ patient: employee, vitals, adminID: 1 });
    expect(form.status).toBe(FORM_STATUS.PENDING_ASSESSMENT);
    expect(form.currentStation).toBe(2);
    expect(form.station1AdminID).toBe(1);
    expect(form.station1SubmittedAt).toBeTruthy();
  });

  it('station 1 provisions a patient account', async () => {
    await submitStation1({ patient: employee, vitals, adminID: 1 });
    const state = db.read();
    expect(state.patientAccounts).toHaveLength(2);
    expect(state.patientAccounts[1].status).toBe('Provisioned');
  });

  it('the new form appears in the station 2 queue', async () => {
    await submitStation1({ patient: employee, vitals, adminID: 1 });
    const queue = await getQueue(FORM_STATUS.PENDING_ASSESSMENT);
    expect(queue).toHaveLength(1);
    expect(queue[0].patient.surname).toBe('Santos');
  });

  it('station 2 moves the form to consultation', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const updated = await submitStation2({
      formID: created.formID,
      answers: [{ questionID: 101, optionID: 1011 }],
      adminID: 2,
      rowVersion: created.rowVersion,
    });
    expect(updated.status).toBe(FORM_STATUS.PENDING_CONSULTATION);
    expect(updated.currentStation).toBe(3);
    const full = await getForm(created.formID);
    expect(full.assessmentAnswers).toHaveLength(1);
  });

  it('station 3 signs and hands the form to dental', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const assessed = await submitStation2({
      formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
    });
    const signed = await submitStation3({
      formID: created.formID,
      physicianID: 1,
      rowVersion: assessed.rowVersion,
      consultation: {
        familyMedicalHistory: [{ conditionID: 4, conditionType: 'Type 2' }],
        pastMedicalHistory: [{
          conditionOther: 'Asthma', yearDiagnosed: 2015,
          maintenanceDrugGeneric: 'Salbutamol', dosage: '2 puffs', frequency: 'PRN',
        }],
        socialHistory: { smokes: false },
        exercise: [{ exerciseType: 'Jogging', exerciseFrequency: 'Weekly', exerciseYearStarted: '2020' }],
        recommendedDiagnosticTest: 'CBC',
        impressionClinical: 'Well',
        managementTreatment: 'Continue current regimen',
        signature: 'data:image/png;base64,AAA',
      },
    });
    // The physician's signature is captured here, but the form is not complete
    // until the dental station signs too.
    expect(signed.status).toBe(FORM_STATUS.PENDING_DENTAL);
    expect(signed.currentStation).toBe(4);
    expect(signed.signedAt).toBeTruthy();
    expect(signed.physicianID).toBe(1);

    const full = await getForm(created.formID);
    expect(full.familyMedicalHistory).toHaveLength(1);
    expect(full.pastMedicalHistory).toHaveLength(1);
    expect(full.exercise).toHaveLength(1);
    expect(full.exercise[0].exerciseFrequency).toBe('Weekly');
  });

  it('station 4 records the dental assessment and completes the form', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const assessed = await submitStation2({
      formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
    });
    const signed = await submitStation3({
      formID: created.formID, physicianID: 1, rowVersion: assessed.rowVersion,
      consultation: { socialHistory: { smokes: false }, signature: 'data:image/png;base64,AAA' },
    });
    const completed = await submitStation4({
      formID: created.formID,
      dentistID: 1,
      rowVersion: signed.rowVersion,
      dentalSignature: 'data:image/png;base64,BBB',
      dentalAssessment: {
        oralHygieneStatus: 'Fair',
        oralHygieneStatusRemarks: 'Plaque on lower incisors',
        dentalCaries: 'Present',
        gumCondition: 'Gingivitis',
        toothStatus: 'Missing Teeth',
        toothachePain: 'Yes',
        oralLesions: 'None',
        dentureUse: 'None',
        dentalTreatmentNeed: 'Restorative Treatment',
        lastDentalVisit: '6–12 months',
        dentalReferral: 'Routine referral',
      },
    });
    expect(completed.status).toBe(FORM_STATUS.COMPLETED);
    expect(completed.currentStation).toBe(4);
    expect(completed.dentistID).toBe(1);
    expect(completed.dentalSignedAt).toBeTruthy();
    expect(completed.station4SubmittedAt).toBeTruthy();

    const full = await getForm(created.formID);
    expect(full.dentalAssessment).toBeTruthy();
    expect(full.dentalAssessment.oralHygieneStatus).toBe('Fair');
    expect(full.dentalAssessment.oralHygieneStatusRemarks).toBe('Plaque on lower incisors');
    expect(full.dentalAssessment.lastDentalVisit).toBe('6–12 months');
  });

  it('station 4 refuses to submit without a dentist signature', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const assessed = await submitStation2({
      formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
    });
    const signed = await submitStation3({
      formID: created.formID, physicianID: 1, rowVersion: assessed.rowVersion,
      consultation: { socialHistory: { smokes: false }, signature: 'data:image/png;base64,AAA' },
    });
    await expect(submitStation4({
      formID: created.formID, dentistID: 1, rowVersion: signed.rowVersion,
      dentalSignature: null, dentalAssessment: {},
    })).rejects.toThrow(/signature/i);
  });

  it('rejects a stale write with a 409', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    await submitStation2({
      formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
    });
    await expect(submitStation2({
      formID: created.formID, answers: [], adminID: 2,
      rowVersion: created.rowVersion,
    })).rejects.toMatchObject({ status: 409 });
  });

  it('refuses to sign without a signature', async () => {
    const created = await submitStation1({ patient: employee, vitals, adminID: 1 });
    const assessed = await submitStation2({
      formID: created.formID, answers: [], adminID: 2, rowVersion: created.rowVersion,
    });
    await expect(submitStation3({
      formID: created.formID, physicianID: 1, rowVersion: assessed.rowVersion,
      consultation: { signature: null },
    })).rejects.toThrow(/signature/i);
  });
});
