// Password Reset System Types
// Comprehensive type definitions for the enhanced password reset flow

// ============================================================================
// CORE TYPES
// ============================================================================

export interface PasswordResetState {
  currentStep: PasswordResetStep;
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Security & Rate Limiting
  attemptsRemaining: number;
  isLockedOut: boolean;
  lockoutExpiresAt: number | null;

  // Code Management
  codeExpiresAt: number | null;
  canResendAt: number | null;

  // UX State
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordStrengthScore: number;

  // Deep Linking
  resetToken: string | null;
  deepLinkProcessed: boolean;
}

export type PasswordResetStep =
  | 'EMAIL_INPUT'
  | 'CODE_SENT'
  | 'CODE_INPUT'
  | 'NEW_PASSWORD'
  | 'SUCCESS'
  | 'LOCKED_OUT'
  | 'EXPIRED';

// ============================================================================
// API TYPES
// ============================================================================

export interface RequestResetCodePayload {
  email: string;
  method: 'email' | 'sms' | 'both';
  deviceInfo?: DeviceInfo;
}

export interface RequestResetCodeResponse {
  success: boolean;
  message: string;
  data?: {
    codeExpiresAt: number;
    canResendAt: number;
    attemptsRemaining: number;
    method: 'email' | 'sms' | 'both';
  };
  error?: {
    code: string;
    message: string;
    lockoutExpiresAt?: number;
  };
}

export interface VerifyResetCodePayload {
  email: string;
  code: string;
  deviceInfo?: DeviceInfo;
}

export interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
  data?: {
    resetToken: string;
    tokenExpiresAt: number;
  };
  error?: {
    code: string;
    message: string;
    attemptsRemaining?: number;
    lockoutExpiresAt?: number;
  };
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
  deviceInfo?: DeviceInfo;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    autoLogin: boolean;
    accessToken?: string;
    refreshToken?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// SECURITY & DEVICE INFO
// ============================================================================

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  userAgent: string;
  timestamp: number;
  timezone: string;
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  riskScore?: number;
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-4 (Very Weak, Weak, Fair, Good, Strong)
  feedback: string[];
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  id: string;
  description: string;
  isMet: boolean;
  isRequired: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'min-length',
    description: 'At least 8 characters',
    isMet: false,
    isRequired: true,
  },
  {
    id: 'uppercase',
    description: 'At least one uppercase letter (A-Z)',
    isMet: false,
    isRequired: true,
  },
  {
    id: 'lowercase',
    description: 'At least one lowercase letter (a-z)',
    isMet: false,
    isRequired: true,
  },
  {
    id: 'number',
    description: 'At least one number (0-9)',
    isMet: false,
    isRequired: true,
  },
  {
    id: 'special',
    description: 'At least one special character (!@#$%^&*)',
    isMet: false,
    isRequired: false,
  },
  {
    id: 'no-common',
    description: 'Not a commonly used password',
    isMet: false,
    isRequired: true,
  },
];

// ============================================================================
// ANALYTICS & MONITORING
// ============================================================================

export interface PasswordResetAnalytics {
  eventType: PasswordResetEventType;
  timestamp: number;
  userId?: string;
  email: string;
  step: PasswordResetStep;
  success: boolean;
  errorCode?: string;
  timeToComplete?: number;
  abandonmentPoint?: PasswordResetStep;
  deviceInfo?: DeviceInfo;
  userAgent?: string;

  // UX Metrics
  retryCount?: number;
  helpUsed?: boolean;
  resendCount?: number;

  // Security Metrics
  suspiciousActivity?: boolean;
  riskScore?: number;
}

export type PasswordResetEventType =
  | 'reset_initiated'
  | 'email_submitted'
  | 'code_sent'
  | 'code_entered'
  | 'code_verified'
  | 'password_set'
  | 'reset_completed'
  | 'reset_abandoned'
  | 'error_occurred'
  | 'lockout_triggered'
  | 'help_viewed'
  | 'resend_requested';

// ============================================================================
// DEEP LINKING
// ============================================================================

export interface DeepLinkData {
  type: 'password_reset';
  token?: string;
  code?: string;
  email?: string;
  action: 'verify_code' | 'reset_password' | 'magic_link';
}

