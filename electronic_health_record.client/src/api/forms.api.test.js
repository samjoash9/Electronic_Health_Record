import { describe, it, expect, vi, beforeEach } from 'vitest';

// The wellness-form calls go straight to the server (there is no mock-db
// branch), so these pin the request each one sends: the route, and a body
// whose keys match the server's submit DTOs. The rules the server applies to
// that body -- signatures, signers, stale rowVersions -- are tested on the
// server, in WellnessFormsControllerTests.
vi.mock('../config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import api from '../config/axios';
import {
  getQueue, getAllForms, getForm, submitStation1, startStation, submitStation2, submitStation3,
  submitStation4, submitStation5, cancelForm, revertStation, editForm, deleteForm,
  getActivityLogs, deleteActivityLogs, getPatientForms,
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

const SIGNATURE = 'data:image/png;base64,AAA';

/** The body of the one POST the call under test made. */
function postedBody() {
  expect(api.post).toHaveBeenCalledTimes(1);
  return api.post.mock.calls[0][1];
}

/** An axios-shaped failure, as the server would answer. */
function httpError(status, data) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockResolvedValue({ data: {} });
  api.post.mockResolvedValue({ data: {} });
  api.patch.mockResolvedValue({ data: {} });
  api.delete.mockResolvedValue({ data: {} });
});

describe('reading forms', () => {
  it('asks for several queue statuses in one comma-joined param', async () => {
    await getQueue([FORM_STATUS.PENDING_CONSULTATION, FORM_STATUS.PENDING_DENTAL]);

    expect(api.get).toHaveBeenCalledWith('/wellnessforms', {
      params: { status: `${FORM_STATUS.PENDING_CONSULTATION},${FORM_STATUS.PENDING_DENTAL}` },
    });
  });

  it('accepts a single queue status', async () => {
    await getQueue(FORM_STATUS.PENDING_ASSESSMENT);

    expect(api.get).toHaveBeenCalledWith('/wellnessforms', {
      params: { status: FORM_STATUS.PENDING_ASSESSMENT },
    });
  });

  it('unwraps a { data } envelope', async () => {
    api.get.mockResolvedValue({ data: { data: [{ formID: 1 }] } });

    await expect(getQueue(FORM_STATUS.PENDING_ASSESSMENT)).resolves.toEqual([{ formID: 1 }]);
  });

  it('passes a bare response through', async () => {
    api.get.mockResolvedValue({ data: [{ formID: 1 }] });

    await expect(getAllForms()).resolves.toEqual([{ formID: 1 }]);
    expect(api.get).toHaveBeenCalledWith('/wellnessforms');
  });

  it('reads one form by id', async () => {
    api.get.mockResolvedValue({ data: { formID: 42 } });

    await expect(getForm(42)).resolves.toEqual({ formID: 42 });
    expect(api.get).toHaveBeenCalledWith('/wellnessforms/42');
  });

  it('reads the signed-in patient\'s own forms without naming the patient', async () => {
    await getPatientForms();

    expect(api.get).toHaveBeenCalledWith('/wellnessforms/mine');
  });
});

describe('station submissions', () => {
  it('station 1 sends the patient and vitals only -- the admin comes from the JWT', async () => {
    api.post.mockResolvedValue({ data: { data: { formID: 7, status: FORM_STATUS.PENDING_ASSESSMENT } } });

    const form = await submitStation1({ patient: employee, vitals, adminID: 1 });

    expect(api.post).toHaveBeenCalledWith('/wellnessforms/station1', { patient: employee, vitals });
    expect(form).toEqual({ formID: 7, status: FORM_STATUS.PENDING_ASSESSMENT });
  });

  it('marks a station as started on its own route, with no body', async () => {
    await startStation(42, 3);

    expect(api.post).toHaveBeenCalledWith('/wellnessforms/42/station3/start');
  });

  it('station 2 sends the answers and the rowVersion it read', async () => {
    const answers = [{ questionID: 1, optionID: 3 }];

    await submitStation2({ formID: 42, answers, rowVersion: 'AAAA', adminID: 2 });

    expect(api.post.mock.calls[0][0]).toBe('/wellnessforms/42/station2');
    // Station2SubmitDto: Answers, RowVersion.
    expect(postedBody()).toEqual({ answers, rowVersion: 'AAAA' });
  });

  it('station 3 spreads the consultation flat beside the physician and rowVersion', async () => {
    const consultation = {
      familyMedicalHistory: [{ conditionID: 4, conditionType: 'Type 2' }],
      pastMedicalHistory: [{ conditionOther: 'Asthma', yearDiagnosed: 2015 }],
      exercise: [{ exerciseType: 'Jogging', exerciseFrequency: 'Weekly', exerciseYearStarted: '2020' }],
      socialHistory: { smokes: false },
      recommendedDiagnosticTest: 'CBC',
      impressionClinical: 'Well',
      managementTreatment: 'Continue current regimen',
      charges: [],
      signature: SIGNATURE,
    };

    await submitStation3({ formID: 42, physicianID: 1, rowVersion: 'BBBB', consultation });

    expect(api.post.mock.calls[0][0]).toBe('/wellnessforms/42/station3');
    // Station3SubmitDto takes these flat; a nested `consultation` key would
    // bind to nothing and fail the signature check.
    expect(postedBody()).toEqual({ physicianID: 1, ...consultation, rowVersion: 'BBBB' });
    expect(postedBody()).not.toHaveProperty('consultation');
  });

  it('station 3 signs against the doctor picked on the form, not the caller', async () => {
    // Doctor 2 is the one picked in the dropdown; doctor 1 is signed in, and
    // the request carries no trace of the caller.
    await submitStation3({
      formID: 42, physicianID: 2, rowVersion: 'BBBB', consultation: { signature: SIGNATURE },
    });

    expect(postedBody().physicianID).toBe(2);
  });

  it('station 4 sends the dentist, the assessment nested, and the dental signature', async () => {
    const dentalAssessment = { oralHygieneStatus: 'Fair', oralHygieneStatusRemarks: 'Plaque' };

    await submitStation4({
      formID: 42, dentistID: 5, rowVersion: 'CCCC', dentalSignature: SIGNATURE, dentalAssessment,
    });

    expect(api.post.mock.calls[0][0]).toBe('/wellnessforms/42/station4');
    // Station4SubmitDto: DentistID, DentalAssessment, DentalSignature, RowVersion.
    expect(postedBody()).toEqual({
      dentistID: 5, dentalAssessment, dentalSignature: SIGNATURE, rowVersion: 'CCCC',
    });
  });

  it('station 5 sends the optometrist, the assessment nested, and the vision signature', async () => {
    const visionAssessment = { visualAcuityRightEye: '20/20', visualAcuityLeftEye: '20/25' };

    await submitStation5({
      formID: 42, optometristID: 6, rowVersion: 'DDDD', visionSignature: SIGNATURE, visionAssessment,
    });

    expect(api.post.mock.calls[0][0]).toBe('/wellnessforms/42/station5');
    // Station5SubmitDto: OptometristID, VisionAssessment, VisionSignature, RowVersion.
    expect(postedBody()).toEqual({
      optometristID: 6, visionAssessment, visionSignature: SIGNATURE, rowVersion: 'DDDD',
    });
  });
});

