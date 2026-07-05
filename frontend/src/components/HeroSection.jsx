import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import myDashboardImage from '../assets/1.jpeg';

const HeroSection = () => {
    // Array of placeholder images for the carousel (now sitting at the bottom)
    const images = [
        myDashboardImage,
        myDashboardImage,
        myDashboardImage
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play logic for the bottom dashboard UI
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === images.length - 1 ? 0 : prevIndex + 1
            );
        }, 4000);
        return () => clearInterval(timer);
    }, [images.length]);

    // --- Framer Motion Animation Variants ---
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2 } // Delays each child animation by 0.2s
        }
    };

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    const imageVariants = {
        hidden: { opacity: 0, y: 100 }, // Starts 100px lower
        show: { opacity: 1, y: 0, transition: { duration: 1.2, delay: 0.6, ease: "easeOut" } }
    };

    return (
        <div id="heroSection" className="relative w-full flex flex-col items-center justify-start pt-24 md:pt-32 pb-32 px-5">

            {/* Top Typography Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="text-center max-w-4xl mx-auto z-10"
            >
                <motion.h1
                    variants={textVariants}
                    className="text-6xl md:text-8xl font-extrabold text-white tracking-tight leading-[1.1]"
                >
                    Plan your week.<br />
                    {/* Using serif & italic to match your reference image's elegant look */}
                    <span className="font-serif italic text-blue-100 font-medium">Execute with AI.</span>
                </motion.h1>

                <motion.p
                    variants={textVariants}
                    className="mt-8 text-lg md:text-xl text-blue-50/90 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    Supercharge your productivity with automated goal tracking, seamless calendar sync, and an intelligent AI chatbot that creates tasks instantly.
                </motion.p>

                <motion.div variants={textVariants} className="mt-10">
                    <button className="px-8 py-3.5 bg-black hover:bg-gray-900 text-white font-semibold rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center justify-center gap-3 mx-auto">
                        <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.8 8 273.69c-22.4 74.3-2.7 169.1 47.1 211.2 26.6 22.4 59.3 24.1 84.4 20.6 35.8-5 52.8-22.6 92.4-22.6 39.5 0 54 17.5 91.4 22.6 27.6 3.8 57.5-1.4 81.3-20.6 30.6-24.8 45.4-66.5 45.4-66.5-35.1-15.6-54.8-51.5-54.8-93.5-3.3-8.8-3.3-17.6-3.3-26.2zM212.1 106.1c21.8-26.2 34.3-58 30.8-88.8-25.1 1-56.3 15.6-76.1 36.6-19 20-33.8 52.1-29.3 81.4 28.5 2.1 55.4-11 74.6-29.2z" />
                        </svg>
                        <span className="text-sm">Download for Windows</span>
                    </button>
                </motion.div>
            </motion.div>

            {/* Bottom Dashboard UI Reveal */}
            <motion.div
                variants={imageVariants}
                initial="hidden"
                animate="show"
                className="mt-20 w-full max-w-5xl mx-auto relative z-20"
            >
                {/* Decorative glow behind the image */}
                <div className="absolute inset-0 bg-blue-400 blur-[100px] opacity-30 rounded-full top-20"></div>

                {/* Glassmorphism container to make it look embedded */}
                <div className="relative rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-sm overflow-hidden">
                    <motion.img
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        src={images[currentIndex]}
                        alt="App Dashboard Preview"
                        className="rounded-2xl w-full h-auto shadow-2xl border border-white/10"
                    />
                </div>
            </motion.div>

        </div>
    );
};

export default HeroSection;