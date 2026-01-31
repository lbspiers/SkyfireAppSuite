// src/utils/preferredEquipmentHelper.ts
// Helper utilities for managing preferred equipment filtering and selection

import { getPreferredEquipment, PreferredEquipment } from "../api/preferredEquipment.service";

export interface FilteredEquipmentOptions {
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string; id?: number }>;
  defaultMake?: string;
  defaultMakeLabel?: string;
  defaultModel?: string;
  defaultModelLabel?: string;
  hasPreferred: boolean;
}

/**
 * Equipment type mapping for preferred equipment API
 */
export const getEquipmentTypeForPreferred = (sectionType: string): string => {
  const mapping: Record<string, string> = {
    'solar-panel': 'solar-panels',
    'solar panel': 'solar-panels',
    'solar_panel': 'solar-panels',
    'inverter': 'inverters',
    'microinverter': 'micro-inverters',
    'micro-inverter': 'micro-inverters',
    'micro_inverter': 'micro-inverters',
    'storage': 'storage',
    'sms': 'storage',
    'battery': 'batteries',
    'optimizer': 'optimizers',
    'power-optimizer': 'optimizers',
    'inverter optimizer': 'optimizers',
    'string combiner panel': 'string-combiners',
    'string-combiner-panel': 'string-combiners',
    'string_combiner_panel': 'string-combiners',
    // BOS Equipment Types
    // Meters (PV Meters in inventory)
    'uni-directional meter': 'pv-meters',
    'unidirectional meter': 'pv-meters',
    'bi-directional meter': 'pv-meters',
    'bidirectional meter': 'pv-meters',
    'dedicated der meter': 'pv-meters',
    'meter': 'pv-meters',
    // Disconnects (AC Disconnects in inventory)
    'uni-directional meter line side disconnect': 'ac-disconnects',
    'bi-directional meter der side disconnect': 'ac-disconnects',
    'bi-directional meter line side disconnect': 'ac-disconnects',
    'utility disconnect': 'fused-ac-disconnects',
    'der meter disconnect switch': 'ac-disconnects',
    'disconnect': 'ac-disconnects',
    // Fused Disconnects (Fused AC Disconnects in inventory)
    'fused utility disconnect switch': 'fused-ac-disconnects',
    'fused ac disconnect': 'fused-ac-disconnects',
    // Load Centers
    'load center': 'load-centers',
    'load-center': 'load-centers',
    'backup panel': 'load-centers',
    'critical loads panel': 'load-centers',
  };

  const mappedType = mapping[sectionType.toLowerCase()] || sectionType;

  // Log mapping for debugging (only if different from input)
  if (mappedType !== sectionType) {
    console.log(`[PreferredEquipment] Type mapping: "${sectionType}" → "${mappedType}"`);
  }

  return mappedType;
};

/**
 * Fetch preferred equipment for a company and equipment type
 */
export const fetchPreferredEquipment = async (
  companyId: string | number,
  equipmentType: string
): Promise<PreferredEquipment[]> => {
  try {
    const response = await getPreferredEquipment(companyId, equipmentType);

    if (response?.status === 200) {
      const equipment = Array.isArray(response.data) ? response.data : [];
      return equipment;
    }

    return [];
  } catch (error) {
    console.error(`[PreferredEquipmentHelper] Error fetching preferred equipment:`, error);
    return [];
  }
};

/**
 * Filter equipment options based on preferred equipment settings
 *
 * Logic:
 * - If isNew is TRUE (new equipment):
 *   - If preferred equipment exists: return ONLY preferred makes/models
 *   - If NO preferred equipment: return ALL makes/models
 *   - If is_default is TRUE on any equipment: auto-select that make/model
 *
 * - If isNew is FALSE (existing equipment):
 *   - ALWAYS return ALL makes/models (full list)
 *
 * @param allMakes - All available makes from equipment database
 * @param allModels - All available models from equipment database
 * @param preferredEquipment - Company's preferred equipment list
 * @param isNew - Whether user selected "New" or "Existing" toggle
 * @param selectedMake - Currently selected make (for model filtering)
 * @param filterMakeOnly - For BOS equipment: only filter makes, show all models (default: false)
 */
