import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import api from '../api/client';

const emptyPlan = { name: '', price: '', duration_days: '', description: '' };

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'add' | 'edit'
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState(emptyPlan);
    const [saving, setSaving] = useState(false);

    const fetchPlans = () => {
        api.get('/plans').then(r => setPlans(r.data)).catch(() => toast.error('Failed to load plans')).finally(() => setLoading(false));
    };

    useEffect(() => { fetchPlans(); }, []);

    const openAdd = () => { setForm(emptyPlan); setEditingPlan(null); setModal('add'); };
    const openEdit = (p) => { setForm({ name: p.name, price: p.price, duration_days: p.duration_days, description: p.description || '' }); setEditingPlan(p); setModal('edit'); };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (modal === 'edit') {
                await api.put(`/plans/${editingPlan.id}`, form);
                toast.success('Plan updated!');
            } else {
                await api.post('/plans', form);
                toast.success('Plan created!');
            }
            fetchPlans();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete plan "${p.name}"?`)) return;
        try {
            await api.delete(`/plans/${p.id}`);
            toast.success('Plan deleted');
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div><h1>Membership Plans</h1><p>Manage your gym's subscription plans</p></div>
                    <button className="btn btn-primary" onClick={openAdd} id="add-plan-btn"><Plus size={16} /> Add Plan</button>
                </div>
            </div>

            {loading ? <div className="loading"><div className="spinner" /></div> : (
                <div className="grid-3">
                    {plans.map(p => (
                        <div key={p.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--primary), #9b8fff)' }} />
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</div>
                                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
                                    ₹{Number(p.price).toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{p.duration_days} days</div>
                                {p.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>{p.description}</p>}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(p)}><Edit2 size={14} /> Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="card empty-state" style={{ gridColumn: '1/-1' }}>
                            <span className="icon">📋</span>
                            <p>No plans yet. Create your first plan!</p>
                            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Plan</button>
                        </div>
                    )}
                </div>
            )}

            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modal === 'edit' ? 'Edit Plan' : 'Add New Plan'}</h2>
                            <button className="btn-icon" onClick={closeModal}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Plan Name *</label>
                                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly" required id="plan-name" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Price (₹) *</label>
                                    <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="999" required min="0" id="plan-price" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (days) *</label>
                                    <input className="form-input" type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} placeholder="30" required min="1" id="plan-duration" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving} id="save-plan">
                                    <Save size={15} /> {saving ? 'Saving...' : modal === 'edit' ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
