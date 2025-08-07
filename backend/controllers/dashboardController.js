import User from "../models/User.js";
import Movie from "../models/Movie.js";
import Review from "../models/Review.js";
import Comment from "../models/Comment.js";
import Genre from "../models/Genre.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Get counts for each model
        const totalUsers = await User.countDocuments();
        const totalMovies = await Movie.countDocuments();
        const totalReviews = await Review.countDocuments({ isPublished: true });
        const totalComments = await Comment.countDocuments({ isPublished: true });
        const totalGenres = await Genre.countDocuments();

        // Get active users (users who have logged in within the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await User.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo }
        });

        // Get recent activity (last 10 activities)
        const recentReviews = await Review.find({ isPublished: true })
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentComments = await Comment.find({ isPublished: true })
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Combine recent activities
        const recentActivity = [
            ...recentReviews.map(review => ({
                id: review._id,
                action: `New review "${review.title}" by ${review.author.username}`,
                time: getTimeAgo(review.createdAt),
                type: 'review'
            })),
            ...recentComments.map(comment => ({
                id: comment._id,
                action: `New comment by ${comment.author.username}`,
                time: getTimeAgo(comment.createdAt),
                type: 'comment'
            })),
            ...recentUsers.map(user => ({
                id: user._id,
                action: `New user registered: ${user.username}`,
                time: getTimeAgo(user.createdAt),
                type: 'user'
            }))
        ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

        const stats = {
            totalUsers,
            totalMovies,
            totalReviews,
            totalComments,
            totalGenres,
            activeUsers,
            recentActivity
        };

        res.json({
            message: 'Dashboard statistics retrieved successfully',
            stats
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ 
            error: 'Failed to get dashboard statistics',
            message: error.message 
        });
    }
});

// Helper function to get time ago
const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}; 