import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { API_BASE } from '../config';

const AIChatPage = () => {
    const navigate = useNavigate();
    
    // --- Basic stats for Sidebar badges ---
    const [taskCount, setTaskCount] = useState(0);
    const [goalCount, setGoalCount] = useState(0);

    const [messages, setMessages] = useState([
        { id: '1', sender: 'ai', text: 'Hello! I am your Taskify AI Assistant. I can help you brainstorm tasks, break down complex goals, or answer questions about productivity. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch stats for the sidebar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchStats = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [taskRes, goalRes] = await Promise.all([
                    fetch(`${API_BASE}/tasks`, config),
                    fetch(`${API_BASE}/goals`, config)
                ]);

                if (taskRes.ok && goalRes.ok) {
                    const taskData = await taskRes.json();
                    const goalData = await goalRes.json();
                    const tasks = taskData.tasks || [];
                    const goals = goalData.goals || [];
                    setTaskCount(tasks.filter(t => t.status !== 'Completed').length);
                    setGoalCount(goals.filter(g => g.status !== 'Completed').length);
                }
            } catch (error) {
                console.error("Failed to fetch stats for sidebar", error);
            }
        };
        fetchStats();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    const handleSendMessage = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;

        const userText = textToSend.trim();
        const userMsgId = Date.now().toString();
        
        // Add user message to UI
        const newMessages = [...messages, { id: userMsgId, sender: 'user', text: userText }];
        setMessages(newMessages);
        if (!textOverride) setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Format history for the backend (excluding the current message we are about to send)
            const history = messages.map(msg => ({ sender: msg.sender, text: msg.text }));

            const response = await fetch(`${API_BASE}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: userText, history })
            });

            const data = await response.json();

            if (response.ok) {
                // Add AI response to UI
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: data.response }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'error', text: 'Sorry, I encountered an error communicating with the server.' }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'error', text: 'Network error. Please check your connection and try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900">
            {/* Sidebar matches exact Dashboard styling */}
            <Sidebar activePage="chat" onLogout={handleLogout} taskCount={taskCount} goalCount={goalCount} />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Header */}
                    <header className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0 z-10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </span>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    Taskify AI
                                    <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Beta</span>
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">Your intelligent productivity partner</p>
                            </div>
                        </div>
                    </header>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 bg-transparent">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {msg.sender === 'user' ? (
                                                <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                    U
                                                </div>
                                            ) : msg.sender === 'error' ? (
                                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-xs shadow-sm">
                                                    !
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                            msg.sender === 'user' 
                                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                                : msg.sender === 'error'
                                                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                                        }`}>
                                            {(() => {
                                                const renderMarkdown = (text) => {
                                                    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                                                    return parts.map((part, index) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
                                                        }
                                                        if (part.startsWith('*') && part.endsWith('*')) {
                                                            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
                                                        }
                                                        return part;
                                                    });
                                                };

                                                if (msg.sender === 'ai' && (msg.text.includes('[INTERACTIVE_GOAL_LIST:') || msg.text.includes('[INTERACTIVE_TASK_LIST:'))) {
                                                    const isTask = msg.text.includes('[INTERACTIVE_TASK_LIST:');
                                                    const regex = isTask 
                                                        ? /\[INTERACTIVE_TASK_LIST:\s*(\{.*\})\s*\]/s 
                                                        : /\[INTERACTIVE_GOAL_LIST:\s*(\{.*\})\s*\]/s;
                                                    const match = msg.text.match(regex);
                                                    
                                                    if (match) {
                                                        const cleanText = msg.text.replace(match[0], '').trim();
                                                        try {
                                                            let jsonStr = match[1];
                                                            // Strip markdown if the AI added it
                                                            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
                                                            else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '');
                                                            
                                                            const data = JSON.parse(jsonStr.trim());
                                                            const itemsArray = Array.isArray(data) ? data : (data.goals || data.tasks || []);

                                                            return (
                                                                <>
                                                                    {cleanText && (
                                                                        <div className="mb-4">
                                                                            {cleanText.split('\n').map((line, i) => (
                                                                                <React.Fragment key={i}>
                                                                                    {renderMarkdown(line)}{i !== cleanText.split('\n').length - 1 && <br />}
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {itemsArray.length > 0 ? (
                                                                        <div className="space-y-2 mt-2">
                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Please select a {isTask ? 'task' : 'goal'}:</p>
                                                                            {itemsArray.map(item => (
                                                                                <button
                                                                                    key={item.id || item._id}
                                                                                    onClick={() => {
                                                                                        const actionText = isTask ? 'mark it as completed' : 'update it';
                                                                                        handleSendMessage(null, `I select the ${isTask ? 'task' : 'goal'}: ${item.title} (ID: ${item.id || item._id}) and want to ${actionText}`);
                                                                                    }}
                                                                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group shadow-sm"
                                                                                >
                                                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700">{item.title}</span>
                                                                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500 transition-colors">
                                                                                        <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                        </svg>
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-slate-500 dark:text-slate-400 italic mt-2">No matching items found.</div>
                                                                    )}
                                                                </>
                                                            );
                                                        } catch (e) {
                                                            console.error("Failed to parse interactive list", e);
                                                        }
                                                    }
                                                }
                                                // Fallback normal text
                                                return msg.text.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {renderMarkdown(line)}
                                                        {i !== msg.text.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex w-full justify-start"
                                >
                                    <div className="flex gap-4 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div className="px-5 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[52px]">
                                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-white/20 border-slate-100 dark:border-slate-700 flex-shrink-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-400 focus-within:bg-white dark:bg-slate-800 shadow-sm">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder="Ask AI to break down a goal, draft a task, or analyze your progress..."
                                    className="w-full bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder-slate-400 py-3 pl-3 pr-2 max-h-32 min-h-[52px] leading-relaxed text-sm"
                                    rows={1}
                                    style={{ height: 'auto' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="w-12 h-12 flex-shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                >
                                    <svg className="w-5 h-5 -mt-0.5 -ml-0.5 transform rotate-[-45deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                            <div className="text-center mt-3">
                                <span className="text-[10px] text-slate-400 font-medium">
                                    Taskify AI can make mistakes. Consider verifying important information.
                                </span>
                            </div>
                        </div>
                    </div>
                </main>
        </div>
    );
};

export default AIChatPage;
