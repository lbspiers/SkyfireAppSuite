// src/hooks/useSystemDetails.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchSystemDetails,
  patchSystemDetails,
  saveSystemDetailsPartialExact,
  SystemNumber,
  buildFieldName,
} from '../services/systemDetailsAPI';
import { useIsAuthenticated } from '../store';

interface UseSystemDetailsOptions {
  projectUuid: string;
  autoFetch?: boolean;
}

interface UseSystemDetailsReturn {
  data: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  // Actions
  refresh: () => Promise<void>;
  updateField: (fieldName: string, value: any) => Promise<void>;
  updateFields: (fields: Record<string, any>) => Promise<void>;
  updateSystemField: (systemNumber: SystemNumber, fieldName: string, value: any) => Promise<void>;
  clearFields: (fieldNames: string[]) => Promise<void>;
  // Helpers
  getField: <T = any>(fieldName: string, defaultValue?: T) => T | undefined;
  getSystemField: <T = any>(systemNumber: SystemNumber, fieldName: string, defaultValue?: T) => T | undefined;
}

/**
 * Hook for managing system details with optimistic updates and deduplication
 */
export const useSystemDetails = (options: UseSystemDetailsOptions): UseSystemDetailsReturn => {
  const { projectUuid, autoFetch = true } = options;
  const isAuthenticated = useIsAuthenticated();

  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Track last saved values to prevent duplicate API calls
  const lastSavedRef = useRef<Record<string, any>>({});
  // Track if fetch is in progress to prevent duplicate calls
  const fetchInProgressRef = useRef(false);

  // Fetch system details
  const fetch = useCallback(async () => {
    if (!isAuthenticated || !projectUuid) {
      setData(null);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches (e.g., from React StrictMode double-mounting)
    if (fetchInProgressRef.current) {
      console.log('[useSystemDetails] Fetch already in progress, skipping duplicate call');
      return;
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSystemDetails(projectUuid);
      setData(result);
      // Initialize last saved snapshot
      if (result) {
        lastSavedRef.current = { ...result };
      }
    } catch (err: any) {
      console.error('[useSystemDetails] Fetch error:', err);
      setError(err.message || 'Failed to load system details');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [isAuthenticated, projectUuid]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  // Check if value has changed (for deduplication)
  const hasChanged = useCallback((fieldName: string, value: any): boolean => {
    const lastValue = lastSavedRef.current[fieldName];

    // Handle null/undefined equivalence
    if ((lastValue === null || lastValue === undefined) &&
        (value === null || value === undefined)) {
      return false;
    }

    // Simple equality check (works for primitives)
    return lastValue !== value;
  }, []);

  // Update a single field
  const updateField = useCallback(async (fieldName: string, value: any) => {
    if (!projectUuid) return;

    // Deduplicate - skip if value hasn't changed
    if (!hasChanged(fieldName, value)) {
      console.debug(`[useSystemDetails] Skipping duplicate save for ${fieldName}`);
      return;
    }

    setSaving(true);

    // Optimistic update
    setData(prev => prev ? { ...prev, [fieldName]: value } : { [fieldName]: value });

    try {
      await patchSystemDetails(projectUuid, { [fieldName]: value });
      // Update last saved snapshot
      lastSavedRef.current[fieldName] = value;
    } catch (err: any) {
      // If PATCH fails with 404 (record doesn't exist), retry with PUT (upsert)
      if (err?.response?.status === 404) {
        console.debug('[useSystemDetails] PATCH failed with 404, retrying with PUT (upsert)');
        try {
          const { saveSystemDetails } = await import('../services/systemDetailsAPI');
          await saveSystemDetails(projectUuid, { [fieldName]: value });
          lastSavedRef.current[fieldName] = value;
          setSaving(false);
          return;
        } catch (putErr: any) {
          console.error('[useSystemDetails] PUT retry failed - system-details row may not exist yet:', putErr);
          // Keep optimistic update, don't revert - the data is in local state
          // User can retry later or the row will be created on next successful save
          setError('Unable to save changes - will retry automatically');
          setSaving(false);
          return; // Don't throw, don't refetch
        }
      }

      console.error('[useSystemDetails] Update field error:', err);
      // Revert optimistic update on error
      await fetch();
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid, hasChanged, fetch]);

  // Update multiple fields at once
  const updateFields = useCallback(async (fields: Record<string, any>) => {
    if (!projectUuid || Object.keys(fields).length === 0) return;

    // Filter out unchanged fields
    const changedFields: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (hasChanged(key, value)) {
        changedFields[key] = value;
      }
    });

    if (Object.keys(changedFields).length === 0) {
      console.debug('[useSystemDetails] All fields unchanged, skipping save');
      return;
    }

    setSaving(true);

    // Optimistic update
    setData(prev => prev ? { ...prev, ...changedFields } : changedFields);

    try {
      await patchSystemDetails(projectUuid, changedFields);
      // Update last saved snapshot
      Object.assign(lastSavedRef.current, changedFields);
    } catch (err: any) {
      // If PATCH fails with 404 (record doesn't exist), retry with PUT (upsert)
      if (err?.response?.status === 404) {
        console.debug('[useSystemDetails] PATCH failed with 404, retrying with PUT (upsert)');
        try {
          const { saveSystemDetails } = await import('../services/systemDetailsAPI');
          await saveSystemDetails(projectUuid, changedFields);
          Object.assign(lastSavedRef.current, changedFields);
          setSaving(false);
          return;
        } catch (putErr: any) {
          console.error('[useSystemDetails] PUT retry failed - system-details row may not exist yet:', putErr);
          // Keep optimistic update, don't revert - the data is in local state
          // User can retry later or the row will be created on next successful save
          setError('Unable to save changes - will retry automatically');
          setSaving(false);
          return; // Don't throw, don't refetch
        }
      }

      console.error('[useSystemDetails] Update fields error:', err);
      await fetch();
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid, hasChanged, fetch]);

  // Update a field for a specific system (convenience method)
  const updateSystemField = useCallback(async (
    systemNumber: SystemNumber,
    fieldName: string,
    value: any
  ) => {
    const prefixedFieldName = buildFieldName(systemNumber, fieldName);
    await updateField(prefixedFieldName, value);
  }, [updateField]);

  // Clear multiple fields (set to null)
  const clearFields = useCallback(async (fieldNames: string[]) => {
    if (!projectUuid || fieldNames.length === 0) return;

    const clearPayload: Record<string, null> = {};
    fieldNames.forEach(name => {
      clearPayload[name] = null;
    });

    setSaving(true);

    // Optimistic update
    setData(prev => {
      if (!prev) return null;
      const updated = { ...prev };
      fieldNames.forEach(name => {
        updated[name] = null;
      });
      return updated;
    });

    try {
      await saveSystemDetailsPartialExact(projectUuid, clearPayload);
      // Update last saved snapshot
      fieldNames.forEach(name => {
        lastSavedRef.current[name] = null;
      });
    } catch (err: any) {
      console.error('[useSystemDetails] Clear fields error:', err);
      await fetch();
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid, fetch]);

  // Get field value helper
  const getField = useCallback(<T = any>(fieldName: string, defaultValue?: T): T | undefined => {
    if (!data) return defaultValue;
    const value = data[fieldName];
    return value !== undefined && value !== null ? value : defaultValue;
  }, [data]);

  // Get system-prefixed field value helper
  const getSystemField = useCallback(<T = any>(
    systemNumber: SystemNumber,
    fieldName: string,
    defaultValue?: T
  ): T | undefined => {
    const prefixedFieldName = buildFieldName(systemNumber, fieldName);
    return getField(prefixedFieldName, defaultValue);
  }, [getField]);

  return {
    data,
    loading,
    error,
    saving,
    refresh,
    updateField,
    updateFields,
    updateSystemField,
    clearFields,
    getField,
    getSystemField,
  };
};

export default useSystemDetails;
