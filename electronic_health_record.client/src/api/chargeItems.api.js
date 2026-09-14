import api from '../config/axios';
import { toApiError } from './client';

/**
 * The admin-owned billing catalog (replaces the old hardcoded
 * DIAGNOSTIC_TEST_CATALOG client array). Read is open to any authenticated
 * station -- Station 3's pickers need this -- only the writes below are
 * superadmin-only, enforced server-side.
 */
export async function getChargeItems({ type, active } = {}) {
  try {
    const { data } = await api.get('/chargeitems', {
      params: { type, active },
    });
    return data.data ?? data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createChargeItem(item) {
  try {
    const { data } = await api.post('/chargeitems', item);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Every field is sent -- no partial-patch semantics. */
export async function updateChargeItem(id, item) {
  try {
    const { data } = await api.put(`/chargeitems/${id}`, item);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Soft-delete: the item is retired (IsActive = false), never removed. */
export async function retireChargeItem(id) {
  try {
    const { data } = await api.delete(`/chargeitems/${id}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}
