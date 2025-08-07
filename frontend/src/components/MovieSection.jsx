import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieSection = ({ 
    title, 
    movies = [], 
    loading = false, 
    error = null,
    showViewAll = false,
    viewAllLink = null,
    className = '',
    favoritesData = null
}) => {
    const scrollContainerRef = useRef(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -320, // Scroll by roughly one card width
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: 320, // Scroll by roughly one card width
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <section className={`mb-12 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                </div>
                <div className="flex space-x-4 overflow-hidden">
                    {[...Array(6)].map((_, index) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 w-72 h-96 bg-gray-200 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={`mb-12 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </section>
        );
    }

    if (!movies || movies.length === 0) {
        return (
            <section className={`mb-12 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500">No movies to display</p>
                </div>
            </section>
        );
    }

    return (
        <section className={`mb-12 ${className}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <div className="flex items-center space-x-2">
                    {showViewAll && viewAllLink && (
                        <a 
                            href={viewAllLink}
                            className="text-purple-main hover:text-purple-dark font-medium text-sm transition-colors"
                        >
                            View All
                        </a>
                    )}
                    {movies.length > 4 && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={scrollLeft}
                                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 hover:bg-gray-50"
                                title="Scroll left"
                            >
                                <ChevronLeft size={20} className="text-gray-600" />
                            </button>
                            <button
                                onClick={scrollRight}
                                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 hover:bg-gray-50"
                                title="Scroll right"
                            >
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Movies Container */}
            <div className="relative">
                <div 
                    ref={scrollContainerRef}
                    className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
                    style={{
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none', // IE/Edge
                    }}
                >
                    {movies.map((movie) => (
                        <div key={movie._id || movie.tmdbId} className="flex-shrink-0 w-72">
                            <MovieCard 
                                movie={movie} 
                                variant="detailed"
                                showActions={true}
                                linkTo={`/movie/${movie.tmdbId}`}
                                favoritesData={favoritesData}
                            />
                        </div>
                    ))}
                </div>
                
                {/* Fade edges for better UX */}
                <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
        </section>
    );
};

export default MovieSection; 