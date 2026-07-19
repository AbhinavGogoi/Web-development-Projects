import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();
    return (
        // mt-24 pushes the entire footer section down to give the pricing section some breathing room
        <footer className="w-full relative mt-24">

            {/* THE FLOATING CTA BOX 
        -mb-24 (negative margin) pulls the white footer base up underneath this box.
        z-10 ensures this box stays layered on top.
      */}
            <div className="max-w-5xl mx-auto px-6 relative z-10 -mb-24">
                <div className="bg-[#3b4252] rounded-[2.5rem] p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">

                    {/* Subtle background decorative shapes */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <svg className="absolute -top-24 -left-24 w-96 h-96 text-white" fill="currentColor" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="50" />
                        </svg>
                        <svg className="absolute -bottom-24 -right-24 w-96 h-96 text-white" fill="currentColor" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="50" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                            Start Mastering Your<br />Workflow Today
                        </h2>
                        <p className="text-slate-300 font-medium text-sm md:text-base max-w-2xl mx-auto mb-8">
                            Discover AI-powered task creation, analyze your weekly goals, and secure your schedule with seamless calendar sync — all in one platform.
                        </p>
                        <button onClick={() => navigate('/login')} className="px-8 py-3.5 bg-white text-slate-900 font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            Get Started for Free
                        </button>
                    </div>
                </div>
            </div>

            {/* THE WHITE FOOTER BASE 
        pt-40 adds massive padding to the top so the text isn't hidden under the floating CTA.
      */}
            <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] pt-40 pb-12 px-6 md:px-12 w-full shadow-2xl">
                <div className="max-w-6xl mx-auto">

                    {/* Main Footer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

                        {/* Brand Column (Spans 4 cols on desktop) */}
                        <div className="md:col-span-4 flex flex-col items-start">
                            {/* Logo & Brand Name */}
                            <div className="flex items-center gap-3 mb-6">
                                <img src="/logo.png" alt="Taskify Logo" className="w-8 h-8 object-contain" />
                                <span className="text-slate-900 dark:text-white font-bold text-2xl tracking-tight">Taskify</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 pr-4">
                                A modern task management platform that combines AI automation, calendar intelligence, and smart goal tracking to help you execute your workflow with precision.
                            </p>

                            {/* Social Icons (Solid circles matching the reference image) */}
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-[#3b4252] flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-[#3b4252] flex items-center justify-center text-white hover:bg-pink-600 transition-colors shadow-sm">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-[#3b4252] flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Links Columns (Spans 8 cols on desktop) */}
                        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div>
                                <h4 className="text-slate-900 dark:text-white font-extrabold mb-6">Product</h4>
                                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <li><a href="#features" className="hover:text-blue-600 dark:hover:text-white transition-colors">Features</a></li>
                                    <li><a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">Pricing</a></li>
                                    <li><a href="#dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">Dashboard Preview</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Changelog</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-slate-900 dark:text-white font-extrabold mb-6">Resources</h4>
                                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Help Center</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Productivity Tips</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">API Documentation</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Community Forum</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-slate-900 dark:text-white font-extrabold mb-6">Legal</h4>
                                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Terms of Service</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Privacy Policy / GDPR</a></li>
                                    <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Cookie Policy</a></li>
                                </ul>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;