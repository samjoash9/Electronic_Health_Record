import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

// A row the HR feed never supplied a birthdate for is stored as DateTime.MinValue
// rather than NULL, which would otherwise format as "Jan 1, 1".
function usableDate(value) {
  if (!value) return '';
  return String(value).startsWith('0001-01-01') ? '' : value;
}

function normalizeEmployee(row) {
  return {
    externalEmployeeId: row.externalEmployeeId ?? '',
    surname: row.surname ?? '',
    firstName: row.firstName ?? '',
    middleName: row.middleName ?? '',
    birthdate: usableDate(row.birthdate),
    sex: row.sex ?? '',
    civilStatus: row.civilStatus ?? '',
    address: row.address ?? '',
    agencyOffice: row.agencyOffice ?? '',
    position: row.position ?? '',
    contactNo: row.contactNo ?? '',
  };
}

export async function searchEmployees(query) {
  const searchTerms = (query ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (USE_MOCK) {
    await delay(150);
    const employees = db.read().employees;
    if (searchTerms.length === 0) return employees;
    return employees.filter((e) => {
      const name = `${e.surname ?? ''} ${e.firstName ?? ''} ${e.middleName ?? ''} ${e.externalEmployeeId ?? ''}`.toLowerCase();
      return searchTerms.every((term) => name.includes(term));
    });
  }

  try {
    const { data } = await client.get('/employees', { params: { q: query } });
    const employees = (Array.isArray(data) ? data : []).map(normalizeEmployee);

    // GET /api/employees returns the whole local table and ignores `q`, so the
    // match has to happen here to mirror the mock path's behaviour.
    if (searchTerms.length === 0) return employees;
    return employees.filter((e) => {
      const name = `${e.surname ?? ''} ${e.firstName ?? ''} ${e.middleName ?? ''} ${e.externalEmployeeId ?? ''}`.toLowerCase();
      return searchTerms.every((term) => name.includes(term));
    });
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getPatient(patientID) {
  if (USE_MOCK) {
    await delay();
    return db.read().patients.find((p) => p.patientID === patientID) ?? null;
  }

  try {
    const { data } = await client.get(`/patients/${patientID}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * The portal-account fields a client may read. An explicit pick rather than an
 * omit, so a credential field added to the row later cannot leak by default --
 * same shape toPhysician() uses in onboarding.api.js.
 */
function toPatientAccount(row) {
  if (!row) return null;
  return {
    patientAccountID: row.patientAccountID,
    patientID: row.patientID,
    username: row.username ?? '',
    status: row.status ?? '',
    mustChangePassword: Boolean(row.mustChangePassword),
    provisionedAt: row.provisionedAt ?? null,
    activatedAt: row.activatedAt ?? null,
    lastLoginAt: row.lastLoginAt ?? null,
  };
}

/**
 * Admin Patients panel: everyone Station 1 has registered, with the portal
 * username issued to them. `account` is null for a Patient row the HR sync
 * created but that has never been through Station 1, so the panel can show
 * those as "not onboarded" rather than dropping them.
 */
export async function listPatientAccounts() {
  if (USE_MOCK) {
    await delay(150);
    const { patients, patientAccounts } = db.read();
    return patients
      .map((p) => ({
        patientID: p.patientID,
        externalEmployeeId: p.externalEmployeeId ?? '',
        surname: p.surname ?? '',
        firstName: p.firstName ?? '',
        middleName: p.middleName ?? null,
        birthdate: usableDate(p.birthdate),
        sex: p.sex ?? '',
        agencyOffice: p.agencyOffice ?? null,
        position: p.position ?? null,
        contactNo: p.contactNo ?? null,
        createdAt: p.createdAt ?? null,
        account: toPatientAccount(
          patientAccounts.find((a) => a.patientID === p.patientID),
        ),
      }))
      .sort((a, b) => a.surname.localeCompare(b.surname)
        || a.firstName.localeCompare(b.firstName));
  }

  try {
    const { data } = await client.get('/patients/accounts');
    const rows = Array.isArray(data) ? data : (data?.data ?? []);
    return rows.map((row) => ({
      ...row,
      birthdate: usableDate(row.birthdate),
      account: toPatientAccount(row.account),
    }));
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Suspends or restores a patient's portal sign-in. Reversible, and it touches
 * nothing but the login: the person and their visit history are untouched.
 *
 * "Active" and "Suspended" are the vocabulary the login check already uses --
 * AuthController rejects any status that is not "Active".
 */
export async function setPatientAccountActive(patientID, isActive) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const account = state.patientAccounts.find((a) => a.patientID === patientID);
      if (!account) {
        throw Object.assign(
          new Error(`Patient with ID ${patientID} has no portal account.`),
          { status: 404 },
        );
      }
      account.status = isActive ? 'Active' : 'Suspended';
      account.updatedAt = new Date().toISOString();
      return toPatientAccount(account);
    });
  }
  try {
    const { data } = await client.patch(`/patients/${patientID}/account`, { isActive });
    return toPatientAccount(data);
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Permanently deletes a patient AND their entire medical history -- every
 * wellness form, the assessments and charges on those forms, the audit trail,
 * the portal login and its sessions. Superadmin only, enforced server-side.
 *
 * There is no soft-delete fallback here: use setPatientAccountActive to block
 * sign-in while keeping the records.
 */
export async function deletePatient(patientID) {
  if (USE_MOCK) {
    await delay(250);
    return db.write((state) => {
      const index = state.patients.findIndex((p) => p.patientID === patientID);
      if (index === -1) {
        throw Object.assign(
          new Error(`Patient with ID ${patientID} was not found.`),
          { status: 404 },
        );
      }
      const formIds = (state.forms ?? [])
        .filter((f) => f.patientID === patientID)
        .map((f) => f.formID);
      // Mirrors DeletePatient on the server: the history goes with the person,
      // so nothing is left pointing at a patient that no longer exists.
      const dropByForm = (key) => {
        if (Array.isArray(state[key])) {
          state[key] = state[key].filter((row) => !formIds.includes(row.formID));
        }
      };
      // Collection names as the mock seed spells them -- several are singular
      // there (exercise, socialHistory) and it has no charges or sessions.
      ['assessmentAnswers', 'socialHistory', 'exercise', 'dentalAssessments',
        'visionAssessments', 'familyMedicalHistory', 'pastMedicalHistory',
        'wellnessFormAuditLogs'].forEach(dropByForm);
      if (Array.isArray(state.forms)) {
        state.forms = state.forms.filter((f) => f.patientID !== patientID);
      }
      if (Array.isArray(state.patientAccounts)) {
        state.patientAccounts = state.patientAccounts
          .filter((a) => a.patientID !== patientID);
      }
      const [removed] = state.patients.splice(index, 1);
      return { patientID: removed.patientID };
    });
  }
  try {
    await client.delete(`/patients/${patientID}`);
    return { patientID };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * A patient's full visit history, newest first -- one row per WellnessForm,
 * since a patient now goes through the station workflow repeatedly (monthly,
 * six-monthly; the cadence is an operational decision this call does not
 * encode). Used by Station 1 (is this a returning patient?), Station 3
 * (PriorStationsPanel's "Previous visits"), and Station 6 (has this patient
 * been billed before?).
 *
 * Unlike the other functions in this file, there is no USE_MOCK branch: the
 * endpoint it calls is new server-side and the local mock db has no
 * equivalent wellnessForms collection to read, matching forms.api.js's
 * functions (which this data joins against) rather than this file's own
 * dual-mode pattern.
 */
export async function getPatientVisitHistory(patientID) {
  try {
    const { data } = await client.get(`/patients/${patientID}/forms`);
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Patients registered at Station 1, bucketed on Manila time for the
 * dashboard's onboarding chart: { total, points: [{ label, current,
 * previous }], years }. granularity 'day' takes { year, month }, 'month'
 * takes { year }, 'year' takes neither. No USE_MOCK branch, same reason
 * as getPatientVisitHistory above.
 */
export async function getOnboardedStats(params) {
  try {
    const { data } = await client.get('/patients/onboarded', { params });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Each patient's smoking status from their latest answered visit, for the
 * dashboard's Smoker Status card: { total, nonSmokers, smokers: {
 * traditional, eCigarette, both, unspecified } }. Pass { office } to limit
 * it to one agency office, or {} for all. No USE_MOCK branch, same reason
 * as getPatientVisitHistory above.
 */
export async function getSmokingStatus(params) {
  try {
    const { data } = await client.get('/patients/smoking-status', { params });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

// Station 1: once an employee is picked, checks whether they already have a
// PatientAccount. If not, the admin must ask the patient for a username
// before the registration can be submitted.
export async function hasPatientAccount(externalEmployeeId) {
  if (USE_MOCK) {
    await delay(100);
    const { patients, patientAccounts } = db.read();
    const patient = patients.find((p) => p.externalEmployeeId === externalEmployeeId);
    if (!patient) return false;
    return patientAccounts.some((a) => a.patientID === patient.patientID);
  }

  try {
    const { data } = await client.get(`/patients/has-account/${externalEmployeeId}`);
    return Boolean(data?.hasAccount);
  } catch (error) {
    throw toApiError(error);
  }
}

// Whether `username` is free for a new patient account. Checked against every
// kind of login, not just patients: sign-in looks a username up across admins,
// physicians and patients, so a clash with any of them would lock someone out.
export async function isUsernameAvailable(username) {
  if (USE_MOCK) {
    await delay(100);
    const { admins, physicians, patientAccounts } = db.read();
    const wanted = username.trim().toLowerCase();
    return ![...admins, ...physicians, ...patientAccounts]
      .some((account) => account.username?.toLowerCase() === wanted);
  }

  try {
    const { data } = await client.get('/patients/username-available', { params: { username } });
    return Boolean(data?.available);
  } catch (error) {
    throw toApiError(error);
  }
}
