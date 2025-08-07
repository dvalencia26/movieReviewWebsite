import express from "express";
import { 
  ensureMovie,
  getMovieDetails,
  createReview,
  getMovieReviews,
  getReview,
  updateReview,
  deleteReview,
  addComment,
  getReviewComments,
  toggleReviewLike,
  toggleCommentLike,
  getFeaturedMovies,
  getTopRatedMovies,
  getMoviesWithReviews,
  searchMovies,
  toggleMovieFeature,
  getCacheStats,
  clearCache,
  createMovie,
  getAdminFavoriteMovies,
  getHighestRatedMovies,
  getRecentlyReviewedMovies
} from "../controllers/movieController.js";

// Middleware imports
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { 
  validateMovieId,
  validateReview,
  validateComment,
  validateReviewId,
  validateCommentId,
  validateSearch,
  validatePagination
} from "../middlewares/validation.js";
import { 
  generalRateLimit,
  reviewRateLimit,
  commentRateLimit,
  searchRateLimit,
  likeRateLimit,
  adminRateLimit
} from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public Routes (no authentication required)

// Get all movies with reviews (for Movies page)
router.get('/with-reviews',
  generalRateLimit,
  validatePagination,
  getMoviesWithReviews
);

// Get featured movies
router.get('/featured',
  generalRateLimit,
  validatePagination,
  getFeaturedMovies
);

// Get top rated movies
router.get('/top-rated',
  generalRateLimit,
  validatePagination,
  getTopRatedMovies
);

// Search movies in our database
router.get('/search',
  searchRateLimit,
  validateSearch,
  searchMovies
);

// Get recently reviewed movies (for home page)
router.get('/recently-reviewed',
  generalRateLimit,
  getRecentlyReviewedMovies
);

// Get admin's favorite movies (for home page)
router.get('/admin-favorites',
  generalRateLimit,
  getAdminFavoriteMovies
);

// Get highest rated movies from database (for home page)
router.get('/highest-rated',
  generalRateLimit,
  getHighestRatedMovies
);

// Get movie details by TMDB ID (creates movie if not exists)
router.get('/:tmdbId',
  generalRateLimit,
  validateMovieId,
  ensureMovie,
  getMovieDetails
);

// Get all reviews for a movie
router.get('/:tmdbId/reviews',
  generalRateLimit,
  validateMovieId,
  validatePagination,
  getMovieReviews
);

// Get specific review with comments
router.get('/reviews/:reviewId',
  generalRateLimit,
  validateReviewId,
  getReview
);

// Get comments for a review
router.get('/reviews/:reviewId/comments',
  generalRateLimit,
  validateReviewId,
  validatePagination,
  getReviewComments
);

// Protected Routes (authentication required)

// Create a review for a movie (Admin only)
router.post('/:tmdbId/reviews',
  authenticate,
  authorizeAdmin,
  reviewRateLimit,
  validateMovieId,
  validateReview,
  ensureMovie,
  createReview
);

// Update a review (Author or Admin only)
router.put('/reviews/:reviewId',
  authenticate,
  generalRateLimit,
  validateReviewId,
  validateReview,
  updateReview
);

// Delete a review (Author or Admin only)
router.delete('/reviews/:reviewId',
  authenticate,
  generalRateLimit,
  validateReviewId,
  deleteReview
);

// Add a comment to a review (Authenticated users)
router.post('/reviews/:reviewId/comments',
  authenticate,
  commentRateLimit,
  validateReviewId,
  validateComment,
  addComment
);

// Like/Unlike a review (Authenticated users)
router.post('/reviews/:reviewId/like',
  authenticate,
  likeRateLimit,
  validateReviewId,
  toggleReviewLike
);

// Like/Unlike a comment (Authenticated users)
router.post('/comments/:commentId/like',
  authenticate,
  likeRateLimit,
  validateCommentId,
  toggleCommentLike
);

// Admin Routes (admin authentication required)

// Feature/Unfeature a movie (Admin only)
router.patch('/:tmdbId/feature',
  authenticate,
  authorizeAdmin,
  adminRateLimit,
  validateMovieId,
  toggleMovieFeature
);

// Cache management routes (Admin only)
router.get('/admin/cache/stats',
  authenticate,
  authorizeAdmin,
  getCacheStats
);

router.delete('/admin/cache/:type',
  authenticate,
  authorizeAdmin,
  clearCache
);

// Legacy route for backward compatibility (Admin only)
router.post('/create-movie',
  authenticate,
  authorizeAdmin,
  adminRateLimit,
  createMovie
);

// Error handling middleware specific to movie routes
router.use((error, req, res, next) => {
  console.error('Movie route error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.errors
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Generic error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong processing your request'
  });
});

export default router;