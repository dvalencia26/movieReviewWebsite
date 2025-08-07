import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import { adminRateLimit } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Dashboard statistics endpoint (Admin only)
router.get('/stats',
    authenticate,
    authorizeAdmin,
    adminRateLimit,
    getDashboardStats
);

export default router; 