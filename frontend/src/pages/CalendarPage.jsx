import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { API_BASE } from '../config';

// Priority colors for task dots
const priorityDotColors = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#10b981',
};

const statusColors = {
    'Pending': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

const priorityColors = {
    'High': { bg: 'bg-red-50', text: 'text-red-600' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-600' },
    'Low': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarPage = () => {
    const navigate = useNavigate();

    // --- STATE ---
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '', description: '', tag: 'Other' });

    const TAGS = ['Design', 'Development', 'Marketing', 'Research', 'Bug Fix', 'Planning', 'Content', 'Other'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Toast ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');

                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [taskRes, goalRes] = await Promise.all([
                    fetch(`${API_BASE}/tasks`, config),
                    fetch(`${API_BASE}/goals`, config)
                ]);

                if (taskRes.status === 401 || goalRes.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                const taskData = await taskRes.json();
                const goalData = await goalRes.json();

                if (taskRes.ok) setTasks(taskData.tasks || []);
                if (goalRes.ok) setGoals(Array.isArray(goalData) ? goalData : (goalData.goals || []));
            } catch (err) {
                console.error("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // --- CALENDAR HELPERS ---
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Previous month trailing days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        const days = [];

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i) });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({ day: d, isCurrentMonth: true, date: new Date(currentYear, currentMonth, d) });
        }

        // Next month leading days to fill 6 rows
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            days.push({ day: d, isCurrentMonth: false, date: new Date(currentYear, currentMonth + 1, d) });
        }

        return days;
    }, [currentYear, currentMonth]);

    // Map tasks and goals to date strings
    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (task.dueDate) {
                const key = new Date(task.dueDate).toDateString();
                if (!map[key]) map[key] = [];
                map[key].push(task);
            }
        });
        return map;
    }, [tasks]);

    const goalsByDate = useMemo(() => {
        const map = {};
        goals.forEach(goal => {
            if (goal.targetDate) {
                const key = new Date(goal.targetDate).toDateString();
                if (!map[key]) map[key] = [];
                map[key].push(goal);
            }
        });
        return map;
    }, [goals]);

    // Monthly stats
    const monthStats = useMemo(() => {
        const monthTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        return {
            total: monthTasks.length,
            completed: monthTasks.filter(t => t.status === 'Completed').length,
            pending: monthTasks.filter(t => t.status === 'Pending').length,
            inProgress: monthTasks.filter(t => t.status === 'In Progress').length,
            overdue: monthTasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < today).length,
        };
    }, [tasks, currentMonth, currentYear]);

    // Selected day items
    const selectedDayTasks = useMemo(() => {
        if (!selectedDate) return [];
        return tasksByDate[selectedDate.toDateString()] || [];
    }, [selectedDate, tasksByDate]);

    const selectedDayGoals = useMemo(() => {
        if (!selectedDate) return [];
        return goalsByDate[selectedDate.toDateString()] || [];
    }, [selectedDate, goalsByDate]);

    // --- NAVIGATION ---
    const goToPrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const goToToday = () => {
        const now = new Date();
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    };

    // --- CREATE TASK ---
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
                setIsCreateModalOpen(false);
                setNewTask({ title: '', priority: 'Medium', dueDate: '', description: '', tag: 'Other' });
                showNotification('📋 Task created!');
            } else {
                showNotification(data.message || 'Failed to create task', 'error');
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
            }
        } catch (err) {
            showNotification('Failed to update', 'error');
        }
    };

    const openCreateForDate = (date) => {
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        setNewTask({ title: '', priority: 'Medium', dueDate: formatted, description: '', tag: 'Other' });
        setIsCreateModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    // --- LOADING ---
    if (loading) {
        return (
            <div className="h-screen w-full bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-center justify-center animate-pulse shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-white/80 font-medium text-sm">Loading calendar...</p>
                </motion.div>
            </div>
        );
    }

    // --- isToday helper ---
    const isToday = (date) => date.toDateString() === today.toDateString();
    const isSelected = (date) => selectedDate && date.toDateString() === selectedDate.toDateString();

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
                        {notification.type === 'error' ? '✕' : '✓'} {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">
                <Sidebar activePage="calendar" taskCount={tasks.length} goalCount={goals.length} onLogout={handleLogout} />

                <main className="flex-1 flex flex-col h-full overflow-hidden p-6 md:p-8">

                    {/* ====== HEADER ====== */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Calendar</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">Visualize your tasks and goals across time.</p>
                            </div>
                        </div>

                        {/* Month navigation */}
                        <div className="flex items-center gap-3">
                            <button onClick={goToToday} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:bg-slate-900/50 transition-all shadow-sm">
                                Today
                            </button>
                            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                                <button onClick={goToPrevMonth} className="px-3 py-2 hover:bg-slate-50/50 dark:bg-slate-900/50 transition-colors text-slate-500 dark:text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200 text-sm min-w-[160px] text-center">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </span>
                                <button onClick={goToNextMonth} className="px-3 py-2 hover:bg-slate-50/50 dark:bg-slate-900/50 transition-colors text-slate-500 dark:text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* ====== MONTH STATS ====== */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-5 flex-shrink-0 overflow-x-auto pb-1"
                    >
                        {[
                            { label: 'This Month', value: monthStats.total, icon: '📋', color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30' },
                            { label: 'Completed', value: monthStats.completed, icon: '✅', color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' },
                            { label: 'In Progress', value: monthStats.inProgress, icon: '⚡', color: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/30' },
                            { label: 'Pending', value: monthStats.pending, icon: '⏳', color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30' },
                            { label: 'Overdue', value: monthStats.overdue, icon: '🚨', color: monthStats.overdue > 0 ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-500/30' : 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20 dark:border-slate-500/30' },
                        ].map(stat => (
                            <div key={stat.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs whitespace-nowrap backdrop-blur-md shadow-sm hover:-translate-y-0.5 transition-transform cursor-default ${stat.color}`}>
                                <span>{stat.icon}</span>
                                <span className="text-sm">{stat.value}</span>
                                <span className="opacity-80 font-medium ml-0.5">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* ====== CALENDAR + DETAIL PANEL ====== */}
                    <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                        {/* --- CALENDAR GRID --- */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className={`bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-700/50 flex flex-col overflow-hidden transition-all duration-300 ${selectedDate ? 'flex-1' : 'w-full'}`}
                        >
                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 border-b border-white/50 dark:border-slate-700/50">
                                {DAYS_OF_WEEK.map(day => (
                                    <div key={day} className="py-4 text-center text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
                                {calendarDays.map((dayInfo, i) => {
                                    const dateKey = dayInfo.date.toDateString();
                                    const dayTasks = tasksByDate[dateKey] || [];
                                    const dayGoals = goalsByDate[dateKey] || [];
                                    const hasItems = dayTasks.length > 0 || dayGoals.length > 0;
                                    const isTodayCell = isToday(dayInfo.date);
                                    const isSelectedCell = isSelected(dayInfo.date);
                                    const isPast = dayInfo.date < today && !isTodayCell;
                                    const hasOverdue = dayTasks.some(t => t.status !== 'Completed' && dayInfo.date < today);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(dayInfo.date)}
                                            className={`relative flex flex-col items-start p-1.5 md:p-2 border-b border-r border-white/30 dark:border-slate-700/30 transition-all duration-150 group min-h-0 overflow-hidden
                                                ${!dayInfo.isCurrentMonth ? 'bg-slate-100/30 dark:bg-slate-900/60' : 'hover:bg-blue-50/50 dark:hover:bg-slate-700/30'}
                                                ${isSelectedCell ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-inset z-10' : ''}
                                            `}
                                        >
                                            {/* Day number */}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 flex-shrink-0 transition-all
                                                ${isTodayCell ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md' : ''}
                                                ${isSelectedCell && !isTodayCell ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : ''}
                                                ${!dayInfo.isCurrentMonth ? 'text-slate-400 dark:text-slate-500' : !isTodayCell && !isSelectedCell ? 'text-slate-700 dark:text-slate-300' : ''}
                                                ${isPast && dayInfo.isCurrentMonth && !isTodayCell ? 'text-slate-400 dark:text-slate-500' : ''}
                                            `}>
                                                {dayInfo.day}
                                            </div>

                                            {/* Task/Goal indicators */}
                                            {hasItems && (
                                                <div className="flex flex-wrap gap-0.5 w-full overflow-hidden flex-1">
                                                    {dayTasks.slice(0, 3).map((task, j) => (
                                                        <div
                                                            key={task._id}
                                                            className={`w-full h-[5px] rounded-full flex-shrink-0 ${task.status === 'Completed' ? 'opacity-40' : ''}`}
                                                            style={{ backgroundColor: priorityDotColors[task.priority] || '#94a3b8' }}
                                                            title={task.title}
                                                        />
                                                    ))}
                                                    {dayGoals.map((goal, j) => (
                                                        <div
                                                            key={goal._id}
                                                            className="w-full h-[5px] rounded-full bg-violet-500 flex-shrink-0"
                                                            title={`🎯 ${goal.title}`}
                                                        />
                                                    ))}
                                                    {dayTasks.length > 3 && (
                                                        <span className="text-[9px] font-bold text-slate-400">+{dayTasks.length - 3}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Add button on hover */}
                                            {dayInfo.isCurrentMonth && (
                                                <div
                                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); openCreateForDate(dayInfo.date); }}
                                                    title="Add task"
                                                >
                                                    +
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-5 py-3 border-t border-slate-50">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <div className="w-3 h-[5px] rounded-full bg-red-500"></div> High
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <div className="w-3 h-[5px] rounded-full bg-amber-500"></div> Medium
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <div className="w-3 h-[5px] rounded-full bg-emerald-500"></div> Low
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <div className="w-3 h-[5px] rounded-full bg-violet-500"></div> Goal
                                </span>
                            </div>
                        </motion.div>

                        {/* --- DAY DETAIL PANEL --- */}
                        <AnimatePresence>
                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, x: 30, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: 340 }}
                                    exit={{ opacity: 0, x: 30, width: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-700/50 flex flex-col overflow-hidden flex-shrink-0"
                                    style={{ width: 340 }}
                                >
                                    {/* Panel header */}
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="w-7 h-7 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                                                {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-1 bg-violet-50 text-violet-600 rounded-lg">
                                                {selectedDayGoals.length} goal{selectedDayGoals.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Panel content */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {/* Goals section */}
                                        {selectedDayGoals.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2 px-1">Goal Deadlines</p>
                                                {selectedDayGoals.map(goal => (
                                                    <div key={goal._id} className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">🎯</span>
                                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{goal.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-full h-1.5">
                                                                <div className="h-1.5 rounded-full bg-violet-500 transition-all" style={{ width: `${goal.progress || 0}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-violet-500">{goal.progress || 0}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tasks section */}
                                        {selectedDayTasks.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Tasks</p>
                                                {selectedDayTasks.map(task => {
                                                    const sc = statusColors[task.status] || statusColors['Pending'];
                                                    const pc = priorityColors[task.priority] || priorityColors['Medium'];
                                                    return (
                                                        <motion.div
                                                            key={task._id}
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 mb-2 hover:shadow-md transition-all group ${task.status === 'Completed' ? 'opacity-60' : ''}`}
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                {/* Status toggle */}
                                                                <button
                                                                    onClick={() => handleToggleStatus(task)}
                                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 ${sc.bg} ${sc.text}`}
                                                                    title={`${task.status} — click to change`}
                                                                >
                                                                    {task.status === 'Completed' ? (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                    ) : task.status === 'In Progress' ? (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                    ) : (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    )}
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className={`font-bold text-sm truncate ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                        {task.title}
                                                                    </h4>
                                                                    {task.description && (
                                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{task.description}</p>
                                                                    )}
                                                                    <div className="flex gap-1.5 mt-1.5">
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>{task.priority}</span>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>{task.status}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Empty state */}
                                        {selectedDayTasks.length === 0 && selectedDayGoals.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10">
                                                <div className="w-16 h-16 rounded-full bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center mb-4">
                                                    <span className="text-3xl">📭</span>
                                                </div>
                                                <p className="text-slate-400 font-bold text-sm mb-1">Nothing scheduled</p>
                                                <p className="text-slate-300 text-xs mb-4">This day is wide open</p>
                                                <button
                                                    onClick={() => openCreateForDate(selectedDate)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md"
                                                >
                                                    + Add Task
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Panel footer */}
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                                        <button
                                            onClick={() => openCreateForDate(selectedDate)}
                                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            Add Task for This Day
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* ====== CREATE TASK MODAL ====== */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold">Add Task</h2>
                                            <p className="text-violet-200 text-xs font-medium">
                                                {newTask.dueDate ? `For ${new Date(newTask.dueDate + 'T00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'Choose a date'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Task Title</label>
                                    <input type="text" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="What needs to be done?" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <textarea value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} placeholder="Add more details..." rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none" />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Priority</label>
                                        <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm">
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tag</label>
                                        <select value={newTask.tag} onChange={e => setNewTask({ ...newTask, tag: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm">
                                            {TAGS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Due Date</label>
                                        <input type="date" required value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm" />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Create Task 📋
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

export default CalendarPage;
