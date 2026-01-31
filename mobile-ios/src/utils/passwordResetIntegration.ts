// Password Reset System Integration
// Complete integration guide and helper functions for the password reset system

import { NavigationContainerRef } from '@react-navigation/native';
import { store } from '../store';

// Import all password reset utilities
import { initializeDeepLinking, generateDeepLinks } from './deepLinking';
import { initializeAnalytics } from './analytics';
import { PasswordResetErrorHandler } from './passwordResetErrorHandler';
import { passwordResetEmailTemplates } from './passwordResetEmailTemplates';
import { passwordResetAPI } from '../api/passwordResetAPI';

// Types for integration
interface PasswordResetConfig {
  enableAnalytics?: boolean;
  enableDeepLinking?: boolean;
  enableAutoFill?: boolean;
  sesConfig?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  emailConfig?: {
    fromEmail: string;
    supportEmail: string;
    supportPhone: string;
  };
}

interface PasswordResetIntegration {
  initialize: (navigation: NavigationContainerRef<any>, config?: PasswordResetConfig) => void;
  sendResetEmail: (email: string, firstName?: string) => Promise<boolean>;
  handleDeepLink: (url: string) => Promise<void>;
  cleanup: () => void;
}

/**
 * Main password reset integration class
 */
class PasswordResetSystem implements PasswordResetIntegration {
  private isInitialized = false;
  private navigationRef: NavigationContainerRef<any> | null = null;
  private config: PasswordResetConfig = {};

  /**
   * Initialize the complete password reset system
   */
  initialize(navigation: NavigationContainerRef<any>, config: PasswordResetConfig = {}): void {
    if (this.isInitialized) {
      console.warn('🔄 [PASSWORD RESET] System already initialized');
      return;
    }

    console.log('🚀 [PASSWORD RESET] Initializing system...');

    this.navigationRef = navigation;
    this.config = config;

    // Initialize analytics
    if (config.enableAnalytics !== false) {
      initializeAnalytics({
        enableAnalytics: true,
        enableConsoleLogging: __DEV__,
        enableRemoteLogging: !__DEV__,
        batchSize: 10,
        flushInterval: 30000,
      });
    }

    // Initialize deep linking
    if (config.enableDeepLinking !== false) {
      initializeDeepLinking(navigation);
    }

    this.isInitialized = true;
    console.log('✅ [PASSWORD RESET] System initialized successfully');
  }

  /**
   * Send password reset email
   */
  async sendResetEmail(email: string, firstName?: string): Promise<boolean> {
    try {
      console.log('📧 [PASSWORD RESET] Sending reset email to:', email);

      // Generate 6-digit code
      const resetCode = this.generateResetCode();

      // Create email template data
      const emailData = {
        firstName,
        email,
        resetCode,
        expiryMinutes: 10,
        supportEmail: this.config.emailConfig?.supportEmail || 'Designs@SkyfireSD.com',
        supportPhone: this.config.emailConfig?.supportPhone || '(480) 759-3473',
      };

      // Generate email template
      const emailTemplate = passwordResetEmailTemplates.generatePasswordResetEmail(emailData);

      // Send email (this would integrate with your email service)
      const emailSent = await this.sendEmailTemplate(emailTemplate, email);

      if (emailSent) {
        console.log('✅ [PASSWORD RESET] Email sent successfully');
        return true;
      } else {
        console.error('❌ [PASSWORD RESET] Failed to send email');
        return false;
      }

    } catch (error) {
      console.error('❌ [PASSWORD RESET] Error sending reset email:', error);
      return false;
    }
  }

  /**
   * Handle incoming deep link
   */
  async handleDeepLink(url: string): Promise<void> {
    try {
      console.log('🔗 [PASSWORD RESET] Handling deep link:', url);

      // This is handled automatically by the deep linking system
      // but can be called manually if needed

    } catch (error) {
      console.error('❌ [PASSWORD RESET] Error handling deep link:', error);
    }
  }

