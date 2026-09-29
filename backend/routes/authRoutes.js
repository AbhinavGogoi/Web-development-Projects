const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyLogin2FA, sendLogin2FAOTP, verifyRegistrationOTP, forgotPassword, resetPassword } = require('../controllers/authController');

// Map the endpoints to the controller functions
router.post('/register', registerUser);
router.post('/verify-registration', verifyRegistrationOTP);
router.post('/login', loginUser);
router.post('/login-2fa', verifyLogin2FA);
router.post('/send-2fa-otp', sendLogin2FAOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;