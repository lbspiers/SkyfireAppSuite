// src/api/solarPanel.service.ts
// Solar Panel API service functions following existing project patterns

import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";
import {
  SolarPanel,
  SolarPanelCreateRequest,
  SolarPanelUpdateRequest,
  SolarPanelQueryParams,
  EquipmentManufacturer,
  EquipmentModel
} from "../types/solarEquipment";

const enc = encodeURIComponent;

// Get all solar panels with optional filtering and pagination
export const getSolarPanels = async (params?: SolarPanelQueryParams) => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const URL = `${apiEndpoints.BASE_URL}/api/solar-panels${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching solar panels: ", error);
    return error?.response || null;
  }
};

// Get solar panel by ID
export const getSolarPanelById = async (id: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/solar-panels/${id}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching solar panel ${id}: `, error);
    return error?.response || null;
  }
};

// Get solar panel manufacturers from the new API
export const getSolarPanelManufacturers = async (pmax?: number) => {
  try {
    const URL = pmax
      ? `${apiEndpoints.BASE_URL}/api/solar-panels/manufacturers?pmax=${pmax}`
      : `${apiEndpoints.BASE_URL}/api/solar-panels/manufacturers`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching solar panel manufacturers: ", error);
    return error?.response || null;
  }
};

// Get solar panel models by manufacturer from the new API
export const getSolarPanelModels = async (manufacturer: string, pmax?: number) => {
  try {
    // Use the /models endpoint with query parameters (supports pmax filtering)
    let URL = `${apiEndpoints.BASE_URL}/api/solar-panels/models?manufacturer=${enc(manufacturer)}`;

    // Add pmax filter if specified
    if (pmax) {
      URL += `&pmax=${pmax}`;
    }

    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching solar panel models for ${manufacturer}: `, error);
    return error?.response || null;
  }
};

// Create new solar panel
export const createSolarPanel = async (data: SolarPanelCreateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels`;
    const response = await axiosInstance.post(URL, data);
    return response;
  } catch (error) {
    console.error("Error creating solar panel: ", error);
    return error?.response || null;
  }
};

// Update existing solar panel
export const updateSolarPanel = async (id: number, data: SolarPanelUpdateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/${id}`;
    const response = await axiosInstance.put(URL, data);
    return response;
  } catch (error) {
    console.error(`Error updating solar panel ${id}: `, error);
    return error?.response || null;
  }
};

// Delete solar panel
export const deleteSolarPanel = async (id: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/${id}`;
    const response = await axiosInstance.delete(URL);
    return response;
  } catch (error) {
    console.error(`Error deleting solar panel ${id}: `, error);
    return error?.response || null;
  }
};

// Search solar panels by text query
export const searchSolarPanels = async (query: string, limit = 20) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/solar-panels/search?q=${enc(query)}&limit=${limit}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error searching solar panels for "${query}": `, error);
    return error?.response || null;
  }
};

// Get solar panel by manufacturer and model number
export const getSolarPanelByMakeModel = async (
  manufacturer: string,
  modelNumber: string
) => {
  try {
    // Search for the panel by model number
    const searchResponse = await searchSolarPanels(modelNumber, 100);

    if (searchResponse?.status === 200 && searchResponse?.data?.success) {
      const panels = searchResponse.data.data || [];

      // Find exact match by manufacturer and model number
      const panel = panels.find((p: any) =>
        p.manufacturer === manufacturer &&
        p.model_number === modelNumber
      );

      if (panel) {
        return {
          status: 200,
          data: {
            success: true,
            data: panel,
          },
        };
      }
    }

    // If not found via search, return error
    return {
      status: 404,
      data: {
        success: false,
        message: 'Panel not found',
      },
    };
  } catch (error) {
    console.error('Error fetching panel by make/model:', error);
    return error?.response || null;
  }
};

// Get solar panels by manufacturer
export const getSolarPanelsByManufacturer = async (manufacturer: string, params?: Omit<SolarPanelQueryParams, 'manufacturer'>) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('manufacturer', manufacturer);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const URL = `${apiEndpoints.BASE_URL}/solar-panels?${queryParams.toString()}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching solar panels by manufacturer ${manufacturer}: `, error);
    return error?.response || null;
  }
};

// Get solar panel specifications by model
export const getSolarPanelSpecifications = async (manufacturer: string, modelNumber: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/specifications?manufacturer=${enc(manufacturer)}&model=${enc(modelNumber)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching solar panel specifications for ${manufacturer} ${modelNumber}: `, error);
    return error?.response || null;
  }
};

