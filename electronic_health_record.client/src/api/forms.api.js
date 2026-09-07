import api from '../config/axios';
import { toApiError } from './client';

/**
 * Get wellness forms by status.
 *
 * Used by Station 1, Station 2, and Station 3 queues.
 */
export async function getQueue(status) {
    try {
        const wanted = Array.isArray(status) ? status : [status];

        const { data } = await api.get('/wellnessforms', {
            params: {
                status: wanted.join(','),
            },
        });

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Get all wellness forms.
 */
export async function getAllForms() {
    try {
        const { data } = await api.get('/wellnessforms');

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Get a single wellness form.
 */
export async function getForm(formID) {
    try {
        const { data } = await api.get(
            `/wellnessforms/${formID}`
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Station 1:
 * Create a new wellness form.
 *
 * The authenticated Admin identity is resolved
 * by the backend from the JWT.
 */
export async function submitStation1({
    patient,
    vitals,
}) {
    try {
        const { data } = await api.post(
            '/wellnessforms/station1',
            {
                patient,
                vitals,
            }
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Station 2:
 * Submit assessment answers.
 */
export async function submitStation2({
    formID,
    answers,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station2`,
            {
                answers,
                rowVersion,
            }
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Station 3:
 * Submit physician consultation.
 *
 * The authenticated Physician identity is resolved
 * by the backend from the JWT.
 */
export async function submitStation3({
    formID,
    consultation,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station3`,
            {
                ...consultation,
                rowVersion,
            }
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Cancel a wellness form.
 *
 * The authenticated Admin identity is resolved
 * by the backend from the JWT.
 */
export async function cancelForm({
    formID,
    reason,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/cancel`,
            {
                reason,
                rowVersion,
            }
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Get wellness form activity/audit logs.
 */
export async function getActivityLogs() {
    try {
        const { data } = await api.get(
            '/wellnessformauditlogs'
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Get the authenticated patient's wellness forms.
 *
 * IMPORTANT:
 * The patientID argument is intentionally removed.
 *
 * The backend determines the patient from the authenticated
 * JWT:
 *
 * JWT PatientAccountID
 *        ↓
 * PatientAccount
 *        ↓
 * PatientID
 *
 * Endpoint:
 * GET /api/wellnessforms/mine
 */
export async function getPatientForms() {
    try {
        const { data } = await api.get(
            '/wellnessforms/mine'
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}