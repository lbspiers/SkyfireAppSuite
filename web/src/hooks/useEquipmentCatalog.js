/**
 * useEquipmentCatalog - Singleton Equipment Data Hook
 *
 * Loads equipment manufacturers/models ONCE and shares across all components.
 * Multiple instances of SolarPanelSection, BatteryTypeSection, etc. all share the same data.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { cachedGet } from '../config/axios';

// SINGLETON STATE - shared across all hook instances
const catalogState = {
  // Manufacturers by type
  solarPanelMakes: { data: [], loading: false, loaded: false, error: null },
  batteryMakes: { data: [], loading: false, loaded: false, error: null },
  inverterMakes: { data: [], loading: false, loaded: false, error: null },

  // Models cached per manufacturer
  solarPanelModels: {}, // { 'LG': { data: [], loaded: true }, ... }
  batteryModels: {},
  inverterModels: {},

  // Subscribers for state updates
  subscribers: new Set(),
};

// Notify all subscribers when state changes
const notifySubscribers = () => {
  catalogState.subscribers.forEach(callback => callback({ ...catalogState }));
};

// API endpoints
const ENDPOINTS = {
  solarPanelMakes: '/api/solar-panels/manufacturers',
  batteryMakes: '/equipment/manufacturers?type=Battery',
  inverterMakes: '/api/inverters/manufacturers', // Use dedicated endpoint that includes both Inverter and Microinverter
  solarPanelModels: (make) => `/api/solar-panels/models?manufacturer=${encodeURIComponent(make)}`,
  batteryModels: (manufacturer) => `/equipment/models?type=Battery&manufacturer=${encodeURIComponent(manufacturer)}`,
  inverterModels: (manufacturer) => `/api/inverters/models?manufacturer=${encodeURIComponent(manufacturer)}`, // Use dedicated endpoint that includes both types
};

// Load manufacturers (only loads once)
const loadManufacturers = async (type) => {
  const stateKey = `${type}Makes`;
  const state = catalogState[stateKey];

  // Already loaded or loading
  if (state.loaded || state.loading) return;

  catalogState[stateKey] = { ...state, loading: true };
  notifySubscribers();

  try {
    const response = await cachedGet(ENDPOINTS[stateKey], {}, axios);
    const data = response.data?.data || response.data || [];
    console.log(`[useEquipmentCatalog] Loaded ${data.length} ${type} manufacturers:`, data);

    catalogState[stateKey] = { data, loading: false, loaded: true, error: null };
  } catch (error) {
    console.error(`[useEquipmentCatalog] Failed to load ${type} manufacturers:`, error);
    catalogState[stateKey] = { data: [], loading: false, loaded: true, error };
  }

  notifySubscribers();
};

// Load models for a specific manufacturer
const loadModels = async (type, make, force = false) => {
  if (!make) return;

  const modelsKey = `${type}Models`;
  const models = catalogState[modelsKey];

  // Already loaded or loading (skip if force=true)
  if (!force && (models[make]?.loaded || models[make]?.loading)) return;

  catalogState[modelsKey] = {
    ...models,
    [make]: { data: [], loading: true, loaded: false }
  };
  notifySubscribers();

  try {
    // Add cache-busting timestamp to force fresh data
    const cacheBust = Date.now();
    const baseEndpoint = ENDPOINTS[modelsKey](make);
    const endpoint = `${baseEndpoint}${baseEndpoint.includes('?') ? '&' : '?'}_=${cacheBust}`;
    console.log(`[useEquipmentCatalog] Loading ${type} models for ${make} from:`, endpoint, force ? '(FORCED)' : '');
    const response = await cachedGet(endpoint, {}, axios);
    const data = response.data?.data || response.data || [];
    console.log(`[useEquipmentCatalog] Loaded ${data.length} ${type} models for ${make}`, data.length > 0 ? data[0] : 'empty');

    catalogState[modelsKey] = {
      ...catalogState[modelsKey],
      [make]: { data, loading: false, loaded: true }
    };
  } catch (error) {
    console.error(`[useEquipmentCatalog] Failed to load ${type} models for ${make}:`, error);
    catalogState[modelsKey] = {
      ...catalogState[modelsKey],
      [make]: { data: [], loading: false, loaded: true, error }
    };
  }

  notifySubscribers();
};

/**
 * Hook to access shared equipment catalog
 */
export const useEquipmentCatalog = () => {
  const [state, setState] = useState(catalogState);
  const mountedRef = useRef(true);

  // Subscribe to state changes
  useEffect(() => {
    mountedRef.current = true;

    const handleUpdate = (newState) => {
      if (mountedRef.current) {
        setState({ ...newState });
      }
    };

    catalogState.subscribers.add(handleUpdate);

    return () => {
      mountedRef.current = false;
      catalogState.subscribers.delete(handleUpdate);
    };
  }, []);

  // Memoized loaders
  const loadSolarPanelMakes = useCallback(() => loadManufacturers('solarPanel'), []);
  const loadBatteryMakes = useCallback(() => loadManufacturers('battery'), []);
  const loadInverterMakes = useCallback(() => loadManufacturers('inverter'), []);

  const loadSolarPanelModels = useCallback((make, force = false) => loadModels('solarPanel', make, force), []);
  const loadBatteryModels = useCallback((make, force = false) => loadModels('battery', make, force), []);
  const loadInverterModels = useCallback((make, force = false) => loadModels('inverter', make, force), []);

  return {
    // Solar panels
    solarPanelMakes: state.solarPanelMakes.data,
    solarPanelMakesLoading: state.solarPanelMakes.loading,
    loadSolarPanelMakes,
    getSolarPanelModels: (make) => state.solarPanelModels[make]?.data || [],
    loadSolarPanelModels,

    // Batteries
    batteryMakes: state.batteryMakes.data,
    batteryMakesLoading: state.batteryMakes.loading,
    loadBatteryMakes,
    getBatteryModels: (make) => state.batteryModels[make]?.data || [],
    loadBatteryModels,

    // Inverters
    inverterMakes: state.inverterMakes.data,
    inverterMakesLoading: state.inverterMakes.loading,
    loadInverterMakes,
    getInverterModels: (make) => state.inverterModels[make]?.data || [],
    loadInverterModels,
  };
};

// Preload commonly used data (call in App.js or EquipmentForm)
export const preloadEquipmentCatalog = () => {
  loadManufacturers('solarPanel');
  loadManufacturers('battery');
  loadManufacturers('inverter');
};

// Clear cached models for a specific manufacturer (useful after equipment data updates)
export const clearModelCache = (type, manufacturer) => {
  const modelsKey = `${type}Models`;
  if (catalogState[modelsKey] && catalogState[modelsKey][manufacturer]) {
    delete catalogState[modelsKey][manufacturer];
    console.log(`[useEquipmentCatalog] Cleared cache for ${type} models - ${manufacturer}`);
    notifySubscribers();
  }
};

// Clear all cached models for a type
export const clearAllModelsCache = (type) => {
  const modelsKey = `${type}Models`;
  catalogState[modelsKey] = {};
  console.log(`[useEquipmentCatalog] Cleared all ${type} models cache`);
  notifySubscribers();
};

export default useEquipmentCatalog;
