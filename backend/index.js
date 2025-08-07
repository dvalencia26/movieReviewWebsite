// Packages
import express from "express";  
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import morgan from "morgan";
import cors from "cors";

// Files
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import genreRoutes from "./routes/genreRoutes.js";
import moviesRoutes from "./routes/moviesRoutes.js";
import tmdbRoutes from "./routes/tmdbRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Middleware
import { generalRateLimit, skipRateLimit } from "./middlewares/rateLimiter.js";

// Config
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Morgan logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
});

// Rate limiting
app.use(skipRateLimit);
app.use(generalRateLimit);

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/genre", genreRoutes);
app.use("/api/v1/movies", moviesRoutes);
app.use("/api/v1/tmdb", tmdbRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'WAG Movie Reviews API',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/users',
      genres: '/api/v1/genre',
      movies: '/api/v1/movies',
      tmdb: '/api/v1/tmdb',
      dashboard: '/api/v1/dashboard'
    },
    documentation: {
      users: 'User authentication and profile management',
      genres: 'Movie genres management',
      movies: 'Movie reviews and comments',
      tmdb: 'The Movie Database API proxy',
      dashboard: 'Admin dashboard statistics'
    }
  });
});

// Static file serving (for uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Log error details
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🎬 TMDB API Key: ${process.env.TMDB_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔍 MongoDB: ${process.env.MONGO_URI ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📁 Uploads directory: ${path.join(process.cwd(), 'uploads')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

export default app;