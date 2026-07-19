import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';

const faqs = [
    {
        question: "How do I create a new task?",
        answer: "You can create a new task by navigating to 'My Tasks' from the sidebar and clicking the 'Add Task' button in the top right corner. You can specify a title, priority, due date, and assign it to a category."
    },
    {
        question: "How do I track my goals?",
        answer: "Go to the 'Weekly Goals' page via the sidebar. Here you can create overarching goals. You can adjust the progress of your goals interactively using the +/- buttons on the goal cards, or edit them for more granular control."
    },
    {
        question: "Can I sync my calendar with external apps?",
        answer: "Currently, our calendar view is internal to Taskify. We are actively working on integrations with Google Calendar and Outlook, which will be available in the next major update."
    },
    {
        question: "How do I change my password or email?",
        answer: "Navigate to 'Settings' via the bottom left of the sidebar, then select the 'Security' tab to change your password, or the 'My Profile' tab to update your email address."
    },
    {
        question: "What happens if a task is overdue?",
        answer: "Overdue tasks will be highlighted in red on both your dashboard and the tasks page. They remain in their current status column until you complete or delete them."
    }
];

const HelpCenterPage = () => {
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [contactForm, setContactForm] = useState({ subject: '', message: '' });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [tickets, setTickets] = useState([]);
    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/support/tickets`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTickets(data);
                }
            } catch (err) {
                console.error("Failed to fetch tickets", err);
            }
        };
        fetchTickets();
    }, []);

    useEffect(() => {
        const handleCloseModals = () => setActiveModal(null);
        window.addEventListener('closeAllModals', handleCloseModals);
        return () => window.removeEventListener('closeAllModals', handleCloseModals);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/support/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Message sent! Our support team will get back to you soon.');
                setContactForm({ subject: '', message: '' });
                if (data.ticket) {
                    setTickets(prev => [data.ticket, ...prev]);
                }
            } else {
                showNotification(data.message || 'Failed to send message.', 'error');
            }
        } catch (error) {
            showNotification('Server error. Please try again later.', 'error');
        }
    };

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen w-full flex overflow-hidden bg-transparent">
            {/* Toast */}
            <AnimatePresence>
                {notification.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2 bg-emerald-500 text-white`}
                    >
                        ✓ {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl">
                {/* Sidebar */}
                <Sidebar activePage="help" onLogout={handleLogout} />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="px-8 py-8 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Help Center</h1>
                                <p className="text-slate-500 font-medium text-sm mt-0.5">Find answers and get support.</p>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-4xl mx-auto space-y-10">
                            
                            {/* Hero Search Section */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-10 text-center text-white shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                <h2 className="text-2xl font-extrabold mb-2 relative z-10">How can we help you today?</h2>
                                <p className="text-blue-100 mb-6 relative z-10">Search our knowledge base or browse the FAQs below.</p>
                                <div className="max-w-lg mx-auto relative z-10">
                                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Search for answers..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all shadow-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Main Content (FAQs) */}
                                <div className="md:col-span-2 space-y-6">
                                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                        <span className="text-2xl">📚</span> Frequently Asked Questions
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                                                <button 
                                                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-slate-800 hover:bg-slate-50 transition-colors text-left"
                                                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                                >
                                                    {faq.question}
                                                    <motion.div animate={{ rotate: expandedFaq === idx ? 180 : 0 }}>
                                                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    </motion.div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedFaq === idx && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="px-6 pb-4 text-slate-600 text-sm leading-relaxed"
                                                        >
                                                            {faq.answer}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )) : (
                                            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                                                No results found for "{searchQuery}". Please try another term.
                                            </div>
                                        )}
                                    </div>

                                    {/* My Tickets Section */}
                                    <div className="mt-12 pt-8 border-t border-slate-200">
                                        <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-6">
                                            <span className="text-2xl">🎫</span> My Support Tickets
                                        </h3>
                                        <div className="space-y-3">
                                            {tickets.length > 0 ? tickets.map((ticket, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{ticket.subject}</h4>
                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.message}</p>
                                                        <span className="text-xs font-bold text-slate-400 mt-3 inline-block">
                                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${ticket.status === 'Open' ? 'bg-amber-100 text-amber-700' : ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                                                    You haven't submitted any support tickets yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar (Contact Form) */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-extrabold text-slate-900 mb-2">Still need help?</h3>
                                        <p className="text-sm text-slate-500 mb-6">Send us a message and our support team will respond within 24 hours.</p>
                                        
                                        <form onSubmit={handleContactSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Subject</label>
                                                <select 
                                                    required
                                                    value={contactForm.subject}
                                                    onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                                                >
                                                    <option value="" disabled>Select a topic...</option>
                                                    <option value="billing">Billing / Subscription</option>
                                                    <option value="technical">Technical Issue</option>
                                                    <option value="feature">Feature Request</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Message</label>
                                                <textarea 
                                                    required
                                                    value={contactForm.message}
                                                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                                                    placeholder="How can we help?"
                                                    rows={4}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                                ></textarea>
                                            </div>
                                            <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors">
                                                Send Message
                                            </button>
                                        </form>
                                    </div>

                                    {/* Additional Resources */}
                                    <div className="bg-sky-50 rounded-3xl p-6 border border-sky-100">
                                        <h3 className="font-bold text-sky-900 mb-3">Resources</h3>
                                        <ul className="space-y-2">
                                            <li><button onClick={() => setActiveModal('gettingStarted')} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium"><span className="text-sky-500">→</span> Getting Started Guide</button></li>
                                            <li><button onClick={() => setActiveModal('shortcuts')} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium"><span className="text-sky-500">→</span> Keyboard Shortcuts</button></li>
                                            <li><button onClick={() => setActiveModal('forum')} className="flex items-center gap-2 text-sm text-sky-700 hover:text-sky-900 font-medium"><span className="text-sky-500">→</span> Community Forum</button></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>

            {/* Resource Modals */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            
                            {activeModal === 'gettingStarted' && (
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Getting Started</h3>
                                    <p className="text-slate-500 mb-6 font-medium">Master Taskify in 3 simple steps.</p>
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">1</div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Create your first task</h4>
                                                <p className="text-sm text-slate-500 mt-1">Head over to the Tasks tab and hit the 'Add Task' button. Set a priority and a due date.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">2</div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Set a Weekly Goal</h4>
                                                <p className="text-sm text-slate-500 mt-1">Navigate to the Goals tab to create overarching objectives that tie your tasks together.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">3</div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Customize your workspace</h4>
                                                <p className="text-sm text-slate-500 mt-1">Visit Settings to change your theme, upload a profile photo, and enable 2FA.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'shortcuts' && (
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Keyboard Shortcuts</h3>
                                    <p className="text-slate-500 mb-6 font-medium">Navigate faster without touching your mouse.</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-medium text-slate-700">Global Search</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">Ctrl</kbd><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">K</kbd></div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-medium text-slate-700">New Task</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">Alt</kbd><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">N</kbd></div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-medium text-slate-700">Toggle Theme</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">Ctrl</kbd><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">D</kbd></div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-medium text-slate-700">Close Modals</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold font-mono">Esc</kbd></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'forum' && (
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Community Forum</h3>
                                    <p className="text-slate-500 mb-8 font-medium">We're launching our community forum in Q3! Connect with other users, share templates, and request features.</p>
                                    <button onClick={() => { setActiveModal(null); showNotification('Added to waitlist!'); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all">
                                        Join the Waitlist
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HelpCenterPage;
