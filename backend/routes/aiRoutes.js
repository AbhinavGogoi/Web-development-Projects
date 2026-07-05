const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route to handle AI chat requests
// Protected by JWT token
router.post('/chat', protect, chatWithAI);

module.exports = router;
