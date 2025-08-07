import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Calendar, Users, Eye, Heart, Grid, List, ChevronDown, Film, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetMoviesWithReviewsQuery } from '../redux/api/movies';
import { useGetAllGenresQuery } from '../redux/api/genre';
import { useDebounce } from '../hooks/useDebounce';
import Loader from '../components/Loader';
import MovieCard from '../components/MovieCard';
import { toast } from 'sonner';

const Movies = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
    }, [userInfo, navigate]);
    
    // API queries - only one call now!
    const { data: moviesData, isLoading, error, refetch } = useGetMoviesWithReviewsQuery({
        page: currentPage,
        limit: 20,
        search: debouncedSearchQuery,
        genre: selectedGenre,
        sortBy
    });
    
    const { data: genresData } = useGetAllGenresQuery();
    
    // Extract data from API response
    const movies = moviesData?.movies || [];
    const pagination = moviesData?.pagination || {};
    const categories = moviesData?.categories || {};
    
    // Filter options with counts from categories (user-focused)
    const filterOptions = [
        { id: 'all', label: 'All Reviews', count: movies.length },
        { id: 'featured', label: 'Featured', count: categories.featured?.length || 0 },
        { id: 'top-rated', label: 'Top Rated', count: categories.topRated?.length || 0 },
        { id: 'recent', label: 'Recent Reviews', count: categories.recent?.length || 0 }
    ];
    
    // Get current movies based on filter
    const getCurrentMovies = () => {
        switch (activeFilter) {
            case 'featured':
                return categories.featured || [];
            case 'top-rated':
                return categories.topRated || [];
            case 'recent':
                return categories.recent || [];
            default:
                return movies;
        }
    };
    
    const filteredMovies = getCurrentMovies();
    
    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, debouncedSearchQuery, selectedGenre, sortBy]);
    
    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Show loading if not authenticated (while checking)
    if (!userInfo) {
        return <Loader />;
    }
    
    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center h-64">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }
    
    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
                <div className="container mx-auto px-4">
                    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <AlertCircle size={48} className="mx-auto" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Movies</h2>
                        <p className="text-gray-600 mb-4">
                            {error?.data?.message || 'Failed to load movies. Please try again.'}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-purple-main mb-4">
                            Movie Reviews
                        </h1>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Discover movies through our community reviews. 
                            Find your next favorite film and add movies to your personal collection.
                        </p>
                    </div>
                    
                    {/* User Stats */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Welcome back, {userInfo.username}!</h2>
                                <p className="text-gray-600">Explore movie reviews and build your personal collection</p>
                            </div>
                            <div className="flex items-center space-x-6">
                                <Link 
                                    to="/favorites" 
                                    className="flex items-center space-x-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-100 transition-colors"
                                >
                                    <Heart size={18} />
                                    <span>My Favorites</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filters and Search */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            {/* Search */}
                            <div className="flex-1 w-full">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search movie reviews..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-main focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                            
                            {/* Filters */}
                            <div className="flex items-center space-x-4">
                                {/* Genre Filter */}
                                <div className="relative">
                                    <select
                                        value={selectedGenre}
                                        onChange={(e) => setSelectedGenre(e.target.value)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-purple-main focus:border-transparent"
                                    >
                                        <option value="">All Genres</option>
                                        {genresData?.map(genre => (
                                            <option key={genre._id} value={genre.name}>
                                                {genre.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                                
                                {/* Sort By */}
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-purple-main focus:border-transparent"
                                    >
                                        <option value="latest">Latest Reviews</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="reviews">Most Popular</option>
                                        <option value="title">Title A-Z</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                                
                                {/* View Mode */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-main text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <Grid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-main text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <List size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2 mt-6">
                            {filterOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setActiveFilter(option.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        activeFilter === option.id
                                            ? 'bg-purple-main text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {option.label}
                                    {option.count > 0 && (
                                        <span className="ml-2 text-sm">({option.count})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Results */}
                    {filteredMovies.length > 0 ? (
                        <>
                            <div className={`grid gap-6 ${
                                viewMode === 'grid' 
                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                    : 'grid-cols-1'
                            }`}>
                                {filteredMovies.map(movie => (
                                    <MovieCard 
                                        key={movie._id} 
                                        movie={movie} 
                                        variant={viewMode === 'list' ? 'compact' : 'detailed'}
                                        linkTo={`/movie/${movie.tmdbId}`}
                                        showActions={true} // Enable favorites and watch later actions
                                    />
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {pagination.totalPages > 1 && activeFilter === 'all' && (
                                <div className="flex justify-center items-center space-x-2 mt-8">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    
                                    <span className="px-4 py-2 text-gray-600">
                                        Page {pagination.currentPage} of {pagination.totalPages}
                                    </span>
                                    
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                                <Film className="text-gray-400 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No reviews found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery ? 
                                        `No reviews match your search for "${searchQuery}"` : 
                                        selectedGenre ? 
                                        `No reviews found for "${selectedGenre}" movies` :
                                        'No movie reviews are available yet.'
                                    }
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Check back later or explore different filters to find more reviews.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Movies; 