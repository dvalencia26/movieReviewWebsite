import { apiSlice } from "./apiSlice";
import { GENRE_URL } from "../constants";

export const genreApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createGenre: builder.mutation({
            query: (newGenre) => ({
                url: `${GENRE_URL}`,
                method: "POST",
                body: newGenre,
            }),
            invalidatesTags: ["Genres"],
        }),
        updateGenre: builder.mutation({
            query: ({id, updateGenre}) => ({
                url: `${GENRE_URL}/${id}`,
                method: "PUT",
                body: updateGenre,
            }),
            invalidatesTags: ["Genres"],
        }),
        removeGenre: builder.mutation({
            query: (id) => ({
                url: `${GENRE_URL}/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Genres"],
        }),
        getAllGenres: builder.query({
            query: () => ({
                url: `${GENRE_URL}/genres`,
                method: "GET",
            }),
            providesTags: ["Genres"],
        }),
    }),
});

export const { 
    useCreateGenreMutation, 
    useUpdateGenreMutation, 
    useRemoveGenreMutation, 
    useGetAllGenresQuery
} = genreApiSlice;