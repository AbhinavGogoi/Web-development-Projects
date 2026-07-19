import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { API_BASE } from '../config';

// Tag types available in the system
const TAGS = ['Design', 'Development', 'Marketing', 'Research', 'Bug Fix', 'Planning', 'Content', 'Other'];

// Tag color mappings
const tagColors = {
    'Design': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    'Development': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Marketing': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'Research': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    'Bug Fix': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Planning': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Content': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    'Other': { bg: 'bg-slate-100', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' }
};

// Priority color mappings
const priorityColors = {
    'High': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', accent: 'border-l-red-500', gradient: 'from-red-500' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', accent: 'border-l-amber-500', gradient: 'from-amber-500' },
    'Low': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', accent: 'border-l-emerald-500', gradient: 'from-emerald-500' }
};

// Kanban column configuration
const columns = [
    { status: 'Pending', label: 'To Do', emoji: '⏳', headerBg: 'bg-amber-500', headerGradient: 'from-amber-400 to-amber-600', headerLight: 'bg-amber-50', textColor: 'text-amber-700', ringColor: 'ring-amber-200' },
    { status: 'In Progress', label: 'In Progress', emoji: '⚡', headerBg: 'bg-blue-500', headerGradient: 'from-blue-400 to-blue-600', headerLight: 'bg-blue-50', textColor: 'text-blue-700', ringColor: 'ring-blue-200' },
    { status: 'Completed', label: 'Done', emoji: '✅', headerBg: 'bg-emerald-500', headerGradient: 'from-emerald-400 to-emerald-600', headerLight: 'bg-emerald-50', textColor: 'text-emerald-700', ringColor: 'ring-emerald-200' }
];

