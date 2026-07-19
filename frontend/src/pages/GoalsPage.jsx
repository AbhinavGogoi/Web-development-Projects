import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { API_BASE } from '../config';

// Status config
const statusConfig = {
    'On Track': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: '#10b981', glow: 'shadow-emerald-100', icon: '🟢' },
    'At Risk': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: '#f59e0b', glow: 'shadow-amber-100', icon: '🟡' },
    'Completed': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: '#2563eb', glow: 'shadow-blue-100', icon: '🏆' },
};

const GoalsPage = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [goals, setGoals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [expandedGoalId, setExpandedGoalId] = useState(null);

    // Form States
    const [newGoal, setNewGoal] = useState({ title: '', targetDate: '', progress: 0, status: 'On Track' });
    const [editingGoal, setEditingGoal] = useState(null);

    // --- Toast Notification ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    // Helper to quickly adjust progress with buttons
    const adjustProgress = (amount) => {
        let currentProgress = parseInt(editingGoal.progress) || 0;
        let newProgress = currentProgress + amount;
        if (newProgress > 100) newProgress = 100;
        if (newProgress < 0) newProgress = 0;

        let newStatus = editingGoal.status || 'On Track';
        if (newProgress === 100) newStatus = 'Completed';
        else if (newProgress < 100 && newStatus === 'Completed') newStatus = 'On Track';

        setEditingGoal({ ...editingGoal, progress: newProgress, status: newStatus });
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');

                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [goalRes, taskRes] = await Promise.all([
                    fetch(`${API_BASE}/goals`, config),
                    fetch(`${API_BASE}/tasks`, config)
                ]);

                if (goalRes.status === 401 || taskRes.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                const goalData = await goalRes.json();
                const taskData = await taskRes.json();

                if (goalRes.ok) setGoals(Array.isArray(goalData) ? goalData : (goalData.goals || []));
                if (taskRes.ok) setTasks(Array.isArray(taskData) ? taskData : (taskData.tasks || []));
            } catch (err) {
                console.error("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // --- COMPUTED ---
    const stats = useMemo(() => {
        const total = goals.length;
        const completed = goals.filter(g => g.status === 'Completed').length;
        const atRisk = goals.filter(g => g.status === 'At Risk').length;
        const onTrack = goals.filter(g => g.status === 'On Track').length;
        const avgProgress = total > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / total) : 0;
        return { total, completed, atRisk, onTrack, avgProgress };
    }, [goals]);

    const filteredGoals = useMemo(() => {
        if (filter === 'All') return goals;
        return goals.filter(g => g.status === filter);
    }, [goals, filter]);

    // --- CRUD ---
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
                setIsModalOpen(false);
                setNewGoal({ title: '', targetDate: '', progress: 0, status: 'On Track' });
                showNotification('🎯 Goal created successfully!');
            } else {
                showNotification(data.message || 'Failed to create goal', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleUpdateGoal = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals/${editingGoal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: editingGoal.title,
                    targetDate: editingGoal.targetDate,
                    progress: editingGoal.progress,
                    status: editingGoal.status
                })
            });
            const data = await response.json();
            if (response.ok) {
                setGoals(prev => prev.map(g => g._id === editingGoal._id ? data.goal : g));
                setIsEditModalOpen(false);
                setEditingGoal(null);
                showNotification('✅ Goal updated!');
            }
        } catch (err) {
            showNotification('Server error while updating.', 'error');
        }
    };

    const handleDeleteGoal = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setGoals(prev => prev.filter(g => g._id !== id));
                showNotification('🗑️ Goal deleted');
            }
        } catch (err) {
            showNotification('Server error while deleting.', 'error');
        }
    };

    const handleQuickProgress = async (goal, amount) => {
        let newProgress = Math.min(100, Math.max(0, (goal.progress || 0) + amount));
        let newStatus = goal.status;
        if (newProgress === 100) newStatus = 'Completed';
        else if (newProgress < 100 && newStatus === 'Completed') newStatus = 'On Track';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/goals/${goal._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ progress: newProgress, status: newStatus })
            });
            const data = await response.json();
            if (response.ok) {
                setGoals(prev => prev.map(g => g._id === goal._id ? data.goal : g));
            }
        } catch (err) {
            showNotification('Failed to update progress', 'error');
        }
    };

    const openEditModal = (goal) => {
        const formattedDate = goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '';
        setEditingGoal({ ...goal, targetDate: formattedDate });
        setIsEditModalOpen(true);
    };

    // --- HELPERS ---
    const getDaysRemaining = (targetDate) => {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10b981';
        if (progress >= 50) return '#3b82f6';
        if (progress >= 25) return '#f59e0b';
        return '#ef4444';
    };

    // SVG Ring helpers
    const ringCircumference = 2 * Math.PI * 36;

    // Framer variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
    };

    // ========================================
    // LOADING STATE
    // ========================================
    if (loading) {
        return (
            <div className="h-screen w-full bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-center justify-center animate-pulse shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-white/80 font-medium text-sm">Loading your goals...</p>
                </motion.div>
            </div>
        );
    }

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <div className="h-screen w-full flex overflow-hidden bg-transparent">

            {/* TOAST */}
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

            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">
                <Sidebar activePage="goals" goalCount={goals.length} />

                <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0 p-4 pb-24 md:p-8 md:pb-8">

                    {/* ====== HEADER ====== */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </span>
                                Weekly Goals
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 ml-[52px]">Track, measure, and crush your big-picture targets.</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] w-full md:w-auto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            New Goal
                        </button>
                    </header>

                    {/* ====== STATS OVERVIEW ====== */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
                    >
                        {/* Overall Progress Donut */}
                        <div className="col-span-2 md:col-span-1 bg-white/60 dark:bg-white/10 dark:backdrop-blur-2xl p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/10 flex flex-col items-center justify-center">
                            <div className="relative w-20 h-20">
                                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                    <motion.circle
                                        initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 32 - (stats.avgProgress / 100) * 2 * Math.PI * 32 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        cx="40" cy="40" r="32"
                                        stroke={getProgressColor(stats.avgProgress)}
                                        strokeWidth="8" fill="transparent"
                                        strokeDasharray={2 * Math.PI * 32}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">{stats.avgProgress}%</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Overall</p>
                        </div>

                        {/* Stat cards */}
                        {[
                            { label: 'Total Goals', value: stats.total, icon: '🎯', color: 'bg-blue-50 text-blue-600' },
                            { label: 'On Track', value: stats.onTrack, icon: '🟢', color: 'bg-emerald-50 text-emerald-600' },
                            { label: 'At Risk', value: stats.atRisk, icon: '🟡', color: 'bg-amber-50 text-amber-600' },
                            { label: 'Completed', value: stats.completed, icon: '🏆', color: 'bg-indigo-50 text-indigo-600' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i, duration: 0.4 }}
                                className="bg-white/60 dark:bg-white/10 dark:backdrop-blur-2xl p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:-translate-y-1 transition-all duration-300"
                            >
                                <span className="text-2xl">{stat.icon}</span>
                                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* ====== FILTER TABS ====== */}
                    <div className="flex items-center gap-3 mb-6 overflow-x-auto py-3 px-1 w-full flex-shrink-0 no-scrollbar">
                        {['All', 'On Track', 'At Risk', 'Completed'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap backdrop-blur-md ${filter === tab
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-white/60 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-white/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab === 'All' ? `All (${stats.total})` :
                                    tab === 'On Track' ? `On Track (${stats.onTrack})` :
                                        tab === 'At Risk' ? `At Risk (${stats.atRisk})` :
                                            `Completed (${stats.completed})`}
                            </button>
                        ))}
                    </div>

                    {/* ====== GOALS GRID ====== */}
                    {filteredGoals.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-24 h-24 rounded-full bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center mb-6">
                                <span className="text-5xl">🎯</span>
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                                {filter === 'All' ? 'No goals yet' : `No ${filter.toLowerCase()} goals`}
                            </h3>
                            <p className="text-slate-400 font-medium text-sm mb-6">
                                {filter === 'All' ? 'Create your first goal to start tracking progress!' : 'Try changing the filter or create a new goal.'}
                            </p>
                            {filter === 'All' && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-md hover:bg-blue-700 transition-colors"
                                >
                                    + Create First Goal
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8"
                        >
                            {filteredGoals.map((goal, index) => {
                                const progress = goal.progress || 0;
                                const sc = statusConfig[goal.status] || statusConfig['On Track'];
                                const daysLeft = getDaysRemaining(goal.targetDate);
                                const isExpanded = expandedGoalId === goal._id;
                                const progressColor = getProgressColor(progress);
                                const ringOffset = ringCircumference - (progress / 100) * ringCircumference;

                                return (
                                    <motion.div
                                        key={goal._id}
                                        variants={cardVariants}
                                        layout
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`bg-white dark:bg-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/10 flex flex-col relative group overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-shadow duration-300 ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
                                    >
                                        {/* Subtle gradient accent at top */}
                                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${progressColor}, ${progressColor}44)` }}></div>

                                        <div className="p-6 flex flex-col flex-1">

                                            {/* Top Row: Ring + Title */}
                                            <div className="flex items-start gap-4 mb-5">
                                                {/* Progress Ring */}
                                                <div className="relative w-14 h-14 flex-shrink-0">
                                                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 80 80">
                                                        <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                                                        <motion.circle
                                                            initial={{ strokeDashoffset: ringCircumference }}
                                                            animate={{ strokeDashoffset: ringOffset }}
                                                            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                                            cx="40" cy="40" r="36"
                                                            stroke={progressColor}
                                                            strokeWidth="6" fill="transparent"
                                                            strokeDasharray={ringCircumference}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">{progress}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate">{goal.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} ${sc.border} border`}>
                                                            {goal.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions dropdown */}
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(goal)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        title="Edit goal"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGoal(goal._id)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Delete goal"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Interactive Progress Bar with quick buttons */}
                                            <div className="mb-4">
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                                        className="h-2.5 rounded-full transition-colors duration-300"
                                                        style={{ backgroundColor: progressColor }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleQuickProgress(goal, -10)}
                                                            className="w-7 h-7 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all text-xs font-bold active:scale-90"
                                                        >
                                                            −
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickProgress(goal, 10)}
                                                            className="w-7 h-7 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all text-xs font-bold active:scale-90"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-[10px] text-slate-300 font-medium ml-1">±10%</span>
                                                    </div>
                                                    {progress === 100 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="text-xs"
                                                        >
                                                            🎉
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom info */}
                                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${daysLeft < 0
                                                    ? 'bg-red-50 text-red-500'
                                                    : daysLeft <= 2
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                    {goal.status === 'Completed'
                                                        ? '✓ Done'
                                                        : daysLeft < 0
                                                            ? `${Math.abs(daysLeft)}d overdue`
                                                            : daysLeft === 0
                                                                ? 'Due today!'
                                                                : `${daysLeft}d left`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </main>
            </div>

            {/* ====== ADD GOAL MODAL ====== */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header gradient */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800/20 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold">Create New Goal</h2>
                                            <p className="text-blue-200 text-xs font-medium">Define your target and start tracking</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800/10 flex items-center justify-center hover:bg-white dark:bg-slate-800/20 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateGoal} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Goal Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGoal.title}
                                        onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="E.g., Ship Beta Feature"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newGoal.targetDate}
                                            onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Initial Status</label>
                                        <select
                                            value={newGoal.status}
                                            onChange={e => setNewGoal({ ...newGoal, status: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            <option value="On Track">On Track</option>
                                            <option value="At Risk">At Risk</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3.5 bg-slate-100 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Create Goal 🎯
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ====== EDIT GOAL MODAL ====== */}
            <AnimatePresence>
                {isEditModalOpen && editingGoal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal header with dynamic progress indicator */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 h-1 bg-white dark:bg-slate-800/10 w-full">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: getProgressColor(editingGoal.progress || 0) }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${editingGoal.progress || 0}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800/10 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold">Update Goal</h2>
                                            <p className="text-slate-400 text-xs font-medium">Adjust progress and details</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800/10 flex items-center justify-center hover:bg-white dark:bg-slate-800/20 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateGoal} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Goal Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingGoal.title || ''}
                                        onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                                        <select
                                            value={editingGoal.status || 'On Track'}
                                            onChange={e => setEditingGoal({ ...editingGoal, status: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            <option value="On Track">On Track</option>
                                            <option value="At Risk">At Risk</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={editingGoal.targetDate || ''}
                                            onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* --- INTERACTIVE PROGRESS UPDATER --- */}
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Goal Progress</label>
                                        <motion.span
                                            key={editingGoal.progress}
                                            initial={{ scale: 1.3 }}
                                            animate={{ scale: 1 }}
                                            className="text-3xl font-extrabold"
                                            style={{ color: getProgressColor(editingGoal.progress || 0) }}
                                        >
                                            {editingGoal.progress || 0}%
                                        </motion.span>
                                    </div>

                                    {/* Visual progress bar */}
                                    <div className="w-full bg-white dark:bg-slate-800 rounded-full h-3 mb-4 border border-slate-100 dark:border-slate-700 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: getProgressColor(editingGoal.progress || 0) }}
                                            animate={{ width: `${editingGoal.progress || 0}%` }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => adjustProgress(-10)}
                                            className="w-11 h-11 flex-shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all active:scale-90"
                                        >
                                            −
                                        </button>

                                        <div className="flex-1 relative flex items-center">
                                            <input
                                                type="range"
                                                min="0" max="100"
                                                value={editingGoal.progress || 0}
                                                onChange={e => adjustProgress(parseInt(e.target.value) - (editingGoal.progress || 0))}
                                                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 relative z-10"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => adjustProgress(10)}
                                            className="w-11 h-11 flex-shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-200 shadow-sm transition-all active:scale-90"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Quick set buttons */}
                                    <div className="flex gap-2 mt-3">
                                        {[0, 25, 50, 75, 100].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => {
                                                    let newStatus = editingGoal.status || 'On Track';
                                                    if (val === 100) newStatus = 'Completed';
                                                    else if (val < 100 && newStatus === 'Completed') newStatus = 'On Track';
                                                    setEditingGoal({ ...editingGoal, progress: val, status: newStatus });
                                                }}
                                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${(editingGoal.progress || 0) === val
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 hover:text-blue-600'
                                                    }`}
                                            >
                                                {val}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-3.5 bg-slate-100 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Save Updates ✓
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GoalsPage;