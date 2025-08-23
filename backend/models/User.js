import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true,
    },
    
    // Favorites: Movies the user has reviewed and marked as favorite
    favoritesReviewed: [{
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
            required: false // Not required for regular users
        },
        reviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
            required: false // Not required for regular users
        },
        tmdbId: {
            type: Number,
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        // Store TMDB data for regular users who don't have reviews
        tmdbData: {
            title: String,
            posterPath: String,
            releaseDate: Date,
            overview: String,
            genres: [String],
            voteAverage: Number
        }
    }],
    
    // Watch Later: Movies from TMDB that user wants to watch
    watchLater: [{
        tmdbId: {
            type: Number,
            required: true
        },
        // Store essential TMDB data to avoid API calls
        title: {
            type: String,
            required: true
        },
        posterPath: String,
        releaseDate: Date,
        overview: String,
        genres: [String],
        voteAverage: Number,
        addedAt: {
            type: Date,
            default: Date.now
        },
        // Flag to indicate if movie is released
        isReleased: {
            type: Boolean,
            default: false
        }
    }],
    
    // User preferences and stats
    preferences: {
        favoriteGenres: [String],
        emailNotifications: {
            type: Boolean,
            default: true
        },
        publicProfile: {
            type: Boolean,
            default: true
        }
    },
    
    // User stats (for performance)
    stats: {
        totalReviews: {
            type: Number,
            default: 0
        },
        totalFavorites: {
            type: Number,
            default: 0
        },
        totalWatchLater: {
            type: Number,
            default: 0
        }
    }
}, 
{ timestamps: true }
);

// Indexes for performance
userSchema.index({ 'favoritesReviewed.tmdbId': 1 });
userSchema.index({ 'watchLater.tmdbId': 1 });

// Critical index for Billy lookup (case-insensitive)
userSchema.index({ username: 1 });

// Compound index for admin favorites lookup
userSchema.index({ 'favoritesReviewed.movieId': 1, username: 1 });
userSchema.index({ 'favoritesReviewed.addedAt': -1 });
userSchema.index({ 'watchLater.addedAt': -1 });

// Virtual for formatted join date
userSchema.virtual('formattedJoinDate').get(function() {
    return this.createdAt.toLocaleDateString();
});

// Instance methods for favorites management
userSchema.methods.addToFavorites = function(movieId, reviewId, tmdbId) {
    // Check if already favorited
    const existingFavorite = this.favoritesReviewed.find(
        fav => fav.tmdbId === tmdbId
    );
    
    if (existingFavorite) {
        throw new Error('Movie already in favorites');
    }
    
    this.favoritesReviewed.push({
        movieId,
        reviewId,
        tmdbId,
        addedAt: new Date()
    });
    
    this.stats.totalFavorites = this.favoritesReviewed.length;
    return this.save();
};

userSchema.methods.removeFromFavorites = function(tmdbId) {
    const initialLength = this.favoritesReviewed.length;
    this.favoritesReviewed = this.favoritesReviewed.filter(
        fav => fav.tmdbId !== tmdbId
    );
    
    if (this.favoritesReviewed.length === initialLength) {
        throw new Error('Movie not found in favorites');
    }
    
    this.stats.totalFavorites = this.favoritesReviewed.length;
    return this.save();
};

userSchema.methods.isFavorite = function(tmdbId) {
    return this.favoritesReviewed.some(fav => fav.tmdbId === tmdbId);
};

// Add to favorites from TMDB (for regular users)
userSchema.methods.addToFavoritesFromTMDB = function(tmdbMovieData) {
    // Check if already favorited
    const existingFavorite = this.favoritesReviewed.find(
        fav => fav.tmdbId === tmdbMovieData.tmdbId
    );
    
    if (existingFavorite) {
        throw new Error('Movie already in favorites');
    }
    
    // For regular users, we store TMDB data in the favorites array
    // We'll use null for movieId and reviewId since they don't have reviews
    this.favoritesReviewed.push({
        movieId: null, // No movie in our database
        reviewId: null, // No review exists
        tmdbId: tmdbMovieData.tmdbId,
        addedAt: new Date(),
        // Store TMDB data for regular users
        tmdbData: {
            title: tmdbMovieData.title,
            posterPath: tmdbMovieData.poster_path,
            releaseDate: tmdbMovieData.release_date ? new Date(tmdbMovieData.release_date) : null,
            overview: tmdbMovieData.overview,
            genres: tmdbMovieData.genres ? tmdbMovieData.genres.map(g => g.name) : [],
            voteAverage: tmdbMovieData.vote_average
        }
    });
    
    this.stats.totalFavorites = this.favoritesReviewed.length;
    return this.save();
};

// Instance methods for watch later management
userSchema.methods.addToWatchLater = function(tmdbMovieData) {
    // Check if already in watch later
    const existingWatch = this.watchLater.find(
        watch => watch.tmdbId === tmdbMovieData.tmdbId
    );
    
    if (existingWatch) {
        throw new Error('Movie already in watch later');
    }
    
    this.watchLater.push({
        tmdbId: tmdbMovieData.tmdbId,
        title: tmdbMovieData.title,
        posterPath: tmdbMovieData.poster_path,
        releaseDate: tmdbMovieData.release_date ? new Date(tmdbMovieData.release_date) : null,
        overview: tmdbMovieData.overview,
        genres: tmdbMovieData.genres ? tmdbMovieData.genres.map(g => g.name) : [],
        voteAverage: tmdbMovieData.vote_average,
        addedAt: new Date(),
        isReleased: tmdbMovieData.release_date ? new Date(tmdbMovieData.release_date) <= new Date() : false
    });
    
    this.stats.totalWatchLater = this.watchLater.length;
    return this.save();
};

userSchema.methods.removeFromWatchLater = function(tmdbId) {
    const initialLength = this.watchLater.length;
    this.watchLater = this.watchLater.filter(
        watch => watch.tmdbId !== tmdbId
    );
    
    if (this.watchLater.length === initialLength) {
        throw new Error('Movie not found in watch later');
    }
    
    this.stats.totalWatchLater = this.watchLater.length;
    return this.save();
};

userSchema.methods.isInWatchLater = function(tmdbId) {
    return this.watchLater.some(watch => watch.tmdbId === tmdbId);
};

// Update user review stats
userSchema.methods.updateReviewStats = async function() {
    try {
        // Import Review model to avoid circular dependency
        const Review = mongoose.model('Review');
        
        // Count published reviews by this user
        const reviewCount = await Review.countDocuments({ 
            author: this._id, 
            isPublished: true 
        });
        
        this.stats.totalReviews = reviewCount;
        return this.save();
    } catch (error) {
        console.error('Error updating user review stats:', error);
        throw error;
    }
};

// Pre-save middleware to update stats
userSchema.pre('save', function(next) {
    // Update stats counters
    this.stats.totalFavorites = this.favoritesReviewed.length;
    this.stats.totalWatchLater = this.watchLater.length;
    next();
});

// Static methods
userSchema.statics.getUserWithPreferences = function(userId) {
    return this.findById(userId)
        .populate('favoritesReviewed.movieId', 'title posterPath releaseDate')
        .populate('favoritesReviewed.reviewId', 'title rating createdAt');
};

// Static method to update review stats for a user
userSchema.statics.updateUserReviewStats = async function(userId) {
    try {
        const user = await this.findById(userId);
        if (user) {
            await user.updateReviewStats();
        }
    } catch (error) {
        console.error('Error updating user review stats:', error);
    }
};

const User = mongoose.model("User", userSchema);

export default User;