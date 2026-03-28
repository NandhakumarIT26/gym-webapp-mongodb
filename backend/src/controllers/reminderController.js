const pool = require('../config/db');

// GET /api/reminders/expiring
const getExpiringMembers = async (req, res) => {
    try {
        const [expiredList] = await pool.query(`
      SELECT m.*, p.name AS plan_name
      FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.expiry_date < CURDATE()
      ORDER BY m.expiry_date DESC
    `);

        const [expiring3] = await pool.query(`
      SELECT m.*, p.name AS plan_name
      FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      ORDER BY m.expiry_date ASC
    `);

        const [expiring7] = await pool.query(`
      SELECT m.*, p.name AS plan_name
      FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.expiry_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 4 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY m.expiry_date ASC
    `);

        res.json({
            expired: expiredList,
            expiring_in_3_days: expiring3,
            expiring_in_7_days: expiring7,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/reminders/send — log reminder and return share link
const sendReminder = async (req, res) => {
    try {
        const { member_id, via, payment_link } = req.body;
        if (!member_id || !via) return res.status(400).json({ error: 'member_id and via are required' });

        const [members] = await pool.query(
            'SELECT m.*, p.name AS plan_name FROM members m LEFT JOIN membership_plans p ON m.plan_id = p.id WHERE m.id = ?',
            [member_id]
        );
        if (members.length === 0) return res.status(404).json({ error: 'Member not found' });

        const member = members[0];
        const expiryFormatted = member.expiry_date
            ? new Date(member.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';

        const payLink = payment_link || '';
        const message = `Hi ${member.name}! Your gym membership expires on ${expiryFormatted}. Renew now to continue your fitness journey!${payLink ? ` Pay here: ${payLink}` : ''}`;

        // Log to DB
        await pool.query(
            'INSERT INTO reminders (member_id, sent_via, message) VALUES (?, ?, ?)',
            [member_id, via === 'SMS' ? 'SMS' : 'WhatsApp', message]
        );

        // Generate shareable link
        const encodedMsg = encodeURIComponent(message);
        const phone = member.phone.replace(/\D/g, '');
        let shareUrl = '';
        if (via === 'WhatsApp') {
            shareUrl = `https://wa.me/${phone}?text=${encodedMsg}`;
        } else {
            shareUrl = `sms:${phone}?body=${encodedMsg}`;
        }

        res.json({ message: 'Reminder logged', shareUrl, messageText: message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getExpiringMembers, sendReminder };
