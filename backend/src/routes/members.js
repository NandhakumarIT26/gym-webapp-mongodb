const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getMembers, getMemberById, createMember, updateMember, deleteMember, renewMember
} = require('../controllers/memberController');

router.get('/', auth, getMembers);
router.get('/:id', auth, getMemberById);
router.post('/', auth, createMember);
router.put('/:id', auth, updateMember);
router.delete('/:id', auth, deleteMember);
router.post('/:id/renew', auth, renewMember);

module.exports = router;
