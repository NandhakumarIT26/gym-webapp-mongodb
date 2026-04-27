const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const { serializeAttendance, serializeMember } = require('../utils/serializers');

const getDashboard = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(`${todayStr}T00:00:00.000Z`);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const members = await Member.find().populate('plan_id');

    let activeMembers = 0;
    let expiredMembers = 0;
    let expiringSoon = 0;

    members.forEach((m) => {
      if (!m.expiry_date || new Date(m.expiry_date) >= today) {
        activeMembers += 1;
      }
      if (m.expiry_date && new Date(m.expiry_date) < today) {
        expiredMembers += 1;
      }
      if (m.expiry_date && new Date(m.expiry_date) >= today && new Date(m.expiry_date) <= in7Days) {
        expiringSoon += 1;
      }
    });

    const todayAttendance = await Attendance.countDocuments({ check_in_date: today });

    const recentCheckinsRaw = await Attendance.find({ check_in_date: today })
      .populate({ path: 'member_id', select: 'name phone' })
      .sort({ check_in_time: -1 })
      .limit(10);

    const expiringMembersRaw = members
      .filter((m) => m.expiry_date && new Date(m.expiry_date) >= today && new Date(m.expiry_date) <= in7Days)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .slice(0, 10);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekly = await Attendance.aggregate([
      { $match: { check_in_date: { $gte: weekStart } } },
      {
        $group: {
          _id: '$check_in_date',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const weeklyAttendance = weekly.map((w) => ({
      check_in_date: new Date(w._id).toISOString().split('T')[0],
      count: w.count,
    }));

    return res.json({
      stats: {
        total_members: members.length,
        active_members: activeMembers,
        expired_members: expiredMembers,
        expiring_soon: expiringSoon,
        today_checkins: todayAttendance,
      },
      recent_checkins: recentCheckinsRaw.map(serializeAttendance),
      expiring_members: expiringMembersRaw.map(serializeMember),
      weekly_attendance: weeklyAttendance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboard };
