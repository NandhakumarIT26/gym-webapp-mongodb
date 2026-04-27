import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, CheckCircle, QrCode, Clock } from 'lucide-react';
import api from '../api/client';
import QRScanner from '../components/QRScanner';

export default function Attendance() {
    const [search, setSearch] = useState('');
    const [result, setResult] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [qrInput, setQrInput] = useState('');
    const [activeTab, setActiveTab] = useState('manual'); // manual | qr | history
    const audioContextRef = useRef(null);

    useEffect(() => {
        fetchToday();
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => { });
            }
        };
    }, []);

    const playQrSuccessBeep = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextClass();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1046.5, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.2);
        } catch { }
    };

    const fetchToday = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await api.get('/attendance', { params: { date: today } });
            setRecords(data);
        } catch { }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setMembers([]);
        try {
            const { data } = await api.post('/attendance/checkin', { search });
            if (data.multiple) {
                setMembers(data.members);
            } else {
                setResult({ type: 'success', msg: `✓ ${data.member.name} checked in at ${data.check_in_time}` });
                setSearch('');
                fetchToday();
                toast.success('Check-in recorded!');
            }
        } catch (err) {
            if (err.response?.data?.alreadyCheckedIn) {
                setResult({ type: 'error', msg: '⚠ This member has already checked in today.' });
            } else {
                setResult({ type: 'error', msg: err.response?.data?.error || 'Member not found' });
            }
        } finally {
            setLoading(false);
        }
    };

    const checkinById = async (id, name) => {
        try {
            await api.post('/attendance/checkin-by-id', { member_id: id });
            setResult({ type: 'success', msg: `✓ ${name} checked in!` });
            setMembers([]);
            setSearch('');
            fetchToday();
            toast.success('Check-in recorded!');
        } catch (err) {
            if (err.response?.data?.alreadyCheckedIn) toast('Already checked in today!', { icon: '✅' });
            else toast.error(err.response?.data?.error || 'Check-in failed');
        }
    };

    const processQrCheckin = async (qrData) => {
        if (!qrData) return;
        const token = qrData.replace('GYM_QR:', '').trim();
        // Prevent generic duplicate spam while scanning
        try {
            const { data } = await api.post('/attendance/qr-checkin', { qr_token: token });
            toast.success(`${data.member.name} checked in via QR!`);
            playQrSuccessBeep();
            setQrInput('');
            fetchToday();
        } catch (err) {
            // Only toast if not a duplicate scan or if it's a real error
            if (err.response?.data?.alreadyCheckedIn) {
                // If it's already checked in, it's fine, we might just scan multiple times
                // We'll show a toast but not as an error
                toast('Already checked in today!', { icon: '✅', id: 'already-checked-in' });
            }
            else toast.error(err.response?.data?.error || 'Invalid QR', { id: 'invalid-qr' });
        }
    };

    const handleQrCheckin = async (e) => {
        e.preventDefault();
        await processQrCheckin(qrInput);
    };

    const tabs = [
        { id: 'manual', label: 'Manual Check-In', icon: Search },
        { id: 'qr', label: 'QR Check-In', icon: QrCode },
        { id: 'history', label: "Today's Records", icon: Clock },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Attendance</h1>
                <p>Record member check-ins manually or via QR code</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 6, borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(id)} style={{ border: 'none' }}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {activeTab === 'manual' && (
                <div className="card" style={{ maxWidth: 560 }}>
                    <div className="section-title"><Search size={16} /> Search & Check-In</div>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Type member name or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1 }}
                            id="attendance-search"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !search} id="checkin-btn">
                            <CheckCircle size={16} /> {loading ? 'Searching...' : 'Check In'}
                        </button>
                    </form>

                    {members.length > 1 && (
                        <div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Multiple members found. Select one:</p>
                            {members.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.phone}</div>
                                    </div>
                                    <button className="btn btn-success btn-sm" onClick={() => checkinById(m.id, m.name)}>
                                        <CheckCircle size={14} /> Check In
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {result && (
                        <div className={`checkin-result ${result.type}`}>
                            {result.msg}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'qr' && (
                <div className="card" style={{ maxWidth: 560 }}>
                    <div className="section-title"><QrCode size={16} /> QR Code Check-In</div>
                    
                    <div style={{ marginBottom: 20 }}>
                        <QRScanner onScan={(decodedText) => {
                            if (decodedText) {
                                setQrInput(decodedText);
                                processQrCheckin(decodedText);
                            }
                        }} />
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                        Point your camera at the member's QR code. You can also paste the QR token manually below.
                    </p>
                    <form onSubmit={handleQrCheckin} style={{ display: 'flex', gap: 10 }}>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Paste QR token here..."
                            value={qrInput}
                            onChange={e => setQrInput(e.target.value)}
                            style={{ flex: 1 }}
                            id="qr-input"
                        />
                        <button type="submit" className="btn btn-primary" disabled={!qrInput} id="qr-checkin-btn">
                            <CheckCircle size={16} /> Check In
                        </button>
                    </form>
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--info)' }}>
                        💡 Go to a member's profile to view and download their QR code.
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div className="section-title" style={{ marginBottom: 0 }}><Clock size={16} /> Today's Check-ins</div>
                        <span className="badge badge-info">{records.length} total</span>
                    </div>
                    {records.length === 0 ? (
                        <div className="card empty-state"><span className="icon">📋</span><p>No check-ins recorded today.</p></div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>#</th><th>Member</th><th>Phone</th><th>Time</th><th>Method</th></tr></thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={r.id}>
                                            <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{r.member_name}</td>
                                            <td className="text-muted">{r.phone}</td>
                                            <td>{r.check_in_time}</td>
                                            <td><span className={`badge ${r.method === 'qr' ? 'badge-info' : 'badge-active'}`}>{r.method}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