// Bulk create solar panels
export const bulkCreateSolarPanels = async (panels: SolarPanelCreateRequest[]) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/bulk`;
    const response = await axiosInstance.post(URL, { panels });
    return response;
  } catch (error) {
    console.error("Error bulk creating solar panels: ", error);
    return error?.response || null;
  }
};

// Bulk update solar panels
export const bulkUpdateSolarPanels = async (updates: SolarPanelUpdateRequest[]) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/bulk`;
    const response = await axiosInstance.put(URL, { updates });
    return response;
  } catch (error) {
    console.error("Error bulk updating solar panels: ", error);
    return error?.response || null;
  }
};

// Get solar panel statistics
export const getSolarPanelStats = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/stats`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching solar panel statistics: ", error);
    return error?.response || null;
  }
};

// Import solar panels from CSV/Excel file
export const importSolarPanels = async (file: FormData) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/import`;
    const response = await axiosInstance.post(URL, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error("Error importing solar panels: ", error);
    return error?.response || null;
  }
};

// Export solar panels to CSV
export const exportSolarPanels = async (params?: SolarPanelQueryParams) => {
  try {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/export${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(URL, {
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    console.error("Error exporting solar panels: ", error);
    return error?.response || null;
  }
};

// Validate solar panel data before creation/update
export const validateSolarPanelData = async (data: SolarPanelCreateRequest | SolarPanelUpdateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/validate`;
    const response = await axiosInstance.post(URL, data);
    return response;
  } catch (error) {
    console.error("Error validating solar panel data: ", error);
    return error?.response || null;
  }
};

// Check if solar panel model exists
export const checkSolarPanelExists = async (manufacturer: string, modelNumber: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/exists?manufacturer=${enc(manufacturer)}&model=${enc(modelNumber)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error checking if solar panel exists (${manufacturer} ${modelNumber}): `, error);
    return error?.response || null;
  }
};

// Get popular/trending solar panels
export const getPopularSolarPanels = async (limit = 10) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/popular?limit=${limit}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching popular solar panels: ", error);
    return error?.response || null;
  }
};

// Get solar panels compatible with specific inverter
export const getCompatibleSolarPanels = async (inverterId: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/solar-panels/compatible/${inverterId}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching compatible solar panels for inverter ${inverterId}: `, error);
    return error?.response || null;
  }
};

// Utility functions for data transformation (following existing patterns)
export const normalizeSolarPanelManufacturer = (item: any): EquipmentManufacturer => {
  if (typeof item === "string") return { label: item, value: item };
  const label = item.manufacturer ?? item.name ?? item.label ?? "";
  const value = item.uuid ?? item.id ?? label;
  return { label, value };
};

export const normalizeSolarPanelModel = (item: any): EquipmentModel => {
  if (typeof item === "string") return { label: item, value: item };
  const label = item.modelNumber ?? item.model ?? item.label ?? "";
  const value = item.uuid ?? item.id ?? label;
  const manufacturer = item.manufacturer ?? undefined;
  return { label, value, manufacturer };
};

// Convert API response to frontend format (following existing camelCase patterns)
export const transformSolarPanelResponse = (panel: any): SolarPanel => {
  return {
    id: panel.id,
    manufacturerModel: panel.manufacturer_model || panel.manufacturerModel,
    manufacturer: panel.manufacturer,
    modelNumber: panel.model_number || panel.modelNumber,
    description: panel.description,
    nameplatePmax: panel.nameplate_pmax || panel.nameplatePmax,
    ptc: panel.ptc,
    nameplateVpmax: panel.nameplate_vpmax || panel.nameplateVpmax,
    nameplateIpmax: panel.nameplate_ipmax || panel.nameplateIpmax,
    nameplateVoc: panel.nameplate_voc || panel.nameplateVoc,
    nameplateIsc: panel.nameplate_isc || panel.nameplateIsc,
    averageNoct: panel.average_noct || panel.averageNoct,
    nS: panel.n_s || panel.nS,
    shortFt: panel.short_ft || panel.shortFt,
    longFt: panel.long_ft || panel.longFt,
    weightLbs: panel.weight_lbs || panel.weightLbs,
    createdAt: panel.created_at || panel.createdAt,
    updatedAt: panel.updated_at || panel.updatedAt,
  };
};