export const filterEquipmentByPreferred = (
  allMakes: Array<{ label: string; value: string }>,
  allModels: Array<{ label: string; value: string; id?: number }>,
  preferredEquipment: PreferredEquipment[],
  isNew: boolean,
  selectedMake?: string,
  filterMakeOnly: boolean = false
): FilteredEquipmentOptions => {
  // If "Existing" is selected, always return full list
  if (!isNew) {
    return {
      makes: allMakes,
      models: allModels,
      hasPreferred: false,
    };
  }

  // If "New" is selected and NO preferred equipment, return full list
  if (preferredEquipment.length === 0) {
    return {
      makes: allMakes,
      models: allModels,
      hasPreferred: false,
    };
  }

  // If "New" is selected and preferred equipment exists, filter to preferred only
  const preferredMakes = new Set<string>();
  const preferredModelsMap = new Map<string, Set<string>>();
  let defaultEquipment: PreferredEquipment | undefined;

  // Build preferred sets and find default
  preferredEquipment.forEach((item) => {
    preferredMakes.add(item.make);

    if (!preferredModelsMap.has(item.make)) {
      preferredModelsMap.set(item.make, new Set());
    }
    preferredModelsMap.get(item.make)?.add(item.model);

    if (item.is_default) {
      defaultEquipment = item;
    }
  });

  // Filter makes to preferred only
  const filteredMakes = allMakes.filter((make) =>
    preferredMakes.has(make.value) || preferredMakes.has(make.label)
  );

  // For BOS equipment (filterMakeOnly = true): show ALL models for selected make
  // For other equipment: filter models to preferred only
  let filteredModels = allModels;
  if (!filterMakeOnly && selectedMake) {
    const preferredModelsForMake = preferredModelsMap.get(selectedMake);
    if (preferredModelsForMake) {
      filteredModels = allModels.filter((model) =>
        preferredModelsForMake.has(model.value) || preferredModelsForMake.has(model.label)
      );
    }
  }

  // Auto-select default if exists and only 1 preferred item
  let autoSelectData: Partial<FilteredEquipmentOptions> = {};

  if (defaultEquipment) {
    // Find the matching make/model in the filtered lists
    const defaultMakeOption = filteredMakes.find((m) =>
      m.value === defaultEquipment.make || m.label === defaultEquipment.make
    );

    if (defaultMakeOption && filteredMakes.length === 1) {
      autoSelectData = {
        defaultMake: defaultMakeOption.value,
        defaultMakeLabel: defaultMakeOption.label,
      };

      // If we auto-selected a make, also auto-select model if only 1 preferred model exists
      const preferredModelsForDefault = preferredModelsMap.get(defaultEquipment.make);
      if (preferredModelsForDefault && preferredModelsForDefault.size === 1) {
        const defaultModelValue = Array.from(preferredModelsForDefault)[0];
        const defaultModelOption = allModels.find((m) =>
          m.value === defaultModelValue || m.label === defaultModelValue
        );

        if (defaultModelOption) {
          autoSelectData.defaultModel = defaultModelOption.value;
          autoSelectData.defaultModelLabel = defaultModelOption.label;
        }
      }
    }
  }

  return {
    makes: filteredMakes,
    models: filteredModels,
    hasPreferred: true,
    ...autoSelectData,
  };
};

/**
 * Check if equipment should be auto-selected based on default flag
 * Returns auto-select data if applicable, null otherwise
 */
export const getAutoSelectEquipment = (
  preferredEquipment: PreferredEquipment[],
  isNew: boolean
): { make: string; makeLabel: string; model: string; modelLabel: string } | null => {
  // Only auto-select for new equipment
  if (!isNew) return null;

  // Find equipment with is_default = true
  const defaultEquipment = preferredEquipment.find((item) => item.is_default);

  if (defaultEquipment) {
    return {
      make: defaultEquipment.make,
      makeLabel: defaultEquipment.make,
      model: defaultEquipment.model,
      modelLabel: defaultEquipment.model,
    };
  }

  // If only 1 preferred equipment item exists, auto-select it
  if (preferredEquipment.length === 1) {
    const singleItem = preferredEquipment[0];
    return {
      make: singleItem.make,
      makeLabel: singleItem.make,
      model: singleItem.model,
      modelLabel: singleItem.model,
    };
  }

  return null;
};

/**
 * Log preferred equipment filtering for debugging
 */
export const logPreferredFiltering = (
  sectionName: string,
  isNew: boolean,
  preferredCount: number,
  filteredMakesCount: number,
  allMakesCount: number,
  hasDefault: boolean
) => {
  console.log(`[PreferredEquipment] ${sectionName}:`, {
    isNew,
    preferredCount,
    filteredMakes: filteredMakesCount,
    totalMakes: allMakesCount,
    hasDefault,
    filtering: isNew && preferredCount > 0 ? 'PREFERRED ONLY' : 'FULL LIST',
  });
};
