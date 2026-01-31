/**
 * SKYFIRE DESIGN SYSTEM - SHADOW TOKENS
 * 
 * Source of truth extracted from web/src/styles/tokens.css
 * Used by both web and mobile apps
 * 
 * Note: React Native shadows work differently on iOS vs Android.
 * These provide cross-platform shadow definitions.
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-30
 */

import { Platform, ViewStyle } from 'react-native';

// ========================================
// SHADOW DEFINITIONS (Platform-aware)
// ========================================

// iOS shadow properties
interface IOSShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
}

// Android elevation
interface AndroidShadow {
  elevation: number;
}

// Combined shadow type
type CrossPlatformShadow = IOSShadow & AndroidShadow;

// Shadow presets
export const shadows: Record<string, CrossPlatformShadow> = {
  // --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1)
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2)
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.3)
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  
  // Extra large shadow for modals
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

// ========================================
// GLOW EFFECTS (Colored shadows)
// ========================================
export const glows = {
  // --glow-blue: 0 0 20px rgba(14, 165, 233, 0.3)
  blue: {
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  
  // --glow-orange: 0 0 20px rgba(253, 115, 50, 0.3)
  orange: {
    shadowColor: '#FD7332',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  
  // Success glow
  success: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  
  // Error glow
  error: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get platform-specific shadow styles
 * On iOS, returns full shadow. On Android, returns elevation.
 */
export const getShadow = (key: keyof typeof shadows): Partial<ViewStyle> => {
  const shadow = shadows[key];
  
  if (Platform.OS === 'android') {
    return { elevation: shadow.elevation };
  }
  
  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
  };
};

/**
 * Get platform-specific glow styles
 */
export const getGlow = (key: keyof typeof glows): Partial<ViewStyle> => {
  const glow = glows[key];
  
  if (Platform.OS === 'android') {
    // Android doesn't support colored shadows well, use elevation
    return { elevation: glow.elevation };
  }
  
  return {
    shadowColor: glow.shadowColor,
    shadowOffset: glow.shadowOffset,
    shadowOpacity: glow.shadowOpacity,
    shadowRadius: glow.shadowRadius,
  };
};

// Type exports
export type ShadowKey = keyof typeof shadows;
export type GlowKey = keyof typeof glows;

export default { shadows, glows, getShadow, getGlow };
