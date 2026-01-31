// src/theme/tokens.ts
// SKYFIRE MOBILE DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
// This file is the SINGLE SOURCE OF TRUTH for mobile styling.
// All values match web/src/styles/tokens.css exactly.
// 
// RULE: Never use hardcoded colors or spacing. Always import from here.
// ═══════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// COLORS
// ════════════════════════════════════════════════════════════════════════════

export const colors = {
  // ─── Brand ───────────────────────────────────────────────────────────────
  primary: '#FD7332',           // Skyfire Orange
  primaryDark: '#B92011',
  primaryLight: '#FF8C42',
  primaryLighter: 'rgba(253, 115, 50, 0.05)',

  // ─── Backgrounds ─────────────────────────────────────────────────────────
  bgPage: '#0C1F3F',            // Main page background
  bgPanel: '#0A1628',           // Panel/card background
  bgSurface: '#111C2E',         // Surface/elevated cards
  bgElevated: '#213454',        // Hover/active states
  bgInput: '#0C1F3F',           // Input field background
  bgInputHover: '#2E4161',
  bgInputDisabled: 'rgba(30, 41, 59, 0.5)',
  bgGlass: 'rgba(17, 24, 39, 0.7)',
  bgHover: 'rgba(255, 255, 255, 0.05)',
  bgActive: 'rgba(255, 255, 255, 0.1)',

  // ─── Text ────────────────────────────────────────────────────────────────
  textPrimary: '#F9FAFB',       // Main text (white-ish)
  textSecondary: '#D1D5DB',     // Secondary text
  textTertiary: '#9CA3AF',      // Tertiary text
  textMuted: '#9CA3AF',         // Labels, hints
  textDisabled: '#6B7280',      // Disabled state
  textOnPrimary: '#FFFFFF',     // Text on primary color buttons

  // ─── Borders ─────────────────────────────────────────────────────────────
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  borderDefault: 'rgba(255, 255, 255, 0.15)',
  borderElevated: 'rgba(255, 255, 255, 0.2)',
  borderFocus: '#FD7332',       // Orange focus ring
  borderInactive: '#888888',

  // ─── Status/Semantic ─────────────────────────────────────────────────────
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',

  // ─── Project Status Colors (Pipeline) ────────────────────────────────────
  statusPending: '#94A3B8',
  statusSales: '#E6C800',
  statusSiteSurvey: '#FFA300',
  statusDesign: '#FD7332',
  statusRevisions: '#FF0000',
  statusPermits: '#7FDB51',
  statusInstall: '#00B140',
  statusCommissioning: '#00B7C2',
  statusInspection: '#00B7C2',
  statusPTO: '#6A0DAD',
  statusOnHold: '#979797',
  statusCanceled: '#000000',

  // ─── Accent Colors ───────────────────────────────────────────────────────
  accentBlue: '#3B82F6',
  accentBlueDark: '#2563EB',
  accentBlueLight: '#60A5FA',
  accentPink: '#EC4899',
  accentIndigo: '#6366F1',
  accentPurple: '#8B5CF6',
  accentCyan: '#06B6D4',
  accentYellow: '#EAB308',

  // ─── Grayscale (Tailwind) ────────────────────────────────────────────────
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // ─── Overlays ────────────────────────────────────────────────────────────
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayMedium: 'rgba(0, 0, 0, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.95)',

  // ─── Special ─────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// SPACING
// ════════════════════════════════════════════════════════════════════════════

export const spacing = {
  xxs: 6,       // Portal pills, micro adjustments
  xs: 4,        // Micro adjustments
  tight: 8,     // Compact spacing - tabs, labels, icon gaps
  sm: 12,       // Small spacing
  base: 16,     // DEFAULT - use when unsure
  md: 20,       // Medium spacing
  loose: 24,    // Section breaks
  wide: 32,     // Major sections
  xl: 48,       // Hero sections
  xxl: 64,      // Extra large sections
} as const;

// Default spacing (16px)
export const SPACING_DEFAULT = spacing.base;

// ════════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ════════════════════════════════════════════════════════════════════════════

export const radius = {
  sm: 4,        // Small radius
  md: 8,        // DEFAULT - cards, buttons
  lg: 12,       // Larger cards
  xl: 16,       // Extra large
  pill: 9999,   // Fully rounded (pills, avatars)
} as const;

// ════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ════════════════════════════════════════════════════════════════════════════

export const fontSize = {
  xs: 12,       // Labels, hints
  sm: 14,       // UI elements (MOST COMMON)
  base: 16,     // Body text
  lg: 18,       // Slightly larger
  xl: 20,       // Section titles
  '2xl': 24,    // Page titles
  '3xl': 30,    // Large headings
  '4xl': 40,    // Hero text
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// SHADOWS (React Native)
// ════════════════════════════════════════════════════════════════════════════

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  // Glow effects
  glowOrange: {
    shadowColor: '#FD7332',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  glowBlue: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing.base,  // 16
  screenPaddingVertical: spacing.base,    // 16

  // Header
  headerHeight: 56,
  tabBarHeight: 60,

  // Touch targets (accessibility minimum)
  minTouchTarget: 44,

  // Input heights
  inputHeightSm: 36,
  inputHeightMd: 44,
  inputHeightLg: 52,

  // Button heights
  buttonHeightSm: 32,
  buttonHeightMd: 44,
  buttonHeightLg: 52,

  // Form field ratio (30% label, 70% input)
  labelWidth: '30%',
  inputWidth: '70%',

  // Card padding
  cardPadding: spacing.base,
  cardPaddingLg: spacing.md,

  // Section gaps
  sectionGap: spacing.loose,      // 24
  formFieldGap: spacing.base,     // 16
  buttonGap: spacing.tight,       // 8
} as const;

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT STYLES (Pre-built StyleSheet-compatible objects)
// ════════════════════════════════════════════════════════════════════════════

export const componentStyles = {
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },

  // Scrollable screen content
  screenContent: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },

  // Card/Panel
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // Elevated card (with shadow)
  cardElevated: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.base,
    ...shadows.md,
  },

  // Form field row (30/70 ratio)
  formRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  formLabel: {
    width: layout.labelWidth,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.normal,
  },

  formInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.transparent,
  },

  // Section header
  sectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.base,
  },

  // Primary button
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: layout.buttonHeightMd,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.base,
  },

  buttonPrimaryText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },

  // Secondary button
  buttonSecondary: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    height: layout.buttonHeightMd,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },

  buttonSecondaryText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },

  // Text input
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    height: layout.inputHeightMd,
  },

  textInputFocused: {
    borderColor: colors.borderFocus,
  },

  // Placeholder text style
  placeholder: {
    color: colors.textMuted,
  },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// STATUS COLOR HELPER
// ════════════════════════════════════════════════════════════════════════════

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': colors.statusPending,
    'sales': colors.statusSales,
    'site survey': colors.statusSiteSurvey,
    'site_survey': colors.statusSiteSurvey,
    'design': colors.statusDesign,
    'revisions': colors.statusRevisions,
    'revision': colors.statusRevisions,
    'permits': colors.statusPermits,
    'permit': colors.statusPermits,
    'install': colors.statusInstall,
    'installed': colors.statusInstall,
    'commissioning': colors.statusCommissioning,
    'inspection': colors.statusInspection,
    'pto': colors.statusPTO,
    'on hold': colors.statusOnHold,
    'on_hold': colors.statusOnHold,
    'canceled': colors.statusCanceled,
    'cancelled': colors.statusCanceled,
  };

  return statusMap[status.toLowerCase()] || colors.gray500;
};

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export default {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
  layout,
  componentStyles,
  getStatusColor,
};
