/**
 * Admin utilities with server-side verification
 * NO client-side email checks - all verification via backend
 */

import axios from '../config/axios';
import { safeGetJSON } from './safeStorage';

// Session storage key for admin status
const ADMIN_STATUS_KEY = 'isVerifiedAdmin';
const ADMIN_VERIFIED_AT_KEY = 'adminVerifiedAt';
const VERIFICATION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify admin status with backend
 * Should be called after login and periodically
 * @returns Promise<boolean> - True if user is verified admin
 */
export const verifyAdminStatus = async (): Promise<boolean> => {
  try {
    const response = await axios.get('/api/admin/verify-access');

    if (response.data?.status === 'SUCCESS' && response.data?.data?.isAdmin === true) {
      // Store verified status with timestamp
      sessionStorage.setItem(ADMIN_STATUS_KEY, 'true');
      sessionStorage.setItem(ADMIN_VERIFIED_AT_KEY, Date.now().toString());
      return true;
    } else {
      // Explicitly not admin
      sessionStorage.setItem(ADMIN_STATUS_KEY, 'false');
      sessionStorage.setItem(ADMIN_VERIFIED_AT_KEY, Date.now().toString());
      return false;
    }
  } catch (error) {
    console.error('[AdminUtils] Admin verification failed:', error);
    // On error, assume not admin (fail secure)
    sessionStorage.removeItem(ADMIN_STATUS_KEY);
    sessionStorage.removeItem(ADMIN_VERIFIED_AT_KEY);
    return false;
  }
};

/**
 * Check if verification is still valid (not expired)
 */
const isVerificationValid = (): boolean => {
  const verifiedAt = sessionStorage.getItem(ADMIN_VERIFIED_AT_KEY);
  if (!verifiedAt) return false;

  const elapsed = Date.now() - parseInt(verifiedAt, 10);
  return elapsed < VERIFICATION_EXPIRY_MS;
};

/**
 * Get cached admin status (from last verification)
 * Returns null if not verified or expired
 */
export const getCachedAdminStatus = (): boolean | null => {
  if (!isVerificationValid()) {
    return null; // Expired or not verified
  }

  const status = sessionStorage.getItem(ADMIN_STATUS_KEY);
  if (status === 'true') return true;
  if (status === 'false') return false;
  return null;
};

/**
 * Check if current user is admin
 * Uses cached status if valid, otherwise returns false
 * Call verifyAdminStatus() to refresh
 */
export const isCurrentUserAdmin = (): boolean => {
  const cached = getCachedAdminStatus();
  return cached === true;
};

/**
 * Check if current user is admin, with auto-refresh if expired
 * @returns Promise<boolean>
 */
export const isCurrentUserAdminAsync = async (): Promise<boolean> => {
  const cached = getCachedAdminStatus();

  if (cached !== null) {
    return cached;
  }

  // Cached status expired or missing, re-verify
  return await verifyAdminStatus();
};

/**
 * Clear admin status (call on logout)
 */
export const clearAdminStatus = (): void => {
  sessionStorage.removeItem(ADMIN_STATUS_KEY);
  sessionStorage.removeItem(ADMIN_VERIFIED_AT_KEY);
};

/**
 * Get company ID for API fetches
 * Super users can pass null to get ALL data
 * Regular users always use their own company ID
 */
export const getCompanyIdForFetch = (userData?: any): string | null => {
  const isSuperUser = isCurrentUserAdmin();

  if (isSuperUser) {
    return null; // Super users can fetch all
  }

  // Get company ID from provided userData or sessionStorage
  const user = userData || safeGetJSON('userData', sessionStorage, {});
  return user?.company?.uuid || user?.companyUuid || null;
};

/**
 * DEPRECATED: Email-based admin check removed for security.
 * Always use server-verified admin status via verifyAdminStatus().
 * @deprecated This function always returns false. Use verifyAdminStatus() instead.
 */
export const isAdminUserByEmail = (email: string): boolean => {
  console.error('[AdminUtils] isAdminUserByEmail is deprecated and disabled. Use verifyAdminStatus() instead.');
  return false; // Always return false to force server verification
};
