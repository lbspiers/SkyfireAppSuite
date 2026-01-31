// Email API Service - Integration with Skyfire Solar Email Backend
// Connects admin panel with AWS SES email service

import axiosInstance from "../api/axiosInstance";

/** Type definitions for Email API */
export interface EmailApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  requestId?: string;
  error?: string;
}

export interface DemoConfirmationRequest {
  recipientEmail: string;
  recipientName: string;
  demoDate: string;
  demoTime: string;
  companyName?: string;
  contactPhone?: string;
  notes?: string;
  confirmationId?: string;
}

export interface PasswordResetRequest {
  recipientEmail: string;
  recipientName?: string;
  resetCode: string;
  resetToken?: string;
  expirationMinutes?: number;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface TestEmailRequest {
  recipientEmail: string;
  templateType: 'demo_confirmation' | 'password_reset';
  adminEmail: string;
  testData?: {
    name?: string;
    date?: string;
    time?: string;
    company?: string;
  };
}

export interface EmailHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  quota?: {
    max24HourSend: number;
    maxSendRate: number;
    sentLast24Hours: number;
    remainingQuota: number;
  };
  statistics?: Array<{
    timestamp: string;
    deliveryDelay: number;
    bounces: number;
    complaints: number;
    rejects: number;
  }>;
  config?: {
    sandboxMode: boolean;
    fromEmail: string;
    region: string;
    verifiedEmailCount: number;
  };
}

export interface EmailServiceConfig {
  status: 'initialized' | 'not_initialized';
  region: string;
  fromEmail: string;
  sandboxMode: boolean;
  verifiedEmailCount: number;
  maxSendRate: number;
  maxSendQuota: number;
  environment: {
    environment: string;
    isProduction: boolean;
    isDevelopment: boolean;
  };
}

export interface SystemTestResult {
  timestamp: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  tests: {
    configuration: { status: string; message: string; details?: any };
    sesConnection: { status: string; message: string; details?: any };
    serviceHealth: { status: string; message: string; details?: any };
    sandboxValidation: { status: string; message: string; details?: any };
    templateGeneration: { status: string; message: string; details?: any };
    emailSending?: { status: string; message: string; details?: any };
    errorHandling: { status: string; message: string; details?: any };
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: string;
  };
  errors: string[];
  warnings: string[];
}

