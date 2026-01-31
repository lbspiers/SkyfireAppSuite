// src/api/inverter.service.ts
// Inverter API service functions following existing project patterns

import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";
import {
  Inverter,
  InverterCreateRequest,
  InverterUpdateRequest,
  InverterQueryParams,
  EquipmentManufacturer,
  EquipmentModel
} from "../types/solarEquipment";

const enc = encodeURIComponent;

// Get all inverters with optional filtering and pagination
export const getInverters = async (params?: InverterQueryParams) => {
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
    const URL = `${apiEndpoints.BASE_URL}/inverters${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching inverters: ", error);
    return error?.response || null;
  }
};

// Get inverter by ID
export const getInverterById = async (id: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/inverters/${id}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching inverter ${id}: `, error);
    return error?.response || null;
  }
};

// Get inverter by model number
export const getInverterByModelNumber = async (modelNumber: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/inverters?model_number=${encodeURIComponent(modelNumber)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching inverter by model number ${modelNumber}: `, error);
    return error?.response || null;
  }
};

// Get inverter manufacturers (following existing equipment patterns)
export const getInverterManufacturers = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.INVENTORY_MODULE.List_Manufacturer_by_Type(enc("Inverter"))}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching inverter manufacturers: ", error);
    return error?.response || null;
  }
};

// Get inverter models by manufacturer (following existing patterns)
export const getInverterModels = async (manufacturer: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.INVENTORY_MODULE.GET_MODEL_NUMBER(enc("Inverter"), enc(manufacturer))}`;
    console.log(`[getInverterModels] 🔍 Fetching inverter models for manufacturer: "${manufacturer}"`);
    console.log(`[getInverterModels] 📡 API URL: ${URL}`);
    const response = await axiosInstance.get(URL);
    const modelCount = response?.data?.data?.length || 0;
    console.log(`[getInverterModels] ✅ Response received: ${modelCount} models found`);

    // Log first model's structure to verify max_cont_output_amps is included
    if (modelCount > 0) {
      const firstModel = response.data.data[0];
      console.log(`[getInverterModels] 📋 First model structure:`, firstModel);
      console.log(`[getInverterModels] ⚡ First model max_cont_output_amps:`, firstModel.max_cont_output_amps);
      console.log(`[getInverterModels] 📝 Available fields:`, Object.keys(firstModel).join(', '));
    }

    if (modelCount === 0) {
      console.warn(`[getInverterModels] ⚠️ No inverter models found for "${manufacturer}" - this may indicate a backend data issue`);
    }
    return response;
  } catch (error) {
    console.error(`[getInverterModels] ❌ Error fetching inverter models for "${manufacturer}":`, error);
    return error?.response || null;
  }
};

// Create new inverter
export const createInverter = async (data: InverterCreateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters`;
    const response = await axiosInstance.post(URL, data);
    return response;
  } catch (error) {
    console.error("Error creating inverter: ", error);
    return error?.response || null;
  }
};

// Update existing inverter
export const updateInverter = async (id: number, data: InverterUpdateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/${id}`;
    const response = await axiosInstance.put(URL, data);
    return response;
  } catch (error) {
    console.error(`Error updating inverter ${id}: `, error);
    return error?.response || null;
  }
};

// Delete inverter
export const deleteInverter = async (id: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/${id}`;
    const response = await axiosInstance.delete(URL);
    return response;
  } catch (error) {
    console.error(`Error deleting inverter ${id}: `, error);
    return error?.response || null;
  }
};

// Search inverters by text query
export const searchInverters = async (query: string, limit = 20) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/search?q=${enc(query)}&limit=${limit}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error searching inverters for "${query}": `, error);
    return error?.response || null;
  }
};

// Get inverters by manufacturer
export const getInvertersByManufacturer = async (manufacturer: string, params?: Omit<InverterQueryParams, 'manufacturer'>) => {
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

    const URL = `${apiEndpoints.BASE_URL}/inverters?${queryParams.toString()}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching inverters by manufacturer ${manufacturer}: `, error);
    return error?.response || null;
  }
};

