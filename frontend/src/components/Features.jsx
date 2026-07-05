import React from 'react';
import { motion } from 'framer-motion';

const Features = () => {
    // Framer Motion configuration for the grid container
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section id="features" className="w-full py-24 px-6 md:px-12 bg-transparent">
            <div className="max-w-6xl mx-auto">

                {/* Section Header with Upgraded Typography */}
                <div className="text-center mb-20">
                    <h2 className="font-playfair italic text-6xl md:text-8xl font-['Caveat',_cursive]  text-black tracking-tight">
                        Everything you need to <span className="font-dancing not-italic text-blue-600">execute.</span>
                    </h2>
                    <p className="mt-6 text-xl text-slate-600 font-medium max-w-2xl mx-auto">
                        A powerful suite of tools designed to get out of your way and let you focus on what actually matters.
                    </p>
                </div>

                {/* Bento Grid: 3 Columns layout on Desktop */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]"
                >

                    {/* Card 1: Tall Card (Spans 1 Column, 2 Rows) - Soft Purple */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="md:col-span-1 md:row-span-2 bg-fuchsia-50/90 backdrop-blur-lg p-10 rounded-[2rem] shadow-lg border border-fuchsia-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start justify-between group"
                    >
                        <div>
                            <h3 className="font-dancing text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                                AI Chatbot<br />Assistant
                            </h3>
                            <p className="text-slate-600 font-medium text-lg leading-relaxed">
                                Just type naturally. Our NLP engine instantly understands your conversation and creates structured daily tasks automatically.
                            </p>
                        </div>
                        {/* Large Decorative Icon */}
                        <div className="w-20 h-20 rounded-3xl bg-fuchsia-200 text-fuchsia-600 flex items-center justify-center shadow-inner mt-8 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Card 2: Wide Card (Spans 2 Columns, 1 Row) - Soft Blue */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="md:col-span-2 md:row-span-1 bg-blue-50/90 backdrop-blur-lg p-10 rounded-[2rem] shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 flex flex-row items-center justify-between group overflow-hidden relative"
                    >
                        <div className="max-w-sm relative z-10">
                            <h3 className="font-dancing text-3xl font-bold text-slate-900 tracking-tight mb-4">
                                Seamless Calendar Sync
                            </h3>
                            <p className="text-slate-600 font-medium text-lg leading-relaxed">
                                Never miss a deadline. Your tasks automatically sync with your built-in calendar, keeping your schedule perfectly aligned.
                            </p>
                        </div>
                        {/* Decorative Element fading off the edge */}
                        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-8 translate-y-8 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-64 h-64 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Card 3: Square Card - Soft Green */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="md:col-span-1 md:row-span-1 bg-emerald-50/90 backdrop-blur-lg p-8 rounded-[2rem] shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start justify-between group"
                    >
                        <div>
                            <h3 className="font-dancing text-2xl font-bold text-slate-900 tracking-tight mb-3">
                                Weekly Goals
                            </h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Watch as your daily tasks dynamically update your broader analytics.
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner mt-4 group-hover:rotate-12 transition-transform duration-500">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Card 4: Square Card - Soft Peach/Orange */}
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="md:col-span-1 md:row-span-1 bg-orange-50/90 backdrop-blur-lg p-8 rounded-[2rem] shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 flex flex-col items-start justify-between group"
                    >
                        <div>
                            <h3 className="font-dancing text-2xl font-bold text-slate-900 tracking-tight mb-3">
                                Drag & Drop
                            </h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Organize your workflow effortlessly with a fluid, tactile interface.
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-orange-200 text-orange-600 flex items-center justify-center shadow-inner mt-4 group-hover:-rotate-12 transition-transform duration-500">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    );
};

export default Features;