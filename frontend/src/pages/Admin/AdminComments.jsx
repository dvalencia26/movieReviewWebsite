import React from 'react';
import { MessageCircle, MessageSquare, AlertTriangle, Check } from "lucide-react";
import { useGetDashboardStatsQuery } from "../../redux/api/dashboard";
import Loader from "../../components/Loader";

const AdminComments = () => {
    const { data: dashboardData, isLoading, error } = useGetDashboardStatsQuery();
    
    // Extract stats from API response
    const stats = dashboardData?.stats || {};
    const recentActivity = stats.recentActivity || [];
    
    // Filter recent comments
    const recentComments = recentActivity.filter(activity => activity.type === 'comment');
    
    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-light to-white-500 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-purple-main mb-4">Comment Management</h1>
                        <p className="text-gray-600 text-lg">Monitor and manage comments across all movie reviews</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Comments</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalComments || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="text-blue-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Recent Comments</p>
                                    <p className="text-3xl font-bold text-gray-900">{recentComments.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Check className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Active Reviews</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalReviews || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="text-purple-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Comments */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <MessageCircle className="text-purple-main" size={24} />
                            <span>Recent Comments</span>
                        </h2>
                        
                        {recentComments.length > 0 ? (
                            <div className="space-y-4">
                                {recentComments.map((comment, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                <MessageSquare className="text-purple-600" size={16} />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium">{comment.action}</p>
                                                <p className="text-sm text-gray-500">{comment.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Published
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="mx-auto mb-4" size={48} />
                                <p>No recent comments to display</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <MessageSquare className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">View All Comments</h3>
                                        <p className="text-sm text-gray-500">Browse all comments across reviews</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Check className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Moderate Comments</h3>
                                        <p className="text-sm text-gray-500">Review and approve pending comments</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminComments; 