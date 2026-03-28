const express = require('express');
const router = express.Router();
const { login, register, setupStatus } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/setup-status', setupStatus);

module.exports = router;
