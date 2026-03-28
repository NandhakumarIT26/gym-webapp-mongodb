const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/members
const getMembers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
      SELECT m.*, p.name AS plan_name, p.price AS plan_price, p.duration_days
      FROM members m
      LEFT JOIN membership_plans p ON m.plan_id = p.id
    `;
        const params = [];
        if (search) {
            query += ' WHERE m.name LIKE ? OR m.phone LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY m.created_at DESC';
        const [rows] = await pool.query(query, params);

        // Auto-update status based on expiry
        const today = new Date();
        const updated = rows.map((m) => ({
            ...m,
            status: m.expiry_date && new Date(m.expiry_date) < today ? 'Expired' : 'Active',
        }));
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/members/:id
const getMemberById = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT m.*, p.name AS plan_name, p.price AS plan_price, p.duration_days
       FROM members m
       LEFT JOIN membership_plans p ON m.plan_id = p.id
       WHERE m.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Member not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/members
const createMember = async (req, res) => {
    try {
        const { name, phone, email, address, plan_id, join_date, amount, payment_method, notes } = req.body;
        if (!name || !phone || !join_date)
            return res.status(400).json({ error: 'Name, phone, and join_date are required' });

        // Auto-calculate expiry and get plan price
        let expiry_date = null;
        let planPrice = null;
        if (plan_id) {
            const [plans] = await pool.query('SELECT duration_days, price FROM membership_plans WHERE id = ?', [plan_id]);
            if (plans.length > 0) {
                const d = new Date(join_date);
                d.setDate(d.getDate() + plans[0].duration_days);
                expiry_date = d.toISOString().split('T')[0];
                planPrice = plans[0].price;
            }
        }

        const qr_token = uuidv4();
        const [result] = await pool.query(
            `INSERT INTO members (name, phone, email, address, plan_id, join_date, expiry_date, status, qr_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                phone,
                email || null,
                address || null,
                plan_id || null,
                join_date,
                expiry_date,
                expiry_date && new Date(expiry_date) >= new Date() ? 'Active' : 'Active',
                qr_token,
            ]
        );

        const memberId = result.insertId;

        // Auto-create a payment record for the joining fee
        if (plan_id && planPrice !== null) {
            const paidAmount = amount && parseFloat(amount) > 0 ? parseFloat(amount) : parseFloat(planPrice);
            const payStatus = payment_method === 'online' ? 'Pending' : 'Paid'; // cash = Paid instantly
            await pool.query(
                'INSERT INTO payments (member_id, amount, payment_link, status, notes) VALUES (?, ?, ?, ?, ?)',
                [memberId, paidAmount, '', payStatus, notes || `New membership - joined ${join_date}`]
            );
        }

        const [newMember] = await pool.query('SELECT * FROM members WHERE id = ?', [memberId]);
        res.status(201).json(newMember[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/members/:id
const updateMember = async (req, res) => {
    try {
        const { name, phone, email, address, plan_id, join_date } = req.body;

        // Recalculate expiry
        let expiry_date = req.body.expiry_date || null;
        if (plan_id && join_date) {
            const [plans] = await pool.query('SELECT duration_days FROM membership_plans WHERE id = ?', [plan_id]);
            if (plans.length > 0) {
                const d = new Date(join_date);
                d.setDate(d.getDate() + plans[0].duration_days);
                expiry_date = d.toISOString().split('T')[0];
            }
        }

        const status = expiry_date && new Date(expiry_date) < new Date() ? 'Expired' : 'Active';

        await pool.query(
            `UPDATE members SET name=?, phone=?, email=?, address=?, plan_id=?, join_date=?, expiry_date=?, status=?
       WHERE id=?`,
            [name, phone, email || null, address || null, plan_id || null, join_date, expiry_date, status, req.params.id]
        );
        const [updated] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
        if (updated.length === 0) return res.status(404).json({ error: 'Member not found' });
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/members/:id
const deleteMember = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM members WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Member not found' });
        res.json({ message: 'Member deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/members/:id/renew
const renewMember = async (req, res) => {
    try {
        const { plan_id, custom_days, amount, payment_method, notes, upi_id } = req.body;
        if (!plan_id && !custom_days)
            return res.status(400).json({ error: 'Either plan_id or custom_days is required' });

        const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
        if (members.length === 0) return res.status(404).json({ error: 'Member not found' });
        const member = members[0];

        // Calculate how many days to add
        let durationDays = 0;
        let resolvedPlanId = member.plan_id;

        if (plan_id) {
            const [plans] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [plan_id]);
            if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
            durationDays = plans[0].duration_days;
            resolvedPlanId = plan_id;
        } else {
            durationDays = parseInt(custom_days, 10);
            if (isNaN(durationDays) || durationDays < 1)
                return res.status(400).json({ error: 'custom_days must be a positive number' });
        }

        // Extend from whichever is later: today or current expiry_date (stackable renewals)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const baseDate =
            member.expiry_date && new Date(member.expiry_date) > today
                ? new Date(member.expiry_date)
                : today;

        baseDate.setDate(baseDate.getDate() + durationDays);
        const new_expiry = baseDate.toISOString().split('T')[0];

        // Update member
        await pool.query(
            'UPDATE members SET expiry_date=?, status=?, plan_id=? WHERE id=?',
            [new_expiry, 'Active', resolvedPlanId || member.plan_id, req.params.id]
        );

        // Log a payment record if amount provided
        if (amount && parseFloat(amount) > 0) {
            let payment_link = '';
            if (upi_id) {
                const upiParams = new URLSearchParams({
                    pa: upi_id, pn: 'Gym Management',
                    am: amount, cu: 'INR',
                    tn: `Membership renewal - ${member.name}`,
                });
                payment_link = `upi://pay?${upiParams.toString()}`;
            }
            const paymentStatus = payment_method === 'cash' ? 'Paid' : 'Pending';
            await pool.query(
                'INSERT INTO payments (member_id, amount, payment_link, status, notes) VALUES (?, ?, ?, ?, ?)',
                [member.id, amount, payment_link, paymentStatus,
                notes || `Membership renewed for ${durationDays} days`]
            );
        }

        const [updated] = await pool.query(
            `SELECT m.*, p.name AS plan_name, p.price AS plan_price, p.duration_days
       FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id
       WHERE m.id = ?`,
            [req.params.id]
        );

        res.json({
            message: `Membership renewed! New expiry: ${new_expiry}`,
            member: updated[0],
            new_expiry,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getMembers, getMemberById, createMember, updateMember, deleteMember, renewMember };

