const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { serializePayment } = require('../utils/serializers');

const getPayments = async (req, res) => {
  try {
    const rows = await Payment.find()
      .populate({ path: 'member_id', select: 'name phone' })
      .sort({ created_at: -1 });

    return res.json(rows.map(serializePayment));
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const generatePaymentLink = async (req, res) => {
  try {
    const { member_id, amount, notes, upi_id } = req.body;
    if (!member_id || !amount) return res.status(400).json({ error: 'member_id and amount required' });

    const member = await Member.findById(member_id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    let payment_link = '';
    if (upi_id) {
      const upiParams = new URLSearchParams({
        pa: upi_id,
        pn: 'Gym Management',
        am: amount,
        cu: 'INR',
        tn: `Gym membership renewal - ${member.name}`,
      });
      payment_link = `upi://pay?${upiParams.toString()}`;
    }

    const created = await Payment.create({
      member_id,
      amount: parseFloat(amount),
      payment_link,
      status: 'Pending',
      notes: notes || null,
    });

    const payment = await Payment.findById(created._id).populate({ path: 'member_id', select: 'name phone' });

    return res.status(201).json(serializePayment(payment));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Paid'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    return res.json(serializePayment(payment));
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const deletePayment = async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Payment not found' });

    return res.json({ message: 'Payment deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPayments, generatePaymentLink, updatePaymentStatus, deletePayment };
