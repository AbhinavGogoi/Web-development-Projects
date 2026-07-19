const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Task = require('../models/Task');
const Goal = require('../models/Goal');

// Configure multer for local file storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter(req, file, cb) {
        const filetypes = /jpe?g|png|webp|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only!'));
        }
    }
});

// @desc    Get user profile and settings
// @route   GET /api/users/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
    }
};

// @desc    Update user profile and settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res) => {
    try {
        const { name, email, profession, preferences, notifications } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateFields = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (profession) updateFields.profession = profession;
        if (preferences) updateFields.preferences = { ...user.preferences, ...preferences };
        if (notifications) updateFields.notifications = { ...user.notifications, ...notifications };

        await User.updateOne({ _id: req.user._id }, { $set: updateFields });
        const updatedUser = await User.findById(req.user._id).select('-password');
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update settings', error: error.message });
    }
};

// @desc    Upload profile photo
// @route   POST /api/users/photo
// @access  Private
const uploadPhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        // Construct the URL path to the image
        const photoUrl = `/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePhoto: photoUrl },
            { new: true }
        ).select('-password');
        
        res.status(200).json({ message: 'Photo uploaded successfully', photoUrl });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload photo', error: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateOne({ _id: req.user._id }, { $set: { password: hashedPassword } });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update password', error: error.message });
    }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete all associated tasks and goals
        await Task.deleteMany({ userId });
        await Goal.deleteMany({ userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete account', error: error.message });
    }
};

// @desc    Generate 2FA Secret and QR Code
// @route   GET /api/users/2fa/generate
// @access  Private
const generate2FA = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Taskify (${req.user.email})`
        });

        await User.updateOne({ _id: req.user._id }, { $set: { twoFactorSecret: secret.base32 } });

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ message: 'Error generating QR code' });
            res.status(200).json({ qrCodeUrl: data_url, secret: secret.base32 });
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate 2FA', error: error.message });
    }
};

// @desc    Verify 2FA Token and Enable it
// @route   POST /api/users/2fa/verify
// @access  Private
const verify2FA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorSecret) {
            return res.status(400).json({ message: '2FA secret not generated' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            await User.updateOne({ _id: req.user._id }, { $set: { isTwoFactorEnabled: true } });
            res.status(200).json({ message: '2FA enabled successfully' });
        } else {
            res.status(400).json({ message: 'Invalid token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify 2FA', error: error.message });
    }
};

// @desc    Disable 2FA
// @route   DELETE /api/users/2fa
// @access  Private
const disable2FA = async (req, res) => {
    try {
        await User.updateOne({ _id: req.user._id }, { $set: { isTwoFactorEnabled: false, twoFactorSecret: null } });
        res.status(200).json({ message: '2FA disabled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to disable 2FA', error: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    uploadPhoto,
    upload,
    changePassword,
    deleteAccount,
    generate2FA,
    verify2FA,
    disable2FA
};
