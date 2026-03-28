const pool = require('../config/db');

// GET /api/dashboard
const getDashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
        const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        const [[totals]] = await pool.query(`
      SELECT
        COUNT(*) AS total_members,
        SUM(CASE WHEN expiry_date >= CURDATE() OR expiry_date IS NULL THEN 1 ELSE 0 END) AS active_members,
        SUM(CASE WHEN expiry_date < CURDATE() THEN 1 ELSE 0 END) AS expired_members,
        SUM(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_soon
      FROM members
    `);

        const [[todayAttendance]] = await pool.query(
            'SELECT COUNT(*) AS today_checkins FROM attendance WHERE check_in_date = ?',
            [today]
        );

        // Recent check-ins (last 10)
        const [recentCheckins] = await pool.query(`
      SELECT a.*, m.name AS member_name, m.phone
      FROM attendance a JOIN members m ON a.member_id = m.id
      WHERE a.check_in_date = ?
      ORDER BY a.check_in_time DESC LIMIT 10
    `, [today]);

        // Expiring memberships
        const [expiringMembers] = await pool.query(`
      SELECT m.*, p.name AS plan_name
      FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY m.expiry_date ASC LIMIT 10
    `);

        // Monthly attendance for chart (last 7 days)
        const [weeklyAttendance] = await pool.query(`
      SELECT check_in_date, COUNT(*) AS count
      FROM attendance
      WHERE check_in_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY check_in_date
      ORDER BY check_in_date ASC
    `);

        res.json({
            stats: {
                total_members: totals.total_members || 0,
                active_members: totals.active_members || 0,
                expired_members: totals.expired_members || 0,
                expiring_soon: totals.expiring_soon || 0,
                today_checkins: todayAttendance.today_checkins || 0,
            },
            recent_checkins: recentCheckins,
            expiring_members: expiringMembers,
            weekly_attendance: weeklyAttendance,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getDashboard };
