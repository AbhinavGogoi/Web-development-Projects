import React from 'react';
import { motion } from 'framer-motion';

const Testimonials = () => {
    // Sample review data
    const reviews = [
        {
            text: "Their NLP engine took our messy daily notes and elevated them into perfectly structured tasks. They've helped us create a cohesive and highly efficient workflow.",
            name: "Mark Ramirez",
            title: "Product Manager, Luna Inc",
            avatar: "https://i.pravatar.cc/150?u=mark"
        },
        {
            text: "As a creative professional, I have high standards when it comes to design. This tool not only met but exceeded those standards, optimizing for a seamless user experience.",
            name: "Thomas Gala",
            title: "Founder, Zentech Wellness",
            avatar: "https://i.pravatar.cc/150?u=thomas"
        }
    ];

    // Framer Motion Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section id="testimonials" className="w-full py-24 px-6 md:px-12 bg-transparent">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                className="max-w-[1100px] mx-auto flex flex-col gap-8"
            >

                {/* Top Grid: Editorial Image (Left) & Reviews (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Featured Editorial Image */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 relative min-h-[450px] lg:min-h-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                            alt="Team collaborating"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark overlay for contrast */}
                        <div className="absolute inset-0 bg-blue-900/10"></div>

                        {/* --- THE STEPPED WHITE TEXT BOX --- */}
                        {/* --- THE UNIFIED WHITE TEXT BOX --- */}
                        <div className="absolute top-0 left-0 bg-white p-8 rounded-br-[2rem] w-max z-10">

                            {/* All three lines of text combined into one heading */}
                            <h3 className="text-2xl md:text-[1.35rem] font-extrabold text-slate-900 leading-tight">
                                Hear From Our<br />
                                Satisfied Clients<br />
                                Have To Say <span className="text-blue-600">♥</span>
                            </h3>

                            {/* Notch 1: Top-Right (Blends the top edge of the box into the image) */}
                            <svg className="absolute top-0 -right-8 w-8 h-8 text-white fill-current" viewBox="0 0 32 32">
                                <path d="M0 32V0H32C14.3269 0 0 14.3269 0 32Z" />
                            </svg>

                            {/* Notch 2: Bottom-Left (Blends the left edge of the box into the image) */}
                            <svg className="absolute -bottom-8 left-0 w-8 h-8 text-white fill-current" viewBox="0 0 32 32">
                                <path d="M0 32V0H32C14.3269 0 0 14.3269 0 32Z" />
                            </svg>

                        </div>
                        {/* -------------------------------------- */}

                        {/* Bottom Right Stat */}
                        <div className="absolute bottom-6 right-6">
                            <h2 className="text-5xl font-extrabold text-white drop-shadow-lg tracking-tighter">
                                10.9K+
                            </h2>
                        </div>
                    </motion.div>

                    {/* Right Column: The Masked Review Cards */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {reviews.map((review, index) => (
                            <motion.div key={index} variants={itemVariants} className="relative group min-h-[220px]">

                                {/* THE MAGIC MASK for the rotating button */}
                                <div
                                    className="absolute inset-0 bg-[#E8F1FC] rounded-3xl shadow-sm transition-shadow duration-300 group-hover:shadow-md"
                                    style={{
                                        WebkitMaskImage: 'radial-gradient(circle 32px at calc(100% - 24px) calc(100% - 24px), transparent 32px, black 33px)',
                                        maskImage: 'radial-gradient(circle 32px at calc(100% - 24px) calc(100% - 24px), transparent 32px, black 33px)'
                                    }}
                                ></div>

                                {/* Card Text Content */}
                                <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                                    <div>
                                        {/* Stars */}
                                        <div className="flex gap-1 mb-4 text-blue-600">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-slate-700 font-medium text-sm md:text-base leading-relaxed mb-6 pr-8">
                                            "{review.text}"
                                        </p>
                                    </div>

                                    {/* User Profile */}
                                    <div className="flex items-center gap-3">
                                        <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full shadow-sm" />
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{review.name}</h4>
                                            <p className="text-xs text-slate-500">{review.title}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* THE ROTATING BUTTON */}
                                <div className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg group-hover:bg-blue-500 transition-colors duration-300 z-20">
                                    <svg className="w-5 h-5 transform transition-transform duration-300 group-hover:-rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>

                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom Banner */}
                <motion.div
                    variants={itemVariants}
                    className="w-full bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center shadow-xl mt-4"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6 md:mb-0">
                        Are u The Next One!
                    </h2>
                    <button className="px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-lg">
                        <a href="/login">Join Now</a>
                    </button>
                </motion.div>

            </motion.div>
        </section>
    );
};

export default Testimonials;