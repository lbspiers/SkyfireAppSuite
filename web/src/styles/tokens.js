/**
 * SKYFIRE DESIGN SYSTEM - JS TOKENS
 *
 * Usage: import { colors, spacing } from './styles/tokens';
 */

export const colors = {
  primary: '#FD7332',
  primaryDark: '#B92011',
  primaryLight: '#FF8C42',

  accentBlue: '#3B82F6',
  accentBlueDark: '#2563EB',
  accentBlueLight: '#60A5FA',

  bgPage: '#0C1F3F',
  bgPanel: '#0A1628',
  bgSurface: '#111C2E',
  bgElevated: '#213454',

  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDisabled: '#6B7280',

  success: '#10B981',
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const spacing = {
  xs: '0.125rem',       // 2px - super tight, hairline gaps
  tight: '0.25rem',     // 4px - button groups, icon gaps
  default: '0.5rem',    // 8px - DEFAULT
  loose: '1rem',        // 16px - panels, sections
  wide: '1.5rem',       // 24px - page margins
  '2xl': '2rem',        // 32px - hero sections
};

export const typography = {
  fontSans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontMono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",

  textXs: '0.75rem',
  textSm: '0.875rem',
  textBase: '1rem',
  textLg: '1.125rem',
  textXl: '1.25rem',
  text2xl: '1.5rem',
  text3xl: '1.875rem',
  text4xl: '2.5rem',
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 25px rgba(0, 0, 0, 0.3)',
  glowOrange: '0 0 20px rgba(253, 115, 50, 0.4)',
  glowBlue: '0 0 20px rgba(59, 130, 246, 0.3)',
};

export const gradients = {
  primary: 'linear-gradient(180deg, #FD7332 0%, #B92011 100%)',
  chatter: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)',
  input: 'linear-gradient(180deg, #0C1F3F 0%, #2E4161 100%)',
  page: 'linear-gradient(180deg, #0C1F3F 0%, #2E4161 100%)',
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export default { colors, spacing, typography, shadows, gradients, breakpoints };
