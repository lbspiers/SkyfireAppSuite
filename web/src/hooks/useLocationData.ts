// src/hooks/useLocationData.ts

import { useState, useCallback } from 'react';
import { getStates, getZipCodes, getUtilities } from '../services/projectAPI';

interface UseLocationDataReturn {
  // Data
  states: string[];
  zipCodes: string[];
  utilities: string[];
  // Loading states
  loadingStates: boolean;
  loadingZipCodes: boolean;
  loadingUtilities: boolean;
  // Actions
  fetchStates: () => Promise<void>;
  fetchZipCodes: (stateCode: string) => Promise<void>;
  fetchUtilities: (zipCode: string) => Promise<void>;
  // Clear functions
  clearZipCodes: () => void;
  clearUtilities: () => void;
}

export const useLocationData = (): UseLocationDataReturn => {
  const [states, setStates] = useState<string[]>([]);
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [utilities, setUtilities] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingZipCodes, setLoadingZipCodes] = useState(false);
  const [loadingUtilities, setLoadingUtilities] = useState(false);

  const fetchStates = useCallback(async () => {
    setLoadingStates(true);
    try {
      const data = await getStates();
      setStates(data);
    } catch (err) {
      console.error('[useLocationData] fetchStates error:', err);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const fetchZipCodes = useCallback(async (stateCode: string) => {
    setLoadingZipCodes(true);
    setZipCodes([]); // Clear previous
    try {
      const data = await getZipCodes(stateCode);
      setZipCodes(data);
    } catch (err) {
      console.error('[useLocationData] fetchZipCodes error:', err);
    } finally {
      setLoadingZipCodes(false);
    }
  }, []);

  const fetchUtilities = useCallback(async (zipCode: string) => {
    setLoadingUtilities(true);
    setUtilities([]); // Clear previous
    try {
      const data = await getUtilities(zipCode);
      setUtilities(data);
    } catch (err) {
      console.error('[useLocationData] fetchUtilities error:', err);
    } finally {
      setLoadingUtilities(false);
    }
  }, []);

  const clearZipCodes = useCallback(() => setZipCodes([]), []);
  const clearUtilities = useCallback(() => setUtilities([]), []);

  return {
    states,
    zipCodes,
    utilities,
    loadingStates,
    loadingZipCodes,
    loadingUtilities,
    fetchStates,
    fetchZipCodes,
    fetchUtilities,
    clearZipCodes,
    clearUtilities,
  };
};

export default useLocationData;
