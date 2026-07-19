const nodemailer = require('nodemailer');
const SupportTicket = require('../models/SupportTicket');

exports.sendSupportMessage = async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        // Ensure user is attached via auth middleware
        const user = req.user; 
        
        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        // Save ticket to database
        const ticket = await SupportTicket.create({
            userId: user._id,
            subject,
            message,
            status: 'Open'
        });

        // Configure the email transporter using env variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[MOCK EMAIL] Support Ticket Created: ${subject} by ${user.email}`);
            return res.status(200).json({ message: 'Support ticket created successfully', ticket });
        }

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

        res.status(200).json({ message: 'Support ticket created and email sent successfully', ticket });

    } catch (error) {
        console.error('Error in support controller:', error);
        res.status(500).json({ message: 'Failed to process support request.' });
    }
};

exports.getUserTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets.' });
    }
};
