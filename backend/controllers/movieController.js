import Movie from "../models/Movie.js";
import Review from "../models/Review.js";
import Comment from "../models/Comment.js";
import tmdbService from "../services/tmdbService.js";
import cacheService from "../services/cacheService.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Ensure movie exists in our database (create from TMDB if needed)
export const ensureMovie = asyncHandler(async (req, res, next) => {
  try {
    const { tmdbId } = req.params;
    
    // Check cache first
    const cacheKey = `movie_${tmdbId}`;
    let movie = cacheService.getMovie(cacheKey);
    
    if (!movie) {
      // Try to find in database
      movie = await Movie.findByTmdbId(tmdbId);
      
      if (!movie) {
        console.log(`🎬 Movie not found in DB, fetching from TMDB: ${tmdbId}`);
        
        // Fetch from TMDB
        const tmdbData = await tmdbService.getMovieDetails(tmdbId);
        
        if (!tmdbData) {
          return res.status(404).json({ 
            error: 'Movie not found',
            message: 'Movie not found in TMDB database' 
          });
        }
        
        // Create movie from TMDB data
        movie = await Movie.findOrCreateFromTMDB(tmdbId, tmdbData);
      }
      
      // Cache the movie
      cacheService.setMovie(cacheKey, movie, 7200); // 2 hours
    }
    
    req.movie = movie;
    next();
  } catch (error) {
    console.error('Error in ensureMovie:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movie data',
      message: error.message 
    });
  }
});

// Get movie details with reviews
export const getMovieDetails = asyncHandler(async (req, res) => {
  try {
    let movie = req.movie;
    
    // Check if cast/crew data is missing and fetch from TMDB if needed
    const needsFreshData = !movie.cast || movie.cast.length === 0 || !movie.director || !movie.director.name;
    
    if (needsFreshData) {
      console.log(`🔄 Cast/crew data missing for ${movie.title}, fetching from TMDB...`);
      
      // Fetch fresh data from TMDB
      const tmdbData = await tmdbService.getMovieDetails(movie.tmdbId);
      
      if (tmdbData && tmdbData.credits) {
        console.log(`📥 Fresh TMDB data received:`, {
          title: tmdbData.title,
          hasCredits: !!tmdbData.credits,
          castCount: tmdbData.credits.cast ? tmdbData.credits.cast.length : 0,
          crewCount: tmdbData.credits.crew ? tmdbData.credits.crew.length : 0
        });
        
        // Update the movie with fresh cast/crew data
        movie.updateFromTMDB(tmdbData);
        await movie.save();
        
        // Clear cache to ensure fresh data is used
        cacheService.deleteMovie(`movie_${movie.tmdbId}`);
        
        console.log(`✅ Updated ${movie.title} with fresh cast/crew data`);
      }
    }
    
    // Get reviews for this movie
    const reviews = await Review.findByTmdbId(movie.tmdbId);
    
    // Update review stats if needed
    if (reviews.length !== movie.reviewCount) {
      await movie.updateReviewStats();
    }
    
    res.json({
      movie: {
        ...movie.toJSON(),
        reviews: reviews.slice(0, 5) // Only return first 5 reviews
      },
      reviewCount: reviews.length,
      hasMoreReviews: reviews.length > 5
    });
  } catch (error) {
    console.error('Error getting movie details:', error);
    res.status(500).json({ 
      error: 'Failed to get movie details',
      message: error.message 
    });
  }
});

// Create a new review (Admin only)
export const createReview = asyncHandler(async (req, res) => {
  try {
    const { title, content, rating } = req.body;
    const movie = req.movie;
    const author = req.user._id;
    
    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({
      movieId: movie._id,
      author: author
    });
    
    if (existingReview) {
      return res.status(400).json({
        error: 'Review already exists',
        message: 'You have already reviewed this movie'
      });
    }
    
    // Create the review
    const review = new Review({
      movieId: movie._id,
      tmdbId: movie.tmdbId,
      author,
      title,
      content,
      rating
    });
    
    await review.save();
    
    // Update movie review statistics
    await movie.updateReviewStats();
    
    // Clear cache
    cacheService.deleteMovie(`movie_${movie.tmdbId}`);
    cacheService.deleteReview(`reviews_${movie.tmdbId}`);
    
    // Populate author information
    await review.populate('author', 'username');
    
    console.log(`✅ Review created by ${req.user.username} for movie: ${movie.title}`);
    
    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      error: 'Failed to create review',
      message: error.message 
    });
  }
});

