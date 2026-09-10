const SESSION_KEY = 'session';

export function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Failed to parse stored session:', error);
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

export function getToken() {
    return getSession()?.token ?? null;
}