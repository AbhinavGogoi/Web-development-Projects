const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyLogin2FA } = require('../controllers/authController');

// Map the endpoints to the controller functions
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login-2fa', verifyLogin2FA);

module.exports = router;