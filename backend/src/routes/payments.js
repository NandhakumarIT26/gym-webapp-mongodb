const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getPayments, generatePaymentLink, updatePaymentStatus, deletePayment
} = require('../controllers/paymentController');

router.get('/', auth, getPayments);
router.post('/generate-link', auth, generatePaymentLink);
router.put('/:id/status', auth, updatePaymentStatus);
router.delete('/:id', auth, deletePayment);

module.exports = router;
