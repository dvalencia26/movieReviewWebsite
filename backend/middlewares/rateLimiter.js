import rateLimit from 'express-rate-limit';

// General rate limiting for all requests
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`🚦 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Stricter rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.log(`🔐 Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'For security reasons, please wait before trying again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for review creation
export const reviewRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 review submissions per hour
  message: {
    error: 'Too many reviews submitted',
    message: 'Please wait before submitting another review',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    console.log(`📝 Review rate limit exceeded for: ${req.user ? `User ${req.user._id}` : `IP ${req.ip}`}`);
    res.status(429).json({
      error: 'Too many reviews submitted',
      message: 'You can only submit 5 reviews per hour. Please wait before submitting another.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for comment creation
export const commentRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 comments per 10 minutes
  message: {
    error: 'Too many comments submitted',
    message: 'Please wait before submitting another comment',
    retryAfter: '10 minutes'
  },
  keyGenerator: (req) => {
    return req.user ? `user_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    console.log(`💬 Comment rate limit exceeded for: ${req.user ? `User ${req.user._id}` : `IP ${req.ip}`}`);
    res.status(429).json({
      error: 'Too many comments submitted',
      message: 'You can only submit 10 comments per 10 minutes. Please wait before commenting again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for search endpoints
export const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 searches per minute
  message: {
    error: 'Too many search requests',
    message: 'Please wait before searching again',
    retryAfter: '1 minute'
  },
  handler: (req, res) => {
    console.log(`🔍 Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many search requests',
      message: 'Please wait before performing another search.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for TMDB proxy endpoints
export const tmdbRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // limit each IP to 30 requests per 10 seconds (slightly under TMDB's 40/10s limit)
  message: {
    error: 'Too many movie data requests',
    message: 'Please wait before requesting more movie data',
    retryAfter: '10 seconds'
  },
  handler: (req, res) => {
    console.log(`🎬 TMDB rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many movie data requests',
      message: 'Please wait before requesting more movie information.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for admin actions
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit each admin to 20 actions per 5 minutes
  message: {
    error: 'Too many admin actions',
    message: 'Please wait before performing another admin action',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req) => {
    return req.user ? `admin_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    console.log(`👨‍💼 Admin rate limit exceeded for: ${req.user ? `User ${req.user._id}` : `IP ${req.ip}`}`);
    res.status(429).json({
      error: 'Too many admin actions',
      message: 'Please wait before performing another admin action.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for like/unlike actions
export const likeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each user to 50 likes per minute
  message: {
    error: 'Too many like actions',
    message: 'Please wait before liking/unliking again',
    retryAfter: '1 minute'
  },
  keyGenerator: (req) => {
    return req.user ? `like_${req.user._id}` : req.ip;
  },
  handler: (req, res) => {
    console.log(`❤️ Like rate limit exceeded for: ${req.user ? `User ${req.user._id}` : `IP ${req.ip}`}`);
    res.status(429).json({
      error: 'Too many like actions',
      message: 'Please wait before liking or unliking again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Custom rate limiter for specific endpoints
export const createCustomRateLimit = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Rate limit exceeded',
      message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Dynamic rate limiting based on user type
export const dynamicRateLimit = (req, res, next) => {
  // Different limits for different user types
  const limits = {
    admin: { windowMs: 15 * 60 * 1000, max: 500 },
    user: { windowMs: 15 * 60 * 1000, max: 100 },
    guest: { windowMs: 15 * 60 * 1000, max: 50 }
  };

  const userType = req.user?.isAdmin ? 'admin' : req.user ? 'user' : 'guest';
  const limit = limits[userType];

  const dynamicLimiter = rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => {
      return req.user ? `${userType}_${req.user._id}` : `${userType}_${req.ip}`;
    },
    handler: (req, res) => {
      console.log(`🎯 Dynamic rate limit exceeded for ${userType}: ${req.user ? req.user._id : req.ip}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `${userType} rate limit exceeded. Please wait before making more requests.`,
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    }
  });

  dynamicLimiter(req, res, next);
};

// Skip rate limiting for certain conditions
export const skipRateLimit = (req, res, next) => {
  // Skip rate limiting for admin users in development
  if (process.env.NODE_ENV === 'development' && req.user?.isAdmin) {
    console.log('🚫 Skipping rate limit for admin in development');
    return next();
  }

  next();
};

// Rate limit information middleware
export const rateLimitInfo = (req, res, next) => {
  // Add rate limit info to response headers
  res.set('X-RateLimit-Limit', req.rateLimit?.limit || 'N/A');
  res.set('X-RateLimit-Remaining', req.rateLimit?.remaining || 'N/A');
  res.set('X-RateLimit-Reset', req.rateLimit?.resetTime || 'N/A');
  
  next();
};

// Global rate limit status endpoint
export const getRateLimitStatus = (req, res) => {
  const key = req.user ? `user_${req.user._id}` : req.ip;
  
  res.json({
    key,
    currentTime: Date.now(),
    limits: {
      general: { windowMs: 15 * 60 * 1000, max: 100 },
      auth: { windowMs: 15 * 60 * 1000, max: 5 },
      review: { windowMs: 60 * 60 * 1000, max: 5 },
      comment: { windowMs: 10 * 60 * 1000, max: 10 },
      search: { windowMs: 1 * 60 * 1000, max: 30 },
      tmdb: { windowMs: 10 * 1000, max: 30 }
    }
  });
}; 