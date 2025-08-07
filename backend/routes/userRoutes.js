import express from "express";

//Controllers
import { 
    createUser, 
    deleteUser, 
    getAllUsers, 
    loginUser, 
    logoutCurrentUser, 
    getCurrentUserProfile, 
    updateCurrentUserProfile,
    addToFavorites,
    removeFromFavorites,
    addToWatchLater,
    removeFromWatchLater,
    getUserFavorites,
    getUserWatchLater,
    getMovieStatus,
    getUserStats
} from "../controllers/userController.js";

// middlewares
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.route("/").post(createUser);
router.post("/auth", loginUser);
router.post("/logout", logoutCurrentUser);

// Protected routes (authentication required)
router.route("/profile")
    .get(authenticate, getCurrentUserProfile)
    .put(authenticate, updateCurrentUserProfile);

router.route("/stats")
    .get(authenticate, getUserStats);

// User preferences routes
router.route("/favorites")
    .get(authenticate, getUserFavorites);

router.route("/favorites/:tmdbId")
    .post(authenticate, addToFavorites)
    .delete(authenticate, removeFromFavorites);

router.route("/watch-later")
    .get(authenticate, getUserWatchLater);

router.route("/watch-later/:tmdbId")
    .post(authenticate, addToWatchLater)
    .delete(authenticate, removeFromWatchLater);

router.route("/movie-status/:tmdbId")
    .get(authenticate, getMovieStatus);

// Admin routes
router.route("/admin/users")
    .get(authenticate, authorizeAdmin, getAllUsers);

router.route("/admin/users/:email")
    .delete(authenticate, authorizeAdmin, deleteUser);

export default router;