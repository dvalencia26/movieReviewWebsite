import { apiSlice } from "./apiSlice";
import { TMDB_URL } from "../constants";

export const tmdbApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPopularMovies: builder.query({
            query: ({ page = 1, batchSize = 1 }) => ({
                url: `${TMDB_URL}/popular?page=${page}&batch_size=${batchSize}`,
                method: "GET",
            }),
            providesTags: (result, error, { page }) => [
                { type: 'PopularMovies', id: page },
                { type: 'PopularMovies', id: 'LIST' }
            ],
            // Keep data for 10 minutes
            keepUnusedDataFor: 600,
            // Transform response to cache multiple pages
            transformResponse: (response, meta, { page, batchSize }) => {
                return {
                    ...response,
                    currentPage: page,
                    batchSize: batchSize || 1
                };
            },
        }),
        getNowPlayingMovies: builder.query({
            query: ({ page = 1, batchSize = 1 }) => ({
                url: `${TMDB_URL}/now_playing?page=${page}&batch_size=${batchSize}`,
                method: "GET",
            }),
            providesTags: (result, error, { page }) => [
                { type: 'NowPlayingMovies', id: page },
                { type: 'NowPlayingMovies', id: 'LIST' }
            ],
            keepUnusedDataFor: 600,
            transformResponse: (response, meta, { page, batchSize }) => {
                return {
                    ...response,
                    currentPage: page,
                    batchSize: batchSize || 1
                };
            },
        }),
        getUpcomingMovies: builder.query({
            query: ({ page = 1, batchSize = 1 }) => ({
                url: `${TMDB_URL}/upcoming?page=${page}&batch_size=${batchSize}`,
                method: "GET",
            }),
            providesTags: (result, error, { page }) => [
                { type: 'UpcomingMovies', id: page },
                { type: 'UpcomingMovies', id: 'LIST' }
            ],
            keepUnusedDataFor: 600,
            transformResponse: (response, meta, { page, batchSize }) => {
                return {
                    ...response,
                    currentPage: page,
                    batchSize: batchSize || 1
                };
            },
        }),
        getTmdbTopRatedMovies: builder.query({
            query: ({ page = 1, batchSize = 1 }) => ({
                url: `${TMDB_URL}/top_rated?page=${page}&batch_size=${batchSize}`,
                method: "GET",
            }),
            providesTags: (result, error, { page }) => [
                { type: 'TopRatedMovies', id: page },
                { type: 'TopRatedMovies', id: 'LIST' }
            ],
            keepUnusedDataFor: 600,
            transformResponse: (response, meta, { page, batchSize }) => {
                return {
                    ...response,
                    currentPage: page,
                    batchSize: batchSize || 1
                };
            },
        }),
        searchMovies: builder.query({
            query: ({ query, page = 1 }) => ({
                url: `${TMDB_URL}/search?q=${encodeURIComponent(query)}&page=${page}`,
                method: "GET",
            }),
            providesTags: (result, error, { query, page }) => [
                { type: 'SearchMovies', id: `${query}-${page}` },
                { type: 'SearchMovies', id: 'LIST' }
            ],
            keepUnusedDataFor: 300, // 5 minutes for search results
        }),
        discoverMovies: builder.query({
            query: ({ genre, sortBy, page = 1 }) => ({
                url: `${TMDB_URL}/discover?genre=${genre}&sortBy=${sortBy}&page=${page}`,
                method: "GET",
            }),
            providesTags: (result, error, { genre, sortBy, page }) => [
                { type: 'DiscoverMovies', id: `${genre}-${sortBy}-${page}` },
                { type: 'DiscoverMovies', id: 'LIST' }
            ],
            keepUnusedDataFor: 600,
        }),
        getMovieGenres: builder.query({
            query: () => ({
                url: `${TMDB_URL}/genres`,
                method: "GET",
            }),
            providesTags: [{ type: 'MovieGenres', id: 'LIST' }],
            keepUnusedDataFor: 3600, // 1 hour for genres
        }),
        getTmdbMovieDetails: builder.query({
            query: (tmdbId) => ({
                url: `${TMDB_URL}/${tmdbId}`,
                method: "GET",
            }),
            providesTags: (result, error, tmdbId) => [
                { type: 'MovieDetails', id: tmdbId }
            ],
            keepUnusedDataFor: 600,
        }),
    }),
});

// Export hooks for using the queries
export const {
    useGetPopularMoviesQuery,
    useGetNowPlayingMoviesQuery,
    useGetUpcomingMoviesQuery,
    useGetTmdbTopRatedMoviesQuery,
    useSearchMoviesQuery,
    useDiscoverMoviesQuery,
    useGetMovieGenresQuery,
    useGetTmdbMovieDetailsQuery,
    useLazyGetPopularMoviesQuery,
    useLazyGetNowPlayingMoviesQuery,
    useLazyGetUpcomingMoviesQuery,
    useLazyGetTmdbTopRatedMoviesQuery,
    useLazySearchMoviesQuery,
    useLazyDiscoverMoviesQuery,
    usePrefetch,
} = tmdbApiSlice;

// Helper function to prefetch adjacent pages
export const prefetchAdjacentPages = (dispatch, currentPage, activeTab, totalPages) => {
    // Prefetch next page
    if (currentPage < totalPages) {
        const nextPage = currentPage + 1;
        switch (activeTab) {
            case 'popular':
                dispatch(tmdbApiSlice.util.prefetch('getPopularMovies', { page: nextPage }, { force: false }));
                break;
            case 'now_playing':
                dispatch(tmdbApiSlice.util.prefetch('getNowPlayingMovies', { page: nextPage }, { force: false }));
                break;
            case 'upcoming':
                dispatch(tmdbApiSlice.util.prefetch('getUpcomingMovies', { page: nextPage }, { force: false }));
                break;
            case 'top_rated':
                dispatch(tmdbApiSlice.util.prefetch('getTmdbTopRatedMovies', { page: nextPage }, { force: false }));
                break;
        }
    }
    
    // Prefetch previous page
    if (currentPage > 1) {
        const prevPage = currentPage - 1;
        switch (activeTab) {
            case 'popular':
                dispatch(tmdbApiSlice.util.prefetch('getPopularMovies', { page: prevPage }, { force: false }));
                break;
            case 'now_playing':
                dispatch(tmdbApiSlice.util.prefetch('getNowPlayingMovies', { page: prevPage }, { force: false }));
                break;
            case 'upcoming':
                dispatch(tmdbApiSlice.util.prefetch('getUpcomingMovies', { page: prevPage }, { force: false }));
                break;
            case 'top_rated':
                dispatch(tmdbApiSlice.util.prefetch('getTmdbTopRatedMovies', { page: prevPage }, { force: false }));
                break;
        }
    }
}; 