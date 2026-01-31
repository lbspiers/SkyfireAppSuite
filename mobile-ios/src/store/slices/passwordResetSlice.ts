// Password Reset Redux Slice
// Enhanced state management for the password reset flow

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  PasswordResetState,
  PasswordResetStep,
  PasswordResetAnalytics,
  RequestResetCodePayload,
  VerifyResetCodePayload,
  ResetPasswordPayload,
  RequestResetCodeResponse,
  VerifyResetCodeResponse,
  ResetPasswordResponse,
  DeviceInfo,
  initialPasswordResetState,
} from '../../utils/passwordResetTypes';
import { passwordResetAPI } from '../../api/passwordResetAPI';
import { getDeviceInfo } from '../../utils/deviceInfo';
import { trackPasswordResetEvent } from '../../utils/analytics';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const requestResetCode = createAsyncThunk<
  RequestResetCodeResponse,
  { email: string; method?: 'email' | 'sms' | 'both' },
  { rejectValue: string }
>('passwordReset/requestCode', async ({ email, method = 'email' }, { rejectWithValue }) => {
  try {
    const deviceInfo = await getDeviceInfo();

    const payload: RequestResetCodePayload = {
      email,
      method,
      deviceInfo,
    };

    // Track analytics
    trackPasswordResetEvent({
      eventType: 'email_submitted',
      timestamp: Date.now(),
      email,
      step: 'EMAIL_INPUT',
      success: false, // Will be updated on success
      deviceInfo,
    });

    const response = await passwordResetAPI.requestResetCode(payload);

    if (response.success) {
      // Track success
      trackPasswordResetEvent({
        eventType: 'code_sent',
        timestamp: Date.now(),
        email,
        step: 'CODE_SENT',
        success: true,
        deviceInfo,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send reset code';

    // Track error
    trackPasswordResetEvent({
      eventType: 'error_occurred',
      timestamp: Date.now(),
      email,
      step: 'EMAIL_INPUT',
      success: false,
      errorCode: error?.response?.data?.code || 'UNKNOWN_ERROR',
    });

    return rejectWithValue(errorMessage);
  }
});

export const verifyResetCode = createAsyncThunk<
  VerifyResetCodeResponse,
  { email: string; code: string },
  { rejectValue: string }
>('passwordReset/verifyCode', async ({ email, code }, { rejectWithValue }) => {
  try {
    const deviceInfo = await getDeviceInfo();

    const payload: VerifyResetCodePayload = {
      email,
      code,
      deviceInfo,
    };

    // Track analytics
    trackPasswordResetEvent({
      eventType: 'code_entered',
      timestamp: Date.now(),
      email,
      step: 'CODE_INPUT',
      success: false,
      deviceInfo,
    });

    const response = await passwordResetAPI.verifyResetCode(payload);

    if (response.success) {
      // Track success
      trackPasswordResetEvent({
        eventType: 'code_verified',
        timestamp: Date.now(),
        email,
        step: 'CODE_INPUT',
        success: true,
        deviceInfo,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify code';

    // Track error
    trackPasswordResetEvent({
      eventType: 'error_occurred',
      timestamp: Date.now(),
      email,
      step: 'CODE_INPUT',
      success: false,
      errorCode: error?.response?.data?.code || 'INVALID_CODE',
    });

    return rejectWithValue(errorMessage);
  }
});

export const resetPassword = createAsyncThunk<
  ResetPasswordResponse,
  { resetToken: string; newPassword: string },
  { rejectValue: string }
>('passwordReset/resetPassword', async ({ resetToken, newPassword }, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { passwordReset: PasswordResetState };
    const { email } = state.passwordReset;
    const deviceInfo = await getDeviceInfo();

    const payload: ResetPasswordPayload = {
      resetToken,
      newPassword,
      deviceInfo,
    };

    // Track analytics
    trackPasswordResetEvent({
      eventType: 'password_set',
      timestamp: Date.now(),
      email,
      step: 'NEW_PASSWORD',
      success: false,
      deviceInfo,
    });

    const response = await passwordResetAPI.resetPassword(payload);

    if (response.success) {
      // Track success
      trackPasswordResetEvent({
        eventType: 'reset_completed',
        timestamp: Date.now(),
        email,
        step: 'SUCCESS',
        success: true,
        deviceInfo,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset password';

    // Track error
    trackPasswordResetEvent({
      eventType: 'error_occurred',
      timestamp: Date.now(),
      email: '',
      step: 'NEW_PASSWORD',
      success: false,
      errorCode: error?.response?.data?.code || 'UNKNOWN_ERROR',
    });

    return rejectWithValue(errorMessage);
  }
});

export const resendResetCode = createAsyncThunk<
  RequestResetCodeResponse,
  { email: string; method?: 'email' | 'sms' | 'both' },
  { rejectValue: string }
>('passwordReset/resendCode', async ({ email, method = 'email' }, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { passwordReset: PasswordResetState };

    // Check if resend is allowed
    if (state.passwordReset.canResendAt && Date.now() < state.passwordReset.canResendAt) {
      return rejectWithValue('Please wait before requesting another code');
    }

    const deviceInfo = await getDeviceInfo();

    const payload: RequestResetCodePayload = {
      email,
      method,
      deviceInfo,
    };

    // Track analytics
    trackPasswordResetEvent({
      eventType: 'resend_requested',
      timestamp: Date.now(),
      email,
      step: 'CODE_SENT',
      success: false,
      deviceInfo,
    });

    const response = await passwordResetAPI.requestResetCode(payload);

    if (response.success) {
      // Track success
      trackPasswordResetEvent({
        eventType: 'code_sent',
        timestamp: Date.now(),
        email,
        step: 'CODE_SENT',
        success: true,
        deviceInfo,
      });
    }

    return response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to resend code';

    // Track error
    trackPasswordResetEvent({
      eventType: 'error_occurred',
      timestamp: Date.now(),
      email,
      step: 'CODE_SENT',
      success: false,
      errorCode: error?.response?.data?.code || 'RESEND_ERROR',
    });

    return rejectWithValue(errorMessage);
  }
});

// ============================================================================
// SLICE DEFINITION
// ============================================================================

const passwordResetSlice = createSlice({
  name: 'passwordReset',
  initialState: initialPasswordResetState,
  reducers: {
    // Navigation
    setStep: (state, action: PayloadAction<PasswordResetStep>) => {
      state.currentStep = action.payload;
      state.error = null; // Clear errors when navigating
    },

    // Form data
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
      state.error = null;
    },

    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
      state.error = null;
    },

    setNewPassword: (state, action: PayloadAction<string>) => {
      state.newPassword = action.payload;
      state.error = null;
    },

    setConfirmPassword: (state, action: PayloadAction<string>) => {
      state.confirmPassword = action.payload;
      state.error = null;
    },

    // UI State
    toggleShowPassword: (state, action: PayloadAction<boolean | undefined>) => {
      state.showPassword = action.payload !== undefined ? action.payload : !state.showPassword;
    },

    toggleShowConfirmPassword: (state, action: PayloadAction<boolean | undefined>) => {
      state.showConfirmPassword = action.payload !== undefined ? action.payload : !state.showConfirmPassword;
    },

    setPasswordStrengthScore: (state, action: PayloadAction<number>) => {
      state.passwordStrengthScore = action.payload;
    },

    // Messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.successMessage = null; // Clear success when setting error
    },

    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
      state.error = null; // Clear error when setting success
    },

    clearError: (state) => {
      state.error = null;
    },

    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },

    // Security
    setAttemptsRemaining: (state, action: PayloadAction<number>) => {
      state.attemptsRemaining = action.payload;

      // Auto-trigger lockout if attempts exhausted
      if (action.payload <= 0) {
        state.isLockedOut = true;
        state.lockoutExpiresAt = Date.now() + (60 * 60 * 1000); // 1 hour lockout
        state.currentStep = 'LOCKED_OUT';
      }
    },

    setLockout: (state, action: PayloadAction<{ isLockedOut: boolean; expiresAt: number | null }>) => {
      state.isLockedOut = action.payload.isLockedOut;
      state.lockoutExpiresAt = action.payload.expiresAt;

      if (action.payload.isLockedOut) {
        state.currentStep = 'LOCKED_OUT';
      }
    },

    // Timing
    setCodeExpiry: (state, action: PayloadAction<number | null>) => {
      state.codeExpiresAt = action.payload;
    },

    setCanResendAt: (state, action: PayloadAction<number | null>) => {
      state.canResendAt = action.payload;
    },

    // Deep linking
    setResetToken: (state, action: PayloadAction<string | null>) => {
      state.resetToken = action.payload;
    },

    setDeepLinkProcessed: (state, action: PayloadAction<boolean>) => {
      state.deepLinkProcessed = action.payload;
    },

    // Complete reset
    resetState: () => {
      return { ...initialPasswordResetState };
    },

    // Check expiry states (called periodically)
    checkExpiry: (state) => {
      const now = Date.now();

      // Check code expiry
      if (state.codeExpiresAt && now > state.codeExpiresAt) {
        if (state.currentStep === 'CODE_SENT' || state.currentStep === 'CODE_INPUT') {
          state.currentStep = 'EXPIRED';
          state.error = 'Your reset code has expired. Please request a new one.';
        }
      }

      // Check lockout expiry
      if (state.isLockedOut && state.lockoutExpiresAt && now > state.lockoutExpiresAt) {
        state.isLockedOut = false;
        state.lockoutExpiresAt = null;
        state.attemptsRemaining = 5; // Reset attempts
        if (state.currentStep === 'LOCKED_OUT') {
          state.currentStep = 'EMAIL_INPUT';
          state.error = null;
        }
      }
    },
  },

  extraReducers: (builder) => {
    // Request Reset Code
    builder
      .addCase(requestResetCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestResetCode.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && action.payload.data) {
          state.currentStep = 'CODE_SENT';
          state.codeExpiresAt = action.payload.data.codeExpiresAt;
          state.canResendAt = action.payload.data.canResendAt;
          state.attemptsRemaining = action.payload.data.attemptsRemaining;
          state.successMessage = 'Reset code sent! Check your email.';
        } else if (action.payload.error) {
          state.error = action.payload.error.message;
          if (action.payload.error.lockoutExpiresAt) {
            state.isLockedOut = true;
            state.lockoutExpiresAt = action.payload.error.lockoutExpiresAt;
            state.currentStep = 'LOCKED_OUT';
          }
        }
      })
      .addCase(requestResetCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to send reset code';
      });

    // Verify Reset Code
    builder
      .addCase(verifyResetCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyResetCode.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && action.payload.data) {
          state.currentStep = 'NEW_PASSWORD';
          state.resetToken = action.payload.data.resetToken;
          state.successMessage = 'Code verified! Set your new password.';
        } else if (action.payload.error) {
          state.error = action.payload.error.message;

          if (action.payload.error.attemptsRemaining !== undefined) {
            state.attemptsRemaining = action.payload.error.attemptsRemaining;
          }

          if (action.payload.error.lockoutExpiresAt) {
            state.isLockedOut = true;
            state.lockoutExpiresAt = action.payload.error.lockoutExpiresAt;
            state.currentStep = 'LOCKED_OUT';
          }
        }
      })
      .addCase(verifyResetCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Invalid or expired code';
        state.attemptsRemaining = Math.max(0, state.attemptsRemaining - 1);
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success) {
          state.currentStep = 'SUCCESS';
          state.successMessage = 'Password reset successfully!';

          // Clear sensitive data
          state.code = '';
          state.newPassword = '';
          state.confirmPassword = '';
          state.resetToken = null;
        } else if (action.payload.error) {
          state.error = action.payload.error.message;
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to reset password';
      });

    // Resend Code
    builder
      .addCase(resendResetCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendResetCode.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && action.payload.data) {
          state.codeExpiresAt = action.payload.data.codeExpiresAt;
          state.canResendAt = action.payload.data.canResendAt;
          state.attemptsRemaining = action.payload.data.attemptsRemaining;
          state.successMessage = 'New reset code sent!';
          state.code = ''; // Clear previous code
        } else if (action.payload.error) {
          state.error = action.payload.error.message;
        }
      })
      .addCase(resendResetCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to resend code';
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setStep,
  setEmail,
  setCode,
  setNewPassword,
  setConfirmPassword,
  toggleShowPassword,
  toggleShowConfirmPassword,
  setPasswordStrengthScore,
  setError,
  setSuccessMessage,
  clearError,
  clearSuccessMessage,
  setAttemptsRemaining,
  setLockout,
  setCodeExpiry,
  setCanResendAt,
  setResetToken,
  setDeepLinkProcessed,
  resetState,
  checkExpiry,
} = passwordResetSlice.actions;

// Selectors
export const selectPasswordResetState = (state: { passwordReset: PasswordResetState }) => state.passwordReset;
export const selectCurrentStep = (state: { passwordReset: PasswordResetState }) => state.passwordReset.currentStep;
export const selectIsLoading = (state: { passwordReset: PasswordResetState }) => state.passwordReset.isLoading;
export const selectError = (state: { passwordReset: PasswordResetState }) => state.passwordReset.error;
export const selectCanResend = (state: { passwordReset: PasswordResetState }) => {
  const { canResendAt } = state.passwordReset;
  return !canResendAt || Date.now() >= canResendAt;
};

export default passwordResetSlice.reducer;