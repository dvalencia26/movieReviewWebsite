import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import CallToAction from '../components/CallToAction';
import FavoriteMovieCard from '../components/FavoriteMovieCard';
import TrendingMovieCard from '../components/TrendingMovieCard';
import ReviewCard from '../components/ReviewCard';
import Footer from '../components/Footer';
import { 
    FavoriteMovieSkeleton, 
    ReviewCardSkeleton, 
    MovieCardSkeleton,
    SectionSkeleton 
} from '../components/SkeletonLoader';
import {
    useGetAdminFavoriteMoviesQuery,
    useGetHighestRatedMoviesQuery,
    useGetRecentlyReviewedMoviesQuery
} from '../redux/api/movies';

const Home = () => {
    const { userInfo } = useSelector((state) => state.auth);
    
    // Fetch data from admin's database
    const { data: favoritesData, isLoading: favoritesLoading, error: favoritesError } = useGetAdminFavoriteMoviesQuery({ limit: 8 });
    const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useGetHighestRatedMoviesQuery({ limit: 8 });
    const { data: recentData, isLoading: recentLoading, error: recentError } = useGetRecentlyReviewedMoviesQuery({ limit: 6 });

    // Get data from queries
    const favorites = favoritesData?.movies || [];
    const trending = trendingData?.movies || [];
    const recent = recentData?.movies || [];

    // Initialize Flowbite carousel after component mounts and data is loaded
    useEffect(() => {
        if (favorites.length > 0) {
            // Dynamically import Flowbite to initialize carousel
            import('flowbite').then((flowbite) => {
                // Initialize carousel after a small delay to ensure DOM is ready
                setTimeout(() => {
                    const carousel = document.getElementById('favorites-carousel');
                    if (carousel) {
                        // Flowbite carousel will be auto-initialized due to data attributes
                        flowbite.initFlowbite();
                    }
                }, 100);
            });
        }
    }, [favorites.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500">
            {/* Hero Section - Only show loader if ALL data is loading */}
            <HeroSection 
                loading={false} // Remove blocking loader from hero
                userInfo={userInfo}
            />
            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                {/* All Time Favorites Section */}
                <SectionSkeleton title="All-Time Favorite Movies">
                    {favoritesLoading ? (
                        <FavoriteMovieSkeleton />
                    ) : favoritesError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">{favoritesError.data?.message || 'Failed to load favorites.'}</div>
                    ) : favorites.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">No favorites to display</div>
                    ) : (
                        <div className="relative" id="favorites-carousel" data-carousel="static">
                            {/* Carousel wrapper */}
                            <div className="relative overflow-hidden rounded-lg h-auto min-h-96">
                                {favorites.map((movie, index) => (
                                    <div 
                                        key={movie._id || movie.tmdbId} 
                                        className={`${index === 0 ? '' : 'hidden'} duration-700 ease-in-out`}
                                        data-carousel-item
                                    >
                                        <FavoriteMovieCard
                                            poster={movie.posterPath}
                                            title={movie.title}
                                            rating={Math.round(movie.averageRating || 5)}
                                            description={movie.overview || ''}
                                            reviewText={movie.reviews && movie.reviews.length > 0 ? movie.reviews[0].content : ''}
                                            link={`/movie/${movie.tmdbId}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Slider indicators */}
                            <div className="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2">
                                {favorites.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-purple-main' : 'bg-gray-300'}`}
                                        aria-current={index === 0 ? 'true' : 'false'}
                                        aria-label={`Slide ${index + 1}`}
                                        data-carousel-slide-to={index}
                                    ></button>
                                ))}
                            </div>

                            {/* Slider controls */}
                            <button
                                type="button"
                                className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                                data-carousel-prev
                            >
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-main/80 hover:bg-purple-main shadow-lg group-focus:ring-4 group-focus:ring-purple-light group-focus:outline-none transition-all duration-200">
                                    <ChevronLeft className="w-5 h-5 text-white" />
                                    <span className="sr-only">Previous</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                                data-carousel-next
                            >
                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-main/80 hover:bg-purple-main shadow-lg group-focus:ring-4 group-focus:ring-purple-light group-focus:outline-none transition-all duration-200">
                                    <ChevronRight className="w-5 h-5 text-white" />
                                    <span className="sr-only">Next</span>
                                </span>
                            </button>
                        </div>
                    )}
                </SectionSkeleton>

                {/* Call to Action Section */}
                <div className="mb-16">
                    <CallToAction />
                </div>

                {/* Latest Reviews Section */}
                <SectionSkeleton title="Latest Reviews">
                    {recentLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <ReviewCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : recentError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">{recentError.data?.message || 'Failed to load reviews.'}</div>
                    ) : recent.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">No reviews to display</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recent.map((movie) => (
                                <ReviewCard
                                    key={movie._id || movie.tmdbId}
                                    image={movie.backdropPath || movie.posterPath}
                                    title={movie.title}
                                    rating={Math.round(movie.averageRating || 4)}
                                    tmdbId={movie.tmdbId}
                                />
                            ))}
                        </div>
                    )}
                </SectionSkeleton>

                {/* Trending Movies Section */}
                <SectionSkeleton title="Trending">
                    {trendingLoading ? (
                        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide pb-2">
                            {[...Array(8)].map((_, index) => (
                                <MovieCardSkeleton key={index} className="flex-shrink-0 w-48" />
                            ))}
                        </div>
                    ) : trendingError ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-600">{trendingError.data?.message || 'Failed to load trending movies.'}</div>
                    ) : trending.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">No trending movies to display</div>
                    ) : (
                        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide pb-2">
                            {trending.map((movie) => (
                                <TrendingMovieCard
                                    key={movie._id || movie.tmdbId}
                                    poster={movie.posterPath}
                                    title={movie.title}
                                    tmdbId={movie.tmdbId}
                                />
                            ))}
                        </div>
                    )}
                </SectionSkeleton>


            </main>

            {/* Footer with TMDB disclaimer */}
            <Footer showTMDBDisclaimer={true} />
        </div>
    );
};

export default Home;