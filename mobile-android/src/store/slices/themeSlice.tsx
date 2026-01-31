// src/slices/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { Appearance } from "react-native";

const lightTheme = {
  Backgroundcolor1: "#2E4161",
  Backgroundcolor2: "#0C1F3F",
};

const darkTheme = {
  Backgroundcolor1: "#2E4161",
  Backgroundcolor2: "#0C1F3F",
};

// Safely get system color scheme with fallback to prevent crashes on iOS 18.5
const getInitialColorScheme = () => {
  try {
    const scheme = Appearance.getColorScheme();
    return scheme || 'light'; // Fallback to 'light' if null
  } catch (error) {
    console.warn('Failed to get system color scheme, defaulting to light:', error);
    return 'light';
  }
};

const systemScheme = getInitialColorScheme();

const initialState = {
  theme: systemScheme === "dark" ? darkTheme : lightTheme,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === lightTheme ? darkTheme : lightTheme;
    },
    setSystemTheme: (state, action) => {
      state.theme = action.payload === "dark" ? darkTheme : lightTheme;
    },
  },
});

export const { toggleTheme, setSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;
