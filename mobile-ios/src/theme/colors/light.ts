// src/theme/colors/light.ts
// UPDATED: Matches web Design Constitution
// Note: Skyfire is primarily a dark-theme app, but light mode is available

export const lightColors = {
  mode: "light",

  // ── Core surfaces (light mode variants) ─────────────────────
  background: "#F9FAFB",      // Light page background
  surface: "#FFFFFF",         // White cards
  panel: "#F3F4F6",           // Light panel
  elevated: "#FFFFFF",        // Elevated elements
  border: "#E5E7EB",          // --gray-200
  borderSubtle: "#F3F4F6",    // --gray-100

  // ── Brand palette (same as dark - brand colors don't change) ─
  primary: "#FD7332",         // --color-primary (Skyfire Orange)
  primaryDark: "#B92011",     // --color-primary-dark
  primaryLight: "#FF8C42",    // --color-primary-light
  secondary: "#FF8C42",       // Alias for primaryLight

  // ── Text & placeholders (inverted for light mode) ───────────
  textPrimary: "#111827",     // --gray-900
  textSecondary: "#374151",   // --gray-700
  textMuted: "#6B7280",       // --gray-500
  placeholder: "#9CA3AF",     // --gray-400
  textDisabled: "#D1D5DB",    // --gray-300

  // ── Header background ───────────────────────────────────────
  headerBackground: "#0C1F3F", // Keep dark header even in light mode

  // ── Input backgrounds ───────────────────────────────────────
  bgInput: "#FFFFFF",
  bgInputHover: "#F3F4F6",

  // ── Semantic colors (same as dark) ──────────────────────────
  success: "#10B981",
  info: "#3B82F6",
  warning: "#F59E0B",
  error: "#EF4444",

  // ── Project Status colors (MUST match web exactly) ──────────
  status: {
    Sales: "#E6C800",
    "Site Survey": "#FFA300",
    Design: "#FD7332",
    Revision: "#FF0000",
    Revisions: "#FF0000",
    Permit: "#7FDB51",
    Permits: "#7FDB51",
    Install: "#00E5A0",
    Installed: "#00E5A0",
    Commissioning: "#00BFFF",
    Inspection: "#9370DB",
    PTO: "#32CD32",
    "On Hold": "#FFD700",
    Canceled: "#DC143C",
    Cancelled: "#DC143C",
    Unknown: "#6B7280",
    Survey: "#FFA300",
  },

  // ── Accent colors ───────────────────────────────────────────
  accentBlue: "#3B82F6",
  accentBlueDark: "#2563EB",
  accentBlueLight: "#60A5FA",

  // ── Grayscale ───────────────────────────────────────────────
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // ── Special ─────────────────────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.3)",
  overlayDark: "rgba(0, 0, 0, 0.5)",
};
