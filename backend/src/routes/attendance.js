const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAttendance, manualCheckin, checkinById, qrCheckin, getMemberQR
} = require('../controllers/attendanceController');

router.get('/', auth, getAttendance);
router.post('/checkin', auth, manualCheckin);
router.post('/checkin-by-id', auth, checkinById);
router.post('/qr-checkin', auth, qrCheckin);
router.get('/qr/:memberId', auth, getMemberQR);

module.exports = router;
