const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getIncomeBreakdown, getSummary, getExpenses, addExpense, deleteExpense } = require('../controllers/financeController');

router.use(auth);

router.get('/summary', getSummary);
router.get('/income', getIncomeBreakdown);
router.get('/expenses', getExpenses);
router.post('/expenses', addExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;
