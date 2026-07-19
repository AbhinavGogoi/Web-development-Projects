import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        };
        const handleClose = () => setIsOpen(false);

        window.addEventListener('openGlobalSearch', handleOpen);
        window.addEventListener('closeAllModals', handleClose);

        return () => {
            window.removeEventListener('openGlobalSearch', handleOpen);
            window.removeEventListener('closeAllModals', handleClose);
        };
    }, []);

    const routes = [
        { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
        { name: 'My Tasks', path: '/tasks', icon: '📋' },
        { name: 'Daily Tasks', path: '/daily-tasks', icon: '⚡' },
        { name: 'Weekly Goals', path: '/goals', icon: '🎯' },
        { name: 'Calendar', path: '/calendar', icon: '📅' },
        { name: 'AI Assistant', path: '/chat', icon: '🤖' },
        { name: 'Settings', path: '/settings', icon: '⚙️' },
        { name: 'Help Center', path: '/help', icon: '❓' },
    ];

    const filteredRoutes = routes.filter(route => 
        route.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (path) => {
        setIsOpen(false);
        setSearchQuery('');
        navigate(path);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: -20 }} 
                        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <svg className="w-6 h-6 text-slate-400 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                ref={inputRef}
                                type="text" 
                                placeholder="Search for pages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent text-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                            />
                            <div className="flex gap-1 ml-4">
                                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold font-mono text-slate-500 dark:text-slate-400">Esc</kbd>
                            </div>
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {filteredRoutes.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
                                    {filteredRoutes.map((route, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSelect(route.path)}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                        >
                                            <span className="text-xl">{route.icon}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{route.name}</span>
                                            <span className="ml-auto text-sm font-medium text-slate-400">Jump to</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
