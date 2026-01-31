// src/hooks/useSolarEquipment.ts
// Custom hooks for solar equipment management following existing patterns

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SolarPanel,
  Inverter,
  SolarPanelQueryParams,
  InverterQueryParams,
  EquipmentManufacturer,
  EquipmentModel,
  SolarEquipmentApiError,
  SolarEquipmentApiResult
} from '../types/solarEquipment';
import {
  getSolarPanels,
  getSolarPanelById,
  getSolarPanelManufacturers,
  getSolarPanelModels,
  createSolarPanel,
  updateSolarPanel,
  deleteSolarPanel,
  normalizeSolarPanelManufacturer,
  normalizeSolarPanelModel,
  transformSolarPanelResponse
} from '../api/solarPanel.service';
import {
  getInverters,
  getInverterById,
  getInverterManufacturers,
  getInverterModels,
  createInverter,
  updateInverter,
  deleteInverter,
  normalizeInverterManufacturer,
  normalizeInverterModel,
  transformInverterResponse
} from '../api/inverter.service';

// Hook for managing solar panel data following existing equipment patterns
export const useSolarPanels = (enabled = true) => {
  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPanels = useCallback(async (params?: SolarPanelQueryParams) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getSolarPanels(params);

      if (response?.status === 200 && response?.data) {
        const panelData = Array.isArray(response.data.data)
          ? response.data.data.map(transformSolarPanelResponse)
          : [];
        setPanels(panelData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch solar panels');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching solar panels:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchPanels();
  }, [fetchPanels, refreshTrigger]);

  return {
    panels,
    loading,
    error,
    fetchPanels,
    refresh,
    setPanels
  };
};

// Hook for managing inverter data following existing equipment patterns
export const useInverters = (enabled = true) => {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchInverters = useCallback(async (params?: InverterQueryParams) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getInverters(params);

      if (response?.status === 200 && response?.data) {
        const inverterData = Array.isArray(response.data.data)
          ? response.data.data.map(transformInverterResponse)
          : [];
        setInverters(inverterData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch inverters');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching inverters:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchInverters();
  }, [fetchInverters, refreshTrigger]);

  return {
    inverters,
    loading,
    error,
    fetchInverters,
    refresh,
    setInverters
  };
};

// Hook for solar panel manufacturers and models (following existing equipment section patterns)
export const useSolarPanelSection = (enabled = true) => {
  const [makes, setMakes] = useState<EquipmentManufacturer[]>([]);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);

  const hasLoadedMakes = useRef(false);
  const hasLoadedModels = useRef(false);

  const loadMakes = useCallback(async () => {
    if (!enabled || hasLoadedMakes.current || loadingMakes) return;

    hasLoadedMakes.current = true;
    setLoadingMakes(true);
    setError(null);

    try {
      const response = await getSolarPanelManufacturers();

      if (response?.status === 200 && response?.data) {
        const makeData = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeSolarPanelManufacturer)
          : [];
        setMakes(makeData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch solar panel manufacturers');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching solar panel manufacturers:', err);
    } finally {
      setLoadingMakes(false);
    }
  }, [enabled, loadingMakes]);

  const loadModels = useCallback(async (manufacturer: string) => {
    if (!enabled || !manufacturer || hasLoadedModels.current || loadingModels) return;

    hasLoadedModels.current = true;
    setLoadingModels(true);
    setError(null);

    try {
      const response = await getSolarPanelModels(manufacturer);

      if (response?.status === 200 && response?.data) {
        const modelData = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeSolarPanelModel)
          : [];
        setModels(modelData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch solar panel models');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching solar panel models:', err);
    } finally {
      setLoadingModels(false);
    }
  }, [enabled, loadingModels]);

  const resetMakes = useCallback(() => {
    hasLoadedMakes.current = false;
    setMakes([]);
  }, []);

  const resetModels = useCallback(() => {
    hasLoadedModels.current = false;
    setModels([]);
  }, []);

  return {
    makes,
    models,
    loadingMakes,
    loadingModels,
    error,
    loadMakes,
    loadModels,
    resetMakes,
    resetModels
  };
};

// Hook for inverter manufacturers and models (following existing equipment section patterns)
export const useInverterSection = (enabled = true) => {
  const [makes, setMakes] = useState<EquipmentManufacturer[]>([]);
  const [models, setModels] = useState<EquipmentModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);

  const hasLoadedMakes = useRef(false);
  const hasLoadedModels = useRef(false);

  const loadMakes = useCallback(async () => {
    if (!enabled || hasLoadedMakes.current || loadingMakes) return;

    hasLoadedMakes.current = true;
    setLoadingMakes(true);
    setError(null);

    try {
      const response = await getInverterManufacturers();

      if (response?.status === 200 && response?.data) {
        const makeData = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeInverterManufacturer)
          : [];
        setMakes(makeData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch inverter manufacturers');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching inverter manufacturers:', err);
    } finally {
      setLoadingMakes(false);
    }
  }, [enabled, loadingMakes]);

  const loadModels = useCallback(async (manufacturer: string) => {
    if (!enabled || !manufacturer || hasLoadedModels.current || loadingModels) return;

    hasLoadedModels.current = true;
    setLoadingModels(true);
    setError(null);

    try {
      const response = await getInverterModels(manufacturer);

      if (response?.status === 200 && response?.data) {
        const modelData = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeInverterModel)
          : [];
        setModels(modelData);
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch inverter models');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      console.error('Error fetching inverter models:', err);
    } finally {
      setLoadingModels(false);
    }
  }, [enabled, loadingModels]);

  const resetMakes = useCallback(() => {
    hasLoadedMakes.current = false;
    setMakes([]);
  }, []);

  const resetModels = useCallback(() => {
    hasLoadedModels.current = false;
    setModels([]);
  }, []);

  return {
    makes,
    models,
    loadingMakes,
    loadingModels,
    error,
    loadMakes,
    loadModels,
    resetMakes,
    resetModels
  };
};

