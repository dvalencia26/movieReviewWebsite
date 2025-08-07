import express from "express";
import tmdbService from "../services/tmdbService.js";
import { tmdbRateLimit, searchRateLimit } from "../middlewares/rateLimiter.js";
import { validateSearch, validateGenre, validatePagination } from "../middlewares/validation.js";
import asyncHandler from "../middlewares/asyncHandler.js";

const router = express.Router();

// Get popular movies
router.get('/popular', 
  tmdbRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const batchSize = parseInt(req.query.batch_size) || 1;
      
      // Limit batch size to prevent abuse
      const safeBatchSize = Math.min(Math.max(batchSize, 1), 3);
      
      if (safeBatchSize === 1) {
        // Single page request
        const data = await tmdbService.getPopularMovies(page);
        res.json({
          ...data,
          source: 'tmdb',
          cached: false,
          batchSize: 1
        });
      } else {
        // Batch request - fetch multiple pages
        const promises = [];
        for (let i = 0; i < safeBatchSize; i++) {
          const currentPage = page + i;
          promises.push(tmdbService.getPopularMovies(currentPage));
        }
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        if (successfulResults.length === 0) {
          throw new Error('All batch requests failed');
        }
        
        // Combine results from multiple pages
        const combinedData = {
          page: page,
          results: successfulResults.flatMap(data => data.results || []),
          total_pages: successfulResults[0]?.total_pages || 1,
          total_results: successfulResults[0]?.total_results || 0,
          batchSize: safeBatchSize,
          source: 'tmdb',
          cached: false
        };
        
        res.json(combinedData);
      }
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({
        error: 'Failed to fetch popular movies',
        message: error.message
      });
    }
  })
);

// Get now playing movies
router.get('/now_playing',
  tmdbRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const batchSize = parseInt(req.query.batch_size) || 1;
      const safeBatchSize = Math.min(Math.max(batchSize, 1), 3);
      
      if (safeBatchSize === 1) {
        const data = await tmdbService.getNowPlayingMovies(page);
        res.json({
          ...data,
          source: 'tmdb',
          cached: false,
          batchSize: 1
        });
      } else {
        const promises = [];
        for (let i = 0; i < safeBatchSize; i++) {
          const currentPage = page + i;
          promises.push(tmdbService.getNowPlayingMovies(currentPage));
        }
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        if (successfulResults.length === 0) {
          throw new Error('All batch requests failed');
        }
        
        const combinedData = {
          page: page,
          results: successfulResults.flatMap(data => data.results || []),
          total_pages: successfulResults[0]?.total_pages || 1,
          total_results: successfulResults[0]?.total_results || 0,
          batchSize: safeBatchSize,
          source: 'tmdb',
          cached: false
        };
        
        res.json(combinedData);
      }
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      res.status(500).json({
        error: 'Failed to fetch now playing movies',
        message: error.message
      });
    }
  })
);

// Get upcoming movies
router.get('/upcoming',
  tmdbRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const batchSize = parseInt(req.query.batch_size) || 1;
      const safeBatchSize = Math.min(Math.max(batchSize, 1), 3);
      
      if (safeBatchSize === 1) {
        const data = await tmdbService.getUpcomingMovies(page);
        res.json({
          ...data,
          source: 'tmdb',
          cached: false,
          batchSize: 1
        });
      } else {
        const promises = [];
        for (let i = 0; i < safeBatchSize; i++) {
          const currentPage = page + i;
          promises.push(tmdbService.getUpcomingMovies(currentPage));
        }
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        if (successfulResults.length === 0) {
          throw new Error('All batch requests failed');
        }
        
        const combinedData = {
          page: page,
          results: successfulResults.flatMap(data => data.results || []),
          total_pages: successfulResults[0]?.total_pages || 1,
          total_results: successfulResults[0]?.total_results || 0,
          batchSize: safeBatchSize,
          source: 'tmdb',
          cached: false
        };
        
        res.json(combinedData);
      }
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      res.status(500).json({
        error: 'Failed to fetch upcoming movies',
        message: error.message
      });
    }
  })
);

// Get top rated movies
router.get('/top_rated',
  tmdbRateLimit,
  validatePagination,
  asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const batchSize = parseInt(req.query.batch_size) || 1;
      const safeBatchSize = Math.min(Math.max(batchSize, 1), 3);
      
      if (safeBatchSize === 1) {
        const data = await tmdbService.getTopRatedMovies(page);
        res.json({
          ...data,
          source: 'tmdb',
          cached: false,
          batchSize: 1
        });
      } else {
        const promises = [];
        for (let i = 0; i < safeBatchSize; i++) {
          const currentPage = page + i;
          promises.push(tmdbService.getTopRatedMovies(currentPage));
        }
        
        const results = await Promise.allSettled(promises);
        const successfulResults = results
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        if (successfulResults.length === 0) {
          throw new Error('All batch requests failed');
        }
        
        const combinedData = {
          page: page,
          results: successfulResults.flatMap(data => data.results || []),
          total_pages: successfulResults[0]?.total_pages || 1,
          total_results: successfulResults[0]?.total_results || 0,
          batchSize: safeBatchSize,
          source: 'tmdb',
          cached: false
        };
        
        res.json(combinedData);
      }
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      res.status(500).json({
        error: 'Failed to fetch top rated movies',
        message: error.message
      });
    }
  })
);

