import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Phone, Calendar } from 'lucide-react';
import api from '../api/client';
import EnquiryModal from '../components/EnquiryModal';

export default function Enquiries() {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingEnquiry, setEditingEnquiry] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const fetchEnquiries = async (q = '') => {
        setLoading(true);
        try {
            const { data } = await api.get('/enquiries', { params: q ? { search: q } : {} });
            setEnquiries(data);
        } catch { 
            toast.error('Failed to load enquiries'); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchEnquiries(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEnquiries(search);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete enquiry from "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/enquiries/${id}`);
            toast.success('Enquiry deleted');
            fetchEnquiries(search);
        } catch { toast.error('Delete failed'); }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'var(--primary)';
            case 'Converted': return 'var(--success)';
            case 'Closed': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <div>
            <div className="page-header">
                <div className="header-row">
                    <div>
                        <h1>Enquiries</h1>
                        <p>Manage membership enquiries and follow-ups</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={16} /> Add Enquiry
                    </button>
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
                        />
                    </div>
                    <button type="submit" className="btn btn-secondary">Search</button>
                    {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchEnquiries(); }}>Clear</button>}
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>{enquiries.length} record{enquiries.length !== 1 ? 's' : ''}</span>
                </form>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner" /></div>
            ) : enquiries.length === 0 ? (
                <div className="card empty-state">
                    <span className="icon">📞</span>
                    <p>No enquiries found.</p>
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}><Plus size={16} /> Add First Enquiry</button>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Date of Enquiry</th>
                                <th>Follow Up Date</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enquiries.map((eq, i) => (
                                <tr key={eq.id}>
                                    <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{eq.name}</td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                            <Phone size={13} />{eq.phone}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                            <Calendar size={13} />{eq.date_of_enquiry ? new Date(eq.date_of_enquiry).toLocaleDateString('en-IN') : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {eq.follow_up_date ? (
                                                <><Calendar size={13} style={{ color: 'var(--warning)' }} />{new Date(eq.follow_up_date).toLocaleDateString('en-IN')}</>
                                            ) : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge`} style={{ color: getStatusColor(eq.status), borderColor: getStatusColor(eq.status) }}>
                                            {eq.status}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-dim)' }}>
                                        {eq.notes || '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon" title="Edit" onClick={() => setEditingEnquiry(eq)}><Edit2 size={15} /></button>
                                            <button className="btn-icon" title="Delete" onClick={() => handleDelete(eq.id, eq.name)} style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(isAdding || editingEnquiry) && (
                <EnquiryModal
                    enquiry={editingEnquiry}
                    onClose={() => {
                        setIsAdding(false);
                        setEditingEnquiry(null);
                    }}
                    onSuccess={(updatedOrNewEnquiry) => {
                        setIsAdding(false);
                        setEditingEnquiry(null);
                        // Refresh to respect server-side ordering/searching
                        fetchEnquiries(search); 
                    }}
                />
            )}
        </div>
    );
}