/** Email API service */
export const emailAPI = {
  /**
   * Check email service health
   */
  checkHealth: async (): Promise<EmailApiResponse<EmailHealthStatus>> => {
    try {
      const response = await axiosInstance.get("/api/email/health");

      console.log('📧 [EMAIL_API] Health check response:', {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] checkHealth error:", error?.response?.data || error?.message || error);

      // Transform error to match expected format
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Health check failed",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'HEALTH_CHECK_FAILED'
      };
    }
  },

  /**
   * Get email service configuration (admin only)
   */
  getConfiguration: async (adminEmail: string): Promise<EmailApiResponse<EmailServiceConfig>> => {
    try {
      const response = await axiosInstance.get(`/api/email/config?admin=${encodeURIComponent(adminEmail)}`);

      console.log('📧 [EMAIL_API] Configuration response:', {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] getConfiguration error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Failed to get configuration",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'CONFIG_FETCH_FAILED'
      };
    }
  },

  /**
   * Send demo confirmation email
   */
  sendDemoConfirmation: async (request: DemoConfirmationRequest): Promise<EmailApiResponse> => {
    try {
      const response = await axiosInstance.post("/api/email/send-demo-confirmation", request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📧 [EMAIL_API] Demo confirmation sent:', {
        status: response.status,
        recipient: request.recipientEmail,
        messageId: response.data.data?.messageId
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] sendDemoConfirmation error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Failed to send demo confirmation",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'DEMO_SEND_FAILED'
      };
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordReset: async (request: PasswordResetRequest): Promise<EmailApiResponse> => {
    try {
      const response = await axiosInstance.post("/api/email/send-password-reset", request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📧 [EMAIL_API] Password reset sent:', {
        status: response.status,
        recipient: request.recipientEmail,
        messageId: response.data.data?.messageId
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] sendPasswordReset error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Failed to send password reset",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'PASSWORD_RESET_FAILED'
      };
    }
  },

  /**
   * Send test email (admin only)
   */
  sendTestEmail: async (request: TestEmailRequest): Promise<EmailApiResponse> => {
    try {
      const response = await axiosInstance.post("/api/email/test-send", request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📧 [EMAIL_API] Test email sent:', {
        status: response.status,
        recipient: request.recipientEmail,
        templateType: request.templateType,
        admin: request.adminEmail,
        messageId: response.data.data?.messageId
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] sendTestEmail error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Failed to send test email",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'TEST_EMAIL_FAILED'
      };
    }
  },

  /**
   * Run system test (admin only)
   */
  runSystemTest: async (
    adminEmail: string,
    options: {
      recipient?: string;
      skipSending?: boolean;
      verbose?: boolean;
    } = {}
  ): Promise<EmailApiResponse<SystemTestResult>> => {
    try {
      const params = new URLSearchParams({
        admin: adminEmail,
        ...(options.recipient && { recipient: options.recipient }),
        ...(options.skipSending !== undefined && { skipSending: options.skipSending.toString() }),
        ...(options.verbose !== undefined && { verbose: options.verbose.toString() }),
      });

      const response = await axiosInstance.get(`/api/system/test?${params.toString()}`);

      console.log('📧 [EMAIL_API] System test completed:', {
        status: response.status,
        overallStatus: response.data.data?.overallStatus,
        admin: adminEmail
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] runSystemTest error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "System test failed",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'SYSTEM_TEST_FAILED'
      };
    }
  },

  /**
   * Check production readiness (admin only)
   */
  checkProductionReadiness: async (adminEmail: string): Promise<EmailApiResponse> => {
    try {
      const response = await axiosInstance.get(`/api/system/production-ready?admin=${encodeURIComponent(adminEmail)}`);

      console.log('📧 [EMAIL_API] Production readiness check:', {
        status: response.status,
        isReady: response.data.data?.isProductionReady,
        admin: adminEmail
      });

      return response.data;
    } catch (error: any) {
      console.error("[emailAPI] checkProductionReadiness error:", error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || "Production readiness check failed",
        timestamp: new Date().toISOString(),
        error: error?.response?.data?.error || 'PRODUCTION_CHECK_FAILED'
      };
    }
  },

  /**
   * Generate test data for email templates
   */
  generateTestData: (templateType: 'demo_confirmation' | 'password_reset', recipientEmail?: string) => {
    const baseRecipient = recipientEmail || 'designs@skyfiresd.com';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (templateType) {
      case 'demo_confirmation':
        return {
          recipientEmail: baseRecipient,
          recipientName: 'Test User',
          demoDate: tomorrow.toISOString().split('T')[0],
          demoTime: '2:00 PM',
          companyName: 'Test Company Ltd',
          contactPhone: '(480) 759-3473',
          notes: 'This is a test demo confirmation email generated from the admin panel.',
          confirmationId: 'TEST-' + Date.now().toString(36).toUpperCase()
        };

      case 'password_reset':
        return {
          recipientEmail: baseRecipient,
          recipientName: 'Test User',
          resetCode: Math.floor(100000 + Math.random() * 900000).toString(),
          resetToken: 'test-token-' + Date.now().toString(36),
          expirationMinutes: 10,
          ipAddress: '192.168.1.100',
          deviceInfo: 'Chrome 120 on Windows 10 (Test Device)'
        };

      default:
        return {};
    }
  },

  /**
   * Validate email address format
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if email is verified for sandbox mode
   */
  isEmailVerifiedForSandbox: (email: string): boolean => {
    const verifiedEmails = [
      'designs@skyfiresd.com',
      'app@skyfiresd.com',
      'test@skyfiresd.com'
    ];

    return verifiedEmails.includes(email.toLowerCase());
  },

  /**
   * Get current admin user email from storage/context
   * This should be replaced with actual auth context
   */
  getCurrentAdminEmail: (): string => {
    // TODO: Replace with actual auth context/storage
    // For now, return default admin email
    return 'designs@skyfiresd.com';
  },

  /**
   * Format error message for display
   */
  formatErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Get user-friendly error message based on error code
   */
  getUserFriendlyErrorMessage: (errorCode: string, defaultMessage: string): string => {
    const errorMessages: Record<string, string> = {
      'RATE_LIMIT_EXCEEDED': 'You are sending emails too frequently. Please wait before trying again.',
      'EMAIL_NOT_VERIFIED': 'This email address is not verified for sending in sandbox mode.',
      'INVALID_EMAIL': 'Please enter a valid email address.',
      'UNAUTHORIZED': 'You do not have permission to perform this action.',
      'FORBIDDEN': 'Access denied. Admin privileges required.',
      'HEALTH_CHECK_FAILED': 'Email service is temporarily unavailable.',
      'CONFIG_FETCH_FAILED': 'Unable to retrieve email service configuration.',
      'DEMO_SEND_FAILED': 'Failed to send demo confirmation email.',
      'PASSWORD_RESET_FAILED': 'Failed to send password reset email.',
      'TEST_EMAIL_FAILED': 'Failed to send test email.',
      'SYSTEM_TEST_FAILED': 'System test could not be completed.',
      'PRODUCTION_CHECK_FAILED': 'Production readiness check failed.',
    };

    return errorMessages[errorCode] || defaultMessage;
  },
};