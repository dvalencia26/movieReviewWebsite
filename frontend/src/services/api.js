import axios from 'axios';

class APIService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? `${import.meta.env.VITE_API_URL || '/api/v1'}` 
        : '/api/v1', // Use environment variable for production, relative path for development
      timeout: 15000,
      withCredentials: true, // Required for cross-site cookies
    });

    // Request deduplication cache
    this.pendingRequests = new Map();

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log API calls in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.warn(`⏰ Rate limited. Retry after ${retryAfter} seconds`);
          
          // Show user-friendly message
          if (window.showToast) {
            window.showToast(`Too many requests. Please wait ${retryAfter} seconds.`, 'warning');
          }
        }
        
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ API Error:', error.response?.data || error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Request deduplication helper - Prevents duplicate API calls
  async makeRequest(requestKey, requestFn) {
    // Check if this request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Reusing pending request: ${requestKey}`);
      return this.pendingRequests.get(requestKey);
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Remove from pending requests when complete
      this.pendingRequests.delete(requestKey);
    });

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  }

  // Retry wrapper for failed requests
  async retryRequest(requestFn, maxRetries = 3, backoffFactor = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Only retry on network errors or 5xx errors
        if (error.response?.status >= 500 || !error.response) {
          const delay = backoffFactor * Math.pow(2, attempt - 1);
          console.warn(`⏳ Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  // TMDB API methods (proxied through backend)
  async getPopularMovies(page = 1) {
    const requestKey = `popular-${page}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/popular?page=${page}`))
    );
  }

  async getNowPlayingMovies(page = 1) {
    const requestKey = `now-playing-${page}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/now_playing?page=${page}`))
    );
  }

  async getUpcomingMovies(page = 1) {
    const requestKey = `upcoming-${page}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/upcoming?page=${page}`))
    );
  }

  async getTopRatedMovies(page = 1) {
    const requestKey = `top-rated-${page}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/top_rated?page=${page}`))
    );
  }

  async getMovieGenres() {
    const requestKey = 'genres';
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get('/tmdb/genres'))
    );
  }

  async discoverMovies(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const requestKey = `discover-${queryParams}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/discover?${queryParams}`))
    );
  }

  async searchMovies(query, page = 1) {
    if (!query || query.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    
    const requestKey = `search-${query}-${page}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/search?q=${encodeURIComponent(query)}&page=${page}`))
    );
  }

  async getMovieDetails(tmdbId) {
    const requestKey = `movie-details-${tmdbId}`;
    return this.makeRequest(requestKey, () => 
      this.retryRequest(() => this.client.get(`/tmdb/${tmdbId}`))
    );
  }

  async getMovieCredits(tmdbId) {
    return this.retryRequest(() => 
      this.client.get(`/tmdb/${tmdbId}/credits`)
    );
  }

  async getMovieVideos(tmdbId) {
    return this.retryRequest(() => 
      this.client.get(`/tmdb/${tmdbId}/videos`)
    );
  }

  // Movie management methods
  async getMovieFromDatabase(tmdbId) {
    return this.retryRequest(() => 
      this.client.get(`/movies/${tmdbId}`)
    );
  }

  async getFeaturedMovies(limit = 5) {
    return this.retryRequest(() => 
      this.client.get(`/movies/featured?limit=${limit}`)
    );
  }

  async getTopRatedMoviesFromDb(limit = 10) {
    return this.retryRequest(() => 
      this.client.get(`/movies/top-rated?limit=${limit}`)
    );
  }

  async searchMoviesInDatabase(query, limit = 20) {
    return this.retryRequest(() => 
      this.client.get(`/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    );
  }

  // Review methods
  async submitReview(tmdbId, reviewData) {
    return this.client.post(`/movies/${tmdbId}/reviews`, reviewData);
  }

  async getMovieReviews(tmdbId, page = 1, limit = 10) {
    return this.retryRequest(() => 
      this.client.get(`/movies/${tmdbId}/reviews?page=${page}&limit=${limit}`)
    );
  }

  async getReview(reviewId) {
    return this.retryRequest(() => 
      this.client.get(`/movies/reviews/${reviewId}`)
    );
  }

  async updateReview(reviewId, reviewData) {
    return this.client.put(`/movies/reviews/${reviewId}`, reviewData);
  }

  async deleteReview(reviewId) {
    return this.client.delete(`/movies/reviews/${reviewId}`);
  }

  async toggleReviewLike(reviewId) {
    return this.client.post(`/movies/reviews/${reviewId}/like`);
  }

  // Comment methods
  async addComment(reviewId, commentData) {
    return this.client.post(`/movies/reviews/${reviewId}/comments`, commentData);
  }

  async getReviewComments(reviewId, page = 1, limit = 20) {
    return this.retryRequest(() => 
      this.client.get(`/movies/reviews/${reviewId}/comments?page=${page}&limit=${limit}`)
    );
  }

  async toggleCommentLike(commentId) {
    return this.client.post(`/movies/comments/${commentId}/like`);
  }

  // New Like System Methods (using dedicated Like model)
  async toggleLike(contentType, contentId) {
    return this.client.post('/likes/toggle', { contentType, contentId });
  }

  async getLikeCount(contentType, contentId) {
    return this.retryRequest(() => 
      this.client.get(`/likes/count/${contentType}/${contentId}`)
    );
  }

  async checkUserLike(contentType, contentId) {
    return this.retryRequest(() => 
      this.client.get(`/likes/check/${contentType}/${contentId}`)
    );
  }

  async getLikesWithUsers(contentType, contentId, limit = 10) {
    return this.retryRequest(() => 
      this.client.get(`/likes/${contentType}/${contentId}/users?limit=${limit}`)
    );
  }

  async getLikeStats(contentType, contentId) {
    return this.retryRequest(() => 
      this.client.get(`/likes/stats/${contentType}/${contentId}`)
    );
  }

  async getUserRecentLikes(limit = 20) {
    return this.retryRequest(() => 
      this.client.get(`/likes/user/recent?limit=${limit}`)
    );
  }

  async batchCheckUserLikes(items) {
    return this.client.post('/likes/batch-check', { items });
  }

  // Admin methods
  async toggleMovieFeature(tmdbId) {
    return this.client.patch(`/movies/${tmdbId}/feature`);
  }

  async getCacheStats() {
    return this.retryRequest(() => 
      this.client.get('/movies/admin/cache/stats')
    );
  }

  async clearCache(type = 'all') {
    return this.client.delete(`/movies/admin/cache/${type}`);
  }

  // User methods
  async login(credentials) {
    return this.client.post('/users/auth', credentials);
  }

  async register(userData) {
    return this.client.post('/users', userData);
  }

  async logout() {
    return this.client.post('/users/logout');
  }

  async getUserProfile() {
    return this.client.get('/users/profile');
  }

  async updateUserProfile(userData) {
    return this.client.put('/users/profile', userData);
  }

  // User preferences methods
  async getUserFavorites() {
    return this.retryRequest(() => 
      this.client.get('/users/favorites')
    );
  }

  async addToFavorites(tmdbId) {
    return this.client.post(`/users/favorites/${tmdbId}`);
  }

  async removeFromFavorites(tmdbId) {
    return this.client.delete(`/users/favorites/${tmdbId}`);
  }

  async getUserWatchLater() {
    return this.retryRequest(() => 
      this.client.get('/users/watch-later')
    );
  }

  async addToWatchLater(tmdbId) {
    return this.client.post(`/users/watch-later/${tmdbId}`);
  }

  async removeFromWatchLater(tmdbId) {
    return this.client.delete(`/users/watch-later/${tmdbId}`);
  }

  async getMovieStatus(tmdbId) {
    return this.retryRequest(() => 
      this.client.get(`/users/movie-status/${tmdbId}`)
    );
  }

  async getUserStats() {
    return this.retryRequest(() => 
      this.client.get('/users/stats')
    );
  }

  // Utility methods
  buildImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  formatError(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  // Rate limit info
  getRateLimitInfo(response) {
    const headers = response.headers;
    return {
      limit: headers['x-ratelimit-limit'],
      remaining: headers['x-ratelimit-remaining'],
      reset: headers['x-ratelimit-reset']
    };
  }
}

// Create singleton instance
const apiService = new APIService();

// Export both the service and individual methods for convenience
export default apiService;

// Legacy exports for backward compatibility
export const searchMovies = (query, page = 1) => apiService.searchMovies(query, page);
export const getPopularMovies = (page = 1) => apiService.getPopularMovies(page);
export const getNowPlayingMovies = (page = 1) => apiService.getNowPlayingMovies(page);
export const getMovieDetails = (tmdbId) => apiService.getMovieDetails(tmdbId);
export const submitReview = (tmdbId, reviewData) => apiService.submitReview(tmdbId, reviewData);
export const getMovieReviews = (tmdbId, page = 1) => apiService.getMovieReviews(tmdbId, page);

// Error handling utility
export const handleApiError = (error) => {
  const message = apiService.formatError(error);
  console.error('API Error:', message);
  
  // Show toast notification if available
  if (window.showToast) {
    window.showToast(message, 'error');
  }
  
  return message;
};
