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
