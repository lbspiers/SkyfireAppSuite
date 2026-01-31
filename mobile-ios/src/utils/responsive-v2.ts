// src/utils/responsive-v2.ts
// NEW RESPONSIVE SYSTEM - Industry Best Practices
// Based on comprehensive audit findings (RESPONSIVE_DESIGN_AUDIT_REPORT.md)

import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

// ──────────────────────────────────────────────────────────
// 1. CORRECTED BASELINE (iPhone 8 / average phone)
// ──────────────────────────────────────────────────────────
const BASELINE = {
  width: 375,   // DP (device-independent pixels) - iPhone 8/X/11/12/13 mini
  height: 667,  // DP - iPhone 8
};

// ──────────────────────────────────────────────────────────
// 2. DEVICE CLASS BREAKPOINTS
// ──────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  SMALL_PHONE: 350,
  PHONE: 600,
  TABLET: 960,
  LARGE_TABLET: 1280,
} as const;

export type DeviceClass = 'small-phone' | 'phone' | 'tablet' | 'large-tablet';

// ──────────────────────────────────────────────────────────
// 3. DEVICE CLASS DETECTION
// ──────────────────────────────────────────────────────────
export function getDeviceClass(width: number): DeviceClass {
  if (width < BREAKPOINTS.SMALL_PHONE) return 'small-phone';
  if (width < BREAKPOINTS.PHONE) return 'phone';
  if (width < BREAKPOINTS.TABLET) return 'tablet';
  return 'large-tablet';
}

export function isTablet(width?: number): boolean {
  const w = width ?? Dimensions.get('window').width;
  return w >= BREAKPOINTS.PHONE;
}

// ──────────────────────────────────────────────────────────
// 4. SCALING CONFIGURATION
// ──────────────────────────────────────────────────────────
const SCALE_CONFIG = {
  'small-phone': {
    factor: 0.9,      // Slightly smaller than baseline
    fontFactor: 0.95,  // Don't shrink fonts too much
  },
  'phone': {
    factor: 1.0,       // Baseline
    fontFactor: 1.0,
  },
  'tablet': {
    factor: 1.15,      // Moderate growth
    fontFactor: 1.1,   // Fonts grow less
  },
  'large-tablet': {
    factor: 1.3,       // Larger tablets
    fontFactor: 1.15,  // Fonts grow conservatively
  },
};

// ──────────────────────────────────────────────────────────
// 5. CORE SCALING FUNCTIONS
// ──────────────────────────────────────────────────────────
function computeScaleFactor(
  width: number,
  height: number,
  type: 'layout' | 'font' = 'layout'
): number {
  const deviceClass = getDeviceClass(width);
  const config = SCALE_CONFIG[deviceClass];

  // Aspect-ratio aware scaling
  const widthRatio = width / BASELINE.width;
  const heightRatio = height / BASELINE.height;
  const geometricMean = Math.sqrt(widthRatio * heightRatio);

  // Apply device-class specific factor
  const factor = type === 'font' ? config.fontFactor : config.factor;

  return geometricMean * factor;
}

// ──────────────────────────────────────────────────────────
// 6. SCALING UTILITIES
// ──────────────────────────────────────────────────────────
export interface ResponsiveUtils {
  // Device info
  deviceClass: DeviceClass;
  isTablet: boolean;
  isPhone: boolean;
  width: number;
  height: number;

  // Scaling functions
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  fontSize: (size: number) => number;

  // Spacing helpers
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  // Touch targets
  touchable: (size: number) => number;

  // Percentage helpers
  wp: (percentage: string | number) => number;
  hp: (percentage: string | number) => number;
}