// Get all reviews for a movie
export const getMovieReviews = asyncHandler(async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Check cache first
    const cacheKey = `reviews_${tmdbId}_${page}_${limit}`;
    let cachedResult = cacheService.getReview(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // Get reviews from database
    const reviews = await Review.find({ tmdbId, isPublished: true })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalReviews = await Review.countDocuments({ tmdbId, isPublished: true });
    const totalPages = Math.ceil(totalReviews / limit);
    
    const result = {
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
    
    // Cache the result
    cacheService.setReview(cacheKey, result, 1800); // 30 minutes
    
    res.json(result);
  } catch (error) {
    console.error('Error getting movie reviews:', error);
    res.status(500).json({ 
      error: 'Failed to get reviews',
      message: error.message 
    });
  }
});

// Get a specific review with comments
export const getReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId)
      .populate('author', 'username');
    
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The requested review does not exist'
      });
    }
    
    // Get comments for this review
    const comments = await Comment.getCommentTree(reviewId);
    
    res.json({
      review,
      comments
    });
  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({ 
      error: 'Failed to get review',
      message: error.message 
    });
  }
});

// Update a review (Author or Admin only)
export const updateReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { title, content, rating } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The requested review does not exist'
      });
    }
    
    // Check if user can update this review
    if (!req.user.isAdmin && review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own reviews'
      });
    }
    
    // Update the review
    review.title = title || review.title;
    review.content = content || review.content;
    review.rating = rating || review.rating;
    
    await review.save();
    
    // Update movie review statistics
    const movie = await Movie.findById(review.movieId);
    await movie.updateReviewStats();
    
    // Clear cache
    cacheService.deleteReview(`reviews_${review.tmdbId}`);
    cacheService.deleteMovie(`movie_${review.tmdbId}`);
    
    await review.populate('author', 'username');
    
    console.log(`✏️ Review updated by ${req.user.username}: ${reviewId}`);
    
    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      error: 'Failed to update review',
      message: error.message 
    });
  }
});

// Delete a review (Author or Admin only)
export const deleteReview = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The requested review does not exist'
      });
    }
    
    // Check if user can delete this review
    if (!req.user.isAdmin && review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own reviews'
      });
    }
    
    // Delete associated comments
    await Comment.deleteMany({ reviewId: reviewId });
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);
    
    // Update movie review statistics
    const movie = await Movie.findById(review.movieId);
    await movie.updateReviewStats();
    
    // Clear cache
    cacheService.deleteReview(`reviews_${review.tmdbId}`);
    cacheService.deleteMovie(`movie_${review.tmdbId}`);
    
    console.log(`🗑️ Review deleted by ${req.user.username}: ${reviewId}`);
    
    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      error: 'Failed to delete review',
      message: error.message 
    });
  }
});

// Add a comment to a review
export const addComment = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, parentComment } = req.body;
    
    // Verify review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The requested review does not exist'
      });
    }
    
    // Create the comment
    const comment = new Comment({
      reviewId,
      author: req.user._id,
      content,
      parentComment: parentComment || null
    });
    
    await comment.save();
    
    // Update review comment count
    await review.incrementCommentCount();
    
    // Clear cache
    cacheService.deleteReview(`reviews_${review.tmdbId}`);
    
    // Populate author information
    await comment.populate('author', 'username');
    
    console.log(`💬 Comment added by ${req.user.username} to review: ${reviewId}`);
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      error: 'Failed to add comment',
      message: error.message 
    });
  }
});

// Get comments for a review
export const getReviewComments = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const comments = await Comment.getCommentTree(reviewId);
    
    res.json({
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error getting review comments:', error);
    res.status(500).json({ 
      error: 'Failed to get comments',
      message: error.message 
    });
  }
});

// Toggle like on a review
export const toggleReviewLike = asyncHandler(async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The requested review does not exist'
      });
    }
    
    const isLiked = review.toggleLike(userId);
    await review.save();
    
    // Clear cache
    cacheService.deleteReview(`reviews_${review.tmdbId}`);
    
    res.json({
      message: isLiked ? 'Review liked' : 'Review unliked',
      isLiked,
      totalLikes: review.likes
    });
  } catch (error) {
    console.error('Error toggling review like:', error);
    res.status(500).json({ 
      error: 'Failed to toggle like',
      message: error.message 
    });
  }
});

// Toggle like on a comment
export const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }
    
    const isLiked = comment.toggleLike(userId);
    await comment.save();
    
    res.json({
      message: isLiked ? 'Comment liked' : 'Comment unliked',
      isLiked,
      totalLikes: comment.likes
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ 
      error: 'Failed to toggle like',
      message: error.message 
    });
  }
});

