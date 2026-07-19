import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskMonitor from './TaskMonitor';

const Sidebar = ({ activePage = 'dashboard', taskCount = 0, goalCount = 0, onLogout }) => {
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            id: 'tasks',
            label: 'Deadlines',
            path: '/tasks',
            badge: taskCount,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            id: 'daily',
            label: 'Daily Tasks',
            path: '/daily-tasks',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'calendar',
            label: 'Calendar',
            path: '/calendar',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'goals',
            label: 'Weekly Goals',
            path: '/goals',
            badge: goalCount,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        }
    ];

    const handleNavClick = (item) => {
        setIsMobileOpen(false); // Close mobile menu when navigating
        if (item.action) {
            item.action();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const handleGeneralNav = (path) => {
        setIsMobileOpen(false);
        navigate(path);
    };

    return (
        <>
            <TaskMonitor />
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-[60] w-14 h-14 bg-blue-600 rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-white active:scale-95 transition-transform"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-[80] w-72 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 p-6 flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0 md:w-64 md:bg-white/50 md:dark:bg-slate-900/50 ${isMobileOpen ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'}`}>
            <div>
                {/* Brand Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <img src="/logo.png" alt="Taskify Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Taskify</span>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
                    {navItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-colors text-left relative ${isActive
                                        ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm font-bold border border-slate-100 dark:border-white/10 dark:backdrop-blur-xl'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full"></div>
                                )}
                                {item.icon}
                                {item.label}
                                {item.badge !== undefined && (
                                    <span className={`ml-auto py-0.5 px-2 rounded-full text-xs font-bold ${isActive ? 'bg-blue-500 text-white dark:bg-blue-500 dark:text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{item.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <nav className="space-y-1 mt-8">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">General</p>
                    <button 
                        onClick={() => handleGeneralNav('/settings')} 
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-medium transition-colors text-left relative ${activePage === 'settings'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold border border-slate-100 dark:border-slate-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                    >
                        {activePage === 'settings' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full"></div>}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </button>
                    <button 
                        onClick={() => handleGeneralNav('/help')} 
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-medium transition-colors text-left relative ${activePage === 'help'
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold border border-slate-100 dark:border-slate-700'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                        }`}
                    >
                        {activePage === 'help' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-r-full"></div>}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help Center
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl font-medium transition-colors mt-4 text-left">
                        Logout
                    </button>
                </nav>
            </div>

            {/* AI Mobile App Promo Box */}
            <div className="bg-slate-900 rounded-3xl p-5 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 translate-x-10 -translate-y-10"></div>
                <h4 className="font-bold mb-1 relative z-10">Meet your AI Assistant</h4>
                <p className="text-xs text-slate-400 mb-4 relative z-10">Chat normally, create tasks instantly.</p>
                <button 
                    onClick={() => handleGeneralNav('/chat')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors relative z-10"
                >
                    Open Chat
                </button>
            </div>
        </aside>
        </>
    );
};

export default Sidebar;