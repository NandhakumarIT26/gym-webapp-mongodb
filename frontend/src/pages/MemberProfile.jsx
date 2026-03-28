import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Edit2, ArrowLeft, Phone, Mail, MapPin, Calendar, QrCode, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../api/client';
import RenewModal from '../components/RenewModal';

export default function MemberProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [qr, setQr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [showRenew, setShowRenew] = useState(false);

    const fetchMemberData = async () => {
        setLoading(true);
        try {
            const [mRes, qrRes] = await Promise.all([
                api.get(`/members/${id}`),
                api.get(`/attendance/qr/${id}`),
            ]);
            setMember(mRes.data);
            setQr(qrRes.data);
        } catch (error) {
            toast.error('Failed to load member');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemberData();
    }, [id]);

    const handleCheckin = async () => {
        setCheckinLoading(true);
        try {
            await api.post('/attendance/checkin-by-id', { member_id: id });
            toast.success('Check-in recorded!');
        } catch (err) {
            if (err.response?.data?.alreadyCheckedIn) toast('Already checked in today!', { icon: '✅' });
            else toast.error(err.response?.data?.error || 'Check-in failed');
        } finally {
            setCheckinLoading(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner" /></div>;
    if (!member) return <div className="card"><p>Member not found.</p></div>;

    const daysLeft = member.expiry_date
        ? Math.ceil((new Date(member.expiry_date) - new Date()) / 86400000)
        : null;

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1>{member.name}</h1>
                        <p>Member Profile</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/members')}><ArrowLeft size={16} /> Back</button>
                        <button className="btn btn-primary" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)' }} onClick={() => setShowRenew(true)}>
                            <RefreshCw size={16} /> Renew
                        </button>
                        <Link to={`/members/${id}/edit`} className="btn btn-primary"><Edit2 size={16} /> Edit</Link>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div style={{ display: 'flex', align: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--primary)', fontWeight: 700, border: '2px solid var(--primary)' }}>
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, paddingLeft: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>{member.name}</div>
                            <span className={`badge ${member.status === 'Active' ? 'badge-active' : 'badge-expired'}`}>{member.status}</span>
                        </div>
                    </div>

                    {[
                        { icon: Phone, label: 'Phone', value: member.phone },
                        { icon: Mail, label: 'Email', value: member.email || '—' },
                        { icon: MapPin, label: 'Address', value: member.address || '—' },
                        { icon: Calendar, label: 'Join Date', value: member.join_date ? new Date(member.join_date).toLocaleDateString('en-IN') : '—' },
                        { icon: Calendar, label: 'Expiry Date', value: member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-IN') : '—' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                            <Icon size={16} color="var(--text-dim)" style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                            </div>
                        </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Plan</div>
                        <div style={{ fontWeight: 600 }}>{member.plan_name || '—'}</div>
                        {member.plan_price && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{member.plan_price} / {member.duration_days} days</div>}
                    </div>

                    {daysLeft !== null && (
                        <div style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                            background: daysLeft < 0 ? 'var(--danger-bg)' : daysLeft <= 7 ? 'var(--warning-bg)' : 'var(--success-bg)',
                            color: daysLeft < 0 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--success)',
                            fontSize: 13, fontWeight: 600
                        }}>
                            {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : daysLeft === 0 ? 'Expires today!' : `${daysLeft} days remaining`}
                        </div>
                    )}

                    <button className="btn btn-success w-full" style={{ marginTop: 20, justifyContent: 'center', width: '100%' }} onClick={handleCheckin} disabled={checkinLoading}>
                        <CheckCircle size={16} /> {checkinLoading ? 'Recording...' : 'Manual Check-In'}
                    </button>
                </div>

                <div className="card member-qr-card">
                    <div className="section-title" style={{ justifyContent: 'center' }}><QrCode size={16} /> Member QR Code</div>
                    {qr?.qr ? (
                        <div className="qr-container">
                            <img src={qr.qr} alt={`QR for ${member.name}`} style={{ width: 220, height: 220 }} />
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                                Scan this QR code to record attendance
                            </p>
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                const a = document.createElement('a');
                                a.href = qr.qr;
                                a.download = `${member.name}-qr.png`;
                                a.click();
                            }}>⬇ Download QR</button>
                        </div>
                    ) : <div className="empty-state"><p>QR not available</p></div>}
                </div>
            </div>

            {showRenew && member && (
                <RenewModal
                    member={member}
                    onClose={() => setShowRenew(false)}
                    onSuccess={() => {
                        setShowRenew(false);
                        fetchMemberData();
                    }}
                />
            )}
        </div>
    );
}
