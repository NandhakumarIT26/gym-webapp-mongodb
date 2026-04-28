import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, DollarSign, X, ExternalLink, Check, Trash2 } from 'lucide-react';
import api from '../api/client';

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ member_id: '', amount: '', notes: '', upi_id: '' });
    const [saving, setSaving] = useState(false);

    const fetchAll = () => {
        Promise.all([api.get('/payments'), api.get('/members')]).then(([p, m]) => {
            setPayments(p.data);
            setMembers(m.data);
        }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.post('/payments/generate-link', form);
            toast.success('Payment record created!');
            setModal(false);
            setForm({ member_id: '', amount: '', notes: '', upi_id: '' });
            fetchAll();
            // Optionally open payment link
            if (data.payment_link) {
                toast('Payment link generated!', { icon: '🔗' });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally {
            setSaving(false);
        }
    };

    const markPaid = async (id) => {
        try {
            await api.put(`/payments/${id}/status`, { status: 'Paid' });
            toast.success('Marked as paid!');
            fetchAll();
        } catch { toast.error('Failed'); }
    };

    const deletePayment = async (id) => {
        if (!window.confirm('Delete this payment record?')) return;
        try {
            await api.delete(`/payments/${id}`);
            toast.success('Deleted');
            fetchAll();
        } catch { toast.error('Failed'); }
    };

    const sendViaWhatsApp = async (payment) => {
        const member = members.find(m => m.id === payment.member_id);
        if (!member) return;
        const msg = `Hi ${payment.member_name}! Your gym membership renewal amount is ₹${Number(payment.amount).toLocaleString('en-IN')}. ${payment.payment_link ? `Pay here: ${payment.payment_link}` : 'Please visit the gym to renew.'}`;
        const phone = member.phone.replace(/\D/g, '');
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div><h1>Payment Links</h1><p>Generate and track member payment records</p></div>
                    <button className="btn btn-primary" onClick={() => setModal(true)} id="add-payment-btn"><Plus size={16} /> Generate Link</button>
                </div>
            </div>

            {loading ? <div className="loading"><div className="spinner" /></div> : (
                payments.length === 0 ? (
                    <div className="card empty-state">
                        <span className="icon">💳</span>
                        <p>No payment records yet.</p>
                        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Generate First Link</button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Member</th><th>Phone</th><th>Amount</th><th>Status</th><th>Notes</th><th>Date</th><th>Actions</th></tr></thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.member_name}</td>
                                        <td className="text-muted">{p.phone}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={`badge ${p.status === 'Paid' ? 'badge-active' : 'badge-warning'}`}>{p.status}</span>
                                        </td>
                                        <td className="text-muted" style={{ maxWidth: 200 }}>{p.notes || '—'}</td>
                                        <td className="text-muted">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="btn btn-whatsapp btn-sm" onClick={() => sendViaWhatsApp(p)} title="Send via WhatsApp">💬</button>
                                                {p.status === 'Pending' && (
                                                    <button className="btn btn-success btn-sm" onClick={() => markPaid(p.id)} title="Mark as Paid"><Check size={13} /></button>
                                                )}
                                                {p.payment_link && (
                                                    <a href={p.payment_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="Open Payment Link"><ExternalLink size={13} /></a>
                                                )}
                                                <button className="btn btn-danger btn-sm" onClick={() => deletePayment(p.id)} title="Delete"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Generate Payment Link</h2>
                            <button className="btn-icon" onClick={() => setModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Member *</label>
                                <select className="form-select" value={form.member_id} onChange={e => {
                                    const m = members.find(m => m.id == e.target.value);
                                    setForm({ ...form, member_id: e.target.value, amount: m?.plan_price || form.amount });
                                }} required id="payment-member">
                                    <option value="">-- Select Member --</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name} – {m.phone}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="999" required min="1" id="payment-amount" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">UPI ID (optional)</label>
                                    <input className="form-input" value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="gym@upi" id="payment-upi" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Monthly renewal" id="payment-notes" />
                            </div>
                            {form.upi_id && (
                                <div style={{ padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--success)', marginBottom: 12 }}>
                                    ✓ A UPI deep link will be generated for GPay / PhonePe / Paytm.
                                </div>
                            )}
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving} id="save-payment">
                                    <DollarSign size={15} /> {saving ? 'Creating...' : 'Create Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
