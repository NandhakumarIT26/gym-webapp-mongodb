const pool = require('../config/db');
const QRCode = require('qrcode');

// GET /api/attendance
const getAttendance = async (req, res) => {
    try {
        const { date, member_id } = req.query;
        let query = `
      SELECT a.*, m.name AS member_name, m.phone
      FROM attendance a
      JOIN members m ON a.member_id = m.id
    `;
        const params = [];
        const conditions = [];
        if (date) { conditions.push('a.check_in_date = ?'); params.push(date); }
        if (member_id) { conditions.push('a.member_id = ?'); params.push(member_id); }
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY a.check_in_date DESC, a.check_in_time DESC LIMIT 100';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/attendance/checkin — manual check-in by name/phone
const manualCheckin = async (req, res) => {
    try {
        const { search } = req.body;
        if (!search) return res.status(400).json({ error: 'Search term required' });

        const [members] = await pool.query(
            'SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? LIMIT 5',
            [`%${search}%`, `%${search}%`]
        );
        if (members.length === 0) return res.status(404).json({ error: 'No member found' });

        // Return matches for selection if more than 1
        if (members.length > 1) return res.json({ multiple: true, members });

        return await recordCheckin(members[0].id, 'manual', res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/attendance/checkin-by-id
const checkinById = async (req, res) => {
    try {
        const { member_id } = req.body;
        if (!member_id) return res.status(400).json({ error: 'member_id required' });
        return await recordCheckin(member_id, 'manual', res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/attendance/qr-checkin
const qrCheckin = async (req, res) => {
    try {
        const { qr_token } = req.body;
        if (!qr_token) return res.status(400).json({ error: 'qr_token required' });

        const [members] = await pool.query('SELECT * FROM members WHERE qr_token = ?', [qr_token]);
        if (members.length === 0) return res.status(404).json({ error: 'Invalid QR code' });

        return await recordCheckin(members[0].id, 'qr', res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/attendance/qr/:memberId — generate QR image
const getMemberQR = async (req, res) => {
    try {
        const [members] = await pool.query('SELECT qr_token, name FROM members WHERE id = ?', [req.params.memberId]);
        if (members.length === 0) return res.status(404).json({ error: 'Member not found' });

        const qrData = `GYM_QR:${members[0].qr_token}`;
        const qrImage = await QRCode.toDataURL(qrData, { width: 300 });
        res.json({ qr: qrImage, name: members[0].name, qr_token: members[0].qr_token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Helper
async function recordCheckin(member_id, method, res) {
    const now = new Date();
    const check_in_date = now.toISOString().split('T')[0];
    const check_in_time = now.toTimeString().split(' ')[0];

    // Check for duplicate check-in today
    const [existing] = await pool.query(
        'SELECT id FROM attendance WHERE member_id = ? AND check_in_date = ?',
        [member_id, check_in_date]
    );
    if (existing.length > 0) {
        return res.status(409).json({ error: 'Already checked in today', alreadyCheckedIn: true });
    }

    await pool.query(
        'INSERT INTO attendance (member_id, check_in_date, check_in_time, method) VALUES (?, ?, ?, ?)',
        [member_id, check_in_date, check_in_time, method]
    );
    const [member] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
    res.status(201).json({ message: 'Check-in recorded', member: member[0], check_in_date, check_in_time });
}

module.exports = { getAttendance, manualCheckin, checkinById, qrCheckin, getMemberQR };
