import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import apiService from '../services/api';
import { toast } from 'sonner';

export const useFavorites = ({ autoLoad = false } = {}) => {
    const { userInfo } = useSelector((state) => state.auth);
    const [favorites, setFavorites] = useState(new Set());
    const [watchLater, setWatchLater] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(new Set());
    const [hasLoaded, setHasLoaded] = useState(false);

    // Shared loader exposed for on-demand fetching
    const loadLists = useCallback(async () => {
        if (!userInfo || hasLoaded) return;
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
            setHasLoaded(true);
        } catch (error) {
            console.error('Error loading user lists:', error);
        } finally {
            setLoading(false);
        }
    }, [userInfo, hasLoaded]);

    // Auto-load only when explicitly enabled (to avoid global calls)
    useEffect(() => {
        if (autoLoad) {
            loadLists();
        }
    }, [autoLoad, loadLists]);

    // Add to favorites - Memoized to prevent unnecessary re-renders
    const addToFavorites = useCallback(async (tmdbId) => {
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
            // Treat idempotent backend 400s as success for UI sync
            const already = error?.response?.status === 400 && (
                error?.response?.data?.error === 'Already favorited' ||
                /already in favorites/i.test(error?.response?.data?.message || '')
            );
            if (already) {
                setFavorites(prev => new Set([...prev, tmdbId]));
                return true;
            }
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
    }, [userInfo]);

    // Remove from favorites - Memoized to prevent unnecessary re-renders
    const removeFromFavorites = useCallback(async (tmdbId) => {
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
    }, [userInfo]);

    // Add to watch later - Memoized to prevent unnecessary re-renders
    const addToWatchLater = useCallback(async (tmdbId) => {
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
            const already = error?.response?.status === 400 && (
                error?.response?.data?.error === 'Already in watch later' ||
                /already in watch later/i.test(error?.response?.data?.message || '')
            );
            if (already) {
                setWatchLater(prev => new Set([...prev, tmdbId]));
                return true;
            }
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
    }, [userInfo]);

    // Remove from watch later - Memoized to prevent unnecessary re-renders
    const removeFromWatchLater = useCallback(async (tmdbId) => {
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
    }, [userInfo]);

    // Toggle favorites - Memoized to prevent unnecessary re-renders
    const toggleFavorite = useCallback(async (tmdbId) => {
        if (favorites.has(tmdbId)) {
            return await removeFromFavorites(tmdbId);
        } else {
            return await addToFavorites(tmdbId);
        }
    }, [favorites, removeFromFavorites, addToFavorites]);

    // Toggle watch later - Memoized to prevent unnecessary re-renders
    const toggleWatchLater = useCallback(async (tmdbId) => {
        if (watchLater.has(tmdbId)) {
            return await removeFromWatchLater(tmdbId);
        } else {
            return await addToWatchLater(tmdbId);
        }
    }, [watchLater, removeFromWatchLater, addToWatchLater]);

    // Check if item is in favorites - Memoized for performance
    const isFavorite = useCallback((tmdbId) => favorites.has(tmdbId), [favorites]);

    // Check if item is in watch later - Memoized for performance  
    const isInWatchLater = useCallback((tmdbId) => watchLater.has(tmdbId), [watchLater]);

    // Check if action is loading - Memoized for performance
    const isActionLoading = useCallback((action, tmdbId) => actionLoading.has(`${action}-${tmdbId}`), [actionLoading]);

    return {
        favorites,
        watchLater,
        loading,
        hasLoaded,
        loadLists,
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