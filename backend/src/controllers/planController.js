const MembershipPlan = require('../models/MembershipPlan');
const { serializePlan } = require('../utils/serializers');

const getPlans = async (req, res) => {
  try {
    const rows = await MembershipPlan.find().sort({ duration_days: 1 });
    return res.json(rows.map(serializePlan));
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const createPlan = async (req, res) => {
  try {
    const { name, price, duration_days, description } = req.body;
    if (!name || !price || !duration_days) {
      return res.status(400).json({ error: 'Name, price, and duration_days are required' });
    }

    const plan = await MembershipPlan.create({
      name,
      price: parseFloat(price),
      duration_days: parseInt(duration_days, 10),
      description: description || null,
    });

    return res.status(201).json(serializePlan(plan));
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { name, price, duration_days, description } = req.body;
    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price: parseFloat(price),
        duration_days: parseInt(duration_days, 10),
        description: description || null,
      },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.json(serializePlan(plan));
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const deleted = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    return res.json({ message: 'Plan deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
