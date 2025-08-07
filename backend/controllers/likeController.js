import asyncHandler from '../middlewares/asyncHandler.js';
import Like from '../models/Like.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';

/**
 * @desc    Toggle like on review or comment
 * @route   POST /api/likes/toggle
 * @access  Private
 */
const toggleLike = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.body;
  const userId = req.user._id;

  // Validate content type
  if (!['Review', 'Comment'].includes(contentType)) {
    res.status(400);
    throw new Error('Invalid content type. Must be Review or Comment.');
  }

  // Validate content exists
  let content;
  if (contentType === 'Review') {
    content = await Review.findById(contentId);
  } else {
    content = await Comment.findById(contentId);
  }

  if (!content) {
    res.status(404);
    throw new Error(`${contentType} not found`);
  }

  try {
    // Toggle like using the Like model
    const result = await Like.toggleLike(userId, contentType, contentId);
    
    // Update the denormalized count in the original model
    if (result.action === 'liked') {
      content.likes = (content.likes || 0) + 1;
      if (!content.likedBy.includes(userId)) {
        content.likedBy.push(userId);
      }
    } else {
      content.likes = Math.max(0, (content.likes || 0) - 1);
      content.likedBy = content.likedBy.filter(id => !id.equals(userId));
    }
    
    await content.save();

    // Get updated like count
    const likeCount = await Like.getLikeCount(contentType, contentId);

    res.status(200).json({
      success: true,
      message: `${contentType} ${result.action} successfully`,
      data: {
        liked: result.liked,
        action: result.action,
        likeCount,
        contentId,
        contentType
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get like count for content
 * @route   GET /api/likes/count/:contentType/:contentId
 * @access  Public
 */
const getLikeCount = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;

  // Validate content type
  if (!['Review', 'Comment'].includes(contentType)) {
    res.status(400);
    throw new Error('Invalid content type. Must be Review or Comment.');
  }

  try {
    const count = await Like.getLikeCount(contentType, contentId);
    
    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        likeCount: count
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Check if user has liked content
 * @route   GET /api/likes/check/:contentType/:contentId
 * @access  Private
 */
const checkUserLike = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;
  const userId = req.user._id;

  // Validate content type
  if (!['Review', 'Comment'].includes(contentType)) {
    res.status(400);
    throw new Error('Invalid content type. Must be Review or Comment.');
  }

  try {
    const hasLiked = await Like.hasUserLiked(userId, contentType, contentId);
    
    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        hasLiked
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get likes with user details for content
 * @route   GET /api/likes/:contentType/:contentId/users
 * @access  Public
 */
const getLikesWithUsers = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  // Validate content type
  if (!['Review', 'Comment'].includes(contentType)) {
    res.status(400);
    throw new Error('Invalid content type. Must be Review or Comment.');
  }

  try {
    const likes = await Like.getLikesWithUsers(contentType, contentId, limit);
    
    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        likes,
        count: likes.length
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get like statistics for content
 * @route   GET /api/likes/stats/:contentType/:contentId
 * @access  Public
 */
const getLikeStats = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;

  // Validate content type
  if (!['Review', 'Comment'].includes(contentType)) {
    res.status(400);
    throw new Error('Invalid content type. Must be Review or Comment.');
  }

  try {
    const stats = await Like.getLikeStats(contentType, contentId);
    
    res.status(200).json({
      success: true,
      data: {
        contentId,
        contentType,
        ...stats
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get user's recent likes
 * @route   GET /api/likes/user/recent
 * @access  Private
 */
const getUserRecentLikes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const likes = await Like.getUserRecentLikes(userId, limit);
    
    res.status(200).json({
      success: true,
      data: {
        likes,
        count: likes.length
      }
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Get multiple like statuses for user (batch check)
 * @route   POST /api/likes/batch-check
 * @access  Private
 */
const batchCheckUserLikes = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of {contentType, contentId}
  const userId = req.user._id;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Items array is required');
  }

  if (items.length > 50) {
    res.status(400);
    throw new Error('Maximum 50 items allowed per batch');
  }

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const { contentType, contentId } = item;
        
        // Validate content type
        if (!['Review', 'Comment'].includes(contentType)) {
          return { contentType, contentId, error: 'Invalid content type' };
        }

        try {
          const hasLiked = await Like.hasUserLiked(userId, contentType, contentId);
          const likeCount = await Like.getLikeCount(contentType, contentId);
          
          return {
            contentType,
            contentId,
            hasLiked,
            likeCount
          };
        } catch (error) {
          return {
            contentType,
            contentId,
            error: error.message
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export {
  toggleLike,
  getLikeCount,
  checkUserLike,
  getLikesWithUsers,
  getLikeStats,
  getUserRecentLikes,
  batchCheckUserLikes
};