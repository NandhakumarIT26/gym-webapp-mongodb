import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, RefreshCw, Calendar, CreditCard, Banknote, Smartphone } from 'lucide-react';
import api from '../api/client';

const MODE_PLAN = 'plan';
const MODE_CUSTOM = 'custom';

export default function RenewModal({ member, onClose, onSuccess }) {
    const [plans, setPlans] = useState([]);
    const [mode, setMode] = useState(MODE_PLAN);
    const [form, setForm] = useState({
        plan_id: '',
        custom_days: '',
        amount: '',
        payment_method: 'cash', // 'cash' | 'online'
        upi_id: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    // Pre-fill amount when plan changes
    useEffect(() => {
        api.get('/plans').then(r => {
            setPlans(r.data);
            // Pre-select member's current plan if it exists
            if (member.plan_id) {
                const current = r.data.find(p => p.id === member.plan_id);
                if (current) setForm(f => ({ ...f, plan_id: current.id, amount: current.price }));
            }
        }).catch(() => { });
    }, [member.plan_id]);

    const handlePlanChange = (e) => {
        const pid = e.target.value;
        const selected = plans.find(p => p.id == pid);
        setForm(f => ({ ...f, plan_id: pid, amount: selected ? selected.price : f.amount }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                plan_id: mode === MODE_PLAN ? form.plan_id || undefined : undefined,
                custom_days: mode === MODE_CUSTOM ? form.custom_days : undefined,
                amount: form.amount || undefined,
                payment_method: form.payment_method,
                upi_id: form.upi_id || undefined,
                notes: form.notes || undefined,
            };
            const { data } = await api.post(`/members/${member.id}/renew`, payload);
            toast.success(data.message);
            onSuccess(data.member);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Renewal failed');
        } finally {
            setLoading(false);
        }
    };

    const currentExpiry = member.expiry_date
        ? new Date(member.expiry_date).toLocaleDateString('en-IN')
        : 'Not set';

    const previewNewExpiry = () => {
        const durationDays =
            mode === MODE_PLAN
                ? plans.find(p => p.id == form.plan_id)?.duration_days
                : parseInt(form.custom_days, 10);
        if (!durationDays || isNaN(durationDays)) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const base = member.expiry_date && new Date(member.expiry_date) > today
            ? new Date(member.expiry_date) : today;
        base.setDate(base.getDate() + durationDays);
        return base.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const newExpiry = previewNewExpiry();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={20} color="var(--primary)" /> Renew Membership
                    </h2>
                    <button className="btn-icon" onClick={onClose}><X size={16} /></button>
                </div>

                {/* Member info */}
                <div style={{
                    padding: '12px 16px', marginBottom: 20, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-base)', border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontWeight: 700 }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current expiry</div>
                        <div style={{
                            fontWeight: 600, fontSize: 13,
                            color: member.status === 'Expired' ? 'var(--danger)' : 'var(--text)',
                        }}>{currentExpiry}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Plan type toggle */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 18, padding: 4, background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
                        <button type="button" className={`btn btn-sm ${mode === MODE_PLAN ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }} onClick={() => setMode(MODE_PLAN)}>
                            <CreditCard size={14} /> Use a Plan
                        </button>
                        <button type="button" className={`btn btn-sm ${mode === MODE_CUSTOM ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none' }} onClick={() => setMode(MODE_CUSTOM)}>
                            <Calendar size={14} /> Custom Days
                        </button>
                    </div>

                    {mode === MODE_PLAN ? (
                        <div className="form-group">
                            <label className="form-label">Membership Plan *</label>
                            <select className="form-select" value={form.plan_id} onChange={handlePlanChange} required id="renew-plan">
                                <option value="">-- Select Plan --</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} — ₹{Number(p.price).toLocaleString('en-IN')} / {p.duration_days} days
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Custom Days *</label>
                                <input className="form-input" type="number" min="1" placeholder="e.g. 45" value={form.custom_days}
                                    onChange={e => setForm(f => ({ ...f, custom_days: e.target.value }))} required id="renew-days" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input className="form-input" type="number" min="0" placeholder="Optional" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} id="renew-amount-custom" />
                            </div>
                        </div>
                    )}

                    {/* Preview new expiry */}
                    {newExpiry && (
                        <div style={{
                            padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
                            background: 'var(--success-bg)', border: '1px solid rgba(34,211,160,0.2)',
                            fontSize: 13, color: 'var(--success)',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Calendar size={14} />
                            New expiry date will be: <strong>{newExpiry}</strong>
                        </div>
                    )}

                    {/* Payment details */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Details</div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input className="form-input" type="number" min="0" placeholder="e.g. 999" value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} id="renew-amount" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Method</label>
                                <select className="form-select" value={form.payment_method}
                                    onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} id="renew-method">
                                    <option value="cash">Cash (Paid in person)</option>
                                    <option value="online">Online (Pending / UPI)</option>
                                </select>
                            </div>
                        </div>

                        {form.payment_method === 'online' && (
                            <div className="form-group">
                                <label className="form-label">Your UPI ID (optional)</label>
                                <input className="form-input" value={form.upi_id}
                                    onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
                                    placeholder="gym@upi (for GPay / PhonePe / Paytm link)" id="renew-upi" />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <input className="form-input" value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="e.g. Paid via PhonePe" id="renew-notes" />
                        </div>
                    </div>

                    {/* Payment method context */}
                    <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {form.payment_method === 'cash'
                            ? <><Banknote size={13} /> Payment will be recorded as <strong>Paid</strong> immediately.</>
                            : <><Smartphone size={13} /> Payment will be recorded as <strong>Pending</strong> until confirmed.</>}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} id="confirm-renew">
                            <RefreshCw size={15} /> {loading ? 'Renewing...' : 'Confirm Renewal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
