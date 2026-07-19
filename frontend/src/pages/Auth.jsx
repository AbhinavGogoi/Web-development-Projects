import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Import useNavigate
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    React.useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/dashboard');
        }
    }, [navigate]);

    // State to hold the user's input
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: ''
    });

    // State to hold any error messages from the backend
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Auth Flow States
    const [is2FAStep, setIs2FAStep] = useState(false);
    const [isRegistrationVerifyStep, setIsRegistrationVerifyStep] = useState(false);
    
    // Forgot Password Flow States
    const [isForgotPasswordStep, setIsForgotPasswordStep] = useState(false);
    const [isResetPasswordStep, setIsResetPasswordStep] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetOTP, setResetOTP] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [currentUserId, setCurrentUserId] = useState(null);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [registrationOTP, setRegistrationOTP] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); 
        setSuccessMessage('');
    };

    // --- SUBMISSION HANDLERS ---

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.requires2FA) {
                    setIs2FAStep(true);
                    setCurrentUserId(data.userId);
                    return;
                }
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user?.name || 'User');
                localStorage.setItem('profilePhoto', data.user?.profilePhoto || '');
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Server error. Is your backend running?');
        }
    };

    const handleVerify2FASubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/login-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, token: twoFactorToken })
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

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    password: formData.password
                })
            });
            const data = await response.json();

            if (response.ok) {
                if (data.requiresVerification) {
                    setIsRegistrationVerifyStep(true);
                    setCurrentUserId(data.userId);
                    setSuccessMessage(data.message);
                }
            } else {
                setError(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError('Server error.');
        }
    };

    const handleVerifyRegistrationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/verify-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, otp: registrationOTP })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user?.name || 'User');
                localStorage.setItem('profilePhoto', data.user?.profilePhoto || '');
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid OTP.');
            }
        } catch (err) {
            setError('Server error.');
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await response.json();

            if (response.ok) {
                setIsForgotPasswordStep(false);
                setIsResetPasswordStep(true);
                setCurrentUserId(data.userId);
                setSuccessMessage('OTP sent to your email and phone.');
            } else {
                setError(data.message || 'Could not process request.');
            }
        } catch (err) {
            setError('Server error.');
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, otp: resetOTP, newPassword })
            });
            const data = await response.json();

            if (response.ok) {
                setIsResetPasswordStep(false);
                setIsLogin(true);
                setSuccessMessage('Password reset successfully. You can now login.');
                setForgotEmail('');
                setResetOTP('');
                setNewPassword('');
            } else {
                setError(data.message || 'Invalid OTP or error resetting password.');
            }
        } catch (err) {
            setError('Server error.');
        }
    };


    const formVariants = {
        hidden: { opacity: 0, x: isLogin ? -40 : 40 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: isLogin ? 40 : -40, transition: { duration: 0.3, ease: "easeIn" } }
    };

    // Helper to determine what is currently active
    const showBackToLogin = is2FAStep || isRegistrationVerifyStep || isForgotPasswordStep || isResetPasswordStep;

    const resetToLogin = () => {
        setIs2FAStep(false);
        setIsRegistrationVerifyStep(false);
        setIsForgotPasswordStep(false);
        setIsResetPasswordStep(false);
        setIsLogin(true);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 flex items-center justify-center px-4 md:px-8 relative overflow-hidden py-12">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>

            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white font-medium hover:text-blue-100 transition-colors z-20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </Link>

            <motion.div
                layout
                className="w-full max-w-4xl bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white relative z-10 flex flex-col md:flex-row overflow-hidden"
            >
                <motion.div layout className="hidden md:flex md:w-1/2 relative bg-blue-900 overflow-hidden p-10 flex-col justify-between">
                    <img
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                        alt="Abstract fluid design"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                    />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 w-full h-1/3 bg-white dark:bg-slate-800/30 rounded-t-xl"></div>
                        </div>
                        <span className="text-white font-bold text-2xl tracking-wide">Taskify</span>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <h3 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                            Plan your week.<br />
                            <span className="font-['Caveat',_cursive] text-sky-300 text-5xl font-medium tracking-wide">Execute with AI.</span>
                        </h3>
                        <p className="text-blue-100/80 font-medium">Join 10,000+ users mastering their workflow today.</p>
                    </div>
                </motion.div>

                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-800/50">
                    <motion.div layout className="flex flex-col items-start mb-8">
                        <div className="md:hidden w-12 h-12 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative overflow-hidden shadow-inner mb-4">
                            <div className="absolute top-0 w-full h-1/3 bg-white dark:bg-slate-800/30 rounded-t-xl"></div>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
                            {isForgotPasswordStep || isResetPasswordStep ? 'Reset Password' : 
                             is2FAStep ? 'Two-Factor Authentication' : 
                             isRegistrationVerifyStep ? 'Verify Account' :
                             isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                            {isForgotPasswordStep ? 'Enter your email to receive an OTP.' : 
                             isResetPasswordStep ? 'Enter the OTP and your new password.' :
                             is2FAStep || isRegistrationVerifyStep ? 'Check your email/phone for the OTP.' :
                             isLogin ? 'Enter your details to access your dashboard.' : 'Start mastering your workflow today.'}
                        </p>
                    </motion.div>

                    <div className="relative">
                        <AnimatePresence mode="popLayout">
                            {error && (
                                <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-50 text-red-500 text-sm p-3 rounded-xl font-medium border border-red-100 mb-4">
                                    {error}
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-green-50 text-green-600 text-sm p-3 rounded-xl font-medium border border-green-100 mb-4">
                                    {successMessage}
                                </motion.div>
                            )}

                            {isForgotPasswordStep ? (
                                <motion.form key="forgotPassword" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleForgotPasswordSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                        <input type="email" value={forgotEmail} onChange={e => {setForgotEmail(e.target.value); setError('');}} autoComplete="email" required placeholder="hello@taskify.com" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Send OTP
                                    </button>
                                </motion.form>
                            ) : isResetPasswordStep ? (
                                <motion.form key="resetPassword" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleResetPasswordSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enter 6-digit OTP</label>
                                        <input type="text" value={resetOTP} onChange={e => {setResetOTP(e.target.value); setError('');}} required placeholder="123456" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-[0.5em] text-2xl transition-all shadow-sm" maxLength="6" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => {setNewPassword(e.target.value); setError('');}} autoComplete="new-password" required placeholder="Create a new password" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm pr-12" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        <PasswordStrengthIndicator password={newPassword} />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Reset Password
                                    </button>
                                </motion.form>
                            ) : is2FAStep ? (
                                <motion.form key="2fa" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleVerify2FASubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enter Authenticator Code</label>
                                        <input type="text" value={twoFactorToken} onChange={e => {setTwoFactorToken(e.target.value); setError('');}} required placeholder="123456" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-[0.5em] text-2xl transition-all shadow-sm" maxLength="6" />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Verify & Login
                                    </button>
                                </motion.form>
                            ) : isRegistrationVerifyStep ? (
                                <motion.form key="verifyRegistration" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleVerifyRegistrationSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Enter Verification OTP</label>
                                        <input type="text" value={registrationOTP} onChange={e => {setRegistrationOTP(e.target.value); setError('');}} required placeholder="123456" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-[0.5em] text-2xl transition-all shadow-sm" maxLength="6" />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Verify & Login
                                    </button>
                                </motion.form>
                            ) : isLogin ? (
                                <motion.form key="login" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required placeholder="hello@taskify.com" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} autoComplete="current-password" required placeholder="Enter your password" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm pr-12" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mb-2">
                                        <button type="button" onClick={() => setIsForgotPasswordStep(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</button>
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                        Sign In
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.form key="register" layout variants={formVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="name" required placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required placeholder="hello@taskify.com" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} autoComplete="tel" required placeholder="+1234567890" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" required placeholder="Create a strong password" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm pr-12" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        <PasswordStrengthIndicator password={formData.password} />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2">
                                        Create Account
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div layout className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                        {showBackToLogin ? (
                            <button onClick={resetToLogin} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                Back to Login
                            </button>
                        ) : (
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:text-blue-700 transition-colors ml-1">
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;