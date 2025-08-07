import NodeCache from 'node-cache';

class CacheService {
  constructor() {
    // Different cache instances for different data types
    this.tmdbCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour default
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false // Better performance for read-heavy operations
    });
    
    this.movieCache = new NodeCache({
      stdTTL: 7200, // 2 hours for movie data
      checkperiod: 600,
      useClones: false
    });
    
    this.reviewCache = new NodeCache({
      stdTTL: 1800, // 30 minutes for reviews
      checkperiod: 300,
      useClones: false
    });
  }

  // TMDB cache methods
  getTMDB(key) {
    return this.tmdbCache.get(key);
  }

  setTMDB(key, data, ttl = 3600) {
    return this.tmdbCache.set(key, data, ttl);
  }

  deleteTMDB(key) {
    return this.tmdbCache.del(key);
  }

  // Movie cache methods
  getMovie(key) {
    return this.movieCache.get(key);
  }

  setMovie(key, data, ttl = 7200) {
    return this.movieCache.set(key, data, ttl);
  }

  deleteMovie(key) {
    return this.movieCache.del(key);
  }

  // Review cache methods
  getReview(key) {
    return this.reviewCache.get(key);
  }

  setReview(key, data, ttl = 1800) {
    return this.reviewCache.set(key, data, ttl);
  }

  deleteReview(key) {
    return this.reviewCache.del(key);
  }

  // Utility methods
  invalidatePattern(pattern) {
    // NodeCache doesn't support pattern deletion, so we'll track keys
    const caches = [this.tmdbCache, this.movieCache, this.reviewCache];
    
    caches.forEach(cache => {
      const keys = cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      if (matchingKeys.length > 0) {
        cache.del(matchingKeys);
      }
    });
  }

  getCacheStats() {
    return {
      tmdb: this.tmdbCache.getStats(),
      movie: this.movieCache.getStats(),
      review: this.reviewCache.getStats()
    };
  }

  flushAll() {
    this.tmdbCache.flushAll();
    this.movieCache.flushAll();
    this.reviewCache.flushAll();
  }
}

// Singleton instance
const cacheService = new CacheService();
export default cacheService; 