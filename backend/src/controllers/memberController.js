const { v4: uuidv4 } = require('uuid');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Reminder = require('../models/Reminder');
const { serializeMember } = require('../utils/serializers');

const getStatusFromExpiry = (expiryDate) => {
  if (!expiryDate) return 'Active';
  return new Date(expiryDate) < new Date() ? 'Expired' : 'Active';
};

const getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const rows = await Member.find(filter)
      .populate('plan_id')
      .sort({ created_at: -1 });

    const updated = rows.map((member) => {
      const serialized = serializeMember(member);
      return {
        ...serialized,
        status: getStatusFromExpiry(serialized.expiry_date),
      };
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('plan_id');
    if (!member) return res.status(404).json({ error: 'Member not found' });
    return res.json(serializeMember(member));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const createMember = async (req, res) => {
  try {
    const { name, phone, email, address, plan_id, join_date, amount, payment_method, notes } = req.body;
    if (!name || !phone || !join_date) {
      return res.status(400).json({ error: 'Name, phone, and join_date are required' });
    }

    let expiryDate = null;
    let planPrice = null;
    let resolvedPlanId = null;

    if (plan_id) {
      const plan = await MembershipPlan.findById(plan_id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const d = new Date(join_date);
      d.setDate(d.getDate() + plan.duration_days);
      expiryDate = d;
      planPrice = plan.price;
      resolvedPlanId = plan._id;
    }

    const member = await Member.create({
      name,
      phone,
      email: email || null,
      address: address || null,
      plan_id: resolvedPlanId,
      join_date: new Date(join_date),
      expiry_date: expiryDate,
      status: 'Active',
      qr_token: uuidv4(),
    });

    if (resolvedPlanId && planPrice !== null) {
      const paidAmount = amount && parseFloat(amount) > 0 ? parseFloat(amount) : parseFloat(planPrice);
      const payStatus = payment_method === 'online' ? 'Pending' : 'Paid';

      await Payment.create({
        member_id: member._id,
        amount: paidAmount,
        payment_link: '',
        status: payStatus,
        notes: notes || `New membership - joined ${join_date}`,
      });
    }

    const saved = await Member.findById(member._id).populate('plan_id');
    return res.status(201).json(serializeMember(saved));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateMember = async (req, res) => {
  try {
    const { name, phone, email, address, plan_id, join_date } = req.body;

    let expiryDate = req.body.expiry_date ? new Date(req.body.expiry_date) : null;
    let resolvedPlanId = plan_id || null;

    if (plan_id && join_date) {
      const plan = await MembershipPlan.findById(plan_id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      const d = new Date(join_date);
      d.setDate(d.getDate() + plan.duration_days);
      expiryDate = d;
    }

    const status = getStatusFromExpiry(expiryDate);

    const updated = await Member.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email: email || null,
        address: address || null,
        plan_id: resolvedPlanId,
        join_date: new Date(join_date),
        expiry_date: expiryDate,
        status,
      },
      { new: true }
    ).populate('plan_id');

    if (!updated) return res.status(404).json({ error: 'Member not found' });
    return res.json(serializeMember(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    await Promise.all([
      Payment.deleteMany({ member_id: req.params.id }),
      Attendance.deleteMany({ member_id: req.params.id }),
      Reminder.deleteMany({ member_id: req.params.id }),
    ]);

    return res.json({ message: 'Member deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const renewMember = async (req, res) => {
  try {
    const { plan_id, custom_days, amount, payment_method, notes, upi_id } = req.body;
    if (!plan_id && !custom_days) {
      return res.status(400).json({ error: 'Either plan_id or custom_days is required' });
    }

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    let durationDays = 0;
    let resolvedPlanId = member.plan_id;

    if (plan_id) {
      const plan = await MembershipPlan.findById(plan_id);
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      durationDays = plan.duration_days;
      resolvedPlanId = plan._id;
    } else {
      durationDays = parseInt(custom_days, 10);
      if (Number.isNaN(durationDays) || durationDays < 1) {
        return res.status(400).json({ error: 'custom_days must be a positive number' });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentExpiry = member.expiry_date ? new Date(member.expiry_date) : null;
    const baseDate = currentExpiry && currentExpiry > today ? currentExpiry : today;
    baseDate.setDate(baseDate.getDate() + durationDays);

    member.expiry_date = baseDate;
    member.status = 'Active';
    member.plan_id = resolvedPlanId || member.plan_id;
    await member.save();

    if (amount && parseFloat(amount) > 0) {
      let payment_link = '';
      if (upi_id) {
        const upiParams = new URLSearchParams({
          pa: upi_id,
          pn: 'Gym Management',
          am: amount,
          cu: 'INR',
          tn: `Membership renewal - ${member.name}`,
        });
        payment_link = `upi://pay?${upiParams.toString()}`;
      }

      const paymentStatus = payment_method === 'cash' ? 'Paid' : 'Pending';
      await Payment.create({
        member_id: member._id,
        amount: parseFloat(amount),
        payment_link,
        status: paymentStatus,
        notes: notes || `Membership renewed for ${durationDays} days`,
      });
    }

    const updated = await Member.findById(req.params.id).populate('plan_id');
    const new_expiry = updated.expiry_date.toISOString().split('T')[0];

    return res.json({
      message: `Membership renewed! New expiry: ${new_expiry}`,
      member: serializeMember(updated),
      new_expiry,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMembers, getMemberById, createMember, updateMember, deleteMember, renewMember };
