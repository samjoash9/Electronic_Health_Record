import api from '../config/axios';
import { getSession, setSession, clearSession } from '../lib/session';
import { ROLES } from '../lib/constants';

export { getSession };

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
    } = response.data;

    const tableRole = accountType?.toLowerCase(); // 'admin' | 'doctor' | 'patient'

    const user = {
        accountId,
        username,
        fullName,
        role: tableRole,
        adminRole: tableRole === ROLES.ADMIN ? role?.toLowerCase() : null,
    };

    const session = { token, expiresAt, user };

    setSession(session);

    return session;
}

export async function logout() {
    try {
        await api.post('/Auth/logout');
    } catch (error) {
        console.error('Logout request failed:', error);
    } finally {
        clearSession();
    }
}