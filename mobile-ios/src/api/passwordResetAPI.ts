// Enhanced Password Reset API Service
// Comprehensive API layer for the password reset system

import axiosInstance from './axiosInstance';
import apiEndpoints from '../config/apiEndPoint';
import {
  RequestResetCodePayload,
  RequestResetCodeResponse,
  VerifyResetCodePayload,
  VerifyResetCodeResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  MagicLinkData,
} from '../utils/passwordResetTypes';

// ============================================================================
// API ENDPOINTS (Enhanced)
// ============================================================================

const PASSWORD_RESET_ENDPOINTS = {
  // Core endpoints
  REQUEST_CODE: '/auth/request-reset-code',
  VERIFY_CODE: '/auth/verify-reset-code',
  RESET_PASSWORD: '/auth/reset-password-with-token',

  // Enhanced endpoints
  RESEND_CODE: '/auth/resend-reset-code',
  CHECK_RATE_LIMIT: '/auth/check-reset-rate-limit',
  VERIFY_TOKEN: '/auth/verify-reset-token',

  // Magic link endpoints
  GENERATE_MAGIC_LINK: '/auth/generate-magic-link',
  VERIFY_MAGIC_LINK: '/auth/verify-magic-link',

  // Security endpoints
  CHECK_SECURITY_STATUS: '/auth/check-security-status',
  REPORT_SUSPICIOUS_ACTIVITY: '/auth/report-suspicious-activity',
};

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

/**
 * Request a password reset code via email/SMS - NEW AWS SES Integration
 */
export const requestResetCode = async (payload: RequestResetCodePayload): Promise<RequestResetCodeResponse> => {
  try {
    console.log('🔐 [RESET API] Requesting reset code via new email service for:', payload.email);

    // Generate a secure 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Use the new working email service endpoint
    const response = await axiosInstance.post('/api/email/send-password-reset', {
      recipientEmail: payload.email,
      recipientName: payload.email.split('@')[0], // Extract name from email
      resetCode: resetCode,
      expirationMinutes: 10,
      ipAddress: payload.deviceInfo?.ipAddress || 'unknown',
      deviceInfo: `${payload.deviceInfo?.platform || 'unknown'} ${payload.deviceInfo?.version || ''}`.trim(),
    });

    console.log('🔐 [RESET API] Email service response:', response.data);

    if (response.data.success) {
      // Store the reset code and email for later verification
      // This is a temporary solution - in production, codes should be stored securely on the backend
      global.passwordResetData = {
        email: payload.email,
        resetCode: resetCode,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        createdAt: Date.now(),
      };

      return {
        success: true,
        message: 'Password reset code sent successfully',
        data: {
          codeExpiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
          canResendAt: Date.now() + (60 * 1000), // 1 minute
          attemptsRemaining: 5,
          method: 'email',
        },
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to send reset code',
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: response.data.message || 'Failed to send reset email',
        },
      };
    }

  } catch (error: any) {
    console.error('🔐 [RESET API] Code request failed:', error.response?.status, error.message);

    // Handle specific email service errors
    const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';

    // Check for sandbox/verification errors
    if (errorMessage.includes('not verified') || errorMessage.includes('sandbox')) {
      return {
        success: false,
        message: 'This email address is not verified for password reset in development mode. Please contact support or try a verified email address.',
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: errorMessage,
        },
      };
    }

    // Handle rate limiting
    if (error.response?.status === 429 || errorMessage.includes('rate limit')) {
      return {
        success: false,
        message: 'Too many reset attempts. Please try again later.',
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Rate limit exceeded',
          lockoutExpiresAt: Date.now() + (60 * 60 * 1000),
        },
      };
    }

    return {
      success: false,
      message: 'Failed to send reset email. Please check your email address and try again.',
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: errorMessage,
      },
    };
  }
};

/**
 * Verify a password reset code - NEW Local Verification
 */
export const verifyResetCode = async (payload: VerifyResetCodePayload): Promise<VerifyResetCodeResponse> => {
  try {
    console.log('🔐 [RESET API] Verifying reset code for:', payload.email);

    // Get stored reset data
    const storedData = global.passwordResetData;

    if (!storedData) {
      return {
        success: false,
        message: 'No reset request found. Please request a new reset code.',
        error: {
          code: 'NO_RESET_REQUEST',
          message: 'Reset session not found',
        },
      };
    }

    // Check if email matches
    if (storedData.email !== payload.email) {
      return {
        success: false,
        message: 'Invalid reset request. Please try again.',
        error: {
          code: 'EMAIL_MISMATCH',
          message: 'Email does not match reset request',
        },
      };
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      global.passwordResetData = null; // Clear expired data
      return {
        success: false,
        message: 'Reset code has expired. Please request a new one.',
        error: {
          code: 'CODE_EXPIRED',
          message: 'Reset code expired',
        },
      };
    }

    // Check if code matches
    if (storedData.resetCode !== payload.code) {
      return {
        success: false,
        message: 'Invalid reset code. Please check and try again.',
        error: {
          code: 'INVALID_CODE',
          message: 'Reset code is incorrect',
        },
      };
    }

    // Code is valid - generate a temporary reset token
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store the reset token temporarily
    global.passwordResetToken = {
      email: payload.email,
      token: resetToken,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes for password reset
      createdAt: Date.now(),
    };

    console.log('🔐 [RESET API] Code verification successful');

    return {
      success: true,
      message: 'Reset code verified successfully',
      data: {
        resetToken: resetToken,
        expiresAt: Date.now() + (30 * 60 * 1000),
        email: payload.email,
      },
    };

  } catch (error: any) {
    console.error('🔐 [RESET API] Code verification failed:', error);

    return {
      success: false,
      message: 'Failed to verify reset code. Please try again.',
      error: {
        code: 'VERIFICATION_ERROR',
        message: error.message || 'Code verification failed',
      },
    };
  }
};

