import React, { useState, memo } from 'react';
import { Heart, Users } from 'lucide-react';
import { useLikes } from '../hooks/useLikes';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

/**
 * LikeButton Component
 * @param {string} contentType - 'Review' or 'Comment'
 * @param {string} contentId - ID of the content
 * @param {number} initialLikeCount - Initial like count
 * @param {boolean} initialLikedState - Initial liked state
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {boolean} showCount - Whether to show like count
 * @param {boolean} showUsers - Whether to show users who liked (on hover/click)
 * @param {string} variant - 'default', 'minimal', 'compact'
 */
const LikeButton = memo(({ 
  contentType, 
  contentId, 
  initialLikeCount = 0, 
  initialLikedState = false,
  size = 'md',
  showCount = true,
  showUsers = false,
  variant = 'default',
  className = ''
}) => {
  const { userInfo } = useSelector((state) => state.auth);
  const { likeCount, isLiked, isLoading, toggleLike, getLikingUsers } = useLikes(
    contentType, 
    contentId, 
    initialLikeCount, 
    initialLikedState
  );
  
  const [showLikingUsers, setShowLikingUsers] = useState(false);
  const [likingUsers, setLikingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 14,
      text: 'text-xs',
      padding: 'px-2 py-1',
      gap: 'space-x-1'
    },
    md: {
      icon: 16,
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      gap: 'space-x-2'
    },
    lg: {
      icon: 20,
      text: 'text-base',
      padding: 'px-4 py-2',
      gap: 'space-x-2'
    }
  };

  const config = sizeConfig[size];

  // Variant styles
  const getVariantStyles = () => {
    const baseStyles = `inline-flex items-center transition-all duration-200 ${config.gap} ${config.padding}`;
    
    switch (variant) {
      case 'minimal':
        return `${baseStyles} text-gray-500 hover:text-red-500 ${isLiked ? 'text-red-500' : ''}`;
      
      case 'compact':
        return `${baseStyles} text-gray-600 hover:text-red-600 ${isLiked ? 'text-red-600' : ''} p-1`;
      
      default:
        return `${baseStyles} rounded-full border transition-colors ${
          isLiked 
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
        }`;
    }
  };

  const handleLikeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userInfo) {
      // You could show a login modal here instead
      return;
    }
    
    await toggleLike();
  };

  const handleShowUsers = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showUsers || likeCount === 0) return;
    
    setLoadingUsers(true);
    try {
      const users = await getLikingUsers(10);
      setLikingUsers(users);
      setShowLikingUsers(true);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const formatLikeCount = (count) => {
    if (count === 0) return showCount ? '0' : '';
    if (count === 1) return '1';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}m`;
  };

  if (!userInfo && variant === 'default') {
    // Show login prompt for non-authenticated users
    return (
      <Link
        to="/login"
        className={`${getVariantStyles()} ${className} cursor-pointer`}
        title="Login to like"
      >
        <Heart size={config.icon} />
        {showCount && (
          <span className={config.text}>
            {formatLikeCount(likeCount)}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleLikeClick}
        disabled={isLoading}
        className={`${getVariantStyles()} ${className} ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${!userInfo ? 'cursor-not-allowed opacity-50' : ''}`}
        title={
          !userInfo 
            ? 'Login to like' 
            : isLiked 
              ? `Unlike this ${contentType.toLowerCase()}` 
              : `Like this ${contentType.toLowerCase()}`
        }
        aria-label={`${isLiked ? 'Unlike' : 'Like'} this ${contentType.toLowerCase()}`}
      >
        <Heart 
          size={config.icon} 
          className={`transition-transform ${
            isLiked ? 'fill-current scale-110' : 'hover:scale-110'
          }`}
        />
        {showCount && (
          <span className={config.text}>
            {formatLikeCount(likeCount)}
          </span>
        )}
      </button>

      {/* Show users who liked */}
      {showUsers && likeCount > 0 && (
        <button
          onClick={handleShowUsers}
          disabled={loadingUsers}
          className={`ml-2 text-gray-500 hover:text-gray-700 ${config.text}`}
          title="See who liked this"
        >
          <Users size={config.icon} />
        </button>
      )}

      {/* Users modal/tooltip */}
      {showLikingUsers && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 max-w-64">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-gray-900">
                Liked by
              </h4>
              <button
                onClick={() => setShowLikingUsers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {likingUsers.map((like) => (
                <div key={like._id} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-purple-600">
                      {like.user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 truncate">
                    {like.user.username || 'Anonymous'}
                  </span>
                </div>
              ))}
              {likingUsers.length === 0 && (
                <p className="text-sm text-gray-500">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
LikeButton.displayName = 'LikeButton';

export default LikeButton;