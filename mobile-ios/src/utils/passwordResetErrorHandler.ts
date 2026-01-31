// Password Reset Error Handler
// Comprehensive error handling with user-friendly messages and recovery actions

import { Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ErrorCode,
  PasswordResetError,
  PasswordResetStep,
} from './passwordResetTypes';
import { trackPasswordResetEvent } from './analytics';

// Error message mapping
const ERROR_MESSAGES: Record<ErrorCode, PasswordResetError> = {
  // Input Errors
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email address format',
    userMessage: 'Please enter a valid email address.',
    recoverable: true,
  },
  INVALID_CODE: {
    code: 'INVALID_CODE',
    message: 'Invalid or expired reset code',
    userMessage: 'The code you entered is incorrect or has expired. Please check your email for the latest code.',
    recoverable: true,
    helpUrl: 'https://skyfiresd.com/help/reset-code',
  },
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    message: 'Password does not meet requirements',
    userMessage: 'Your password must meet all security requirements. Please review the guidelines below.',
    recoverable: true,
  },
  PASSWORDS_DONT_MATCH: {
    code: 'PASSWORDS_DONT_MATCH',
    message: 'Password confirmation does not match',
    userMessage: 'The passwords you entered don\'t match. Please make sure both fields are identical.',
    recoverable: true,
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Password is too weak',
    userMessage: 'Your password is too weak. Please create a stronger password with mixed characters.',
    recoverable: true,
  },
  COMMON_PASSWORD: {
    code: 'COMMON_PASSWORD',
    message: 'Password is commonly used',
    userMessage: 'This password is too common and not secure. Please choose a unique password.',
    recoverable: true,
  },

  // Security Errors
  TOO_MANY_ATTEMPTS: {
    code: 'TOO_MANY_ATTEMPTS',
    message: 'Too many reset attempts',
    userMessage: 'You\'ve made too many attempts. Please wait before trying again.',
    recoverable: true,
    retryAfter: 60000, // 1 minute
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account temporarily locked',
    userMessage: 'Your account is temporarily locked for security. Please try again in an hour or contact support.',
    recoverable: true,
    retryAfter: 3600000, // 1 hour
    helpUrl: 'https://skyfiresd.com/help/account-locked',
  },
  SUSPICIOUS_ACTIVITY: {
    code: 'SUSPICIOUS_ACTIVITY',
    message: 'Suspicious activity detected',
    userMessage: 'We\'ve detected unusual activity. For your security, please contact our support team.',
    recoverable: false,
    helpUrl: 'https://skyfiresd.com/help/suspicious-activity',
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid or expired reset token',
    userMessage: 'Your reset session has expired. Please start the password reset process again.',
    recoverable: true,
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Reset token has expired',
    userMessage: 'Your reset link has expired. Please request a new password reset email.',
    recoverable: true,
  },
  CODE_EXPIRED: {
    code: 'CODE_EXPIRED',
    message: 'Reset code has expired',
    userMessage: 'Your reset code has expired. Please request a new code.',
    recoverable: true,
  },
  CODE_ALREADY_USED: {
    code: 'CODE_ALREADY_USED',
    message: 'Reset code already used',
    userMessage: 'This reset code has already been used. Please request a new one if needed.',
    recoverable: true,
  },

  // System Errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    userMessage: 'Unable to connect to our servers. Please check your internet connection and try again.',
    recoverable: true,
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    userMessage: 'Our password reset service is temporarily unavailable. Please try again in a few minutes.',
    recoverable: true,
    retryAfter: 300000, // 5 minutes
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again, or contact support if the problem persists.',
    recoverable: true,
  },
  EMAIL_SERVICE_ERROR: {
    code: 'EMAIL_SERVICE_ERROR',
    message: 'Email service error',
    userMessage: 'We couldn\'t send the reset email. Please check your email address and try again.',
    recoverable: true,
  },
  SMS_SERVICE_ERROR: {
    code: 'SMS_SERVICE_ERROR',
    message: 'SMS service error',
    userMessage: 'We couldn\'t send the SMS code. Please try using email instead.',
    recoverable: true,
  },

  // User Errors
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User account not found',
    userMessage: 'If an account with that email exists, a reset code has been sent.', // Security: don't reveal if user exists
    recoverable: true,
  },
  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    message: 'Account is disabled',
    userMessage: 'Your account has been disabled. Please contact support for assistance.',
    recoverable: false,
    helpUrl: 'https://skyfiresd.com/help/disabled-account',
  },
  EMAIL_NOT_VERIFIED: {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Email address not verified',
    userMessage: 'Please verify your email address first, then try resetting your password.',
    recoverable: true,
    helpUrl: 'https://skyfiresd.com/help/verify-email',
  },
};

// Error storage key
const ERROR_LOG_KEY = '@skyfire_password_reset_errors';

