import { toast } from 'react-toastify';
import { USE_MOCK, client, toApiError, conflictError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';
import { FORM_STATUS } from '../lib/constants';

function nowIso() {
  return new Date().toISOString();
}

/**
 * Portal login handle issued when Station 1 provisions an account.
 * "PHO-1001" -> "pho1001". Mirrors DbSeeder.UsernameFor on the server.
 */
function usernameFor(externalEmployeeId) {
  return String(externalEmployeeId).replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 30);
}

/** Mock stand-in for the SQL Server rowversion column. */
function bumpRowVersion(form) {
  form.rowVersion = `v${Number(String(form.rowVersion ?? 'v0').slice(1)) + 1}`;
}

function assertFresh(form, rowVersion) {
  if (rowVersion !== undefined && form.rowVersion !== rowVersion) {
    throw conflictError();
  }
}

function attachPatient(state, form) {
  return {
    ...form,
    patient: state.patients.find((p) => p.patientID === form.patientID) ?? null,
  };
}

/**
 * The physician fields a form may carry. An explicit pick rather than an omit,
 * so a credential field added to the row later cannot leak by default.
 */
function publicPhysician(physician) {
  if (!physician) return null;
  return {
    physicianID: physician.physicianID,
    surname: physician.surname,
    firstName: physician.firstName,
    middleName: physician.middleName ?? null,
    prcLicenseNo: physician.prcLicenseNo,
    contactNo: physician.contactNo ?? null,
  };
}

function pushAuditLog(state, { formID, actorType, actorID, action, details = null }) {
  state.wellnessFormAuditLogs.push({
    logID: db.nextId('logID'),
    formID,
    actorType,
    actorID,
    action,
    details,
    occurredAt: nowIso(),
  });
}

/**
 * Forms at one status, or at any of several when given an array — station 3
 * lists the consultations it has already signed alongside the waiting ones.
 */
export async function getQueue(status) {
  const wanted = Array.isArray(status) ? status : [status];
  if (USE_MOCK) {
    await delay(200);
    const state = db.read();
    return state.forms
      .filter((f) => wanted.includes(f.status))
      .map((f) => attachPatient(state, f))
      .sort((a, b) => (a.formDate < b.formDate ? -1 : 1));
  }
  try {
    const { data } = await client.get('/wellnessforms', {
      params: { status: wanted.join(',') },
    });
    return data.data ?? data;
  } catch (error) {
    const err = toApiError(error);
    toast.error(err.message || 'Failed to load queue');
    return [];
  }
}

export async function getAllForms() {
  if (USE_MOCK) {
    await delay(200);
    const state = db.read();
    return state.forms
      .map((f) => attachPatient(state, f))
      .sort((a, b) => (a.formDate < b.formDate ? 1 : -1));
  }
  try {
    const { data } = await client.get('/wellnessforms');
    return data.data ?? data;
  } catch (error) {
    const err = toApiError(error);
    toast.error(err.message || 'Failed to load forms');
    return [];
  }
}

