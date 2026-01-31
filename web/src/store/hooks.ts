import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors
export const useAuth = () => useAppSelector((state) => state.auth);
export const useIsAuthenticated = () => useAppSelector((state) => state.auth.isAuthenticated);
export const useAccessToken = () => useAppSelector((state) => state.auth.accessToken);
