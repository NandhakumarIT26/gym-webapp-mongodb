const pool = require('../config/db');

// GET /api/enquiries
const getEnquiries = async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM enquiries';
        const params = [];
        
        if (search) {
            query += ' WHERE name LIKE ? OR phone LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/enquiries/:id
const getEnquiryById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Enquiry not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/enquiries
const createEnquiry = async (req, res) => {
    try {
        const { name, phone, email, date_of_enquiry, follow_up_date, status, notes } = req.body;
        if (!name || !phone || !date_of_enquiry)
            return res.status(400).json({ error: 'Name, phone, and date_of_enquiry are required' });

        const [result] = await pool.query(
            `INSERT INTO enquiries (name, phone, email, date_of_enquiry, follow_up_date, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                phone,
                email || null,
                date_of_enquiry,
                follow_up_date || null,
                status || 'Open',
                notes || null
            ]
        );

        const enquiryId = result.insertId;
        const [newEnquiry] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
        res.status(201).json(newEnquiry[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PUT /api/enquiries/:id
const updateEnquiry = async (req, res) => {
    try {
        const { name, phone, email, date_of_enquiry, follow_up_date, status, notes } = req.body;
        if (!name || !phone || !date_of_enquiry)
            return res.status(400).json({ error: 'Name, phone, and date_of_enquiry are required' });

        const [result] = await pool.query(
            `UPDATE enquiries SET name=?, phone=?, email=?, date_of_enquiry=?, follow_up_date=?, status=?, notes=?
             WHERE id=?`,
            [name, phone, email || null, date_of_enquiry, follow_up_date || null, status || 'Open', notes || null, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
        
        const [updated] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/enquiries/:id
const deleteEnquiry = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Enquiry not found' });
        res.json({ message: 'Enquiry deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry };
