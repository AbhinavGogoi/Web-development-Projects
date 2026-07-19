import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';

const DailyTasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Fetch tasks on load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchDailyTasks();
    }, [navigate]);

    const fetchDailyTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/dailytasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch daily tasks:', error);
            showNotification('Failed to load tasks', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/dailytasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: newTaskText })
            });

            if (res.ok) {
                const newTask = await res.json();
                setTasks([...tasks, newTask]);
                setNewTaskText('');
                showNotification('Task added!');
            }
        } catch (error) {
            console.error('Failed to add task:', error);
            showNotification('Failed to add task', 'error');
        }
    };

    const handleToggleComplete = async (id, currentStatus) => {
        // Optimistic update
        setTasks(tasks.map(t => t._id === id ? { ...t, completed: !currentStatus } : t));

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/api/dailytasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ completed: !currentStatus })
            });
        } catch (error) {
            console.error('Failed to update task:', error);
            // Revert on failure
            setTasks(tasks.map(t => t._id === id ? { ...t, completed: currentStatus } : t));
            showNotification('Update failed', 'error');
        }
    };

    const handleDeleteTask = async (id) => {
        // Optimistic delete
        const prevTasks = [...tasks];
        setTasks(tasks.filter(t => t._id !== id));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/dailytasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Delete failed');
            showNotification('Task removed');
        } catch (error) {
            console.error('Failed to delete task:', error);
            setTasks(prevTasks);
            showNotification('Delete failed', 'error');
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="h-screen w-full flex overflow-hidden bg-transparent">
            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {notification.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                        {notification.type === 'error' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        )}
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN LAYOUT */}
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">
                
                {/* SIDEBAR */}
                <Sidebar activePage="daily" onLogout={handleLogout} />

                {/* MAIN CONTENT */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 p-4 md:p-8">
                    
                    {/* HEADER */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Daily Tasks</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">{todayDate} • Resets at midnight</p>
                            </div>
                        </div>
                    </header>

                    {/* PROGRESS BAR & STATS */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 mb-8 shadow-sm">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Progress</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{completedCount} of {tasks.length} tasks completed</p>
                            </div>
                            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* INPUT AREA */}
                    <form onSubmit={handleAddTask} className="mb-8 relative">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="What do you need to get done today?"
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-6 pr-32 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-sm"
                        />
                        <button 
                            type="submit"
                            disabled={!newTaskText.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                            Add
                        </button>
                    </form>

                    {/* TASK LIST */}
                    <div className="flex-1 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No tasks yet!</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Start your day by adding some tasks above.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-20">
                                <AnimatePresence>
                                    {tasks.map(task => (
                                        <motion.div
                                            key={task._id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                task.completed 
                                                ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 opacity-75' 
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <button 
                                                    onClick={() => handleToggleComplete(task._id, task.completed)}
                                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        task.completed 
                                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                                                    }`}
                                                >
                                                    {task.completed && (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <span className={`font-medium text-lg transition-all ${
                                                    task.completed 
                                                    ? 'text-slate-400 dark:text-slate-500 line-through' 
                                                    : 'text-slate-700 dark:text-slate-200'
                                                }`}>
                                                    {task.text}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DailyTasksPage;
