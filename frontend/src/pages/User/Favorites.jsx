import React, { useState, useEffect } from 'react';
import { Heart, Clock, Film, Filter, Grid, List, AlertCircle, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { toast } from 'sonner';
import Loader from '../../components/Loader';
import apiService from '../../services/api';

const Favorites = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [favorites, setFavorites] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('favorites');
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    
    const {
        removeFromFavorites,
        removeFromWatchLater,
        isActionLoading
    } = useFavorites();
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
    }, [userInfo, navigate]);
    
    // Fetch user's favorites and watchlist
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userInfo) return;
            
            try {
                setLoading(true);
                
                // Fetch favorites and watchlist in parallel
                const [favoritesResponse, watchlistResponse] = await Promise.all([
                    apiService.getUserFavorites(),
                    apiService.getUserWatchLater()
                ]);
                
                setFavorites(favoritesResponse.data.favorites || []);
                setWatchlist(watchlistResponse.data.watchLater || []);
                
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load your saved movies');
                toast.error('Failed to load your saved movies');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [userInfo]);
    
    // Handle remove from favorites
    const handleRemoveFromFavorites = async (movie) => {
        const movieData = movie.movie || movie;
        const tmdbId = movie.tmdbId || movieData.tmdbId;
        
        if (!tmdbId) {
            toast.error('Unable to remove item - missing movie ID');
            return;
        }
        
        const success = await removeFromFavorites(tmdbId);
        if (success) {
            setFavorites(prev => prev.filter(item => {
                const itemTmdbId = item.tmdbId || (item.movie && item.movie.tmdbId);
                return itemTmdbId !== tmdbId;
            }));
        }
    };
    
    // Handle remove from watch later
    const handleRemoveFromWatchLater = async (movie) => {
        const movieData = movie.movie || movie;
        const tmdbId = movie.tmdbId || movieData.tmdbId;
        
        if (!tmdbId) {
            toast.error('Unable to remove item - missing movie ID');
            return;
        }
        
        const success = await removeFromWatchLater(tmdbId);
        if (success) {
            setWatchlist(prev => prev.filter(item => {
                const itemTmdbId = item.tmdbId || (item.movie && item.movie.tmdbId);
                return itemTmdbId !== tmdbId;
            }));
        }
    };
    
    // Filter movies based on search
    const filterMovies = (movies) => {
        if (!searchQuery.trim()) return movies;
        return movies.filter(movie => 
            movie.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            movie.movie?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };
    
    const currentMovies = activeTab === 'favorites' ? favorites : watchlist;
    const filteredMovies = filterMovies(currentMovies);
    
    const tabs = [
        {
            id: 'favorites',
            label: 'Favorites',
            icon: Heart,
            count: favorites.length,
            color: 'text-red-500'
        },
        {
            id: 'watchlist',
            label: 'Watch Later',
            icon: Clock,
            count: watchlist.length,
            color: 'text-blue-500'
        }
    ];
    
    // Movie Card Component
    const MovieCard = ({ movie, variant = 'detailed' }) => {
        // Handle different data structures (favorites vs watchlist)
        const movieData = movie.movie || movie;
        const title = movieData.title || 'Unknown Title';
        const posterPath = movieData.posterPath || movieData.poster_path;
        const releaseDate = movieData.releaseDate || movieData.release_date;
        const overview = movieData.overview || '';
        const voteAverage = movieData.voteAverage || movieData.vote_average;
        const tmdbId = movie.tmdbId || movieData.tmdbId;
        
        const isRemoving = isActionLoading(
            activeTab === 'favorites' ? 'favorite' : 'watchlater', 
            tmdbId
        );
        
        const handleClick = () => {
            if (tmdbId) {
                navigate(`/movie/${tmdbId}`);
            }
        };
        
        const handleRemoveClick = (e) => {
            e.stopPropagation(); // Prevent card click
            if (activeTab === 'favorites') {
                handleRemoveFromFavorites(movie);
            } else {
                handleRemoveFromWatchLater(movie);
            }
        };
        
        return (
            <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group ${
                variant === 'compact' ? 'flex' : ''
            }`}>
                <div className={`${variant === 'compact' ? 'w-32 h-48' : 'w-full h-64'} relative`}>
                    {posterPath ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w500${posterPath}`}
                            alt={title}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={handleClick}
                        />
                    ) : (
                        <div 
                            className="w-full h-full bg-gray-200 flex items-center justify-center cursor-pointer"
                            onClick={handleClick}
                        >
                            <Film className="text-gray-400" size={48} />
                        </div>
                    )}
                    
                    {voteAverage && (
                        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-lg flex items-center space-x-1">
                            <span className="text-sm font-medium">{voteAverage.toFixed(1)}</span>
                        </div>
                    )}
                    
                    {/* Remove Button */}
                    <button
                        onClick={handleRemoveClick}
                        disabled={isRemoving}
                        className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
                            isRemoving ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                            activeTab === 'favorites' 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        title={`Remove from ${activeTab === 'favorites' ? 'favorites' : 'watch later'}`}
                    >
                        {isRemoving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Trash2 size={16} />
                        )}
                    </button>
                </div>
                
                <div className="p-4 flex-1">
                    <h3 
                        className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-purple-main transition-colors"
                        onClick={handleClick}
                    >
                        {title}
                    </h3>
                    
                    {releaseDate && (
                        <p className="text-gray-600 text-sm mb-2">
                            {new Date(releaseDate).getFullYear()}
                        </p>
                    )}
                    
                    {overview && variant === 'detailed' && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{overview}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Added {new Date(movie.addedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleRemoveClick}
                                disabled={isRemoving}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isRemoving ? 'opacity-50 cursor-not-allowed' : ''
                                } ${
                                    activeTab === 'favorites'
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                            >
                                {isRemoving ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                    activeTab === 'favorites' ? (
                                        <Heart className="fill-current" size={14} />
                                    ) : (
                                        <Clock size={14} />
                                    )
                                )}
                                <span>Remove</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // Loading state
    if (loading) {
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
                        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
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
                            My Movie Lists
                        </h1>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Keep track of your favorite movies and build your watchlist for later viewing.
                        </p>
                    </div>
                    
                    {/* Tabs and Controls */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
                            {/* Tabs */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors font-medium ${
                                                activeTab === tab.id
                                                    ? 'bg-white text-purple-main shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className={activeTab === tab.id ? 'text-purple-main' : tab.color} size={18} />
                                            <span>{tab.label}</span>
                                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Controls */}
                            <div className="flex items-center space-x-4">
                                {/* Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search movies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-main focus:border-transparent transition-all"
                                    />
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
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <Heart className="text-red-500 mx-auto mb-2" size={24} />
                                <p className="text-2xl font-bold text-red-600">{favorites.length}</p>
                                <p className="text-sm text-red-600">Favorites</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                <Clock className="text-blue-500 mx-auto mb-2" size={24} />
                                <p className="text-2xl font-bold text-blue-600">{watchlist.length}</p>
                                <p className="text-sm text-blue-600">Watch Later</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <Film className="text-green-500 mx-auto mb-2" size={24} />
                                <p className="text-2xl font-bold text-green-600">{favorites.length + watchlist.length}</p>
                                <p className="text-sm text-green-600">Total Saved</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                <Filter className="text-purple-500 mx-auto mb-2" size={24} />
                                <p className="text-2xl font-bold text-purple-600">{filteredMovies.length}</p>
                                <p className="text-sm text-purple-600">Showing</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Movie Grid */}
                    {filteredMovies.length > 0 ? (
                        <div className={`grid gap-6 ${
                            viewMode === 'grid' 
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                : 'grid-cols-1'
                        }`}>
                            {filteredMovies.map((movie, index) => (
                                <MovieCard 
                                    key={movie.tmdbId || index}
                                    movie={movie}
                                    variant={viewMode === 'list' ? 'compact' : 'detailed'}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                                {activeTab === 'favorites' ? (
                                    <>
                                        <Heart className="text-gray-400 mx-auto mb-4" size={48} />
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
                                        <p className="text-gray-500 mb-4">
                                            {searchQuery ? 
                                                `No favorites match "${searchQuery}"` : 
                                                'Start building your favorites list by exploring movies!'
                                            }
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Clock className="text-gray-400 mx-auto mb-4" size={48} />
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No movies to watch later</h3>
                                        <p className="text-gray-500 mb-4">
                                            {searchQuery ? 
                                                `No watch later items match "${searchQuery}"` : 
                                                'Add movies to your watch later list to save them for later!'
                                            }
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Favorites; 