// src/theme/theme-v2.ts
// RESPONSIVE THEME SYSTEM - Integrates with responsive-v2.ts

import { lightColors } from "./colors/light";
import { darkColors } from "./colors/dark";
import { useResponsive, ResponsiveUtils } from '../utils/responsive-v2';

export const themes = {
  light: lightColors,
  dark: darkColors,
};

// ──────────────────────────────────────────────────────────
// RESPONSIVE THEME HOOK
// ──────────────────────────────────────────────────────────
export function useTheme(mode: 'light' | 'dark' = 'light') {
  const responsive = useResponsive();

  return {
    // Colors (not responsive)
    colors: themes[mode],

    // Spacing (responsive)
    spacing: responsive.spacing,

    // Border radii (responsive)
    radii: {
      sm: responsive.moderateScale(4),
      md: responsive.moderateScale(8),
      lg: responsive.moderateScale(16),
      pill: 999,
    },

    // Typography (responsive)
    typography: {
      h1: {
        fontSize: responsive.fontSize(28),
        lineHeight: responsive.fontSize(34),
        fontWeight: '700' as const,
      },
      h2: {
        fontSize: responsive.fontSize(22),
        lineHeight: responsive.fontSize(28),
        fontWeight: '700' as const,
      },
      h3: {
        fontSize: responsive.fontSize(18),
        lineHeight: responsive.fontSize(24),
        fontWeight: '700' as const,
      },
      body: {
        fontSize: responsive.fontSize(16),
        lineHeight: responsive.fontSize(22),
        fontWeight: '400' as const,
      },
      bodyLarge: {
        fontSize: responsive.fontSize(18),
        lineHeight: responsive.fontSize(24),
        fontWeight: '400' as const,
      },
      label: {
        fontSize: responsive.fontSize(14),
        lineHeight: responsive.fontSize(20),
        fontWeight: '600' as const,
      },
      caption: {
        fontSize: responsive.fontSize(12),
        lineHeight: responsive.fontSize(16),
        fontWeight: '400' as const,
      },
    },

    // Icon sizes (responsive)
    iconSizes: {
      sm: responsive.moderateScale(16),
      md: responsive.moderateScale(24),
      lg: responsive.moderateScale(32),
      xl: responsive.moderateScale(48),
    },

    // Touch targets (responsive with minimum enforcement)
    touchTargets: {
      min: responsive.touchable(44),
      comfortable: responsive.touchable(52),
    },

    // Shadows / Elevation (responsive)
    shadows: {
      light: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: responsive.scale(1) },
        shadowOpacity: 0.1,
        shadowRadius: responsive.scale(1),
        elevation: 0,
      },
      medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: responsive.scale(2) },
        shadowOpacity: 0.12,
        shadowRadius: responsive.scale(4),
        elevation: 2,
      },
      heavy: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: responsive.scale(4) },
        shadowOpacity: 0.15,
        shadowRadius: responsive.scale(8),
        elevation: 4,
      },
    },

    // Z-Indices (not responsive)
    zIndices: {
      drawer: 900,
      header: 1000,
      modal: 1100,
      keyboard: 9999, // Custom keyboard
    },

    // Divider (responsive)
    divider: {
      thickness: 1,
      color: themes[mode].border,
      marginVertical: responsive.spacing.sm,
    },

    // Button Variants (responsive)
    buttonVariants: {
      filled: {
        backgroundColor: themes[mode].primary,
        borderWidth: 0,
        textColor: "#FFFFFF",
        paddingVertical: responsive.spacing.sm,
        paddingHorizontal: responsive.spacing.md,
        borderRadius: responsive.moderateScale(8),
        minHeight: responsive.touchable(44),
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: themes[mode].border,
        textColor: themes[mode].textPrimary,
        paddingVertical: responsive.spacing.sm,
        paddingHorizontal: responsive.spacing.md,
        borderRadius: responsive.moderateScale(8),
        minHeight: responsive.touchable(44),
      },
      text: {
        backgroundColor: "transparent",
        borderWidth: 0,
        textColor: themes[mode].primary,
        paddingVertical: responsive.spacing.sm,
        paddingHorizontal: responsive.spacing.md,
        minHeight: responsive.touchable(44),
      },
    },

    // Gradients (not responsive - colors only)
    gradients: {
      navy: ["#2e4161", "#0c1f3f"],
      sunset: [lightColors.secondary, lightColors.primaryDark],
      subtleGrey: ["#F7F7F7", "#ECECEC", "#E0E0E0"],
      softNavy: ["#25324A", "#1C2540", "#151D39"],
    },

    // Device info for conditional rendering
    device: {
      class: responsive.deviceClass,
      isTablet: responsive.isTablet,
      isPhone: responsive.isPhone,
      width: responsive.width,
      height: responsive.height,
    },

    // Direct access to responsive utilities
    responsive,
  };
}

