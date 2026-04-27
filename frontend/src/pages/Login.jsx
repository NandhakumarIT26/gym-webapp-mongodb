import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Login() {
    const [mode, setMode] = useState('loading'); // 'loading' | 'login' | 'register'
    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Check if first-time setup is needed
    useEffect(() => {
        api.get('/auth/setup-status')
            .then(({ data }) => setMode(data.needsSetup ? 'register' : 'login'))
            .catch(() => setMode('login'));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mode === 'register' && form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
            const { data } = await api.post(endpoint, {
                username: form.username,
                password: form.password,
            });
            const payload = data?.data ?? data;
            const token =
                payload?.token ??
                payload?.accessToken ??
                payload?.jwt ??
                payload?.access?.token;
            if (!token || token === 'undefined' || token === 'null') {
                throw new Error('No token returned from server');
            }
            const username = payload?.username || payload?.user?.username || form.username;
            login({ username }, token);
            navigate('/', { replace: true });
            toast.success(mode === 'register' ? '🎉 Admin account created! Welcome!' : `Welcome back, ${username}!`);
        } catch (err) {
            toast.error(
                err.response?.data?.error ||
                err.message ||
                (mode === 'register' ? 'Registration failed' : 'Login failed')
            );
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'loading') {
        return (
            <div className="login-page">
                <div className="loading"><div className="spinner" /></div>
            </div>
        );
    }

    const isRegister = mode === 'register';

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="brand">
                    <div className="icon">🏋️</div>
                    <h1>GymPro</h1>
                    <p>{isRegister ? 'First-time setup — create your admin account' : 'Gym Management System'}</p>
                </div>

                {isRegister && (
                    <div style={{
                        padding: '10px 14px', marginBottom: 20,
                        background: 'rgba(108,99,255,0.12)', borderRadius: 10,
                        border: '1px solid rgba(108,99,255,0.25)',
                        fontSize: 13, color: 'var(--primary)', textAlign: 'left',
                    }}>
                        👋 Welcome! No admin account found. Create one to get started.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Username</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder={isRegister ? 'Choose a username' : 'admin'}
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            required
                            id="username"
                        />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                            id="password"
                        />
                    </div>
                    {isRegister && (
                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label className="form-label">Confirm Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Re-enter your password"
                                value={form.confirmPassword}
                                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                required
                                id="confirm-password"
                            />
                        </div>
                    )}
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}
                        type="submit"
                        disabled={loading}
                        id="submit-btn"
                    >
                        {loading
                            ? (isRegister ? 'Creating Account...' : 'Signing in...')
                            : (isRegister ? '🚀 Create Admin Account' : 'Sign In')}
                    </button>
                </form>

                {!isRegister && (
                    <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-dim)' }}>
                        Login with your admin credentials
                    </p>
                )}

                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-dim)' }}>
                    {isRegister
                        ? 'Registration is only available once. After this, login is required.'
                        : (
                            <span>
                                Forgot password?{' '}
                                <button
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 11 }}
                                    onClick={() => setMode('register')}
                                >
                                    Check setup status
                                </button>
                            </span>
                        )}
                </div>
            </div>
        </div>
    );
}
