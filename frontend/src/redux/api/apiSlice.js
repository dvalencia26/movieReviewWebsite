import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";

// Determine the API base URL
const isProduction = import.meta.env.MODE === 'production';
const apiBaseUrl = isProduction 
    ? 'https://wagwebsite-backend.onrender.com/api/v1'  // Hardcoded for production
    : BASE_URL; // Relative path for development

console.log('🔧 Redux API - Mode:', import.meta.env.MODE);
console.log('🔧 Redux API - Using baseUrl:', apiBaseUrl);

// Base query with authentication headers and error handling
const baseQuery = fetchBaseQuery({
    baseUrl: apiBaseUrl,
    credentials: 'include', // Required for cross-site cookies
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.userInfo?.token;
        
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        
        return headers;
    },
});

// Enhanced base query with error handling
const baseQueryWithAuth = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    
    if (result.error) {
        console.error('❌ API Error:', result.error);
        
        // Handle authentication errors
        if (result.error.status === 401) {
            console.warn('🔐 Authentication failed - token may be expired');
            // Could dispatch logout here if needed
        }
        
        // Handle other errors
        if (result.error.status === 'FETCH_ERROR') {
            console.error('🌐 Network error - check if backend is running');
        }
    }
    
    return result;
};

export const apiSlice = createApi({
    baseQuery: baseQueryWithAuth,
    tagTypes: ['User', 'Users', 'Movies', 'Reviews', 'Comments', 'Genres', 'Dashboard', 'PopularMovies', 'NowPlayingMovies', 'UpcomingMovies', 'TopRatedMovies', 'SearchMovies', 'DiscoverMovies', 'MovieGenres', 'MovieDetails'],
    endpoints: () => ({}),
});
