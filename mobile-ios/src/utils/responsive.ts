// src/utils/responsive.ts

import { useWindowDimensions, Dimensions, PixelRatio } from "react-native";

/**
 * Baseline design dimensions - Pixel 9 XL Emulator
 * Physical: 1344x2992 @ 3x density = 448x997 DP
 *
 * IMPORTANT: We design on Pixel 9 XL, so baseline is in DP (device-independent pixels)
 * This ensures designs look exactly the same on the emulator, and scale properly on other devices.
 */
const BASE_WIDTH_DP = 448;   // 1344 / 3
const BASE_HEIGHT_DP = 997;  // 2992 / 3

/**
 * Clamp range for scale factor: controls how much shrinking/upscaling is allowed.
 * Widened range to prevent aggressive clamping on smaller devices.
 */
const MIN_FACTOR = 0.75;  // Was 0.7 - allow better small phone scaling
const MAX_FACTOR = 1.3;

/**
 * Supported scaling strategies.
 * - 'fit': scale to fit within both axes (smallest ratio)
 * - 'fill': scale to cover both axes (largest ratio)
 * - 'balanced': geometric mean of width/height ratios (default, smooth compromise)
 */
type ScaleMode = "fit" | "fill" | "balanced";

/**
 * Compute the scale factor based on DP dimensions.
 * FIXED: Now correctly compares DP to DP (not DP to physical pixels)
 */
function computeFactor(
  widthDp: number,
  heightDp: number,
  density: number,
  mode: ScaleMode = "balanced"
) {
  // IMPORTANT: Compare DP to DP (not physical pixels)
  const widthRatio = widthDp / BASE_WIDTH_DP;
  const heightRatio = heightDp / BASE_HEIGHT_DP;

  let rawRatio: number;
  if (mode === "fit") {
    rawRatio = Math.min(widthRatio, heightRatio);
  } else if (mode === "fill") {
    rawRatio = Math.max(widthRatio, heightRatio);
  } else {
    // balanced: geometric mean
    rawRatio = Math.sqrt(widthRatio * heightRatio);
  }

  // soften abrupt differences
  const eased = Math.pow(rawRatio, 0.9);
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, eased));
}

/**
 * Hook variant: reactive to orientation / window changes.
 */
export function useResponsive(options?: { mode?: ScaleMode }) {
  const { width, height } = useWindowDimensions();
  const density = PixelRatio.get();
  const mode = options?.mode ?? "balanced";
  const factor = computeFactor(width, height, density, mode);

  const scale = (size: number) => size * factor;
  const verticalScale = (size: number) => size * factor;
  const moderateScale = (size: number, mix = 0.5) =>
    size + (scale(size) - size) * mix;
  const font = (size: number) => Math.round(scale(size));

  const widthPercentageToDP = (wp: string) => {
    const percent = parseFloat(wp.replace("%", ""));
    return PixelRatio.roundToNearestPixel((width * percent) / 100);
  };

  const heightPercentageToDP = (hp: string) => {
    const percent = parseFloat(hp.replace("%", ""));
    return PixelRatio.roundToNearestPixel((height * percent) / 100);
  };

  const designPxToDp = (px: number) => px / density;

  return {
    factor,
    density,
    scale,
    verticalScale,
    moderateScale,
    font,
    widthPercentageToDP,
    heightPercentageToDP,
    designPxToDp,
  };
}

/**
 * Static / non-hook fallback (based on initial dimensions).
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATIC_DENSITY = PixelRatio.get();
const STATIC_FACTOR = computeFactor(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  STATIC_DENSITY,
  "balanced"
);

export const scale = (size: number) => size * STATIC_FACTOR;
export const verticalScale = (size: number) => size * STATIC_FACTOR;
export const moderateScale = (size: number, mix = 0.5) =>
  size + (scale(size) - size) * mix;
export const fontSize = (size: number) => Math.round(scale(size));
export const widthPercentageToDP = (wp: string) => {
  const percent = parseFloat(wp.replace("%", ""));
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percent) / 100);
};
export const heightPercentageToDP = (hp: string) => {
  const percent = parseFloat(hp.replace("%", ""));
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percent) / 100);
};
export const density = STATIC_DENSITY;
export const designPxToDp = (px: number) => px / STATIC_DENSITY;
