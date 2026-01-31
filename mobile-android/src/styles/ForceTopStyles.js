// src/styles/ForceTopStyles.js - Force all pages to start at absolute top
import { StyleSheet, Platform, StatusBar } from "react-native";

export const getStatusBarHeight = () => {
  if (Platform.OS === "android") {
    return StatusBar.currentHeight || 0;
  }
  return 44; // iOS default
};

export const STATUS_BAR_HEIGHT = getStatusBarHeight();

// Main styles to force content to start at top
export const FORCE_TOP_STYLES = StyleSheet.create({
  // Apply this to your main screen container
  screenContainer: {
    flex: 1,
    paddingTop: 0,
    marginTop: 0,
    position: "relative",
  },

  // Apply this to gradients that should bleed to top
  fullScreenGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Apply this to any container that should start at absolute top
  absoluteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  // Use this for content that needs to avoid status bar overlap
  contentBelowStatusBar: {
    paddingTop: STATUS_BAR_HEIGHT,
  },

  // Use this for headers that should account for status bar
  headerWithStatusBar: {
    paddingTop: STATUS_BAR_HEIGHT,
  },

  // Zero out any spacing that might be applied
  noTopSpacing: {
    paddingTop: 0,
    marginTop: 0,
  },

  // For FlatList/ScrollView content that starts below a fixed header
  contentBelowFixedHeader: (headerHeight) => ({
    paddingTop: headerHeight + STATUS_BAR_HEIGHT,
  }),

  // Alternative: content below header without status bar (if header handles it)
  contentBelowHeader: (headerHeight) => ({
    paddingTop: headerHeight,
  }),
});

// Quick apply function - use this on any screen to force top start
export const forceScreenToTop = {
  flex: 1,
  paddingTop: 0,
  marginTop: 0,
  position: "relative",
};

// Helper hook for getting dimensions
export const useForceTop = () => {
  return {
    statusBarHeight: STATUS_BAR_HEIGHT,
    screenContainer: FORCE_TOP_STYLES.screenContainer,
    fullScreenGradient: FORCE_TOP_STYLES.fullScreenGradient,
    contentBelowStatusBar: FORCE_TOP_STYLES.contentBelowStatusBar,
    headerWithStatusBar: FORCE_TOP_STYLES.headerWithStatusBar,
    noTopSpacing: FORCE_TOP_STYLES.noTopSpacing,
  };
};
