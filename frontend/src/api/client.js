import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
const isUsableToken = (value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value !== 'undefined' &&
    value !== 'null';

// Attach JWT token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('gym_token');
    if (isUsableToken(token)) config.headers.Authorization = `Bearer ${token.trim()}`;
    return config;
});

// Auto-logout on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('gym_token');
            localStorage.removeItem('gym_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
