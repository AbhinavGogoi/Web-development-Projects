const sendEmailHTTP = async ({ to, subject, text, html, replyTo }) => {
    try {
        if (process.env.RESEND_API_KEY) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to,
                    subject,
                    text,
                    html,
                    reply_to: replyTo
                })
            });
            if (!response.ok) throw new Error(await response.text());
            return true;
        } else if (process.env.BREVO_API_KEY) {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: "Taskify", email: process.env.EMAIL_FROM || 'noreply@taskify.com' },
                    to: [{ email: to }],
                    subject,
                    textContent: text,
                    htmlContent: html,
                    replyTo: replyTo ? { email: replyTo } : undefined
                })
            });
            if (!response.ok) throw new Error(await response.text());
            return true;
        } else if (process.env.SENDGRID_API_KEY) {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: process.env.EMAIL_FROM || 'noreply@taskify.com' },
                    reply_to: replyTo ? { email: replyTo } : undefined,
                    subject,
                    content: [
                        ...(text ? [{ type: 'text/plain', value: text }] : []),
                        ...(html ? [{ type: 'text/html', value: html }] : [])
                    ]
                })
            });
            if (!response.ok) throw new Error(await response.text());
            return true;
        } else {
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return true;
        }
    } catch (error) {
        console.error('Error sending email via HTTP API:', error);
        return false;
    }
};

const sendEmailOTP = async (toEmail, otp) => {
    return sendEmailHTTP({
        to: toEmail,
        subject: 'Your Taskify Verification Code',
        text: `Your OTP is: ${otp}. It is valid for 10 minutes.`
    });
};

const sendNewLoginAlert = async (toEmail, ip, userAgent) => {
    return sendEmailHTTP({
        to: toEmail,
        subject: 'Security Alert: New Login to Your Taskify Account',
        text: `We detected a new login to your Taskify account.\n\nIP Address: ${ip}\nDevice/Browser: ${userAgent}\nTime: ${new Date().toLocaleString()}\n\nIf this was you, you can ignore this email. If this wasn't you, please change your password immediately.`
    });
};

module.exports = { sendEmailOTP, sendNewLoginAlert, sendEmailHTTP };
