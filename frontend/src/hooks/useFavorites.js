import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import apiService from '../services/api';
import { toast } from 'sonner';

export const useFavorites = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const [favorites, setFavorites] = useState(new Set());
    const [watchLater, setWatchLater] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(new Set());

    // Load user's favorites and watch later on mount
    useEffect(() => {
        const loadUserLists = async () => {
            if (!userInfo) return;
            
            try {
                setLoading(true);
                const [favoritesResponse, watchLaterResponse] = await Promise.all([
                    apiService.getUserFavorites(),
                    apiService.getUserWatchLater()
                ]);
                
                const favoriteIds = favoritesResponse.data.favorites?.map(item => item.tmdbId) || [];
                const watchLaterIds = watchLaterResponse.data.watchLater?.map(item => item.tmdbId) || [];
                
                setFavorites(new Set(favoriteIds));
                setWatchLater(new Set(watchLaterIds));
            } catch (error) {
                console.error('Error loading user lists:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadUserLists();
    }, [userInfo]);

    // Add to favorites
    const addToFavorites = async (tmdbId) => {
        if (!userInfo) {
            toast.error('Please log in to add to favorites');
            return false;
        }
        
        setActionLoading(prev => new Set([...prev, `favorite-${tmdbId}`]));
        
        try {
            await apiService.addToFavorites(tmdbId);
            setFavorites(prev => new Set([...prev, tmdbId]));
            toast.success('Added to favorites');
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            toast.error('Failed to add to favorites');
            return false;
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(`favorite-${tmdbId}`);
                return newSet;
            });
        }
    };

    // Remove from favorites
    const removeFromFavorites = async (tmdbId) => {
        if (!userInfo) return false;
        
        setActionLoading(prev => new Set([...prev, `favorite-${tmdbId}`]));
        
        try {
            await apiService.removeFromFavorites(tmdbId);
            setFavorites(prev => {
                const newSet = new Set(prev);
                newSet.delete(tmdbId);
                return newSet;
            });
            toast.success('Removed from favorites');
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            toast.error('Failed to remove from favorites');
            return false;
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(`favorite-${tmdbId}`);
                return newSet;
            });
        }
    };

    // Add to watch later
    const addToWatchLater = async (tmdbId) => {
        if (!userInfo) {
            toast.error('Please log in to add to watch later');
            return false;
        }
        
        setActionLoading(prev => new Set([...prev, `watchlater-${tmdbId}`]));
        
        try {
            await apiService.addToWatchLater(tmdbId);
            setWatchLater(prev => new Set([...prev, tmdbId]));
            toast.success('Added to watch later');
            return true;
        } catch (error) {
            console.error('Error adding to watch later:', error);
            toast.error('Failed to add to watch later');
            return false;
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(`watchlater-${tmdbId}`);
                return newSet;
            });
        }
    };

    // Remove from watch later
    const removeFromWatchLater = async (tmdbId) => {
        if (!userInfo) return false;
        
        setActionLoading(prev => new Set([...prev, `watchlater-${tmdbId}`]));
        
        try {
            await apiService.removeFromWatchLater(tmdbId);
            setWatchLater(prev => {
                const newSet = new Set(prev);
                newSet.delete(tmdbId);
                return newSet;
            });
            toast.success('Removed from watch later');
            return true;
        } catch (error) {
            console.error('Error removing from watch later:', error);
            toast.error('Failed to remove from watch later');
            return false;
        } finally {
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(`watchlater-${tmdbId}`);
                return newSet;
            });
        }
    };

    // Toggle favorites
    const toggleFavorite = async (tmdbId) => {
        if (favorites.has(tmdbId)) {
            return await removeFromFavorites(tmdbId);
        } else {
            return await addToFavorites(tmdbId);
        }
    };

    // Toggle watch later
    const toggleWatchLater = async (tmdbId) => {
        if (watchLater.has(tmdbId)) {
            return await removeFromWatchLater(tmdbId);
        } else {
            return await addToWatchLater(tmdbId);
        }
    };

    // Check if item is in favorites
    const isFavorite = (tmdbId) => favorites.has(tmdbId);

    // Check if item is in watch later
    const isInWatchLater = (tmdbId) => watchLater.has(tmdbId);

    // Check if action is loading
    const isActionLoading = (action, tmdbId) => actionLoading.has(`${action}-${tmdbId}`);

    return {
        favorites,
        watchLater,
        loading,
        addToFavorites,
        removeFromFavorites,
        addToWatchLater,
        removeFromWatchLater,
        toggleFavorite,
        toggleWatchLater,
        isFavorite,
        isInWatchLater,
        isActionLoading
    };
}; 