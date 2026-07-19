const express = require('express');
const { sendSupportMessage, getUserTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware'); // Reuse your JWT protection

const router = express.Router();

router.post('/contact', protect, sendSupportMessage);
router.get('/tickets', protect, getUserTickets);

module.exports = router;
