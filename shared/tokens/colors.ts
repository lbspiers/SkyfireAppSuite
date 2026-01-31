/**
 * SKYFIRE DESIGN SYSTEM - COLOR TOKENS
 * 
 * Source of truth extracted from web/src/styles/tokens.css
 * Used by both web and mobile apps
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-30
 */

export const colors = {
  // ========================================
  // BRAND
  // ========================================
  primary: '#FD7332',
  primaryDark: '#B92011',
  primaryLight: '#FF8C42',

  // ========================================
  // GRAYSCALE (Tailwind compatible)
  // ========================================
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

  // ========================================
  // ACCENT - Chatter Blue
  // ========================================
  accentBlue: '#3B82F6',
  accentBlueDark: '#2563EB',
  accentBlueLight: '#60A5FA',

  // ========================================
  // BACKGROUNDS
  // ========================================
  bgPage: '#0C1F3F',
  bgPanel: '#0A1628',
  bgSurface: '#111C2E',
  bgElevated: '#213454',
  bgInput: '#0C1F3F',
  bgInputHover: '#2E4161',
  bgInputDisabled: 'rgba(30, 41, 59, 0.5)',
  bgGlass: 'rgba(17, 24, 39, 0.7)',
  bgHover: 'rgba(255, 255, 255, 0.05)',
  bgActive: 'rgba(255, 255, 255, 0.1)',

  // ========================================
  // TEXT
  // ========================================
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textLink: '#60A5FA',
  textLinkHover: '#93C5FD',

  // ========================================
  // STATUS COLORS
  // ========================================
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',

  // ========================================
  // PROJECT STATUS COLORS (Pipeline)
  // ========================================
  statusSales: '#E6C800',
  statusSiteSurvey: '#FFA300',
  statusDesign: '#FD7332',
  statusRevisions: '#FF0000',
  statusPermits: '#7FDB51',
  statusInstall: '#00E5A0',
  statusCommissioning: '#00BFFF',
  statusInspection: '#9370DB',
  statusPTO: '#32CD32',
  statusOnHold: '#FFD700',
  statusCanceled: '#DC143C',

  // ========================================
  // BORDERS
  // ========================================
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  borderDefault: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#FD7332',
  borderError: '#EF4444',
  borderSuccess: '#10B981',

  // ========================================
  // SPECIAL
  // ========================================
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Type for color keys
export type ColorKey = keyof typeof colors;

// Helper to get color value
export const getColor = (key: ColorKey): string => colors[key];

export default colors;
