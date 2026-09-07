import axios from 'axios';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ehr-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Login stays mock (auth.api.js) even when USE_MOCK is false for everything
  // else, so the server has no session of its own to read identity from yet.
  // Bridge the mock session's id onto the headers ICurrentUser's stub reads
  // (see StubCurrentUser on the server) until real auth replaces both sides.
  const session = readSession();
  if (session?.user) {
    const { role, id } = session.user;
    // superadmin is still role 'admin' (adminRole is a permission tier, not a
    // separate identity) -- same header either way
    if (role === 'admin') config.headers['X-Stub-AdminID'] = id;
    if (role === 'doctor') config.headers['X-Stub-PhysicianID'] = id;
    if (role === 'patient') config.headers['X-Stub-PatientAccountID'] = id;
  }

  return config;
});

function readSession() {
  try {
    const raw = localStorage.getItem('ehr-session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Normalises axios errors so callers only ever read `.status` and `.message`. */
export function toApiError(error) {
  const err = new Error(
    error?.response?.data?.message ?? error?.message ?? 'Request failed',
  );
  err.status = error?.response?.status ?? 0;
  return err;
}

export function conflictError(message = 'This record was changed at another station.') {
  const err = new Error(message);
  err.status = 409;
  return err;
}
