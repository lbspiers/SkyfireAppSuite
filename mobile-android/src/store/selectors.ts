// Centralized Redux selectors with defensive programming for crash prevention
import { RootState } from './store';

// Auth selectors with null safety
export const selectAccessToken = (state: RootState) => {
  try {
    return state?.auth?.accessToken || null;
  } catch (error) {
    console.warn('Error accessing accessToken:', error);
    return null;
  }
};

export const selectIsAuthenticated = (state: RootState) => {
  try {
    return state?.auth?.isAuthenticated || false;
  } catch (error) {
    console.warn('Error accessing isAuthenticated:', error);
    return false;
  }
};

// Profile selectors with deep null checks
export const selectProfile = (state: RootState) => {
  try {
    return state?.profile?.profile || null;
  } catch (error) {
    console.warn('Error accessing profile:', error);
    return null;
  }
};

export const selectCompanyId = (state: RootState) => {
  try {
    return state?.profile?.profile?.company?.uuid || null;
  } catch (error) {
    console.warn('Error accessing company ID:', error);
    return null;
  }
};

export const selectCompanyAddress = (state: RootState) => {
  try {
    return state?.profile?.profile?.company?.address || null;
  } catch (error) {
    console.warn('Error accessing company address:', error);
    return null;
  }
};

// Project selectors with array safety
export const selectCurrentProject = (state: RootState) => {
  try {
    return state?.project?.currentProject || null;
  } catch (error) {
    console.warn('Error accessing current project:', error);
    return null;
  }
};

export const selectProjectId = (state: RootState) => {
  try {
    const project = state?.project?.currentProject;
    return project?.uuid || project?.id || null;
  } catch (error) {
    console.warn('Error accessing project ID:', error);
    return null;
  }
};

export const selectUpdateProjectDetails = (state: RootState) => {
  try {
    return state?.project?.updateProjectDetails || null;
  } catch (error) {
    console.warn('Error accessing updateProjectDetails:', error);
    return null;
  }
};

export const selectEquipmentSets = (state: RootState) => {
  try {
    const details = state?.project?.updateProjectDetails;
    if (!details || !details.equipment_sets) return [];
    if (!Array.isArray(details.equipment_sets)) return [];
    return details.equipment_sets;
  } catch (error) {
    console.warn('Error accessing equipment sets:', error);
    return [];
  }
};

export const selectFirstEquipmentSet = (state: RootState) => {
  try {
    const sets = selectEquipmentSets(state);
    return sets[0] || null;
  } catch (error) {
    console.warn('Error accessing first equipment set:', error);
    return null;
  }
};

// Theme selectors
export const selectTheme = (state: RootState) => {
  try {
    return state?.theme?.theme || {
      Backgroundcolor1: "#2E4161",
      Backgroundcolor2: "#0C1F3F",
    };
  } catch (error) {
    console.warn('Error accessing theme:', error);
    return {
      Backgroundcolor1: "#2E4161",
      Backgroundcolor2: "#0C1F3F",
    };
  }
};

// Site info selectors
export const selectSiteInfo = (state: RootState) => {
  try {
    return {
      address: state?.site?.address || "",
      city: state?.site?.city || "",
      state: state?.site?.state || "",
      zip: state?.site?.zip || "",
    };
  } catch (error) {
    console.warn('Error accessing site info:', error);
    return {
      address: "",
      city: "",
      state: "",
      zip: "",
    };
  }
};

// Stringing selectors
export const selectStringingData = (state: RootState) => {
  try {
    return state?.stringing || {};
  } catch (error) {
    console.warn('Error accessing stringing data:', error);
    return {};
  }
};

export const selectInverterStringingData = (state: RootState) => {
  try {
    return state?.inverterStringing || {};
  } catch (error) {
    console.warn('Error accessing inverter stringing data:', error);
    return {};
  }
};

// Utility function to safely access nested properties
export const safeGet = (obj: any, path: string, defaultValue: any = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn(`Error accessing path ${path}:`, error);
    return defaultValue;
  }
};