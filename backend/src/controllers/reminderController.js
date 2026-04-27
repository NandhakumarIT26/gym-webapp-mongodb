const Member = require('../models/Member');
const Reminder = require('../models/Reminder');
const { serializeMember } = require('../utils/serializers');

const getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const in4Days = new Date(today);
    in4Days.setDate(in4Days.getDate() + 4);

    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const all = await Member.find({ expiry_date: { $ne: null } }).populate('plan_id');

    const expired = all
      .filter((m) => new Date(m.expiry_date) < today)
      .sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))
      .map(serializeMember);

    const expiring_in_3_days = all
      .filter((m) => new Date(m.expiry_date) >= today && new Date(m.expiry_date) <= in3Days)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .map(serializeMember);

    const expiring_in_7_days = all
      .filter((m) => new Date(m.expiry_date) >= in4Days && new Date(m.expiry_date) <= in7Days)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .map(serializeMember);

    return res.json({ expired, expiring_in_3_days, expiring_in_7_days });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const sendReminder = async (req, res) => {
  try {
    const { member_id, via, payment_link } = req.body;
    if (!member_id || !via) return res.status(400).json({ error: 'member_id and via are required' });

    const member = await Member.findById(member_id).populate('plan_id');
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const expiryFormatted = member.expiry_date
      ? new Date(member.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';

    const payLink = payment_link || '';
    const message = `Hi ${member.name}! Your gym membership expires on ${expiryFormatted}. Renew now to continue your fitness journey!${payLink ? ` Pay here: ${payLink}` : ''}`;

    await Reminder.create({
      member_id,
      sent_via: via === 'SMS' ? 'SMS' : 'WhatsApp',
      message,
    });

    const encodedMsg = encodeURIComponent(message);
    const phone = member.phone.replace(/\D/g, '');

    const shareUrl = via === 'WhatsApp'
      ? `https://wa.me/${phone}?text=${encodedMsg}`
      : `sms:${phone}?body=${encodedMsg}`;

    return res.json({ message: 'Reminder logged', shareUrl, messageText: message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getExpiringMembers, sendReminder };
