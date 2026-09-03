import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';
import { ROLES } from '../lib/constants';

const SESSION_KEY = 'ehr-session';

export async function login({ identifier, password, role }) {
  if (USE_MOCK) {
    await delay();
    const state = db.read();
    let user = null;

    if (role === ROLES.ADMIN) {
      const admin = state.admins.find(
        (a) => a.username === identifier && a.password === password && a.isActive,
      );
      if (admin) {
        user = { id: admin.adminID, name: admin.fullName, role: ROLES.ADMIN };
      }
    } else if (role === ROLES.DOCTOR) {
      const doc = state.physicians.find(
        (p) => p.username === identifier && p.password === password,
      );
      if (doc) {
        user = {
          id: doc.physicianID,
          name: `Dr. ${doc.firstName} ${doc.surname}`,
          prcLicenseNo: doc.prcLicenseNo,
          role: ROLES.DOCTOR,
        };
      }
    } else if (role === ROLES.PATIENT) {
      const patient = state.patients.find(
        (p) => p.externalEmployeeId === identifier,
      );
      const account = patient && state.patientAccounts.find(
        (a) => a.patientID === patient.patientID,
      );
      if (account && account.password === password) {
        user = {
          id: account.patientAccountID,
          patientID: patient.patientID,
          name: `${patient.firstName} ${patient.surname}`,
          role: ROLES.PATIENT,
        };
      }
    }

    if (!user) {
      const err = new Error('Invalid credentials.');
      err.status = 401;
      throw err;
    }

    const session = { token: `mock-${role}-${user.id}`, user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('ehr-token', session.token);
    return session;
  }

  try {
    const { data } = await client.post('/auth/login', { identifier, password, role });
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    localStorage.setItem('ehr-token', data.token);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('ehr-token');
  localStorage.removeItem('ehr-station');
  if (!USE_MOCK) {
    try { await client.post('/auth/logout'); } catch { /* best effort */ }
  }
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
