import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function EnquiryModal({ enquiry, onClose, onSuccess }) {
    const isEdit = !!enquiry;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: enquiry?.name || '',
        phone: enquiry?.phone || '',
        email: enquiry?.email || '',
        date_of_enquiry: enquiry?.date_of_enquiry ? new Date(enquiry.date_of_enquiry).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        follow_up_date: enquiry?.follow_up_date ? new Date(enquiry.follow_up_date).toISOString().split('T')[0] : '',
        status: enquiry?.status || 'Open',
        notes: enquiry?.notes || '',
    });

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                const { data } = await api.put(`/enquiries/${enquiry.id}`, formData);
                toast.success('Enquiry updated');
                onSuccess(data);
            } else {
                const { data } = await api.post('/enquiries', formData);
                toast.success('Enquiry created');
                onSuccess(data);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Failed to save enquiry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={(e) => { if (e.target.className === 'modal-backdrop') onClose(); }}>
            <div className="modal card" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Enquiry' : 'Add Enquiry'}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group row">
                            <div className="col">
                                <label>Date of Enquiry *</label>
                                <input
                                    type="date"
                                    name="date_of_enquiry"
                                    value={formData.date_of_enquiry}
                                    onChange={handleChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="col">
                                <label>Follow Up Date</label>
                                <input
                                    type="date"
                                    name="follow_up_date"
                                    value={formData.follow_up_date}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="Open">Open</option>
                                <option value="Converted">Converted</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="form-input"
                                rows="3"
                                placeholder="E.g. Called and they are interested in annual plan..."
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                                {loading ? 'Saving...' : 'Save Enquiry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
