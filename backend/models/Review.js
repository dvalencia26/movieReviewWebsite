import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  // Movie reference
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
    index: true
  },
  tmdbId: {
    type: Number,
    required: true,
    index: true
  },
  
  // Author information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Review content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 5;
      },
      message: 'Rating must be between 1 and 5'
    }
  },
  
  // Engagement metrics
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // Moderation
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  readTime: {
    type: Number,
    default: 0 // in minutes
  },
  
  // Comments count (for performance)
  commentCount: {
    type: Number,
    default: 0
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true
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
reviewSchema.index({ movieId: 1, createdAt: -1 });
reviewSchema.index({ author: 1, createdAt: -1 });
reviewSchema.index({ tmdbId: 1, isPublished: 1 });

// Critical indexes for homepage queries
reviewSchema.index({ movieId: 1, isPublished: 1, createdAt: -1 }); // For recently-reviewed
reviewSchema.index({ author: 1, movieId: 1, isPublished: 1 }); // For Billy's reviews lookup
reviewSchema.index({ rating: 1 });
reviewSchema.index({ likes: -1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for author name (populated)
reviewSchema.virtual('authorName').get(function() {
  return this.author?.username || 'Anonymous';
});

// Virtual for likes count display
reviewSchema.virtual('likesDisplay').get(function() {
  if (this.likes === 0) return 'No likes';
  if (this.likes === 1) return '1 like';
  return `${this.likes} likes`;
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  // Calculate word count
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    this.readTime = Math.ceil(this.wordCount / 200); // Average reading speed
  }
  
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
reviewSchema.methods.toggleLike = function(userId) {
  const userIndex = this.likedBy.indexOf(userId);
  
  if (userIndex === -1) {
    // User hasn't liked, add like
    this.likedBy.push(userId);
    this.likes += 1;
    return true; // liked
  } else {
    // User already liked, remove like
    this.likedBy.splice(userIndex, 1);
    this.likes -= 1;
    return false; // unliked
  }
};

reviewSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

reviewSchema.methods.incrementCommentCount = function() {
  this.commentCount += 1;
  return this.save();
};

reviewSchema.methods.decrementCommentCount = function() {
  this.commentCount = Math.max(0, this.commentCount - 1);
  return this.save();
};

// Static methods
reviewSchema.statics.findByTmdbId = function(tmdbId) {
  return this.find({ tmdbId, isPublished: true })
    .populate('author', 'username')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.findFeatured = function(limit = 5) {
  return this.find({ isFeatured: true, isPublished: true })
    .populate('author', 'username')
    .sort({ createdAt: -1 })
    .limit(limit);
};

reviewSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId, isPublished: true })
    .populate('author', 'username')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.getAverageRating = function(tmdbId) {
  return this.aggregate([
    { $match: { tmdbId, isPublished: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
};

reviewSchema.statics.getTopRated = function(limit = 10) {
  return this.find({ isPublished: true })
    .populate('author', 'username')
    .sort({ rating: -1, likes: -1 })
    .limit(limit);
};

// Post-save hook to update user stats
reviewSchema.post('save', async function(doc) {
  try {
    // Only update if the review is published or publication status changed
    if (doc.isPublished || doc.isModified('isPublished')) {
      const User = mongoose.model('User');
      await User.updateUserReviewStats(doc.author);
    }
  } catch (error) {
    console.error('Error updating user stats after review save:', error);
  }
});

// Post-remove hook to update user stats
reviewSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc && doc.author) {
      const User = mongoose.model('User');
      await User.updateUserReviewStats(doc.author);
    }
  } catch (error) {
    console.error('Error updating user stats after review deletion:', error);
  }
});

// Post-remove hook for deleteOne/deleteMany
reviewSchema.post('deleteOne', async function(doc) {
  try {
    if (doc && doc.author) {
      const User = mongoose.model('User');
      await User.updateUserReviewStats(doc.author);
    }
  } catch (error) {
    console.error('Error updating user stats after review deletion:', error);
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review; 