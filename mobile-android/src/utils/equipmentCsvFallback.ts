// src/utils/equipmentCsvFallback.ts
import batteryModelsData from '../constants/batteryModelsData.json';

interface BatteryModel {
  id: number;
  model: string;
  model_number: string;
  make_model: string;
  manufacturer: string;
  equipment_type: string;
  uuid: string;
}

type BatteryModelsData = Record<string, BatteryModel[]>;

const batteryData: BatteryModelsData = batteryModelsData as BatteryModelsData;

/**
 * Get battery models for a specific manufacturer from the local JSON data
 * This is a fallback when the API returns 0 results
 */
export function getBatteryModelsFromLocal(manufacturer: string): BatteryModel[] {
  const models = batteryData[manufacturer] || [];

  if (models.length > 0) {
    console.log(
      `[equipmentCsvFallback] ✅ Found ${models.length} battery models for "${manufacturer}" in local fallback data:`,
      models.map((m) => m.model).join(', ')
    );
  } else {
    console.log(
      `[equipmentCsvFallback] ❌ No battery models found for "${manufacturer}" in local fallback data`
    );
  }

  return models;
}

/**
 * Get all battery manufacturers from the local JSON data
 */
export function getBatteryManufacturersFromLocal(): string[] {
  const manufacturers = Object.keys(batteryData).sort();

  console.log(
    `[equipmentCsvFallback] Found ${manufacturers.length} battery manufacturers in local fallback data`
  );

  return manufacturers;
}

/**
 * Check if a manufacturer has battery models in the local data
 */
export function hasBatteryModelsInLocal(manufacturer: string): boolean {
  return !!batteryData[manufacturer] && batteryData[manufacturer].length > 0;
}
