const express = require('express');
const { sendSupportMessage } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware'); // Reuse your JWT protection

const router = express.Router();

router.post('/contact', protect, sendSupportMessage);

module.exports = router;
