import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  // TMDB Integration
  tmdbId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic movie information
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  overview: {
    type: String,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  
  // Media
  posterPath: {
    type: String
  },
  backdropPath: {
    type: String
  },
  
  // Movie details
  releaseDate: {
    type: Date,
    index: true
  },
  runtime: {
    type: Number // in minutes
  },
  
  // Genre handling (both old and new)
  genre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Genre"
  },
  genres: [{
    type: String // TMDB genre names
  }],
  
  // Cast and crew
  cast: [{
    name: String,
    character: String,
    profilePath: String
  }],
  director: {
    name: String,
    profilePath: String
  },
  
  // TMDB ratings
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  
  // Our site's aggregated review data
  reviewCount: {
    type: Number,
    default: 0,
    index: true
  },
  averageRating: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Additional metadata
  adult: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  
  // Admin fields
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Cache timestamps
  tmdbLastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
movieSchema.index({ title: 'text', overview: 'text' });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ averageRating: -1 });
movieSchema.index({ reviewCount: -1 });
movieSchema.index({ popularity: -1 });
movieSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for formatted release date
movieSchema.virtual('formattedReleaseDate').get(function() {
  return this.releaseDate ? this.releaseDate.toLocaleDateString() : 'Unknown';
});

// Virtual for release year
movieSchema.virtual('releaseYear').get(function() {
  return this.releaseDate ? this.releaseDate.getFullYear() : null;
});

// Virtual for poster URL
movieSchema.virtual('posterUrl').get(function() {
  return this.posterPath ? `https://image.tmdb.org/t/p/w500${this.posterPath}` : null;
});

// Virtual for backdrop URL
movieSchema.virtual('backdropUrl').get(function() {
  return this.backdropPath ? `https://image.tmdb.org/t/p/w1280${this.backdropPath}` : null;
});

// Virtual for runtime display
movieSchema.virtual('runtimeDisplay').get(function() {
  if (!this.runtime) return 'Unknown';
  const hours = Math.floor(this.runtime / 60);
  const minutes = this.runtime % 60;
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
});

// Virtual for genre display
movieSchema.virtual('genreDisplay').get(function() {
  if (this.genres && this.genres.length > 0) {
    return this.genres.join(', ');
  }
  return 'Unknown';
});

// Virtual for review summary
movieSchema.virtual('reviewSummary').get(function() {
  if (this.reviewCount === 0) return 'No reviews yet';
  if (this.reviewCount === 1) return '1 review';
  return `${this.reviewCount} reviews`;
});

// Pre-save middleware
movieSchema.pre('save', function(next) {
  // Generate slug if title changed
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

// Instance methods
movieSchema.methods.updateFromTMDB = function(tmdbData) {
  this.title = tmdbData.title;
  this.overview = tmdbData.overview;
  this.tagline = tmdbData.tagline;
  this.posterPath = tmdbData.poster_path;
  this.backdropPath = tmdbData.backdrop_path;
  this.releaseDate = tmdbData.release_date ? new Date(tmdbData.release_date) : null;
  this.runtime = tmdbData.runtime;
  this.genres = tmdbData.genres ? tmdbData.genres.map(g => g.name) : [];
  this.voteAverage = tmdbData.vote_average;
  this.voteCount = tmdbData.vote_count;
  this.popularity = tmdbData.popularity;
  this.adult = tmdbData.adult;
  this.originalLanguage = tmdbData.original_language;
  this.tmdbLastUpdated = new Date();
  
  // Update cast if available
  if (tmdbData.credits && tmdbData.credits.cast) {
    this.cast = tmdbData.credits.cast.slice(0, 10).map(actor => ({
      name: actor.name,
      character: actor.character,
      profilePath: actor.profile_path
    }));
  }
  
  // Update director if available
  if (tmdbData.credits && tmdbData.credits.crew) {
    const director = tmdbData.credits.crew.find(person => person.job === 'Director');
    if (director) {
      this.director = {
        name: director.name,
        profilePath: director.profile_path
      };
    }
  }
  
  return this;
};

movieSchema.methods.updateReviewStats = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { movieId: this._id, isPublished: true } },
    { 
      $group: { 
        _id: null, 
        averageRating: { $avg: '$rating' }, 
        count: { $sum: 1 } 
      } 
    }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    this.reviewCount = stats[0].count;
  } else {
    this.averageRating = 0;
    this.reviewCount = 0;
  }
  
  return this.save();
};

movieSchema.methods.needsTMDBUpdate = function() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.tmdbLastUpdated < oneWeekAgo;
};

// Static methods
movieSchema.statics.findByTmdbId = function(tmdbId) {
  return this.findOne({ tmdbId, isActive: true });
};

movieSchema.statics.findOrCreateFromTMDB = async function(tmdbId, tmdbData) {
  let movie = await this.findByTmdbId(tmdbId);
  
  if (!movie) {
    movie = new this({ tmdbId });
    movie.updateFromTMDB(tmdbData);
    await movie.save();
    console.log(`📽️  Created new movie: ${movie.title} (TMDB ID: ${tmdbId})`);
  } else if (movie.needsTMDBUpdate()) {
    movie.updateFromTMDB(tmdbData);
    await movie.save();
    console.log(`🔄 Updated movie: ${movie.title} (TMDB ID: ${tmdbId})`);
  }
  
  return movie;
};

movieSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

movieSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ isActive: true, reviewCount: { $gt: 0 } })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(limit);
};

movieSchema.statics.getMostReviewed = function(limit = 10) {
  return this.find({ isActive: true, reviewCount: { $gt: 0 } })
    .sort({ reviewCount: -1, averageRating: -1 })
    .limit(limit);
};

movieSchema.statics.getRecentlyAdded = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

movieSchema.statics.searchMovies = function(query, limit = 20) {
  return this.find(
    { 
      $text: { $search: query },
      isActive: true 
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

const Movie = mongoose.model("Movie", movieSchema);
export default Movie;