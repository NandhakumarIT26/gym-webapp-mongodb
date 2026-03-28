const pool = require('../config/db');

// GET /api/plans
const getPlans = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM membership_plans ORDER BY duration_days ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/plans
const createPlan = async (req, res) => {
    try {
        const { name, price, duration_days, description } = req.body;
        if (!name || !price || !duration_days)
            return res.status(400).json({ error: 'Name, price, and duration_days are required' });

        const [result] = await pool.query(
            'INSERT INTO membership_plans (name, price, duration_days, description) VALUES (?, ?, ?, ?)',
            [name, price, duration_days, description || null]
        );
        const [plan] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [result.insertId]);
        res.status(201).json(plan[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/plans/:id
const updatePlan = async (req, res) => {
    try {
        const { name, price, duration_days, description } = req.body;
        const [result] = await pool.query(
            'UPDATE membership_plans SET name=?, price=?, duration_days=?, description=? WHERE id=?',
            [name, price, duration_days, description || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Plan not found' });
        const [plan] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [req.params.id]);
        res.json(plan[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/plans/:id
const deletePlan = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM membership_plans WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Plan not found' });
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
