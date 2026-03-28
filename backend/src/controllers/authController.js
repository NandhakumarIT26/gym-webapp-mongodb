const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'Username and password required' });

        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({ token, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/auth/register — only allowed if no users exist (first-time setup)
const register = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ error: 'Username and password required' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters' });

        // Block if an admin already exists
        const [existing] = await pool.query('SELECT id FROM users LIMIT 1');
        if (existing.length > 0)
            return res.status(403).json({ error: 'An admin account already exists. Please login.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password_hash]);

        const [newUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const token = jwt.sign(
            { id: newUser[0].id, username: newUser[0].username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({ token, username: newUser[0].username, message: 'Admin account created!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/auth/setup-status — check if first-time setup is needed
const setupStatus = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id FROM users LIMIT 1');
        res.json({ needsSetup: rows.length === 0 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { login, register, setupStatus };
