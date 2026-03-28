import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Users, UserCheck, UserX, AlertTriangle, Activity, ArrowRight } from 'lucide-react';
import api from '../api/client';

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ background: bg, color }}>
            <Icon size={22} />
        </div>
        <div className="stat-info">
            <div className="label">{label}</div>
            <div className="value">{value ?? '–'}</div>
        </div>
    </div>
);

const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                <div style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{payload[0].value} check-ins</div>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /></div>;

    const { stats, recent_checkins, expiring_members, weekly_attendance } = data || {};

    const chartData = weekly_attendance?.map(d => ({
        date: new Date(d.check_in_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        checkins: d.count,
    })) || [];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's your gym at a glance.</p>
            </div>

            {/* Stats */}
            <div className="grid-5" style={{ marginBottom: 28 }}>
                <StatCard label="Total Members" value={stats?.total_members} icon={Users} color="#6c63ff" bg="rgba(108,99,255,0.15)" />
                <StatCard label="Active" value={stats?.active_members} icon={UserCheck} color="#22d3a0" bg="rgba(34,211,160,0.12)" />
                <StatCard label="Expired" value={stats?.expired_members} icon={UserX} color="#ef4444" bg="rgba(239,68,68,0.12)" />
                <StatCard label="Expiring Soon" value={stats?.expiring_soon} icon={AlertTriangle} color="#f59e0b" bg="rgba(245,158,11,0.12)" />
                <StatCard label="Today's Check-ins" value={stats?.today_checkins} icon={Activity} color="#3b82f6" bg="rgba(59,130,246,0.12)" />
            </div>

            <div className="grid-2">
                {/* Chart */}
                <div className="card">
                    <div className="section-title"><Activity size={16} /> Weekly Attendance</div>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={customTooltip} cursor={{ fill: 'var(--primary-glow)' }} />
                                <Bar dataKey="checkins" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>No check-in data yet.</p></div>
                    )}
                </div>

                {/* Expiring soon */}
                <div className="card">
                    <div className="section-title" style={{ justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} color="var(--warning)" /> Expiring Soon</span>
                        <Link to="/reminders" className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}>View All <ArrowRight size={13} /></Link>
                    </div>
                    {expiring_members?.length > 0 ? expiring_members.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>
                            </div>
                            <span className="badge badge-warning">{new Date(m.expiry_date).toLocaleDateString('en-IN')}</span>
                        </div>
                    )) : <div className="empty-state" style={{ padding: '24px 0' }}><p>No expiring memberships 🎉</p></div>}
                </div>
            </div>

            {/* Recent check-ins */}
            <div className="card mt-6">
                <div className="section-title" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={16} /> Today's Check-ins</span>
                    <Link to="/attendance" className="btn btn-sm btn-secondary" style={{ fontSize: 11 }}>All Records <ArrowRight size={13} /></Link>
                </div>
                {recent_checkins?.length > 0 ? (
                    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead><tr><th>Member</th><th>Phone</th><th>Time</th><th>Method</th></tr></thead>
                            <tbody>
                                {recent_checkins.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.member_name}</td>
                                        <td className="text-muted">{c.phone}</td>
                                        <td>{c.check_in_time}</td>
                                        <td><span className={`badge ${c.method === 'qr' ? 'badge-info' : 'badge-active'}`}>{c.method}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className="empty-state" style={{ padding: '24px 0' }}><p>No check-ins today yet.</p></div>}
            </div>
        </div>
    );
}
