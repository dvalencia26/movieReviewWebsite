import mongoose from 'mongoose';

/**
 * Like Schema
 * Tracks likes on reviews and comments
 */
const likeSchema = new mongoose.Schema({
  // User who liked the content
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // What type of content is being liked
  contentType: {
    type: String,
    required: true,
    enum: ['Review', 'Comment'],
    index: true
  },
  
  // Reference to the liked content (Review or Comment)
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType',
    index: true
  },
  
  // When the like was created
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'likes'
});

// Compound index to ensure one user can only like a specific piece of content once
likeSchema.index({ user: 1, contentType: 1, contentId: 1 }, { unique: true });

// Index for efficient queries
likeSchema.index({ contentType: 1, contentId: 1 });
likeSchema.index({ user: 1, createdAt: -1 });

// Virtual to populate the actual content
likeSchema.virtual('content', {
  ref: function() {
    return this.contentType;
  },
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

// Static method to get like count for content
likeSchema.statics.getLikeCount = async function(contentType, contentId) {
  try {
    const count = await this.countDocuments({ contentType, contentId });
    return count;
  } catch (error) {
    throw new Error(`Error getting like count: ${error.message}`);
  }
};

// Static method to check if user liked content
likeSchema.statics.hasUserLiked = async function(userId, contentType, contentId) {
  try {
    const like = await this.findOne({ user: userId, contentType, contentId });
    return !!like;
  } catch (error) {
    throw new Error(`Error checking user like: ${error.message}`);
  }
};

// Static method to toggle like (like/unlike)
likeSchema.statics.toggleLike = async function(userId, contentType, contentId) {
  try {
    const existingLike = await this.findOne({ user: userId, contentType, contentId });
    
    if (existingLike) {
      // Unlike: Remove the like
      await this.deleteOne({ _id: existingLike._id });
      return { liked: false, action: 'unliked' };
    } else {
      // Like: Create new like
      const newLike = new this({
        user: userId,
        contentType,
        contentId
      });
      await newLike.save();
      return { liked: true, action: 'liked' };
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - user already liked this content
      throw new Error('You have already liked this content');
    }
    throw new Error(`Error toggling like: ${error.message}`);
  }
};

// Static method to get likes with user details
likeSchema.statics.getLikesWithUsers = async function(contentType, contentId, limit = 10) {
  try {
    const likes = await this.find({ contentType, contentId })
      .populate('user', 'username email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit);
    return likes;
  } catch (error) {
    throw new Error(`Error getting likes with users: ${error.message}`);
  }
};

// Static method to get user's recent likes
likeSchema.statics.getUserRecentLikes = async function(userId, limit = 20) {
  try {
    const likes = await this.find({ user: userId })
      .populate('content')
      .sort({ createdAt: -1 })
      .limit(limit);
    return likes;
  } catch (error) {
    throw new Error(`Error getting user likes: ${error.message}`);
  }
};

// Static method to get like statistics for content
likeSchema.statics.getLikeStats = async function(contentType, contentId) {
  try {
    const [totalLikes, recentLikes] = await Promise.all([
      this.countDocuments({ contentType, contentId }),
      this.countDocuments({ 
        contentType, 
        contentId, 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
    ]);
    
    return {
      total: totalLikes,
      recent: recentLikes
    };
  } catch (error) {
    throw new Error(`Error getting like stats: ${error.message}`);
  }
};

// Instance method to get like details
likeSchema.methods.getLikeDetails = async function() {
  try {
    await this.populate('user', 'username email');
    await this.populate('content');
    return this;
  } catch (error) {
    throw new Error(`Error getting like details: ${error.message}`);
  }
};

// Pre-save middleware to validate content exists
likeSchema.pre('save', async function(next) {
  try {
    const Model = mongoose.model(this.contentType);
    const content = await Model.findById(this.contentId);
    
    if (!content) {
      throw new Error(`${this.contentType} not found`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update like counts (if needed)
likeSchema.post('save', async function() {
  try {
    // You can add logic here to update denormalized like counts
    // in Review or Comment models if you want to cache the counts
    console.log(`New like added for ${this.contentType}: ${this.contentId}`);
  } catch (error) {
    console.error('Error in post-save like middleware:', error);
  }
});

// Post-remove middleware to update like counts (if needed)
likeSchema.post('deleteOne', { document: true, query: false }, async function() {
  try {
    // You can add logic here to update denormalized like counts
    console.log(`Like removed for ${this.contentType}: ${this.contentId}`);
  } catch (error) {
    console.error('Error in post-remove like middleware:', error);
  }
});

const Like = mongoose.model('Like', likeSchema);

export default Like;