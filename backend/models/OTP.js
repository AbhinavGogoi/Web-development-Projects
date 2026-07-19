const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    type: { type: String, required: true, enum: ['registration', 'forgot_password'] },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Automatically delete documents after expiration (TTL index)
// Note: You can also use expires in the schema property, but setting an index manually is clear.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);
