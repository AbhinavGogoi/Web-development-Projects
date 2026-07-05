import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

import { API_BASE, SERVER_URL } from '../config';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [twoFactor, setTwoFactor] = useState({ isEnabled: false, qrCodeUrl: '', secret: '', token: '', showModal: false });
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Real states for form
    const [profile, setProfile] = useState({ name: '', email: '', role: '', profilePhoto: '' });
    const [preferences, setPreferences] = useState({ theme: 'light', language: 'English', timezone: 'UTC-5 (Eastern Time)', compactMode: false });
    const [notifications, setNotifications] = useState({ emailAlerts: true, pushNotifications: false, weeklyDigest: true, taskReminders: true });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3500);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/users/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        name: data.name || '',
                        email: data.email || '',
                        role: data.profession || '',
                        profilePhoto: data.profilePhoto || ''
                    });
                    if (data.preferences) setPreferences(data.preferences);
                    if (data.notifications) setNotifications(data.notifications);
                    setTwoFactor(prev => ({ ...prev, isEnabled: data.isTwoFactorEnabled || false }));
                }
            } catch (err) {
                console.error("Failed to load settings", err);
                showNotification("Failed to load settings", "error");
            }
        };
        fetchSettings();
    }, [navigate]);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePhoto', file);

        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfile({ ...profile, profilePhoto: data.photoUrl });
                localStorage.setItem('profilePhoto', data.photoUrl); // Sync for Sidebar
                showNotification('Photo uploaded successfully!');
            } else {
                showNotification('Failed to upload photo', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error uploading photo', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            
            // Note: If activeTab === 'security', it should hit a different endpoint for passwords
            // For now, we sync settings tabs:
            const payload = {
                name: profile.name,
                email: profile.email,
                profession: profile.role,
                preferences,
                notifications
            };

            const res = await fetch(`${API_BASE}/users/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('userName', data.name);
                
                // Sync theme to local storage and update app immediately
                if (preferences.theme) {
                    localStorage.setItem('theme', preferences.theme);
                    window.dispatchEvent(new Event('themeChanged'));
                }

                showNotification('Settings saved successfully!');
            } else {
                const error = await res.json();
                showNotification(error.message || 'Failed to save', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error saving settings', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    
    const handleChangePassword = async () => {
        if (!security.currentPassword || !security.newPassword) return showNotification('Please fill all password fields', 'error');
        if (security.newPassword !== security.confirmPassword) return showNotification('New passwords do not match', 'error');
        
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: security.currentPassword, newPassword: security.newPassword })
            });
            if (res.ok) {
                showNotification('Password updated successfully');
                setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const data = await res.json();
                showNotification(data.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            showNotification('Server error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate2FA = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/2fa/generate`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTwoFactor({ ...twoFactor, qrCodeUrl: data.qrCodeUrl, secret: data.secret, showModal: true });
            } else {
                showNotification('Failed to generate 2FA', 'error');
            }
        } catch (error) {
            showNotification('Server error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/2fa/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ token: twoFactor.token })
            });
            if (res.ok) {
                showNotification('2FA enabled successfully');
                setTwoFactor({ ...twoFactor, isEnabled: true, showModal: false, token: '' });
            } else {
                showNotification('Invalid token', 'error');
            }
        } catch (error) {
            showNotification('Server error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/2fa`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showNotification('2FA disabled');
                setTwoFactor({ ...twoFactor, isEnabled: false });
            } else {
                showNotification('Failed to disable 2FA', 'error');
            }
        } catch (error) {
            showNotification('Server error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/users/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                localStorage.clear();
                window.location.href = '/';
            } else {
                showNotification('Failed to delete account', 'error');
            }
        } catch (error) {
            showNotification('Server error', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [

        { id: 'profile', label: 'My Profile', icon: '👤' },
        { id: 'preferences', label: 'Preferences', icon: '🎨' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'security', label: 'Security', icon: '🔒' }
    ];

    // --- RENDER SECTIONS ---

    const renderProfile = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg relative overflow-hidden group">
                    {profile.profilePhoto ? (
                        <img src={`${SERVER_URL}${profile.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        profile.name?.charAt(0).toUpperCase() || 'U'
                    )}
                    <button type="button" onClick={() => document.getElementById('photoUpload').click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" id="photoUpload" hidden onChange={handlePhotoUpload} accept="image/*" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{profile.role}</p>
                    <button type="button" onClick={() => document.getElementById('photoUpload').click()} className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Change Photo</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Role / Title</label>
                    <input type="text" value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
            </div>
        </motion.div>
    );

    const renderPreferences = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Theme</label>
                    <select value={preferences.theme} onChange={(e) => setPreferences({...preferences, theme: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Language</label>
                    <select value={preferences.language} onChange={(e) => setPreferences({...preferences, language: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                    <select value={preferences.timezone} onChange={(e) => setPreferences({...preferences, timezone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                        <option value="UTC+0 (London)">UTC+0 (London)</option>
                        <option value="UTC+1 (Paris)">UTC+1 (Paris)</option>
                    </select>
                </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={preferences.compactMode} onChange={(e) => setPreferences({...preferences, compactMode: e.target.checked})} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${preferences.compactMode ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${preferences.compactMode ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <div>
                        <span className="block font-bold text-slate-700 dark:text-white">Compact Interface</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">Reduce spacing between elements for a denser view.</span>
                    </div>
                </label>
            </div>
        </motion.div>
    );

    const renderNotifications = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Notification Channels</h3>
            
            {[
                { key: 'emailAlerts', title: 'Email Alerts', desc: 'Receive updates via email' },
                { key: 'pushNotifications', title: 'Push Notifications', desc: 'Receive browser notifications' },
                { key: 'weeklyDigest', title: 'Weekly Digest', desc: 'A weekly summary of your goals and tasks' },
                { key: 'taskReminders', title: 'Task Reminders', desc: 'Alerts when tasks are due soon or overdue' },
            ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div>
                        <span className="block font-bold text-slate-700 dark:text-white">{item.title}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
                    </div>
                    <label className="cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={notifications[item.key]} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} />
                            <div className={`block w-12 h-7 rounded-full transition-colors ${notifications[item.key] ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${notifications[item.key] ? 'transform translate-x-5' : ''}`}></div>
                        </div>
                    </label>
                </div>
            ))}
        </motion.div>
    );

    const renderSecurity = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* 2FA Settings */}
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-amber-800 dark:text-amber-400">Two-Factor Authentication</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1 mb-3">Add an extra layer of security to your account. We highly recommend turning this on.</p>
                    {twoFactor.isEnabled ? (
                        <button type="button" onClick={handleDisable2FA} className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-red-600 transition-colors">Disable 2FA</button>
                    ) : (
                        <button type="button" onClick={handleGenerate2FA} className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors">Enable 2FA</button>
                    )}
                </div>
            </div>

            {/* Password Settings */}
            <div className="space-y-4 pt-4">
                <h4 className="font-bold text-slate-800 dark:text-white">Change Password</h4>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                    <input type="password" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                        <input type="password" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                        <input type="password" value={security.confirmPassword} onChange={e => setSecurity({...security, confirmPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                </div>
                <button type="button" onClick={handleChangePassword} className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">Update Password</button>
            </div>
            
            {/* Delete Account */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button type="button" onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Account
                </button>
            </div>

            {/* 2FA Setup Modal */}
            <AnimatePresence>
                {twoFactor.showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 text-center">Setup 2FA</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">Scan this QR code with Google Authenticator or Authy.</p>
                            <div className="flex justify-center mb-6">
                                <img src={twoFactor.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-xl shadow-sm" />
                            </div>
                            <input type="text" placeholder="Enter 6-digit code" value={twoFactor.token} onChange={e => setTwoFactor({...twoFactor, token: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-2xl tracking-[0.5em] font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4" maxLength="6" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setTwoFactor({...twoFactor, showModal: false})} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="button" onClick={handleVerify2FA} className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">Verify</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-red-500/20">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Delete Account?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">This action cannot be undone. All your tasks, goals, and settings will be permanently lost.</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="button" onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
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
                        className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                        {notification.type === 'error' ? '✕' : '✓'} {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex overflow-hidden shadow-2xl transition-colors duration-500">
                {/* Sidebar */}
                <Sidebar activePage="settings" onLogout={handleLogout} />

                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <header className="px-8 py-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex-shrink-0 transition-colors duration-500">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-blue-600 dark:to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </span>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">Manage your account and preferences.</p>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
                            
                            {/* Settings Navigation */}
                            <div className="w-full lg:w-64 flex-shrink-0">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === tab.id
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span className="text-lg">{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Settings Content Area */}
                            <div className="flex-1">
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 min-h-[500px]">
                                    <form onSubmit={handleSave}>
                                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                            {tabs.find(t => t.id === activeTab)?.label}
                                        </h2>
                                        
                                        <AnimatePresence mode="wait">
                                            {activeTab === 'profile' && renderProfile()}
                                            {activeTab === 'preferences' && renderPreferences()}
                                            {activeTab === 'notifications' && renderNotifications()}
                                            {activeTab === 'security' && renderSecurity()}
                                        </AnimatePresence>

                                        {/* Save Button floating at bottom of form */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                            <button type="submit" disabled={isLoading} className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;
