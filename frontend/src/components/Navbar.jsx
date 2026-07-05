import React from 'react';

const Navbar = () => {
    return (
        <div className="w-full bg-transparent pb-10 fixed top-0 left-0 z-[100] pb-10    ">

            {/* Main Navbar Container
        Added 'relative' so we can attach the notch curves to the outside.
        Reduced max-width to 'max-w-3xl' to shorten the overall length.
      */}
            <nav className="relative mx-auto max-w-3xl bg-black rounded-b-[2rem] px-5 py-3 flex items-center justify-between shadow-2xl">

                {/* --- THE NOTCH CURVES --- */}
                {/* Left Outer Curve */}
                <div className="absolute top-0 -left-4 w-4 h-4 bg-transparent rounded-tr-[0.6rem] shadow-[8px_0_0_0_#000]"></div>
                {/* Right Outer Curve */}
                <div className="absolute top-0 -right-4 w-4 h-4 bg-transparent rounded-tl-[0.6rem] shadow-[-8px_0_0_0_#000]"></div>


                {/* Left Zone: Logo and Brand Name */}
                <div className="flex items-center gap-3 cursor-pointer z-10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-blue-400 to-blue-700 flex items-start justify-center relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 w-full h-1/3 bg-white/30 rounded-t-xl"></div>
                    </div>
                    <a href="#heroSection" ><span className="text-white font-bold text-lg tracking-wide">Taskify</span></a>
                </div>

                {/* Center Zone: Navigation Links - Reduced gap to gap-5 */}
                <div className="hidden md:flex items-center gap-5 z-10">
                    <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
                    <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
                    <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
                </div>

                {/* Right Zone: CTA Button */}
                <a href="/login" className="bg-white text-black px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm z-10">
                    <span className="text-sm font-bold">Sign In</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </a>

            </nav>
        </div>
    );
};

export default Navbar;