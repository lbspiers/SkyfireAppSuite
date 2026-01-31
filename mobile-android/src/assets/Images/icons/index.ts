// src/assets/Images/icons/index.ts
import { ImageSourcePropType } from "react-native";

// Static imports - Metro can analyze these at build time
const iconAssets = {
  close: require("./X_Icon_Red_BB92011.png"),
  camera: require("./modal_camera.png"),
  video: require("./video_camera_white.png"),
  gallery: require("./photo_gallery_white.png"),
  microphone: require("./Microphone_Orange_FD7332.png"),
} as const;

// Type for the icon keys
type IconKey = keyof typeof iconAssets;

// Validate that all assets loaded correctly
const validateAssets = () => {
  const issues: string[] = [];

  Object.entries(iconAssets).forEach(([key, asset]) => {
    if (!asset || typeof asset !== "number") {
      issues.push(key);
    }
  });

  if (issues.length > 0 && __DEV__) {
    console.warn(
      `[icons] Missing or invalid assets: ${issues.join(", ")}. ` +
        "Check that files exist in src/assets/Images/icons/ with exact names (case-sensitive)."
    );
  }

  return issues.length === 0;
};

// Validate assets on module load
const assetsValid = validateAssets();

// Export the icons object
export const ICONS = {
  close: iconAssets.close,
  camera: iconAssets.camera,
  video: iconAssets.video,
  gallery: iconAssets.gallery,
  microphone: iconAssets.microphone, // ✨ Added microphone to exports
} as const;

// Individual named exports for convenience
export const ICON_CLOSE = ICONS.close;
export const ICON_CAMERA = ICONS.camera;
export const ICON_VIDEO = ICONS.video;
export const ICON_GALLERY = ICONS.gallery;
export const ICON_MICROPHONE = ICONS.microphone; // ✨ Added microphone export

// Legacy exports (if your code uses these)
export const ICON_X = ICONS.close;

// Default export for flexibility
export default ICONS;

// Helper function to get icon safely
export const getIcon = (key: IconKey): ImageSourcePropType => {
  const icon = ICONS[key];
  if (!icon) {
    if (__DEV__) {
      console.warn(`[icons] Requested icon "${key}" is not available`);
    }
    // Return a fallback icon (gallery) or you could return a placeholder
    return ICONS.gallery || require("./photo_gallery_white.png");
  }
  return icon;
};

// Type exports
export type IconKeys = IconKey;
export type IconAsset = (typeof ICONS)[IconKey];

// Development logging
if (__DEV__) {
  console.log("[icons] loaded", {
    assets: Object.keys(ICONS),
    valid: assetsValid,
    values: ICONS,
  });
}
