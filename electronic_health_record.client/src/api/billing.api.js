import api from '../config/axios';
import { toApiError } from './client';

/**
 * Station 6. A billing form is a budget period: one capital allocation that
 * every visit dated inside it draws down. Consumption is computed server-side
 * from the period's charges on every read, so there is no approve/deduct call
 * here -- recording a lab or medication at Station 3 is what spends the money.
 */
export async function listBillingForms({ q = '' } = {}) {
  try {
    const { data } = await api.get('/billing/forms', { params: { q } });
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** One period with every employee it covers, their visits and charge lines. */
export async function getBillingForm(billingFormId) {
  try {
    const { data } = await api.get(`/billing/forms/${billingFormId}`);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * A 409 carrying the period that already covers these dates. The bare
 * status/message toApiError produces would lose the conflicting period's name
 * and range, which is what makes the error actionable ("overlaps September
 * 2026") rather than generic.
 */
function isOverlapConflict(error) {
  return error?.response?.status === 409
    && typeof error?.response?.data?.conflictingBillingFormID === 'number';
}

function toOverlapError(error) {
  const body = error.response.data;
  const overlapError = new Error(body.message ?? 'This period overlaps an existing billing form.');
  overlapError.status = 409;
  overlapError.isOverlap = true;
  overlapError.conflictingBillingFormID = body.conflictingBillingFormID;
  overlapError.conflictingTitle = body.conflictingTitle;
  overlapError.conflictingStartDate = body.conflictingStartDate;
  overlapError.conflictingEndDate = body.conflictingEndDate;
  return overlapError;
}

/** Superadmin only, enforced server-side. 409 when the range overlaps. */
export async function createBillingForm({ title, startDate, endDate, capital }) {
  try {
    const { data } = await api.post('/billing/forms', { title, startDate, endDate, capital });
    return data;
  } catch (error) {
    if (isOverlapConflict(error)) throw toOverlapError(error);
    throw toApiError(error);
  }
}

/**
 * Editing a period's range moves which visits it covers and editing its
 * capital re-prices it -- both intentional, since consumption is derived
 * rather than snapshotted at creation.
 */
export async function updateBillingForm(billingFormId, { title, startDate, endDate, capital, rowVersion }) {
  try {
    const { data } = await api.put(`/billing/forms/${billingFormId}`, {
      title, startDate, endDate, capital, rowVersion,
    });
    return data;
  } catch (error) {
    if (isOverlapConflict(error)) throw toOverlapError(error);
    throw toApiError(error);
  }
}

/**
 * Removes the budget envelope only. The visits and charges inside the period
 * are untouched -- they simply fall under whichever period covers them next.
 */
export async function deleteBillingForm(billingFormId) {
  try {
    await api.delete(`/billing/forms/${billingFormId}`);
  } catch (error) {
    throw toApiError(error);
  }
}