const TasksPage = () => {
    const navigate = useNavigate();

    // --- Data State ---
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '', description: '', tag: 'Other' });
    // --- Modal State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // --- Drag & Drop State ---
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [isOverDelete, setIsOverDelete] = useState(false);

    // --- Filter State ---
    const [filters, setFilters] = useState({ priority: 'All', tag: 'All', deadline: 'All' });

    // --- Toast ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    // --- Fetch Data ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [taskRes, goalRes] = await Promise.all([
                    fetch(`${API_BASE}/tasks`, config),
                    fetch(`${API_BASE}/goals`, config)
                ]);

                if (taskRes.status === 401 || goalRes.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    navigate('/login');
                    return;
                }

                const taskData = await taskRes.json();
                const goalData = await goalRes.json();

                if (taskRes.ok && goalRes.ok) {
                    setTasks(taskData.tasks || []);
                    setGoals(goalData.goals || []);
                } else {
                    setError('Failed to fetch tasks.');
                }
            } catch (err) {
                setError('Server connection error.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // --- Computed: Filter tasks ---
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
        }

        // Priority filter
        if (filters.priority !== 'All') {
            result = result.filter(t => t.priority === filters.priority);
        }

        // Tag filter
        if (filters.tag !== 'All') {
            result = result.filter(t => t.tag === filters.tag);
        }

        // Deadline filter
        if (filters.deadline !== 'All') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 86400000);
            const twoDays = new Date(today.getTime() + 2 * 86400000);
            const threeDays = new Date(today.getTime() + 3 * 86400000);

            switch (filters.deadline) {
                case 'Today':
                    result = result.filter(t => {
                        const d = new Date(t.dueDate);
                        return d >= today && d < tomorrow;
                    });
                    break;
                case 'Tomorrow':
                    result = result.filter(t => {
                        const d = new Date(t.dueDate);
                        return d >= tomorrow && d < twoDays;
                    });
                    break;
                case '2 Days':
                    result = result.filter(t => {
                        const d = new Date(t.dueDate);
                        return d >= today && d < threeDays;
                    });
                    break;
                case 'Overdue':
                    result = result.filter(t => {
                        const d = new Date(t.dueDate);
                        return d < today && t.status !== 'Completed';
                    });
                    break;
            }
        }

        return result;
    }, [tasks, filters, searchQuery]);

    // Tasks grouped by status column
    const columnTasks = useMemo(() => {
        const grouped = {};
        columns.forEach(col => { grouped[col.status] = []; });
        filteredTasks.forEach(task => {
            if (grouped[task.status]) grouped[task.status].push(task);
        });
        return grouped;
    }, [filteredTasks]);

    const activeFiltersCount = Object.values(filters).filter(v => v !== 'All').length + (searchQuery.trim() ? 1 : 0);

    // Stats
    const stats = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        overdue: tasks.filter(t => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now;
        }).length,
    }), [tasks]);

    // Due date helper
    const getDueDateDisplay = (dueDate, status) => {
        if (!dueDate) return { text: 'No date', className: 'text-slate-300' };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

        if (status === 'Completed') {
            return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), className: 'text-slate-300' };
        }
        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, className: 'text-red-500 font-bold' };
        if (diffDays === 0) return { text: 'Due today', className: 'text-amber-600 font-bold' };
        if (diffDays === 1) return { text: 'Tomorrow', className: 'text-amber-500' };
        if (diffDays <= 3) return { text: `${diffDays}d left`, className: 'text-blue-500' };
        return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), className: 'text-slate-400' };
    };

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
                showNotification('📋 Task created!');
            } else {
                showNotification(data.message || 'Failed to create task', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
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
                showNotification('🗑️ Task deleted!');
            } else {
                showNotification('Failed to delete task', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        const task = tasks.find(t => t._id === taskId);
        if (!task || task.status === newStatus) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
                showNotification(`→ ${newStatus}`);
            } else {
                showNotification('Failed to move task', 'error');
            }
        } catch (err) {
            showNotification('Server error.', 'error');
        }
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tasks/${editingTask._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: editingTask.title,
                    priority: editingTask.priority,
                    dueDate: editingTask.dueDate,
                    description: editingTask.description,
                    tag: editingTask.tag,
                    status: editingTask.status
                })
            });
            const data = await response.json();
            if (response.ok) {
                setTasks(prev => prev.map(task => task._id === editingTask._id ? data.task : task));
                setIsEditModalOpen(false);
                setEditingTask(null);
                showNotification('✅ Task updated!');
            } else {
                showNotification(data.message || 'Failed to update task', 'error');
            }
        } catch (err) {
            showNotification('Server error while updating.', 'error');
        }
    };

    const openEditModal = (task) => {
        const formattedDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
        setEditingTask({ ...task, dueDate: formattedDate });
        setIsEditModalOpen(true);
    };

    // ========================================
    // DRAG & DROP HANDLERS
    // ========================================

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTaskId(taskId);
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setIsDragging(false);
        setDragOverColumn(null);
        setIsOverDelete(false);
    };

    const handleColumnDragOver = (e, status) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
        setIsOverDelete(false);
    };

    const handleColumnDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleColumnDrop = (e, targetStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        setDragOverColumn(null);
        setIsDragging(false);
        setDraggedTaskId(null);
        handleUpdateStatus(taskId, targetStatus);
    };

    const handleDeleteDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOverDelete(true);
        setDragOverColumn(null);
    };

    const handleDeleteDragLeave = () => {
        setIsOverDelete(false);
    };

    const handleDeleteDrop = (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        setIsOverDelete(false);
        setIsDragging(false);
        setDraggedTaskId(null);
        handleDeleteTask(taskId);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    // ========================================
    // LOADING / ERROR STATES
    // ========================================
    if (loading) {
        return (
            <div className="h-screen w-full bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-center justify-center animate-pulse shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white dark:bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-white/80 font-medium text-sm">Loading your tasks...</p>
                </motion.div>
            </div>
        );
    }

    if (error && tasks.length === 0) {
        return (
            <div className="h-screen w-full bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Connection Error</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Try Again</button>
                </motion.div>
            </div>
        );
    }

    // ========================================
    // MAIN RENDER
    // ========================================
    return (
        <div className="h-screen w-full flex overflow-hidden bg-transparent">

            {/* Toast */}
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

            {/* Main Window */}
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">

                {/* Shared Sidebar */}
                <Sidebar
                    activePage="tasks"
                    taskCount={tasks.length}
                    goalCount={goals.length}
                    onLogout={handleLogout}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto md:overflow-hidden p-4 md:p-8">

                    {/* ====== HEADER ====== */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </span>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Deadlines</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">Drag and drop to organize your workflow.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98] flex-shrink-0 w-full md:w-auto"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add Deadline
                        </button>
                    </header>

                    {/* ====== STATS CHIPS ====== */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-4 flex-shrink-0 overflow-x-auto pb-2 w-full no-scrollbar"
                    >
                        {[
                            { label: 'Total', value: stats.total, icon: '📋', color: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-500/30' },
                            { label: 'To Do', value: stats.pending, icon: '⏳', color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30' },
                            { label: 'Active', value: stats.inProgress, icon: '⚡', color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30' },
                            { label: 'Done', value: stats.completed, icon: '✅', color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30' },
                            ...(stats.overdue > 0 ? [{ label: 'Overdue', value: stats.overdue, icon: '🚨', color: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20 dark:border-red-500/30' }] : []),
                        ].map(stat => (
                            <div key={stat.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs whitespace-nowrap backdrop-blur-md shadow-sm hover:-translate-y-0.5 transition-transform cursor-default ${stat.color}`}>
                                <span>{stat.icon}</span>
                                <span className="text-sm">{stat.value}</span>
                                <span className="opacity-80 font-medium ml-0.5">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* ====== FILTER BAR ====== */}
                    <div className="flex flex-nowrap md:flex-wrap items-center gap-3 mb-5 flex-shrink-0 overflow-x-auto pb-2 w-full no-scrollbar">
                        {/* Search */}
                        <div className="relative flex-shrink-0">
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none w-56 md:w-48 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Priority Filter */}
                        <div className="relative">
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
                                className="appearance-none pl-3 pr-8 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                            >
                                <option value="All">All Priorities</option>
                                <option value="High">🔴 High</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="Low">🟢 Low</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* Tag Filter */}
                        <div className="relative">
                            <select
                                value={filters.tag}
                                onChange={(e) => setFilters(f => ({ ...f, tag: e.target.value }))}
                                className="appearance-none pl-3 pr-8 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                            >
                                <option value="All">All Tags</option>
                                {TAGS.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* Deadline Filter */}
                        <div className="relative">
                            <select
                                value={filters.deadline}
                                onChange={(e) => setFilters(f => ({ ...f, deadline: e.target.value }))}
                                className="appearance-none pl-3 pr-8 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all"
                            >
                                <option value="All">All Deadlines</option>
                                <option value="Today">📅 Due Today</option>
                                <option value="Tomorrow">📅 Due Tomorrow</option>
                                <option value="2 Days">📅 Within 2 Days</option>
                                <option value="Overdue">🚨 Overdue</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => { setFilters({ priority: 'All', tag: 'All', deadline: 'All' }); setSearchQuery(''); }}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:scale-105 hover:shadow-lg active:scale-95 transition-all shadow-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                Clear ({activeFiltersCount})
                            </motion.button>
                        )}

                        {/* Results count */}
                        <span className="text-xs font-medium text-slate-400 ml-auto">
                            {filteredTasks.length} of {tasks.length} tasks
                        </span>
                    </div>

                    {/* ====== KANBAN BOARD ====== */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 md:overflow-hidden min-h-0 pb-24 md:pb-0">
                        {columns.map((col) => {
                            const colTasks = columnTasks[col.status] || [];
                            const isDropTarget = dragOverColumn === col.status;

                            return (
                                <div
                                    key={col.status}
                                    className={`flex flex-col rounded-3xl transition-all duration-300 md:min-h-0 md:overflow-hidden ${isDropTarget
                                        ? `bg-blue-50/80 dark:bg-blue-900/20 ring-2 ${col.ringColor} ring-dashed`
                                        : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-xl'
                                        }`}
                                    onDragOver={(e) => handleColumnDragOver(e, col.status)}
                                    onDragLeave={handleColumnDragLeave}
                                    onDrop={(e) => handleColumnDrop(e, col.status)}
                                >
                                    {/* Column Header */}
                                    <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0">
                                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${col.headerGradient} flex items-center justify-center text-white text-xs shadow-sm`}>
                                            {col.emoji}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{col.label}</h3>
                                        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-lg ${col.headerLight} ${col.textColor}`}>
                                            {colTasks.length}
                                        </span>
                                    </div>

                                    {/* Column Cards */}
                                    <div className="flex-1 md:overflow-y-auto px-3 pb-3 space-y-2.5 min-h-[150px] md:min-h-0">
                                        <AnimatePresence mode="popLayout">
                                            {colTasks.length > 0 ? (
                                                colTasks.map((task) => {
                                                    const pc = priorityColors[task.priority] || priorityColors['Medium'];
                                                    const tc = tagColors[task.tag] || tagColors['Other'];
                                                    const isDraggedItem = draggedTaskId === task._id;
                                                    const dueDisplay = getDueDateDisplay(task.dueDate, task.status);

                                                    return (
                                                        <motion.div
                                                            key={task._id}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: isDraggedItem ? 0.4 : 1, y: 0, scale: isDraggedItem ? 0.95 : 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            whileHover={{ scale: 1.02, y: -4 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            transition={{ duration: 0.2 }}
                                                            draggable="true"
                                                            onDragStart={(e) => handleDragStart(e, task._id)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`bg-white dark:bg-white/10 dark:backdrop-blur-2xl rounded-2xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/10 cursor-grab active:cursor-grabbing hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-shadow duration-300 border-l-[4px] ${pc.accent} group ${task.status === 'Completed' ? 'opacity-60 grayscale-[0.3]' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2 relative">
                                                                <h4 className={`font-extrabold text-sm pr-6 leading-snug ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>{task.title}</h4>

                                                                <div className="absolute right-0 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-100 dark:border-slate-800 z-10">
                                                                    <button
                                                                        onClick={() => openEditModal(task)}
                                                                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                                                                        title="Edit Task"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                                                                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                                        title="Delete task"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Description */}
                                                            {task.description && (
                                                                <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                                                            )}

                                                            {/* Badges Row */}
                                                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pc.bg} ${pc.text}`}>
                                                                    {task.priority}
                                                                </span>
                                                                {task.tag && task.tag !== 'Other' && (
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tc.bg} ${tc.text}`}>
                                                                        {task.tag}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Footer: Due Date & Status Quick-Toggles */}
                                                            <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100 dark:border-white/5">
                                                                <span className={`text-[11px] font-medium flex items-center gap-1 ${dueDisplay.className}`}>
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                    {dueDisplay.text}
                                                                </span>

                                                                {/* Status Segmented Control (iOS style) */}
                                                                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(task._id, 'Pending')}
                                                                        className={`flex items-center justify-center w-7 h-6 rounded-md transition-all duration-200 ${task.status === 'Pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-500 scale-105' : 'text-slate-400 md:hover:text-slate-600 dark:md:hover:text-slate-300 opacity-70 md:hover:opacity-100'}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                                                                        className={`flex items-center justify-center w-7 h-6 rounded-md transition-all duration-200 ${task.status === 'In Progress' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500 scale-105' : 'text-slate-400 md:hover:text-slate-600 dark:md:hover:text-slate-300 opacity-70 md:hover:opacity-100'}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(task._id, 'Completed')}
                                                                        className={`flex items-center justify-center w-7 h-6 rounded-md transition-all duration-200 ${task.status === 'Completed' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-500 scale-105' : 'text-slate-400 md:hover:text-slate-600 dark:md:hover:text-slate-300 opacity-70 md:hover:opacity-100'}`}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col items-center justify-center py-10 text-slate-300"
                                                >
                                                    <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                                    <p className="text-xs font-medium italic">
                                                        {activeFiltersCount > 0 ? 'No tasks match filters' : 'Drop tasks here'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ====== DELETE DROP ZONE ====== */}
                    <AnimatePresence>
                        {isDragging && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                                onDragOver={handleDeleteDragOver}
                                onDragLeave={handleDeleteDragLeave}
                                onDrop={handleDeleteDrop}
                                className={`mt-4 flex-shrink-0 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 py-5 transition-all duration-200 ${isOverDelete
                                    ? 'border-red-400 bg-red-100 scale-[1.02]'
                                    : 'border-red-300/60 bg-red-50/60'
                                    }`}
                            >
                                <svg className={`w-6 h-6 transition-colors ${isOverDelete ? 'text-red-600' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className={`font-bold text-sm transition-colors ${isOverDelete ? 'text-red-600' : 'text-red-400'}`}>
                                    {isOverDelete ? 'Release to delete!' : 'Drop here to delete task'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </main>
            </div>

            {/* ====== CREATE TASK MODAL ====== */}
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
                            className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 border border-white/50 dark:border-slate-700/50 relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
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
                                            {TAGS.map(tag => (
                                                <option key={tag} value={tag}>{tag}</option>
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

            {/* ====== EDIT TASK MODAL ====== */}
            <AnimatePresence>
                {isEditModalOpen && editingTask && (
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
                            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Edit header */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold">Edit Task</h2>
                                            <p className="text-slate-400 text-xs font-medium">Update details and priority</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateTask} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingTask.title || ''}
                                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                                    <textarea
                                        value={editingTask.description || ''}
                                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                        placeholder="Add more details..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Status</label>
                                        <select
                                            value={editingTask.status || 'Pending'}
                                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        >
                                            <option value="Pending">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Priority</label>
                                        <select
                                            value={editingTask.priority || 'Medium'}
                                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tag</label>
                                        <select
                                            value={editingTask.tag || 'Other'}
                                            onChange={(e) => setEditingTask({ ...editingTask, tag: e.target.value })}
                                            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                        >
                                            {TAGS.map(tag => (
                                                <option key={tag} value={tag}>{tag}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Due Date</label>
                                        <input
                                            type="date"
                                            value={editingTask.dueDate || ''}
                                            onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                            className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Save Changes ✓
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

export default TasksPage;