describe('admin actions', () => {
  it('cancels with a reason and the rowVersion', async () => {
    await cancelForm({ formID: 42, reason: 'Duplicate', rowVersion: 'EEEE' });

    expect(api.post).toHaveBeenCalledWith('/wellnessforms/42/cancel', { reason: 'Duplicate', rowVersion: 'EEEE' });
  });

  it('reverts to a station with a reason and the rowVersion', async () => {
    await revertStation({ formID: 42, targetStation: 3, reason: 'Wrong doctor', rowVersion: 'EEEE' });

    expect(api.post).toHaveBeenCalledWith('/wellnessforms/42/revert', {
      targetStation: 3, reason: 'Wrong doctor', rowVersion: 'EEEE',
    });
  });

  it('edits by PATCHing only the changed fields', async () => {
    await editForm({ formID: 42, changes: { bpSystolic: 130 }, reason: 'Typo', rowVersion: 'EEEE' });

    expect(api.patch).toHaveBeenCalledWith('/wellnessforms/42', {
      bpSystolic: 130, reason: 'Typo', rowVersion: 'EEEE',
    });
  });

  it('deletes with the reason in the request body', async () => {
    await expect(deleteForm({ formID: 42, reason: 'Test record', rowVersion: 'EEEE' })).resolves.toBeUndefined();

    expect(api.delete).toHaveBeenCalledWith('/wellnessforms/42', {
      data: { reason: 'Test record', rowVersion: 'EEEE' },
    });
  });

  it('reads and deletes audit log entries', async () => {
    api.delete.mockResolvedValue({ data: { deleted: 2 } });

    await getActivityLogs();
    await expect(deleteActivityLogs([1, 2])).resolves.toEqual({ deleted: 2 });

    expect(api.get).toHaveBeenCalledWith('/wellnessformauditlogs');
    expect(api.delete).toHaveBeenCalledWith('/wellnessformauditlogs', { data: { logIDs: [1, 2] } });
  });
});

describe('server refusals', () => {
  it('surfaces a stale write as a 409 with the server\'s message', async () => {
    api.post.mockRejectedValue(httpError(409, { message: 'This record was changed at another station.' }));

    await expect(submitStation2({ formID: 42, answers: [], rowVersion: 'OLD' }))
      .rejects.toMatchObject({ status: 409, message: 'This record was changed at another station.' });
  });

  it('surfaces a missing signature from ModelState as its own words', async () => {
    api.post.mockRejectedValue(httpError(400, {
      errors: { Signature: ['A physician signature is required before submitting.'] },
    }));

    await expect(submitStation3({
      formID: 42, physicianID: 1, rowVersion: 'BBBB', consultation: { signature: null },
    })).rejects.toMatchObject({ status: 400, message: 'A physician signature is required before submitting.' });
  });

  it('surfaces a missing physician from ModelState as its own words', async () => {
    api.post.mockRejectedValue(httpError(400, {
      errors: { PhysicianID: ['An attending physician is required before submitting.'] },
    }));

    await expect(submitStation3({
      formID: 42, physicianID: null, rowVersion: 'BBBB', consultation: { signature: SIGNATURE },
    })).rejects.toThrow(/physician/i);
  });

  it.each([
    ['dentist', () => submitStation4({ formID: 42, dentistID: 5, rowVersion: 'C', dentalSignature: null, dentalAssessment: {} }),
      { DentalSignature: ['A dentist signature is required before submitting.'] }],
    ['optometrist', () => submitStation5({ formID: 42, optometristID: 6, rowVersion: 'D', visionSignature: null, visionAssessment: {} }),
      { VisionSignature: ['An optometrist signature is required before submitting.'] }],
  ])('surfaces a missing %s signature', async (_who, submit, errors) => {
    api.post.mockRejectedValue(httpError(400, { errors }));

    await expect(submit()).rejects.toThrow(/signature/i);
  });

  it('reports an unreachable server as status 0', async () => {
    api.get.mockRejectedValue(new Error('Network Error'));

    await expect(getForm(42)).rejects.toMatchObject({ status: 0, message: 'Network Error' });
  });
});
