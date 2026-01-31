import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { equipmentCacheManager } from "../../utils/equipmentCacheManager";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  checkbox: boolean;
  loading: boolean; // Add loading state if needed
  isAuthenticated: boolean; // Add authentication state if needed
  resetToken: string | null; // Add reset token state if needed if needed
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  checkbox: false,
  loading: false, // Add loading state if needed
  isAuthenticated: false,
  resetToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<any>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.checkbox = action.payload.checkbox;
      state.isAuthenticated = !!state.accessToken; // Add authentication state if needed

      // Clear equipment cache on login to fetch fresh data
      equipmentCacheManager.clearAllCache();
    },
    setResetToken(state, action: PayloadAction<{ resetToken: string }>) {
      state.resetToken = action.payload.resetToken; // Add reset token state if needed if needed
    },
    clearTokens(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.checkbox = false;
      state.isAuthenticated = false; // Add authentication state if needed

      // Clear equipment cache on logout to ensure fresh data on next login
      equipmentCacheManager.clearAllCache();
    },
    setLoading(state, action: PayloadAction<any>) {
      state.loading = action.payload;
    },
  },
});

export const { setTokens, clearTokens, setLoading, setResetToken } =
  authSlice.actions;
export default authSlice.reducer;
