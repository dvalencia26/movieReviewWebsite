import axios from 'axios';
import cacheService from './cacheService.js';

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = 'https://api.themoviedb.org/3';
    
    // Configuration for data limiting
    this.config = {
      maxPages: 7, // Limit pages to prevent overwhelming data
      popularMoviesDateRange: 2, // Years back from current year
      minVoteCount: 10, // Minimum votes for popular movies
      topRatedMinVotes: 200 // Minimum votes for top rated movies
    };
    
    // Validate API key
    if (!this.apiKey) {
      console.error('❌ TMDB_API_KEY is not set in environment variables');
      throw new Error('TMDB_API_KEY is required');
    }
    
    console.log(`🔑 TMDB API Key loaded: ${this.apiKey.substring(0, 8)}...`);
    
    // Rate limiting tracking
    this.requestQueue = [];
    this.maxRequests = 35; // Stay under 40/10s limit
    this.windowMs = 10000; // 10 seconds
    
    // Determine authentication method based on key length
    const isAccessToken = this.apiKey.length > 40;
    
    // Axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      ...(isAccessToken ? {
        // Use Bearer token for Access Tokens
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      } : {
        // Use query parameter for API Keys
        params: {
          api_key: this.apiKey
        }
      })
    });
    
    console.log(`🔐 Authentication method: ${isAccessToken ? 'Bearer Token' : 'API Key'}`);
    
    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ TMDB API Success: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ TMDB API Error: ${error.config?.url} - ${error.message}`);
        if (error.response?.data) {
          console.error('Error details:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  async makeRequest(endpoint, params = {}, customTTL = null) {
    // Generate cache key
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    // Check cache first
    const cached = cacheService.getTMDB(cacheKey);
    if (cached) {
      console.log(`💾 Cache hit for: ${cacheKey}`);
      return cached;
    }

    // Rate limiting check
    await this.checkRateLimit();

    try {
      const response = await this.client.get(endpoint, { params });
      const data = response.data;

      // Cache the response
      const ttl = customTTL || this.getTTL(endpoint);
      cacheService.setTMDB(cacheKey, data, ttl);
      
      console.log(`🌐 TMDB API call: ${endpoint} - Cached for ${ttl}s`);
      return data;

    } catch (error) {
      // Try to return stale cache on error
      const staleCache = cacheService.getTMDB(`${cacheKey}_stale`);
      if (staleCache) {
        console.log(`⚠️  API failed, returning stale cache: ${cacheKey}`);
        return staleCache;
      }

      // Enhanced error handling
      if (error.response) {
        const { status, data } = error.response;
        throw new Error(`TMDB API Error ${status}: ${data.status_message || error.message}`);
      } else if (error.request) {
        throw new Error('TMDB API request failed - no response received');
      } else {
        throw new Error(`TMDB API Error: ${error.message}`);
      }
    }
  }

  async checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old requests
    this.requestQueue = this.requestQueue.filter(timestamp => timestamp > windowStart);
    
    if (this.requestQueue.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requestQueue);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`🚦 Rate limit approaching, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestQueue.push(now);
  }

  generateCacheKey(endpoint, params) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `tmdb:${endpoint.replace(/\//g, '_')}:${paramString}`;
  }

  getTTL(endpoint) {
    const ttlMap = {
      '/movie/popular': 1800,        // 30 minutes
      '/movie/now_playing': 3600,    // 1 hour
      '/movie/upcoming': 3600,       // 1 hour
      '/movie/top_rated': 7200,      // 2 hours
      '/genre/movie/list': 86400,    // 24 hours
      '/search/movie': 1800,         // 30 minutes
      '/discover/movie': 3600,       // 1 hour
    };

    // Movie details endpoints
    if (endpoint.startsWith('/movie/') && endpoint.split('/').length === 3) {
      return 14400; // 4 hours for movie details
    }

    return ttlMap[endpoint] || 3600; // Default 1 hour
  }

  // Public API methods
  async getPopularMovies(page = 1) {
    // Limit to maximum pages to prevent overwhelming data
    const limitedPage = Math.min(page, this.config.maxPages);
    
    // Use discover endpoint with popularity sorting and recent date filter
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - this.config.popularMoviesDateRange;
    
    return this.makeRequest('/discover/movie', {
      page: limitedPage,
      sort_by: 'popularity.desc',
      'primary_release_date.gte': `${startYear}-01-01`,
      'primary_release_date.lte': `${currentYear}-12-31`,
      include_adult: false,
      include_video: false,
      'vote_count.gte': this.config.minVoteCount
    });
  }

  async getNowPlayingMovies(page = 1) {
    const limitedPage = Math.min(page, this.config.maxPages);
    
    return this.makeRequest('/movie/now_playing', { 
      page: limitedPage 
    });
  }

  async getUpcomingMovies(page = 1) {
    const limitedPage = Math.min(page, this.config.maxPages);
    
    return this.makeRequest('/movie/upcoming', { 
      page: limitedPage 
    });
  }

  async getTopRatedMovies(page = 1) {
    const limitedPage = Math.min(page, this.config.maxPages);
    
    // Use discover with better filtering for top rated
    return this.makeRequest('/discover/movie', {
      page: limitedPage,
      sort_by: 'vote_average.desc',
      'vote_count.gte': this.config.topRatedMinVotes,
      include_adult: false,
      include_video: false
    });
  }

  async getMovieGenres() {
    return this.makeRequest('/genre/movie/list', {}, 86400); // Cache for 24 hours
  }

  async discoverMovies(params = {}) {
    const { genre, page = 1, sortBy = 'popularity.desc', ...otherParams } = params;
    
    const discoverParams = {
      page,
      sort_by: sortBy,
      ...otherParams
    };

    if (genre) {
      discoverParams.with_genres = genre;
    }

    return this.makeRequest('/discover/movie', discoverParams);
  }

  async searchMovies(query, page = 1) {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return this.makeRequest('/search/movie', { 
      query: query.trim(), 
      page 
    });
  }

  async getMovieDetails(movieId) {
    return this.makeRequest(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,images,recommendations'
    });
  }

  async getMovieCredits(movieId) {
    return this.makeRequest(`/movie/${movieId}/credits`);
  }

  async getMovieVideos(movieId) {
    return this.makeRequest(`/movie/${movieId}/videos`);
  }

  // Utility methods
  getImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  formatMovieData(movie) {
    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      genres: movie.genres ? movie.genres.map(genre => genre.name || genre) : [],
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,
      runtime: movie.runtime,
      tagline: movie.tagline,
      adult: movie.adult
    };
  }

  // Cache management
  clearCache() {
    cacheService.invalidatePattern('tmdb:');
    console.log('🗑️  TMDB cache cleared');
  }

  getCacheStats() {
    return cacheService.getCacheStats().tmdb;
  }
}

// Singleton instance with lazy initialization
let tmdbServiceInstance = null;

const getTMDBService = () => {
  if (!tmdbServiceInstance) {
    tmdbServiceInstance = new TMDBService();
  }
  return tmdbServiceInstance;
};

// Export the getter function, but for convenience, also export the instance via a proxy
export default new Proxy({}, {
  get(target, prop) {
    return getTMDBService()[prop];
  }
}); 