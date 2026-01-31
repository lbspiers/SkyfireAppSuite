// Device Information Utilities
// Comprehensive device fingerprinting for security and analytics

import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { DeviceInfo as DeviceInfoType } from './passwordResetTypes';

let cachedDeviceInfo: DeviceInfoType | null = null;

/**
 * Get comprehensive device information
 */
export const getDeviceInfo = async (): Promise<DeviceInfoType> => {
  // Return cached info if available (for performance)
  if (cachedDeviceInfo) {
    return {
      ...cachedDeviceInfo,
      timestamp: Date.now(), // Always fresh timestamp
    };
  }

  try {
    const [
      uniqueId,
      deviceName,
      systemVersion,
      appVersion,
      buildNumber,
      brand,
      model,
      deviceType,
      carrier,
      timezone,
    ] = await Promise.all([
      getDeviceId(),
      DeviceInfo.getDeviceName(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.getVersion(),
      DeviceInfo.getBuildNumber(),
      DeviceInfo.getBrand(),
      DeviceInfo.getModel(),
      DeviceInfo.getDeviceType(),
      getCarrierSafely(),
      getTimezoneSafely(),
    ]);

    const deviceInfo: DeviceInfoType = {
      deviceId: uniqueId,
      platform: Platform.OS as 'ios' | 'android',
      appVersion: `${appVersion}.${buildNumber}`,
      osVersion: systemVersion,
      deviceModel: `${brand} ${model}`.trim(),
      userAgent: generateUserAgent({
        platform: Platform.OS,
        version: systemVersion,
        device: `${brand} ${model}`.trim(),
        appVersion,
      }),
      timestamp: Date.now(),
      timezone: timezone,
    };

    // Cache for future use
    cachedDeviceInfo = { ...deviceInfo };

    return deviceInfo;

  } catch (error) {
    console.warn('📱 [DEVICE INFO] Failed to get complete device info:', error);

    // Fallback device info
    const fallbackInfo: DeviceInfoType = {
      deviceId: 'unknown-device',
      platform: Platform.OS as 'ios' | 'android',
      appVersion: 'unknown',
      osVersion: Platform.Version.toString(),
      deviceModel: 'Unknown Device',
      userAgent: `Skyfire/${Platform.OS}`,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };

    return fallbackInfo;
  }
};

/**
 * Get secure device ID
 */
const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get unique device ID
    const deviceId = await DeviceInfo.getUniqueId();
    return deviceId;
  } catch (error) {
    console.warn('📱 [DEVICE ID] Failed to get unique ID:', error);

    try {
      // Fallback to Android ID or IDFV
      const fallbackId = await DeviceInfo.getAndroidId();
      return fallbackId;
    } catch (fallbackError) {
      console.warn('📱 [DEVICE ID] Fallback ID failed:', fallbackError);

      // Generate a session-based ID
      return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
  }
};

/**
 * Get carrier info safely
 */
const getCarrierSafely = async (): Promise<string> => {
  try {
    const carrier = await DeviceInfo.getCarrier();
    return carrier || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Get timezone safely
 */
const getTimezoneSafely = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};

/**
 * Generate user agent string
 */
const generateUserAgent = (params: {
  platform: string;
  version: string;
  device: string;
  appVersion: string;
}): string => {
  const { platform, version, device, appVersion } = params;

  if (platform === 'ios') {
    return `Skyfire/${appVersion} (${device}; iOS ${version})`;
  } else if (platform === 'android') {
    return `Skyfire/${appVersion} (${device}; Android ${version})`;
  }

  return `Skyfire/${appVersion} (${platform} ${version})`;
};

/**
 * Get device fingerprint (for enhanced security)
 */
export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const deviceInfo = await getDeviceInfo();

    // Create a fingerprint hash from device characteristics
    const fingerprintData = [
      deviceInfo.platform,
      deviceInfo.deviceModel,
      deviceInfo.osVersion,
      deviceInfo.timezone,
      Platform.OS,
      Platform.Version,
    ].join('|');

    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);

  } catch (error) {
    console.warn('🔐 [FINGERPRINT] Failed to generate device fingerprint:', error);
    return 'unknown-fingerprint';
  }
};

/**
 * Check if device is jailbroken/rooted
 */
export const isDeviceCompromised = async (): Promise<boolean> => {
  try {
    const [isEmulator, isJailbroken] = await Promise.all([
      DeviceInfo.isEmulator(),
      Platform.OS === 'ios' ? false : DeviceInfo.isEmulator(), // Simple check for Android
    ]);

    return isEmulator || isJailbroken;

  } catch (error) {
    console.warn('🔐 [SECURITY] Failed to check device security:', error);
    return false; // Assume secure if check fails
  }
};

/**
 * Get network information
 */
export const getNetworkInfo = async (): Promise<{
  type: string;
  isConnected: boolean;
}> => {
  try {
    // This would require additional dependencies like @react-native-community/netinfo
    // For now, return basic info
    return {
      type: 'unknown',
      isConnected: true, // Assume connected if we can't check
    };

  } catch (error) {
    return {
      type: 'unknown',
      isConnected: true,
    };
  }
};

/**
 * Get app-specific info
 */
export const getAppSecurityInfo = async (): Promise<{
  isDebuggable: boolean;
  installerPackageName: string;
  firstInstallTime: number;
  lastUpdateTime: number;
}> => {
  try {
    const [
      isDebuggable,
      installerPackageName,
      firstInstallTime,
      lastUpdateTime,
    ] = await Promise.all([
      DeviceInfo.isDebuggable(),
      DeviceInfo.getInstallerPackageName(),
      DeviceInfo.getFirstInstallTime(),
      DeviceInfo.getLastUpdateTime(),
    ]);

    return {
      isDebuggable,
      installerPackageName: installerPackageName || 'unknown',
      firstInstallTime,
      lastUpdateTime,
    };

  } catch (error) {
    console.warn('📱 [APP INFO] Failed to get app security info:', error);

    return {
      isDebuggable: false,
      installerPackageName: 'unknown',
      firstInstallTime: 0,
      lastUpdateTime: 0,
    };
  }
};

/**
 * Clear cached device info (call when needed to refresh)
 */
export const clearDeviceInfoCache = (): void => {
  cachedDeviceInfo = null;
};

/**
 * Get minimal device info for quick operations
 */
export const getMinimalDeviceInfo = (): DeviceInfoType => {
  return {
    deviceId: 'quick-session',
    platform: Platform.OS as 'ios' | 'android',
    appVersion: '1.0.0',
    osVersion: Platform.Version.toString(),
    deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
    userAgent: `Skyfire/${Platform.OS}`,
    timestamp: Date.now(),
    timezone: 'UTC',
  };
};

// Export everything for use in password reset flow
export default {
  getDeviceInfo,
  getDeviceFingerprint,
  isDeviceCompromised,
  getNetworkInfo,
  getAppSecurityInfo,
  clearDeviceInfoCache,
  getMinimalDeviceInfo,
};