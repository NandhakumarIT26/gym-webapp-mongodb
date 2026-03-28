import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, PlusCircle, Trash2, ChevronLeft, ChevronRight, X, User, CreditCard, Calendar, ChevronDown } from 'lucide-react';
import api from '../api/client';

const CATEGORIES = [
    'Rent', 'Electricity', 'Salaries', 'Equipment', 'Maintenance',
    'Marketing', 'Supplies', 'Insurance', 'Internet', 'Other'
];

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Finance() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Rent', description: '' });
    const [error, setError] = useState('');
    const [incomePanel, setIncomePanel] = useState(false);
    const [incomeDetails, setIncomeDetails] = useState([]);
    const [incomeLoading, setIncomeLoading] = useState(false);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const fetchData = useCallback(async () => {
        setLoading(true);
        setIncomePanel(false);
        setIncomeDetails([]);
        try {
            const [summaryRes, expensesRes] = await Promise.all([
                api.get(`/finance/summary?month=${month}&year=${year}`),
                api.get(`/finance/expenses?month=${month}&year=${year}`),
            ]);
            setSummary(summaryRes.data);
            setExpenses(expensesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    const fetchIncomeBreakdown = async () => {
        if (incomePanel) { setIncomePanel(false); return; }
        setIncomeLoading(true);
        setIncomePanel(true);
        try {
            const res = await api.get(`/finance/income?month=${month}&year=${year}`);
            setIncomeDetails(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIncomeLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.date || !form.amount || !form.category) { setError('Date, amount, and category are required.'); return; }
        setSubmitting(true);
        setError('');
        try {
            await api.post('/finance/expenses', form);
            setForm({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Rent', description: '' });
            setShowForm(false);
            fetchData();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to add expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await api.delete(`/finance/expenses/${id}`);
            fetchData();
        } catch (e) {
            alert('Failed to delete expense');
        }
    };

    const netColor = summary && summary.net_profit >= 0 ? 'var(--success)' : 'var(--danger)';

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1>Finance Tracker</h1>
                        <p>Track income from memberships and manage daily expenses</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
                        <PlusCircle size={16} /> {showForm ? 'Cancel' : 'Add Expense'}
                    </button>
                </div>
            </div>

            {/* Month Navigator */}
            <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
                <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 130, textAlign: 'center' }}>
                    {monthNames[month - 1]} {year}
                </span>
                <button className="btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>Monthly Overview</span>
            </div>

            {/* Summary Cards */}
            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="grid-3" style={{ marginBottom: 24 }}>
                        {/* ── Income Card (clickable) ── */}
                        <div
                            className="stat-card"
                            onClick={fetchIncomeBreakdown}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', border: incomePanel ? '1px solid var(--success)' : undefined, boxShadow: incomePanel ? '0 0 0 2px rgba(34,211,160,0.18)' : undefined }}
                            title="Click to see income breakdown"
                        >
                            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>
                                <TrendingUp size={22} color="var(--success)" />
                            </div>
                            <div className="stat-info" style={{ flex: 1 }}>
                                <div className="label">Total Income</div>
                                <div className="value" style={{ color: 'var(--success)', fontSize: 22 }}>
                                    {fmt(summary?.total_income)}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>From paid memberships</div>
                            </div>
                            <ChevronDown size={16} color="var(--success)" style={{ transform: incomePanel ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: 'var(--danger-bg)' }}>
                                <TrendingDown size={22} color="var(--danger)" />
                            </div>
                            <div className="stat-info">
                                <div className="label">Total Expenses</div>
                                <div className="value" style={{ color: 'var(--danger)', fontSize: 22 }}>
                                    {fmt(summary?.total_expenses)}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Operational costs</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: summary?.net_profit >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)' }}>
                                <Wallet size={22} color={netColor} />
                            </div>
                            <div className="stat-info">
                                <div className="label">Net Profit</div>
                                <div className="value" style={{ color: netColor, fontSize: 22 }}>
                                    {fmt(summary?.net_profit)}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Income − Expenses</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Income Breakdown Panel ── */}
                    {incomePanel && (
                        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--success)', boxShadow: '0 0 0 2px rgba(34,211,160,0.12)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div className="section-title" style={{ marginBottom: 0 }}>💰 Income Breakdown — {monthNames[month - 1]} {year}</div>
                                <button className="btn-icon" onClick={() => setIncomePanel(false)} title="Close"><X size={15} /></button>
                            </div>

                            {incomeLoading ? (
                                <div className="loading"><div className="spinner" /></div>
                            ) : incomeDetails.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px 0' }}>
                                    <span className="icon">📭</span>
                                    <p>No paid income recorded for this month</p>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Member</span></th>
                                                <th><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CreditCard size={11} /> Plan</span></th>
                                                <th><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Date</span></th>
                                                <th>Notes</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {incomeDetails.map(pay => (
                                                <tr key={pay.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{pay.member_name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{pay.member_phone}</div>
                                                    </td>
                                                    <td>
                                                        {pay.plan_name ? (
                                                            <span className="badge badge-info">{pay.plan_name}</span>
                                                        ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        {new Date(pay.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{pay.notes || '—'}</td>
                                                    <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>{fmt(pay.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: 'var(--bg-card2)' }}>
                                                <td colSpan={4} style={{ fontWeight: 600, padding: '12px 16px', color: 'var(--text-muted)' }}>Total ({incomeDetails.length} payment{incomeDetails.length !== 1 ? 's' : ''})</td>
                                                <td style={{ fontWeight: 700, color: 'var(--success)', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                    {fmt(incomeDetails.reduce((s, p) => s + parseFloat(p.amount), 0))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Category Breakdown */}
                    {summary?.categories?.length > 0 && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="section-title">📊 Expense Breakdown by Category</div>
                            <div className="grid-3" style={{ gap: 12 }}>
                                {summary.categories.map(cat => (
                                    <div key={cat.category} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{cat.category}</div>
                                        <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 16 }}>{fmt(cat.total)}</div>
                                        <div style={{ height: 3, background: 'var(--bg-hover)', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 99, background: 'var(--danger)',
                                                width: `${Math.min(100, (parseFloat(cat.total) / parseFloat(summary.total_expenses || 1)) * 100)}%`
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add Expense Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: 24, borderColor: 'var(--primary)', boxShadow: '0 0 0 2px var(--primary-glow)' }}>
                    <div className="section-title" style={{ marginBottom: 20 }}>➕ New Expense</div>
                    {error && <div className="checkin-result error" style={{ marginBottom: 16 }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row" style={{ marginBottom: 16 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Date *</label>
                                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Amount (₹) *</label>
                                <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-row" style={{ marginBottom: 16 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Category *</label>
                                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Description</label>
                                <input type="text" className="form-input" placeholder="Optional notes..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses Table */}
            <div className="card">
                <div className="section-title" style={{ marginBottom: 16 }}>📋 Expenses — {monthNames[month - 1]} {year}</div>
                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : expenses.length === 0 ? (
                    <div className="empty-state">
                        <span className="icon">💸</span>
                        <p>No expenses recorded for this month</p>
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <PlusCircle size={16} /> Add First Expense
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td>
                                            <span className="badge badge-warning">{exp.category}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{exp.description || '—'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--danger)', whiteSpace: 'nowrap' }}>{fmt(exp.amount)}</td>
                                        <td>
                                            <button className="btn-icon" onClick={() => handleDelete(exp.id)} title="Delete expense"
                                                style={{ color: 'var(--danger)' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