// ──────────────────────────────────────────────────────────
// 7. HOOK IMPLEMENTATION
// ──────────────────────────────────────────────────────────
export function useResponsive(): ResponsiveUtils {
  const { width, height } = useWindowDimensions();
  const deviceClass = getDeviceClass(width);

  const layoutFactor = computeScaleFactor(width, height, 'layout');
  const fontFactor = computeScaleFactor(width, height, 'font');

  const scale = (size: number) => size * layoutFactor;
  const verticalScale = (size: number) => size * layoutFactor;

  const moderateScale = (size: number, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
  };

  const fontSize = (size: number) => {
    return Math.round(size * fontFactor);
  };

  const touchable = (size: number) => {
    const MIN_TOUCH = Platform.OS === 'ios' ? 44 : 48;
    return Math.max(moderateScale(size), MIN_TOUCH);
  };

  const wp = (percentage: string | number) => {
    const percent = typeof percentage === 'string'
      ? parseFloat(percentage.replace('%', ''))
      : percentage;
    return PixelRatio.roundToNearestPixel((width * percent) / 100);
  };

  const hp = (percentage: string | number) => {
    const percent = typeof percentage === 'string'
      ? parseFloat(percentage.replace('%', ''))
      : percentage;
    return PixelRatio.roundToNearestPixel((height * percent) / 100);
  };

  // Device-aware spacing
  const baseSpacing = deviceClass === 'small-phone' ? 4 :
                     deviceClass === 'phone' ? 4 :
                     deviceClass === 'tablet' ? 6 : 8;

  return {
    deviceClass,
    isTablet: width >= BREAKPOINTS.PHONE,
    isPhone: width < BREAKPOINTS.PHONE,
    width,
    height,
    scale,
    verticalScale,
    moderateScale,
    fontSize,
    touchable,
    spacing: {
      xs: moderateScale(baseSpacing),
      sm: moderateScale(baseSpacing * 2),
      md: moderateScale(baseSpacing * 4),
      lg: moderateScale(baseSpacing * 6),
      xl: moderateScale(baseSpacing * 8),
    },
    wp,
    hp,
  };
}

// ──────────────────────────────────────────────────────────
// 8. STATIC FALLBACK (for non-component contexts)
// ──────────────────────────────────────────────────────────
const { width, height } = Dimensions.get('window');
const STATIC_DEVICE_CLASS = getDeviceClass(width);
const STATIC_LAYOUT_FACTOR = computeScaleFactor(width, height, 'layout');
const STATIC_FONT_FACTOR = computeScaleFactor(width, height, 'font');

export const staticScale = (size: number) => size * STATIC_LAYOUT_FACTOR;
export const staticVerticalScale = (size: number) => size * STATIC_LAYOUT_FACTOR;
export const staticModerateScale = (size: number, factor = 0.5) =>
  size + (staticScale(size) - size) * factor;
export const staticFontSize = (size: number) => Math.round(size * STATIC_FONT_FACTOR);
export const staticDeviceClass = STATIC_DEVICE_CLASS;
export const staticIsTablet = width >= BREAKPOINTS.PHONE;

// ──────────────────────────────────────────────────────────
// 9. RESPONSIVE STYLESHEET HELPER
// ──────────────────────────────────────────────────────────
export function createResponsiveStyles<T extends Record<string, any>>(
  getStyles: (utils: ResponsiveUtils) => T
) {
  return () => {
    const utils = useResponsive();
    return getStyles(utils);
  };
}

// ──────────────────────────────────────────────────────────
// 10. COMPARISON WITH OLD SYSTEM
// ──────────────────────────────────────────────────────────
/**
 * OLD SYSTEM ISSUES (responsive.ts):
 * - Baseline: 1344x2992px @ 3x density (448dp x 997dp) - WRONG
 * - Most devices hit MIN_FACTOR = 0.7 (undersized UI)
 * - No device-class awareness
 * - Same scale factor for fonts and layout
 *
 * NEW SYSTEM BENEFITS (responsive-v2.ts):
 * - Baseline: 375x667dp (iPhone 8) - CORRECT
 * - Device-class specific scaling
 * - Separate font and layout factors
 * - Better tablet support
 * - Touch target enforcement
 * - Integrated spacing system
 *
 * MIGRATION EXAMPLE:
 *
 * BEFORE (responsive.ts):
 * const { moderateScale, font } = useResponsive();
 * const styles = StyleSheet.create({
 *   container: { padding: moderateScale(20) },
 *   title: { fontSize: font(24) }
 * });
 *
 * AFTER (responsive-v2.ts):
 * const r = useResponsive();
 * const styles = StyleSheet.create({
 *   container: { padding: r.spacing.md },  // Device-aware spacing
 *   title: { fontSize: r.fontSize(24) }    // Better font scaling
 * });
 */
