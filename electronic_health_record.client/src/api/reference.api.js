import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';

export async function getMedicalConditions() {
  if (USE_MOCK) {
    await delay(120);
    return db.read().medicalConditions;
  }
  try {
    const { data } = await client.get('/medicalconditions');
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Distinct patients per Past Medical History condition, for visits in one
 * period -- the dashboard's donut: { total, conditions: [{ conditionID,
 * name, count }], years }. granularity 'day' takes { year, month, day },
 * 'month' takes { year, month }, 'year' takes { year }. No USE_MOCK branch:
 * the mock db has no wellness forms to aggregate over.
 */
export async function getDiagnosedConditions(params) {
  try {
    const { data } = await client.get('/medicalconditions/diagnosed', { params });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}
