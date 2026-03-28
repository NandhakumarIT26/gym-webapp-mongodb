import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, AlertTriangle, XCircle } from 'lucide-react';
import api from '../api/client';

const ReminderCard = ({ member, urgency, onSend }) => {
    const expiryDate = member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-IN') : 'N/A';
    return (
        <div className="reminder-member-card">
            <div>
                <div className="reminder-member-info">
                    <div className="name">{member.name}</div>
                    <div className="meta">
                        📞 {member.phone}
                        {member.plan_name && <> · {member.plan_name}</>}
                        {' · '}<span style={{ color: urgency === 'expired' ? 'var(--danger)' : 'var(--warning)' }}>Expiry: {expiryDate}</span>
                    </div>
                </div>
            </div>
            <div className="reminder-actions">
                <button className="btn btn-whatsapp btn-sm" onClick={() => onSend(member.id, 'WhatsApp')}>
                    💬 WhatsApp
                </button>
                <button className="btn btn-sms btn-sm" onClick={() => onSend(member.id, 'SMS')}>
                    📱 SMS
                </button>
            </div>
        </div>
    );
};

export default function Reminders() {
    const [data, setData] = useState({ expired: [], expiring_in_3_days: [], expiring_in_7_days: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const remindersRes = await api.get('/reminders/expiring');
            setData(remindersRes.data);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSend = async (member_id, via) => {
        try {
            const { data: res } = await api.post('/reminders/send', { member_id, via });
            window.open(res.shareUrl, '_blank');
            toast.success(`${via} reminder link opened!`);
        } catch {
            toast.error('Failed to generate reminder');
        }
    };

    const total = data.expired.length + data.expiring_in_3_days.length + data.expiring_in_7_days.length;

    if (loading) return <div className="loading"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Renewal Reminders</h1>
                <p>Send membership renewal reminders via WhatsApp or SMS</p>
            </div>

            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><XCircle size={22} /></div>
                    <div className="stat-info"><div className="label">Expired</div><div className="value">{data.expired.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><AlertTriangle size={22} /></div>
                    <div className="stat-info"><div className="label">Expiring in 3 Days</div><div className="value">{data.expiring_in_3_days.length}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Bell size={22} /></div>
                    <div className="stat-info"><div className="label">Expiring in 7 Days</div><div className="value">{data.expiring_in_7_days.length}</div></div>
                </div>
            </div>

            {total === 0 ? (
                <div className="card empty-state">
                    <span className="icon">🎉</span>
                    <p>All memberships are active. No renewals needed!</p>
                </div>
            ) : (
                <>
                    {data.expiring_in_3_days.length > 0 && (
                        <div className="reminder-group">
                            <div className="section-title" style={{ color: 'var(--warning)' }}>
                                <AlertTriangle size={16} /> Expiring in 3 Days ({data.expiring_in_3_days.length})
                            </div>
                            {data.expiring_in_3_days.map(m => <ReminderCard key={m.id} member={m} urgency="3days" onSend={handleSend} />)}
                        </div>
                    )}

                    {data.expiring_in_7_days.length > 0 && (
                        <div className="reminder-group">
                            <div className="section-title" style={{ color: 'var(--primary)' }}>
                                <Bell size={16} /> Expiring in 4–7 Days ({data.expiring_in_7_days.length})
                            </div>
                            {data.expiring_in_7_days.map(m => <ReminderCard key={m.id} member={m} urgency="7days" onSend={handleSend} />)}
                        </div>
                    )}

                    {data.expired.length > 0 && (
                        <div className="reminder-group">
                            <div className="section-title" style={{ color: 'var(--danger)' }}>
                                <XCircle size={16} /> Expired Memberships ({data.expired.length})
                            </div>
                            {data.expired.map(m => <ReminderCard key={m.id} member={m} urgency="expired" onSend={handleSend} />)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
