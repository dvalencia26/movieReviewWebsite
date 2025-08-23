import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/api/features/auth/authSlice";
import { toast } from "sonner";
import { 
    Home, 
    Film, 
    User, 
    Settings, 
    LogOut, 
    LogIn, 
    UserPlus, 
    ChevronDown,
    LayoutDashboard,
    Tags,
    Heart,
    Plus,
    Info,
    Menu,
    X
} from "lucide-react";
import WAGLogo from "../../assets/WAGLogo.png";
import { useLogoutMutation } from "../../redux/api/users";

const Navigation = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    }

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    }

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [logoutApicall] = useLogoutMutation();
    const logoutHandler = async () => {
        try {
            await logoutApicall().unwrap();
            dispatch(logout());
            navigate("/login");
            toast.success("Logged out successfully!");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-main to-purple-dark shadow-lg backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                    {/* Left Section - Logo and Navigation Links */}
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="flex items-center space-x-2 hover-scale group">
                            <img 
                                src={WAGLogo} 
                                alt="WAG Movie Reviews" 
                                className="w-10 h-10 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" 
                            />
                            <span className="text-white font-bold text-xl hidden sm:block">
                                WAG Reviews
                            </span>
                        </Link>
                        
                        <div className="hidden md:flex items-center space-x-6">
                            <Link 
                                to="/" 
                                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            >
                                <Home size={18} />
                                <span>Home</span>
                            </Link>
                            <Link 
                                to="/movies" 
                                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            >
                                <Film size={18} />
                                <span>Movies</span>
                            </Link>
                            <Link 
                                to="/about" 
                                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            >
                                <Info size={18} />
                                <span>About WAG</span>
                            </Link>
                            {userInfo && userInfo.isAdmin && (
                                <>
                                    <Link 
                                        to="/admin/movies" 
                                        className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                                    >
                                        <Plus size={18} />
                                        <span>Create Review</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Mobile Menu Toggle & User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Mobile Menu Toggle */}
                        <button 
                            onClick={toggleMobileMenu}
                            className="md:hidden text-white hover:text-white/80 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        
                        {/* User Menu */}
                        <div className="relative">
                            <button 
                            onClick={toggleDropdown} 
                            className="flex items-center space-x-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                            <User size={18} />
                            <span className="hidden sm:block">
                                {userInfo ? userInfo.username : "Guest"}
                            </span>
                            <ChevronDown 
                                size={16} 
                                className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10">
                                {userInfo ? (
                                    <>
                                        {userInfo.isAdmin && (
                                            <>
                                                <Link 
                                                    to="/admin/dashboard"
                                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-light/20 hover:text-purple-dark transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <LayoutDashboard size={18} />
                                                    <span>Dashboard</span>
                                                </Link>
                                                <Link 
                                                    to="/admin/movies/genres"
                                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-purple-light/20 hover:text-purple-dark transition-colors"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    <Tags size={18} />
                                                    <span>Manage Genres</span>
                                                </Link>
                                            </>
                                        )}
                                        <Link 
                                            to="/favorites"
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Heart size={18} />
                                            <span>My Lists</span>
                                        </Link>
                                        <Link 
                                            to="/profile"
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-light/20 hover:text-green-dark transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Settings size={18} />
                                            <span>Profile</span>
                                        </Link>
                                        <hr className="my-2 border-gray-100" />
                                        <button 
                                            onClick={() => {
                                                logoutHandler();
                                                setDropdownOpen(false);
                                            }}
                                            className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            to="/login"
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-light/20 hover:text-blue-dark transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <LogIn size={18} />
                                            <span>Login</span>
                                        </Link>
                                        <Link 
                                            to="/register"
                                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-light/20 hover:text-green-dark transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <UserPlus size={18} />
                                            <span>Register</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Links - Collapsible */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/20 py-3 bg-gradient-to-r from-purple-main to-purple-dark">
                        <div className="flex flex-wrap gap-2 justify-center">
                        <Link 
                            to="/" 
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Home size={18} />
                            <span>Home</span>
                        </Link>
                        <Link 
                            to="/movies" 
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Film size={18} />
                            <span>Movies</span>
                        </Link>
                        <Link 
                            to="/about" 
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Info size={18} />
                            <span>About WAG</span>
                        </Link>
                        {userInfo && userInfo.isAdmin && (
                            <>
                                <Link 
                                    to="/admin/movies" 
                                    className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Plus size={18} />
                                    <span>Create Review</span>
                                </Link>
                            </>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;