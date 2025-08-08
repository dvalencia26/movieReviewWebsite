import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Grid, List, Filter, Star, Calendar, TrendingUp, Clock, ChevronLeft, ChevronRight, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { 
    useGetPopularMoviesQuery,
    useGetNowPlayingMoviesQuery,
    useGetUpcomingMoviesQuery,
    useGetTmdbTopRatedMoviesQuery,
    useSearchMoviesQuery,
    useDiscoverMoviesQuery,
    useGetMovieGenresQuery
} from '../../redux/api/tmdb';
import apiService from '../../services/api';
import { toast } from 'sonner';

const MovieSelectionPageOptimized = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    
    // Admin-only protection
    useEffect(() => {
        if (!userInfo || !userInfo.isAdmin) {
            navigate('/login');
            return;
        }
    }, [userInfo, navigate]);
    
    // State management
    const [activeTab, setActiveTab] = useState('popular');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [viewMode, setViewMode] = useState('grid');
    const [adminWatchList, setAdminWatchList] = useState(new Set());
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Load admin's watch later list on mount
    useEffect(() => {
        const loadAdminWatchList = async () => {
            if (!userInfo?.isAdmin) return;
            
            try {
                const response = await apiService.getUserWatchLater();
                const watchLaterIds = response.data.watchLater?.map(item => item.tmdbId) || [];
                setAdminWatchList(new Set(watchLaterIds));
            } catch (error) {
                console.error('Error loading admin watch list:', error);
            }
        };
        
        loadAdminWatchList();
    }, [userInfo]);

    // Tab configuration
    const tabs = [
        { id: 'popular', label: 'Popular', icon: TrendingUp },
        { id: 'now_playing', label: 'Now Playing', icon: Calendar },
        { id: 'upcoming', label: 'Upcoming', icon: Clock },
        { id: 'top_rated', label: 'Top Rated', icon: Star },
        { id: 'discover', label: 'By Genre', icon: Filter },
        { id: 'search', label: 'Search', icon: Search }
    ];

    // RTK Query hooks - only call the active query
    const popularQuery = useGetPopularMoviesQuery(
        { page: currentPage }, 
        { skip: activeTab !== 'popular' }
    );
    
    const nowPlayingQuery = useGetNowPlayingMoviesQuery(
        { page: currentPage }, 
        { skip: activeTab !== 'now_playing' }
    );
    
    const upcomingQuery = useGetUpcomingMoviesQuery(
        { page: currentPage }, 
        { skip: activeTab !== 'upcoming' }
    );
    
    const topRatedQuery = useGetTmdbTopRatedMoviesQuery(
        { page: currentPage }, 
        { skip: activeTab !== 'top_rated' }
    );
    
    const searchQuery_rtk = useSearchMoviesQuery(
        { query: debouncedSearchQuery, page: currentPage }, 
        { skip: activeTab !== 'search' || !debouncedSearchQuery.trim() }
    );
    
    const discoverQuery = useDiscoverMoviesQuery(
        { genre: selectedGenre, sortBy, page: currentPage }, 
        { skip: activeTab !== 'discover' || !selectedGenre }
    );
    
    const genresQuery = useGetMovieGenresQuery();

    // Handle tab change
    const handleTabChange = (tabId) => {
        if (tabId !== activeTab) {
            setActiveTab(tabId);
            setCurrentPage(1); // Reset to first page when changing tabs
            
            // Clear search query when switching away from search
            if (tabId !== 'search') {
                setSearchQuery('');
            }
        }
    };

    // Get current query result based on active tab
    const getCurrentQuery = () => {
        switch (activeTab) {
            case 'popular': return popularQuery;
            case 'now_playing': return nowPlayingQuery;
            case 'upcoming': return upcomingQuery;
            case 'top_rated': return topRatedQuery;
            case 'search': return searchQuery_rtk;
            case 'discover': return discoverQuery;
            default: return popularQuery;
        }
    };

    const currentQuery = getCurrentQuery();
    const { data, isLoading, error, isFetching } = currentQuery;

    // Extract data from response - ensure search tab shows empty array when no search query
    const movies = activeTab === 'search' && !debouncedSearchQuery.trim() 
        ? [] 
        : data?.results || [];
    const totalPages = Math.min(data?.total_pages || 1, 7); // Limit to 7 pages for performance
    const totalResults = data?.total_results || 0;

    // Admin Watch Later functionality
    const handleWatchLaterToggle = async (movie) => {
        if (!userInfo?.isAdmin) {
            toast.error('Only admins can save movies to review later');
            return;
        }

        const movieTmdbId = movie.id; // This is the TMDB ID
        const isCurrentlyInWatchList = adminWatchList.has(movieTmdbId);
        
        try {
            // Optimistically update UI
            const newWatchList = new Set(adminWatchList);
            if (isCurrentlyInWatchList) {
                newWatchList.delete(movieTmdbId);
            } else {
                newWatchList.add(movieTmdbId);
            }
            setAdminWatchList(newWatchList);

            if (isCurrentlyInWatchList) {
                // Remove from watch later
                await apiService.removeFromWatchLater(movieTmdbId);
                toast.success('Removed from review later list');
            } else {
                // Add to watch later
                await apiService.addToWatchLater(movieTmdbId);
                toast.success('Added to review later list');
            }

        } catch (error) {
            // Revert optimistic update on error
            setAdminWatchList(adminWatchList);
            console.error('Error updating watch later:', error);
            toast.error('Failed to update review later list');
        }
    };

    // Handle page navigation
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
            
        }
    };

    // Handle movie selection for review
    const handleMovieSelect = (movie) => {
        navigate(`/admin/review/${movie.id}`);
    };

    // Get display info for current tab
    const getTabDisplayInfo = () => {
        switch (activeTab) {
            case 'popular':
                return {
                    title: 'Popular Movies',
                    description: 'Most popular movies right now'
                };
            case 'now_playing':
                return {
                    title: 'Now Playing',
                    description: 'Movies currently playing in theaters'
                };
            case 'upcoming':
                return {
                    title: 'Upcoming Movies',
                    description: 'Movies coming soon to theaters'
                };
            case 'top_rated':
                return {
                    title: 'Top Rated Movies',
                    description: 'Highest rated movies of all time'
                };
            case 'discover':
                return {
                    title: 'Discover by Genre',
                    description: 'Find movies by your favorite genres'
                };
            case 'search':
                return {
                    title: 'Search Results',
                    description: searchQuery ? `Results for "${searchQuery}"` : 'Search for movies to review'
                };
            default:
                return { title: 'Movies', description: 'Browse movies to review' };
        }
    };

    // Handle retry for failed requests
    const handleRetry = () => {
        // Get the current query and trigger a refetch
        const currentQuery = getCurrentQuery();
        if (currentQuery && currentQuery.refetch) {
            currentQuery.refetch();
        }
    };

    // Movie card component with admin watch later functionality
    const MovieCard = ({ movie }) => {
        const [isToggling, setIsToggling] = useState(false);
        const isInWatchList = adminWatchList.has(movie.id); // Using movie.id which is the TMDB ID
        
        const handleWatchLaterClick = async (e) => {
            e.stopPropagation(); // Prevent card click event
            if (isToggling) return;
            
            setIsToggling(true);
            try {
                await handleWatchLaterToggle(movie);
            } finally {
                setIsToggling(false);
            }
        };
        
        return (
            <div
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group max-w-sm mx-auto"
                onClick={() => handleMovieSelect(movie)}
            >
                <div className="relative overflow-hidden rounded-t-lg h-72">
                    {movie.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                        </div>
                    )}
                    {/* Review Later Button */}
                    <button
                        onClick={handleWatchLaterClick}
                        disabled={isToggling}
                        className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
                            isInWatchList
                                ? 'bg-purple-main text-white hover:bg-purple-dark'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isInWatchList ? 'Remove from review later' : 'Save to review later'}
                    >
                        {isToggling ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : isInWatchList ? (
                            <BookmarkCheck size={16} />
                        ) : (
                            <Bookmark size={16} />
                        )}
                    </button>
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{movie.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{movie.release_date?.split('-')[0]}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Star className="text-yellow-400 fill-current" size={16} />
                            <span className="ml-1 text-sm text-gray-600">{movie.vote_average?.toFixed(1)}</span>
                        </div>
                        <button className="bg-purple-main text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-dark transition-colors">
                            Write Review
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Show loading if not authenticated (while checking)
    if (!userInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-main mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-main mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading movies...</p>
                        </div>
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
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Movies</h2>
                            <p className="text-gray-600 mb-4">
                                {error?.data?.message || error?.message || 'Failed to load movies. Please try again.'}
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={handleRetry}
                                    disabled={isFetching}
                                    className="bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isFetching ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Retrying...</span>
                                        </>
                                    ) : (
                                        'Retry'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('popular');
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
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
                            {getTabDisplayInfo().title}
                        </h1>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            {getTabDisplayInfo().description}
                        </p>
                        <p className="text-purple-600 text-sm mt-2">
                            Click the bookmark icon to save movies for reviewing later
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg shadow-md p-2">
                        {tabs.map(tab => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`flex items-center space-x-2 px-4 py-3 m-1 rounded-lg transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-purple-main text-white shadow-md'
                                            : 'text-gray-600 hover:bg-purple-light hover:text-purple-dark'
                                    }`}
                                    onClick={() => handleTabChange(tab.id)}
                                >
                                    <IconComponent size={18} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Search Input */}
                            {activeTab === 'search' && (
                                <div className="flex-1 min-w-64">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search for movies to review..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-main focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Genre Filter */}
                            {activeTab === 'discover' && (
                                <div className="flex gap-4 items-center">
                                    <select
                                        value={selectedGenre}
                                        onChange={(e) => setSelectedGenre(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-main focus:border-transparent"
                                    >
                                        <option value="">Select Genre</option>
                                        {genresQuery.data?.genres?.map(genre => (
                                            <option key={genre.id} value={genre.id}>
                                                {genre.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-main focus:border-transparent"
                                    >
                                        <option value="popularity.desc">Most Popular</option>
                                        <option value="vote_average.desc">Highest Rated</option>
                                        <option value="release_date.desc">Newest</option>
                                        <option value="title.asc">A-Z</option>
                                    </select>
                                </div>
                            )}

                            {/* View Mode Toggle */}
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

                    {/* Loading indicator for fetching */}
                    {isFetching && (
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center space-x-2 text-purple-main">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-main"></div>
                                <span className="text-sm">Loading...</span>
                            </div>
                        </div>
                    )}

                    {/* Movies Grid */}
                    {movies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                            {movies.map(movie => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Search className="text-gray-400 mx-auto mb-4" size={48} />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                {activeTab === 'search' && !debouncedSearchQuery.trim() 
                                    ? 'Start typing to search for movies' 
                                    : 'No movies found'}
                            </h3>
                            <p className="text-gray-500">
                                {activeTab === 'search' && !debouncedSearchQuery.trim()
                                    ? 'Enter a movie title to find movies to review'
                                    : activeTab === 'discover' && !selectedGenre
                                    ? 'Please select a genre to discover movies'
                                    : 'Try adjusting your search criteria or filters'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    <span>Previous</span>
                                </button>
                                
                                {/* Page numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 rounded-lg transition-colors ${
                                                currentPage === page
                                                    ? 'bg-purple-main text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            
                            {/* Results info */}
                            <div className="text-center text-gray-500 text-sm space-y-1">
                                <div>
                                    Showing page {currentPage} of {totalPages} ({totalResults.toLocaleString()} total results)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieSelectionPageOptimized; 