import axios from 'axios';
import { getToken } from '../lib/session';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;