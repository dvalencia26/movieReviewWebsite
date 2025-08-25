import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Loader from './Loader';
import heropic from '../assets/heropic.png';
import Herobanner from '../assets/Herobanner.jpg';

const HeroSection = ({ loading = false, userInfo = null }) => {
    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <section className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
            {/* Background Banner */}
            <div className="absolute inset-0">
                <img 
                    src={Herobanner} 
                    alt="Hero Banner" 
                    className="w-full h-full object-cover"
                />
                {/* Radial gradient overlay for subtle depth */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/8"></div>
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Hero Picture on Right Side */}
            <div className="absolute right-0 top-0 h-full w-1/2 lg:w-1/3 flex items-center justify-end pr-2 sm:pr-4 lg:pr-8 transition-all duration-500 ease-out md:opacity-100 md:translate-y-0 opacity-0 translate-y-8">
                <img 
                    src={heropic} 
                    alt="Hero Character" 
                    className="h-3/5 sm:h-4/5 max-h-48 sm:max-h-64 lg:max-h-96 object-contain drop-shadow-2xl"
                />
            </div>

            {/* Content Section */}
            <div className="relative container mx-auto px-3 sm:px-4 h-full flex items-center justify-center">
                <div className="text-center text-white max-w-4xl mx-auto z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 sm:mb-4 md:mb-6 text-shadow-strong">
                        Welcome to WAG Movie Reviews
                    </h1>
                    
                    {/* Sub-headline*/}
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 md:mb-8 opacity-95 text-shadow max-w-2xl mx-auto px-2 sm:px-0">
                        Discover and explore movie reviews from our collection
                    </p>
                    
                    {/* Login/Signup Buttons */}
                    {!userInfo && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                            <Link
                                to="/login"
                                className="bg-white text-blue-main px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-light hover:text-blue-dark transition-all transform hover:scale-105 shadow-lg inline-flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-blue-light/50 w-full sm:w-auto"
                                aria-label="Login to your account"
                            >
                                <LogIn size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
                                <span>Login</span>
                            </Link>
                            
                            <Link
                                to="/register"
                                className="bg-orange-main text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-orange-dark transition-all transform hover:scale-105 shadow-lg border-2 border-white/20 inline-flex items-center justify-center space-x-2 focus:outline-none focus:ring-4 focus:ring-orange-light/50 w-full sm:w-auto"
                                aria-label="Register for a new account"
                            >
                                <UserPlus size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
                                <span>Register</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection; 