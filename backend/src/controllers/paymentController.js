const pool = require('../config/db');

// GET /api/payments
const getPayments = async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.*, m.name AS member_name, m.phone
      FROM payments p JOIN members m ON p.member_id = m.id
      ORDER BY p.created_at DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/payments/generate-link
const generatePaymentLink = async (req, res) => {
    try {
        const { member_id, amount, notes, upi_id } = req.body;
        if (!member_id || !amount) return res.status(400).json({ error: 'member_id and amount required' });

        const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
        if (members.length === 0) return res.status(404).json({ error: 'Member not found' });

        const member = members[0];

        // Build UPI payment link (works with GPay, PhonePe, Paytm etc.)
        let payment_link = '';
        if (upi_id) {
            const upiParams = new URLSearchParams({
                pa: upi_id,
                pn: 'Gym Management',
                am: amount,
                cu: 'INR',
                tn: `Gym membership renewal - ${member.name}`,
            });
            payment_link = `upi://pay?${upiParams.toString()}`;
        }

        const [result] = await pool.query(
            'INSERT INTO payments (member_id, amount, payment_link, status, notes) VALUES (?, ?, ?, ?, ?)',
            [member_id, amount, payment_link, 'Pending', notes || null]
        );

        const [payment] = await pool.query(
            `SELECT p.*, m.name AS member_name, m.phone FROM payments p JOIN members m ON p.member_id = m.id WHERE p.id = ?`,
            [result.insertId]
        );

        res.status(201).json(payment[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/payments/:id/status
const updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Paid'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const [result] = await pool.query('UPDATE payments SET status=? WHERE id=?', [status, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });

        const [payment] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
        res.json(payment[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/payments/:id
const deletePayment = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Payment not found' });
        res.json({ message: 'Payment deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getPayments, generatePaymentLink, updatePaymentStatus, deletePayment };
