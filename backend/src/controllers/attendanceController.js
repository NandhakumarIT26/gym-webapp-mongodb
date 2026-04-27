const QRCode = require('qrcode');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const { serializeAttendance } = require('../utils/serializers');
const { formatDate } = require('../utils/date');

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);

const getAttendance = async (req, res) => {
  try {
    const { date, member_id } = req.query;
    const filter = {};

    if (date) {
      filter.check_in_date = dateOnly(date);
    }
    if (member_id) {
      filter.member_id = member_id;
    }

    const rows = await Attendance.find(filter)
      .populate({ path: 'member_id', select: 'name phone' })
      .sort({ check_in_date: -1, check_in_time: -1 })
      .limit(100);

    return res.json(rows.map(serializeAttendance));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const manualCheckin = async (req, res) => {
  try {
    const { search } = req.body;
    if (!search) return res.status(400).json({ error: 'Search term required' });

    const members = await Member.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    })
      .select('name phone')
      .limit(5);

    if (members.length === 0) return res.status(404).json({ error: 'No member found' });

    if (members.length > 1) {
      return res.json({
        multiple: true,
        members: members.map((m) => ({ id: m._id.toString(), name: m.name, phone: m.phone })),
      });
    }

    return recordCheckin(members[0]._id.toString(), 'manual', res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const checkinById = async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ error: 'member_id required' });
    return recordCheckin(member_id, 'manual', res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const qrCheckin = async (req, res) => {
  try {
    const { qr_token } = req.body;
    if (!qr_token) return res.status(400).json({ error: 'qr_token required' });

    const member = await Member.findOne({ qr_token });
    if (!member) return res.status(404).json({ error: 'Invalid QR code' });

    return recordCheckin(member._id.toString(), 'qr', res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getMemberQR = async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId).select('qr_token name');
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const qrData = `GYM_QR:${member.qr_token}`;
    const qrImage = await QRCode.toDataURL(qrData, { width: 300 });

    return res.json({ qr: qrImage, name: member.name, qr_token: member.qr_token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

async function recordCheckin(memberId, method, res) {
  const now = new Date();
  const check_in_date = formatDate(now);
  const check_in_time = now.toTimeString().split(' ')[0];

  try {
    await Attendance.create({
      member_id: memberId,
      check_in_date: dateOnly(check_in_date),
      check_in_time,
      method,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Already checked in today', alreadyCheckedIn: true });
    }
    throw err;
  }

  const member = await Member.findById(memberId).populate('plan_id');
  return res.status(201).json({
    message: 'Check-in recorded',
    member: member
      ? {
          id: member._id.toString(),
          name: member.name,
          phone: member.phone,
          plan_id: member.plan_id ? member.plan_id._id.toString() : null,
        }
      : null,
    check_in_date,
    check_in_time,
  });
}

module.exports = { getAttendance, manualCheckin, checkinById, qrCheckin, getMemberQR };
