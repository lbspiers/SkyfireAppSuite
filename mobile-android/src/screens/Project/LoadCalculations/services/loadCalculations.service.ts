// src/screens/Project/LoadCalculations/services/loadCalculations.service.ts

import axiosInstance from "../../../../api/axiosInstance";
import apiEndpoints from "../../../../config/apiEndPoint";
import { LoadCalculationsValues } from "../hooks/useLoadCalculations";
import { AdditionalLoad } from "../sections/AdditionalBreakersSection";

export type PanelType = "Main Panel A" | "Sub Panel B";

/**
 * Field mapping configuration for both panels
 */
const FIELD_MAPPING = {
  "Main Panel A": {
    floorArea: "ele_floor_area",
    smallApplianceCircuits: "ele_small_appliance_circuits",
    bathroomCircuits: "ele_bathroom_circuits",
    laundryCircuits: "ele_laundry_circuits",
    hvacAirHandler: "ele_hvac_air_handler_amps",
    electricalFurnace: "mpa_mainpanela_furnace_amps",
    electricVehicle: "ele_electric_vehicle_amps",
    loadTypePrefix: "ele_loadtype_",
    breakerPrefix: "ele_2p_breaker_",
    maxLoads: 17,
  },
  "Sub Panel B": {
    floorArea: "spb_floor_area",
    smallApplianceCircuits: "spb_small_appliance_circuits",
    bathroomCircuits: "spb_bathroom_circuits",
    laundryCircuits: "spb_laundry_circuits",
    hvacAirHandler: "spb_hvac_air_handler_amps",
    electricalFurnace: "spb_electrical_furnace_amps",
    electricVehicle: "spb_electric_vehicle_amps",
    loadTypePrefix: "spb_load_type_",
    breakerPrefix: "spb_breaker_rating_",
    maxLoads: 20,
  },
};

/**
 * Map UI values to database fields
 */
function mapValuesToDatabase(
  values: LoadCalculationsValues,
  panelType: PanelType
): Record<string, string> {
  const mapping = FIELD_MAPPING[panelType];
  const payload: Record<string, string> = {};

  // Map basic fields
  payload[mapping.floorArea] = values.floorArea || "";
  payload[mapping.smallApplianceCircuits] = values.smallApplianceCircuits || "";
  payload[mapping.bathroomCircuits] = values.bathroomCircuits || "";
  payload[mapping.laundryCircuits] = values.laundryCircuits || "";
  payload[mapping.hvacAirHandler] = values.hvacAirHandler || "";
  payload[mapping.electricalFurnace] = values.electricalFurnace || "";
  payload[mapping.electricVehicle] = values.electricVehicle || "";

  // Map additional loads - only map the loads that exist in the array
  values.additionalLoads.forEach((load, index) => {
    const slotNumber = index + 1;
    payload[`${mapping.loadTypePrefix}${slotNumber}`] = load.name || "";
    payload[`${mapping.breakerPrefix}${slotNumber}`] = load.amps || "";
  });

  return payload;
}

/**
 * Map database fields to UI values
 */
function mapDatabaseToValues(
  data: Record<string, any>,
  panelType: PanelType
): LoadCalculationsValues {
  const mapping = FIELD_MAPPING[panelType];

  // Map basic fields
  const values: LoadCalculationsValues = {
    floorArea: data[mapping.floorArea] || "",
    smallApplianceCircuits: data[mapping.smallApplianceCircuits] || "",
    bathroomCircuits: data[mapping.bathroomCircuits] || "",
    laundryCircuits: data[mapping.laundryCircuits] || "",
    hvacAirHandler: data[mapping.hvacAirHandler] || "",
    electricalFurnace: data[mapping.electricalFurnace] || "",
    electricVehicle: data[mapping.electricVehicle] || "",
    additionalLoads: [],
  };

  // Map additional loads - only include slots with actual data
  const loads: AdditionalLoad[] = [];
  for (let i = 1; i <= mapping.maxLoads; i++) {
    const name = data[`${mapping.loadTypePrefix}${i}`] || "";
    const amps = data[`${mapping.breakerPrefix}${i}`] || "";

    // Only add loads that have data OR if we haven't reached the minimum (4 rows)
    if (name || amps || loads.length < 4) {
      loads.push({
        id: `load-${i}`,
        name,
        amps,
      });
    }
  }

  // Ensure we always have at least 4 empty rows
  while (loads.length < 4) {
    loads.push({
      id: `load-${loads.length + 1}`,
      name: "",
      amps: "",
    });
  }

  values.additionalLoads = loads;

  return values;
}

/**
 * Fetch load calculations data for a specific panel
 */
export async function fetchLoadCalculations(
  projectId: string,
  companyId: string,
  panelType: PanelType
): Promise<LoadCalculationsValues | null> {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?companyId=${companyId}`;
    const response = await axiosInstance.get(URL);

    if (response.status === 200 && response.data?.success) {
      const systemData = response.data.data;
      return mapDatabaseToValues(systemData, panelType);
    }

    throw new Error("Failed to fetch load calculations");
  } catch (error: any) {
    if (error?.response?.status === 404) {
      // No data exists yet, return null
      return null;
    }
    console.error("Error fetching load calculations:", error);
    throw error;
  }
}

/**
 * Save load calculations data for a specific panel
 */
export async function saveLoadCalculations(
  projectId: string,
  companyId: string,
  values: LoadCalculationsValues,
  panelType: PanelType
): Promise<boolean> {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?companyId=${companyId}`;
    const payload = mapValuesToDatabase(values, panelType);

    console.log(`[LoadCalculations] Saving ${panelType} data:`, payload);

    const response = await axiosInstance.put(URL, payload);

    if (response.status === 200 && response.data?.success) {
      console.log(`[LoadCalculations] ${panelType} data saved successfully`);
      return true;
    }

    throw new Error("Failed to save load calculations");
  } catch (error: any) {
    console.error("Error saving load calculations:", error);
    throw error;
  }
}

/**
 * Clear all load calculations data for a specific panel
 */
export async function clearLoadCalculations(
  projectId: string,
  companyId: string,
  panelType: PanelType
): Promise<boolean> {
  try {
    const mapping = FIELD_MAPPING[panelType];
    const payload: Record<string, string> = {};

    // Clear basic fields
    payload[mapping.floorArea] = "";
    payload[mapping.smallApplianceCircuits] = "";
    payload[mapping.bathroomCircuits] = "";
    payload[mapping.laundryCircuits] = "";
    payload[mapping.hvacAirHandler] = "";
    payload[mapping.electricalFurnace] = "";
    payload[mapping.electricVehicle] = "";

    // Clear all load slots
    for (let i = 1; i <= mapping.maxLoads; i++) {
      payload[`${mapping.loadTypePrefix}${i}`] = "";
      payload[`${mapping.breakerPrefix}${i}`] = "";
    }

    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?companyId=${companyId}`;
    const response = await axiosInstance.put(URL, payload);

    if (response.status === 200 && response.data?.success) {
      console.log(`[LoadCalculations] ${panelType} data cleared successfully`);
      return true;
    }

    throw new Error("Failed to clear load calculations");
  } catch (error: any) {
    console.error("Error clearing load calculations:", error);
    throw error;
  }
}
