// Common styles for consistent UI across the app
import { Platform } from 'react-native';
import { verticalScale } from '../utils/responsive';

// Consistent bottom padding for scrollable content
// Ensures content at the bottom is always scrollable and visible
export const SCROLL_PADDING = {
  // Main content container padding
  contentContainer: {
    paddingBottom: Platform.select({
      ios: 120, // Extra space for iOS (accounts for home indicator)
      android: 100, // Standard extra space for Android
    }),
  },
  
  // For screens with tab navigation (already has some bottom space)
  withTabBar: {
    paddingBottom: Platform.select({
      ios: 150, // Extra padding when tab bar is present
      android: 130,
    }),
  },
  
  // Minimal padding for modals or sheets
  minimal: {
    paddingBottom: 50,
  },
  
  // For FlatList components
  flatList: {
    contentContainerStyle: {
      paddingBottom: Platform.select({
        ios: 120,
        android: 100,
      }),
    },
  },
};

// Common ScrollView props for consistency
export const commonScrollViewProps = {
  showsVerticalScrollIndicator: false,
  bounces: true,
  overScrollMode: 'always' as const,
  scrollEventThrottle: 16,
  contentInsetAdjustmentBehavior: 'automatic' as const,
};

// Export a helper to merge with existing styles
export const withScrollPadding = (existingStyle: any = {}, useTabBar = false) => ({
  ...existingStyle,
  ...(useTabBar ? SCROLL_PADDING.withTabBar : SCROLL_PADDING.contentContainer),
});