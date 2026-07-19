const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    // You should configure these in your .env file
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmailOTP = async (toEmail, otp) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[MOCK EMAIL] To: ${toEmail} | OTP: ${otp}`);
            return true;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@taskify.com',
            to: toEmail,
            subject: 'Your Taskify Verification Code',
            text: `Your OTP is: ${otp}. It is valid for 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendNewLoginAlert = async (toEmail, ip, userAgent) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[MOCK EMAIL] To: ${toEmail} | New Login Detected from IP: ${ip}, Device: ${userAgent}`);
            return true;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@taskify.com',
            to: toEmail,
            subject: 'Security Alert: New Login to Your Taskify Account',
            text: `We detected a new login to your Taskify account.\n\nIP Address: ${ip}\nDevice/Browser: ${userAgent}\nTime: ${new Date().toLocaleString()}\n\nIf this was you, you can ignore this email. If this wasn't you, please change your password immediately.`
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending new login alert email:', error);
        return false;
    }
};

module.exports = { sendEmailOTP, sendNewLoginAlert };
