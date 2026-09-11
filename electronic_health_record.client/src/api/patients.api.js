import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

// The server serves employees in the shape of the external HR feed (eid,
// firstname, office, ...). Map it onto the field names the app uses everywhere
// else so components don't have to know which source a row came from.
// A row the HR feed never supplied a birthdate for is stored as DateTime.MinValue
// rather than NULL, which would otherwise format as "Jan 1, 1".
function usableDate(value) {
  if (!value) return '';
  return String(value).startsWith('0001-01-01') ? '' : value;
}

function normalizeEmployee(row) {
  return {
    // eid is 0 when the local ExternalEmployeeId wasn't numeric; that's absence,
    // not an id of zero.
    externalEmployeeId: row.eid ? String(row.eid) : '',
    surname: row.surname ?? '',
    firstName: row.firstname ?? '',
    middleName: row.middlename ?? '',
    birthdate: usableDate(row.birthDate),
    age: row.age || null,
    sex: row.sex ?? '',
    civilStatus: row.civilStatus ?? '',
    address: row.address ?? '',
    agencyOffice: row.office ?? '',
    position: row.position ?? '',
    contactNo: row.contactNumber ?? '',
  };
}

export async function searchEmployees(query) {
  if (USE_MOCK) {
    await delay(150);
    const q = (query ?? '').trim().toLowerCase();
    const employees = db.read().employees;
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.firstName} ${e.middleName} ${e.surname}`.toLowerCase().includes(q)
      || e.externalEmployeeId.toLowerCase().includes(q),
    );
  }

  try {
    const { data } = await client.get('/employees', { params: { q: query } });
    const employees = (Array.isArray(data) ? data : []).map(normalizeEmployee);

    // GET /api/employees returns the whole local table and ignores `q`, so the
    // match has to happen here to mirror the mock path's behaviour.
    const q = (query ?? '').trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.firstName} ${e.middleName} ${e.surname}`.toLowerCase().includes(q)
      || e.externalEmployeeId.toLowerCase().includes(q),
    );
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
