import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import apiService from '../services/api';
import { toast } from 'sonner';

/**
 * Custom hook for managing likes on reviews and comments
 * @param {string} contentType - 'Review' or 'Comment'
 * @param {string} contentId - ID of the content being liked
 * @param {number} initialLikeCount - Initial like count (optional)
 * @param {boolean} initialLikedState - Initial liked state (optional)
 */
export const useLikes = (contentType, contentId, initialLikeCount = 0, initialLikedState = false, { autoFetch = true } = {}) => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialLikedState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial like status and count
  const fetchLikeData = useCallback(async () => {
    if (!contentId || !contentType) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch like count (public endpoint)
      const countResponse = await apiService.getLikeCount(contentType, contentId);
      setLikeCount(countResponse.data.data.likeCount);

      // Check if user has liked (requires authentication)
      if (userInfo) {
        const likeResponse = await apiService.checkUserLike(contentType, contentId);
        setIsLiked(likeResponse.data.data.hasLiked);
      } else {
        setIsLiked(false);
      }
    } catch (err) {
      console.error('Error fetching like data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, contentId, userInfo]);

  // Toggle like status
  const toggleLike = useCallback(async () => {
    if (!userInfo) {
      toast.error('Please login to like content');
      return;
    }

    if (!contentId || !contentType) {
      toast.error('Invalid content');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.toggleLike(contentType, contentId);
      const { liked, likeCount: newLikeCount } = response.data.data;

      setIsLiked(liked);
      setLikeCount(newLikeCount);

      // Show success message
      const action = liked ? 'liked' : 'unliked';
      const contentName = contentType.toLowerCase();
      toast.success(`${contentName.charAt(0).toUpperCase() + contentName.slice(1)} ${action}!`);

    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err.message);
      
      // Show error message
      const errorMessage = err.response?.data?.message || 'Failed to toggle like';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, contentId, userInfo]);

  // Get users who liked this content
  const getLikingUsers = useCallback(async (limit = 10) => {
    if (!contentId || !contentType) return [];

    try {
      const response = await apiService.getLikesWithUsers(contentType, contentId, limit);
      return response.data.data.likes;
    } catch (err) {
      console.error('Error fetching liking users:', err);
      return [];
    }
  }, [contentType, contentId]);

  // Get like statistics
  const getLikeStats = useCallback(async () => {
    if (!contentId || !contentType) return null;

    try {
      const response = await apiService.getLikeStats(contentType, contentId);
      return response.data.data;
    } catch (err) {
      console.error('Error fetching like stats:', err);
      return null;
    }
  }, [contentType, contentId]);

  // Initialize data on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchLikeData();
    }
  }, [fetchLikeData, autoFetch]);

  return {
    likeCount,
    isLiked,
    isLoading,
    error,
    toggleLike,
    getLikingUsers,
    getLikeStats,
    refetch: fetchLikeData
  };
};

/**
 * Hook for batch checking multiple items' like status
 * @param {Array} items - Array of {contentType, contentId} objects
 */
export const useBatchLikes = (items = []) => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const [likeData, setLikeData] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBatchLikes = useCallback(async () => {
    if (!items.length || !userInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.batchCheckUserLikes(items);
      const results = response.data.data;
      
      const newLikeData = new Map();
      results.forEach((result) => {
        if (!result.error) {
          const key = `${result.contentType}-${result.contentId}`;
          newLikeData.set(key, {
            hasLiked: result.hasLiked,
            likeCount: result.likeCount,
            contentType: result.contentType,
            contentId: result.contentId
          });
        }
      });
      
      setLikeData(newLikeData);
    } catch (err) {
      console.error('Error fetching batch likes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [items, userInfo]);

  const getLikeData = useCallback((contentType, contentId) => {
    const key = `${contentType}-${contentId}`;
    return likeData.get(key) || { hasLiked: false, likeCount: 0 };
  }, [likeData]);

  useEffect(() => {
    fetchBatchLikes();
  }, [fetchBatchLikes]);

  return {
    likeData,
    isLoading,
    error,
    getLikeData,
    refetch: fetchBatchLikes
  };
};

/**
 * Hook for getting user's recent likes
 * @param {number} limit - Number of recent likes to fetch
 */
export const useUserRecentLikes = (limit = 20) => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const [recentLikes, setRecentLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecentLikes = useCallback(async () => {
    if (!userInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserRecentLikes(limit);
      setRecentLikes(response.data.data.likes);
    } catch (err) {
      console.error('Error fetching recent likes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, limit]);

  useEffect(() => {
    fetchRecentLikes();
  }, [fetchRecentLikes]);

  return {
    recentLikes,
    isLoading,
    error,
    refetch: fetchRecentLikes
  };
};

export default useLikes;