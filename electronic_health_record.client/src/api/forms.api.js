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
 * Stations 2-5:
 * Mark the form as opened at this desk, so every queue for the station
 * shows it in progress. Idempotent; only the first call writes.
 */
export async function startStation(formID, station) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station${station}/start`
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
 * The attending physician is chosen from the registered-doctor list
 * on the form (not taken from whoever is signed in), so physicianID
 * is sent explicitly alongside the consultation fields.
 */
export async function submitStation3({
    formID,
    physicianID,
    consultation,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station3`,
            {
                physicianID,
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
 * Station 4:
 * Submit dental assessment.
 */
export async function submitStation4({
    formID,
    dentistID,
    dentalAssessment,
    dentalSignature,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station4`,
            {
                dentistID,
                dentalAssessment,
                dentalSignature,
                rowVersion,
            }
        );

        return data.data ?? data;
    } catch (error) {
        throw toApiError(error);
    }
}


/**
 * Station 5:
 * Submit vision assessment. Completes the form.
 */
export async function submitStation5({
    formID,
    optometristID,
    visionAssessment,
    visionSignature,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/station5`,
            {
                optometristID,
                visionAssessment,
                visionSignature,
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
 * Superadmin: send a form back to a station it has already passed.
 *
 * Only moves backwards -- the server rejects a target at or ahead of the
 * form's current station. Nothing the stations captured is cleared: the
 * station's own re-submit overwrites its fields and signature, so the previous
 * values stand until it does. Written to the form's audit log.
 */
export async function revertStation({
    formID,
    targetStation,
    reason,
    rowVersion,
}) {
    try {
        const { data } = await api.post(
            `/wellnessforms/${formID}/revert`,
            {
                targetStation,
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
 * Superadmin: correct fields on an existing form.
 *
 * A sparse PATCH -- `changes` carries only the fields the operator actually
 * edited, so correcting one blood pressure reading leaves the other forty
 * fields untouched. A key present with a null value clears that field; a key
 * left out is not touched at all, which is why callers must omit unchanged
 * fields rather than sending them as null.
 *
 * Cannot change status, station routing, or any signature -- the server
 * rejects those outright. Every change is written to the form's audit log.
 */
export async function editForm({
    formID,
    changes,
    reason,
    rowVersion,
}) {
    try {
        const { data } = await api.patch(
            `/wellnessforms/${formID}`,
            {
                ...changes,
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
 * Hard delete a wellness form. Unlike cancelForm, this permanently removes
 * the form and everything that points at it (assessment answers, station
 * 1/4/5 detail rows, the form's own audit log). Superadmin only.
 */
export async function deleteForm({
    formID,
    reason,
    rowVersion,
}) {
    try {
        await api.delete(`/wellnessforms/${formID}`, {
            data: {
                reason,
                rowVersion,
            },
        });
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