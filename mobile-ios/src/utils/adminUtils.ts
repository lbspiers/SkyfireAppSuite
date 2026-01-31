/**
 * Admin utilities for managing admin access and permissions
 */

// Admin email addresses that have access to admin panel
export const ADMIN_EMAILS = [
  'logan@skyfiresd.com',
  'eli@skyfiresd.com'
];

/**
 * Check if a given email has admin access
 * @param email - User email to check
 * @returns boolean - True if user has admin access
 */
export const isAdminUser = (email: string): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

/**
 * Get user email from profile data
 * @param profile - User profile object
 * @returns string - User email or empty string
 */
export const getUserEmail = (profile: any): string => {
  return profile?.email || profile?.user?.email || '';
};

/**
 * Check if current user profile has admin access
 * @param profile - User profile from Redux store
 * @returns boolean - True if current user is admin
 */
export const isCurrentUserAdmin = (profile: any): boolean => {
  const email = getUserEmail(profile);
  return isAdminUser(email);
};