import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  resetToken: string | null;
}

interface SetTokensPayload {
  accessToken: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  rememberMe: false,
  loading: false,
  isAuthenticated: false,
  resetToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<SetTokensPayload>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken || null;
      state.rememberMe = action.payload.rememberMe || false;
      state.isAuthenticated = !!action.payload.accessToken;
    },
    setResetToken(state, action: PayloadAction<string>) {
      state.resetToken = action.payload;
    },
    clearResetToken(state) {
      state.resetToken = null;
    },
    clearTokens(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.rememberMe = false;
      state.isAuthenticated = false;
      state.resetToken = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    // Hydrate state from localStorage on app init
    hydrateAuth(state, action: PayloadAction<Partial<AuthState>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setTokens,
  clearTokens,
  setLoading,
  setResetToken,
  clearResetToken,
  hydrateAuth
} = authSlice.actions;

export default authSlice.reducer;
