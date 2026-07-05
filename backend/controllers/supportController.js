const nodemailer = require('nodemailer');

exports.sendSupportMessage = async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        // Ensure user is attached via auth middleware
        const user = req.user; 
        
        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        // Configure the email transporter using env variables
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'abhinavgogoi2004@gmail.com',
            replyTo: user.email,
            subject: `Taskify Support Request: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">New Support Request</h2>
                    <p><strong>From:</strong> ${user.name} (${user.email})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Support message sent successfully' });

    } catch (error) {
        console.error('Error sending support email:', error);
        res.status(500).json({ message: 'Failed to send message. Please ensure EMAIL_USER and EMAIL_PASS are configured in the .env file.' });
    }
};
