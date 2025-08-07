import express from 'express';
import {
  toggleLike,
  getLikeCount,
  checkUserLike,
  getLikesWithUsers,
  getLikeStats,
  getUserRecentLikes,
  batchCheckUserLikes
} from '../controllers/likeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = express.Router();

/**
 * Like Toggle Routes
 */

// Toggle like on content (review or comment)
router.post(
  '/toggle',
  authenticate,
  [
    body('contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Content type must be Review or Comment'),
    body('contentId')
      .isMongoId()
      .withMessage('Valid content ID is required')
  ],
  handleValidationErrors,
  toggleLike
);

// Batch check user likes for multiple items
router.post(
  '/batch-check',
  authenticate,
  [
    body('items')
      .isArray({ min: 1, max: 50 })
      .withMessage('Items must be an array with 1-50 items'),
    body('items.*.contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Each item must have valid content type'),
    body('items.*.contentId')
      .isMongoId()
      .withMessage('Each item must have valid content ID')
  ],
  handleValidationErrors,
  batchCheckUserLikes
);

/**
 * Like Information Routes
 */

// Get like count for specific content
router.get(
  '/count/:contentType/:contentId',
  [
    param('contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Content type must be Review or Comment'),
    param('contentId')
      .isMongoId()
      .withMessage('Valid content ID is required')
  ],
  handleValidationErrors,
  getLikeCount
);

// Check if current user has liked content
router.get(
  '/check/:contentType/:contentId',
  authenticate,
  [
    param('contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Content type must be Review or Comment'),
    param('contentId')
      .isMongoId()
      .withMessage('Valid content ID is required')
  ],
  handleValidationErrors,
  checkUserLike
);

// Get like statistics for content
router.get(
  '/stats/:contentType/:contentId',
  [
    param('contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Content type must be Review or Comment'),
    param('contentId')
      .isMongoId()
      .withMessage('Valid content ID is required')
  ],
  handleValidationErrors,
  getLikeStats
);

// Get users who liked specific content
router.get(
  '/:contentType/:contentId/users',
  [
    param('contentType')
      .isIn(['Review', 'Comment'])
      .withMessage('Content type must be Review or Comment'),
    param('contentId')
      .isMongoId()
      .withMessage('Valid content ID is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  getLikesWithUsers
);

/**
 * User Like History Routes
 */

// Get current user's recent likes
router.get(
  '/user/recent',
  authenticate,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  getUserRecentLikes
);

export default router;