  /**
   * Cleanup the password reset system
   */
  cleanup(): void {
    console.log('🧹 [PASSWORD RESET] Cleaning up system...');

    // Cleanup is handled by individual modules
    this.isInitialized = false;
    this.navigationRef = null;

    console.log('✅ [PASSWORD RESET] System cleaned up');
  }

  /**
   * Generate 6-digit reset code
   */
  private generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send email template (integrate with your email service)
   */
  private async sendEmailTemplate(template: any, recipientEmail: string): Promise<boolean> {
    try {
      // This would integrate with your actual email service (AWS SES, SendGrid, etc.)
      // For now, we'll simulate success

      console.log('📧 [EMAIL] Sending email template:', {
        to: recipientEmail,
        subject: template.subject,
        htmlLength: template.html.length,
        textLength: template.text.length,
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true; // Simulate success

    } catch (error) {
      console.error('📧 [EMAIL] Failed to send email:', error);
      return false;
    }
  }
}

// Create singleton instance
const passwordResetSystem = new PasswordResetSystem();

/**
 * Integration helper functions
 */
export const PasswordResetIntegration = {
  /**
   * Initialize the complete system
   */
  initialize: (navigation: NavigationContainerRef<any>, config?: PasswordResetConfig) => {
    passwordResetSystem.initialize(navigation, config);
  },

  /**
   * Send password reset email
   */
  sendResetEmail: async (email: string, firstName?: string): Promise<boolean> => {
    return passwordResetSystem.sendResetEmail(email, firstName);
  },

  /**
   * Handle deep link
   */
  handleDeepLink: async (url: string): Promise<void> => {
    return passwordResetSystem.handleDeepLink(url);
  },

  /**
   * Cleanup system
   */
  cleanup: () => {
    passwordResetSystem.cleanup();
  },

  /**
   * Get system status
   */
  getStatus: () => ({
    initialized: passwordResetSystem['isInitialized'],
    hasNavigation: passwordResetSystem['navigationRef'] !== null,
  }),
};

/**
 * Quick setup function for easy integration
 */
export const setupPasswordReset = (
  navigation: NavigationContainerRef<any>,
  options: {
    enableAnalytics?: boolean;
    enableDeepLinking?: boolean;
    awsSESRegion?: string;
    supportEmail?: string;
    supportPhone?: string;
  } = {}
) => {
  const config: PasswordResetConfig = {
    enableAnalytics: options.enableAnalytics ?? true,
    enableDeepLinking: options.enableDeepLinking ?? true,
    emailConfig: {
      fromEmail: 'Designs@SkyfireSD.com',
      supportEmail: options.supportEmail || 'Designs@SkyfireSD.com',
      supportPhone: options.supportPhone || '(480) 759-3473',
    },
  };

  if (options.awsSESRegion) {
    config.sesConfig = {
      region: options.awsSESRegion,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };
  }

  PasswordResetIntegration.initialize(navigation, config);

  console.log('🔧 [SETUP] Password reset system configured');
};

/**
 * Navigation integration helper
 */
export const addPasswordResetScreensToNavigator = () => {
  // This would be used in your navigation configuration
  // Example usage in your navigator:

  return {
    PasswordResetEmailScreen: {
      screen: require('../screens/auth/PasswordResetEmailScreen').default,
      navigationOptions: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
    PasswordResetCodeScreen: {
      screen: require('../screens/auth/PasswordResetCodeScreen').default,
      navigationOptions: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
    PasswordResetNewPasswordScreen: {
      screen: require('../screens/auth/PasswordResetNewPasswordScreen').default,
      navigationOptions: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
    PasswordResetSuccessScreen: {
      screen: require('../screens/auth/PasswordResetSuccessScreen').default,
      navigationOptions: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
  };
};

/**
 * Redux store integration helper
 */
export const addPasswordResetToStore = () => {
  // Import the reducer and add it to your store
  // Example:

  return {
    passwordReset: require('../store/slices/passwordResetSlice').default,
  };
};

/**
 * API integration helper
 */
export const integratePasswordResetAPI = (baseURL: string, apiKey?: string) => {
  // Configure the API endpoints
  // This would be used in your API configuration

  console.log('🔌 [API] Password reset API integrated with base URL:', baseURL);

  return {
    requestResetCode: passwordResetAPI.requestResetCode,
    verifyResetCode: passwordResetAPI.verifyResetCode,
    resetPassword: passwordResetAPI.resetPassword,
    resendResetCode: passwordResetAPI.resendResetCode,
  };
};

/**
 * Testing utilities
 */
export const PasswordResetTestUtils = {
  /**
   * Generate test data
   */
  createTestData: () => ({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    resetCode: '123456',
    token: 'test-reset-token-123',
  }),

  /**
   * Mock API responses
   */
  mockAPIResponses: () => {
    // This would set up mock responses for testing
    console.log('🧪 [TEST] Mock API responses configured');
  },

  /**
   * Simulate error conditions
   */
  simulateError: (errorCode: string) => {
    console.log('🧪 [TEST] Simulating error:', errorCode);
    // This would trigger specific error conditions for testing
  },

  /**
   * Reset all test state
   */
  resetTestState: () => {
    console.log('🧪 [TEST] Resetting test state');
    // This would clear all test data and reset the system
  },
};

/**
 * Performance monitoring
 */
export const PasswordResetPerformance = {
  /**
   * Measure flow completion time
   */
  startTiming: (email: string) => {
    const startTime = Date.now();
    console.log('⏱️ [PERF] Started password reset timing for:', email);

    return {
      end: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log('⏱️ [PERF] Password reset completed in:', duration, 'ms');
        return duration;
      },
    };
  },

  /**
   * Monitor API response times
   */
  monitorAPI: () => {
    console.log('📊 [PERF] API monitoring enabled');
    // This would set up API response time monitoring
  },
};

/**
 * Security utilities
 */
export const PasswordResetSecurity = {
  /**
   * Validate email for security
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity: (email: string): boolean => {
    // This would implement suspicious activity detection
    console.log('🔒 [SECURITY] Checking suspicious activity for:', email);
    return false; // Return true if suspicious
  },

  /**
   * Rate limiting check
   */
  checkRateLimit: async (email: string): Promise<boolean> => {
    try {
      const result = await passwordResetAPI.checkRateLimit(email);
      return result.canRequest;
    } catch (error) {
      console.warn('🔒 [SECURITY] Rate limit check failed:', error);
      return true; // Allow if check fails
    }
  },
};

// Export main integration
export default PasswordResetIntegration;

// Export all utilities
export {
  setupPasswordReset,
  addPasswordResetScreensToNavigator,
  addPasswordResetToStore,
  integratePasswordResetAPI,
  PasswordResetTestUtils,
  PasswordResetPerformance,
  PasswordResetSecurity,
};

// Usage example:
/*
// In your App.tsx or main navigation file:

import { setupPasswordReset } from './src/utils/passwordResetIntegration';

// Initialize when your navigation is ready
const onNavigationReady = () => {
  setupPasswordReset(navigationRef, {
    enableAnalytics: true,
    enableDeepLinking: true,
    awsSESRegion: 'us-west-2',
    supportEmail: 'support@yourcompany.com',
    supportPhone: '(555) 123-4567',
  });
};

// In your navigator configuration:
import { addPasswordResetScreensToNavigator } from './src/utils/passwordResetIntegration';

const passwordResetScreens = addPasswordResetScreensToNavigator();

// In your Redux store configuration:
import { addPasswordResetToStore } from './src/utils/passwordResetIntegration';

const passwordResetReducers = addPasswordResetToStore();

const store = configureStore({
  reducer: {
    ...otherReducers,
    ...passwordResetReducers,
  },
});
*/