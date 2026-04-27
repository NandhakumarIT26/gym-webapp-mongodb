const MembershipPlan = require('../models/MembershipPlan');

const defaultPlans = [
  {
    name: 'Monthly',
    price: 999,
    duration_days: 30,
    description: 'Standard monthly membership',
  },
  {
    name: 'Quarterly',
    price: 2499,
    duration_days: 90,
    description: '3-month membership with savings',
  },
  {
    name: 'Yearly',
    price: 7999,
    duration_days: 365,
    description: 'Annual membership - best value',
  },
];

const initDB = async () => {
  const existing = await MembershipPlan.countDocuments();

  if (existing === 0) {
    await MembershipPlan.insertMany(defaultPlans);
    console.log('Default membership plans seeded');
  }
};

module.exports = initDB;
