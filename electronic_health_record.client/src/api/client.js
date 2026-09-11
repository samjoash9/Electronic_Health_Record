import axios from 'axios';
import { getToken } from '../lib/session';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Reads the token through lib/session so this instance and config/axios.jsx
// stay on one storage key. They previously disagreed -- this one looked for an
// 'ehr-token' that nothing writes, so every request through it went out
// unauthenticated. The X-Stub-* identity headers that used to be set here are
// gone with the stub they fed: CurrentUser resolves the account from the JWT's
// own claims (PrincipalType + NameIdentifier), so the token is all that is
// needed to identify the caller.
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
