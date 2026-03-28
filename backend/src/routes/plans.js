const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/planController');

router.get('/', auth, getPlans);
router.post('/', auth, createPlan);
router.put('/:id', auth, updatePlan);
router.delete('/:id', auth, deletePlan);

module.exports = router;
