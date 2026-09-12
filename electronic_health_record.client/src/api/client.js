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

// ASP.NET ModelState rejections carry no `message` -- the reasons live under
// `errors` as { FieldName: [...] }. Without this they surfaced as axios's bare
// "Request failed with status code 400", which says nothing about what was wrong.
function validationMessage(data) {
  const fields = data?.errors && typeof data.errors === 'object' ? data.errors : null;
  if (!fields) return null;

  const reasons = Object.values(fields).flat().filter(Boolean);
  return reasons.length ? reasons.join(' ') : null;
}

/** Normalises axios errors so callers only ever read `.status` and `.message`. */
export function toApiError(error) {
  const data = error?.response?.data;
  const err = new Error(
    data?.message ?? validationMessage(data) ?? error?.message ?? 'Request failed',
  );
  err.status = error?.response?.status ?? 0;
  return err;
}

export function conflictError(message = 'This record was changed at another station.') {
  const err = new Error(message);
  err.status = 409;
  return err;
}
