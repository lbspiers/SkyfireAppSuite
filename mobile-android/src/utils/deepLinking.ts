// Deep Linking for Password Reset
// Handle deep links, magic links, and auto-fill capabilities

import { Linking, Alert, Platform } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DeepLinkData, MagicLinkData } from './passwordResetTypes';
import { store } from '../store';
import {
  setStep,
  setEmail,
  setCode,
  setResetToken,
  setDeepLinkProcessed,
} from '../store/slices/passwordResetSlice';
import { passwordResetAPI } from '../api/passwordResetAPI';

// Navigation reference for deep linking
let navigationRef: NavigationContainerRef<any> | null = null;

// Deep link URL schemes
const URL_SCHEMES = {
  RESET: 'skyfire://reset',
  VERIFY: 'skyfire://verify',
  MAGIC: 'skyfire://magic',
} as const;

// Deep link storage keys
const STORAGE_KEYS = {
  PENDING_DEEP_LINK: '@skyfire_pending_deep_link',
  LAST_PROCESSED_LINK: '@skyfire_last_processed_link',
} as const;

/**
 * Initialize deep linking system
 */
export const initializeDeepLinking = (navRef: NavigationContainerRef<any>): void => {
  navigationRef = navRef;

  // Handle initial URL (app was closed and opened via deep link)
  handleInitialURL();

  // Listen for incoming URLs (app was backgrounded and opened via deep link)
  const subscription = Linking.addEventListener('url', handleDeepLink);

  console.log('🔗 [DEEP LINKING] Initialized');

  // Return cleanup function
  return () => {
    subscription?.remove();
  };
};

/**
 * Handle initial URL when app starts
 */
const handleInitialURL = async (): Promise<void> => {
  try {
    const initialURL = await Linking.getInitialURL();

    if (initialURL) {
      console.log('🔗 [DEEP LINKING] Initial URL:', initialURL);

      // Small delay to ensure navigation is ready
      setTimeout(() => {
        processDeepLink(initialURL);
      }, 1000);
    }

    // Check for pending deep link from storage
    const pendingLink = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_DEEP_LINK);
    if (pendingLink) {
      console.log('🔗 [DEEP LINKING] Processing pending link:', pendingLink);

      setTimeout(() => {
        processDeepLink(pendingLink);
        AsyncStorage.removeItem(STORAGE_KEYS.PENDING_DEEP_LINK);
      }, 1500);
    }

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error handling initial URL:', error);
  }
};

/**
 * Handle incoming deep links
 */
const handleDeepLink = (event: { url: string }): void => {
  console.log('🔗 [DEEP LINKING] Incoming URL:', event.url);
  processDeepLink(event.url);
};

/**
 * Process deep link URL
 */
