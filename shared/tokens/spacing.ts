/**
 * SKYFIRE DESIGN SYSTEM - SPACING TOKENS
 * 
 * Source of truth extracted from web/src/styles/tokens.css
 * Used by both web and mobile apps
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-30
 */

// Spacing values in pixels (for React Native)
export const spacing = {
  // ========================================
  // BASE SPACING
  // ========================================
  xs: 4,      // --spacing-xs: 0.25rem
  tight: 8,   // --spacing-tight: 0.5rem (tabs, labels)
  sm: 12,     // --spacing-sm: 0.75rem
  base: 16,   // --spacing: 1rem (DEFAULT)
  md: 20,     // --spacing-md: 1.25rem
  loose: 24,  // --spacing-loose: 1.5rem (sections)
  wide: 32,   // --spacing-wide: 2rem (major sections)
  xl: 40,     // Extra large
  xxl: 48,    // Extra extra large
} as const;

// ========================================
// BORDER RADIUS
// ========================================
export const radius = {
  sm: 4,      // --radius-sm: 0.25rem
  md: 8,      // --radius-md: 0.5rem (DEFAULT)
  lg: 12,     // --radius-lg: 0.75rem
  xl: 16,     // --radius-xl: 1rem
  pill: 9999, // --radius-pill: 9999px (fully rounded)
} as const;

// ========================================
// LAYOUT SIZING
// ========================================
export const layout = {
  // Sidebar widths
  sidebarCollapsed: 64,
  sidebarExpanded: 280,
  
  // Header heights
  headerHeight: 64,
  mobileHeaderHeight: 56,
  
  // Container max widths
  containerSm: 640,
  containerMd: 768,
  containerLg: 1024,
  containerXl: 1280,
  
  // Touch targets (minimum for accessibility)
  minTouchTarget: 44,
  
  // Input heights
  inputHeightSm: 32,
  inputHeightMd: 40,
  inputHeightLg: 48,
} as const;

// Type exports
export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type LayoutKey = keyof typeof layout;

// Helper functions
export const getSpacing = (key: SpacingKey): number => spacing[key];
export const getRadius = (key: RadiusKey): number => radius[key];

export default { spacing, radius, layout };