export interface MagicLinkData {
  token: string;
  email: string;
  expiresAt: number;
  singleUse: boolean;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface PasswordResetError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryAfter?: number;
  helpUrl?: string;
}

export type ErrorCode =
  // Input Errors
  | 'INVALID_EMAIL'
  | 'INVALID_CODE'
  | 'INVALID_PASSWORD'
  | 'PASSWORDS_DONT_MATCH'
  | 'WEAK_PASSWORD'
  | 'COMMON_PASSWORD'

  // Security Errors
  | 'TOO_MANY_ATTEMPTS'
  | 'ACCOUNT_LOCKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'CODE_EXPIRED'
  | 'CODE_ALREADY_USED'

  // System Errors
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR'
  | 'EMAIL_SERVICE_ERROR'
  | 'SMS_SERVICE_ERROR'

  // User Errors
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_DISABLED'
  | 'EMAIL_NOT_VERIFIED';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface PasswordResetConfig {
  // Timing
  codeExpiryMinutes: number;
  tokenExpiryHours: number;
  resendCooldownSeconds: number;

  // Security
  maxAttempts: number;
  lockoutDurationMinutes: number;

  // Features
  enableSMS: boolean;
  enableMagicLinks: boolean;
  enableAutoFill: boolean;
  enableBiometricReauth: boolean;

  // UI
  showProgressIndicator: boolean;
  enableDarkMode: boolean;
  animationsEnabled: boolean;
}

export const DEFAULT_PASSWORD_RESET_CONFIG: PasswordResetConfig = {
  codeExpiryMinutes: 10,
  tokenExpiryHours: 1,
  resendCooldownSeconds: 60,
  maxAttempts: 5,
  lockoutDurationMinutes: 60,
  enableSMS: false,
  enableMagicLinks: true,
  enableAutoFill: true,
  enableBiometricReauth: true,
  showProgressIndicator: true,
  enableDarkMode: true,
  animationsEnabled: true,
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface BaseScreenProps {
  navigation: any;
  route: any;
}

export interface PasswordResetContextValue {
  state: PasswordResetState;
  dispatch: React.Dispatch<PasswordResetAction>;

  // Actions
  requestResetCode: (email: string) => Promise<void>;
  verifyResetCode: (code: string) => Promise<void>;
  resetPassword: (password: string, confirmPassword: string) => Promise<void>;
  resendCode: () => Promise<void>;

  // Utilities
  validatePassword: (password: string) => PasswordStrength;
  formatTimeRemaining: (timestamp: number) => string;
  canResend: boolean;
  timeUntilResend: number;

  // Analytics
  trackEvent: (eventType: PasswordResetEventType, data?: any) => void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export type PasswordResetAction =
  | { type: 'SET_STEP'; payload: PasswordResetStep }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_CODE'; payload: string }
  | { type: 'SET_NEW_PASSWORD'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS_MESSAGE'; payload: string | null }
  | { type: 'SET_ATTEMPTS_REMAINING'; payload: number }
  | { type: 'SET_LOCKOUT'; payload: { isLockedOut: boolean; expiresAt: number | null } }
  | { type: 'SET_CODE_EXPIRY'; payload: number | null }
  | { type: 'SET_CAN_RESEND_AT'; payload: number | null }
  | { type: 'TOGGLE_SHOW_PASSWORD'; payload?: boolean }
  | { type: 'TOGGLE_SHOW_CONFIRM_PASSWORD'; payload?: boolean }
  | { type: 'SET_PASSWORD_STRENGTH'; payload: number }
  | { type: 'SET_RESET_TOKEN'; payload: string | null }
  | { type: 'SET_DEEP_LINK_PROCESSED'; payload: boolean }
  | { type: 'RESET_STATE' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SUCCESS_MESSAGE' };

export const initialPasswordResetState: PasswordResetState = {
  currentStep: 'EMAIL_INPUT',
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
  isLoading: false,
  error: null,
  successMessage: null,

  attemptsRemaining: 5,
  isLockedOut: false,
  lockoutExpiresAt: null,

  codeExpiresAt: null,
  canResendAt: null,

  showPassword: false,
  showConfirmPassword: false,
  passwordStrengthScore: 0,

  resetToken: null,
  deepLinkProcessed: false,
};