/**
 * Handle password reset errors with appropriate user feedback
 */
export class PasswordResetErrorHandler {
  /**
   * Process and handle an error
   */
  static async handleError(
    error: any,
    step: PasswordResetStep,
    email?: string,
    options: {
      showAlert?: boolean;
      vibrate?: boolean;
      logError?: boolean;
      trackAnalytics?: boolean;
    } = {}
  ): Promise<PasswordResetError> {
    const {
      showAlert = true,
      vibrate = true,
      logError = true,
      trackAnalytics = true,
    } = options;

    // Determine error code and create error object
    const errorCode = this.determineErrorCode(error);
    const passwordResetError = this.createPasswordResetError(errorCode, error);

    // Log error if requested
    if (logError) {
      await this.logError(passwordResetError, step, email);
    }

    // Track analytics if requested
    if (trackAnalytics) {
      this.trackErrorAnalytics(passwordResetError, step, email);
    }

    // Provide haptic feedback
    if (vibrate) {
      this.provideHapticFeedback(passwordResetError);
    }

    // Show user alert if requested
    if (showAlert) {
      this.showUserAlert(passwordResetError, step);
    }

    return passwordResetError;
  }

  /**
   * Determine error code from various error sources
   */
  private static determineErrorCode(error: any): ErrorCode {
    // Check for specific error codes in response
    if (error?.response?.data?.code) {
      return error.response.data.code as ErrorCode;
    }

    if (error?.response?.data?.errorCode) {
      return error.response.data.errorCode as ErrorCode;
    }

    // Check HTTP status codes
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'INVALID_EMAIL';
        case 401:
          return 'INVALID_TOKEN';
        case 403:
          return 'ACCOUNT_LOCKED';
        case 404:
          return 'USER_NOT_FOUND';
        case 429:
          return 'TOO_MANY_ATTEMPTS';
        case 500:
          return 'SERVICE_UNAVAILABLE';
        case 503:
          return 'SERVICE_UNAVAILABLE';
        default:
          return 'UNKNOWN_ERROR';
      }
    }

    // Check error messages for common patterns
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    if (message.includes('invalid') && message.includes('email')) {
      return 'INVALID_EMAIL';
    }

    if (message.includes('invalid') && message.includes('code')) {
      return 'INVALID_CODE';
    }

    if (message.includes('expired')) {
      if (message.includes('code')) {
        return 'CODE_EXPIRED';
      } else if (message.includes('token')) {
        return 'TOKEN_EXPIRED';
      }
    }

    if (message.includes('password') && message.includes('match')) {
      return 'PASSWORDS_DONT_MATCH';
    }

    if (message.includes('password') && message.includes('weak')) {
      return 'WEAK_PASSWORD';
    }

    if (message.includes('too many') || message.includes('rate limit')) {
      return 'TOO_MANY_ATTEMPTS';
    }

    // Default to unknown error
    return 'UNKNOWN_ERROR';
  }

  /**
   * Create password reset error object
   */
  private static createPasswordResetError(
    code: ErrorCode,
    originalError: any
  ): PasswordResetError {
    const baseError = ERROR_MESSAGES[code];

    return {
      ...baseError,
      // Include original error details for debugging
      originalError: originalError?.message || originalError,
    } as PasswordResetError & { originalError: any };
  }

  /**
   * Log error for debugging and monitoring
   */
  private static async logError(
    error: PasswordResetError,
    step: PasswordResetStep,
    email?: string
  ): Promise<void> {
    try {
      const errorLog = {
        timestamp: Date.now(),
        code: error.code,
        step,
        email: email || 'unknown',
        message: error.message,
        userMessage: error.userMessage,
        originalError: (error as any).originalError,
      };

      // Store in AsyncStorage for debugging
      const existingLogs = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push(errorLog);

      // Keep only last 50 errors
      const trimmedLogs = logs.slice(-50);

      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));

      // Also log to console for development
      console.error('🚨 [PASSWORD RESET ERROR]', {
        code: error.code,
        step,
        message: error.message,
        recoverable: error.recoverable,
      });

    } catch (storageError) {
      console.error('Failed to log password reset error:', storageError);
    }
  }

  /**
   * Track error in analytics
   */
  private static trackErrorAnalytics(
    error: PasswordResetError,
    step: PasswordResetStep,
    email?: string
  ): void {
    trackPasswordResetEvent({
      eventType: 'error_occurred',
      timestamp: Date.now(),
      email: email || '',
      step,
      success: false,
      errorCode: error.code,
      suspiciousActivity: error.code === 'SUSPICIOUS_ACTIVITY',
    });
  }

  /**
   * Provide haptic feedback based on error severity
   */
  private static provideHapticFeedback(error: PasswordResetError): void {
    try {
      if (error.recoverable) {
        // Light vibration for recoverable errors
        Vibration.vibrate(100);
      } else {
        // Stronger vibration for serious errors
        Vibration.vibrate([100, 100, 100]);
      }
    } catch (error) {
      // Vibration may not be supported on all devices
      console.warn('Vibration not supported:', error);
    }
  }

  /**
   * Show user-friendly alert
   */
  private static showUserAlert(
    error: PasswordResetError,
    step: PasswordResetStep
  ): void {
    const title = this.getAlertTitle(error.code, step);
    const buttons = this.getAlertButtons(error);

    Alert.alert(title, error.userMessage, buttons);
  }

  /**
   * Get alert title based on error and step
   */
  private static getAlertTitle(code: ErrorCode, step: PasswordResetStep): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'SERVICE_UNAVAILABLE':
        return 'Service Unavailable';
      case 'TOO_MANY_ATTEMPTS':
        return 'Too Many Attempts';
      case 'ACCOUNT_LOCKED':
        return 'Account Locked';
      case 'SUSPICIOUS_ACTIVITY':
        return 'Security Alert';
      case 'INVALID_CODE':
        return 'Invalid Code';
      case 'CODE_EXPIRED':
        return 'Code Expired';
      case 'INVALID_PASSWORD':
        return 'Password Requirements';
      case 'PASSWORDS_DONT_MATCH':
        return 'Passwords Don\'t Match';
      default:
        return 'Error';
    }
  }

  /**
   * Get alert buttons with appropriate actions
   */
  private static getAlertButtons(error: PasswordResetError): Array<{
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }> {
    const buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }> = [];

    // Always include OK button
    buttons.push({
      text: 'OK',
      style: 'default',
    });

    // Add help button for errors with help URLs
    if (error.helpUrl) {
      buttons.unshift({
        text: 'Get Help',
        style: 'default',
        onPress: () => {
          // Open help URL
          const { openURL } = require('./deepLinking');
          openURL(error.helpUrl!);
        },
      });
    }

    // Add retry button for recoverable errors
    if (error.recoverable && !error.retryAfter) {
      buttons.unshift({
        text: 'Try Again',
        style: 'default',
      });
    }

    return buttons;
  }

  /**
   * Get recovery suggestions for specific errors
   */
  static getRecoverySuggestions(code: ErrorCode): string[] {
    switch (code) {
      case 'NETWORK_ERROR':
        return [
          'Check your internet connection',
          'Try switching between WiFi and mobile data',
          'Restart the app and try again',
        ];

      case 'INVALID_CODE':
        return [
          'Double-check the code in your email',
          'Make sure you\'re using the latest code',
          'Request a new code if needed',
        ];

      case 'CODE_EXPIRED':
        return [
          'Request a new reset code',
          'Check your email more quickly next time',
          'Codes expire in 10 minutes for security',
        ];

      case 'TOO_MANY_ATTEMPTS':
        return [
          'Wait before trying again',
          'Double-check your information',
          'Contact support if you continue having issues',
        ];

      case 'WEAK_PASSWORD':
        return [
          'Use at least 8 characters',
          'Include uppercase and lowercase letters',
          'Add numbers and special characters',
          'Avoid common passwords',
        ];

      case 'EMAIL_SERVICE_ERROR':
        return [
          'Check your email address spelling',
          'Check your spam/junk folder',
          'Try again in a few minutes',
          'Contact support if persistent',
        ];

      default:
        return [
          'Try again in a few minutes',
          'Check your internet connection',
          'Contact support if the problem persists',
        ];
    }
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(code: ErrorCode): boolean {
    return ERROR_MESSAGES[code]?.recoverable ?? true;
  }

  /**
   * Get retry delay for error
   */
  static getRetryDelay(code: ErrorCode): number | null {
    return ERROR_MESSAGES[code]?.retryAfter ?? null;
  }

  /**
   * Get error logs for debugging
   */
  static async getErrorLogs(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem(ERROR_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  /**
   * Clear error logs
   */
  static async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }
}

/**
 * Convenience function for handling errors
 */
export const handlePasswordResetError = async (
  error: any,
  step: PasswordResetStep,
  email?: string,
  showAlert: boolean = true
): Promise<PasswordResetError> => {
  return PasswordResetErrorHandler.handleError(error, step, email, {
    showAlert,
  });
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (code: ErrorCode): string => {
  return ERROR_MESSAGES[code]?.userMessage || 'An unexpected error occurred. Please try again.';
};

/**
 * Get recovery suggestions
 */
export const getRecoverySuggestions = (code: ErrorCode): string[] => {
  return PasswordResetErrorHandler.getRecoverySuggestions(code);
};

// Export everything
export {
  ERROR_MESSAGES,
  PasswordResetErrorHandler as ErrorHandler,
};

export default PasswordResetErrorHandler;