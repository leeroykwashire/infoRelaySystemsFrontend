import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout, updateAccessToken } from '../features/auth/authSlice';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Base query with authentication and token refresh logic
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get access token from Redux state
    const token = getState().auth.accessToken;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Wrapper to handle token refresh on 401 errors
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get 401, try to refresh the token
  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;
    
    if (refreshToken) {
      // Try to get a new access token
      const refreshResult = await baseQuery(
        {
          url: '/token/refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult?.data) {
        // Store the new tokens
        api.dispatch(updateAccessToken(refreshResult.data));
        
        // Retry the original query with new access token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed - log out user
        api.dispatch(logout());
      }
    } else {
      // No refresh token available - log out
      api.dispatch(logout());
    }
  }
  
  return result;
};

// Create API slice with RTK Query
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Category', 'Item', 'Stock', 'GoodsReceived', 'GoodsIssue', 'GoodsReturn', 'GoodsReturn', 'Ledger'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/token/',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    getCurrentUser: builder.query({
      query: () => '/user/me/',
      providesTags: ['User'],
    }),
    
    // Category endpoints
    getCategories: builder.query({
      query: () => '/categories/',
      providesTags: ['Category'],
    }),
    
    createCategory: builder.mutation({
      query: (category) => ({
        url: '/categories/',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: ['Category'],
    }),
    
    updateCategory: builder.mutation({
      query: ({ id, ...category }) => ({
        url: `/categories/${id}/`,
        method: 'PUT',
        body: category,
      }),
      invalidatesTags: ['Category'],
    }),
    
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    
    // Item endpoints
    getItems: builder.query({
      query: (params) => ({
        url: '/items/',
        params,
      }),
      providesTags: ['Item'],
    }),
    
    createItem: builder.mutation({
      query: (item) => ({
        url: '/items/',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Item', 'Stock'],
    }),
    
    updateItem: builder.mutation({
      query: ({ id, ...item }) => ({
        url: `/items/${id}/`,
        method: 'PUT',
        body: item,
      }),
      invalidatesTags: ['Item', 'Stock'],
    }),
    
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `/items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item', 'Stock'],
    }),
    
    // Stock endpoints
    getStocks: builder.query({
      query: (params) => ({
        url: '/stocks/',
        params,
      }),
      providesTags: ['Stock'],
    }),
    
    // Goods Received endpoints
    getGoodsReceived: builder.query({
      query: (params) => ({
        url: '/goods-received/',
        params,
      }),
      providesTags: ['GoodsReceived'],
    }),
    
    createGoodsReceived: builder.mutation({
      query: (goods) => ({
        url: '/goods-received/',
        method: 'POST',
        body: goods,
      }),
      invalidatesTags: ['GoodsReceived', 'Stock', 'Ledger'],
    }),
    
    // Goods Issue endpoints
    getGoodsIssues: builder.query({
      query: (params) => ({
        url: '/goods-issues/',
        params,
      }),
      providesTags: ['GoodsIssue'],
    }),
    
    createGoodsIssue: builder.mutation({
      query: (issue) => ({
        url: '/goods-issues/',
        method: 'POST',
        body: issue,
      }),
      invalidatesTags: ['GoodsIssue', 'Stock', 'Ledger'],
    }),
    
    // Goods Return endpoints
    getGoodsReturns: builder.query({
      query: (params) => ({
        url: '/goods-returns/',
        params,
      }),
      providesTags: ['GoodsReturn'],
    }),
    
    createGoodsReturn: builder.mutation({
      query: (returnData) => ({
        url: '/goods-returns/',
        method: 'POST',
        body: returnData,
      }),
      invalidatesTags: ['GoodsReturn', 'Stock', 'Ledger'],
    }),
    
    updateGoodsReturn: builder.mutation({
      query: ({ id, ...returnData }) => ({
        url: `/goods-returns/${id}/`,
        method: 'PUT',
        body: returnData,
      }),
      invalidatesTags: ['GoodsReturn', 'Stock', 'Ledger'],
    }),
    
    deleteGoodsReturn: builder.mutation({
      query: (id) => ({
        url: `/goods-returns/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GoodsReturn', 'Stock', 'Ledger'],
    }),
    
    // Ledger endpoints
    getLedger: builder.query({
      query: (params) => ({
        url: '/ledger/',
        params,
      }),
      providesTags: ['Ledger'],
    }),
    
    // Report endpoints
    getStockReport: builder.query({
      query: (params) => ({
        url: '/reports/stock/',
        params,
      }),
    }),
    
    getIssuesReport: builder.query({
      query: (params) => ({
        url: '/reports/issues/',
        params,
      }),
    }),
    
    getLedgerReport: builder.query({
      query: (params) => ({
        url: '/reports/ledger/',
        params,
      }),
    }),
    
    // User management endpoints (Admin only)
    getUsers: builder.query({
      query: () => '/users/',
      providesTags: ['User'],
    }),
    
    createUser: builder.mutation({
      query: (user) => ({
        url: '/users/',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...user }) => ({
        url: `/users/${id}/`,
        method: 'PUT',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetStocksQuery,
  useGetGoodsReceivedQuery,
  useCreateGoodsReceivedMutation,
  useGetGoodsIssuesQuery,
  useCreateGoodsIssueMutation,
  useGetGoodsReturnsQuery,
  useCreateGoodsReturnMutation,
  useUpdateGoodsReturnMutation,
  useDeleteGoodsReturnMutation,
  useGetLedgerQuery,
  useGetStockReportQuery,
  useGetIssuesReportQuery,
  useGetLedgerReportQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = apiSlice;
