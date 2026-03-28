import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';
import api from '../api/client';

export default function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', phone: '', email: '', address: '',
        plan_id: '', join_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        api.get('/plans').then(r => setPlans(r.data)).catch(() => { });
        if (isEdit) {
            api.get(`/members/${id}`).then(r => {
                const m = r.data;
                setForm({
                    name: m.name || '',
                    phone: m.phone || '',
                    email: m.email || '',
                    address: m.address || '',
                    plan_id: m.plan_id || '',
                    join_date: m.join_date ? m.join_date.split('T')[0] : new Date().toISOString().split('T')[0],
                });
            }).catch(() => toast.error('Failed to load member'));
        }
    }, [id, isEdit]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/members/${id}`, form);
                toast.success('Member updated!');
            } else {
                await api.post('/members', form);
                toast.success('Member added!');
            }
            navigate('/members');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1>{isEdit ? 'Edit Member' : 'Add New Member'}</h1>
                        <p>{isEdit ? 'Update member details' : 'Fill in the details to add a new gym member'}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/members')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 640 }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Rajan Kumar" id="member-name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number *</label>
                            <input className="form-input" name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. 9876543210" id="member-phone" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Email (optional)</label>
                            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="member@email.com" id="member-email" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Membership Plan</label>
                            <select className="form-select" name="plan_id" value={form.plan_id} onChange={handleChange} id="member-plan">
                                <option value="">-- Select Plan --</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} – ₹{p.price} / {p.duration_days} days</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address (optional)</label>
                        <textarea className="form-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Member's address..." rows={2} id="member-address" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Join Date *</label>
                        <input className="form-input" name="join_date" type="date" value={form.join_date} onChange={handleChange} required id="member-join-date" />
                    </div>
                    {form.plan_id && (
                        <div style={{ padding: '12px 16px', background: 'var(--primary-glow)', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13, color: 'var(--primary)' }}>
                            ✓ Expiry date will be auto-calculated from join date + plan duration.
                        </div>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/members')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} id="save-member">
                            <Save size={15} /> {loading ? 'Saving...' : isEdit ? 'Update Member' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
