import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List, Filter, Star, Calendar, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import apiService from '../../services/api';
import { toast } from 'sonner';

const MovieSelectionPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('popular');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Use refs to track current request state
  const currentRequestRef = useRef(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Tab configuration
  const tabs = [
    { id: 'popular', label: 'Popular', icon: TrendingUp },
    { id: 'now_playing', label: 'Now Playing', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'top_rated', label: 'Top Rated', icon: Star },
    { id: 'discover', label: 'By Genre', icon: Filter },
    { id: 'search', label: 'Search', icon: Search }
  ];

  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await apiService.getMovieGenres();
        setGenres(response.data.genres || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
        toast.error('Failed to load genres');
      }
    };

    fetchGenres();
  }, []);

  // Fetch movies based on active tab and filters
  const fetchMovies = useCallback(async (pageToFetch = currentPage) => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.log('🚫 Preventing duplicate request - already loading');
      return;
    }
    
    // Cancel any existing request
    if (currentRequestRef.current) {
      console.log('🚫 Cancelling previous request');
      currentRequestRef.current.cancel = true;
    }
    
    const requestId = Date.now();
    currentRequestRef.current = { id: requestId, cancel: false };
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      console.log(`📡 Making API request: ${activeTab}, page: ${pageToFetch}`);
      
      switch (activeTab) {
        case 'popular':
          response = await apiService.getPopularMovies(pageToFetch);
          break;
        case 'now_playing':
          response = await apiService.getNowPlayingMovies(pageToFetch);
          break;
        case 'upcoming':
          response = await apiService.getUpcomingMovies(pageToFetch);
          break;
        case 'top_rated':
          response = await apiService.getTopRatedMovies(pageToFetch);
          break;
        case 'discover':
          if (!selectedGenre) {
            setLoading(false);
            return;
          }
          response = await apiService.discoverMovies({
            genre: selectedGenre,
            sortBy,
            page: pageToFetch
          });
          break;
        case 'search':
          if (!debouncedSearchQuery.trim()) {
            setMovies([]);
            setLoading(false);
            return;
          }
          response = await apiService.searchMovies(debouncedSearchQuery, pageToFetch);
          break;
        default:
          setLoading(false);
          return;
      }
      
      // Check if this request was cancelled
      if (currentRequestRef.current?.cancel || currentRequestRef.current?.id !== requestId) {
        console.log('🚫 Request was cancelled');
        return;
      }
      
      const newMovies = response.data.results || [];
      const totalPagesCount = response.data.total_pages || 1;
      const totalResultsCount = response.data.total_results || 0;
      
      setMovies(newMovies);
      setTotalPages(totalPagesCount);
      setTotalResults(totalResultsCount);
      setCurrentPage(pageToFetch);
      
      console.log(`✅ Request completed: ${newMovies.length} movies loaded for page ${pageToFetch}`);
      
    } catch (err) {
      // Check if this request was cancelled
      if (currentRequestRef.current?.cancel || currentRequestRef.current?.id !== requestId) {
        console.log('🚫 Request was cancelled (error)');
        return;
      }
      
      console.error('❌ Error fetching movies:', err);
      setError(`Failed to fetch movies: ${apiService.formatError(err)}`);
      toast.error('Failed to fetch movies');
    } finally {
      // Only set loading to false if this is the current request
      if (currentRequestRef.current?.id === requestId) {
        setLoading(false);
        currentRequestRef.current = null;
      }
    }
  }, [activeTab, debouncedSearchQuery, selectedGenre, sortBy, currentPage, loading]);

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchMovies(newPage);
    }
  };

  // Get display info for current tab
  const getTabDisplayInfo = () => {
    const maxPages = 7;
    const isLimited = totalPages > maxPages;
    
    switch (activeTab) {
      case 'popular':
        return {
          title: 'Popular Movies',
          description: isLimited 
            ? `Showing the most popular movies from ${new Date().getFullYear() - 1}-${new Date().getFullYear()} (limited to ${maxPages} pages for performance)`
            : 'Most popular movies right now'
        };
      case 'now_playing':
        return {
          title: 'Now Playing',
          description: isLimited 
            ? `Currently in theaters (limited to ${maxPages} pages for performance)`
            : 'Movies currently playing in theaters'
        };
      case 'upcoming':
        return {
          title: 'Upcoming Movies',
          description: isLimited 
            ? `Coming soon to theaters (limited to ${maxPages} pages for performance)`
            : 'Movies coming soon to theaters'
        };
      case 'top_rated':
        return {
          title: 'Top Rated Movies',
          description: isLimited 
            ? `Highest rated movies with significant votes (limited to ${maxPages} pages for performance)`
            : 'Highest rated movies of all time'
        };
      case 'discover':
        return {
          title: 'Discover by Genre',
          description: 'Find movies by your favorite genres'
        };
      case 'search':
        return {
          title: 'Search Results',
          description: `Results for "${searchQuery}"`
        };
      default:
        return {
          title: 'Movies',
          description: 'Browse movies'
        };
    }
  };

  // Reset and fetch when tab changes or filters change
  useEffect(() => {
    console.log(`🔄 Tab/Filter changed: ${activeTab}, genre: ${selectedGenre}, sort: ${sortBy}`);
    
    // Reset state
    setMovies([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalResults(0);
    setError(null);
    
    // Small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      fetchMovies(1);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [activeTab, selectedGenre, sortBy]); // Removed fetchMovies from dependencies

  // Fetch when search query changes (only for search tab)
  useEffect(() => {
    if (activeTab === 'search') {
      console.log(`🔍 Search query changed: "${debouncedSearchQuery}"`);
      
      setMovies([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResults(0);
      setError(null);
      
      if (debouncedSearchQuery.trim()) {
        // Small delay to prevent rapid successive calls
        const timeoutId = setTimeout(() => {
          fetchMovies(1);
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [debouncedSearchQuery, activeTab]); // Removed fetchMovies from dependencies

  const handleMovieSelect = (movie) => {
    navigate(`/admin/review/${movie.id}`);
  };

  const handleTabChange = (tabId) => {
    console.log(`🎯 Changing tab to: ${tabId}`);
    setActiveTab(tabId);
    setSearchQuery('');
    setSelectedGenre('');
  };

  const MovieCard = ({ movie }) => (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105"
      onClick={() => handleMovieSelect(movie)}
    >
      <div className="relative">
        <img
          src={apiService.buildImageUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-64 object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
          ⭐ {movie.vote_average?.toFixed(1) || 'N/A'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-purple-main line-clamp-2">
          {movie.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
        </p>
        <p className="text-gray-500 text-sm line-clamp-3">
          {movie.overview}
        </p>
      </div>
    </div>
  );

  const MovieListItem = ({ movie }) => (
    <div
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:bg-gray-50 flex"
      onClick={() => handleMovieSelect(movie)}
    >
      <img
        src={apiService.buildImageUrl(movie.poster_path, 'w154')}
        alt={movie.title}
        className="w-20 h-30 object-cover rounded mr-4"
        loading="lazy"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-purple-main mb-1">
          {movie.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'} • 
          ⭐ {movie.vote_average?.toFixed(1) || 'N/A'}
        </p>
        <p className="text-gray-500 text-sm line-clamp-2">
          {movie.overview}
        </p>
      </div>
    </div>
  );

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

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* Search Input */}
            {activeTab === 'search' && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search for movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black-main placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Genre Filter */}
            {activeTab === 'discover' && (
              <div className="flex-1">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black-main focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent"
                >
                  <option value="">Select a genre</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            {activeTab === 'discover' && (
              <div className="lg:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black-main focus:outline-none focus:ring-2 focus:ring-purple-main focus:border-transparent"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="popularity.asc">Least Popular</option>
                  <option value="vote_average.desc">Highest Rated</option>
                  <option value="vote_average.asc">Lowest Rated</option>
                  <option value="release_date.desc">Newest First</option>
                  <option value="release_date.asc">Oldest First</option>
                </select>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                className={`p-3 ${viewMode === 'grid' ? 'bg-purple-main text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button
                className={`p-3 ${viewMode === 'list' ? 'bg-purple-main text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-red-800 font-semibold mb-2">Error Loading Movies</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => fetchMovies(1)}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && movies.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
                <Search className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Movies Found</h3>
                <p className="text-gray-500">
                  {activeTab === 'search' 
                    ? 'Try searching with different keywords'
                    : activeTab === 'discover'
                    ? 'Please select a genre to discover movies'
                    : 'No movies available in this category'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Movies Grid/List */}
          {movies.length > 0 && (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                : 'space-y-4'
            }>
              {movies.map(movie => (
                viewMode === 'grid' 
                  ? <MovieCard key={movie.id} movie={movie} />
                  : <MovieListItem key={movie.id} movie={movie} />
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-main"></div>
                <span className="text-gray-600">Loading movies...</span>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="flex justify-center items-center space-x-2">
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
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="text-gray-400">...</span>}
                    </>
                  )}
                  
                  {/* Current page and neighbors */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          pageNum === currentPage
                            ? 'bg-purple-main text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
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
                {totalPages >= 7 && ['popular', 'now_playing', 'upcoming', 'top_rated'].includes(activeTab) && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block">
                    📊 Results limited to 7 pages for optimal performance
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieSelectionPage; 