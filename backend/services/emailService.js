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

module.exports = { sendEmailOTP };