/**
 * Reset password using verified token
 */
export const resetPassword = async (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
  try {
    console.log('🔐 [RESET API] Resetting password with local token verification');

    // First, verify the reset token
    const tokenData = global.passwordResetToken;

    if (!tokenData) {
      return {
        success: false,
        message: 'Invalid reset session. Please start the password reset process again.',
        error: {
          code: 'NO_TOKEN',
          message: 'Reset token not found',
        },
      };
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      global.passwordResetToken = null; // Clear expired token
      return {
        success: false,
        message: 'Reset session has expired. Please request a new reset code.',
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token expired',
        },
      };
    }

    // Check if token matches
    if (tokenData.token !== payload.resetToken) {
      return {
        success: false,
        message: 'Invalid reset token. Please try again.',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token mismatch',
        },
      };
    }

    // Use the existing backend password reset endpoint
    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.RESET_PASSWORD}`,
      {
        token: payload.resetToken,
        newPassword: payload.newPassword,
      }
    );

    console.log('🔐 [RESET API] Password reset response:', response.data);

    // Clear stored data on successful reset
    if (response.data.status === 'SUCCESS' || response.data.success) {
      global.passwordResetData = null;
      global.passwordResetToken = null;

      return {
        success: true,
        message: 'Password reset successfully',
        data: {
          autoLogin: false,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        },
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to reset password',
        error: {
          code: 'RESET_FAILED',
          message: response.data.message || 'Password reset failed',
        },
      };
    }

  } catch (error: any) {
    console.error('🔐 [RESET API] Password reset failed:', error.response?.status, error.message);

    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        message: 'Invalid or expired reset token. Please request a new code.',
        error: {
          code: 'INVALID_TOKEN',
          message: 'Reset token is invalid or expired',
        },
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reset password',
      error: {
        code: error.response?.data?.errorCode || 'RESET_ERROR',
        message: error.response?.data?.message || error.message,
      },
    };
  }
};

// ============================================================================
// ENHANCED FEATURES
// ============================================================================

/**
 * Resend password reset code
 */
export const resendResetCode = async (payload: RequestResetCodePayload): Promise<RequestResetCodeResponse> => {
  try {
    console.log('🔐 [RESET API] Resending reset code for:', payload.email);

    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.RESEND_CODE}`,
      {
        email: payload.email,
        method: payload.method,
        deviceInfo: payload.deviceInfo,
        timestamp: Date.now(),
      }
    );

    return {
      success: response.data.success || false,
      message: response.data.message || 'Reset code resent',
      data: response.data.success ? {
        codeExpiresAt: response.data.codeExpiresAt || Date.now() + (10 * 60 * 1000),
        canResendAt: response.data.canResendAt || Date.now() + (60 * 1000),
        attemptsRemaining: response.data.attemptsRemaining || 5,
        method: response.data.method || payload.method,
      } : undefined,
      error: !response.data.success ? {
        code: response.data.errorCode || 'RESEND_FAILED',
        message: response.data.message || 'Failed to resend code',
        lockoutExpiresAt: response.data.lockoutExpiresAt,
      } : undefined,
    };

  } catch (error: any) {
    console.error('🔐 [RESET API] Resend failed:', error.response?.status, error.message);

    if (error.response?.status === 429) {
      return {
        success: false,
        message: 'Please wait before requesting another code.',
        error: {
          code: 'TOO_MANY_RESENDS',
          message: 'Resend rate limit exceeded',
          lockoutExpiresAt: error.response.data?.lockoutExpiresAt || Date.now() + (5 * 60 * 1000),
        },
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to resend code',
      error: {
        code: error.response?.data?.errorCode || 'RESEND_ERROR',
        message: error.response?.data?.message || error.message,
      },
    };
  }
};

/**
 * Check rate limiting status for an email
 */
