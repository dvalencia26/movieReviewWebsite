import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, User, Settings } from 'lucide-react';
import WAGLogo from '../assets/WAGLogo.png';

const Footer = ({ showTMDBDisclaimer = false }) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo and Description */}
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <img 
                                src={WAGLogo} 
                                alt="WAG Movie Reviews" 
                                className="w-10 h-10 rounded-full"
                            />
                            <h3 className="text-xl font-bold">WAG Movie Reviews</h3>
                        </div>
                        {showTMDBDisclaimer && (
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-300">
                                    WAG Movie Reviews uses TMDB and the TMDB APIs but is not endorsed, 
                                    certified, or otherwise approved by TMDB.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Links - In Same Line */}
                    <div className="flex flex-col justify-center">
                        <h4 className="text-lg font-semibold mb-4 text-center md:text-left">Quick Links</h4>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <Link 
                                to="/movies" 
                                className="text-gray-400 hover:text-purple-main transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-purple-dark/20"
                            >
                                <Film size={16} />
                                <span>Browse Reviews</span>
                            </Link>
                            <Link 
                                to="/favorites" 
                                className="text-gray-400 hover:text-purple-light transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-purple-dark/20"
                            >
                                <Heart size={16} />
                                <span>My Lists</span>
                            </Link>
                            <Link 
                                to="/profile" 
                                className="text-gray-400 hover:text-purple-main transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-purple-dark/20"
                            >
                                <User size={16} />
                                <span>Profile</span>
                            </Link>
                            <Link 
                                to="/login" 
                                className="text-gray-400 hover:text-purple-light transition-colors flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-purple-dark/20"
                            >
                                <Settings size={16} />
                                <span>Account</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 