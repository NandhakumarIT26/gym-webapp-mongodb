const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getExpiringMembers, sendReminder } = require('../controllers/reminderController');

router.get('/expiring', auth, getExpiringMembers);
router.post('/send', auth, sendReminder);

module.exports = router;
