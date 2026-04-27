const Payment = require('../models/Payment');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const Expense = require('../models/Expense');
const { serializeExpense } = require('../utils/serializers');

const monthRange = (month, year) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
};

const getIncomeBreakdown = async (req, res) => {
  try {
    const m = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const y = parseInt(req.query.year, 10) || new Date().getFullYear();
    const { start, end } = monthRange(m, y);

    const payments = await Payment.find({
      status: 'Paid',
      created_at: { $gte: start, $lt: end },
    }).sort({ created_at: -1 });

    const memberIds = [...new Set(payments.map((p) => p.member_id.toString()))];
    const members = await Member.find({ _id: { $in: memberIds } }).select('name phone plan_id').lean();
    const planIds = [...new Set(members.filter((mbr) => mbr.plan_id).map((mbr) => mbr.plan_id.toString()))];
    const plans = await MembershipPlan.find({ _id: { $in: planIds } }).lean();

    const memberById = new Map(members.map((mbr) => [mbr._id.toString(), mbr]));
    const planById = new Map(plans.map((pl) => [pl._id.toString(), pl]));

    const rows = payments.map((p) => {
      const member = memberById.get(p.member_id.toString());
      const plan = member?.plan_id ? planById.get(member.plan_id.toString()) : null;

      return {
        id: p._id.toString(),
        amount: p.amount,
        notes: p.notes,
        status: p.status,
        created_at: p.created_at,
        member_name: member?.name,
        member_phone: member?.phone,
        plan_name: plan?.name,
        duration_days: plan?.duration_days,
      };
    });

    return res.json(rows);
  } catch (err) {
    console.error('Income breakdown error:', err);
    return res.status(500).json({ error: 'Failed to fetch income breakdown' });
  }
};

const getSummary = async (req, res) => {
  try {
    const m = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const y = parseInt(req.query.year, 10) || new Date().getFullYear();
    const { start, end } = monthRange(m, y);

    const incomeAgg = await Payment.aggregate([
      { $match: { status: 'Paid', created_at: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_income: { $sum: '$amount' } } },
    ]);

    const expenseAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total_expenses: { $sum: '$amount' } } },
    ]);

    const categories = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $project: { _id: 0, category: '$_id', total: 1 } },
    ]);

    const totalIncome = incomeAgg[0]?.total_income || 0;
    const totalExpenses = expenseAgg[0]?.total_expenses || 0;

    return res.json({
      month: m,
      year: y,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: totalIncome - totalExpenses,
      categories,
    });
  } catch (err) {
    console.error('Finance summary error:', err);
    return res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};

    if (month && year) {
      const { start, end } = monthRange(parseInt(month, 10), parseInt(year, 10));
      filter.date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(Date.UTC(parseInt(year, 10), 0, 1));
      const end = new Date(Date.UTC(parseInt(year, 10) + 1, 0, 1));
      filter.date = { $gte: start, $lt: end };
    }

    const rows = await Expense.find(filter).sort({ date: -1, created_at: -1 });
    return res.json(rows.map(serializeExpense));
  } catch (err) {
    console.error('Get expenses error:', err);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const addExpense = async (req, res) => {
  try {
    const { date, amount, category, description } = req.body;
    if (!date || !amount || !category) {
      return res.status(400).json({ error: 'Date, amount, and category are required' });
    }

    const expense = await Expense.create({
      date: new Date(date),
      amount: parseFloat(amount),
      category,
      description: description || null,
    });

    return res.status(201).json(serializeExpense(expense));
  } catch (err) {
    console.error('Add expense error:', err);
    return res.status(500).json({ error: 'Failed to add expense' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};

module.exports = { getIncomeBreakdown, getSummary, getExpenses, addExpense, deleteExpense };
