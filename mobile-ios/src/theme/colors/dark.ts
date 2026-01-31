// src/theme/colors/dark.ts
// UPDATED: Matches web Design Constitution (tokens.css)

export const darkColors = {
  mode: "dark",

  // ── Core surfaces (from web tokens.css) ─────────────────────
  background: "#0C1F3F",      // --bg-page
  surface: "#111C2E",         // --bg-surface
  panel: "#0A1628",           // --bg-panel
  elevated: "#213454",        // --bg-elevated
  border: "rgba(255, 255, 255, 0.15)",  // --border-default
  borderSubtle: "rgba(255, 255, 255, 0.1)",  // --border-subtle

  // ── Brand palette (from web tokens.css) ─────────────────────
  primary: "#FD7332",         // --color-primary (Skyfire Orange)
  primaryDark: "#B92011",     // --color-primary-dark
  primaryLight: "#FF8C42",    // --color-primary-light
  secondary: "#FF8C42",       // Alias for primaryLight

  // ── Text & placeholders (from web tokens.css) ───────────────
  textPrimary: "#F9FAFB",     // --text-primary
  textSecondary: "#D1D5DB",   // --text-secondary
  textMuted: "#9CA3AF",       // --text-muted
  placeholder: "#9CA3AF",     // Same as textMuted
  textDisabled: "#6B7280",    // --text-disabled

  // ── Header background ───────────────────────────────────────
  headerBackground: "#0C1F3F", // Same as background

  // ── Input backgrounds ───────────────────────────────────────
  bgInput: "#0C1F3F",         // --bg-input
  bgInputHover: "#2E4161",    // --bg-input-hover

  // ── Semantic colors (from web tokens.css) ───────────────────
  success: "#10B981",         // --color-success
  info: "#3B82F6",            // --color-info
  warning: "#F59E0B",         // --color-warning
  error: "#EF4444",           // --color-error

  // ── Project Status colors (MUST match web exactly) ──────────
  status: {
    // Pipeline stages
    Sales: "#E6C800",           // --status-sales
    "Site Survey": "#FFA300",   // --status-site-survey
    Design: "#FD7332",          // --status-design (primary orange)
    Revision: "#FF0000",        // --status-revisions
    Revisions: "#FF0000",       // Alias
    Permit: "#7FDB51",          // --status-permits
    Permits: "#7FDB51",         // Alias
    Install: "#00E5A0",         // --status-install
    Installed: "#00E5A0",       // Alias
    Commissioning: "#00BFFF",   // --status-commissioning
    Inspection: "#9370DB",      // --status-inspection
    PTO: "#32CD32",             // --status-pto
    "On Hold": "#FFD700",       // --status-on-hold
    Canceled: "#DC143C",        // --status-canceled
    Cancelled: "#DC143C",       // Alias (British spelling)
    Unknown: "#6B7280",         // Gray for unknown
    
    // Legacy mappings (keep for backward compatibility)
    Survey: "#FFA300",          // Maps to Site Survey
  },

  // ── Accent colors (from web tokens.css) ─────────────────────
  accentBlue: "#3B82F6",
  accentBlueDark: "#2563EB",
  accentBlueLight: "#60A5FA",

  // ── Grayscale (Tailwind compatible) ─────────────────────────
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
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
};
