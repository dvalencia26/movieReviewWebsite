import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Film, TrendingUp } from 'lucide-react';

const CallToAction = () => {
    return (
        <section className="bg-white border-t-4 border-purple-main/20 py-16">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="mb-12">
                        <h2 className="text-4xl font-bold text-purple-main mb-4">
                            Discover Your Next Favorite Movie
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Explore our curated collection of movie reviews and find your next great watch. 
                            Join our community and start building your personal movie collection.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center bg-white rounded-xl p-6 shadow-md border border-purple-light/40 hover:shadow-lg transition-shadow">
                            <div className="bg-gradient-to-r from-purple-main to-purple-dark w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Heart className="text-white" size={24} />
                            </div>
                            <h3 className="font-semibold text-purple-main mb-2">Save Favorites</h3>
                            <p className="text-sm text-gray-600">Build your personal collection of favorite movies</p>
                        </div>
                        
                        <div className="text-center bg-white rounded-xl p-6 shadow-md border border-blue-light/40 hover:shadow-lg transition-shadow">
                            <div className="bg-gradient-to-r from-blue-main to-blue-dark w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Clock className="text-white" size={24} />
                            </div>
                            <h3 className="font-semibold text-blue-main mb-2">Watch Later</h3>
                            <p className="text-sm text-gray-600">Keep track of movies you want to watch</p>
                        </div>
                        
                        <div className="text-center bg-white-500 rounded-xl p-6 shadow-md border border-green-light/40 hover:shadow-lg transition-shadow">
                            <div className="bg-gradient-to-r from-green-main to-green-dark w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                            <h3 className="font-semibold text-green-main mb-2">Discover Trending</h3>
                            <p className="text-sm text-gray-600">Find the highest rated movies in our collection</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/movies"
                            className="bg-purple-main text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-dark transition-all transform hover:scale-105 shadow inline-flex items-center justify-center space-x-2"
                        >
                            <Film size={20} />
                            <span>Browse All Reviews</span>
                        </Link>
                        
                        <Link
                            to="/favorites"
                            className="bg-white text-purple-main px-8 py-3 rounded-lg font-semibold border-2 border-purple-main hover:bg-purple-light/40 hover:text-purple-dark transition-all transform hover:scale-105 shadow inline-flex items-center justify-center space-x-2"
                        >
                            <Heart size={20} />
                            <span>My Lists</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction; 