// src/hooks/useUserProfile.ts

import { useState, useEffect, useCallback } from 'react';
import {
  getUserProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPhone,
  deleteUserAccount,
  UserProfile,
  UpdateProfileRequest,
} from '../services/accountAPI';
import { useIsAuthenticated } from '../store';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  // Actions
  refresh: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const isAuthenticated = useIsAuthenticated();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile on mount and when auth changes
  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getUserProfile();
      if (result.status === 'SUCCESS' && result.data) {
        setProfile(result.data);
      }
    } catch (err: any) {
      console.error('[useUserProfile] Fetch error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  // Update profile
  const handleUpdateProfile = useCallback(async (data: UpdateProfileRequest) => {
    try {
      const result = await updateUserProfile(data);
      if (result.status === 'SUCCESS' && result.data) {
        setProfile(result.data);
      }
    } catch (err: any) {
      console.error('[useUserProfile] Update error:', err);
      throw err; // Re-throw so caller can handle
    }
  }, []);

  // Update email
  const handleUpdateEmail = useCallback(async (email: string) => {
    try {
      await updateUserEmail(email);
      // Refresh profile to get updated data
      await fetchProfile(true);
    } catch (err: any) {
      console.error('[useUserProfile] Update email error:', err);
      throw err;
    }
  }, [fetchProfile]);

  // Update phone
  const handleUpdatePhone = useCallback(async (phone: string) => {
    try {
      await updateUserPhone(phone);
      // Refresh profile to get updated data
      await fetchProfile(true);
    } catch (err: any) {
      console.error('[useUserProfile] Update phone error:', err);
      throw err;
    }
  }, [fetchProfile]);

  // Delete account
  const handleDeleteAccount = useCallback(async () => {
    try {
      await deleteUserAccount();
      setProfile(null);
    } catch (err: any) {
      console.error('[useUserProfile] Delete account error:', err);
      throw err;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    refreshing,
    refresh,
    updateProfile: handleUpdateProfile,
    updateEmail: handleUpdateEmail,
    updatePhone: handleUpdatePhone,
    deleteAccount: handleDeleteAccount,
  };
};

export default useUserProfile;