// Hook for CRUD operations on solar panels
export const useSolarPanelCrud = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);

  const createPanel = useCallback(async (data: any): Promise<SolarEquipmentApiResult<SolarPanel>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await createSolarPanel(data);

      if (response?.status === 201 && response?.data) {
        return {
          success: true,
          data: transformSolarPanelResponse(response.data.data),
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to create solar panel');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePanel = useCallback(async (id: number, data: any): Promise<SolarEquipmentApiResult<SolarPanel>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateSolarPanel(id, data);

      if (response?.status === 200 && response?.data) {
        return {
          success: true,
          data: transformSolarPanelResponse(response.data.data),
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to update solar panel');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePanel = useCallback(async (id: number): Promise<SolarEquipmentApiResult<void>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await deleteSolarPanel(id);

      if (response?.status === 200 || response?.status === 204) {
        return {
          success: true,
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to delete solar panel');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createPanel,
    updatePanel,
    deletePanel
  };
};

// Hook for CRUD operations on inverters
export const useInverterCrud = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SolarEquipmentApiError | null>(null);

  const createInverterItem = useCallback(async (data: any): Promise<SolarEquipmentApiResult<Inverter>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await createInverter(data);

      if (response?.status === 201 && response?.data) {
        return {
          success: true,
          data: transformInverterResponse(response.data.data),
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to create inverter');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInverterItem = useCallback(async (id: number, data: any): Promise<SolarEquipmentApiResult<Inverter>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateInverter(id, data);

      if (response?.status === 200 && response?.data) {
        return {
          success: true,
          data: transformInverterResponse(response.data.data),
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to update inverter');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInverterItem = useCallback(async (id: number): Promise<SolarEquipmentApiResult<void>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await deleteInverter(id);

      if (response?.status === 200 || response?.status === 204) {
        return {
          success: true,
          loading: false
        };
      } else {
        throw new Error(response?.data?.message || 'Failed to delete inverter');
      }
    } catch (err: any) {
      const errorObj: SolarEquipmentApiError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code,
        status: err?.status,
        details: err
      };
      setError(errorObj);
      return {
        success: false,
        error: errorObj,
        loading: false
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createInverterItem,
    updateInverterItem,
    deleteInverterItem
  };
};