const processDeepLink = async (url: string): Promise<void> => {
  try {
    const linkData = parseDeepLink(url);

    if (!linkData) {
      console.warn('🔗 [DEEP LINKING] Invalid deep link format:', url);
      return;
    }

    // Prevent processing the same link twice
    const lastProcessed = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROCESSED_LINK);
    if (lastProcessed === url) {
      console.log('🔗 [DEEP LINKING] Link already processed, skipping');
      return;
    }

    // Store as last processed
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROCESSED_LINK, url);

    // Handle based on link type
    switch (linkData.action) {
      case 'verify_code':
        await handleVerifyCodeLink(linkData);
        break;

      case 'reset_password':
        await handleResetPasswordLink(linkData);
        break;

      case 'magic_link':
        await handleMagicLink(linkData);
        break;

      default:
        console.warn('🔗 [DEEP LINKING] Unknown action:', linkData.action);
    }

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error processing deep link:', error);

    Alert.alert(
      'Link Error',
      'There was an issue processing the link. Please try the password reset process manually.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Parse deep link URL into structured data
 */
const parseDeepLink = (url: string): DeepLinkData | null => {
  try {
    const parsedURL = new URL(url);

    // Extract base info
    const scheme = parsedURL.protocol.slice(0, -1); // Remove trailing ':'
    const host = parsedURL.hostname;
    const path = parsedURL.pathname;
    const params = new URLSearchParams(parsedURL.search);

    // Validate scheme
    if (scheme !== 'skyfire') {
      return null;
    }

    // Determine action based on host/path
    let action: DeepLinkData['action'];

    if (host === 'reset') {
      action = 'verify_code';
    } else if (host === 'verify') {
      action = 'reset_password';
    } else if (host === 'magic') {
      action = 'magic_link';
    } else {
      return null;
    }

    return {
      type: 'password_reset',
      action,
      token: params.get('token') || undefined,
      code: params.get('code') || undefined,
      email: params.get('email') || undefined,
    };

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error parsing URL:', error);
    return null;
  }
};

/**
 * Handle verify code deep link
 */
const handleVerifyCodeLink = async (linkData: DeepLinkData): Promise<void> => {
  const { code, email } = linkData;

  if (!code || !email) {
    console.warn('🔗 [DEEP LINKING] Missing code or email in verify link');
    return;
  }

  try {
    // Update Redux state
    store.dispatch(setEmail(email));
    store.dispatch(setCode(code));
    store.dispatch(setStep('CODE_INPUT'));
    store.dispatch(setDeepLinkProcessed(true));

    // Navigate to password reset flow
    if (navigationRef) {
      navigationRef.navigate('PasswordResetCodeScreen');

      // Auto-fill and verify the code
      setTimeout(() => {
        // The CodeInput component will auto-submit when 6 digits are detected
        store.dispatch(setCode(code));
      }, 1000);

      Alert.alert(
        'Code Auto-Filled',
        'The reset code from your email has been automatically filled in.',
        [{ text: 'OK' }]
      );
    }

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error handling verify code link:', error);
  }
};

/**
 * Handle reset password deep link
 */
const handleResetPasswordLink = async (linkData: DeepLinkData): Promise<void> => {
  const { token, email } = linkData;

  if (!token) {
    console.warn('🔗 [DEEP LINKING] Missing token in reset password link');
    return;
  }

  try {
    // Verify token is still valid
    const tokenValidation = await passwordResetAPI.verifyResetToken(token);

    if (!tokenValidation.isValid) {
      Alert.alert(
        'Expired Link',
        'This password reset link has expired. Please request a new one.',
        [
          {
            text: 'OK',
            onPress: () => navigationRef?.navigate('PasswordResetEmailScreen'),
          },
        ]
      );
      return;
    }

    // Update Redux state
    if (email) {
      store.dispatch(setEmail(email));
    }
    store.dispatch(setResetToken(token));
    store.dispatch(setStep('NEW_PASSWORD'));
    store.dispatch(setDeepLinkProcessed(true));

    // Navigate to password input screen
    if (navigationRef) {
      navigationRef.navigate('PasswordResetNewPasswordScreen');

      Alert.alert(
        'Link Verified',
        'You can now set your new password.',
        [{ text: 'OK' }]
      );
    }

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error handling reset password link:', error);

    Alert.alert(
      'Link Error',
      'Unable to verify the reset link. Please try requesting a new password reset.',
      [
        {
          text: 'OK',
          onPress: () => navigationRef?.navigate('PasswordResetEmailScreen'),
        },
      ]
    );
  }
};

/**
 * Handle magic link
 */
const handleMagicLink = async (linkData: DeepLinkData): Promise<void> => {
  const { token } = linkData;

  if (!token) {
    console.warn('🔗 [DEEP LINKING] Missing token in magic link');
    return;
  }

  try {
    // Verify magic link
    const magicLinkData = await passwordResetAPI.verifyMagicLink(token);

    if (!magicLinkData) {
      Alert.alert(
        'Invalid Link',
        'This magic link is invalid or has expired. Please request a new password reset.',
        [
          {
            text: 'OK',
            onPress: () => navigationRef?.navigate('PasswordResetEmailScreen'),
          },
        ]
      );
      return;
    }

    // Update Redux state with magic link data
    store.dispatch(setEmail(magicLinkData.email));
    store.dispatch(setResetToken(magicLinkData.token));
    store.dispatch(setStep('NEW_PASSWORD'));
    store.dispatch(setDeepLinkProcessed(true));

    // Navigate directly to password input
    if (navigationRef) {
      navigationRef.navigate('PasswordResetNewPasswordScreen');

      Alert.alert(
        'Magic Link Verified',
        'You can now set your new password securely.',
        [{ text: 'OK' }]
      );
    }

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error handling magic link:', error);

    Alert.alert(
      'Magic Link Error',
      'Unable to verify the magic link. Please request a new password reset.',
      [
        {
          text: 'OK',
          onPress: () => navigationRef?.navigate('PasswordResetEmailScreen'),
        },
      ]
    );
  }
};

/**
 * Generate deep link URLs for emails
 */
export const generateDeepLinks = {
  /**
   * Generate link for email with reset code
   */
  verifyCode: (email: string, code: string): string => {
    const params = new URLSearchParams({
      email,
      code,
    });
    return `${URL_SCHEMES.RESET}?${params.toString()}`;
  },

  /**
   * Generate link for password reset with token
   */
  resetPassword: (token: string, email?: string): string => {
    const params = new URLSearchParams({ token });
    if (email) {
      params.set('email', email);
    }
    return `${URL_SCHEMES.VERIFY}?${params.toString()}`;
  },

  /**
   * Generate magic link
   */
  magicLink: (token: string): string => {
    const params = new URLSearchParams({ token });
    return `${URL_SCHEMES.MAGIC}?${params.toString()}`;
  },
};

/**
 * Store deep link for later processing (if app not ready)
 */
export const storePendingDeepLink = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_DEEP_LINK, url);
    console.log('🔗 [DEEP LINKING] Stored pending link');
  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error storing pending link:', error);
  }
};

