import express from "express";

const router = express.Router();

// Controller
import { 
    createGenre, 
    updateGenre, 
    removeGenre, 
    getAllGenres, 
    getGenreById, 
    syncTMDBGenres,
    updateMovieGenres,
    getGenreStats
} from "../controllers/genreController.js";

// Middleware
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { adminRateLimit } from "../middlewares/rateLimiter.js";

// Public routes
router.route("/").get(getAllGenres).post(authenticate, authorizeAdmin, createGenre);
router.route("/genres").get(getAllGenres); // Alternative endpoint for consistency
router.route("/:id").get(getGenreById).put(authenticate, authorizeAdmin, updateGenre).delete(authenticate, authorizeAdmin, removeGenre);

// Admin routes
router.route("/sync/tmdb").post(authenticate, authorizeAdmin, adminRateLimit, syncTMDBGenres);
router.route("/update/movies").post(authenticate, authorizeAdmin, adminRateLimit, updateMovieGenres);
router.route("/stats").get(authenticate, authorizeAdmin, getGenreStats);

export default router; 