// Get inverter specifications by model
export const getInverterSpecifications = async (manufacturer: string, modelNumber: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/specifications?manufacturer=${enc(manufacturer)}&model=${enc(modelNumber)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching inverter specifications for ${manufacturer} ${modelNumber}: `, error);
    return error?.response || null;
  }
};

// Get microinverters only
export const getMicroinverters = async (params?: Omit<InverterQueryParams, 'microinverter'>) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('microinverter', 'true');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const URL = `${apiEndpoints.BASE_URL}/inverters?${queryParams.toString()}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching microinverters: ", error);
    return error?.response || null;
  }
};

// Get power optimizers only
export const getPowerOptimizers = async (params?: Omit<InverterQueryParams, 'powerOptimizer'>) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('powerOptimizer', 'true');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const URL = `${apiEndpoints.BASE_URL}/inverters?${queryParams.toString()}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching power optimizers: ", error);
    return error?.response || null;
  }
};

// Get inverters by power range
export const getInvertersByPowerRange = async (minPower: number, maxPower: number, params?: Omit<InverterQueryParams, 'minPower' | 'maxPower'>) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('minPower', minPower.toString());
    queryParams.append('maxPower', maxPower.toString());

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const URL = `${apiEndpoints.BASE_URL}/inverters?${queryParams.toString()}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching inverters by power range ${minPower}-${maxPower}kW: `, error);
    return error?.response || null;
  }
};

// Bulk create inverters
export const bulkCreateInverters = async (inverters: InverterCreateRequest[]) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/bulk`;
    const response = await axiosInstance.post(URL, { inverters });
    return response;
  } catch (error) {
    console.error("Error bulk creating inverters: ", error);
    return error?.response || null;
  }
};

// Bulk update inverters
export const bulkUpdateInverters = async (updates: InverterUpdateRequest[]) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/bulk`;
    const response = await axiosInstance.put(URL, { updates });
    return response;
  } catch (error) {
    console.error("Error bulk updating inverters: ", error);
    return error?.response || null;
  }
};

// Get inverter statistics
export const getInverterStats = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/stats`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching inverter statistics: ", error);
    return error?.response || null;
  }
};

// Import inverters from CSV/Excel file
export const importInverters = async (file: FormData) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/import`;
    const response = await axiosInstance.post(URL, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error("Error importing inverters: ", error);
    return error?.response || null;
  }
};

// Export inverters to CSV
export const exportInverters = async (params?: InverterQueryParams) => {
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
    const URL = `${apiEndpoints.BASE_URL}/inverters/export${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(URL, {
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    console.error("Error exporting inverters: ", error);
    return error?.response || null;
  }
};

// Validate inverter data before creation/update
export const validateInverterData = async (data: InverterCreateRequest | InverterUpdateRequest) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/validate`;
    const response = await axiosInstance.post(URL, data);
    return response;
  } catch (error) {
    console.error("Error validating inverter data: ", error);
    return error?.response || null;
  }
};

// Check if inverter model exists
export const checkInverterExists = async (manufacturer: string, modelNumber: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/exists?manufacturer=${enc(manufacturer)}&model=${enc(modelNumber)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error checking if inverter exists (${manufacturer} ${modelNumber}): `, error);
    return error?.response || null;
  }
};

// Get popular/trending inverters
export const getPopularInverters = async (limit = 10) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/popular?limit=${limit}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error("Error fetching popular inverters: ", error);
    return error?.response || null;
  }
};

// Get inverters compatible with specific solar panels
export const getCompatibleInverters = async (solarPanelId: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/compatible/${solarPanelId}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching compatible inverters for solar panel ${solarPanelId}: `, error);
    return error?.response || null;
  }
};

// Calculate optimal inverter size for solar panel array
export const calculateOptimalInverterSize = async (panelSpecs: { wattage: number; quantity: number; efficiency?: number }) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/calculate-optimal-size`;
    const response = await axiosInstance.post(URL, panelSpecs);
    return response;
  } catch (error) {
    console.error("Error calculating optimal inverter size: ", error);
    return error?.response || null;
  }
};

// Get inverter efficiency curve data
export const getInverterEfficiencyCurve = async (id: number) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/${id}/efficiency-curve`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching efficiency curve for inverter ${id}: `, error);
    return error?.response || null;
  }
};

