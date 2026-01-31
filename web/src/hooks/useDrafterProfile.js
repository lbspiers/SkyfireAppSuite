import { useState, useEffect, useCallback } from 'react';
import { drafterProfileService } from '../services/drafterProfileService';

// Mock data for development/fallback
const MOCK_PROFILE = {
  uuid: 'drafter-123',
  firstName: 'Test',
  lastName: 'Drafter',
  email: 'testdrafter@skyfiresd.com',
  phone: '(555) 123-4567',
  avatarUrl: null,
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  paymentMethod: {
    type: 'bank',
    last4: '4567',
    bankName: 'Chase'
  },
  taxFormStatus: 'submitted', // 'pending', 'submitted', 'approved'
  memberSince: '2024-06-15',
  stats: {
    totalJobs: 127,
    totalEarnings: 2847.50,
    avgRating: 4.8,
    onTimeRate: 96
  }
};

/**
 * Hook for managing drafter profile data
 */
export const useDrafterProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  /**
   * Fetch profile data
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await drafterProfileService.getProfile();
      setProfile(data);
      setUsingMockData(false);
    } catch (err) {
      console.warn('Failed to fetch profile, using mock data:', err);
      setProfile(MOCK_PROFILE);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update profile data
   */
  const updateProfile = useCallback(async (data) => {
    try {
      setSaving(true);
      setError(null);

      if (usingMockData) {
        // Update mock data locally
        setProfile(prev => ({ ...prev, ...data }));
        return { success: true };
      }

      const updated = await drafterProfileService.updateProfile(data);
      setProfile(prev => ({ ...prev, ...updated }));
      return { success: true };
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [usingMockData]);

  /**
   * Upload profile photo
   */
  const uploadPhoto = useCallback(async (file) => {
    try {
      setSaving(true);
      setError(null);

      if (usingMockData) {
        // Create local preview URL
        const previewUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, avatarUrl: previewUrl }));
        return { url: previewUrl };
      }

      const result = await drafterProfileService.uploadPhoto(file);
      setProfile(prev => ({ ...prev, avatarUrl: result.url }));
      return result;
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [usingMockData]);

  /**
   * Remove profile photo
   */
  const removePhoto = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setProfile(prev => ({ ...prev, avatarUrl: null }));
      return { success: true };
    } catch (err) {
      console.error('Failed to remove photo:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updateNotifications = useCallback(async (preferences) => {
    try {
      setError(null);

      if (usingMockData) {
        setProfile(prev => ({
          ...prev,
          notifications: { ...prev.notifications, ...preferences }
        }));
        return { success: true };
      }

      const updated = await drafterProfileService.updateNotifications(preferences);
      setProfile(prev => ({
        ...prev,
        notifications: { ...prev.notifications, ...updated }
      }));
      return { success: true };
    } catch (err) {
      console.error('Failed to update notifications:', err);
      setError(err.message);
      throw err;
    }
  }, [usingMockData]);

  /**
   * Refresh profile data
   */
  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Initial load
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    // Data
    profile,

    // State
    loading,
    error,
    saving,
    usingMockData,

    // Actions
    updateProfile,
    uploadPhoto,
    removePhoto,
    updateNotifications,
    refresh
  };
};

export default useDrafterProfile;