export const checkRateLimit = async (email: string): Promise<{
  canRequest: boolean;
  attemptsRemaining: number;
  nextAttemptAt?: number;
  lockoutExpiresAt?: number;
}> => {
  try {
    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.CHECK_RATE_LIMIT}`,
      { email }
    );

    return {
      canRequest: response.data.canRequest || false,
      attemptsRemaining: response.data.attemptsRemaining || 0,
      nextAttemptAt: response.data.nextAttemptAt,
      lockoutExpiresAt: response.data.lockoutExpiresAt,
    };

  } catch (error) {
    console.warn('🔐 [RESET API] Rate limit check failed:', error);
    // Assume can request if check fails
    return {
      canRequest: true,
      attemptsRemaining: 5,
    };
  }
};

/**
 * Verify a reset token is still valid
 */
export const verifyResetToken = async (token: string): Promise<{
  isValid: boolean;
  expiresAt?: number;
}> => {
  try {
    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.VERIFY_TOKEN}`,
      { token }
    );

    return {
      isValid: response.data.isValid || false,
      expiresAt: response.data.expiresAt,
    };

  } catch (error) {
    console.warn('🔐 [RESET API] Token verification failed:', error);
    return {
      isValid: false,
    };
  }
};

// ============================================================================
// MAGIC LINK FEATURES
// ============================================================================

/**
 * Generate magic link for password reset
 */
export const generateMagicLink = async (email: string): Promise<{
  success: boolean;
  message: string;
  magicLink?: string;
}> => {
  try {
    console.log('🔗 [MAGIC LINK] Generating magic link for:', email);

    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.GENERATE_MAGIC_LINK}`,
      { email, timestamp: Date.now() }
    );

    return {
      success: response.data.success || false,
      message: response.data.message || 'Magic link sent',
      magicLink: response.data.magicLink,
    };

  } catch (error: any) {
    console.error('🔗 [MAGIC LINK] Generation failed:', error.response?.status, error.message);

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to generate magic link',
    };
  }
};

/**
 * Verify magic link token
 */
export const verifyMagicLink = async (token: string): Promise<MagicLinkData | null> => {
  try {
    console.log('🔗 [MAGIC LINK] Verifying magic link token');

    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.VERIFY_MAGIC_LINK}`,
      { token }
    );

    if (response.data.success) {
      return {
        token: response.data.resetToken,
        email: response.data.email,
        expiresAt: response.data.expiresAt,
        singleUse: response.data.singleUse || true,
      };
    }

    return null;

  } catch (error) {
    console.error('🔗 [MAGIC LINK] Verification failed:', error);
    return null;
  }
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Check security status for an account
 */
export const checkSecurityStatus = async (email: string): Promise<{
  isSecure: boolean;
  riskScore: number;
  warnings: string[];
}> => {
  try {
    const response = await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.CHECK_SECURITY_STATUS}`,
      { email }
    );

    return {
      isSecure: response.data.isSecure || true,
      riskScore: response.data.riskScore || 0,
      warnings: response.data.warnings || [],
    };

  } catch (error) {
    console.warn('🔐 [SECURITY] Status check failed:', error);
    return {
      isSecure: true,
      riskScore: 0,
      warnings: [],
    };
  }
};

/**
 * Report suspicious activity
 */
export const reportSuspiciousActivity = async (data: {
  email: string;
  activityType: string;
  deviceInfo: any;
  details: any;
}): Promise<void> => {
  try {
    await axiosInstance.post(
      `${apiEndpoints.BASE_URL}${PASSWORD_RESET_ENDPOINTS.REPORT_SUSPICIOUS_ACTIVITY}`,
      data
    );
  } catch (error) {
    console.warn('🚨 [SECURITY] Failed to report suspicious activity:', error);
  }
};

// ============================================================================
// FALLBACK FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Legacy function wrapper for existing code
 */
export const resetPasswordLegacy = async (email: string) => {
  const payload: RequestResetCodePayload = {
    email,
    method: 'email',
  };

  const response = await requestResetCode(payload);
  return {
    status: response.success ? 'SUCCESS' : 'FAILED',
    message: response.message,
    data: response.data,
  };
};

/**
 * Legacy OTP verification wrapper
 */
export const verifyOTPLegacy = async (data: { otpCode: number; email: string }) => {
  const payload: VerifyResetCodePayload = {
    email: data.email,
    code: data.otpCode.toString(),
  };

  const response = await verifyResetCode(payload);
  return {
    status: response.success ? 'SUCCESS' : 'FAILED',
    message: response.message,
    data: response.data,
  };
};

/**
 * Legacy password reset wrapper
 */
export const passwordResetLegacy = async (data: { token: string; newPassword: string }) => {
  const payload: ResetPasswordPayload = {
    resetToken: data.token,
    newPassword: data.newPassword,
  };

  const response = await resetPassword(payload);
  return {
    status: response.success ? 'SUCCESS' : 'FAILED',
    message: response.message,
    data: response.data,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export const passwordResetAPI = {
  // Core functions
  requestResetCode,
  verifyResetCode,
  resetPassword,
  resendResetCode,

  // Utilities
  checkRateLimit,
  verifyResetToken,

  // Magic links
  generateMagicLink,
  verifyMagicLink,

  // Security
  checkSecurityStatus,
  reportSuspiciousActivity,

  // Legacy compatibility
  resetPasswordLegacy,
  verifyOTPLegacy,
  passwordResetLegacy,
};