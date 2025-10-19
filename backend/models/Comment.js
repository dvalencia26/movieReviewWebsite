import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  // Review reference
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review",
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
  
  // Comment content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Nested comments support
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
    index: true
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
  isFlagged: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  
  // Reply count (for performance)
  replyCount: {
    type: Number,
    default: 0
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
commentSchema.index({ reviewId: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });
commentSchema.index({ isPublished: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for formatted creation date
commentSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for author name (populated)
commentSchema.virtual('authorName').get(function() {
  return this.author?.username || 'Anonymous';
});

// Virtual for likes count display
commentSchema.virtual('likesDisplay').get(function() {
  if (this.likes === 0) return 'No likes';
  if (this.likes === 1) return '1 like';
  return `${this.likes} likes`;
});

// Virtual for reply count display
commentSchema.virtual('replyCountDisplay').get(function() {
  if (this.replyCount === 0) return 'No replies';
  if (this.replyCount === 1) return '1 reply';
  return `${this.replyCount} replies`;
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Calculate word count
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  next();
});

// Post-save middleware to update parent comment reply count
commentSchema.post('save', async function(doc) {
  if (doc.parentComment) {
    const ParentComment = this.constructor;
    await ParentComment.findByIdAndUpdate(
      doc.parentComment,
      { $inc: { replyCount: 1 } }
    );
  }
});

// Post-remove middleware to update parent comment reply count
commentSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.parentComment) {
    const ParentComment = this.model;
    await ParentComment.findByIdAndUpdate(
      doc.parentComment,
      { $inc: { replyCount: -1 } }
    );
  }
});

// Instance methods
commentSchema.methods.toggleLike = function(userId) {
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

commentSchema.methods.isLikedBy = function(userId) {
  return this.likedBy.includes(userId);
};

commentSchema.methods.addReply = function(replyData) {
  const Comment = this.constructor;
  return new Comment({
    ...replyData,
    parentComment: this._id
  }).save();
};

// Static methods
commentSchema.statics.findByReview = function(reviewId, includeReplies = true) {
  const query = { reviewId, isPublished: true };
  
  if (!includeReplies) {
    query.parentComment = null; // Only top-level comments
  }
  
  return this.find(query)
    .populate('author', 'username')
    .sort({ createdAt: -1 });
};

commentSchema.statics.findReplies = function(parentCommentId) {
  return this.find({ 
    parentComment: parentCommentId, 
    isPublished: true 
  })
    .populate('author', 'username')
    .sort({ createdAt: 1 }); // Replies in chronological order
};

commentSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId, isPublished: true })
    .populate('author', 'username')
    .populate('reviewId', 'title')
    .sort({ createdAt: -1 });
};

commentSchema.statics.getCommentTree = async function(reviewId) {
  // Fetch as plain objects so we can attach reply arrays without losing data
  const comments = await this.find({ reviewId, isPublished: true })
    .populate('author', 'username')
    .sort({ createdAt: 1 })
    .lean({ virtuals: true });
  
  if (comments.length === 0) {
    return [];
  }
  
  const commentMap = new Map();
  const topLevelComments = [];
  
  // First pass: prime the map and prepare reply containers
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment._id.toString(), comment);
  });
  
  // Second pass: attach replies to their parent
  comments.forEach(comment => {
    if (comment.parentComment) {
      const parent = commentMap.get(comment.parentComment.toString());
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      topLevelComments.push(comment);
    }
  });
  
  return topLevelComments;
};

commentSchema.statics.getMostLiked = function(limit = 5) {
  return this.find({ isPublished: true })
    .populate('author', 'username')
    .sort({ likes: -1 })
    .limit(limit);
};

commentSchema.statics.getRecentActivity = function(limit = 10) {
  return this.find({ isPublished: true })
    .populate('author', 'username')
    .populate('reviewId', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Comment = mongoose.model("Comment", commentSchema);
export default Comment; 
