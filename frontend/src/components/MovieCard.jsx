import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Film, Heart, Clock } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';

/**
 * MovieCard component for displaying movie information with favorites/watch later functionality
 * @param {Object} movie - Movie object (can be from TMDB or database)
 * @param {string} variant - Display variant: 'simple', 'detailed', 'compact'
 * @param {string} linkTo - Custom link destination (optional)
 * @param {function} onClick - Custom click handler (optional)
 * @param {boolean} showActions - Whether to show favorites/watch later actions
 * @param {string} className - Additional CSS classes
 * @param {Object} favoritesData - Pre-loaded favorites data from parent component (optional)
 */
const MovieCard = ({ 
    movie, 
    variant = 'detailed', 
    linkTo = null, 
    onClick = null,
    showActions = true,
    className = '',
    favoritesData = null
}) => {
    // Use passed-in favorites data if available, otherwise load internally
    const internalFavorites = useFavorites({ autoLoad: !favoritesData });
    const favorites = favoritesData || internalFavorites;
    
    const {
        isFavorite,
        isInWatchLater,
        toggleFavorite,
        toggleWatchLater,
        isActionLoading
    } = favorites;

    // Handle different movie ID formats
    const movieId = movie.tmdbId || movie.id || movie._id;
    
    // Handle different image path formats
    const posterUrl = movie.posterUrl || 
                     (movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : null) ||
                     (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null);

    // Handle different date formats
    const releaseYear = movie.releaseYear || 
                       (movie.release_date?.split("-")[0]) || 
                       (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Unknown');

    // Handle card click
    const handleCardClick = () => {
        if (onClick) {
            onClick(movie);
        }
    };

    // Handle favorites toggle
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleFavorite(movieId);
    };

    // Handle watch later toggle
    const handleWatchLaterClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleWatchLater(movieId);
    };

    // Default link destination
    const defaultLink = `/movie/${movieId}`;
    const cardLink = linkTo || defaultLink;

    // Simple variant
    if (variant === 'simple') {
        const CardContent = (
            <div className={`flex flex-col items-center justify-center ${className}`}>
                <div className="w-60 h-90 relative group">
                    {posterUrl ? (
                        <img 
                            src={posterUrl} 
                            alt={movie.title}
                            className="w-full h-full object-contain rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <Film className="text-gray-400" size={48} />
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center justify-center mt-4">
                    <h3 className="text-lg font-semibold text-center text-gray-900 line-clamp-2">{movie.title}</h3>
                    <p className="text-gray-600">{releaseYear}</p>
                    
                    {/* Bottom action buttons for simple variant */}
                    {showActions && (
                        <div className="flex items-center space-x-2 mt-2">
                            <button
                                onClick={handleFavoriteClick}
                                disabled={isActionLoading('favorite', movieId)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isFavorite(movieId)
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                } ${isActionLoading('favorite', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isActionLoading('favorite', movieId) ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                    <Heart 
                                        size={12} 
                                        className={isFavorite(movieId) ? 'fill-current' : ''} 
                                    />
                                )}
                                <span>{isFavorite(movieId) ? 'Favorited' : 'Favorite'}</span>
                            </button>
                            
                            <button
                                onClick={handleWatchLaterClick}
                                disabled={isActionLoading('watchlater', movieId)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isInWatchLater(movieId)
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                } ${isActionLoading('watchlater', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isActionLoading('watchlater', movieId) ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                ) : (
                                    <Clock size={12} />
                                )}
                                <span>{isInWatchLater(movieId) ? 'Saved' : 'Watch Later'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );

        return onClick ? (
            <div onClick={handleCardClick} className="cursor-pointer">
                {CardContent}
            </div>
        ) : (
            <Link to={cardLink}>
                {CardContent}
            </Link>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        const CardContent = (
            <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group ${className}`}>
                <div className="flex">
                    <div className="w-20 h-28 flex-shrink-0 relative">
                        {posterUrl ? (
                            <img
                                src={posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Film className="text-gray-400" size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 p-3">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{movie.title}</h3>
                        <p className="text-xs text-gray-600 mb-2">{releaseYear}</p>
                        
                        {(movie.averageRating || movie.vote_average) && (
                            <div className="flex items-center space-x-1 mb-2">
                                <Star className="fill-yellow-400 text-yellow-400" size={12} />
                                <span className="text-xs font-medium">
                                    {(movie.averageRating || movie.vote_average)?.toFixed(1)}
                                </span>
                            </div>
                        )}
                        
                        {/* Bottom action buttons for compact variant */}
                        {showActions && (
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={handleFavoriteClick}
                                    disabled={isActionLoading('favorite', movieId)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        isFavorite(movieId)
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                    } ${isActionLoading('favorite', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isActionLoading('favorite', movieId) ? (
                                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-current"></div>
                                    ) : (
                                        <Heart 
                                            size={10} 
                                            className={isFavorite(movieId) ? 'fill-current' : ''} 
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={handleWatchLaterClick}
                                    disabled={isActionLoading('watchlater', movieId)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                        isInWatchLater(movieId)
                                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                            : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                    } ${isActionLoading('watchlater', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isActionLoading('watchlater', movieId) ? (
                                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-current"></div>
                                    ) : (
                                        <Clock size={10} />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

        return onClick ? (
            <div onClick={handleCardClick} className="cursor-pointer">
                {CardContent}
            </div>
        ) : (
            <Link to={cardLink}>
                {CardContent}
            </Link>
        );
    }

    // Detailed variant (default)
    const CardContent = (
        <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${className}`}>
            <div className="relative">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={movie.title}
                        className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        <Film className="text-gray-400" size={48} />
                    </div>
                )}
                
                {/* Rating overlay */}
                {(movie.averageRating || movie.vote_average) && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg flex items-center space-x-1">
                        <Star className="fill-yellow-400 text-yellow-400" size={14} />
                        <span className="text-sm font-medium">
                            {(movie.averageRating || movie.vote_average)?.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{movie.title}</h3>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{releaseYear}</span>
                    </div>
                    
                    {movie.reviewCount && (
                        <span>{movie.reviewCount} reviews</span>
                    )}
                </div>
                
                {movie.overview && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                        {movie.overview}
                    </p>
                )}
                
                {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {movie.genres.slice(0, 3).map((genre, index) => (
                            <span
                                key={index}
                                className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                {/* Bottom action buttons for detailed view */}
                {showActions && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <button
                            onClick={handleFavoriteClick}
                            disabled={isActionLoading('favorite', movieId)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                isFavorite(movieId)
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            } ${isActionLoading('favorite', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isActionLoading('favorite', movieId) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            ) : (
                                <Heart 
                                    size={14} 
                                    className={isFavorite(movieId) ? 'fill-current' : ''} 
                                />
                            )}
                            <span>{isFavorite(movieId) ? 'Favorited' : 'Favorite'}</span>
                        </button>
                        
                        <button
                            onClick={handleWatchLaterClick}
                            disabled={isActionLoading('watchlater', movieId)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                isInWatchLater(movieId)
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                            } ${isActionLoading('watchlater', movieId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isActionLoading('watchlater', movieId) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            ) : (
                                <Clock size={14} />
                            )}
                            <span>{isInWatchLater(movieId) ? 'Saved' : 'Watch Later'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return onClick ? (
        <div onClick={handleCardClick} className="cursor-pointer">
            {CardContent}
        </div>
    ) : (
        <Link to={cardLink}>
            {CardContent}
        </Link>
    );
};

export default MovieCard;