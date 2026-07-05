const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date },
    profession: { type: String, default: 'User' },
    isVerified: { type: Boolean, default: false },
    profilePhoto: { type: String, default: null },
    preferences: {
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'English' },
        timezone: { type: String, default: 'UTC-5 (Eastern Time)' },
        compactMode: { type: Boolean, default: false }
    },
    notifications: {
        emailAlerts: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: false },
        weeklyDigest: { type: Boolean, default: true },
        taskReminders: { type: Boolean, default: true }
    },
    twoFactorSecret: { type: String, default: null },
    isTwoFactorEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);