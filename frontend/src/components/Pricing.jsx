import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const navigate = useNavigate();

    // Pricing Data adapted for our Task Management App
    const plans = [
        {
            name: "Task Basic",
            monthlyPrice: 15,
            annualPrice: 9,
            description: "Get started with essential tools to manage your daily tasks efficiently.",
            features: [
                { name: "Unlimited daily tasks", included: true },
                { name: "Basic calendar sync", included: true },
                { name: "Weekly goal tracking", included: true },
                { name: "AI Chatbot Assistant", included: false },
                { name: "Custom task categories", included: false },
                { name: "Team collaboration", included: false },
            ],
            isPopular: false,
            buttonText: "Get Started Free"
        },
        {
            name: "Productivity Pro",
            monthlyPrice: 29,
            annualPrice: 19,
            description: "A comprehensive solution for power users offering AI-enhanced task management.",
            features: [
                { name: "Unlimited daily tasks", included: true },
                { name: "Advanced calendar sync", included: true },
                { name: "Weekly goal tracking", included: true },
                { name: "AI Chatbot Assistant", included: true },
                { name: "Custom task categories", included: true },
                { name: "Team collaboration", included: false },
            ],
            isPopular: true, // This triggers the dark theme
            buttonText: "Start 7-day Free Trial",
            badge: "Save 34%"
        },
        {
            name: "Team Master",
            monthlyPrice: 49,
            annualPrice: 39,
            description: "Maximize team performance with premium tools and full workspace customization.",
            features: [
                { name: "Unlimited daily tasks", included: true },
                { name: "Advanced calendar sync", included: true },
                { name: "Weekly goal tracking", included: true },
                { name: "AI Chatbot Assistant", included: true },
                { name: "Custom task categories", included: true },
                { name: "Team collaboration", included: true },
            ],
            isPopular: false,
            buttonText: "Start 7-day Free Trial"
        }
    ];

    // Framer Motion Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section id="pricing" className="w-full py-24 px-6 md:px-12 bg-transparent relative">
            <div className="max-w-6xl mx-auto relative">
                
                {/* Premium Features Overlay */}
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-10 md:p-14 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] text-center max-w-2xl mx-auto relative overflow-hidden"
                    >
                        {/* Decorative glow inside card */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold px-4 py-1.5 rounded-full mb-6 text-sm tracking-wide uppercase">
                                Coming Soon
                            </div>
                            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                                Premium Features
                            </h3>
                            <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed max-w-lg mx-auto">
                                We're building powerful new tools to supercharge your workflow. Enjoy the free trial for now while we get everything ready!
                            </p>
                            <button onClick={() => navigate('/login')} className="bg-white text-slate-900 font-extrabold text-lg px-10 py-4 rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
                                Start Free Trial
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Blurred Content */}
                <div className="blur-[8px] opacity-40 select-none pointer-events-none transition-all duration-500">
                {/* Header & Toggle Section */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                        Simple, transparent <span className="text-blue-600">pricing.</span>
                    </h2>

                    {/* The Pill Toggle */}
                    <div className="inline-flex items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-1.5 rounded-full border border-white dark:border-slate-700 shadow-sm">
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${isAnnual ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Annual
                        </button>
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${!isAnnual ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
                >
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            // The Pro plan is scaled up and uses the dark slate theme
                            className={`relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 transition-all duration-300 flex flex-col h-full ${plan.isPopular
                                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-2xl scale-100 md:scale-105 border-none z-10'
                                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-900 dark:text-white shadow-xl border border-white dark:border-slate-700 hover:shadow-2xl'
                                }`}
                        >
                            {/* Soft Yellow/Gold gradient glow at the bottom matching the reference */}
                            <div className={`absolute bottom-0 left-0 w-full h-1/2 opacity-40 pointer-events-none ${plan.isPopular ? 'bg-gradient-to-t from-yellow-500/20 to-transparent' : 'bg-gradient-to-t from-yellow-200/50 to-transparent'
                                }`}></div>

                            <div className="relative z-10 flex-grow">
                                {/* Plan Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                                    {plan.badge && (
                                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                                            {plan.badge}
                                        </span>
                                    )}
                                    {plan.name === "Team Master" && (
                                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                            Popular <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </span>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    <span className="text-5xl font-extrabold tracking-tighter">
                                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                                    </span>
                                    <span className={`text-sm ml-2 ${plan.isPopular ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        / month (USD)
                                    </span>
                                    {isAnnual && (
                                        <div className={`text-xs mt-1 font-medium ${plan.isPopular ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            ${plan.annualPrice * 12} billed yearly
                                        </div>
                                    )}
                                </div>

                                <p className={`text-sm leading-relaxed mb-8 ${plan.isPopular ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {plan.description}
                                </p>

                                {/* Dashed Divider */}
                                <div className={`border-t border-dashed w-full mb-8 ${plan.isPopular ? 'border-slate-700' : 'border-slate-200 dark:border-slate-700'}`}></div>

                                {/* Features List */}
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            {feature.included ? (
                                                // Green Check Icon
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                // Gray X Icon
                                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                                    <svg className={`w-4 h-4 ${plan.isPopular ? 'text-slate-600' : 'text-slate-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className={`text-sm font-medium ${feature.included ? '' : plan.isPopular ? 'text-slate-500 line-through' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                                                {feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Call to Action Button */}
                            <button className={`relative z-10 w-full py-4 rounded-2xl font-bold transition-transform duration-300 hover:scale-105 ${plan.isPopular
                                ? 'bg-white text-slate-900 shadow-lg hover:shadow-xl'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md'
                                }`}>
                                {plan.buttonText}
                            </button>

                        </motion.div>
                    ))}
                </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;