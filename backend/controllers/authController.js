const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// Helper function to generate a JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, dob, profession } = req.body;

        // 1. Check if the user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            dob,
            profession
        });

        // 4. Return success with token
        if (user) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                token: generateToken(user._id),
                user: { id: user._id, name: user.name, email: user.email, profilePhoto: user.profilePhoto }
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
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

module.exports = { registerUser, loginUser, verifyLogin2FA };