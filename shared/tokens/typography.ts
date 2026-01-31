/**
 * SKYFIRE DESIGN SYSTEM - TYPOGRAPHY TOKENS
 * 
 * Source of truth extracted from web/src/styles/tokens.css
 * Used by both web and mobile apps
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-30
 */

// ========================================
// FONT SIZES (in pixels for React Native)
// ========================================
export const fontSize = {
  xs: 12,     // --text-xs: 0.75rem
  sm: 14,     // --text-sm: 0.875rem
  base: 16,   // --text-base: 1rem
  lg: 18,     // --text-lg: 1.125rem
  xl: 20,     // --text-xl: 1.25rem
  '2xl': 24,  // --text-2xl: 1.5rem
  '3xl': 30,  // --text-3xl: 1.875rem
  '4xl': 36,  // --text-4xl: 2.25rem
} as const;

// ========================================
// LINE HEIGHTS (as multipliers)
// ========================================
export const lineHeight = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ========================================
// FONT WEIGHTS
// ========================================
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// ========================================
// FONT FAMILY
// ========================================
export const fontFamily = {
  // React Native uses system fonts by default
  // These are for reference/web compatibility
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Fira Code", "SF Mono", Monaco, "Cascadia Code", monospace',
} as const;

// ========================================
// LETTER SPACING (React Native: number)
// ========================================
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
} as const;

// ========================================
// TEXT STYLE PRESETS (for React Native StyleSheet)
// ========================================
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.snug,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  
  // Body text
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  
  // Labels and captions
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.snug,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  
  // Buttons
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.tight,
  },
} as const;

// Type exports
export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
export type TextStyleKey = keyof typeof textStyles;

export default { fontSize, lineHeight, fontWeight, fontFamily, letterSpacing, textStyles };
