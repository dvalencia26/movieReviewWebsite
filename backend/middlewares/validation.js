import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    console.log('❌ Validation errors:', errorMessages);
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = DOMPurify.sanitize(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  next();
};

// Review validation rules
export const validateReview = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Review title must be between 3 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Review content must be between 10 and 5000 characters'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  
  sanitizeInput,
  handleValidationErrors
];

// Comment validation rules
export const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Parent comment must be a valid MongoDB ObjectId'),
  
  sanitizeInput,
  handleValidationErrors
];

// Movie ID validation
export const validateMovieId = [
  param('tmdbId')
    .isInt({ min: 1 })
    .withMessage('TMDB ID must be a positive integer')
    .toInt(),
  
  handleValidationErrors
];

// Review ID validation
export const validateReviewId = [
  param('reviewId')
    .isMongoId()
    .withMessage('Review ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

// Comment ID validation
export const validateCommentId = [
  param('commentId')
    .isMongoId()
    .withMessage('Comment ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .escape(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  
  handleValidationErrors
];

// Genre validation
export const validateGenre = [
  query('genre')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Genre ID must be a positive integer')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['popularity.desc', 'popularity.asc', 'release_date.desc', 'release_date.asc', 'vote_average.desc', 'vote_average.asc'])
    .withMessage('Invalid sort option'),
  
  handleValidationErrors
];

// User profile validation
export const validateUserProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  sanitizeInput,
  handleValidationErrors
];

// Registration validation
export const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  sanitizeInput,
  handleValidationErrors
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  sanitizeInput,
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

// Custom validation helpers
export const customValidators = {
  // Check if TMDB ID exists (you might want to cache this)
  isTMDBIdValid: async (tmdbId) => {
    // This would typically call TMDB API to verify
    // For now, just check if it's a positive integer
    return Number.isInteger(tmdbId) && tmdbId > 0;
  },
  
  // Check if user can modify resource
  canModifyResource: (userId, resourceUserId) => {
    return userId.toString() === resourceUserId.toString();
  },
  
  // Check if content is appropriate (basic profanity filter)
  isContentAppropriate: (content) => {
    const inappropriate = ['spam', 'test123', 'asdf'];
    const lowerContent = content.toLowerCase();
    return !inappropriate.some(word => lowerContent.includes(word));
  }
};

// Rate limiting validation
export const validateRateLimit = (req, res, next) => {
  // This would typically check Redis or database for rate limit info
  // For now, just pass through
  next();
};

// File upload validation (for movie posters, etc.)
export const validateFileUpload = [
  body('file')
    .optional()
    .custom((value, { req }) => {
      if (!req.file) return true;
      
      // Check file size (5MB limit)
      if (req.file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('File must be a JPEG, PNG, or WebP image');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Admin validation
export const validateAdminAction = [
  body('action')
    .isIn(['feature', 'unfeature', 'hide', 'show', 'delete'])
    .withMessage('Invalid admin action'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  
  sanitizeInput,
  handleValidationErrors
]; 