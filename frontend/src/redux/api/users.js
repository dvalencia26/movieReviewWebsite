import { apiSlice } from "./apiSlice";
import { USERS_URL } from "../constants";

// Create a new API slice for users
export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (data) => ({
                url: `${USERS_URL}/auth`,
                method: 'POST',
                body: data,
            }),
        }),
        // We use mutation because we are sending data to the server
        register: builder.mutation({
            query: (data) => ({
                url: `${USERS_URL}`,
                method: 'POST',
                body: data,
            }),
        }),
        logout: builder.mutation({
            query: () => ({
                url: `${USERS_URL}/logout`,
                method: 'POST',
            }),
        }),
        profile: builder.mutation({
            query: (data) => ({
                url: `${USERS_URL}/profile`,
                method: 'PUT',
                body: data,
            }),
        }),
        getAllUsers: builder.query({
            query: () => ({
                url: `${USERS_URL}`,
                method: 'GET',
            }),
            providesTags: ["Users"],
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useProfileMutation, useGetAllUsersQuery } = userApiSlice;
