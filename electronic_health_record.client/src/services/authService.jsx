import api from '../config/axios';
import { getSession, setSession, clearSession } from '../lib/session';
import { clearStations } from '../lib/stationStorage';
import { ROLES } from '../lib/constants';

export { getSession };

// Server-side table names don't always match our ROLES values 1:1
// (Physician table -> 'doctor' role in the frontend).
const ACCOUNT_TYPE_TO_ROLE = {
    admin: ROLES.ADMIN,
    physician: ROLES.DOCTOR,
    patient: ROLES.PATIENT,
};

export async function login({ identifier, password }) {
    const response = await api.post('/Auth/login', {
        username: identifier,
        password,
    });

    const {
        token,
        expiresAt,
        accountId,
        username,
        fullName,
        accountType,
        role,
        station,
    } = response.data;

    const tableRole =
        ACCOUNT_TYPE_TO_ROLE[accountType?.toLowerCase()];

    const user = {
        accountId,
        username,
        fullName,
        role: tableRole,
        adminRole:
            tableRole === ROLES.ADMIN
                ? role?.toLowerCase()
                : null,
        // Which desk this doctor staffs, assigned by an admin at onboarding.
        // Null for admins and patients: only doctors are pinned to a station
        // by their account.
        station:
            tableRole === ROLES.DOCTOR
                ? station ?? null
                : null,
    };

    const session = {
        token,
        expiresAt,
        user,
    };

    setSession(session);

    return session;
}

export async function changePassword({
    currentPassword,
    newPassword,
    confirmPassword,
}) {
    const response = await api.post('/Auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
    });

    return response.data;
}

export async function logout() {
    try {
        await api.post('/Auth/logout');
    } catch (error) {
        console.error('Logout request failed:', error);
    } finally {
        clearSession();
        // The station choice is per device, not per account, so it has to go
        // with the session -- otherwise the next person to sign in here
        // inherits the last user's desk and never sees the picker.
        clearStations();
    }
}