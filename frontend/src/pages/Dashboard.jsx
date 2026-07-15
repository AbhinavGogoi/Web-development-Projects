import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { API_BASE, SERVER_URL } from '../config';

// Status color mappings
const statusColors = {
    'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'Completed': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
};

const priorityColors = {
    'High': { bg: 'bg-red-50', text: 'text-red-600' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-600' },
    'Low': { bg: 'bg-emerald-50', text: 'text-emerald-600' }
};


const Dashboard = () => {
    const navigate = useNavigate();

    // --- State ---
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userName, setUserName] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '', description: '', tag: 'Other' });
    const [newGoal, setNewGoal] = useState({ title: '', targetDate: '' });

    // --- Toast Notification ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    // --- Data Fetch on Mount ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // 2. Fetch User Name and Photo
        setUserName(localStorage.getItem('userName') || 'User');
        setProfilePhoto(localStorage.getItem('profilePhoto') || '');

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [taskRes, goalRes] = await Promise.all([
                    fetch(`${API_BASE}/tasks`, config),
                    fetch(`${API_BASE}/goals`, config)
                ]);

                // Handle expired/invalid tokens
                if (taskRes.status === 401 || goalRes.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    navigate('/login');
                    return;
                }

                const taskData = await taskRes.json();
                const goalData = await goalRes.json();

                if (taskRes.ok && goalRes.ok) {
                    // FIX: Backend returns { success, tasks } and { success, goals }, not bare arrays
                    setTasks(taskData.tasks || []);
                    setGoals(goalData.goals || []);
                } else {
                    setError('Failed to fetch dashboard data.');
                }
            } catch (err) {
                setError('Server connection error. Please check that the backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // --- Computed Values ---
    const stats = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        pending: tasks.filter(t => t.status === 'Pending').length,
    }), [tasks]);

    const goalProgress = useMemo(() => {
        if (tasks.length === 0) return 0;
        return Math.round((stats.completed / stats.total) * 100);
    }, [stats, tasks.length]);

    // SVG donut offset: circumference = 251, offset = 251 - (251 * percent / 100)
    const donutOffset = useMemo(() => 251 - (251 * goalProgress / 100), [goalProgress]);

    // Calculate dynamic goal progress from goals state
    const averageGoalProgress = useMemo(() => {
        if (goals.length === 0) return 0;
        return Math.round(goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / goals.length);
    }, [goals]);

    // Math for the SVG Circle (Radius 40)
    const circleCircumference = 2 * Math.PI * 40; // Approx 251.2
    const strokeDashoffset = useMemo(() => {
        return circleCircumference - (averageGoalProgress / 100) * circleCircumference;
    }, [averageGoalProgress, circleCircumference]);

    // Weekly analytics: count tasks created per day of the current week
    const weeklyAnalytics = useMemo(() => {
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const counts = new Array(7).fill(0);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        tasks.forEach(task => {
            const created = new Date(task.createdAt);
            if (created >= weekAgo) {
                counts[created.getDay()]++;
            }
        });

        const max = Math.max(...counts, 1);
        const colors = ['bg-slate-200', 'bg-sky-300', 'bg-blue-400', 'bg-blue-600'];

        return days.map((label, i) => ({
            label,
            count: counts[i],
            height: `${Math.max((counts[i] / max) * 100, 10)}%`,
            color: counts[i] === 0 ? 'bg-slate-100' : colors[Math.min(Math.floor((counts[i] / max) * 3), 3)]
        }));
    }, [tasks]);

    // Weekly completion line graph data over the last 7 days (chronological)
    const weeklyCompletionData = useMemo(() => {
        const result = [];
        const maxDays = 7;
        const now = new Date();

        for (let i = maxDays - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            result.push({
                dateObj: d,
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                completed: 0,
                total: 0
            });
        }

        tasks.forEach(task => {
            const taskDateStr = task.updatedAt || task.createdAt;
            if (!taskDateStr) return;
            const taskDate = new Date(taskDateStr);

            for (let i = 0; i < result.length; i++) {
                if (
                    taskDate.getDate() === result[i].dateObj.getDate() &&
                    taskDate.getMonth() === result[i].dateObj.getMonth() &&
                    taskDate.getFullYear() === result[i].dateObj.getFullYear()
                ) {
                    result[i].total++;
                    if (task.status === 'Completed') {
                        result[i].completed++;
                    }
                }
            }
        });

        return result;
    }, [tasks]);

    // Filter tasks by search query
    const filteredTasks = useMemo(() => {
        if (!searchQuery.trim()) return tasks;
        const q = searchQuery.toLowerCase();
        return tasks.filter(t => t.title.toLowerCase().includes(q));
    }, [tasks, searchQuery]);

    // Next upcoming task for the "Up Next" card
    const nextReminder = useMemo(() => {
        const upcoming = tasks
            .filter(t => t.status !== 'Completed' && t.dueDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        return upcoming[0] || null;
    }, [tasks]);

    // ========================================
    // CRUD HANDLERS
    // ========================================

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newTask)
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(prev => [...prev, data.task]);
                setIsModalOpen(false);
                setNewTask({ title: '', priority: 'Medium', dueDate: '', description: '', tag: 'Other' });
                showNotification('Task created successfully!');
            } else {
                showNotification(data.message || 'Failed to create task', 'error');
            }
        } catch (err) {
            showNotification('Server error. Is your backend running?', 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setTasks(prev => prev.filter(t => t._id !== taskId));
                showNotification('Task deleted!');
            } else {
                const data = await response.json();
                showNotification(data.message || 'Failed to delete', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleToggleStatus = async (task) => {
        const cycle = ['Pending', 'In Progress', 'Completed'];
        const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tasks/${task._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: next })
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(prev => prev.map(t => t._id === task._id ? data.task : t));
                showNotification(`Task → ${next}`);
            } else {
                showNotification(data.message || 'Failed to update', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newGoal)
            });
            const data = await response.json();
            if (response.ok) {
                setGoals(prev => [...prev, data.goal]);
                setIsGoalModalOpen(false);
                setNewGoal({ title: '', targetDate: '' });
                showNotification('Goal created!');
            } else {
                showNotification(data.message || 'Failed to create goal', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleDeleteGoal = async (goalId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals/${goalId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setGoals(prev => prev.filter(g => g._id !== goalId));
                showNotification('Goal deleted!');
            } else {
                const data = await response.json();
                showNotification(data.message || 'Failed to delete', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleUpdateGoalStatus = async (goal) => {
        const cycle = ['On Track', 'At Risk', 'Completed'];
        const next = cycle[(cycle.indexOf(goal.status) + 1) % cycle.length];
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals/${goal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: next })
            });
            const data = await response.json();
            if (response.ok) {
                setGoals(prev => prev.map(g => g._id === goal._id ? data.goal : g));
                showNotification(`Goal → ${next}`);
            } else {
                showNotification(data.message || 'Failed to update', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    // --- Framer Motion Variants ---
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    // ========================================
    // LOADING STATE
    // ========================================
    if (loading) {
        return (
            <div className="h-screen w-full bg-transparent flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative shadow-inner animate-pulse">
                        <div className="absolute top-0 w-full h-1/3 bg-white dark:bg-slate-800/30 rounded-t-xl"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-white/80 font-medium text-sm">Loading your dashboard...</p>
                </motion.div>
            </div>
        );
    }

    // ========================================
    // ERROR STATE (only if no data loaded at all)
    // ========================================
    if (error && tasks.length === 0) {
        return (
            <div className="h-screen w-full bg-transparent flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Connection Error</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    // ========================================
    // MAIN DASHBOARD RENDER
    // ========================================
    return (
        <div className="h-screen w-full flex overflow-hidden bg-transparent">

            {/* ====== TOAST NOTIFICATION ====== */}
            <AnimatePresence>
                {notification.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2 ${notification.type === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-emerald-500 text-white'
                            }`}
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

            {/* ====== MAIN WINDOW ====== */}
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">

                {/* Shared Sidebar */}
                <Sidebar
                    activePage="dashboard"
                    taskCount={stats.total}
                    goalCount={goals.length}
                    onLogout={handleLogout}
                    onCreateGoal={() => setIsGoalModalOpen(true)}
                />

                {/* --- RIGHT MAIN CONTENT --- */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 p-6 md:p-8">

                    {/* Top Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            {/* DYNAMIC greeting with user name */}
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome back, {userName} 👋</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Plan, prioritize, and accomplish your tasks with ease.</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:bg-slate-900/50 shadow-sm flex-shrink-0 relative">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            </button>

                            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                {profilePhoto ? (
                                    <img src={`${SERVER_URL}${profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    userName.charAt(0).toUpperCase()
                                )}
                            </button>

                            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold shadow-md hover:bg-blue-700 transition-colors flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                Add Task
                            </button>
                        </div>
                    </header>

                    {/* --- BENTO GRID CONTENT --- */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8"
                    >
                        {/* ====== TOP STAT ROW (4 Cards — ALL DYNAMIC) ====== */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="md:col-span-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group cursor-pointer"
                        >
                            <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-white/10 dark:bg-slate-800/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="absolute left-[-10%] bottom-[-10%] w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-colors duration-500"></div>
                            <p className="font-medium text-blue-100 text-sm mb-2 relative z-10">Total Tasks</p>
                            <h3 className="text-4xl font-extrabold mb-4 relative z-10">{stats.total}</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-black/20 w-max px-2 py-1 rounded-lg relative z-10">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                {stats.total > 0 ? 'Active workspace' : 'Get started!'}
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="md:col-span-3 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] border border-white/60 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Completed</p>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 mt-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{stats.completed}</h3>
                                <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{stats.total > 0 ? `${goalProgress}% of all tasks` : 'No tasks yet'}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="md:col-span-3 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] border border-white/60 dark:border-white/10 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">In Progress</p>
                                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 mt-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stats.inProgress}</h3>
                                <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">Currently active</p>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="md:col-span-3 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.15)] border border-white/60 dark:border-white/10 hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Pending</p>
                                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 mt-4 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{stats.pending}</h3>
                                <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">Awaiting action</p>
                            </div>
                        </motion.div>

                        {/* ====== MIDDLE ROW ====== */}

                        {/* Task Analytics — DYNAMIC bar chart from real task data */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-5 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Task Analytics
                            </h3>
                            <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 mt-auto relative z-10" style={{ minHeight: '120px' }}>
                                {weeklyAnalytics.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`w-full ${day.color} rounded-t-xl relative transition-all duration-700 hover:brightness-110 cursor-pointer group/bar`}
                                        style={{ height: day.height }}
                                    >
                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 group-hover/bar:text-slate-600 transition-colors">{day.label}</span>
                                        {day.count > 0 && (
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover/bar:-translate-y-1 transition-transform">{day.count}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Up Next — DYNAMIC from next upcoming task */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-3 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/10 transition-colors duration-500"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Up Next
                            </h3>
                            {nextReminder ? (
                                <div className="mb-6 relative z-10">
                                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{nextReminder.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">
                                        Due: {new Date(nextReminder.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[nextReminder.status]?.bg || 'bg-slate-100'} ${statusColors[nextReminder.status]?.text || 'text-slate-600 dark:text-slate-300'}`}>
                                        {nextReminder.status}
                                    </span>
                                </div>
                            ) : (
                                <div className="mb-6 relative z-10">
                                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">All clear! 🎉</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">No upcoming tasks</p>
                                </div>
                            )}
                            <button onClick={() => setIsModalOpen(true)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 transition-colors hover:-translate-y-0.5 active:translate-y-0 relative z-10">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                New Task
                            </button>
                        </motion.div>

                        {/* Recent Tasks — DYNAMIC with status toggle + delete (spans 2 rows) */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-4 md:row-span-2 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    Recent Tasks
                                </h3>
                                {/* FIXED: "+ New" button now opens the create task modal */}
                                <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold bg-slate-50/50 dark:bg-slate-900/50 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 transition-all">+ New</button>
                            </div>

                            {/* FUNCTIONAL Search Bar - Moved inside Recent Tasks */}
                            <div className="relative w-full mb-4 relative z-10">
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                                />
                            </div>

                            <ul className="space-y-3 flex-1 max-h-[350px] overflow-y-auto pr-1 relative z-10">
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.slice().reverse().map((task) => (
                                        <li key={task._id} className="flex items-center gap-3 group p-2 rounded-xl hover:bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                                            {/* Status toggle button — click to cycle Pending → In Progress → Completed */}
                                            <button
                                                onClick={() => handleToggleStatus(task)}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110 shadow-sm ${task.status === 'Completed'
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : task.status === 'In Progress'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-amber-100 text-amber-600'
                                                    }`}
                                                title={`Status: ${task.status} — click to change`}
                                            >
                                                {task.status === 'Completed' ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                ) : task.status === 'In Progress' ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm truncate transition-colors ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>{task.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                                    </p>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityColors[task.priority]?.bg || 'bg-slate-50/50 dark:bg-slate-900/50'} ${priorityColors[task.priority]?.text || 'text-slate-600 dark:text-slate-300'}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                {task.description && (
                                                    <p className={`text-xs mt-1.5 line-clamp-2 ${task.status === 'Completed' ? 'text-slate-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Delete button — appears on hover */}
                                            <button
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                                title="Delete task"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-center text-slate-400 py-10 font-medium italic">
                                        {searchQuery ? 'No tasks match your search.' : 'No tasks created yet.'}
                                    </li>
                                )}
                            </ul>
                        </motion.div>

                        {/* Weekly Progress — NEW EXTRA CARD (col-span-8 to fill the left under Analytics and Up Next) */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-8 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 flex flex-col group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                Completion Progress
                            </h3>
                            <div className="flex-1 w-full relative z-10" style={{ minHeight: '180px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyCompletionData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="completed" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* ====== BOTTOM ROW ====== */}

                        {/* Weekly Goals — DYNAMIC with goal CRUD */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-4 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Weekly Goals
                                </h3>
                                <button onClick={() => setIsGoalModalOpen(true)} className="text-xs font-bold bg-slate-50/50 dark:bg-slate-900/50 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 transition-all">+ Add Goal</button>
                            </div>
                            <div className="space-y-3 max-h-[180px] overflow-y-auto relative z-10">
                                {goals.length > 0 ? (
                                    goals.slice().reverse().map((goal) => {
                                        const goalStatusColors = {
                                            'On Track': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
                                            'At Risk': { bg: 'bg-amber-50', text: 'text-amber-600' },
                                            'Completed': { bg: 'bg-blue-50', text: 'text-blue-600' }
                                        };
                                        const gc = goalStatusColors[goal.status] || goalStatusColors['On Track'];
                                        return (
                                            <div key={goal._id} className="flex items-center gap-3 group p-2 rounded-xl hover:bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                                                <button
                                                    onClick={() => handleUpdateGoalStatus(goal)}
                                                    className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:scale-110 transition-transform shadow-sm"
                                                    title={`Status: ${goal.status} — click to change`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">{goal.title}</p>
                                                    <p className="text-xs text-slate-400">
                                                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${gc.bg} ${gc.text}`}>{goal.status}</span>
                                                <button
                                                    onClick={() => handleDeleteGoal(goal._id)}
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                                    title="Delete goal"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-slate-400 py-6 font-medium italic text-sm">No goals set yet.</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Goal Progress — DYNAMIC donut chart */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="md:col-span-4 bg-white dark:bg-white/10 dark:backdrop-blur-2xl backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/60 dark:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 to-transparent dark:from-blue-500/10 pointer-events-none group-hover:from-blue-500/10 transition-colors duration-500"></div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2 relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                Goal Progress
                            </h3>
                            <div className="flex items-center justify-center flex-1 relative mt-4 z-10 hover:scale-105 transition-transform duration-500">
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                    {/* Background Track */}
                                    <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="12" fill="transparent" />
                                    {/* Animated Progress Line */}
                                    <motion.circle
                                        initial={{ strokeDashoffset: circleCircumference }}
                                        animate={{ strokeDashoffset: strokeDashoffset }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="50" cy="50" r="40"
                                        stroke="url(#blue-gradient)"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={circleCircumference}
                                        strokeLinecap="round"
                                        className="drop-shadow-md"
                                    />
                                    <defs>
                                        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{averageGoalProgress}%</span>
                                    <span className="text-xs text-slate-400 font-medium">Avg Progress</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 mt-4 relative z-10">
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Goals ({goals.length})</span>
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed ({goals.filter(g => g.status === 'Completed').length})</span>
                            </div>
                        </motion.div>


                    </motion.div>
                </main>
            </div>

            {/* ====== ADD TASK MODAL (Glassmorphism) ====== */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 border border-white/50 dark:border-white/10 relative overflow-hidden"
                        >
                            {/* Decorative background blurs */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Create New Task</h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="E.g., Review Q3 Marketing Metrics"
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Add more details about this task..."
                                        rows={2}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none shadow-sm placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Tag</label>
                                        <select
                                            value={newTask.tag}
                                            onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                        >
                                            {['Design', 'Development', 'Marketing', 'Research', 'Bug Fix', 'Planning', 'Content', 'Other'].map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
                                    />
                                </div>

                                <button type="submit" className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300">
                                    Create Task
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ====== ADD GOAL MODAL ====== */}
            <AnimatePresence>
                {isGoalModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create New Goal</h2>
                                <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleCreateGoal} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Goal Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                        placeholder="E.g., Complete 10 tasks this week"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newGoal.targetDate}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-600 dark:text-slate-300"
                                    />
                                </div>
                                <button type="submit" className="w-full py-3.5 mt-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300">
                                    Create Goal
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;