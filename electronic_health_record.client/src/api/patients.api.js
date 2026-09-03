import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

export async function searchEmployees(query) {
  if (USE_MOCK) {
    await delay(150);
    const q = (query ?? '').trim().toLowerCase();
    if (q.length < 2) return [];
    return db.read().employees.filter((e) =>
      `${e.firstName} ${e.middleName} ${e.surname}`.toLowerCase().includes(q)
      || e.externalEmployeeId.toLowerCase().includes(q),
    ).slice(0, 20);
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