/**
 * Clear pending deep link
 */
export const clearPendingDeepLink = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_DEEP_LINK);
  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error clearing pending link:', error);
  }
};

/**
 * Check if URL can be opened (for testing)
 */
export const canOpenURL = async (url: string): Promise<boolean> => {
  try {
    return await Linking.canOpenURL(url);
  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error checking URL support:', error);
    return false;
  }
};

/**
 * Open URL externally
 */
export const openURL = async (url: string): Promise<boolean> => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      console.warn('🔗 [DEEP LINKING] URL not supported:', url);
      return false;
    }

    await Linking.openURL(url);
    return true;

  } catch (error) {
    console.error('🔗 [DEEP LINKING] Error opening URL:', error);
    return false;
  }
};

/**
 * Generate universal links (for iOS) and app links (for Android)
 */
export const generateUniversalLinks = {
  /**
   * Generate web fallback URL that redirects to deep link
   */
  createWebFallback: (deepLink: string, fallbackURL: string = 'https://skyfiresd.com/app'): string => {
    const params = new URLSearchParams({
      redirect: deepLink,
      fallback: fallbackURL,
    });

    return `https://skyfiresd.com/link?${params.toString()}`;
  },

  /**
   * Generate App Store / Play Store fallback
   */
  createAppStoreFallback: (): string => {
    if (Platform.OS === 'ios') {
      return 'https://apps.apple.com/app/skyfire-solar/id123456789'; // Replace with actual App Store ID
    } else {
      return 'https://play.google.com/store/apps/details?id=com.skyfire.solar'; // Replace with actual package name
    }
  },
};

/**
 * Auto-fill utilities for SMS and email codes
 */
export const autoFillUtils = {
  /**
   * Extract code from SMS or email content
   */
  extractCodeFromText: (text: string): string | null => {
    // Look for 6-digit codes
    const codeMatch = text.match(/\b\d{6}\b/);
    return codeMatch ? codeMatch[0] : null;
  },

  /**
   * Extract code from clipboard
   */
  extractCodeFromClipboard: async (): Promise<string | null> => {
    try {
      const { default: Clipboard } = await import('@react-native-clipboard/clipboard');
      const clipboardContent = await Clipboard.getString();

      return autoFillUtils.extractCodeFromText(clipboardContent);
    } catch (error) {
      console.error('🔗 [AUTO-FILL] Error reading clipboard:', error);
      return null;
    }
  },

  /**
   * Check for auto-fill code in various sources
   */
  checkForAutoFillCode: async (): Promise<{
    code: string | null;
    source: 'clipboard' | 'sms' | null;
  }> => {
    // Check clipboard first
    const clipboardCode = await autoFillUtils.extractCodeFromClipboard();

    if (clipboardCode) {
      return {
        code: clipboardCode,
        source: 'clipboard',
      };
    }

    // Could extend to check SMS on Android with proper permissions
    // For now, just return clipboard result
    return {
      code: null,
      source: null,
    };
  },
};

// Export main functions
export default {
  initializeDeepLinking,
  generateDeepLinks,
  generateUniversalLinks,
  autoFillUtils,
  storePendingDeepLink,
  clearPendingDeepLink,
  canOpenURL,
  openURL,
};