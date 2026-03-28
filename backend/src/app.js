require('dotenv').config();
const express = require('express');
const cors = require('cors');
const initDB = require('./config/initDB');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const planRoutes = require('./routes/plans');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reminderRoutes = require('./routes/reminders');
const paymentRoutes = require('./routes/payments');
const financeRoutes = require('./routes/finance');
const enquiryRoutes = require('./routes/enquiries');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/enquiries', enquiryRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Initialize DB tables, then start server
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🏋️  Gym Management API running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to initialize database. Check your .env DB credentials.', err.message);
        process.exit(1);
    });

module.exports = app;
