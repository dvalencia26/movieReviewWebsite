import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Loader from './Loader';

const HeroSection = ({ loading = false, userInfo = null }) => {
    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <section className="relative h-96 lg:h-[500px] bg-gradient-to-r from-purple-main to-purple-dark overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
                <div className="text-center text-white max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 whitespace-nowrap">
                        Welcome to WAG Movie Reviews
                    </h1>
                    <p className="text-xl lg:text-2xl mb-8 opacity-90">
                        Discover and explore movie reviews from our collection
                    </p>
                    
                    {/* Login/Signup Buttons - Only show if user is not authenticated */}
                    {!userInfo && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/login"
                                className="bg-white text-blue-main px-8 py-3 rounded-lg font-semibold hover:bg-blue-light hover:text-blue-dark transition-all transform hover:scale-105 shadow-lg inline-flex items-center justify-center space-x-2"
                            >
                                <LogIn size={20} />
                                <span>Login</span>
                            </Link>
                            
                            <Link
                                to="/register"
                                className="bg-green-main text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-dark transition-all transform hover:scale-105 shadow-lg border-2 border-white/20 inline-flex items-center justify-center space-x-2"
                            >
                                <UserPlus size={20} />
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