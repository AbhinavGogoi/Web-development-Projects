import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import myDashboardImage from '../assets/1.jpeg';
import myDashboardImage2 from '../assets/2.jpeg';
import myDashboardImage3 from '../assets/3.jpeg';
``

const HeroSection = () => {
    // Array of placeholder images for the carousel (now sitting at the bottom)
    const images = [
        myDashboardImage,
        myDashboardImage2,
        myDashboardImage3
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
                    <span className="font-serif italic text-black dark:text-sky-300 font-medium">Execute with AI.</span>
                </motion.h1>

                <motion.p
                    variants={textVariants}
                    className="mt-8 text-lg md:text-xl text-blue-50/90 max-w-2xl mx-auto font-light leading-relaxed"
                >
                    Supercharge your productivity with automated goal tracking, seamless calendar sync, and an intelligent AI chatbot that creates tasks instantly.
                </motion.p>

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