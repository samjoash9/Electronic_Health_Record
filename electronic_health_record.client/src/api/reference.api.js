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
