const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, uploadPhoto, upload, changePassword, deleteAccount, generate2FA, verify2FA, disable2FA } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Settings Routes
router.route('/settings')
    .get(protect, getSettings)
    .put(protect, updateSettings);

// Photo Upload Route
router.post('/photo', protect, upload.single('profilePhoto'), uploadPhoto);

// Security Routes
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

// 2FA Routes
router.get('/2fa/generate', protect, generate2FA);
router.post('/2fa/verify', protect, verify2FA);
router.delete('/2fa', protect, disable2FA);

module.exports = router;
