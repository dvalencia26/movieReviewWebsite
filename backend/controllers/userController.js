import User from "../models/User.js";
import bcrypt from "bcryptjs";
import asyncHandler from "../middlewares/asyncHandler.js";
import createToken from "../utils/createToken.js";

const createUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists and all fields are filled
    if (!username || !email || !password) {
        throw new Error("All fields are required");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400).send("User already exists");
        return;
    }
    
    // Hash user password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({username, email, password: hashedPassword});

    try {
        await newUser.save();
        createToken(res, newUser._id);

        // Send response
        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
        });

    } catch (error) {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// Delete user function
const deleteUser = asyncHandler(async (req, res) => {
    const { email } = req.body; // or req.params.email if using URL params

    if (!email) {
        res.status(400);
        throw new Error("Email is required");
    }

    const user = await User.findOne({ email });
    
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    await User.deleteOne({ email });
    res.status(200).json({ message: "User deleted successfully" });
});

// Get all users function only for admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.status(200).json(users);
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (isPasswordCorrect) {
            createToken(res, existingUser._id);

            res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
            });
        } else {
            res.status(401).json({ message: "Invalid password" });
        }
    } else {
        res.status(401).json({ message: "User not found" });
    }
});

const logoutCurrentUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '',{
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user){
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
        });
    } else {
        res.status(404);
        throw new Error("User not found.");
    }
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found.");
    }

    // Check if email is being updated and if it already exists for another user
    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ 
            email: req.body.email, 
            _id: { $ne: req.user._id } 
        });
        if (emailExists) {
            res.status(400);
            throw new Error("Email already exists for another user");
        }
    }

    // Check if username is being updated and if it already exists for another user
    if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ 
            username: req.body.username, 
            _id: { $ne: req.user._id } 
        });
        if (usernameExists) {
            res.status(400);
            throw new Error("Username already exists for another user");
        }
    }

    // Update user fields
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        user.password = hashedPassword;
    }

    try {
        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(400);
        throw new Error(`Failed to update user: ${error.message}`);
    }
});

