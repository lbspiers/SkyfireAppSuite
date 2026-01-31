/**
 * SKYFIRE DESIGN SYSTEM - SHARED TOKENS
 * 
 * This package contains the design tokens shared between
 * the web app (React) and mobile apps (React Native).
 * 
 * Source of truth: web/src/styles/tokens.css
 * 
 * Usage:
 *   import { colors, spacing, typography } from '@skyfire/shared';
 *   
 *   // Or individual imports:
 *   import { colors } from '@skyfire/shared/tokens/colors';
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-30
 */

// Re-export all tokens
export * from './colors';
export * from './spacing';
export * from './typography';
export * from './shadows';

// Named exports for convenience
export { default as colors } from './colors';
export { spacing, radius, layout } from './spacing';
export { fontSize, fontWeight, lineHeight, textStyles } from './typography';
export { shadows, glows, getShadow, getGlow } from './shadows';

// Export combined theme object
import colors from './colors';
import { spacing, radius, layout } from './spacing';
import { fontSize, fontWeight, lineHeight, textStyles } from './typography';
import { shadows, glows } from './shadows';

export const theme = {
  colors,
  spacing,
  radius,
  layout,
  fontSize,
  fontWeight,
  lineHeight,
  textStyles,
  shadows,
  glows,
} as const;

export default theme;
