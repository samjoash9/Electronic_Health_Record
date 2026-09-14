import api from '../config/axios';
import { toApiError } from './client';

/**
 * Station 6: the global default allotment every patient's visit gets
 * (decision 2 -- one global default, no per-agency or per-patient override).
 */
export async function getBillingSettings() {
  try {
    const { data } = await api.get('/billing/settings');
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Superadmin only, enforced server-side. */
export async function updateBillingSettings(defaultAllotment) {
  try {
    const { data } = await api.put('/billing/settings', { defaultAllotment });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Station 6 queue: one row per form that has reached billing, with the
 * patient's own allotment/total/remaining already computed server-side.
 */
export async function getBillingQueue({ status = 'All', q = '', page = 1, pageSize = 25 } = {}) {
  try {
    const { data } = await api.get('/billing/forms', {
      params: { status, q, page, pageSize },
    });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** The full invoice for one form: grouped charge lines, totals, billing status. */
export async function getInvoice(formId) {
  try {
    const { data } = await api.get(`/billing/forms/${formId}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * A conflict carrying the exact overage (decision 3: warn, then allow).
 * The bare status/message a plain toApiError would give is not enough for
 * the override dialog to show "exceeds by ₱X" -- it needs the numbers off
 * the 409 body itself, so this reads the raw axios error before normalising.
 */
function isOverageConflict(error) {
  return error?.response?.status === 409 && typeof error?.response?.data?.overage === 'number';
}

/**
 * Approve a bill and deduct it from the patient's allotment.
 *
 * The first call omits overrideReason. If the total exceeds the allotment,
 * the server returns 409 with { totalCharged, allotment, overage } instead
 * of approving -- the caller shows that to the admin, then resubmits with a
 * reason to proceed (see BillingOverageDto / ApproveBillingDto server-side).
 */
export async function approveBilling(formId, { rowVersion, overrideReason } = {}) {
  try {
    const { data } = await api.post(`/billing/forms/${formId}/approve`, {
      rowVersion,
      overrideReason,
    });
    return data;
  } catch (error) {
    if (isOverageConflict(error)) {
      const overageError = new Error(error.response.data.message ?? 'This bill exceeds the allotment.');
      overageError.status = 409;
      overageError.isOverage = true;
      overageError.totalCharged = error.response.data.totalCharged;
      overageError.allotment = error.response.data.allotment;
      overageError.overage = error.response.data.overage;
      throw overageError;
    }
    throw toApiError(error);
  }
}