// ──────────────────────────────────────────────────────────
// STATIC THEME (for non-hook contexts)
// ──────────────────────────────────────────────────────────
import {
  staticScale,
  staticModerateScale,
  staticFontSize,
  staticDeviceClass,
  staticIsTablet,
  BREAKPOINTS,
} from '../utils/responsive-v2';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function getStaticTheme(mode: 'light' | 'dark' = 'light') {
  return {
    colors: themes[mode],

    spacing: {
      xs: staticModerateScale(4),
      sm: staticModerateScale(8),
      md: staticModerateScale(16),
      lg: staticModerateScale(24),
      xl: staticModerateScale(32),
    },

    radii: {
      sm: staticModerateScale(4),
      md: staticModerateScale(8),
      lg: staticModerateScale(16),
      pill: 999,
    },

    typography: {
      h1: {
        fontSize: staticFontSize(28),
        lineHeight: staticFontSize(34),
        fontWeight: '700' as const,
      },
      h2: {
        fontSize: staticFontSize(22),
        lineHeight: staticFontSize(28),
        fontWeight: '700' as const,
      },
      h3: {
        fontSize: staticFontSize(18),
        lineHeight: staticFontSize(24),
        fontWeight: '700' as const,
      },
      body: {
        fontSize: staticFontSize(16),
        lineHeight: staticFontSize(22),
        fontWeight: '400' as const,
      },
      label: {
        fontSize: staticFontSize(14),
        lineHeight: staticFontSize(20),
        fontWeight: '600' as const,
      },
      caption: {
        fontSize: staticFontSize(12),
        lineHeight: staticFontSize(16),
        fontWeight: '400' as const,
      },
    },

    iconSizes: {
      sm: staticModerateScale(16),
      md: staticModerateScale(24),
      lg: staticModerateScale(32),
      xl: staticModerateScale(48),
    },

    device: {
      class: staticDeviceClass,
      isTablet: staticIsTablet,
      width,
      height,
    },
  };
}

// ──────────────────────────────────────────────────────────
// MIGRATION GUIDE
// ──────────────────────────────────────────────────────────
/**
 * HOW TO MIGRATE FROM OLD THEME TO NEW THEME:
 *
 * BEFORE (theme.ts):
 * import { spacing, typography, iconSizes } from '../theme/theme';
 * const styles = StyleSheet.create({
 *   container: { padding: spacing.md }, // Fixed: 16px
 *   title: { fontSize: typography.h1.fontSize }, // Fixed: 28px
 *   icon: { width: iconSizes.md }, // Fixed: 24px
 * });
 *
 * AFTER (theme-v2.ts):
 * import { useTheme } from '../theme/theme-v2';
 * const theme = useTheme('light');
 * const styles = StyleSheet.create({
 *   container: { padding: theme.spacing.md }, // Responsive!
 *   title: { fontSize: theme.typography.h1.fontSize }, // Responsive!
 *   icon: { width: theme.iconSizes.md }, // Responsive!
 * });
 *
 * DEVICE-SPECIFIC RENDERING:
 * const theme = useTheme('light');
 * if (theme.device.isTablet) {
 *   // Tablet-specific layout
 * } else {
 *   // Phone layout
 * }
 *
 * BREAKPOINT-BASED STYLING:
 * const theme = useTheme('light');
 * const numColumns = theme.device.isTablet ? 2 : 1;
 */
