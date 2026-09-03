import axios from 'axios';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ehr-token');
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
