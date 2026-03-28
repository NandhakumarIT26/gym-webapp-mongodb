const express = require('express');
const router = express.Router();
const { getEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');

router.get('/', getEnquiries);
router.get('/:id', getEnquiryById);
router.post('/', createEnquiry);
router.put('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);

module.exports = router;