// Add to favorites (only movies the user has reviewed)
const addToFavorites = asyncHandler(async (req, res) => {
    const { tmdbId } = req.params;
    const userId = req.user._id;
    
    try {
        // Validate tmdbId
        const parsedTmdbId = parseInt(tmdbId);
        if (isNaN(parsedTmdbId) || parsedTmdbId <= 0) {
            return res.status(400).json({
                error: 'Invalid movie ID',
                message: 'Movie ID must be a valid positive number'
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Different logic for admin vs regular users
        if (user.isAdmin) {
            // Admin can only favorite movies they've reviewed
            const Review = (await import('../models/Review.js')).default;
            const Movie = (await import('../models/Movie.js')).default;
            
            const review = await Review.findOne({
                author: userId,
                tmdbId: parsedTmdbId,
                isPublished: true
            });
            
            if (!review) {
                return res.status(400).json({
                    error: 'Review required',
                    message: 'As an admin, you can only favorite movies you have reviewed'
                });
            }
            
            // Get the movie from database
            const movie = await Movie.findById(review.movieId);
            if (!movie) {
                return res.status(404).json({
                    error: 'Movie not found',
                    message: 'Movie not found in database'
                });
            }
            
            // Add to favorites with review reference
            await user.addToFavorites(movie._id, review._id, parsedTmdbId);
            
            res.json({
                message: 'Movie added to favorites',
                movie: {
                    tmdbId: parsedTmdbId,
                    title: movie.title,
                    posterPath: movie.posterPath
                }
            });
        } else {
            // Regular users can favorite any movie (from TMDB)
            // Validate tmdbId
            const parsedTmdbId = parseInt(tmdbId);
            if (isNaN(parsedTmdbId) || parsedTmdbId <= 0) {
                return res.status(400).json({
                    error: 'Invalid movie ID',
                    message: 'Movie ID must be a valid positive number'
                });
            }
            
            // Check if already in favorites before making TMDB API call
            if (user.isFavorite(parsedTmdbId)) {
                return res.status(400).json({
                    error: 'Already favorited',
                    message: 'Movie already in favorites'
                });
            }
            
            const tmdbService = (await import('../services/tmdbService.js')).default;
            const tmdbMovieData = await tmdbService.getMovieDetails(tmdbId);
            
            if (!tmdbMovieData) {
                return res.status(404).json({
                    error: 'Movie not found',
                    message: 'Movie not found in TMDB database'
                });
            }
            
            // Validate required TMDB data
            if (!tmdbMovieData.title) {
                return res.status(400).json({
                    error: 'Invalid movie data',
                    message: 'Movie data from TMDB is incomplete'
                });
            }
            
            // For regular users, we'll store TMDB data in favorites
            // We need to modify the User model method to handle this case
            await user.addToFavoritesFromTMDB({
                tmdbId: parsedTmdbId,
                title: tmdbMovieData.title,
                poster_path: tmdbMovieData.poster_path || null,
                release_date: tmdbMovieData.release_date || null,
                overview: tmdbMovieData.overview || null,
                genres: tmdbMovieData.genres || [],
                vote_average: tmdbMovieData.vote_average || 0
            });
            
            res.json({
                message: 'Movie added to favorites',
                movie: {
                    tmdbId: parsedTmdbId,
                    title: tmdbMovieData.title,
                    posterPath: tmdbMovieData.poster_path
                }
            });
        }
        
    } catch (error) {
        console.error('Error adding to favorites:', error);
        
        if (error.message === 'Movie already in favorites') {
            return res.status(400).json({
                error: 'Already favorited',
                message: error.message
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: error.message
            });
        }
        
        res.status(500).json({
            error: 'Failed to add to favorites',
            message: error.message
        });
    }
});

// Remove from favorites
const removeFromFavorites = asyncHandler(async (req, res) => {
    const { tmdbId } = req.params;
    const userId = req.user._id;
    
    try {
        // Validate tmdbId
        const parsedTmdbId = parseInt(tmdbId);
        if (isNaN(parsedTmdbId) || parsedTmdbId <= 0) {
            return res.status(400).json({
                error: 'Invalid movie ID',
                message: 'Movie ID must be a valid positive number'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        await user.removeFromFavorites(parsedTmdbId);
        
        res.json({
            message: 'Movie removed from favorites'
        });
        
    } catch (error) {
        if (error.message === 'Movie not found in favorites') {
            return res.status(404).json({
                error: 'Not found',
                message: error.message
            });
        }
        
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            error: 'Failed to remove from favorites',
            message: error.message
        });
    }
});

// Add to watch later
const addToWatchLater = asyncHandler(async (req, res) => {
    const { tmdbId } = req.params;
    const userId = req.user._id;
    
    try {
        // Validate tmdbId
        const parsedTmdbId = parseInt(tmdbId);
        if (isNaN(parsedTmdbId) || parsedTmdbId <= 0) {
            return res.status(400).json({
                error: 'Invalid movie ID',
                message: 'Movie ID must be a valid positive number'
            });
        }
        
        // Get user first to check if already in watch later
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Check if already in watch later before making TMDB API call
        if (user.isInWatchLater(parsedTmdbId)) {
            return res.status(400).json({
                error: 'Already in watch later',
                message: 'Movie already in watch later'
            });
        }
        
        // Get movie data from TMDB
        const tmdbService = (await import('../services/tmdbService.js')).default;
        const tmdbMovieData = await tmdbService.getMovieDetails(tmdbId);
        
        if (!tmdbMovieData) {
            return res.status(404).json({
                error: 'Movie not found',
                message: 'Movie not found in TMDB database'
            });
        }
        
        // Validate required TMDB data
        if (!tmdbMovieData.title) {
            return res.status(400).json({
                error: 'Invalid movie data',
                message: 'Movie data from TMDB is incomplete'
            });
        }
        
        // Add to watch later with validated data
        await user.addToWatchLater({
            tmdbId: parsedTmdbId,
            title: tmdbMovieData.title,
            poster_path: tmdbMovieData.poster_path || null,
            release_date: tmdbMovieData.release_date || null,
            overview: tmdbMovieData.overview || null,
            genres: tmdbMovieData.genres || [],
            vote_average: tmdbMovieData.vote_average || 0
        });
        
        res.json({
            message: 'Movie added to watch later',
            movie: {
                tmdbId: parsedTmdbId,
                title: tmdbMovieData.title,
                posterPath: tmdbMovieData.poster_path,
                releaseDate: tmdbMovieData.release_date
            }
        });
        
    } catch (error) {
        console.error('Error adding to watch later:', error);
        
        // Handle specific error cases
        if (error.message === 'Movie already in watch later') {
            return res.status(400).json({
                error: 'Already in watch later',
                message: error.message
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: error.message
            });
        }
        
        // Handle general errors
        res.status(500).json({
            error: 'Failed to add to watch later',
            message: error.message
        });
    }
});

// Remove from watch later
const removeFromWatchLater = asyncHandler(async (req, res) => {
    const { tmdbId } = req.params;
    const userId = req.user._id;
    
    try {
        // Validate tmdbId
        const parsedTmdbId = parseInt(tmdbId);
        if (isNaN(parsedTmdbId) || parsedTmdbId <= 0) {
            return res.status(400).json({
                error: 'Invalid movie ID',
                message: 'Movie ID must be a valid positive number'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        await user.removeFromWatchLater(parsedTmdbId);
        
        res.json({
            message: 'Movie removed from watch later'
        });
        
    } catch (error) {
        if (error.message === 'Movie not found in watch later') {
            return res.status(404).json({
                error: 'Not found',
                message: error.message
            });
        }
        
        console.error('Error removing from watch later:', error);
        res.status(500).json({
            error: 'Failed to remove from watch later',
            message: error.message
        });
    }
});

// Get user's favorites
const getUserFavorites = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const user = await User.findById(userId)
            .populate('favoritesReviewed.movieId', 'title posterPath releaseDate averageRating')
            .populate('favoritesReviewed.reviewId', 'title rating createdAt');
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Format favorites based on whether user is admin or regular user
        const favorites = user.favoritesReviewed.map(fav => {
            if (fav.movieId && fav.reviewId) {
                // Admin user with review
                return {
                    tmdbId: fav.tmdbId,
                    movie: fav.movieId,
                    review: fav.reviewId,
                    addedAt: fav.addedAt,
                    source: 'review' // Indicates this is from a review
                };
            } else {
                // Regular user from TMDB
                return {
                    tmdbId: fav.tmdbId,
                    movie: {
                        title: fav.tmdbData?.title || 'Unknown',
                        posterPath: fav.tmdbData?.posterPath || null,
                        releaseDate: fav.tmdbData?.releaseDate || null,
                        overview: fav.tmdbData?.overview || null,
                        genres: fav.tmdbData?.genres || [],
                        voteAverage: fav.tmdbData?.voteAverage || null
                    },
                    review: null,
                    addedAt: fav.addedAt,
                    source: 'tmdb' // Indicates this is from TMDB
                };
            }
        });
        
        res.json({
            favorites,
            totalFavorites: user.stats.totalFavorites
        });
        
    } catch (error) {
        console.error('Error getting user favorites:', error);
        res.status(500).json({
            error: 'Failed to get favorites',
            message: error.message
        });
    }
});

// Get user's watch later
const getUserWatchLater = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Sort by addedAt date (newest first)
        const watchLater = user.watchLater
            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
            .map(watch => ({
                tmdbId: watch.tmdbId,
                title: watch.title,
                posterPath: watch.posterPath,
                releaseDate: watch.releaseDate,
                overview: watch.overview,
                genres: watch.genres,
                voteAverage: watch.voteAverage,
                addedAt: watch.addedAt,
                isReleased: watch.isReleased
            }));
        
        res.json({
            watchLater,
            totalWatchLater: user.stats.totalWatchLater
        });
        
    } catch (error) {
        console.error('Error getting user watch later:', error);
        res.status(500).json({
            error: 'Failed to get watch later',
            message: error.message
        });
    }
});

// Check if movie is favorited or in watch later
const getMovieStatus = asyncHandler(async (req, res) => {
    const { tmdbId } = req.params;
    const userId = req.user._id;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        const isFavorite = user.isFavorite(parseInt(tmdbId));
        const isInWatchLater = user.isInWatchLater(parseInt(tmdbId));
        
        res.json({
            tmdbId: parseInt(tmdbId),
            isFavorite,
            isInWatchLater
        });
        
    } catch (error) {
        console.error('Error checking movie status:', error);
        res.status(500).json({
            error: 'Failed to check movie status',
            message: error.message
        });
    }
});

// Get user stats
const getUserStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User not found'
            });
        }
        
        // Update review stats to ensure accuracy
        await user.updateReviewStats();
        
        res.json({
            stats: {
                totalReviews: user.stats.totalReviews,
                totalFavorites: user.stats.totalFavorites,
                totalWatchLater: user.stats.totalWatchLater
            },
            preferences: user.preferences,
            joinDate: user.createdAt,
            lastActivity: user.updatedAt
        });
        
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            error: 'Failed to get user stats',
            message: error.message
        });
    }
});

export { 
    createUser, 
    deleteUser, 
    getAllUsers, 
    loginUser, 
    logoutCurrentUser, 
    getCurrentUserProfile, 
    updateCurrentUserProfile,
    addToFavorites,
    removeFromFavorites,
    addToWatchLater,
    removeFromWatchLater,
    getUserFavorites,
    getUserWatchLater,
    getMovieStatus,
    getUserStats
};