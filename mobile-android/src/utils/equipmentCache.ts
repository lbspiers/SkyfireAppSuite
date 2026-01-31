// src/utils/equipmentCache.ts
import {
  fetchManufacturersByType,
  fetchModelsFor,
} from "../screens/Project/SystemDetails/services/equipmentService";
import {
  getSolarPanelManufacturers,
  getSolarPanelModels,
} from "../api/solarPanel.service";
import {
  EquipmentType,
  coerceEquipmentType,
} from "../constants/equipmentTypes";

type Labeled = { label: string; value: string; id?: number; couple_type?: string };

/** Optional debug for troubleshooting type coercion */
const DEBUG = __DEV__;

/** In-memory caches, keyed by the CANONICAL equipment type string */
const makeCache: Record<EquipmentType | string, Labeled[]> = {};
const modelCache: Record<
  EquipmentType | string,
  Record<string, Labeled[]>
> = {};

/** Normalize API items into label/value pairs */
const normalize = (item: any): Labeled => {
  if (typeof item === "string") return { label: item, value: item };
  const label =
    item.model ?? item.name ?? item.label ?? item.manufacturer ?? "";
  const value = item.uuid ?? label;
  const result: Labeled = { label, value };

  // Preserve couple_type for battery models
  if (item.couple_type) {
    result.couple_type = item.couple_type;
  }

  return result;
};

/** Normalize solar panel models with ID (no wattage display) */
const normalizeSolarPanelModel = (item: any): Labeled => {
  if (typeof item === "string") return { label: item, value: item };

  const modelNumber = item.model_number || item.modelNumber || item.model || "";
  const id = item.id;

  return {
    label: modelNumber,
    value: modelNumber,
    id: id,
  };
};

/** Public helper to resolve sloppy inputs to canonical EquipmentType strings */
export function resolveEquipmentType(input: EquipmentType | string): string {
  const canonical = coerceEquipmentType(String(input)) ?? String(input);
  if (DEBUG && canonical !== input) {
    // eslint-disable-next-line no-console
    console.debug(
      `[equipmentCache] canonicalized type "${input}" → "${canonical}"`
    );
  }
  return canonical;
}

export async function getMakes(type: EquipmentType | string, forceRefresh = false) {
  const canonical = resolveEquipmentType(type);

  if (!makeCache[canonical] || forceRefresh) {
    // Use new solar panel API for Solar Panel type
    if (canonical === "Solar Panel") {
      const response = await getSolarPanelManufacturers();
      if (response?.status === 200 && response?.data?.success) {
        const manufacturers = response.data.data || [];
        makeCache[canonical] = manufacturers.map((item: any) => {
          if (typeof item === "string") return { label: item, value: item };
          return {
            label: item.manufacturer || item.name || item.label || "",
            value: item.manufacturer || item.name || item.value || "",
          };
        });
      } else {
        makeCache[canonical] = [];
      }
    } else {
      const raw = await fetchManufacturersByType(canonical, forceRefresh);
      makeCache[canonical] = (raw || []).map(normalize);
    }

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        `[equipmentCache] makes(${canonical}) → ${makeCache[canonical].length}${forceRefresh ? ' (forced refresh)' : ''}`
      );
    }
  }
  return makeCache[canonical];
}

export async function getModels(type: EquipmentType | string, make: string) {
  const canonical = resolveEquipmentType(type);
  modelCache[canonical] = modelCache[canonical] || {};

  if (!modelCache[canonical][make]) {
    // Use new solar panel API for Solar Panel type
    if (canonical === "Solar Panel") {
      const response = await getSolarPanelModels(make);
      if (response?.status === 200 && response?.data?.success) {
        const models = response.data.data || [];
        modelCache[canonical][make] = models.map(normalizeSolarPanelModel);
      } else {
        modelCache[canonical][make] = [];
      }
    } else {
      const raw = await fetchModelsFor(canonical, make);
      modelCache[canonical][make] = (raw || []).map(normalize);
    }

    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(
        `[equipmentCache] models(${canonical}, ${make}) → ${modelCache[canonical][make].length}`
      );
    }
  }
  return modelCache[canonical][make];
}

/** Optional: force-refresh all lists (e.g., when admin updates catalog). */
export function clearEquipmentCache() {
  Object.keys(makeCache).forEach((k) => delete makeCache[k]);
  Object.keys(modelCache).forEach((k) => delete modelCache[k]);
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.debug("[equipmentCache] caches cleared");
  }
}
