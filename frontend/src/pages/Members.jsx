import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Eye, Phone, Calendar, RefreshCw } from 'lucide-react';
import api from '../api/client';
import RenewModal from '../components/RenewModal';

export default function Members() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [renewingMember, setRenewingMember] = useState(null);
    const navigate = useNavigate();

    const fetchMembers = async (q = '') => {
        setLoading(true);
        try {
            const { data } = await api.get('/members', { params: q ? { search: q } : {} });
            setMembers(data);
        } catch { toast.error('Failed to load members'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMembers(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMembers(search);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete member "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/members/${id}`);
            toast.success('Member deleted');
            fetchMembers(search);
        } catch { toast.error('Delete failed'); }
    };

    const daysUntilExpiry = (expiry) => {
        if (!expiry) return null;
        return Math.ceil((new Date(expiry) - new Date()) / 86400000);
    };

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1>Members</h1>
                        <p>Manage all your gym members</p>
                    </div>
                    <Link to="/members/new" className="btn btn-primary">
                        <Plus size={16} /> Add Member
                    </Link>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            id="member-search"
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                    {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchMembers(); }}>Clear</button>}
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                </form>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : members.length === 0 ? (
                <div className="card empty-state">
                    <span className="icon">👥</span>
                    <p>No members found.</p>
                    <Link to="/members/new" className="btn btn-primary"><Plus size={16} /> Add First Member</Link>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Plan</th>
                                <th>Join Date</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m, i) => {
                                const days = daysUntilExpiry(m.expiry_date);
                                return (
                                    <tr key={m.id}>
                                        <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                                <Phone size={13} />{m.phone}
                                            </span>
                                        </td>
                                        <td>{m.plan_name || <span className="text-muted">—</span>}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                                <Calendar size={13} />{m.join_date ? new Date(m.join_date).toLocaleDateString('en-IN') : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {m.expiry_date ? (
                                                <div>
                                                    <div>{new Date(m.expiry_date).toLocaleDateString('en-IN')}</div>
                                                    {days !== null && days >= 0 && days <= 7 && (
                                                        <div style={{ fontSize: 11, color: 'var(--warning)' }}>{days === 0 ? 'Expires today!' : `${days}d left`}</div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${m.status === 'Active' ? 'badge-active' : 'badge-expired'}`}>{m.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn-icon" title="View" onClick={() => navigate(`/members/${m.id}`)}><Eye size={15} /></button>
                                                <button className="btn-icon" title="Edit" onClick={() => navigate(`/members/${m.id}/edit`)}><Edit2 size={15} /></button>
                                                <button
                                                    className="btn-icon"
                                                    title="Renew Membership"
                                                    onClick={() => setRenewingMember(m)}
                                                    style={{
                                                        color: 'var(--primary)',
                                                        background: m.status === 'Expired' ? 'var(--primary-glow)' : undefined,
                                                    }}
                                                >
                                                    <RefreshCw size={15} />
                                                </button>
                                                <button className="btn-icon" title="Delete" onClick={() => handleDelete(m.id, m.name)} style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {renewingMember && (
                <RenewModal
                    member={renewingMember}
                    onClose={() => setRenewingMember(null)}
                    onSuccess={(updatedMember) => {
                        setMembers(prev => prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
                    }}
                />
            )}
        </div>
    );
}
