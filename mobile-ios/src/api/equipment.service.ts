// src/api/equipment.service.ts
// Generic Equipment API service functions for all equipment types

import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

const enc = encodeURIComponent;

// Get manufacturers by equipment type
export const getEquipmentManufacturers = async (equipmentType: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.INVENTORY_MODULE.List_Manufacturer_by_Type(enc(equipmentType))}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching ${equipmentType} manufacturers: `, error);
    return error?.response || null;
  }
};

// Get models by equipment type and manufacturer
export const getEquipmentModels = async (equipmentType: string, manufacturer: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.INVENTORY_MODULE.GET_MODEL_NUMBER(enc(equipmentType), enc(manufacturer))}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(`Error fetching ${equipmentType} models for ${manufacturer}: `, error);
    return error?.response || null;
  }
};

// Get equipment specifications by type, manufacturer, and model
// Uses dedicated equipment table endpoints for full specs
export const getEquipmentByMakeModel = async (
  equipmentType: string,
  manufacturer: string,
  modelNumber: string
) => {
  try {
    let URL: string;

    // Route to the correct equipment-specific endpoint based on type
    switch (equipmentType) {
      case "Solar Panel":
        // Use the solar panels search endpoint
        URL = `${apiEndpoints.BASE_URL}/api/solar-panels/search?q=${enc(modelNumber)}&limit=100`;
        break;
      case "Inverter":
      case "MicroInverter":
        // Use the inverters search endpoint
        URL = `${apiEndpoints.BASE_URL}/api/inverters/search?q=${enc(modelNumber)}&limit=100`;
        break;
      case "Battery":
        // Use batteries endpoint if it exists
        URL = `${apiEndpoints.BASE_URL}/api/batteries/search?q=${enc(modelNumber)}&limit=100`;
        break;
      default:
        // Fall back to generic equipment endpoint for other types
        URL = `${apiEndpoints.BASE_URL}/equipment/specifications?type=${enc(equipmentType)}&manufacturer=${enc(manufacturer)}&model=${enc(modelNumber)}`;
        break;
    }

    const response = await axiosInstance.get(URL);

    // For search endpoints, find the exact match by manufacturer and model
    if (response?.status === 200 && response?.data?.success) {
      const items = response.data.data || [];

      // If using search endpoint, find exact match
      if (equipmentType === "Solar Panel" || equipmentType === "Inverter" || equipmentType === "MicroInverter" || equipmentType === "Battery") {
        const exactMatch = items.find((item: any) => {
          const itemManufacturer = item.manufacturer || item.manufacturer_name || item.manufacturerName;
          const itemModel = item.model_number || item.modelNumber || item.model;
          return itemManufacturer === manufacturer && itemModel === modelNumber;
        });

        if (exactMatch) {
          return {
            status: 200,
            data: {
              success: true,
              data: exactMatch,
            },
          };
        }
      }

      return response;
    }

    return response;
  } catch (error) {
    console.error(`Error fetching ${equipmentType} specifications for ${manufacturer} ${modelNumber}: `, error);
    return error?.response || null;
  }
};

// Map category IDs to proper equipment type names for API calls
// These must match EXACTLY with the database equipment_type values
export const getEquipmentTypeForCategory = (categoryId: string): string => {
  const typeMap: { [key: string]: string } = {
    "solar-panels": "Solar Panel",
    "inverters": "Inverter",
    "micro-inverters": "MicroInverter",
    "batteries": "Battery",
    "storage-management": "SMS", // Storage Management Systems
    "ac-disconnects": "AC Disconnect",
    "pv-meters": "PV Meter",
    "load-centers": "Load Center",
    "rails": "Rail",
    "attachments": "Mounting Hardware",
    "ev-chargers": "EV Charger", // Not yet available in database
  };

  return typeMap[categoryId] || categoryId;
};
