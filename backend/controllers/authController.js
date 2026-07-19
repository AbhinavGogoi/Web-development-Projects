const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { sendEmailOTP } = require('../services/emailService');
const { sendSMSOTP } = require('../services/smsService');

// Helper function to generate a JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// Helper function to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, dob, profession } = req.body;

        // 1. Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the user (unverified)
        const user = await User.create({
            name,
            email,
            phoneNumber,
            password: hashedPassword,
            dob,
            profession,
            isVerified: false
        });

        if (user) {
            // Generate OTP
            const otpCode = generateOTP();
            await OTP.create({
                userId: user._id,
                otp: otpCode,
                type: 'registration',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
            });

            // Send OTP
            await sendEmailOTP(email, otpCode);
            await sendSMSOTP(phoneNumber, otpCode);

            res.status(201).json({
                success: true,
                message: 'User registered. Please verify OTP.',
                requiresVerification: true,
                userId: user._id
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Registration OTP
// @route   POST /api/auth/verify-registration
const verifyRegistrationOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const otpRecord = await OTP.findOne({ userId, otp, type: 'registration' });
        
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await User.updateOne({ _id: userId }, { isVerified: true });
        
        const updatedUser = await User.findById(userId);

        await OTP.deleteOne({ _id: otpRecord._id });

        res.json({
            success: true,
            message: 'User verified successfully',
            token: generateToken(updatedUser._id),
            user: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, profilePhoto: updatedUser.profilePhoto }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            
            // Only enforce verification for new users (who have a phoneNumber)
            if (!user.isVerified && user.phoneNumber) {
                return res.status(401).json({ success: false, message: 'Please verify your account first.' });
            }

            // Check if 2FA is enabled
            if (user.isTwoFactorEnabled) {
                return res.json({
                    success: true,
                    requires2FA: true,
                    userId: user._id
                });
            }

            // Normal login
            res.json({
                success: true,
                token: generateToken(user._id),
                user: { id: user._id, name: user.name, profilePhoto: user.profilePhoto }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify 2FA token during login
// @route   POST /api/auth/login-2fa
const verifyLogin2FA = async (req, res) => {
    try {
        const { userId, token } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.isTwoFactorEnabled) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            res.json({
                success: true,
                token: generateToken(user._id),
                user: { id: user._id, name: user.name, profilePhoto: user.profilePhoto }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid 2FA code' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate OTP
        const otpCode = generateOTP();
        
        // Remove existing forgot_password OTPs for this user
        await OTP.deleteMany({ userId: user._id, type: 'forgot_password' });

        await OTP.create({
            userId: user._id,
            otp: otpCode,
            type: 'forgot_password',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });

        // Send OTP
        await sendEmailOTP(user.email, otpCode);
        if (user.phoneNumber) {
            await sendSMSOTP(user.phoneNumber, otpCode);
        }

        res.json({ success: true, message: 'OTP sent to registered email and phone number.', userId: user._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { userId, otp, newPassword } = req.body;

        const otpRecord = await OTP.findOne({ userId, otp, type: 'forgot_password' });
        
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateOne({ _id: userId }, { password: hashedPassword });

        await OTP.deleteOne({ _id: otpRecord._id });

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { registerUser, loginUser, verifyLogin2FA, verifyRegistrationOTP, forgotPassword, resetPassword };