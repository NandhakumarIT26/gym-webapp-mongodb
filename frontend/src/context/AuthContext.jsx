import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const normalizeToken = (value) => (typeof value === 'string' ? value.trim() : '');
const isValidToken = (value) => {
    const token = normalizeToken(value);
    return Boolean(token) && token !== 'undefined' && token !== 'null';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('gym_user');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch {
            localStorage.removeItem('gym_user');
            return null;
        }
    });
    const [token, setToken] = useState(() => {
        const savedToken = localStorage.getItem('gym_token');
        if (!isValidToken(savedToken)) {
            localStorage.removeItem('gym_token');
            return null;
        }
        return normalizeToken(savedToken);
    });

    const login = (userData, jwt) => {
        if (!isValidToken(jwt)) {
            throw new Error('Missing auth token in login response');
        }
        const cleanToken = normalizeToken(jwt);
        setUser(userData);
        setToken(cleanToken);
        localStorage.setItem('gym_user', JSON.stringify(userData));
        localStorage.setItem('gym_token', cleanToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('gym_user');
        localStorage.removeItem('gym_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: isValidToken(token) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
