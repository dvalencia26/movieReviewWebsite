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
        // New endpoint for admin's watch later movies (for admin profile)
        getAdminWatchLaterMovies: builder.query({
            query: ({ limit = 8 } = {}) => ({
                url: `${MOVIES_URL}/admin-watch-later?limit=${limit}`,
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
                { type: "MovieDetails", id: tmdbId },
                { type: "Reviews", id: `movie-${tmdbId}` }
            ],
            // Cache movie details for 30 minutes since they don't change often
            keepUnusedDataFor: 1800,
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
            // Cache reviews for 15 minutes - reviews don't change that frequently
            keepUnusedDataFor: 900,
        }),
        getReviewComments: builder.query({
            query: ({ reviewId, page = 1 }) => ({
                url: `${MOVIES_URL}/reviews/${reviewId}/comments?page=${page}`,
                method: "GET",
            }),
            providesTags: (result, error, { reviewId, page }) => [
                { type: "Comments", id: `${reviewId}-${page}` }
            ],
            keepUnusedDataFor: 60, // Keep cache briefly to prevent blank screen during refetch
            refetchOnMountOrArgChange: false, // Avoid immediately overwriting optimistic update
        }),
        createReview: builder.mutation({
            query: ({ tmdbId, reviewData }) => ({
                url: `${MOVIES_URL}/${tmdbId}/reviews`,
                method: "POST",
                body: reviewData,
            }),
            invalidatesTags: (result, error, { tmdbId }) => [
                { type: "Movies", id: tmdbId },
                { type: "MovieDetails", id: tmdbId },
                { type: "Reviews", id: `movie-${tmdbId}` },
                { type: "Reviews", id: tmdbId },
                "Movies",
                "Reviews"
            ],
        }),
        addComment: builder.mutation({
            query: ({ reviewId, commentData }) => ({
                url: `${MOVIES_URL}/reviews/${reviewId}/comments`,
                method: "POST",
                body: commentData,
            }),
            async onQueryStarted({ reviewId, commentData }, { dispatch, getState, queryFulfilled }) {
                // Optimistically insert the new comment
                const state = getState();
                const username = state?.auth?.userInfo?.username || 'You';
                const tempId = `temp-${Date.now()}`;

                const patchResult = dispatch(
                    apiSlice.util.updateQueryData(
                        'getReviewComments',
                        { reviewId, page: 1 },
                        (draft) => {
                            if (!draft) return;
                            if (!Array.isArray(draft.comments)) draft.comments = [];
                            draft.comments.unshift({
                                _id: tempId,
                                reviewId,
                                content: commentData?.content || '',
                                parentComment: commentData?.parentComment || null,
                                likes: 0,
                                likedBy: [],
                                replyCount: 0,
                                isPublished: true,
                                author: { username },
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    )
                );

                try {
                    const { data } = await queryFulfilled;
                    // Replace temp comment with real one
                    const realComment = data?.comment || data;
                    if (realComment?._id) {
                        dispatch(
                            apiSlice.util.updateQueryData(
                                'getReviewComments',
                                { reviewId, page: 1 },
                                (draft) => {
                                    if (!draft) return;
                                    if (!Array.isArray(draft.comments)) draft.comments = [];
                                    const idxTemp = draft.comments.findIndex(c => c._id === tempId);
                                    if (idxTemp !== -1) {
                                        draft.comments[idxTemp] = realComment;
                                        return;
                                    }
                                    const exists = draft.comments.some(c => c._id === realComment._id);
                                    if (!exists) {
                                        draft.comments.unshift(realComment);
                                    }
                                }
                            )
                        );
                    }

                    // OPTIONAL: now that the server has accepted the write, do a gentle sync pass.
                    // This ensures counts/order are perfect without racing your optimistic UI.
                    dispatch(
                        moviesApiSlice.endpoints.getReviewComments.initiate(
                            { reviewId, page: 1 },
                            { forceRefetch: true }
                        )
                    );
                } catch (e) {
                    // Revert optimistic update on error
                    patchResult.undo();
                    console.error('Comment submission failed:', e);
                }
            },
            invalidatesTags: [], // don't auto-refetch and overwrite the optimistic list
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
        // Public total reviews count
        getTotalReviewsCount: builder.query({
            query: () => ({
                url: `${MOVIES_URL}/stats/total-reviews`,
                method: "GET",
            }),
            providesTags: ["Reviews"],
            keepUnusedDataFor: 1800,
        })
    }),
});

export const { 
    useGetMoviesWithReviewsQuery,
    useGetFeaturedMoviesQuery, 
    useGetTopRatedMoviesQuery,
    useGetAdminFavoriteMoviesQuery,
    useGetAdminWatchLaterMoviesQuery,
    useGetHighestRatedMoviesQuery,
    useGetRecentlyReviewedMoviesQuery,
    useGetMovieDetailsQuery,
    useGetMovieReviewsQuery,
    useGetReviewCommentsQuery,
    useCreateReviewMutation,
    useAddCommentMutation,
    useToggleReviewLikeMutation
 ,useGetTotalReviewsCountQuery} = moviesApiSlice;