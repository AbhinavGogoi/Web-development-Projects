import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import PaperPlaneBackground from './components/PaperPlaneBackground';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import GoalsPage from './pages/GoalsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import AIChatPage from './pages/AIChatPage';
import DailyTasksPage from './pages/DailyTasksPage';
import CommandPalette from './components/CommandPalette';

// --- NEW COMPONENT: Animated Routes ---
// We create this inner component so we can use the 'useLocation' hook, 
// which must be rendered INSIDE the <Router> tags.
const AnimatedRoutes = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if user is typing in an input, textarea, or select
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                if (e.key === 'Escape') {
                    e.target.blur();
                    window.dispatchEvent(new Event('closeAllModals'));
                }
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    window.dispatchEvent(new Event('openGlobalSearch'));
                } else if (e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    const theme = localStorage.getItem('theme') || 'system';
                    const root = window.document.documentElement;
                    const isDark = root.classList.contains('dark');
                    const newTheme = isDark ? 'light' : 'dark';
                    localStorage.setItem('theme', newTheme);
                    window.dispatchEvent(new Event('themeChanged'));
                }
            } else if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                navigate('/tasks');
                setTimeout(() => window.dispatchEvent(new Event('openNewTaskModal')), 100);
            } else if (e.key === 'Escape') {
                window.dispatchEvent(new Event('closeAllModals'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    // Define our premium fade-in/fade-out transition
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } // Softer, longer curve
    },
    exit: {
      opacity: 0,
      y: -15,
      transition: { duration: 0.4, ease: "easeInOut" } // Slightly longer exit
    }
  };

  return (
    // mode="wait" ensures the current page fully fades out BEFORE the new page fades in
    <>
    <CommandPalette />
    <AnimatePresence mode="wait">
      {/* We pass the location and key to Routes so Framer Motion knows when the page changes */}
      <Routes location={location} key={location.pathname}>

        {/* ROUTE 1: The Landing Page */}
        <Route path="/" element={
          localStorage.getItem('token') ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <PaperPlaneBackground />
              <div className="relative z-10">
                <Navbar />
                <HeroSection />
                <Features />
                <Testimonials />
                <Pricing />
                <Footer />
              </div>
            </motion.div>
          )
        } />

        {/* ROUTE 2: The Auth Page */}
        <Route path="/login" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <Auth />
          </motion.div>
        } />

        {/* ROUTE 3: The Secure Dashboard */}
        <Route path="/dashboard" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <Dashboard />
          </motion.div>
        } />

        {/* ROUTE 4: The Kanban Tasks Board */}
        <Route path="/tasks" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <TasksPage />
          </motion.div>
        } />

        {/* ROUTE 4.5: The Daily Tasks Page */}
        <Route path="/daily-tasks" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <DailyTasksPage />
          </motion.div>
        } />

        {/* ROUTE 5: The Weekly Goals Page */}
        <Route path="/goals" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <GoalsPage />
          </motion.div>
        } />
        {/* ROUTE 6: The Calendar Page */}
        <Route path="/calendar" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <CalendarPage />
          </motion.div>
        } />

        {/* ROUTE 7: The Settings Page */}
        <Route path="/settings" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <SettingsPage />
          </motion.div>
        } />

        {/* ROUTE 8: The Help Center Page */}
        <Route path="/help" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <HelpCenterPage />
          </motion.div>
        } />

        {/* ROUTE 9: The AI Chat Page */}
        <Route path="/chat" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative z-10"
          >
            <AIChatPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
    </>
  );
};

// --- MAIN APP WRAPPER ---
function App() {
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('theme') || 'system';
      const root = window.document.documentElement;
      
      root.classList.remove('light', 'dark');
      
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.add('light');
        }
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();

    // Listen for custom event when theme is changed in Settings
    window.addEventListener('themeChanged', applyTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('themeChanged', applyTheme);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <Router>
      {/* GLOBAL WRAPPER: The gradient stays here so it persists during transitions */}
      <div className="relative min-h-screen bg-gradient-to-b from-blue-600 via-blue-400 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-500 overflow-hidden">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;