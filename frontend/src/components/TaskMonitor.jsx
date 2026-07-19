import { useEffect, useState } from 'react';
import { API_BASE } from '../config';

const TaskMonitor = () => {
    const [notifiedTasks, setNotifiedTasks] = useState(() => {
        const saved = localStorage.getItem('notifiedTasks');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        let interval;

        const checkTasks = async () => {
            const token = localStorage.getItem('token');
            if (!token || !('Notification' in window) || Notification.permission !== 'granted') return;

            try {
                // Fetch user settings to ensure Push Notifications and Task Reminders are enabled
                const userRes = await fetch(`${API_BASE}/users/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!userRes.ok) return;
                const userData = await userRes.json();
                
                if (!userData.notifications?.pushNotifications || !userData.notifications?.taskReminders) {
                    return; // Push notifications or Task Reminders are disabled
                }

                // Fetch tasks
                const taskRes = await fetch(`${API_BASE}/tasks`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!taskRes.ok) return;
                const tasks = await taskRes.json();
                
                const now = new Date();
                const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60000);
                
                const newNotified = { ...notifiedTasks };
                let updated = false;

                tasks.forEach(task => {
                    if (task.status !== 'Completed' && task.dueDate) {
                        const dueDate = new Date(task.dueDate);
                        
                        // If task is due in less than 30 mins and we haven't notified yet
                        if (dueDate > now && dueDate <= thirtyMinsFromNow && !newNotified[task._id]) {
                            new Notification('Task Reminder', {
                                body: `Your task "${task.title}" is due soon!`,
                            });
                            newNotified[task._id] = true;
                            updated = true;
                        }
                    }
                });

                if (updated) {
                    setNotifiedTasks(newNotified);
                    localStorage.setItem('notifiedTasks', JSON.stringify(newNotified));
                }

            } catch (err) {
                console.error("Task monitor error:", err);
            }
        };

        // Check on mount, then every 2 minutes
        checkTasks();
        interval = setInterval(checkTasks, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [notifiedTasks]);

    return null; // Invisible component
};

export default TaskMonitor;
