import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

const TaskMonitor = () => {
    const [notifiedTasks, setNotifiedTasks] = useState(() => {
        const saved = localStorage.getItem('notifiedTasks');
        return saved ? JSON.parse(saved) : {};
    });
    
    // State to hold the currently visible in-app toasts
    const [inAppToasts, setInAppToasts] = useState([]);

    const addInAppToast = (title, message) => {
        const id = Date.now();
        setInAppToasts(prev => [...prev, { id, title, message }]);
        // Auto remove after 5 seconds
        setTimeout(() => {
            setInAppToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    };

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
                            // 1. Native Desktop Notification (if permitted)
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('Task Reminder', {
                                    body: `Your task "${task.title}" is due soon!`,
                                });
                            }
                            
                            // 2. In-App UI Notification
                            addInAppToast('Task Reminder', `Your task "${task.title}" is due soon!`);

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

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {inAppToasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-slate-900 text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-4 max-w-sm w-full border border-slate-700/50 flex items-start gap-3 pointer-events-auto relative overflow-hidden"
                    >
                        {/* Left Blue accent line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 mt-0.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        
                        <div className="flex-1 pr-6">
                            <h4 className="font-bold text-sm tracking-wide text-slate-100">{toast.title}</h4>
                            <p className="text-slate-400 text-sm mt-1">{toast.message}</p>
                        </div>
                        
                        <button 
                            onClick={() => setInAppToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default TaskMonitor;
