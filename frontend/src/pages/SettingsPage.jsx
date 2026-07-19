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
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">My Profile</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your personal information</p>
                </div>
            </div>

            <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-3xl text-white font-bold shadow-xl shadow-blue-500/20 relative overflow-hidden group/photo z-10">
                    {profile.profilePhoto ? (
                        <img src={`${SERVER_URL}${profile.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        profile.name?.charAt(0).toUpperCase() || 'U'
                    )}
                    <button type="button" onClick={() => document.getElementById('photoUpload').click()} className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <input type="file" id="photoUpload" hidden onChange={handlePhotoUpload} accept="image/*" />
                </div>
                <div className="z-10">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{profile.role}</p>
                    <button type="button" onClick={() => document.getElementById('photoUpload').click()} className="mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">Change Photo</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name Input */}
                <div className="group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                    </div>
                    <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                </div>
                {/* Email Input */}
                <div className="group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-violet-300 dark:hover:border-violet-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                    </div>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium" />
                </div>
                {/* Role Input */}
                <div className="md:col-span-2 group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Role / Title</label>
                    </div>
                    <input type="text" value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                </div>
            </div>
        </motion.div>
    );

    const renderPreferences = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">Preferences</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Customize your app experience</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Theme Select */}
                <div className="group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-pink-300 dark:hover:border-pink-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Theme</label>
                    </div>
                    <div className="relative">
                        <select value={preferences.theme} onChange={(e) => setPreferences({...preferences, theme: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-medium appearance-none cursor-pointer relative z-10">
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="system">System Default</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Language Select */}
                <div className="group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Language</label>
                    </div>
                    <div className="relative">
                        <select value={preferences.language} onChange={(e) => setPreferences({...preferences, language: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium appearance-none cursor-pointer relative z-10">
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Timezone Select */}
                <div className="md:col-span-2 group relative p-5 rounded-3xl transition-all duration-300 border bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm hover:border-teal-300 dark:hover:border-teal-500/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <label className="font-bold text-slate-700 dark:text-slate-300">Timezone</label>
                    </div>
                    <div className="relative">
                        <select value={preferences.timezone} onChange={(e) => setPreferences({...preferences, timezone: e.target.value})} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none cursor-pointer relative z-10">
                            <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                            <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                            <option value="UTC+0 (London)">UTC+0 (London)</option>
                            <option value="UTC+1 (Paris)">UTC+1 (Paris)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Compact Interface Toggle */}
            <div className={`mt-6 p-5 rounded-3xl transition-all duration-300 border flex items-center justify-between gap-4 relative overflow-hidden ${preferences.compactMode ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none scale-[1.02]' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500/30'}`}>
                {preferences.compactMode && <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl pointer-events-none"></div>}
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${preferences.compactMode ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
                    </div>
                    <div className="pr-2">
                        <span className={`block font-bold mb-1 transition-colors ${preferences.compactMode ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Compact Interface</span>
                        <span className="block text-xs font-medium text-slate-500">Reduce spacing between elements for a denser view.</span>
                    </div>
                </div>
                
                <label className="cursor-pointer flex-shrink-0 relative z-10">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={preferences.compactMode} onChange={(e) => setPreferences({...preferences, compactMode: e.target.checked})} />
                        <div className={`block w-12 h-6 rounded-full transition-all duration-300 ${preferences.compactMode ? 'bg-blue-500 shadow-md shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${preferences.compactMode ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
        </motion.div>
    );

    const renderNotifications = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">Notification Channels</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Choose how you want to be notified</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                    { key: 'emailAlerts', title: 'Email Alerts', desc: 'Receive updates via email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'blue' },
                    { key: 'pushNotifications', title: 'Push Notifications', desc: 'Browser push notifications', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'amber' },
                    { key: 'weeklyDigest', title: 'Weekly Digest', desc: 'A weekly summary of goals', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'emerald' },
                    { key: 'taskReminders', title: 'Task Reminders', desc: 'Alerts for due tasks', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'purple' },
                ].map((item, index) => {
                    const colorMap = {
                        blue: { bgActive: 'bg-blue-100 dark:bg-blue-500/20', textActive: 'text-blue-600 dark:text-blue-400', toggle: 'bg-blue-500 shadow-blue-500/30', borderHover: 'hover:border-blue-300 dark:hover:border-blue-500/30', glow: 'from-blue-500/5' },
                        amber: { bgActive: 'bg-amber-100 dark:bg-amber-500/20', textActive: 'text-amber-600 dark:text-amber-400', toggle: 'bg-amber-500 shadow-amber-500/30', borderHover: 'hover:border-amber-300 dark:hover:border-amber-500/30', glow: 'from-amber-500/5' },
                        emerald: { bgActive: 'bg-emerald-100 dark:bg-emerald-500/20', textActive: 'text-emerald-600 dark:text-emerald-400', toggle: 'bg-emerald-500 shadow-emerald-500/30', borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-500/30', glow: 'from-emerald-500/5' },
                        purple: { bgActive: 'bg-purple-100 dark:bg-purple-500/20', textActive: 'text-purple-600 dark:text-purple-400', toggle: 'bg-purple-500 shadow-purple-500/30', borderHover: 'hover:border-purple-300 dark:hover:border-purple-500/30', glow: 'from-purple-500/5' }
                    };
                    const colors = colorMap[item.color];
                    const isActive = notifications[item.key];

                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={item.key} 
                            className={`group relative flex items-start gap-4 p-5 rounded-3xl transition-all duration-300 border ${isActive ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none scale-[1.02]' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50'} ${colors.borderHover}`}
                        >
                            {/* Glow effect */}
                            {isActive && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} to-transparent rounded-3xl pointer-events-none`}></div>
                            )}
                            
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? `${colors.bgActive} ${colors.textActive}` : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                            </div>
                            
                            <div className="flex-1 pr-2 pt-1">
                                <span className={`block font-bold mb-1 transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{item.title}</span>
                                <span className="block text-xs font-medium text-slate-500 dark:text-slate-500">{item.desc}</span>
                            </div>
                            
                            <label className="cursor-pointer flex-shrink-0 mt-2">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isActive} onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (item.key === 'pushNotifications' && checked) {
                                            if ('Notification' in window) {
                                                Notification.requestPermission().then(permission => {
                                                    if (permission === 'granted') {
                                                        setNotifications({...notifications, [item.key]: true});
                                                        new Notification('Push Notifications Enabled', { body: 'You will now receive alerts for important updates.' });
                                                    } else {
                                                        showNotification('Permission denied for Push Notifications', 'error');
                                                        setNotifications({...notifications, [item.key]: false});
                                                    }
                                                });
                                            } else {
                                                showNotification('Browser does not support notifications', 'error');
                                            }
                                        } else {
                                            setNotifications({...notifications, [item.key]: checked});
                                        }
                                    }} />
                                    <div className={`block w-12 h-6 rounded-full transition-all duration-300 ${isActive ? `${colors.toggle} shadow-md` : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${isActive ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );

    const renderSecurity = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">Security</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Protect your account and data</p>
                </div>
            </div>

            {/* 2FA Settings */}
            <div className="group relative p-6 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:border-amber-300 dark:hover:border-amber-500/30 transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center gap-5">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"></div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400 relative z-10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div className="flex-1 relative z-10">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Add an extra layer of security to your account. We highly recommend turning this on.</p>
                </div>
                <div className="relative z-10 flex-shrink-0">
                    {twoFactor.isEnabled ? (
                        <button type="button" onClick={handleDisable2FA} className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-900/50">Disable 2FA</button>
                    ) : (
                        <button type="button" onClick={handleGenerate2FA} className="px-6 py-3 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors">Enable 2FA</button>
                    )}
                </div>
            </div>

            {/* Password Settings */}
            <div className="group relative p-6 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 mt-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Change Password</h4>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                    <input type="password" value={security.currentPassword} onChange={e => setSecurity({...security, currentPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                        <input type="password" value={security.newPassword} onChange={e => setSecurity({...security, newPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                        <input type="password" value={security.confirmPassword} onChange={e => setSecurity({...security, confirmPassword: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                    </div>
                </div>
                <div className="pt-2">
                    <button type="button" onClick={handleChangePassword} className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">Update Password</button>
                </div>
            </div>
            
            {/* Delete Account */}
            <div className="pt-6 mt-6">
                <button type="button" onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-900/50 group">
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Account
                </button>
            </div>

            {/* 2FA Setup Modal */}
            <AnimatePresence>
                {twoFactor.showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
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
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-red-500/20">
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
                                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-3xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
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
                                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 min-h-[500px]">
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