// Get inverter string configuration recommendations
export const getStringConfigurationRecommendations = async (inverterId: number, panelSpecs: { voltage: number; current: number; quantity: number }) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/inverters/${inverterId}/string-recommendations`;
    const response = await axiosInstance.post(URL, panelSpecs);
    return response;
  } catch (error) {
    console.error(`Error getting string configuration recommendations for inverter ${inverterId}: `, error);
    return error?.response || null;
  }
};

// Utility functions for data transformation (following existing patterns)
export const normalizeInverterManufacturer = (item: any): EquipmentManufacturer => {
  if (typeof item === "string") return { label: item, value: item };
  const label = item.manufacturerName ?? item.manufacturer ?? item.name ?? item.label ?? "";
  const value = item.uuid ?? item.id ?? label;
  return { label, value };
};

export const normalizeInverterModel = (item: any): EquipmentModel => {
  if (typeof item === "string") return { label: item, value: item };
  const label = item.modelNumber ?? item.model ?? item.label ?? "";
  const value = item.uuid ?? item.id ?? label;
  const manufacturer = item.manufacturerName ?? item.manufacturer ?? undefined;
  return { label, value, manufacturer };
};

// Convert API response to frontend format (following existing camelCase patterns)
export const transformInverterResponse = (inverter: any): Inverter => {
  return {
    id: inverter.id,
    makeModel: inverter.make_model || inverter.makeModel,
    manufacturerName: inverter.manufacturer_name || inverter.manufacturerName,
    modelNumber: inverter.model_number || inverter.modelNumber,
    description: inverter.description,
    maxContinuousOutputPowerKw: inverter.max_continuous_output_power_kw || inverter.maxContinuousOutputPowerKw,
    nominalVoltageVac: inverter.nominal_voltage_vac || inverter.nominalVoltageVac,
    weightedEfficiencyPercent: inverter.weighted_efficiency_percent || inverter.weightedEfficiencyPercent,
    builtInMeter: inverter.built_in_meter || inverter.builtInMeter,
    microinverter: inverter.microinverter,
    powerOptimizer: inverter.power_optimizer || inverter.powerOptimizer,
    nightTareLoss: inverter.night_tare_loss || inverter.nightTareLoss,
    voltageMinimum: inverter.voltage_minimum || inverter.voltageMinimum,
    voltageNominal: inverter.voltage_nominal || inverter.voltageNominal,
    voltageMaximum: inverter.voltage_maximum || inverter.voltageMaximum,
    cecEfficiency: inverter.cec_efficiency || inverter.cecEfficiency,
    maxContOutputAmps: inverter.max_cont_output_amps || inverter.maxContOutputAmps,
    maxInputIsc1: inverter.max_input_isc_1 || inverter.maxInputIsc1,
    maxInputIsc2: inverter.max_input_isc_2 || inverter.maxInputIsc2,
    maxInputIsc3: inverter.max_input_isc_3 || inverter.maxInputIsc3,
    maxInputIsc4: inverter.max_input_isc_4 || inverter.maxInputIsc4,
    maxInputIsc5: inverter.max_input_isc_5 || inverter.maxInputIsc5,
    maxInputIsc6: inverter.max_input_isc_6 || inverter.maxInputIsc6,
    maxInputIsc7: inverter.max_input_isc_7 || inverter.maxInputIsc7,
    maxInputIsc8: inverter.max_input_isc_8 || inverter.maxInputIsc8,
    maxInputIsc9: inverter.max_input_isc_9 || inverter.maxInputIsc9,
    maxInputIsc10: inverter.max_input_isc_10 || inverter.maxInputIsc10,
    maxInputIsc11: inverter.max_input_isc_11 || inverter.maxInputIsc11,
    maxInputIsc12: inverter.max_input_isc_12 || inverter.maxInputIsc12,
    solaredgeSeries: inverter.solaredge_series || inverter.solaredgeSeries,
    hybrid: inverter.hybrid,
    equipmentType: inverter.equipment_type || inverter.equipmentType,
    maxStringsBranches: inverter.max_strings_branches || inverter.maxStringsBranches,
    createdAt: inverter.created_at || inverter.createdAt,
    updatedAt: inverter.updated_at || inverter.updatedAt,
  };
};