// Get featured movies
export const getFeaturedMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const movies = await Movie.getFeatured(limit);
    
    res.json({
      movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error getting featured movies:', error);
    res.status(500).json({ 
      error: 'Failed to get featured movies',
      message: error.message 
    });
  }
});

// Get top rated movies
export const getTopRatedMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const movies = await Movie.getTopRated(limit);
    
    res.json({
      movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error getting top rated movies:', error);
    res.status(500).json({ 
      error: 'Failed to get top rated movies',
      message: error.message 
    });
  }
});

// Search movies in our database
export const searchMovies = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const movies = await Movie.searchMovies(q, limit);
    
    res.json({
      movies,
      total: movies.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ 
      error: 'Failed to search movies',
      message: error.message 
    });
  }
});

// Admin: Feature/unfeature a movie
export const toggleMovieFeature = asyncHandler(async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    const movie = await Movie.findByTmdbId(tmdbId);
    
    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }
    
    movie.isFeatured = !movie.isFeatured;
    await movie.save();
    
    // Clear cache
    cacheService.deleteMovie(`movie_${tmdbId}`);
    
    console.log(`🌟 Movie ${movie.isFeatured ? 'featured' : 'unfeatured'} by ${req.user.username}: ${movie.title}`);
    
    res.json({
      message: `Movie ${movie.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      movie
    });
  } catch (error) {
    console.error('Error toggling movie feature:', error);
    res.status(500).json({ 
      error: 'Failed to toggle movie feature',
      message: error.message 
    });
  }
});

// Get cache statistics
export const getCacheStats = asyncHandler(async (req, res) => {
  try {
    const stats = cacheService.getCacheStats();
    
    res.json({
      message: 'Cache statistics',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ 
      error: 'Failed to get cache stats',
      message: error.message 
    });
  }
});

// Clear cache (Admin only)
export const clearCache = asyncHandler(async (req, res) => {
  try {
    const { type } = req.params; // 'all', 'movies', 'reviews', 'tmdb'
    
    switch (type) {
      case 'all':
        cacheService.flushAll();
        break;
      case 'movies':
        cacheService.invalidatePattern('movie_');
        break;
      case 'reviews':
        cacheService.invalidatePattern('reviews_');
        break;
      case 'tmdb':
        tmdbService.clearCache();
        break;
      default:
        return res.status(400).json({
          error: 'Invalid cache type',
          message: 'Cache type must be one of: all, movies, reviews, tmdb'
        });
    }
    
    console.log(`🗑️ Cache cleared (${type}) by ${req.user.username}`);
    
    res.json({
      message: `Cache cleared successfully (${type})`
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

// Get all movies with reviews (for Movies page)
export const getMoviesWithReviews = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { search, genre, sortBy } = req.query;
    
    // Build query - only movies with reviews
    const query = {
      isActive: true,
      reviewCount: { $gt: 0 }
    };
    
    // Add search filter
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }
    
    // Add genre filter
    if (genre && genre.trim()) {
      query.genres = { $in: [genre.trim()] };
    }
    
    // Build sort criteria
    let sort = {};
    switch (sortBy) {
      case 'latest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1, reviewCount: -1 };
        break;
      case 'reviews':
        sort = { reviewCount: -1, averageRating: -1 };
        break;
      case 'title':
        sort = { title: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
    
    // If using text search, add text score sorting
    if (search && search.trim()) {
      sort = { score: { $meta: 'textScore' }, ...sort };
    }
    
    // Get movies with reviews
    const movies = await Movie.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('genre', 'name');
    
    // Get total count for pagination
    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);
    
    // Separate movies by type for frontend filtering
    const featuredMovies = movies.filter(movie => movie.isFeatured);
    const topRatedMovies = movies.filter(movie => movie.averageRating >= 4.0);
    const recentMovies = movies.filter(movie => {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return movie.createdAt >= oneMonthAgo;
    });
    
    res.json({
      movies,
      pagination: {
        currentPage: page,
        totalPages,
        totalMovies,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      categories: {
        featured: featuredMovies,
        topRated: topRatedMovies,
        recent: recentMovies
      },
      filters: {
        search,
        genre,
        sortBy
      }
    });
  } catch (error) {
    console.error('Error getting movies with reviews:', error);
    res.status(500).json({ 
      error: 'Failed to get movies with reviews',
      message: error.message 
    });
  }
});

// Legacy function for backward compatibility
export const createMovie = asyncHandler(async (req, res) => {
  try {
    const newMovie = new Movie(req.body);
    const savedMovie = await newMovie.save();
    res.json(savedMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin's favorite movies (for home page)
export const getAdminFavoriteMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Find admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    if (!adminUsers || adminUsers.length === 0) {
      return res.json({
        movies: [],
        total: 0,
        message: 'No admin users found'
      });
    }
    
    // Get all admin favorite movie IDs
    const adminFavoriteMovieIds = [];
    adminUsers.forEach(admin => {
      admin.favoritesReviewed.forEach(fav => {
        if (fav.movieId) {
          adminFavoriteMovieIds.push(fav.movieId);
        }
      });
    });
    
    if (adminFavoriteMovieIds.length === 0) {
      return res.json({
        movies: [],
        total: 0,
        message: 'No admin favorites found'
      });
    }
    
    // Get the movies with their review data
    const movies = await Movie.find({
      _id: { $in: adminFavoriteMovieIds },
      isActive: true
    })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(limit);
    
    // For each movie, get the admin reviews
    const moviesWithReviews = await Promise.all(
      movies.map(async (movie) => {
        // Get reviews for this movie by admin users
        const adminReviews = await Review.find({
          movieId: movie._id,
          isPublished: true,
          author: { $in: adminUsers.map(u => u._id) }
        })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(1); // Just get the first admin review
        
        return {
          ...movie.toJSON(),
          reviews: adminReviews
        };
      })
    );
    
    res.json({
      movies: moviesWithReviews,
      total: moviesWithReviews.length
    });
  } catch (error) {
    console.error('Error getting admin favorite movies:', error);
    res.status(500).json({ 
      error: 'Failed to get admin favorite movies',
      message: error.message 
    });
  }
});

// Get highest rated movies from database (for home page)
export const getHighestRatedMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const movies = await Movie.find({ 
      isActive: true, 
      reviewCount: { $gt: 0 },
      averageRating: { $gt: 0 }
    })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(limit);
    
    res.json({
      movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error getting highest rated movies:', error);
    res.status(500).json({ 
      error: 'Failed to get highest rated movies',
      message: error.message 
    });
  }
});

// Get recently reviewed movies (for home page)
export const getRecentlyReviewedMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Get recently reviewed movies by finding movies that have recent reviews
    const Review = (await import('../models/Review.js')).default;
    const recentReviews = await Review.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get more reviews to account for duplicates
      .populate('movieId');
    
    // Extract unique movies from recent reviews
    const seenMovieIds = new Set();
    const movies = [];
    
    for (const review of recentReviews) {
      if (review.movieId && !seenMovieIds.has(review.movieId._id.toString())) {
        seenMovieIds.add(review.movieId._id.toString());
        movies.push({
          ...review.movieId.toJSON(),
          latestReviewDate: review.createdAt
        });
        
        if (movies.length >= limit) break;
      }
    }
    
    res.json({
      movies,
      total: movies.length
    });
  } catch (error) {
    console.error('Error getting recently reviewed movies:', error);
    res.status(500).json({ 
      error: 'Failed to get recently reviewed movies',
      message: error.message 
    });
  }
});

// Get admin's watch later movies
export const getAdminWatchLaterMovies = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Find admin users
    const User = (await import('../models/User.js')).default;
    const adminUsers = await User.find({ isAdmin: true });
    
    if (!adminUsers || adminUsers.length === 0) {
      return res.json({
        movies: [],
        total: 0,
        message: 'No admin users found'
      });
    }
    
    // Get all admin watch later movies
    const adminWatchLaterMovies = [];
    adminUsers.forEach(admin => {
      admin.watchLater.forEach(watchMovie => {
        adminWatchLaterMovies.push({
          ...watchMovie.toJSON(),
          adminId: admin._id,
          adminUsername: admin.username
        });
      });
    });
    
    if (adminWatchLaterMovies.length === 0) {
      return res.json({
        movies: [],
        total: 0,
        message: 'No admin watch later movies found'
      });
    }
    
    // Sort by addedAt date (newest first) and limit
    const sortedMovies = adminWatchLaterMovies
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, limit);
    
    res.json({
      movies: sortedMovies,
      total: sortedMovies.length
    });
  } catch (error) {
    console.error('Error getting admin watch later movies:', error);
    res.status(500).json({ 
      error: 'Failed to get admin watch later movies',
      message: error.message 
    });
  }
});