const pool = require('../config/db');

// GET /api/finance/income?month=3&year=2026
const getIncomeBreakdown = async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        const [rows] = await pool.query(
            `SELECT
               p.id,
               p.amount,
               p.notes,
               p.status,
               p.created_at,
               m.name   AS member_name,
               m.phone  AS member_phone,
               mp.name  AS plan_name,
               mp.duration_days
             FROM payments p
             JOIN members m  ON p.member_id  = m.id
             LEFT JOIN membership_plans mp ON m.plan_id = mp.id
             WHERE p.status = 'Paid'
               AND MONTH(p.created_at) = ?
               AND YEAR(p.created_at)  = ?
             ORDER BY p.created_at DESC`,
            [m, y]
        );

        res.json(rows);
    } catch (err) {
        console.error('Income breakdown error:', err);
        res.status(500).json({ error: 'Failed to fetch income breakdown' });
    }
};

// GET /api/finance/summary?month=3&year=2026
const getSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        // Income: sum of paid payments in the given month
        const [incomeRows] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_income
             FROM payments
             WHERE status = 'Paid'
               AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
            [m, y]
        );

        // Expenses: sum of expenses in the given month
        const [expenseRows] = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total_expenses
             FROM expenses
             WHERE MONTH(date) = ? AND YEAR(date) = ?`,
            [m, y]
        );

        // Expense breakdown by category
        const [categoryRows] = await pool.query(
            `SELECT category, COALESCE(SUM(amount), 0) AS total
             FROM expenses
             WHERE MONTH(date) = ? AND YEAR(date) = ?
             GROUP BY category
             ORDER BY total DESC`,
            [m, y]
        );

        const totalIncome = parseFloat(incomeRows[0].total_income);
        const totalExpenses = parseFloat(expenseRows[0].total_expenses);

        res.json({
            month: m,
            year: y,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_profit: totalIncome - totalExpenses,
            categories: categoryRows,
        });
    } catch (err) {
        console.error('Finance summary error:', err);
        res.status(500).json({ error: 'Failed to fetch finance summary' });
    }
};

// GET /api/finance/expenses?month=3&year=2026
const getExpenses = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = `SELECT * FROM expenses`;
        const params = [];

        if (month && year) {
            query += ` WHERE MONTH(date) = ? AND YEAR(date) = ?`;
            params.push(parseInt(month), parseInt(year));
        } else if (year) {
            query += ` WHERE YEAR(date) = ?`;
            params.push(parseInt(year));
        }

        query += ` ORDER BY date DESC, created_at DESC`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Get expenses error:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

// POST /api/finance/expenses
const addExpense = async (req, res) => {
    try {
        const { date, amount, category, description } = req.body;
        if (!date || !amount || !category) {
            return res.status(400).json({ error: 'Date, amount, and category are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO expenses (date, amount, category, description) VALUES (?, ?, ?, ?)`,
            [date, parseFloat(amount), category, description || null]
        );

        const [rows] = await pool.query(`SELECT * FROM expenses WHERE id = ?`, [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Add expense error:', err);
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

// DELETE /api/finance/expenses/:id
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM expenses WHERE id = ?`, [id]);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        console.error('Delete expense error:', err);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

module.exports = { getIncomeBreakdown, getSummary, getExpenses, addExpense, deleteExpense };
