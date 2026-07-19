const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Task = require('../models/Task');
const Goal = require('../models/Goal'); // Assuming Goal model exists
const DailyTask = require('../models/DailyTask');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
        console.log(`Notification sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
    }
};

const initCronJobs = () => {
    // 1. Daily Task Reminders (Runs every day at 8:00 AM)
    // For testing, you could change this to '* * * * *' to run every minute
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily task reminders job...');
        try {
            // Find users who have taskReminders enabled and email alerts enabled
            const users = await User.find({ 
                'notifications.taskReminders': true,
                'notifications.emailAlerts': true 
            });

            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);

            for (const user of users) {
                // Find pending or in-progress tasks due in the next 24 hours
                const dueTasks = await Task.find({
                    userId: user._id,
                    status: { $ne: 'Completed' },
                    dueDate: { $gte: now, $lte: tomorrow }
                });

                if (dueTasks.length > 0) {
                    let taskListHtml = dueTasks.map(t => `<li><strong>${t.title}</strong> - Due: ${new Date(t.dueDate).toLocaleDateString()} (${t.priority} Priority)</li>`).join('');
                    
                    const html = `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Hello ${user.name},</h2>
                            <p>You have <strong>${dueTasks.length}</strong> tasks due in the next 24 hours:</p>
                            <ul>${taskListHtml}</ul>
                            <p>Log in to Taskify to manage your workflow.</p>
                        </div>
                    `;
                    
                    await sendEmail(user.email, 'Taskify: Daily Task Reminder', html);
                }
            }
        } catch (error) {
            console.error('Error in daily task reminders job:', error);
        }
    });

    // 2. Weekly Digest (Runs every Sunday at 9:00 AM)
    cron.schedule('0 9 * * 0', async () => {
        console.log('Running weekly digest job...');
        try {
            const users = await User.find({ 
                'notifications.weeklyDigest': true,
                'notifications.emailAlerts': true 
            });

            for (const user of users) {
                // Get summary of tasks
                const pendingTasksCount = await Task.countDocuments({ userId: user._id, status: { $ne: 'Completed' } });
                const completedTasksCount = await Task.countDocuments({ userId: user._id, status: 'Completed' });

                const html = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>Your Weekly Taskify Digest, ${user.name}</h2>
                        <p>Here is a quick summary of your productivity:</p>
                        <ul>
                            <li><strong>Pending Tasks:</strong> ${pendingTasksCount}</li>
                            <li><strong>Completed Tasks:</strong> ${completedTasksCount}</li>
                        </ul>
                        <p>Keep up the great work and have a productive week ahead!</p>
                    </div>
                `;
                
                await sendEmail(user.email, 'Taskify: Your Weekly Digest', html);
            }
        } catch (error) {
            console.error('Error in weekly digest job:', error);
        }
    });

    // 3. Daily Task Cleanup (Runs every day at midnight 00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily task cleanup job...');
        try {
            const result = await DailyTask.deleteMany({});
            console.log(`Deleted ${result.deletedCount} old daily tasks.`);
        } catch (error) {
            console.error('Error in daily task cleanup job:', error);
        }
    });

    console.log('Cron jobs initialized for notifications and cleanup.');
};

module.exports = { initCronJobs };
