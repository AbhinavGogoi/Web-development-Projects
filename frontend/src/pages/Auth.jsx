import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import useNavigate
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate(); // Initialize the navigate hook

    // State to hold the user's input
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    // State to hold any error messages from the backend
    const [error, setError] = useState('');
    const [is2FAStep, setIs2FAStep] = useState(false);
    const [loginUserId, setLoginUserId] = useState(null);
    const [twoFactorToken, setTwoFactorToken] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear errors when user types
    };

    // The Login Submission Logic
    const handleLoginSubmit = async (e) => {
        e.preventDefault(); // Prevents the page from refreshing

        try {
            // Call the Node/Express backend we built in Phase 2
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requires2FA) {
                    setIs2FAStep(true);
                    setLoginUserId(data.userId);
                    return;
                }
                // SUCCESS: Save the JWT token to local storage so we stay logged in
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user?.name || 'User');
                localStorage.setItem('profilePhoto', data.user?.profilePhoto || '');

                // Redirect the user to the dashboard smoothly
                navigate('/dashboard');
            } else {
                // FAILED: Show the error message from our backend
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Server error. Is your backend running?');
        }
    };

    
    const handleVerify2FASubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/auth/login-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: loginUserId, token: twoFactorToken })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user?.name || 'User');
                localStorage.setItem('profilePhoto', data.user?.profilePhoto || '');
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid 2FA token.');
            }
        } catch (err) {
            setError('Server error.');
        }
    };
    
    // The Registration Submission Logic

    const handleRegisterSubmit = async (e) => {
        e.preventDefault(); // Prevents the page from refreshing

        try {
            // Call the Register endpoint we built in Phase 2
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS: Save the JWT token to local storage so we stay logged in
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user?.name || 'User');
                localStorage.setItem('profilePhoto', data.user?.profilePhoto || '');

                // Redirect the user to the dashboard smoothly
                navigate('/dashboard');
            } else {
                // FAILED: Show the error message from our backend
                setError(data.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            setError('Server error. Is your backend running?');
        }
    };
    // Framer Motion variants for the sliding form animations
    const formVariants = {
        hidden: { opacity: 0, x: isLogin ? -40 : 40 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: isLogin ? 40 : -40, transition: { duration: 0.3, ease: "easeIn" } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center px-4 md:px-8 relative overflow-hidden py-12">

            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>

            {/* Back to Home Link */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white font-medium hover:text-blue-100 transition-colors z-20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </Link>

            {/* The Expanded, Split-Screen Glassmorphism Card */}
            <motion.div
                layout
                className="w-full max-w-4xl bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white relative z-10 flex flex-col md:flex-row overflow-hidden"
            >

                {/* --- LEFT SIDE: The Unique Visual Feature --- */}
                {/* Hidden on mobile, takes up 50% width on desktop */}
                <motion.div layout className="hidden md:flex md:w-1/2 relative bg-blue-900 overflow-hidden p-10 flex-col justify-between">
                    {/* Premium Abstract Image from Unsplash */}
                    <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                        alt="Abstract fluid design"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                    />

                    {/* Top Logo embedded in the image side */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 w-full h-1/3 bg-white dark:bg-slate-800/30 rounded-t-xl"></div>
                        </div>
                        <span className="text-white font-bold text-2xl tracking-wide">Taskify</span>
                    </div>

                    {/* Bottom Motivational Quote */}
                    <div className="relative z-10 mt-auto">
                        <h3 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                            Plan your week.<br />
                            <span className="font-['Caveat',_cursive] text-sky-300 text-5xl font-medium tracking-wide">Execute with AI.</span>
                        </h3>
                        <p className="text-blue-100/80 font-medium">Join 10,000+ users mastering their workflow today.</p>
                    </div>
                </motion.div>


                {/* --- RIGHT SIDE: The Dynamic Auth Form --- */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-800/50">

                    {/* Brand Header for Mobile (Only shows when the left image is hidden) */}
                    <motion.div layout className="flex flex-col items-start mb-8">
                        <div className="md:hidden w-12 h-12 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative overflow-hidden shadow-inner mb-4">
                            <div className="absolute top-0 w-full h-1/3 bg-white dark:bg-slate-800/30 rounded-t-xl"></div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                            {isLogin ? 'Enter your details to access your dashboard.' : 'Start mastering your workflow today.'}
                        </p>
                    </motion.div>

                    {/* The Animated Form Container */}
                    <div className="relative">
                        <AnimatePresence mode="popLayout">
                            {is2FAStep ? (
                                <motion.form key="2fa" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleVerify2FASubmit}>
                                    {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl font-medium border border-red-100">{error}</div>}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enter 2FA Code</label>
                                        <input type="text" value={twoFactorToken} onChange={e => {setTwoFactorToken(e.target.value); setError('');}} required placeholder="123456" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-[0.5em] text-2xl transition-all shadow-sm" maxLength="6" />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-4">
                                        Verify & Login
                                    </button>
                                    <button type="button" onClick={() => setIs2FAStep(false)} className="w-full py-2 bg-transparent text-slate-500 font-bold hover:text-slate-700 transition-colors">
                                        Cancel
                                    </button>
                                </motion.form>
                            ) : isLogin ? (
                                // --- LOGIN FORM ---
                                // --- LOGIN FORM ---
                                <motion.form
                                    key="login"
                                    layout
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex flex-col gap-4"
                                    onSubmit={handleLoginSubmit} // Add onSubmit here
                                >
                                    {/* Error Message Display */}
                                    {error && (
                                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl font-medium border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            name="email" // Add name
                                            value={formData.email} // Bind to state
                                            onChange={handleChange} // Track typing
                                            required
                                            placeholder="hello@taskify.com"
                                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password" // <--- ADD THIS
                                            required
                                            placeholder="Create a strong password"
                                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="flex justify-end mb-2">
                                        <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                                    </div>

                                    {/* Change type="button" to type="submit" */}
                                    <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                        Sign In
                                    </button>
                                </motion.form>
                            ) : (
                                // --- REGISTRATION FORM ---
                                // --- REGISTRATION FORM ---
                                <motion.form
                                    key="register"
                                    layout
                                    variants={formVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex flex-col gap-4"
                                    onSubmit={handleRegisterSubmit} // <--- 1. Add onSubmit here
                                >
                                    {/* Share the same Error Message Display */}
                                    {error && (
                                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl font-medium border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            name="name" // <--- 2. Add name
                                            value={formData.name} // <--- 3. Bind to state
                                            onChange={handleChange} // <--- 4. Track typing
                                            autoComplete="name"
                                            required
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="email"
                                            required
                                            placeholder="hello@taskify.com"
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                            placeholder="Create a strong password"
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* 5. Change type="button" to type="submit" */}
                                    <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Create Account
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Dynamic Toggle Button */}
                    {!is2FAStep && <motion.div layout className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </motion.div>}
                </div>

            </motion.div>
        </div>
    );
};

export default Auth;