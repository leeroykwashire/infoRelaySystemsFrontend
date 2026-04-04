import { createSlice } from '@reduxjs/toolkit';

// Get initial state from localStorage if available
const loadAuthState = () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    
    if (refreshToken && userStr) {
      return {
        user: JSON.parse(userStr),
        refreshToken: refreshToken,
        accessToken: null, // Access token stored in memory only for security
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
  }
  
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

const initialState = loadAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set credentials after successful login
    setCredentials: (state, action) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.isAuthenticated = true;
      
      // Persist refresh token and user info to localStorage
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    },
    
    // Update access token after refresh
    updateAccessToken: (state, action) => {
      state.accessToken = action.payload.access;
      
      // Update refresh token if provided (token rotation)
      if (action.payload.refresh) {
        state.refreshToken = action.payload.refresh;
        localStorage.setItem('refreshToken', action.payload.refresh);
      }
    },
    
    // Clear all auth data on logout
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      
      // Clear localStorage
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;

export default authSlice.reducer;

// Selectors for easy access to auth state
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectIsAdmin = (state) => state.auth.user?.is_admin || false;
export const selectUserRole = (state) => state.auth.user?.role || null;
