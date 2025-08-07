import { apiSlice } from "./apiSlice";
import { MOVIES_URL } from "../constants";

export const moviesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMoviesWithReviews: builder.query({
            query: ({ page = 1, limit = 20, search, genre, sortBy } = {}) => ({
                url: `${MOVIES_URL}/with-reviews`,
                method: "GET",
                params: { page, limit, search, genre, sortBy },
            }),
            providesTags: ["Movies"],
        }),
        getFeaturedMovies: builder.query({
            query: (page = 1) => ({
                url: `${MOVIES_URL}/featured?page=${page}`,
                method: "GET",
            }),
            providesTags: ["Movies"],
        }),
        getTopRatedMovies: builder.query({
            query: (page = 1) => ({
                url: `${MOVIES_URL}/top-rated?page=${page}`,
                method: "GET",
            }),
            providesTags: ["Movies"],
        }),
        // New endpoint for admin's favorite movies (for home page)
        getAdminFavoriteMovies: builder.query({
            query: ({ limit = 8 } = {}) => ({
                url: `${MOVIES_URL}/admin-favorites?limit=${limit}`,
                method: "GET",
            }),
            providesTags: ["Movies"],
            keepUnusedDataFor: 600, // Cache for 10 minutes
        }),
        // New endpoint for highest rated movies from database (for home page)
        getHighestRatedMovies: builder.query({
            query: ({ limit = 8 } = {}) => ({
                url: `${MOVIES_URL}/highest-rated?limit=${limit}`,
                method: "GET",
            }),
            providesTags: ["Movies"],
            keepUnusedDataFor: 600, // Cache for 10 minutes
        }),
        // New endpoint for recently reviewed movies (for home page)
        getRecentlyReviewedMovies: builder.query({
            query: ({ limit = 6 } = {}) => ({
                url: `${MOVIES_URL}/recently-reviewed?limit=${limit}`,
                method: "GET",
            }),
            providesTags: ["Movies"],
            keepUnusedDataFor: 300, // Cache for 5 minutes
        }),
        getMovieDetails: builder.query({
            query: (tmdbId) => ({
                url: `${MOVIES_URL}/${tmdbId}`,
                method: "GET",
            }),
            providesTags: (result, error, tmdbId) => [
                { type: "Movies", id: tmdbId },
                { type: "Reviews", id: `movie-${tmdbId}` }
            ],
            // Cache movie details for 10 minutes since they don't change often
            keepUnusedDataFor: 600,
        }),
        getMovieReviews: builder.query({
            query: ({ tmdbId, page = 1 }) => ({
                url: `${MOVIES_URL}/${tmdbId}/reviews?page=${page}`,
                method: "GET",
            }),
            providesTags: (result, error, { tmdbId, page }) => [
                { type: "Reviews", id: `${tmdbId}-${page}` },
                { type: "Reviews", id: `movie-${tmdbId}` }
            ],
            // Cache reviews for 5 minutes since they're updated more frequently
            keepUnusedDataFor: 300,
        }),
        getReviewComments: builder.query({
            query: ({ reviewId, page = 1 }) => ({
                url: `${MOVIES_URL}/reviews/${reviewId}/comments?page=${page}`,
                method: "GET",
            }),
            providesTags: (result, error, { reviewId, page }) => [
                { type: "Comments", id: `${reviewId}-${page}` }
            ],
            keepUnusedDataFor: 300,
        }),
        createReview: builder.mutation({
            query: ({ tmdbId, reviewData }) => ({
                url: `${MOVIES_URL}/${tmdbId}/reviews`,
                method: "POST",
                body: reviewData,
            }),
            invalidatesTags: (result, error, { tmdbId }) => [
                { type: "Movies", id: tmdbId },
                { type: "Reviews", id: `movie-${tmdbId}` },
                "Movies"
            ],
        }),
        addComment: builder.mutation({
            query: ({ reviewId, commentData }) => ({
                url: `${MOVIES_URL}/reviews/${reviewId}/comments`,
                method: "POST",
                body: commentData,
            }),
            invalidatesTags: (result, error, { reviewId }) => [
                { type: "Comments", id: `${reviewId}-1` }
            ],
        }),
        toggleReviewLike: builder.mutation({
            query: ({ reviewId }) => ({
                url: `${MOVIES_URL}/reviews/${reviewId}/like`,
                method: "POST",
            }),
            invalidatesTags: (result, error, { reviewId }) => [
                { type: "Reviews", id: `movie-${result?.tmdbId}` }
            ],
        }),
    }),
});

export const { 
    useGetMoviesWithReviewsQuery,
    useGetFeaturedMoviesQuery, 
    useGetTopRatedMoviesQuery,
    useGetAdminFavoriteMoviesQuery,
    useGetHighestRatedMoviesQuery,
    useGetRecentlyReviewedMoviesQuery,
    useGetMovieDetailsQuery,
    useGetMovieReviewsQuery,
    useGetReviewCommentsQuery,
    useCreateReviewMutation,
    useAddCommentMutation,
    useToggleReviewLikeMutation
} = moviesApiSlice; 