import { USE_MOCK, client, toApiError } from './client';
import { db } from './mock/db';
import { delay } from './mock/delay';
import { ROLES, ADMIN_ROLES } from '../lib/constants';

const SESSION_KEY = 'ehr-session';

export async function login({ identifier, password }) {
  if (USE_MOCK) {
    await delay();
    const state = db.read();
    let user = null;

    const admin = state.admins.find(
      (a) => a.username === identifier && a.password === password && a.isActive,
    );
    if (admin) {
      user = {
        id: admin.adminID,
        name: admin.fullName,
        role: ROLES.ADMIN,
        // permission tier, not a routing role: see ADMIN_ROLES in lib/constants
        adminRole: admin.role ?? ADMIN_ROLES.ADMIN,
      };
    }

    if (!user) {
      const doc = state.physicians.find(
        (p) => p.username === identifier && p.password === password && p.isActive,
      );
      if (doc) {
        user = {
          id: doc.physicianID,
          name: `Dr. ${doc.firstName} ${doc.surname}`,
          prcLicenseNo: doc.prcLicenseNo,
          role: ROLES.DOCTOR,
        };
      }
    }

    if (!user) {
      const account = state.patientAccounts.find(
        (a) => a.username === identifier && a.password === password,
      );
      const patient = account && state.patients.find(
        (p) => p.patientID === account.patientID,
      );
      if (patient) {
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

    const session = { token: `mock-${user.role}-${user.id}`, user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('ehr-token', session.token);
    return session;
  }

  try {
    const { data } = await client.post('/auth/login', { identifier, password });
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
