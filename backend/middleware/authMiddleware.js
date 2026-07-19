const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
    let token;

    // Check if the authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Prevent CastError if the ID in the token is not a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
                return res.status(401).json({ success: false, message: 'Not authorized, invalid user ID in token' });
            }

            // Find the user by the ID embedded in the token and attach it to req.user
            // We use .select('-password') to ensure we don't accidentally pass the hashed password around
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            // Move on to the next piece of middleware or the actual controller
            next();
        } catch (error) {
            // Log only non-JWT errors to keep the console clean from token expiration/malformed warnings
            if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
                console.error('Auth Middleware Error:', error.message);
            }
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };