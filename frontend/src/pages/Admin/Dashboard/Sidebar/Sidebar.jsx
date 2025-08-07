import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    Edit, 
    Tags, 
    MessageCircle, 
    Users,
    Home,
    Star
} from "lucide-react";
import { useSelector } from "react-redux";

const Sidebar = () => {
    const location = useLocation();
    const { userInfo } = useSelector((state) => state.auth);

    const menuItems = [
        {
            title: "Dashboard",
            icon: LayoutDashboard,
            path: "/admin/dashboard",
            color: "text-purple-main"
        },
        {
            title: "Create Movie Review",
            icon: Star,
            path: "/admin/movies",
            color: "text-green-main"
        },
        {
            title: "Manage Genres",
            icon: Tags,
            path: "/admin/movies/genres",
            color: "text-purple-main"
        },
        {
            title: "Comments",
            icon: MessageCircle,
            path: "/admin/comments",
            color: "text-green-main"
        },
        {
            title: "Users",
            icon: Users,
            path: "/admin/users",
            color: "text-blue-main"
        }
    ];

    return (
        <div className="w-64 bg-white shadow-xl border-r border-gray-200 h-screen overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-main to-purple-dark rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="text-white" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                        <p className="text-sm text-gray-600">Welcome, {userInfo?.username || 'Admin'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-gradient-to-r from-purple-main to-purple-dark text-white shadow-lg' 
                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-main'
                            }`}
                        >
                            <Icon 
                                size={20} 
                                className={`${
                                    isActive ? 'text-white' : item.color
                                } group-hover:scale-110 transition-transform`} 
                            />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Back to Site */}
            <div className="p-4 border-t border-gray-200">
                <Link 
                    to="/" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-purple-main transition-colors"
                >
                    <Home size={16} />
                    <span className="text-sm">Back to Site</span>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;