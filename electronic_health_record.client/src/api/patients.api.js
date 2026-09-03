import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

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
    return data;
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
