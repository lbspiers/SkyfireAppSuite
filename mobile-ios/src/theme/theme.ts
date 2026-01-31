// src/theme/theme.ts

import { lightColors } from "./colors/light";
import { darkColors } from "./colors/dark";

export const themes = {
  light: lightColors,
  dark: darkColors,
};

// ── Spacing ─────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ── Border radii ─────────────────────────────────────────────────────────
export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
};

// ── Typography ───────────────────────────────────────────────────────────
export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
};

// ── Icon sizes ────────────────────────────────────────────────────────────
export const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

// ── Shadows / Elevation ───────────────────────────────────────────────────
export const shadows = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 0,
  },
  heavy: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ── Z-Indices ─────────────────────────────────────────────────────────────
export const zIndices = {
  drawer: 900,
  header: 1000,
  modal: 1100,
};

// ── Divider / Section Break ───────────────────────────────────────────────
export const divider = {
  thickness: 1,
  color: themes.light.border,
  marginVertical: spacing.sm,
};

// ── Button Variants ───────────────────────────────────────────────────────
export const buttonVariants = {
  filled: (mode: "light" | "dark") => {
    const t = themes[mode];
    return {
      backgroundColor: t.primary,
      borderWidth: 0,
      textColor: "#FFFFFF",
    };
  },
  outline: (mode: "light" | "dark") => {
    const t = themes[mode];
    return {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: t.border,
      textColor: t.textPrimary,
    };
  },
};

// ── Gradients (for accent areas) ──────────────────────────────────────────
export const gradients = {
  navy: ["#2e4161", "#0c1f3f"],
  sunset: [lightColors.secondary, lightColors.primaryDark],
  subtleGrey: ["#F7F7F7", "#ECECEC", "#E0E0E0"],
  softNavy: ["#25324A", "#1C2540", "#151D39"],
};

// ── Header Gradient helper ────────────────────────────────────────────────
export const headerGradient = (mode: "light" | "dark"): [string, string] => {
  const bg = themes[mode].headerBackground;
  return [bg, bg];
};