export async function getForm(formID) {
  if (USE_MOCK) {
    await delay();
    const state = db.read();
    const form = state.forms.find((f) => f.formID === formID);
    if (!form) {
      const err = new Error('Form not found.');
      err.status = 404;
      throw err;
    }
    return {
      ...attachPatient(state, form),
      // Projected, never the raw row: a physician record carries credentials.
      physician: publicPhysician(
        state.physicians.find((p) => p.physicianID === form.physicianID),
      ),
      familyMedicalHistory: state.familyMedicalHistory.filter((r) => r.formID === formID),
      pastMedicalHistory: state.pastMedicalHistory.filter((r) => r.formID === formID),
      socialHistory: state.socialHistory.find((r) => r.formID === formID) ?? null,
      exercise: state.exercise.filter((r) => r.formID === formID),
      dentalAssessment: state.dentalAssessments.find((r) => r.formID === formID) ?? null,
      visionAssessment: state.visionAssessments.find((r) => r.formID === formID) ?? null,
      assessmentAnswers: state.assessmentAnswers.filter((r) => r.formID === formID),
    };
  }
  try {
    const { data } = await client.get(`/wellnessforms/${formID}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitStation1({ patient, vitals, adminID }) {
  if (USE_MOCK) {
    await delay(400);
    return db.write((state) => {
      let record = state.patients.find(
        (p) => p.externalEmployeeId === patient.externalEmployeeId,
      );
      if (!record) {
        record = {
          patientID: db.nextId('patientID'),
          ...patient,
          lastSyncedAt: nowIso(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        state.patients.push(record);
      } else {
        Object.assign(record, patient, { updatedAt: nowIso() });
      }

      const hasAccount = state.patientAccounts.some(
        (a) => a.patientID === record.patientID,
      );
      if (!hasAccount) {
        state.patientAccounts.push({
          patientAccountID: db.nextId('patientAccountID'),
          patientID: record.patientID,
          username: usernameFor(record.externalEmployeeId),
          password: 'password123', // mock activation default
          status: 'Provisioned',
          provisionedAt: nowIso(),
          activatedAt: null,
          lastLoginAt: null,
        });
      }

      const form = {
        formID: db.nextId('formID'),
        patientID: record.patientID,
        physicianID: null,
        status: FORM_STATUS.PENDING_ASSESSMENT,
        currentStation: 2,
        rowVersion: 'v1',
        signature: null,
        signedAt: null,
        formDate: nowIso(),
        ...vitals,
        station1AdminID: adminID,
        station1SubmittedAt: nowIso(),
        station2AdminID: null,
        station2SubmittedAt: null,
        recommendedDiagnosticTest: null,
        impressionClinical: null,
        managementTreatment: null,
        station3SubmittedAt: null,
        dentistID: null,
        dentalSignature: null,
        dentalSignedAt: null,
        station4SubmittedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.forms.push(form);
      pushAuditLog(state, {
        formID: form.formID, actorType: 'Admin', actorID: adminID, action: 'Station1Submitted',
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post('/wellnessforms/station1', { patient, vitals });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitStation2({ formID, answers, adminID, rowVersion }) {
  if (USE_MOCK) {
    await delay(400);
    return db.write((state) => {
      const form = state.forms.find((f) => f.formID === formID);
      if (!form) throw Object.assign(new Error('Form not found.'), { status: 404 });
      assertFresh(form, rowVersion);

      state.assessmentAnswers = state.assessmentAnswers.filter(
        (a) => a.formID !== formID,
      );
      for (const answer of answers ?? []) {
        state.assessmentAnswers.push({
          answerID: db.nextId('answerID'),
          formID,
          questionID: answer.questionID,
          optionID: answer.optionID,
          createdAt: nowIso(),
        });
      }

      form.status = FORM_STATUS.PENDING_CONSULTATION;
      form.currentStation = 3;
      form.station2AdminID = adminID;
      form.station2SubmittedAt = nowIso();
      form.updatedAt = nowIso();
      bumpRowVersion(form);
      pushAuditLog(state, {
        formID: form.formID, actorType: 'Admin', actorID: adminID, action: 'Station2Submitted',
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post(`/wellnessforms/${formID}/station2`, {
      answers, rowVersion,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitStation3({ formID, consultation, physicianID, rowVersion }) {
  if (USE_MOCK) {
    await delay(500);
    if (!consultation?.signature) {
      throw new Error('A physician signature is required before submitting.');
    }
    // The attending physician is chosen on the form, so it is a submitted value
    // like any other and has to be validated rather than trusted.
    if (!physicianID) {
      throw new Error('An attending physician is required before submitting.');
    }
    return db.write((state) => {
      const form = state.forms.find((f) => f.formID === formID);
      if (!form) throw Object.assign(new Error('Form not found.'), { status: 404 });
      assertFresh(form, rowVersion);

      const physician = state.physicians.find((p) => p.physicianID === physicianID);
      if (!physician?.isActive) {
        throw Object.assign(
          new Error('That physician is no longer registered as active.'),
          { status: 422 },
        );
      }

      state.familyMedicalHistory = state.familyMedicalHistory.filter(
        (r) => r.formID !== formID,
      );
      for (const row of consultation.familyMedicalHistory ?? []) {
        state.familyMedicalHistory.push({
          fmhID: db.nextId('fmhID'), formID, ...row,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      state.pastMedicalHistory = state.pastMedicalHistory.filter(
        (r) => r.formID !== formID,
      );
      for (const row of consultation.pastMedicalHistory ?? []) {
        state.pastMedicalHistory.push({
          pmhID: db.nextId('pmhID'), formID, ...row,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      state.socialHistory = state.socialHistory.filter((r) => r.formID !== formID);
      if (consultation.socialHistory) {
        state.socialHistory.push({
          socialHistoryID: db.nextId('socialHistoryID'), formID,
          ...consultation.socialHistory,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      state.exercise = state.exercise.filter((r) => r.formID !== formID);
      for (const row of consultation.exercise ?? []) {
        state.exercise.push({
          exerciseID: db.nextId('exerciseID'), formID, ...row,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      form.physicianID = physicianID;
      form.recommendedDiagnosticTest = consultation.recommendedDiagnosticTest ?? null;
      form.impressionClinical = consultation.impressionClinical ?? null;
      form.managementTreatment = consultation.managementTreatment ?? null;
      form.signature = consultation.signature;
      form.signedAt = nowIso();
      // Station 4 (Dental) completes the form now; this hands it to the dental
      // queue already carrying the physician's signature.
      form.status = FORM_STATUS.PENDING_DENTAL;
      form.currentStation = 4;
      form.station3SubmittedAt = nowIso();
      form.updatedAt = nowIso();
      bumpRowVersion(form);
      pushAuditLog(state, {
        formID: form.formID, actorType: 'Physician', actorID: physicianID, action: 'Station3Submitted',
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post(`/wellnessforms/${formID}/station3`, {
      ...consultation, physicianID, rowVersion,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitStation4({
  formID, dentalAssessment, dentistID, dentalSignature, rowVersion,
}) {
  if (USE_MOCK) {
    await delay(500);
    if (!dentalSignature) {
      throw new Error('A dentist signature is required before submitting.');
    }
    // The examining dentist is chosen on the form, so it is a submitted value
    // like any other and has to be validated rather than trusted.
    if (!dentistID) {
      throw new Error('An examining dentist is required before submitting.');
    }
    return db.write((state) => {
      const form = state.forms.find((f) => f.formID === formID);
      if (!form) throw Object.assign(new Error('Form not found.'), { status: 404 });
      assertFresh(form, rowVersion);

      const dentist = state.physicians.find((p) => p.physicianID === dentistID);
      if (!dentist?.isActive) {
        throw Object.assign(
          new Error('That dentist is no longer registered as active.'),
          { status: 422 },
        );
      }

      state.dentalAssessments = state.dentalAssessments.filter(
        (r) => r.formID !== formID,
      );
      if (dentalAssessment) {
        state.dentalAssessments.push({
          dentalAssessmentID: db.nextId('dentalAssessmentID'), formID,
          ...dentalAssessment,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      form.dentistID = dentistID;
      form.dentalSignature = dentalSignature;
      form.dentalSignedAt = nowIso();
      // Station 5 (Vision) owns the transition to Completed now; this hands
      // the form to the vision queue still carrying the dentist's signature.
      form.status = FORM_STATUS.PENDING_VISION;
      form.currentStation = 5;
      form.station4SubmittedAt = nowIso();
      form.updatedAt = nowIso();
      bumpRowVersion(form);
      pushAuditLog(state, {
        formID: form.formID, actorType: 'Physician', actorID: dentistID, action: 'Station4Submitted',
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post(`/wellnessforms/${formID}/station4`, {
      dentalAssessment, dentistID, dentalSignature, rowVersion,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function submitStation5({
  formID, visionAssessment, optometristID, visionSignature, rowVersion,
}) {
  if (USE_MOCK) {
    await delay(500);
    if (!visionSignature) {
      throw new Error('An optometrist signature is required before submitting.');
    }
    // The examining optometrist is chosen on the form, so it is a submitted
    // value like any other and has to be validated rather than trusted.
    if (!optometristID) {
      throw new Error('An examining optometrist is required before submitting.');
    }
    return db.write((state) => {
      const form = state.forms.find((f) => f.formID === formID);
      if (!form) throw Object.assign(new Error('Form not found.'), { status: 404 });
      assertFresh(form, rowVersion);

      const optometrist = state.physicians.find((p) => p.physicianID === optometristID);
      if (!optometrist?.isActive) {
        throw Object.assign(
          new Error('That optometrist is no longer registered as active.'),
          { status: 422 },
        );
      }

      state.visionAssessments = state.visionAssessments.filter(
        (r) => r.formID !== formID,
      );
      if (visionAssessment) {
        state.visionAssessments.push({
          visionAssessmentID: db.nextId('visionAssessmentID'), formID,
          ...visionAssessment,
          createdAt: nowIso(), updatedAt: nowIso(),
        });
      }

      form.optometristID = optometristID;
      form.visionSignature = visionSignature;
      form.visionSignedAt = nowIso();
      form.status = FORM_STATUS.COMPLETED;
      form.currentStation = 5;
      form.station5SubmittedAt = nowIso();
      form.updatedAt = nowIso();
      bumpRowVersion(form);
      pushAuditLog(state, {
        formID: form.formID, actorType: 'Physician', actorID: optometristID, action: 'Station5Submitted',
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post(`/wellnessforms/${formID}/station5`, {
      visionAssessment, optometristID, visionSignature, rowVersion,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Soft delete: flips the form to Cancelled so it leaves every station queue.
 * The row is kept — a wellness form is a medical record, and the audit entry
 * this writes has to stay resolvable to the form it refers to.
 */
export async function cancelForm({ formID, reason, adminID, rowVersion }) {
  if (USE_MOCK) {
    await delay(300);
    return db.write((state) => {
      const form = state.forms.find((f) => f.formID === formID);
      if (!form) throw Object.assign(new Error('Form not found.'), { status: 404 });
      if (form.status === FORM_STATUS.CANCELLED) {
        throw Object.assign(new Error('This form is already cancelled.'), { status: 409 });
      }
      assertFresh(form, rowVersion);

      const previousStatus = form.status;
      form.status = FORM_STATUS.CANCELLED;
      form.updatedAt = nowIso();
      bumpRowVersion(form);
      pushAuditLog(state, {
        formID,
        actorType: 'Admin',
        actorID: adminID,
        action: 'FormCancelled',
        details: `Cancelled from ${previousStatus} (Station ${form.currentStation}). Reason: ${reason}`,
      });
      return { ...form };
    });
  }
  try {
    const { data } = await client.post(`/wellnessforms/${formID}/cancel`, {
      reason, rowVersion,
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

function actorName(state, actorType, actorID) {
  if (actorType === 'Admin') {
    const admin = state.admins.find((a) => a.adminID === actorID);
    return admin?.fullName ?? `Admin #${actorID}`;
  }
  if (actorType === 'Physician') {
    const physician = state.physicians.find((p) => p.physicianID === actorID);
    return physician ? `Dr. ${physician.firstName} ${physician.surname}` : `Physician #${actorID}`;
  }
  return actorType;
}

export async function getActivityLogs() {
  if (USE_MOCK) {
    await delay(200);
    const state = db.read();
    return state.wellnessFormAuditLogs
      .map((log) => {
        const form = state.forms.find((f) => f.formID === log.formID) ?? null;
        const patient = form ? state.patients.find((p) => p.patientID === form.patientID) ?? null : null;
        return {
          ...log,
          actorName: actorName(state, log.actorType, log.actorID),
          patient,
        };
      })
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  }
  try {
    const { data } = await client.get('/wellnessformauditlogs');
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getPatientForms(patientID) {
  if (USE_MOCK) {
    await delay();
    const state = db.read();
    return state.forms
      .filter((f) => f.patientID === patientID)
      .map((f) => attachPatient(state, f))
      .sort((a, b) => (a.formDate < b.formDate ? 1 : -1));
  }
  try {
    const { data } = await client.get('/wellnessforms/mine');
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}
