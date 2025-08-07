import { 
    Users, 
    Film, 
    Star, 
    MessageCircle, 
    Tags,
    TrendingUp,
    Calendar,
    AlertCircle
} from "lucide-react";
import PrimaryCard from "./PrimaryCard";
import { useGetDashboardStatsQuery } from "../../../../redux/api/dashboard";
import { useGetAllGenresQuery } from "../../../../redux/api/genre";
import Loader from "../../../../components/Loader";

const Main = () => {
    const { data: dashboardData, isLoading, error, refetch } = useGetDashboardStatsQuery();
    const { data: genresData } = useGetAllGenresQuery();

    // Extract stats from API response
    const stats = dashboardData?.stats || {};
    const recentActivity = stats.recentActivity || [];

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers || 0,
            icon: Users,
            color: "from-purple-main to-purple-dark",
            iconColor: "text-purple-main",
            bgColor: "bg-purple-light"
        },
        {
            title: "Total Movies",
            value: stats.totalMovies || 0,
            icon: Film,
            color: "from-green-main to-green-dark",
            iconColor: "text-green-main",
            bgColor: "bg-green-light"
        },
        {
            title: "Total Reviews",
            value: stats.totalReviews || 0,
            icon: Star,
            color: "from-blue-main to-blue-dark",
            iconColor: "text-blue-main",
            bgColor: "bg-blue-light"
        },
        {
            title: "Total Comments",
            value: stats.totalComments || 0,
            icon: MessageCircle,
            color: "from-purple-main to-purple-dark",
            iconColor: "text-purple-main",
            bgColor: "bg-purple-light"
        },
        {
            title: "Total Genres",
            value: genresData?.length || stats.totalGenres || 0,
            icon: Tags,
            color: "from-green-main to-green-dark",
            iconColor: "text-green-main",
            bgColor: "bg-green-light"
        },
        {
            title: "Active Users",
            value: stats.activeUsers || 0,
            icon: TrendingUp,
            color: "from-blue-main to-blue-dark",
            iconColor: "text-blue-main",
            bgColor: "bg-blue-light"
        }
    ];

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex-1 p-8 bg-white-500">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                        <h2 className="text-xl font-semibold text-black-main mb-2">
                            Failed to load dashboard data
                        </h2>
                        <p className="text-black-light mb-4">
                            {error?.data?.message || 'An error occurred while fetching dashboard statistics'}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="bg-purple-main hover:bg-purple-dark text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-white-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-black-main mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-black-light">
                    Welcome to your admin dashboard. Here's what's happening with WAG Movie Reviews.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <PrimaryCard
                        key={index}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                        iconColor={card.iconColor}
                        bgColor={card.bgColor}
                    />
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Calendar className="text-purple-main" size={24} />
                        <h2 className="text-xl font-semibold text-black-main">Recent Activity</h2>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="text-purple-main hover:text-purple-dark transition-colors text-sm"
                    >
                        Refresh
                    </button>
                </div>
                <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div 
                                key={activity.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-purple-light transition-colors"
                            >
                                <span className="text-black-main">{activity.action}</span>
                                <span className="text-sm text-black-light">{activity.time}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-black-light">
                            <Calendar className="mx-auto mb-2" size={32} />
                            <p>No recent activity to display</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Main;