// Get movie genres
router.get('/genres',
  tmdbRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const data = await tmdbService.getMovieGenres();
      
      res.json({
        genres: data.genres,
        source: 'tmdb',
        cached: false
      });
    } catch (error) {
      console.error('Error fetching movie genres:', error);
      res.status(500).json({
        error: 'Failed to fetch movie genres',
        message: error.message
      });
    }
  })
);

// Discover movies by genre
router.get('/discover',
  tmdbRateLimit,
  validateGenre,
  asyncHandler(async (req, res) => {
    try {
      const {
        genre,
        sortBy = 'popularity.desc',
        page = 1,
        year,
        minRating,
        maxRating
      } = req.query;
      
      const params = {
        genre,
        sortBy,
        page,
        ...(year && { year }),
        ...(minRating && { 'vote_average.gte': minRating }),
        ...(maxRating && { 'vote_average.lte': maxRating })
      };
      
      const data = await tmdbService.discoverMovies(params);
      
      res.json({
        ...data,
        source: 'tmdb',
        cached: false,
        filters: { genre, sortBy, year, minRating, maxRating }
      });
    } catch (error) {
      console.error('Error discovering movies:', error);
      res.status(500).json({
        error: 'Failed to discover movies',
        message: error.message
      });
    }
  })
);

// Search movies
router.get('/search',
  searchRateLimit,
  validateSearch,
  asyncHandler(async (req, res) => {
    try {
      const { q, page = 1 } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({
          error: 'Invalid search query',
          message: 'Search query must be at least 2 characters'
        });
      }
      
      const data = await tmdbService.searchMovies(q, page);
      
      res.json({
        ...data,
        source: 'tmdb',
        cached: false,
        query: q
      });
    } catch (error) {
      console.error('Error searching movies:', error);
      res.status(500).json({
        error: 'Failed to search movies',
        message: error.message
      });
    }
  })
);

// Get movie details by TMDB ID
router.get('/:tmdbId',
  tmdbRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const { tmdbId } = req.params;
      
      // Validate TMDB ID
      const id = parseInt(tmdbId);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'Invalid TMDB ID',
          message: 'TMDB ID must be a positive integer'
        });
      }
      
      const data = await tmdbService.getMovieDetails(id);
      
      if (!data) {
        return res.status(404).json({
          error: 'Movie not found',
          message: 'Movie not found in TMDB database'
        });
      }
      
      // Format the response
      const formattedMovie = tmdbService.formatMovieData(data);
      
      res.json({
        movie: formattedMovie,
        source: 'tmdb',
        cached: false,
        raw: data // Include raw TMDB data for debugging
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
      res.status(500).json({
        error: 'Failed to fetch movie details',
        message: error.message
      });
    }
  })
);

// Get movie credits
router.get('/:tmdbId/credits',
  tmdbRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const { tmdbId } = req.params;
      const id = parseInt(tmdbId);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'Invalid TMDB ID',
          message: 'TMDB ID must be a positive integer'
        });
      }
      
      const data = await tmdbService.getMovieCredits(id);
      
      res.json({
        ...data,
        source: 'tmdb',
        cached: false
      });
    } catch (error) {
      console.error('Error fetching movie credits:', error);
      res.status(500).json({
        error: 'Failed to fetch movie credits',
        message: error.message
      });
    }
  })
);

// Get movie videos
router.get('/:tmdbId/videos',
  tmdbRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const { tmdbId } = req.params;
      const id = parseInt(tmdbId);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          error: 'Invalid TMDB ID',
          message: 'TMDB ID must be a positive integer'
        });
      }
      
      const data = await tmdbService.getMovieVideos(id);
      
      res.json({
        ...data,
        source: 'tmdb',
        cached: false
      });
    } catch (error) {
      console.error('Error fetching movie videos:', error);
      res.status(500).json({
        error: 'Failed to fetch movie videos',
        message: error.message
      });
    }
  })
);

// Get TMDB configuration (image URLs, etc.)
router.get('/config/images',
  tmdbRateLimit,
  asyncHandler(async (req, res) => {
    try {
      // Return static configuration that matches TMDB's image configuration
      const config = {
        images: {
          base_url: 'https://image.tmdb.org/t/p/',
          secure_base_url: 'https://image.tmdb.org/t/p/',
          backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
          logo_sizes: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
          poster_sizes: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
          profile_sizes: ['w45', 'w185', 'h632', 'original'],
          still_sizes: ['w92', 'w185', 'w300', 'original']
        }
      };
      
      res.json({
        ...config,
        source: 'tmdb',
        cached: true
      });
    } catch (error) {
      console.error('Error fetching TMDB configuration:', error);
      res.status(500).json({
        error: 'Failed to fetch TMDB configuration',
        message: error.message
      });
    }
  })
);

// Get cache statistics
router.get('/cache/stats',
  asyncHandler(async (req, res) => {
    try {
      const stats = tmdbService.getCacheStats();
      
      res.json({
        message: 'TMDB cache statistics',
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting TMDB cache stats:', error);
      res.status(500).json({
        error: 'Failed to get cache stats',
        message: error.message
      });
    }
  })
);

// Clear TMDB cache (Admin only - will be protected by auth middleware)
router.delete('/cache/clear',
  asyncHandler(async (req, res) => {
    try {
      tmdbService.clearCache();
      
      res.json({
        message: 'TMDB cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error clearing TMDB cache:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message
      });
    }
  })
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('TMDB route error:', error);
  
  if (error.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'TMDB service is currently unavailable'
    });
  }
  
  if (error.response?.status === 429) {
    return res.status(429).json({
      error: 'Rate Limited',
      message: 'Too many requests to TMDB API'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

export default router; 