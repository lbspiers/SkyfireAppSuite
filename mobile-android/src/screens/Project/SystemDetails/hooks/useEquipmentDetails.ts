// src/screens/Project/SystemDetails/hooks/useEquipmentDetails.ts
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import debounce from "lodash/debounce";
import { useEquipmentSection } from "./useEquipmentSection";
import {
  fetchSystemDetailsSafe,
  readSelectedSystem,
  saveSelectedSystem,
  readBackupOption,
  saveBackupOption,
  readBatteryConfiguration,
  saveSystemDetailsPartialExact,
} from "../services/equipmentService";
import { fetchUtilityRequirements } from "../../../../api/utility.service";
import { EQUIPMENT_TYPES } from "../../../../constants/equipmentTypes";
import { APSConfigurationManager, EquipmentState, ConfigurationChange } from "../../../../services/APSConfigurationManager";
import { APSConfigurationSwitchboard, ConfigurationOutput } from "../../../../utils/Apsconfigurationswitchboard";

type SystemType = "" | "microinverter" | "inverter";
type StringingType = "" | "auto" | "custom";
type BackupOption = "" | "Whole Home" | "Partial Home" | "No Backup";

// StringingConfiguration interface for custom stringing functionality
export interface MPPTConfiguration {
  strings: number;
  panelsPerString: number;
  totalPanels: number;
}

export interface StringingConfiguration {
  mppt1: MPPTConfiguration;
  mppt2: MPPTConfiguration;
  mppt3: MPPTConfiguration;
  mppt4: MPPTConfiguration;
  mppt5: MPPTConfiguration;
  mppt6: MPPTConfiguration;
  totalMPPTs: number;
  totalPanels: number;
}

/** Stable wrapper for possibly-changing function refs. */
function useStableFn<T extends (...args: any[]) => any>(fn?: T) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  // identity never changes
  // @ts-expect-error generic call-through
  return useCallback((...args) => fnRef.current?.(...args), []);
}

// Helper function to dynamically map field names based on system prefix
const mapFieldName = (fieldName: string, prefix: string): string => {
  // Replace sys1_ with the dynamic prefix (sys2_, sys3_, sys4_)
  let mappedName = fieldName.replace(/^sys1_/, prefix);

  // Handle database schema inconsistency: sys2_solarpanel_existing (no underscore)
  // System 1 uses sys1_solar_panel_existing (with underscore)
  // System 2+ uses sys{N}_solarpanel_existing (no underscore)
  if (prefix !== 'sys1_' && mappedName.includes('_solar_panel_existing')) {
    mappedName = mappedName.replace('_solar_panel_existing', '_solarpanel_existing');
  }

  return mappedName;
};

// Helper to create dynamic field mappings for payloads
const createDynamicPayload = (basePayload: Record<string, any>, systemPrefix: string): Record<string, any> => {
  const dynamicPayload: Record<string, any> = {};
  Object.entries(basePayload).forEach(([key, value]) => {
    const dynamicKey = mapFieldName(key, systemPrefix);
    dynamicPayload[dynamicKey] = value;
  });
  console.log("[createDynamicPayload]", { basePayload, systemPrefix, dynamicPayload });
  return dynamicPayload;
};

// Helper to extract values from dynamic fields
const extractDynamicValue = (data: Record<string, any>, fieldName: string, systemPrefix: string): any => {
  const dynamicFieldName = mapFieldName(fieldName, systemPrefix);
  // if (__DEV__) {
  //   console.log(`[extractDynamicValue] ${fieldName} → ${dynamicFieldName} = ${data[dynamicFieldName]}`);
  // }
  return data[dynamicFieldName];
};

// Helper to parse stringing configuration from JSON string
const parseStringingConfiguration = (configString?: string): StringingConfiguration | null => {
  if (!configString) return null;

  try {
    const parsed = JSON.parse(configString);
    // Validate that it has the expected structure
    if (parsed && typeof parsed === 'object' && parsed.mppt1 && parsed.totalPanels !== undefined) {
      return parsed as StringingConfiguration;
    }
    // console.warn('🔧 Invalid stringing configuration structure:', parsed);
    return null;
  } catch (error) {
    // console.warn('🔧 Failed to parse stringing configuration:', error);
    return null;
  }
};

// Helper to serialize stringing configuration to JSON string
const serializeStringingConfiguration = (config: StringingConfiguration): string => {
  try {
    return JSON.stringify(config);
  } catch (error) {
    // console.error('🔧 Failed to serialize stringing configuration:', error);
    return '{}';
  }
};

export function useEquipmentDetails(
  projectID?: string,
  companyUuid?: string,
  systemPrefix: string = "sys1_",
  utilityRequirements?: {
    abbrev?: string;
    combination?: string;
    bos_type_1?: string;
    bos_type_2?: string;
    bos_type_3?: string;
    bos_type_4?: string;
    bos_type_5?: string;
    bos_type_6?: string;
  },
  projectSite?: {
    utility?: string;
    state?: string;
  }
) {
  console.log(`🔧 [useEquipmentDetails] Hook called for systemPrefix: ${systemPrefix}`);

  // Get project from Redux for utility information
  const project = useSelector((s: any) => s.project.currentProject);

  // Internal utility requirements state (fetched when inverter is selected)
  const [internalUtilityRequirements, setInternalUtilityRequirements] = useState<any>(null);

  // Use internal requirements if available, otherwise fall back to passed prop
  const activeUtilityRequirements = internalUtilityRequirements || utilityRequirements;

  // Removed CONFIG-DEBUG logs for performance optimization

  // Header & main selectors ----------------------------------------------------
  const [headerHeight, setHeaderHeight] = useState(0);
  const [systemType, setSystemType] = useState<SystemType>("");
  // NOTE: stringingType moved to inverterSection state to be system-specific
  const [backupOption, setBackupOption] = useState<BackupOption>("");
  const [utilityServiceAmps, setUtilityServiceAmps] = useState<string>("");

  // Track when backup option was last manually set to prevent hydration from overwriting it
  const backupOptionSetTimeRef = useRef<number>(0);

  // Wrapper for setBackupOption that records timestamp
  const setBackupOptionWithTimestamp = useCallback((value: BackupOption | ((prev: BackupOption) => BackupOption)) => {
    backupOptionSetTimeRef.current = Date.now();
    console.log('[BACKUP OPTION TIMESTAMP] User set backup option, timestamp recorded:', {
      timestamp: backupOptionSetTimeRef.current,
      value: typeof value === 'function' ? 'function' : value
    });
    if (typeof value === 'function') {
      setBackupOption(value);
    } else {
      setBackupOption(value);
    }
  }, []);

  // Debug logging for backupOption changes
  useEffect(() => {
    console.log('[BACKUP OPTION DEBUG] backupOption changed to:', backupOption);
  }, [backupOption]);

  // Battery Type 2 is revealed via the + button in BT1
  const [showBattery2, setShowBattery2] = useState(false);

  // Loading state for system data
  const [isLoadingSystemData, setIsLoadingSystemData] = useState(false);
  const previousSystemPrefixRef = useRef<string>(systemPrefix);

  // APS Configuration Management -----------------------------------------------
  const [apsConfigManager] = useState(() => new APSConfigurationManager());
  const [currentAPSConfig, setCurrentAPSConfig] = useState<string | null>(null);
  const [apsConfigDetails, setApsConfigDetails] = useState<ConfigurationOutput | null>(null);
  const [showAPSBOSModal, setShowAPSBOSModal] = useState(false);
  const [showAPSChangeModal, setShowAPSChangeModal] = useState(false);
  const [pendingConfigChange, setPendingConfigChange] = useState<ConfigurationChange | null>(null);
  const [utilityName, setUtilityName] = useState<string>('');

  // Track "ask later" state for APS configuration
  const [apsConfigAskLater, setApsConfigAskLater] = useState(false);

  // Visibility booleans (scoped INSIDE hook) ----------------------------------
  const isMicro = systemType === "microinverter";
  const isInverter = systemType === "inverter";
  const hasSystem = isMicro || isInverter;

  const hasBackupChoice =
    backupOption === "Whole Home" ||
    backupOption === "Partial Home" ||
    backupOption === "No Backup";

  const smsEnabled = backupOption === "Whole Home" || backupOption === "Partial Home";
  const battery2Enabled = hasBackupChoice && showBattery2;
  // Backup Load Sub Panel shows for Whole Home and Partial Home
  const backupSubpanelEnabled = backupOption === "Whole Home" || backupOption === "Partial Home";
  const essCombinerEnabled = !!backupOption; // if you show an ESS helper card

  // Raw system row -------------------------------------------------------------
  const [rawSys, setRawSys] = useState<any>(null);
  const fetchedOnceRef = useRef(false);

  // Watch for data refresh triggers from Redux (e.g., after BOS auto-population)
  const lastDataRefresh = useSelector((s: any) => s.project.lastDataRefresh);

  useEffect(() => {
    if (!projectID) return;
    let cancelled = false;
    (async () => {
      const data = await fetchSystemDetailsSafe(projectID);
      if (!cancelled) {
        setRawSys(data);
        fetchedOnceRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectID, lastDataRefresh]); // Re-fetch when lastDataRefresh changes

  // Handle system switching - force fresh data fetch
  useEffect(() => {
    // Only run when systemPrefix actually changes
    if (previousSystemPrefixRef.current === systemPrefix) return;

    if (__DEV__) {
      console.log(`[useEquipmentDetails] System changed from ${previousSystemPrefixRef.current} to ${systemPrefix}`);
    }

    // Update the previous system ref
    previousSystemPrefixRef.current = systemPrefix;

    // Force re-fetch of system data
    setIsLoadingSystemData(true);
    hydratedRef.current = false;

    // Reset system type and backup to force proper rehydration
    setSystemType("");
    setBackupOption("");

    // NOTE: We do NOT clear branch strings here anymore
    // Branch strings are loaded directly from database via fetchFromDb
    // and passed as props to the component - no shared state contamination
  }, [systemPrefix]);

  // Reset top-level flags when switching projects
  useEffect(() => {
    if (!projectID) return;
    // Clear all states when project changes
    setSystemType("");
    setBackupOption("");
    setShowBattery2(false);

    fetchedOnceRef.current = false;
    hydratedRef.current = false;
    setRawSys(null);
  }, [projectID]);

  // Reset section states when switching between micro and inverter systems
  const previousSystemTypeRef = useRef<SystemType>(systemType);
  useEffect(() => {
    const previousType = previousSystemTypeRef.current;
    const currentType = systemType;

    // Only run when systemType actually changes between micro/inverter
    if (previousType === currentType) return;
    if (!previousType || !currentType) {
      previousSystemTypeRef.current = currentType;
      return;
    }

    if (__DEV__) {
      console.log(`[useEquipmentDetails] System type changed from ${previousType} to ${currentType} - clearing section states`);
    }

    // Update the previous system type ref
    previousSystemTypeRef.current = currentType;

    // Reset all section states to clear any leftover data from the previous system type
    // This ensures clean slate when switching micro ↔ inverter
    // Note: Solar panel state is preserved as it's shared between both system types

  }, [systemType]);

  // Utility used for sections that hydrate from rawSys in this hook
  const noFetch = useCallback(async (_: string) => null, []);

  // ---- Section factories -----------------------------------------------------

  // Solar Panels (always enabled)
  const {
    state: solarSection,
    setState: setSolarSection,
    makes: solarMakes,
    models: solarModels,
    loadMakes: solarLoadMakesRaw,
    loadModels: solarLoadModelsRaw,
    loadingMakes: solarLoadingMakes,
    loadingModels: solarLoadingModels,
    loadingData: solarLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: true,
    typeKey: EQUIPMENT_TYPES.SOLAR_PANEL,
    fetchFromDb: async (projectUuid: string) => {
      // Extract solar panel data from rawSys
      const qty = extractDynamicValue(rawSys, 'sys1_solar_panel_qty', systemPrefix);
      const make = extractDynamicValue(rawSys, 'sys1_solar_panel_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_solar_panel_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_solar_panel_existing', systemPrefix);
      const batteryOnly = extractDynamicValue(rawSys, 'sys1_batteryonly', systemPrefix);
      const showSecondPanelType = extractDynamicValue(rawSys, 'sys1_show_second_panel_type', systemPrefix);

      // isacintegrated is now system-specific (sys1_isacintegrated, sys2_isacintegrated, etc.)
      const isAcIntegrated = extractDynamicValue(rawSys, 'sys1_isacintegrated', systemPrefix) ?? false;

      // console.log("🔧 Solar Panel fetchFromDb extracting:", {
      //   qty, make, model, existing, batteryOnly, showSecondPanelType, isAcIntegrated, systemPrefix
      // });

      return {
        quantity: (qty && qty > 0) ? qty.toString() : "",
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        selectedPanelId: undefined, // Panel ID is not stored in DB, will be populated on model selection
        isAcIntegrated: isAcIntegrated, // AC integrated flag from database
        integratedMicroMake: undefined, // Integrated micro make, will be set when panel is selected
        integratedMicroModel: undefined, // Integrated micro model, will be set when AC panel is selected
        isNew: existing === null ? true : !existing,
        isBatteryOnly: !!batteryOnly,
        showSecondPanelType: !!showSecondPanelType,
      };
    },
    mapFetchToState: (data) => data || {
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      selectedPanelId: undefined,
      isAcIntegrated: false,
      integratedMicroMake: undefined,
      integratedMicroModel: undefined,
      isNew: true,
      isBatteryOnly: false,
      showSecondPanelType: false,
    },
    buildPayload: (id, s) => {
      const qtyValue = s.isBatteryOnly ? 0 : (s.quantity && s.quantity.trim() !== "" ? parseInt(s.quantity, 10) : null);
      console.log('[SolarPanel buildPayload] Building payload:', {
        stateQuantity: s.quantity,
        parsedQty: qtyValue,
        isBatteryOnly: s.isBatteryOnly,
        systemPrefix,
      });

      const payload = createDynamicPayload({
        sys1_solarpanel_id: id,
        sys1_solar_panel_existing: !s.isNew,
        // If battery-only, force solar panel fields to null/0
        sys1_solar_panel_qty: qtyValue,
        sys1_solar_panel_make: s.isBatteryOnly ? null : (s.selectedMakeLabel || null),
        sys1_solar_panel_model: s.isBatteryOnly ? null : (s.selectedModelLabel || null),
        sys1_batteryonly: s.isBatteryOnly,
        sys1_show_second_panel_type: s.showSecondPanelType,
        // AC integrated flag - now system-specific (sys1_isacintegrated, sys2_isacintegrated, etc.)
        sys1_isacintegrated: s.isAcIntegrated || false,
      }, systemPrefix);

      console.log('[SolarPanel buildPayload] Final payload:', payload);
      return payload;
    },
  });

  // Solar Panels Type 2 (conditional)
  const {
    state: solarType2Section,
    setState: setSolarType2Section,
    makes: solarType2Makes,
    models: solarType2Models,
    loadMakes: solarType2LoadMakesRaw,
    loadModels: solarType2LoadModelsRaw,
    loadingMakes: solarType2LoadingMakes,
    loadingModels: solarType2LoadingModels,
    loadingData: solarType2LoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: solarSection.showSecondPanelType,
    typeKey: EQUIPMENT_TYPES.SOLAR_PANEL,
    fetchFromDb: async (projectUuid: string) => {
      // Extract solar panel type 2 data from rawSys
      const qty = extractDynamicValue(rawSys, 'sys1_solar_panel_type2_quantity', systemPrefix);
      const manufacturer = extractDynamicValue(rawSys, 'sys1_solar_panel_type2_manufacturer', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_solar_panel_type2_model', systemPrefix);
      const isNew = extractDynamicValue(rawSys, 'sys1_solar_panel_type2_is_new', systemPrefix);

      // console.log("🔧 Solar Panel Type 2 fetchFromDb extracting:", {
      //   qty, manufacturer, model, isNew, systemPrefix
      // });

      return {
        quantity: (qty && qty > 0) ? qty.toString() : "",
        selectedMakeLabel: manufacturer ?? "",
        selectedMakeValue: manufacturer ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        isNew: isNew === null ? true : !!isNew,
      };
    },
    mapFetchToState: (data) => data || {
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      isNew: true,
    },
    buildPayload: (id, s) => createDynamicPayload({
      // Note: Using correct field names to match schema
      sys1_solar_panel_type2_quantity: s.quantity && s.quantity.trim() !== "" ? parseInt(s.quantity, 10) : null,
      sys1_solar_panel_type2_manufacturer: s.selectedMakeLabel || null,
      sys1_solar_panel_type2_model: s.selectedModelLabel || null,
      sys1_solar_panel_type2_is_new: s.isNew,
    }, systemPrefix),
  });

  // Microinverter (micro path)
  const {
    state: microSection,
    setState: setMicroSection,
    makes: microMakes,
    models: microModels,
    loadMakes: microLoadMakesRaw,
    loadModels: microLoadModelsRaw,
    loadingMakes: microLoadingMakes,
    loadingModels: microLoadingModels,
    loadingData: microLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: isMicro,
    typeKey: EQUIPMENT_TYPES.MICROINVERTER,
    fetchFromDb: async (projectUuid: string) => {
      // Extract microinverter data from rawSys
      const qty = extractDynamicValue(rawSys, 'sys1_micro_inverter_qty', systemPrefix);
      const make = extractDynamicValue(rawSys, 'sys1_micro_inverter_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_micro_inverter_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_micro_inverter_existing', systemPrefix);
      const stringingTypeRaw = extractDynamicValue(rawSys, 'sys1_stringing_type', systemPrefix);

      // Extract individual microinverter panel quantities (up to 25 micros)
      const micro1Panels = extractDynamicValue(rawSys, 'sys1_micro1Panels', systemPrefix);
      const micro2Panels = extractDynamicValue(rawSys, 'sys1_micro2Panels', systemPrefix);
      const micro3Panels = extractDynamicValue(rawSys, 'sys1_micro3Panels', systemPrefix);
      const micro4Panels = extractDynamicValue(rawSys, 'sys1_micro4Panels', systemPrefix);
      const micro5Panels = extractDynamicValue(rawSys, 'sys1_micro5Panels', systemPrefix);
      const micro6Panels = extractDynamicValue(rawSys, 'sys1_micro6Panels', systemPrefix);
      const micro7Panels = extractDynamicValue(rawSys, 'sys1_micro7Panels', systemPrefix);
      const micro8Panels = extractDynamicValue(rawSys, 'sys1_micro8Panels', systemPrefix);
      const micro9Panels = extractDynamicValue(rawSys, 'sys1_micro9Panels', systemPrefix);
      const micro10Panels = extractDynamicValue(rawSys, 'sys1_micro10Panels', systemPrefix);
      const micro11Panels = extractDynamicValue(rawSys, 'sys1_micro11Panels', systemPrefix);
      const micro12Panels = extractDynamicValue(rawSys, 'sys1_micro12Panels', systemPrefix);
      const micro13Panels = extractDynamicValue(rawSys, 'sys1_micro13Panels', systemPrefix);
      const micro14Panels = extractDynamicValue(rawSys, 'sys1_micro14Panels', systemPrefix);
      const micro15Panels = extractDynamicValue(rawSys, 'sys1_micro15Panels', systemPrefix);
      const micro16Panels = extractDynamicValue(rawSys, 'sys1_micro16Panels', systemPrefix);
      const micro17Panels = extractDynamicValue(rawSys, 'sys1_micro17Panels', systemPrefix);
      const micro18Panels = extractDynamicValue(rawSys, 'sys1_micro18Panels', systemPrefix);
      const micro19Panels = extractDynamicValue(rawSys, 'sys1_micro19Panels', systemPrefix);
      const micro20Panels = extractDynamicValue(rawSys, 'sys1_micro20Panels', systemPrefix);
      const micro21Panels = extractDynamicValue(rawSys, 'sys1_micro21Panels', systemPrefix);
      const micro22Panels = extractDynamicValue(rawSys, 'sys1_micro22Panels', systemPrefix);
      const micro23Panels = extractDynamicValue(rawSys, 'sys1_micro23Panels', systemPrefix);
      const micro24Panels = extractDynamicValue(rawSys, 'sys1_micro24Panels', systemPrefix);
      const micro25Panels = extractDynamicValue(rawSys, 'sys1_micro25Panels', systemPrefix);

      // console.log("🔧 Microinverter fetchFromDb extracting:", {
      //   qty, make, model, existing, systemPrefix
      // });

      return {
        quantity: (qty && qty > 0) ? qty.toString() : "",
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        isNew: existing === null ? true : !existing,
        stringingType: (stringingTypeRaw as "auto" | "custom" | "") || "auto",
        // Individual microinverter panel quantities (stored as strings, empty string if null/undefined)
        micro1Panels: micro1Panels == null ? "" : String(micro1Panels),
        micro2Panels: micro2Panels == null ? "" : String(micro2Panels),
        micro3Panels: micro3Panels == null ? "" : String(micro3Panels),
        micro4Panels: micro4Panels == null ? "" : String(micro4Panels),
        micro5Panels: micro5Panels == null ? "" : String(micro5Panels),
        micro6Panels: micro6Panels == null ? "" : String(micro6Panels),
        micro7Panels: micro7Panels == null ? "" : String(micro7Panels),
        micro8Panels: micro8Panels == null ? "" : String(micro8Panels),
        micro9Panels: micro9Panels == null ? "" : String(micro9Panels),
        micro10Panels: micro10Panels == null ? "" : String(micro10Panels),
        micro11Panels: micro11Panels == null ? "" : String(micro11Panels),
        micro12Panels: micro12Panels == null ? "" : String(micro12Panels),
        micro13Panels: micro13Panels == null ? "" : String(micro13Panels),
        micro14Panels: micro14Panels == null ? "" : String(micro14Panels),
        micro15Panels: micro15Panels == null ? "" : String(micro15Panels),
        micro16Panels: micro16Panels == null ? "" : String(micro16Panels),
        micro17Panels: micro17Panels == null ? "" : String(micro17Panels),
        micro18Panels: micro18Panels == null ? "" : String(micro18Panels),
        micro19Panels: micro19Panels == null ? "" : String(micro19Panels),
        micro20Panels: micro20Panels == null ? "" : String(micro20Panels),
        micro21Panels: micro21Panels == null ? "" : String(micro21Panels),
        micro22Panels: micro22Panels == null ? "" : String(micro22Panels),
        micro23Panels: micro23Panels == null ? "" : String(micro23Panels),
        micro24Panels: micro24Panels == null ? "" : String(micro24Panels),
        micro25Panels: micro25Panels == null ? "" : String(micro25Panels),
      };
    },
    mapFetchToState: (data) => data || {
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      isNew: true,
      stringingType: "auto",
      // Individual microinverter panel quantities (default to empty strings)
      micro1Panels: "",
      micro2Panels: "",
      micro3Panels: "",
      micro4Panels: "",
      micro5Panels: "",
      micro6Panels: "",
      micro7Panels: "",
      micro8Panels: "",
      micro9Panels: "",
      micro10Panels: "",
      micro11Panels: "",
      micro12Panels: "",
      micro13Panels: "",
      micro14Panels: "",
      micro15Panels: "",
      micro16Panels: "",
      micro17Panels: "",
      micro18Panels: "",
      micro19Panels: "",
      micro20Panels: "",
      micro21Panels: "",
      micro22Panels: "",
      micro23Panels: "",
      micro24Panels: "",
      micro25Panels: "",
    },
    buildPayload: (id, s) => {
      // Convert empty string to null, otherwise parse to number
      const toNullOrNumber = (val: string) => val === "" || val === "0" ? null : (parseInt(val, 10) || null);

      return createDynamicPayload({
        sys1_micro_inverter_id: id,
        sys1_micro_inverter_existing: !s.isNew,
        sys1_micro_inverter_qty: parseInt(s.quantity, 10) || 0,
        sys1_micro_inverter_make: s.selectedMakeLabel,
        sys1_micro_inverter_model: s.selectedModelLabel,
        sys1_stringing_type: s.stringingType || "auto",
        // Individual microinverter panel quantities
        sys1_micro1Panels: toNullOrNumber(s.micro1Panels),
        sys1_micro2Panels: toNullOrNumber(s.micro2Panels),
        sys1_micro3Panels: toNullOrNumber(s.micro3Panels),
        sys1_micro4Panels: toNullOrNumber(s.micro4Panels),
        sys1_micro5Panels: toNullOrNumber(s.micro5Panels),
        sys1_micro6Panels: toNullOrNumber(s.micro6Panels),
        sys1_micro7Panels: toNullOrNumber(s.micro7Panels),
        sys1_micro8Panels: toNullOrNumber(s.micro8Panels),
        sys1_micro9Panels: toNullOrNumber(s.micro9Panels),
        sys1_micro10Panels: toNullOrNumber(s.micro10Panels),
        sys1_micro11Panels: toNullOrNumber(s.micro11Panels),
        sys1_micro12Panels: toNullOrNumber(s.micro12Panels),
        sys1_micro13Panels: toNullOrNumber(s.micro13Panels),
        sys1_micro14Panels: toNullOrNumber(s.micro14Panels),
        sys1_micro15Panels: toNullOrNumber(s.micro15Panels),
        sys1_micro16Panels: toNullOrNumber(s.micro16Panels),
        sys1_micro17Panels: toNullOrNumber(s.micro17Panels),
        sys1_micro18Panels: toNullOrNumber(s.micro18Panels),
        sys1_micro19Panels: toNullOrNumber(s.micro19Panels),
        sys1_micro20Panels: toNullOrNumber(s.micro20Panels),
        sys1_micro21Panels: toNullOrNumber(s.micro21Panels),
        sys1_micro22Panels: toNullOrNumber(s.micro22Panels),
        sys1_micro23Panels: toNullOrNumber(s.micro23Panels),
        sys1_micro24Panels: toNullOrNumber(s.micro24Panels),
        sys1_micro25Panels: toNullOrNumber(s.micro25Panels),
      }, systemPrefix);
    },
  });

  // String Combiner Panel (micro path only)
  const combinerHookResult = useEquipmentSection(projectID, companyUuid, {
    enabled: isMicro,
    typeKey: EQUIPMENT_TYPES.STRING_COMBINER_PANEL,
    fetchFromDb: async (projectUuid: string) => {
      // Extract string combiner panel data from rawSys
      const make = extractDynamicValue(rawSys, 'sys1_combiner_panel_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_combiner_panel_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_combiner_existing', systemPrefix);
      const busRating = extractDynamicValue(rawSys, 'sys1_combinerpanel_bus_rating', systemPrefix);
      const mainBreaker = extractDynamicValue(rawSys, 'sys1_combinerpanel_main_breaker_rating', systemPrefix);

      // Extract custom stringing branch fields (shared with inverter - up to 8 branches)
      const branch1 = extractDynamicValue(rawSys, 'sys1_branch_string_1', systemPrefix);
      const branch2 = extractDynamicValue(rawSys, 'sys1_branch_string_2', systemPrefix);
      const branch3 = extractDynamicValue(rawSys, 'sys1_branch_string_3', systemPrefix);
      const branch4 = extractDynamicValue(rawSys, 'sys1_branch_string_4', systemPrefix);
      const branch5 = extractDynamicValue(rawSys, 'sys1_branch_string_5', systemPrefix);
      const branch6 = extractDynamicValue(rawSys, 'sys1_branch_string_6', systemPrefix);
      const branch7 = extractDynamicValue(rawSys, 'sys1_branch_string_7', systemPrefix);
      const branch8 = extractDynamicValue(rawSys, 'sys1_branch_string_8', systemPrefix);
      const stringingTypeRaw = extractDynamicValue(rawSys, 'sys1_stringing_type', systemPrefix);

      // console.log("🔧 String Combiner Panel fetchFromDb extracting:", {
      //   make, model, existing, busRating, mainBreaker, systemPrefix
      // });

      return {
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        busAmps: busRating ?? "",
        mainBreaker: mainBreaker ?? "",
        isNew: existing === null ? true : !existing,
        // Custom stringing branch fields (stored as strings, empty string if null)
        branchString1: branch1 === null ? "" : String(branch1),
        branchString2: branch2 === null ? "" : String(branch2),
        branchString3: branch3 === null ? "" : String(branch3),
        branchString4: branch4 === null ? "" : String(branch4),
        branchString5: branch5 === null ? "" : String(branch5),
        branchString6: branch6 === null ? "" : String(branch6),
        branchString7: branch7 === null ? "" : String(branch7),
        branchString8: branch8 === null ? "" : String(branch8),
        stringingType: (stringingTypeRaw as "auto" | "custom" | "") || "auto",
      };
    },
    mapFetchToState: (data) => data || {
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      busAmps: "",
      mainBreaker: "",
      isNew: true,
      branchString1: "",
      branchString2: "",
      branchString3: "",
      branchString4: "",
      branchString5: "",
      branchString6: "",
      branchString7: "",
      branchString8: "",
      stringingType: "auto",
    },
    buildPayload: (id, s) => {
      // Convert empty string to null, otherwise parse to number
      const toNullOrNumber = (val: string) => val === "" || val === "0" ? null : (parseInt(val, 10) || null);

      return createDynamicPayload({
        sys1_combinerpanel_id: id,
        sys1_combiner_existing: !s.isNew,
        sys1_combiner_panel_make: s.selectedMakeLabel,
        sys1_combiner_panel_model: s.selectedModelLabel,
        sys1_combinerpanel_bus_rating: s.busAmps,
        sys1_combinerpanel_main_breaker_rating: s.mainBreaker,
        // Custom stringing branch fields (shared with inverter)
        sys1_branch_string_1: toNullOrNumber(s.branchString1),
        sys1_branch_string_2: toNullOrNumber(s.branchString2),
        sys1_branch_string_3: toNullOrNumber(s.branchString3),
        sys1_branch_string_4: toNullOrNumber(s.branchString4),
        sys1_branch_string_5: toNullOrNumber(s.branchString5),
        sys1_branch_string_6: toNullOrNumber(s.branchString6),
        sys1_branch_string_7: toNullOrNumber(s.branchString7),
        sys1_branch_string_8: toNullOrNumber(s.branchString8),
        sys1_stringing_type: s.stringingType || "auto",
      }, systemPrefix);
    },
  });

  // Destructure combiner hook result with logging
  const {
    state: combinerSection,
    setState: setCombinerSection,
    makes: combinerMakes,
    models: combinerModels,
    loadMakes: combinerLoadMakesRaw,
    loadModels: combinerLoadModelsRaw,
    loadingMakes: combinerLoadingMakes,
    loadingModels: combinerLoadingModels,
    loadingData: combinerLoadingData,
  } = combinerHookResult;

  // Log whenever combinerModels changes (only if length actually changed to reduce noise)
  const prevCombinerModelsLength = useRef<number>(0);
  useEffect(() => {
    const newLength = Array.isArray(combinerModels) ? combinerModels.length : 0;
    if (prevCombinerModelsLength.current !== newLength) {
      console.log(`[useEquipmentDetails] 🎯 combinerModels changed: array[${prevCombinerModelsLength.current}] → array[${newLength}]`);
      prevCombinerModelsLength.current = newLength;
    }
  }, [combinerModels]);

  // Inverter (inverter path; shares micro columns)
  const {
    state: inverterSection,
    setState: setInverterSection,
    makes: inverterMakes,
    models: inverterModels,
    loadMakes: inverterLoadMakesRaw,
    loadModels: inverterLoadModelsRaw,
    loadingMakes: inverterLoadingMakes,
    loadingModels: inverterLoadingModels,
    loadingData: inverterLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: isInverter,
    typeKey: EQUIPMENT_TYPES.INVERTER,
    systemPrefix: systemPrefix, // Pass systemPrefix to trigger re-hydration on system switch
    fetchFromDb: async (projectUuid: string) => {
      console.log(`🔧 [INVERTER FETCHFROMDB] Called for systemPrefix: ${systemPrefix}`);

      // Return the hydrated data from rawSys for consistency
      const make = extractDynamicValue(rawSys, 'sys1_micro_inverter_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_micro_inverter_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_micro_inverter_existing', systemPrefix);
      const stringingTypeRaw = extractDynamicValue(rawSys, 'sys1_stringing_type', systemPrefix);

      console.log(`🔧 [INVERTER FETCHFROMDB] ${systemPrefix} loaded stringingTypeRaw:`, stringingTypeRaw);
      const teslaGatewayType = extractDynamicValue(rawSys, 'sys1_teslagatewaytype', systemPrefix);
      const gateway = extractDynamicValue(rawSys, 'sys1_gateway', systemPrefix); // Internal gateway value
      const backupSwitchLocation = extractDynamicValue(rawSys, 'sys1_backupswitch_location', systemPrefix);
      const teslaExtensions = extractDynamicValue(rawSys, 'sys1_tesla_extensions', systemPrefix);
      const batteryExisting = extractDynamicValue(rawSys, 'sys1_battery1_existing', systemPrefix);
      // NOTE: backupOption is managed at top-level hook state, not in inverter section
      // const backupOption = extractDynamicValue(rawSys, 'sys1_backup_option', systemPrefix);
      const combinationMethod = extractDynamicValue(rawSys, 'sys1_combination_method', systemPrefix);

      // Gateway Configuration fields - now load from SMS fields (merged)
      const gatewayConfigActivatePCS = extractDynamicValue(rawSys, 'sys1_pcs_settings', systemPrefix);
      const gatewayConfigIsNew = true; // Gateway is always "new" (not stored in DB)
      const gatewayConfigMainBreaker = extractDynamicValue(rawSys, 'sys1_sms_breaker_rating', systemPrefix);
      const gatewayConfigBackupPanel = extractDynamicValue(rawSys, 'sys1_sms_backup_load_sub_panel_breaker_rating', systemPrefix);
      const gatewayConfigPVBreaker = extractDynamicValue(rawSys, 'sys1_sms_pv_breaker_rating_override', systemPrefix);
      const gatewayConfigESSBreaker = extractDynamicValue(rawSys, 'sys1_sms_ess_breaker_rating_override', systemPrefix);
      const gatewayConfigTieInBreaker = extractDynamicValue(rawSys, 'sys1_sms_tie_in_breaker_rating_override', systemPrefix);
      const hybrid = extractDynamicValue(rawSys, 'sys1_inverter_hybrid', systemPrefix);

      // Read individual branch string fields and detect if custom mode should be enabled
      const branchStringFields: Record<string, string | null> = {};
      let hasAnyBranchData = false;

      for (let i = 1; i <= 8; i++) {
        const branchValue = extractDynamicValue(rawSys, `sys1_branch_string_${i}`, systemPrefix);
        branchStringFields[`branch_string_${i}`] = branchValue;
        if (branchValue) {
          hasAnyBranchData = true;
        }
      }

      console.log(`🔧 [INVERTER FETCHFROMDB] ${systemPrefix} branch fields:`, branchStringFields);
      console.log(`🔧 [INVERTER FETCHFROMDB] ${systemPrefix} hasAnyBranchData:`, hasAnyBranchData);

      // Determine stringing type: use saved type, or auto-detect from branch data
      let detectedStringingType = stringingTypeRaw || "auto";
      if (!stringingTypeRaw && hasAnyBranchData) {
        detectedStringingType = "custom";
        // console.log("🔧 Auto-detected custom stringing from branch data");
      }

      // console.log("🔧 PowerWall DB field extraction:", {
      //   teslaGatewayType,
      //   gateway,
      //   backupSwitchLocation,
      //   teslaExtensions,
      //   batteryExisting,
      //   backupOption,
      //   combinationMethod,
      //   rawSysKeys: Object.keys(rawSys || {}).filter(k => k.includes('gateway') || k.includes('tesla') || k.includes('backup') || k.includes('combination'))
      // });

      // No more complex stringingConfiguration object - just use individual fields

      // console.log("🔧 Inverter fetchFromDb extracting:", {
      //   makeField: 'sys1_micro_inverter_make',
      //   modelField: 'sys1_micro_inverter_model',
      //   stringingField: 'sys1_inverter_stringing_configuration',
      //   teslaGatewayField: 'sys1_teslagatewaytype',
      //   teslaExtensionsField: 'sys1_tesla_extensions',
      //   make,
      //   model,
      //   existing,
      //   stringingConfigRaw,
      //   stringingConfiguration,
      //   teslaGatewayType,
      //   teslaExtensions,
      //   systemPrefix,
      //   rawSysKeys: Object.keys(rawSys || {}).filter(k => k.includes('inverter'))
      // });

      return rawSys ? {
        make,
        model,
        existing,
        stringingType: detectedStringingType,
        branchStringFields,
        teslaGatewayType,
        gateway,
        backupSwitchLocation,
        teslaExtensions,
        batteryExisting,
        combinationMethod,
        gatewayConfigActivatePCS,
        gatewayConfigIsNew,
        gatewayConfigMainBreaker,
        gatewayConfigBackupPanel,
        gatewayConfigPVBreaker,
        gatewayConfigESSBreaker,
        gatewayConfigTieInBreaker,
        hybrid,
      } : null;
    },
    mapFetchToState: (db: any) => {
      console.log("🔧 Inverter mapFetchToState input:", db);
      const result = {
        selectedMake: db?.make ?? "",
        selectedMakeLabel: db?.make ?? "",
        selectedMakeValue: db?.make ?? "",
        selectedModel: db?.model ?? "",
        selectedModelLabel: db?.model ?? "",
        selectedModelValue: db?.model ?? "",
        isNew: db?.existing ? !db.existing : true,
        stringingType: db?.stringingType ?? "auto", // System-specific stringing type
        teslaGatewayType: db?.teslaGatewayType ?? "",
        gateway: (() => {
          // Reverse map teslaGatewayType text back to internal gateway value
          const gatewayTextToValueMap: Record<string, string> = {
            "Backup Gateway 2": "backup_gateway_2",
            "Gateway 3": "gateway_3",
            "Backup Switch": "backup_switch",
          };
          return gatewayTextToValueMap[db?.teslaGatewayType] || db?.gateway || "";
        })(), // Internal gateway value for UI logic
        backupSwitchLocation: db?.backupSwitchLocation ?? "",
        expansionPacks: parseInt(db?.teslaExtensions) || 0, // Map tesla_extensions to expansionPacks (ensure number)
        batteryExisting: db?.batteryExisting ?? false, // Map battery1_existing to batteryExisting
        // NOTE: backupOption removed - managed at top-level hook state to prevent hydration overwrites
        combinationMethod: db?.combinationMethod ?? "", // Map combination_method for internal tracking
        // Gateway Configuration fields
        gatewayConfigActivatePCS: db?.gatewayConfigActivatePCS ?? false,
        gatewayConfigIsNew: db?.gatewayConfigIsNew ?? true,
        gatewayConfigMainBreaker: db?.gatewayConfigMainBreaker ?? "mlo",
        gatewayConfigBackupPanel: db?.gatewayConfigBackupPanel ?? "mlo",
        gatewayConfigPVBreaker: db?.gatewayConfigPVBreaker ?? "",
        gatewayConfigESSBreaker: db?.gatewayConfigESSBreaker ?? "",
        gatewayConfigTieInBreaker: db?.gatewayConfigTieInBreaker ?? "",
        hybrid: db?.hybrid ?? "",
        // Individual branch string fields (simple integers)
        branchString1: db?.branchStringFields?.branch_string_1 ?? "",
        branchString2: db?.branchStringFields?.branch_string_2 ?? "",
        branchString3: db?.branchStringFields?.branch_string_3 ?? "",
        branchString4: db?.branchStringFields?.branch_string_4 ?? "",
        branchString5: db?.branchStringFields?.branch_string_5 ?? "",
        branchString6: db?.branchStringFields?.branch_string_6 ?? "",
      };
      // console.log("🔧 Inverter mapFetchToState output:", result);
      // console.log("🔧 PowerWall specific fields:", {
      //   expansionPacks: result.expansionPacks,
      //   batteryExisting: result.batteryExisting,
      //   teslaGatewayType: result.teslaGatewayType,
      //   gateway: result.gateway,
      //   backupSwitchLocation: result.backupSwitchLocation,
      //   backupOption: result.backupOption,
      //   combinationMethod: result.combinationMethod,
      //   gatewayReverseMapping: result.teslaGatewayType + " → " + result.gateway
      // });
      return result;
    },
    buildPayload: (id, s) => {
      console.log("🔧 [INVERTER BUILDPAYLOAD DEBUG] Called with:", {
        systemPrefix,
        stateStringingType: s.stringingType,
        stateStringingConfig: s.stringingConfiguration,
        stateMake: s.selectedMake,
        stateModel: s.selectedModel
      });

      // Individual branch string fields - simple field-to-field mapping (like solar panel qty)
      // Keep empty strings as empty strings, only convert undefined to null
      const branchStringPayload: Record<string, string | null> = {
        [mapFieldName('sys1_branch_string_1', systemPrefix)]: s.branchString1 !== undefined ? s.branchString1 : null,
        [mapFieldName('sys1_branch_string_2', systemPrefix)]: s.branchString2 !== undefined ? s.branchString2 : null,
        [mapFieldName('sys1_branch_string_3', systemPrefix)]: s.branchString3 !== undefined ? s.branchString3 : null,
        [mapFieldName('sys1_branch_string_4', systemPrefix)]: s.branchString4 !== undefined ? s.branchString4 : null,
        [mapFieldName('sys1_branch_string_5', systemPrefix)]: s.branchString5 !== undefined ? s.branchString5 : null,
        [mapFieldName('sys1_branch_string_6', systemPrefix)]: s.branchString6 !== undefined ? s.branchString6 : null,
      };

      const payload = {
        sys1_micro_inverter_id: id,
        sys1_micro_inverter_existing: !s.isNew, // shares micro cols
        sys1_micro_inverter_qty: 1, // Always set to 1 for inverter
        sys1_micro_inverter_make: s.selectedMakeLabel || s.selectedMake,
        sys1_micro_inverter_model: s.selectedModelLabel || s.selectedModel,
        sys1_inverter_hybrid: s.hybrid || null, // Save hybrid field
        sys1_stringing_type: s.stringingType || "auto", // Save the button selection (system-specific)
        sys1_teslagatewaytype: s.teslaGatewayType || null,
        sys1_gateway: s.gateway || null, // Internal gateway value
        sys1_backupswitch_location: s.backupSwitchLocation || null,
        sys1_tesla_extensions: parseInt(s.expansionPacks) || 0,
        sys1_battery_1_qty: (() => {
          // ONLY set battery_1_qty for Tesla PowerWall (integrated battery inverter)
          // For all other inverters, return null to avoid false battery detection
          const make = s.selectedMakeLabel || s.selectedMake || "";
          const model = s.selectedModelLabel || s.selectedModel || "";
          const isHybrid = s.hybrid === "Yes";
          const isTesla = make.toLowerCase().includes('tesla');
          const modelLower = model.toLowerCase();
          const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3');
          const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +');

          // Only set quantity for Tesla PowerWall (battery-integrated inverter)
          if (isHybrid && isTesla && (isPowerWall3 || isPowerWallPlus)) {
            return (parseInt(s.expansionPacks) || 0) + 1; // expansion packs + 1 base battery
          }
          return null; // For non-PowerWall inverters, don't set battery quantity
        })(),
        sys1_battery_1_make: (() => {
          // Check if the selected inverter is a hybrid with integrated battery
          const make = s.selectedMakeLabel || s.selectedMake || "";
          const model = s.selectedModelLabel || s.selectedModel || "";
          const isHybrid = s.hybrid === "Yes";
          const isTesla = make.toLowerCase().includes('tesla');
          const modelLower = model.toLowerCase();
          const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3');
          const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +');

          // Set battery make for hybrid inverters with integrated batteries
          if (isHybrid && isTesla && (isPowerWall3 || isPowerWallPlus)) {
            return "Tesla";
          }
          return null;
        })(),
        sys1_battery_1_model: (() => {
          // Check if the selected inverter is a hybrid with integrated battery
          const make = s.selectedMakeLabel || s.selectedMake || "";
          const model = s.selectedModelLabel || s.selectedModel || "";
          const isHybrid = s.hybrid === "Yes";
          const isTesla = make.toLowerCase().includes('tesla');
          const modelLower = model.toLowerCase();
          const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3');
          const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +');

          // Set battery model for hybrid inverters with integrated batteries
          if (isHybrid && isTesla && (isPowerWall3 || isPowerWallPlus)) {
            return "PowerWall 3";
          }
          return null;
        })(),
        sys1_battery1_existing: s.batteryExisting || false,
        // NOTE: sys1_backup_option is managed separately by debouncedSaveBackupOption
        // Don't include it here or it will overwrite with null when inverter saves
        ...branchStringPayload, // Add all branch string fields
      };
      console.log("🔧 Inverter buildPayload:", {
        inputState: s,
        makeValue: s.selectedMakeLabel || s.selectedMake,
        modelValue: s.selectedModelLabel || s.selectedModel,
        stringingConfig: s.stringingConfiguration,
        teslaGatewayType: s.teslaGatewayType,
        expansionPacks: s.expansionPacks,
        isPowerWall3Detection: {
          make: s.selectedMakeLabel || s.selectedMake || "",
          model: s.selectedModelLabel || s.selectedModel || "",
          isTesla: (s.selectedMakeLabel || s.selectedMake || "").toLowerCase().includes('tesla'),
          isPowerWall3: ((s.selectedModelLabel || s.selectedModel || "").toLowerCase().includes('powerwall 3') ||
                        (s.selectedModelLabel || s.selectedModel || "").toLowerCase().includes('powerwall3') ||
                        (s.selectedModelLabel || s.selectedModel || "").toLowerCase().startsWith('powerwall 3')),
          isPowerWallPlus: ((s.selectedModelLabel || s.selectedModel || "").toLowerCase().includes('powerwall+') ||
                           (s.selectedModelLabel || s.selectedModel || "").toLowerCase().includes('powerwall +')),
          batteryMake: payload.sys1_battery_1_make,
          batteryModel: payload.sys1_battery_1_model
        },
        payload
      });
      return createDynamicPayload(payload, systemPrefix);
    },
  });

  // NOTE: stringingType is now managed within inverterSection state (system-specific)
  // It is loaded in the fetchFromDb function above (line 564 and line 676)


  // Optimizer (inverter path)
  const {
    state: optimizerSection,
    setState: setOptimizerSection,
    makes: optimizerMakes,
    models: optimizerModels,
    loadMakes: optimizerLoadMakesRaw,
    loadModels: optimizerLoadModelsRaw,
    loadingMakes: optimizerLoadingMakes,
    loadingModels: optimizerLoadingModels,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: isInverter,
    typeKey: EQUIPMENT_TYPES.INVERTER_OPTIMIZER,
    fetchFromDb: async (projectUuid: string) => {
      // Return the hydrated data from rawSys for consistency
      return rawSys ? {
        make: extractDynamicValue(rawSys, 'sys1_optimizer_make', systemPrefix),
        model: extractDynamicValue(rawSys, 'sys1_optimizer_model', systemPrefix),
        existing: extractDynamicValue(rawSys, 'sys1_optimizer_existing', systemPrefix)
      } : null;
    },
    mapFetchToState: (db: any) => ({
      selectedMake: db?.make ?? "",
      selectedMakeLabel: db?.make ?? "",
      selectedMakeValue: db?.make ?? "",
      selectedModel: db?.model ?? "",
      selectedModelLabel: db?.model ?? "",
      selectedModelValue: db?.model ?? "",
      isNew: db?.existing ? !db.existing : true,
    }),
    buildPayload: (id, s) => {
      const payload = createDynamicPayload({
        sys1_optimizer_id: id,
        sys1_optimizer_existing: !s.isNew,
        sys1_optimizer_make: s.selectedMakeLabel || s.selectedMake,
        sys1_optimizer_model: s.selectedModelLabel || s.selectedModel,
      }, systemPrefix);
      console.log("[Optimizer] buildPayload called:", { id, state: s, payload });
      return payload;
    },
  });

  // ESS (helper/combiner card if you show one)
  const {
    state: essSection,
    setState: setEssSection,
    makes: essMakes,
    models: essModels,
    loadMakes: essLoadMakesRaw,
    loadModels: essLoadModelsRaw,
    loadingMakes: essLoadingMakes,
    loadingModels: essLoadingModels,
    loadingData: essLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: essCombinerEnabled,
    typeKey: EQUIPMENT_TYPES.SMS,
    fetchFromDb: async (projectUuid: string) => {
      // Extract ESS data from rawSys
      const make = extractDynamicValue(rawSys, 'sys1_ess_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_ess_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_ess_existing', systemPrefix);
      const mainBreaker = extractDynamicValue(rawSys, 'sys1_ess_main_breaker_rating', systemPrefix);
      const upstreamBreaker = extractDynamicValue(rawSys, 'sys1_ess_upstream_breaker_rating', systemPrefix);
      const upstreamLocation = extractDynamicValue(rawSys, 'sys1_ess_upstream_breaker_location', systemPrefix);

      // console.log("🔧 ESS fetchFromDb extracting:", {
      //   make, model, existing, mainBreaker, upstreamBreaker, upstreamLocation, systemPrefix
      // });

      return {
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        mainBreaker: mainBreaker ?? "",
        upstreamBreaker: upstreamBreaker ?? "",
        upstreamLocation: upstreamLocation ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      mainBreaker: "",
      upstreamBreaker: "",
      upstreamLocation: "",
      isNew: true,
    },
    buildPayload: (id, s) => createDynamicPayload({
      sys1_ess_id: id,
      sys1_ess_existing: !s.isNew,
      sys1_ess_make: s.selectedMakeLabel,
      sys1_ess_model: s.selectedModelLabel,
      sys1_ess_main_breaker_rating: s.mainBreaker,
      sys1_ess_upstream_breaker_rating: s.upstreamBreaker,
      sys1_ess_upstream_breaker_location: s.upstreamLocation,
    }, systemPrefix),
  });

  // Battery Combiner Panel (BCP1) - shown when battery qty > 1 or multiple battery types
  const {
    state: batteryCombinerPanelSection,
    setState: setBatteryCombinerPanelSection,
    makes: bcpMakes,
    models: bcpModels,
    loadMakes: bcpLoadMakesRaw,
    loadModels: bcpLoadModelsRaw,
    loadingMakes: bcpLoadingMakes,
    loadingModels: bcpLoadingModels,
    loadingData: bcpLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: true, // Always enabled so it can be conditionally shown
    typeKey: EQUIPMENT_TYPES.STRING_COMBINER_PANEL, // Use same type as string combiner for equipment catalog
    fetchFromDb: async (projectUuid: string) => {
      // Extract Battery Combiner Panel data from rawSys
      // System 1 uses sys1_ess_* fields (same as ESS section)
      // System 2+ uses sys{N}_battery_combiner_panel_* pattern
      let make, model, existing, busBar, mainBreaker, tieInBreaker;

      if (sysNum === '1') {
        make = extractDynamicValue(rawSys, 'sys1_ess_make', systemPrefix);
        model = extractDynamicValue(rawSys, 'sys1_ess_model', systemPrefix);
        existing = extractDynamicValue(rawSys, 'sys1_ess_existing', systemPrefix);
        busBar = extractDynamicValue(rawSys, 'sys1_ess_upstream_breaker_rating', systemPrefix);
        mainBreaker = extractDynamicValue(rawSys, 'sys1_ess_main_breaker_rating', systemPrefix);
        tieInBreaker = null; // System 1 doesn't have tie-in breaker field for ESS
      } else if (sysNum === '2') {
        make = extractDynamicValue(rawSys, 'sys2_battery_combiner_panel_make', systemPrefix);
        model = extractDynamicValue(rawSys, 'sys2_battery_combiner_panel_model', systemPrefix);
        existing = null; // System 2 doesn't have existing field
        busBar = extractDynamicValue(rawSys, 'sys2_batterycombinerpanel_bus_rating', systemPrefix);
        mainBreaker = extractDynamicValue(rawSys, 'sys2_batterycombinerpanel_mcb_rating', systemPrefix);
        tieInBreaker = extractDynamicValue(rawSys, 'sys2_batterycombinerpanel_tie_in_breaker_rating', systemPrefix);
      } else {
        // System 3, 4 follow System 2 pattern
        make = extractDynamicValue(rawSys, `sys${sysNum}_battery_combiner_panel_make`, systemPrefix);
        model = extractDynamicValue(rawSys, `sys${sysNum}_battery_combiner_panel_model`, systemPrefix);
        existing = null;
        busBar = extractDynamicValue(rawSys, `sys${sysNum}_batterycombinerpanel_bus_rating`, systemPrefix);
        mainBreaker = extractDynamicValue(rawSys, `sys${sysNum}_batterycombinerpanel_mcb_rating`, systemPrefix);
        tieInBreaker = extractDynamicValue(rawSys, `sys${sysNum}_batterycombinerpanel_tie_in_breaker_rating`, systemPrefix);
      }

      console.log("🔧 Battery Combiner Panel fetchFromDb extracting:", {
        make, model, existing, busBar, mainBreaker, tieInBreaker, systemPrefix, sysNum
      });

      return {
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        busBar: busBar ?? "",
        mainBreaker: mainBreaker ?? "",
        tieInBreaker: tieInBreaker ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      busBar: "",
      mainBreaker: "",
      tieInBreaker: "",
      isNew: true,
    },
    buildPayload: (id, s) => {
      // System-specific payload construction
      if (sysNum === '1') {
        return createDynamicPayload({
          sys1_ess_id: id,
          sys1_ess_existing: !s.isNew,
          sys1_ess_make: s.selectedMakeLabel,
          sys1_ess_model: s.selectedModelLabel,
          sys1_ess_upstream_breaker_rating: s.busBar,
          sys1_ess_main_breaker_rating: s.mainBreaker,
          // Note: System 1 doesn't have tie-in breaker field in sys1_ess_* schema
        }, systemPrefix);
      } else if (sysNum === '2') {
        return createDynamicPayload({
          sys2_battery_combiner_panel_make: s.selectedMakeLabel,
          sys2_battery_combiner_panel_model: s.selectedModelLabel,
          sys2_batterycombinerpanel_bus_rating: s.busBar,
          sys2_batterycombinerpanel_mcb_rating: s.mainBreaker,
          sys2_batterycombinerpanel_tie_in_breaker_rating: s.tieInBreaker,
        }, systemPrefix);
      } else {
        // System 3, 4 follow System 2 pattern
        return createDynamicPayload({
          [`sys${sysNum}_battery_combiner_panel_make`]: s.selectedMakeLabel,
          [`sys${sysNum}_battery_combiner_panel_model`]: s.selectedModelLabel,
          [`sys${sysNum}_batterycombinerpanel_bus_rating`]: s.busBar,
          [`sys${sysNum}_batterycombinerpanel_mcb_rating`]: s.mainBreaker,
          [`sys${sysNum}_batterycombinerpanel_tie_in_breaker_rating`]: s.tieInBreaker,
        }, systemPrefix);
      }
    },
  });

  // Battery 1 (after backup choice)
  const {
    state: battery1Section,
    setState: setBattery1Section,
    makes: batteryMakes,
    models: batteryModels,
    loadMakes: batteryLoadMakesRaw,
    loadModels: batteryLoadModelsRaw,
    loadingMakes: batteryLoadingMakes,
    loadingModels: batteryLoadingModels,
    loadingData: batteryLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: hasBackupChoice,
    typeKey: EQUIPMENT_TYPES.BATTERY_STORAGE,
    fetchFromDb: async (projectUuid: string) => {
      // Extract Battery 1 data from rawSys
      const qty = extractDynamicValue(rawSys, 'sys1_battery_1_qty', systemPrefix);
      const make = extractDynamicValue(rawSys, 'sys1_battery_1_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_battery_1_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_battery1_existing', systemPrefix);
      const combinationMethod = extractDynamicValue(rawSys, 'sys1_combination_method', systemPrefix);
      const tieInLocation = extractDynamicValue(rawSys, 'sys1_battery1_tie_in_location', systemPrefix);
      const coupleType = extractDynamicValue(rawSys, 'sys1_battery_1_couple_type', systemPrefix);

      console.log("🔧 Battery 1 fetchFromDb extracting:", {
        qty, make, model, existing, combinationMethod, tieInLocation, coupleType, systemPrefix
      });

      return {
        quantity: (qty && qty > 0) ? qty.toString() : "",
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        configuration: combinationMethod ?? "",
        tieInLocation: tieInLocation ?? "",
        coupleType: coupleType ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      configuration: "",
      tieInLocation: "",
      coupleType: "",
      isNew: true,
    },
    buildPayload: (id, s) => createDynamicPayload({
      sys1_battery1_id: id,
      sys1_battery1_existing: !s.isNew,
      sys1_battery_1_qty: (s.quantity && parseInt(s.quantity, 10)) || null,
      sys1_battery_1_make: s.selectedMakeLabel || null,
      sys1_battery_1_model: s.selectedModelLabel || null,
      sys1_battery_1_couple_type: s.coupleType || null,
      sys1_combination_method: s.configuration || null,
      sys1_battery1_tie_in_location: s.tieInLocation || null,
    }, systemPrefix),
  });

  // Battery 2 (only when added)
  const {
    state: battery2Section,
    setState: setBattery2Section,
    makes: battery2Makes,
    models: battery2Models,
    loadMakes: battery2LoadMakesRaw,
    loadModels: battery2LoadModelsRaw,
    loadingMakes: battery2LoadingMakes,
    loadingModels: battery2LoadingModels,
    loadingData: battery2LoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: battery2Enabled,
    typeKey: EQUIPMENT_TYPES.BATTERY_STORAGE,
    fetchFromDb: async (projectUuid: string) => {
      // Extract Battery 2 data from rawSys
      const qty = extractDynamicValue(rawSys, 'sys1_battery_2_qty', systemPrefix);
      const make = extractDynamicValue(rawSys, 'sys1_battery_2_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_battery_2_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_battery2_existing', systemPrefix);
      const tieInLocation = extractDynamicValue(rawSys, 'sys1_battery2_tie_in_location', systemPrefix);

      // console.log("🔧 Battery 2 fetchFromDb extracting:", {
      //   qty, make, model, existing, tieInLocation, systemPrefix
      // });

      return {
        quantity: (qty && qty > 0) ? qty.toString() : "",
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        configuration: "",
        tieInLocation: tieInLocation ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      configuration: "",
      tieInLocation: "",
      isNew: true,
    },
    buildPayload: (id, s) => createDynamicPayload({
      sys1_battery2_id: id,
      sys1_battery2_existing: !s.isNew,
      sys1_battery_2_qty: parseInt(s.quantity, 10) || null,
      sys1_battery_2_make: s.selectedMakeLabel,
      sys1_battery_2_model: s.selectedModelLabel,
      sys1_battery2_tie_in_location: s.tieInLocation || null,
    }, systemPrefix),
  });

  // SMS (panel) — when whole/partial backup is chosen
  const {
    state: smsSection,
    setState: setSmsSection,
    makes: smsMakes,
    models: smsModels,
    loadMakes: smsLoadMakesRaw,
    loadModels: smsLoadModelsRaw,
    loadingMakes: smsLoadingMakes,
    loadingModels: smsLoadingModels,
    loadingData: smsLoadingData,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: smsEnabled,
    typeKey: EQUIPMENT_TYPES.SMS,
    fetchFromDb: async (projectUuid: string) => {
      // Extract SMS data from rawSys
      const make = extractDynamicValue(rawSys, 'sys1_sms_make', systemPrefix);
      const model = extractDynamicValue(rawSys, 'sys1_sms_model', systemPrefix);
      const existing = extractDynamicValue(rawSys, 'sys1_sms_existing', systemPrefix);
      const rsdEnabled = extractDynamicValue(rawSys, 'sys1_sms_rsd_enabled', systemPrefix);
      const breakerRating = extractDynamicValue(rawSys, 'sys1_sms_breaker_rating', systemPrefix);
      const pvBreakerOverride = extractDynamicValue(rawSys, 'sys1_sms_pv_breaker_rating_override', systemPrefix);
      const essBreakerOverride = extractDynamicValue(rawSys, 'sys1_sms_ess_breaker_rating_override', systemPrefix);
      const tieInBreakerOverride = extractDynamicValue(rawSys, 'sys1_sms_tie_in_breaker_rating_override', systemPrefix);

      // console.log("🔧 SMS fetchFromDb extracting:", {
      //   make, model, existing, rsdEnabled, breakerRating,
      //   pvBreakerOverride, essBreakerOverride, tieInBreakerOverride, systemPrefix
      // });

      return {
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        hasRSD: !!rsdEnabled,
        selectedMainBreaker: breakerRating ?? "MLO",
        selectedPVBreaker: pvBreakerOverride ?? "",
        selectedESSBreaker: essBreakerOverride ?? "",
        selectedTieInBreaker: tieInBreakerOverride ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      isNew: true,
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      hasRSD: false,
      selectedMainBreaker: "MLO",
      selectedPVBreaker: "",
      selectedESSBreaker: "",
      selectedTieInBreaker: "",
    },
    buildPayload: (id, s) => createDynamicPayload({
      sys1_sms_id: id,
      sys1_sms_existing: !s.isNew,
      sys1_sms_make: s.selectedMakeLabel,
      sys1_sms_model: s.selectedModelLabel,

      sys1_sms_rsd_enabled: !!s.hasRSD,

      sys1_sms_breaker_rating: s.selectedMainBreaker,

      sys1_sms_pv_breaker_rating_override: s.selectedPVBreaker ?? null,
      sys1_sms_ess_breaker_rating_override: s.selectedESSBreaker ?? null,
      sys1_sms_tie_in_breaker_rating_override: s.selectedTieInBreaker ?? null,
    }, systemPrefix),
  });

  // Backup Load Subpanel (partial only)
  const {
    state: backupSection,
    setState: setBackupSection,
    makes: backupMakes,
    models: backupModels,
    loadMakes: backupLoadMakesRaw,
    loadModels: backupLoadModelsRaw,
    loadingMakes: backupLoadingMakes,
    loadingModels: backupLoadingModels,
  } = useEquipmentSection(projectID, companyUuid, {
    enabled: backupSubpanelEnabled,
    typeKey: EQUIPMENT_TYPES.LOAD_CENTER,
    fetchFromDb: async (projectUuid: string) => {
      // Extract backup subpanel data from rawSys
      // System 1 uses bls1_ prefix, System 2 uses sys2_ prefix
      // Systems 3 & 4 don't have backup load sub panel fields in DB
      const sysNum = systemPrefix.replace('sys', '').replace('_', ''); // "sys1_" -> "1"

      let make, model, busRating, mainBreakerRating, tieInBreakerRating, existing;

      if (sysNum === '1') {
        // System 1 uses bls1_ prefix
        const prefix = 'bls1';
        make = rawSys?.[`${prefix}_backup_load_sub_panel_make`];
        model = rawSys?.[`${prefix}_backup_load_sub_panel_model`];
        busRating = rawSys?.[`${prefix}_backuploader_bus_bar_rating`];
        mainBreakerRating = rawSys?.[`${prefix}_backuploader_main_breaker_rating`];
        tieInBreakerRating = rawSys?.[`${prefix}_backuploader_upstream_breaker_rating`];
        existing = rawSys?.[`${prefix}_backuploader_existing`];

        console.log(`🔧 [Backup Load Sub Panel] fetchFromDb reading from rawSys:`, {
          rawSysExists: !!rawSys,
          make,
          model,
          busRating,
          mainBreakerRating,
          tieInBreakerRating,
          existing,
          systemPrefix,
        });
      } else if (sysNum === '2') {
        // System 2 uses sys2_ prefix with different field names
        const prefix = 'sys2';
        make = rawSys[`${prefix}_backup_load_sub_panel_make`];
        model = rawSys[`${prefix}_backup_load_sub_panel_model`];
        busRating = rawSys[`${prefix}_backuploadsubpanel_bus_rating`];
        mainBreakerRating = rawSys[`${prefix}_backuploadpanel_mcb_rating`];
        tieInBreakerRating = rawSys[`${prefix}_backuploadsubpanel_tie_in_breaker_rating`];
        existing = rawSys[`${prefix}_backuploadsubpanel_bus_new_existing`];
      } else {
        // Systems 3 & 4 don't have these fields in the database
        // Return empty values
        make = null;
        model = null;
        busRating = null;
        mainBreakerRating = null;
        tieInBreakerRating = null;
        existing = null;
      }

      return {
        selectedMakeLabel: make ?? "",
        selectedMakeValue: make ?? "",
        selectedModelLabel: model ?? "",
        selectedModelValue: model ?? "",
        busAmps: busRating ?? "",
        mainBreaker: mainBreakerRating ?? "",
        tieInBreaker: tieInBreakerRating ?? "",
        isNew: existing === null ? true : !existing,
      };
    },
    mapFetchToState: (data) => data || {
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      busAmps: "",
      mainBreaker: "",
      tieInBreaker: "",
      isNew: true,
    },
    buildPayload: (id, s) => {
      // System 1 uses bls1_ prefix, System 2 uses sys2_ prefix
      // Systems 3 & 4 don't have backup load sub panel fields in DB
      const sysNum = systemPrefix.replace('sys', '').replace('_', ''); // "sys1_" -> "1"

      if (sysNum === '1') {
        // System 1 uses bls1_ prefix
        const prefix = 'bls1';
        return {
          [`${prefix}_backupload_sub_panel_id`]: id,
          [`${prefix}_backuploader_existing`]: !s.isNew,
          [`${prefix}_backup_load_sub_panel_make`]: s.selectedMakeLabel,
          [`${prefix}_backup_load_sub_panel_model`]: s.selectedModelLabel,
          [`${prefix}_backuploader_bus_bar_rating`]: s.busAmps,
          [`${prefix}_backuploader_main_breaker_rating`]: s.mainBreaker,
          [`${prefix}_backuploader_upstream_breaker_rating`]: s.tieInBreaker ?? null,
        };
      } else if (sysNum === '2') {
        // System 2 uses sys2_ prefix with different field names
        const prefix = 'sys2';
        return {
          [`${prefix}_backuploadsubpanel_id`]: id,
          [`${prefix}_backuploadsubpanel_bus_new_existing`]: !s.isNew,
          [`${prefix}_backup_load_sub_panel_make`]: s.selectedMakeLabel,
          [`${prefix}_backup_load_sub_panel_model`]: s.selectedModelLabel,
          [`${prefix}_backuploadsubpanel_bus_rating`]: s.busAmps,
          [`${prefix}_backuploadpanel_mcb_rating`]: s.mainBreaker,
          [`${prefix}_backuploadsubpanel_tie_in_breaker_rating`]: s.tieInBreaker ?? null,
        };
      } else {
        // Systems 3 & 4 don't have these fields - return empty object
        return {};
      }
    },
  });

  // ---- HYDRATION from system_details ----------------------------------------
  const hydratedRef = useRef(false);

  // Map DB battery config string -> local dropdown token
  const toLocalBatteryConfig = (
    v: string
  ): "" | "daisy_chain" | "combiner_panel" =>
    v === "Daisy Chain"
      ? "daisy_chain"
      : v === "Battery Combiner Panel"
      ? "combiner_panel"
      : "";

  useEffect(() => {
    // Always hydrate when system changes
    if (!fetchedOnceRef.current) return;
    if (!rawSys) return;
    
    if (__DEV__) {
      console.log(`[useEquipmentDetails] Hydrating data for ${systemPrefix}`);
    }
    
    setIsLoadingSystemData(true);

    // System type & backup option - use dynamic fields
    const systemTypeValue = extractDynamicValue(rawSys, 'sys1_selectedsystem', systemPrefix);
    const backupOptionValue = extractDynamicValue(rawSys, 'sys1_backup_option', systemPrefix);

    setSystemType((systemTypeValue === "microinverter" || systemTypeValue === "inverter") ? systemTypeValue : "");

    // Handle both old and new backup option formats
    const normalizedBackupOption = (() => {
      if (backupOptionValue === "whole" || backupOptionValue === "Whole Home") return "Whole Home";
      if (backupOptionValue === "partial" || backupOptionValue === "Partial Home") return "Partial Home";
      if (backupOptionValue === "none" || backupOptionValue === "No Backup") return "No Backup";
      return "";
    })();

    // Only hydrate backup option if it wasn't manually set recently (within 2 seconds)
    // This prevents hydration from overwriting a user selection that's still being saved
    const timeSinceLastSet = Date.now() - backupOptionSetTimeRef.current;
    console.log('[BACKUP OPTION HYDRATION] Checking if should hydrate:', {
      currentTime: Date.now(),
      lastSetTime: backupOptionSetTimeRef.current,
      timeSinceLastSet,
      threshold: 2000,
      willHydrate: timeSinceLastSet > 2000,
      dbValue: backupOptionValue,
      normalizedValue: normalizedBackupOption
    });
    if (timeSinceLastSet > 2000) {
      console.log('[BACKUP OPTION HYDRATION] Hydrating backup option from database:', normalizedBackupOption);
      setBackupOption(normalizedBackupOption);
    } else {
      console.log('[BACKUP OPTION HYDRATION] Skipping hydration - recently set by user', { timeSinceLastSet });
    }

    // Utility Service Amperage
    if (rawSys?.utility_service_amps) {
      setUtilityServiceAmps(rawSys.utility_service_amps);
    }

    // Solar
    setSolarSection({
      quantity: extractDynamicValue(rawSys, 'sys1_solar_panel_qty', systemPrefix)?.toString?.() ?? "",
      selectedMakeLabel: extractDynamicValue(rawSys, 'sys1_solar_panel_make', systemPrefix) ?? "",
      selectedMakeValue: extractDynamicValue(rawSys, 'sys1_solar_panel_make', systemPrefix) ?? "",
      selectedModelLabel: extractDynamicValue(rawSys, 'sys1_solar_panel_model', systemPrefix) ?? "",
      selectedModelValue: extractDynamicValue(rawSys, 'sys1_solar_panel_model', systemPrefix) ?? "",
      isNew: !extractDynamicValue(rawSys, 'sys1_solarpanel_existing', systemPrefix),
      isBatteryOnly: extractDynamicValue(rawSys, 'sys1_batteryonly', systemPrefix) ?? false,
      showSecondPanelType: extractDynamicValue(rawSys, 'sys1_show_second_panel_type', systemPrefix) ?? false,
    });

    // Micro
    const microMake = extractDynamicValue(rawSys, 'sys1_micro_inverter_make', systemPrefix);
    const microModel = extractDynamicValue(rawSys, 'sys1_micro_inverter_model', systemPrefix);
    // console.log("✅ Micro (WORKING) hydration data:", {
    //   field: 'sys1_micro_inverter_make',
    //   value: microMake,
    //   model: microModel,
    //   systemPrefix
    // });

    setMicroSection({
      quantity: extractDynamicValue(rawSys, 'sys1_micro_inverter_qty', systemPrefix)?.toString?.() ?? "",
      selectedMakeLabel: microMake ?? "",
      selectedMakeValue: microMake ?? "",
      selectedModelLabel: microModel ?? "",
      selectedModelValue: microModel ?? "",
      isNew: !extractDynamicValue(rawSys, 'sys1_micro_inverter_existing', systemPrefix),
    });

    // Inverter, Optimizer, Combiner Panel, ESS, and Battery 1 sections are now handled automatically by useEquipmentSection
    // The fetchFromDb and mapFetchToState functions will handle hydration with proper systemPrefix support

    // Battery 2
    const hasBattery2 =
      !!rawSys.sys1_battery2_id ||
      !!rawSys.sys1_battery_2_make ||
      !!rawSys.sys1_battery_2_model ||
      (rawSys.sys1_battery_2_qty ?? 0) > 0;

    setShowBattery2(!!hasBattery2);

    setBattery2Section({
      quantity: extractDynamicValue(rawSys, 'sys1_battery_2_qty', systemPrefix)?.toString?.() ?? "",
      selectedMakeLabel: extractDynamicValue(rawSys, 'sys1_battery_2_make', systemPrefix) ?? "",
      selectedMakeValue: extractDynamicValue(rawSys, 'sys1_battery_2_make', systemPrefix) ?? "",
      selectedModelLabel: extractDynamicValue(rawSys, 'sys1_battery_2_model', systemPrefix) ?? "",
      selectedModelValue: extractDynamicValue(rawSys, 'sys1_battery_2_model', systemPrefix) ?? "",
      configuration: "",
      isNew: extractDynamicValue(rawSys, 'sys1_battery2_existing', systemPrefix) !== true,
    });

    // SMS
    setSmsSection({
      isNew: !extractDynamicValue(rawSys, 'sys1_sms_existing', systemPrefix),
      selectedMakeLabel: extractDynamicValue(rawSys, 'sys1_sms_make', systemPrefix) ?? "",
      selectedMakeValue: extractDynamicValue(rawSys, 'sys1_sms_make', systemPrefix) ?? "",
      selectedModelLabel: extractDynamicValue(rawSys, 'sys1_sms_model', systemPrefix) ?? "",
      selectedModelValue: extractDynamicValue(rawSys, 'sys1_sms_model', systemPrefix) ?? "",
      hasRSD: !!extractDynamicValue(rawSys, 'sys1_sms_rsd_enabled', systemPrefix),
      selectedMainBreaker: extractDynamicValue(rawSys, 'sys1_sms_breaker_rating', systemPrefix) ?? "",
      selectedBackupPanel:
        extractDynamicValue(rawSys, 'sys1_sms_backup_load_sub_panel_breaker_rating', systemPrefix) ?? "",
      selectedPVBreaker: extractDynamicValue(rawSys, 'sys1_sms_pv_breaker_rating_override', systemPrefix) ?? "",
      selectedESSBreaker: extractDynamicValue(rawSys, 'sys1_sms_ess_breaker_rating_override', systemPrefix) ?? "",
      selectedTieInBreaker:
        extractDynamicValue(rawSys, 'sys1_sms_tie_in_breaker_rating_override', systemPrefix) ?? "",
      activatePCS: !!extractDynamicValue(rawSys, 'sys1_pcs_settings', systemPrefix),
    });

    // Backup Subpanel - use system-specific fields
    setBackupSection({
      selectedMakeLabel: extractDynamicValue(rawSys, 'sys1_backup_subpanel_make', systemPrefix) ?? "",
      selectedMakeValue: extractDynamicValue(rawSys, 'sys1_backup_subpanel_make', systemPrefix) ?? "",
      selectedModelLabel: extractDynamicValue(rawSys, 'sys1_backup_subpanel_model', systemPrefix) ?? "",
      selectedModelValue: extractDynamicValue(rawSys, 'sys1_backup_subpanel_model', systemPrefix) ?? "",
      busAmps: extractDynamicValue(rawSys, 'sys1_backup_subpanel_bus_rating', systemPrefix) ?? "",
      mainBreaker: extractDynamicValue(rawSys, 'sys1_backup_subpanel_main_breaker_rating', systemPrefix) ?? "",
      isNew: !extractDynamicValue(rawSys, 'sys1_backupsubpanel_existing', systemPrefix),
    });
    
    // Mark hydration complete and clear loading
    hydratedRef.current = true;
    setIsLoadingSystemData(false);
  }, [
    rawSys,
    systemPrefix, // Re-run when system changes
    // State setters are stable and don't need to be in dependencies
    // Removing them prevents the effect from re-running when state changes
  ]);

  // ---- Persist system type / backup option (debounced) ----------------------
  const hasMountedSystemType = useRef(false);
  const debouncedSaveSystemType = useCallback(
    debounce((val: Exclude<SystemType, "">, prefix: string, pid: string) => {
      if (!pid) return;
      // Save with dynamic field name
      saveSystemDetailsPartialExact(pid, {
        [`${prefix}selectedsystem`]: val
      });
    }, 500),
    [] // Empty deps, debounce wrapper created once
  );

  useEffect(() => {
    if (!hasMountedSystemType.current) {
      hasMountedSystemType.current = true;
      return;
    }
    if (systemType && projectID)
      debouncedSaveSystemType(systemType as Exclude<SystemType, "">, systemPrefix, projectID);
    return () => debouncedSaveSystemType.cancel();
  }, [systemType, projectID, systemPrefix, debouncedSaveSystemType]);

  const hasMountedBackup = useRef(false);
  const debouncedSaveBackupOption = useCallback(
    debounce((val: Exclude<BackupOption, "">, prefix: string, pid: string) => {
      if (!pid) return;
      // Save with dynamic field name
      saveSystemDetailsPartialExact(pid, {
        [`${prefix}backup_option`]: val
      });
    }, 500),
    [] // Empty deps, debounce wrapper created once
  );

  useEffect(() => {
    if (!hasMountedBackup.current) {
      hasMountedBackup.current = true;
      return;
    }
    if (backupOption && projectID)
      debouncedSaveBackupOption(backupOption as Exclude<BackupOption, "">, systemPrefix, projectID);
    return () => debouncedSaveBackupOption.cancel();
  }, [backupOption, projectID, systemPrefix, debouncedSaveBackupOption]);

  // ---- Persist stringing type (debounced) ------------------------------------
  const hasMountedStringingType = useRef(false);
  const debouncedSaveStringingType = useCallback(
    debounce((val: Exclude<StringingType, "">, prefix: string, pid: string) => {
      if (!pid) return;
      // Save with dynamic field name
      saveSystemDetailsPartialExact(pid, {
        [`${prefix}stringing_type`]: val
      });
    }, 500),
    [] // Empty deps, debounce wrapper created once
  );

  useEffect(() => {
    if (!hasMountedStringingType.current) {
      hasMountedStringingType.current = true;
      return;
    }
    const stringingType = inverterSection.stringingType;
    if (stringingType && projectID)
      debouncedSaveStringingType(stringingType as Exclude<StringingType, "">, systemPrefix, projectID);
    return () => debouncedSaveStringingType.cancel();
  }, [inverterSection.stringingType, projectID, systemPrefix, debouncedSaveStringingType]);

  // ---- Battery Type 2 helpers ------------------------------------------------
  const addBatteryType2 = useCallback(() => {
    setShowBattery2(true);
    setBattery2Section((prev: any) => ({
      ...prev,
      configuration:
        (battery1Section as any).configuration || prev.configuration || "",
    }));
    setBattery1Section((prev: any) => ({ ...prev, configuration: "" }));
  }, [battery1Section, setBattery1Section, setBattery2Section]);

  const removeBatteryType2 = useCallback(() => {
    // Hide Battery Type 2 section
    setShowBattery2(false);

    // Clear Battery Type 2 database fields
    if (projectID) {
      void saveSystemDetailsPartialExact(projectID, {
        [`${systemPrefix}battery2_existing`]: null,
        [`${systemPrefix}battery_2_qty`]: null,
        [`${systemPrefix}battery_2_make`]: null,
        [`${systemPrefix}battery_2_model`]: null,
        [`${systemPrefix}battery2_id`]: null,
        [`${systemPrefix}battery2_tie_in_location`]: null,
      });
    }
  }, [projectID, systemPrefix]);

  // ---- Visibility helpers (for UI) ------------------------------------------
  const visible = useMemo(() => {
    // Detect if PowerWall is selected (uses integrated battery, not separate Battery Type 1)
    const make = inverterSection.selectedMake || "";
    const model = inverterSection.selectedModel || "";
    const modelLabel = inverterSection.selectedModelLabel || "";
    const isTesla = make.toLowerCase().includes('tesla');
    const modelLower = model.toLowerCase();
    const modelLabelLower = modelLabel.toLowerCase();
    const isPowerWall = isTesla && (
      modelLower.includes('powerwall') ||
      modelLabelLower.includes('powerwall')
    );

    const visibilityFlags = {
      solar: true,
      systemSelection: true,

      micro: isMicro,
      inverter: isInverter,
      optimizer: isInverter,

      combiner: isMicro,
      ess: hasSystem && !isPowerWall, // Hide ESS section for PowerWall

      sms: smsEnabled && !isPowerWall, // Hide SMS section for PowerWall (it's integrated)
      battery1: hasBackupChoice && !isPowerWall, // Hide Battery Type 1 for PowerWall (integrated)
      backupSubpanel: backupSubpanelEnabled && !isPowerWall, // Hide standard backup panel for PowerWall (uses its own)

      battery2: battery2Enabled,
    };

    console.log('[VISIBILITY DEBUG] Flags calculated:', {
      backupOption,
      smsEnabled,
      hasBackupChoice,
      backupSubpanelEnabled,
      battery2Enabled,
      isPowerWall,
      inverterMake: make,
      inverterModel: model,
      visibilityFlags,
    });

    return visibilityFlags;
  }, [
    isMicro,
    isInverter,
    hasSystem,
    smsEnabled,
    hasBackupChoice,
    backupSubpanelEnabled,
    battery2Enabled,
    backupOption,
    inverterSection.selectedMake,
    inverterSection.selectedModel,
    inverterSection.selectedModelLabel,
  ]);

  const showBt1Config = useMemo(
    () => parseInt(battery1Section.quantity || "0", 10) > 1 && !showBattery2,
    [battery1Section.quantity, showBattery2]
  );

  // Clear Battery Type 1 data when PowerWall is selected (PowerWall has integrated battery)
  useEffect(() => {
    const make = inverterSection.selectedMake || "";
    const model = inverterSection.selectedModel || "";
    const modelLabel = inverterSection.selectedModelLabel || "";
    const isTesla = make.toLowerCase().includes('tesla');
    const modelLower = model.toLowerCase();
    const modelLabelLower = modelLabel.toLowerCase();
    const isPowerWall = isTesla && (modelLower.includes('powerwall') || modelLabelLower.includes('powerwall'));

    if (isPowerWall && projectID && battery1Section.quantity) {
      // Clear Battery Type 1 if it has data
      console.log('[PowerWall] Clearing Battery Type 1 data - PowerWall has integrated battery');
      void saveSystemDetailsPartialExact(projectID, {
        [`${systemPrefix}battery_1_qty`]: null,
        [`${systemPrefix}battery_1_make`]: null,
        [`${systemPrefix}battery_1_model`]: null,
        [`${systemPrefix}battery1_id`]: null,
        [`${systemPrefix}battery1_existing`]: null,
        [`${systemPrefix}battery1_tie_in_location`]: null,
        [`${systemPrefix}battery_1_configuration`]: null,
      });
      setBattery1Section({
        quantity: "",
        selectedMakeLabel: "",
        selectedMakeValue: "",
        selectedModelLabel: "",
        selectedModelValue: "",
        isNew: true,
        tieInLocation: "",
        configuration: "",
      });
    }
    // NOTE: We don't clear backup panel data because PowerWall and standard ESS both use
    // the same backupSection state for their respective backup panels.
    // We just hide the standard backup panel UI via visibility flags (backupSubpanel: !isPowerWall).
  }, [inverterSection.selectedMake, inverterSection.selectedModel, inverterSection.selectedModelLabel, projectID, systemPrefix, battery1Section.quantity]);

  // Ensure arrays (and memoize empty []) --------------------------------------
  // Use a stable empty array reference to prevent unnecessary re-renders
  const EMPTY_ARRAY: any[] = useMemo(() => [], []);
  const asArray = <T>(v: T[] | undefined | null) => (Array.isArray(v) ? v : EMPTY_ARRAY as T[]);
  const solarMakesSafe = useMemo(() => asArray(solarMakes), [solarMakes]);
  const solarModelsSafe = useMemo(() => asArray(solarModels), [solarModels]);
  const microMakesSafe = useMemo(() => asArray(microMakes), [microMakes]);
  const microModelsSafe = useMemo(() => asArray(microModels), [microModels]);
  const combinerMakesSafe = useMemo(
    () => asArray(combinerMakes),
    [combinerMakes]
  );
  const combinerModelsSafe = useMemo(() => asArray(combinerModels), [combinerModels]);
  const inverterMakesSafe = useMemo(
    () => asArray(inverterMakes),
    [inverterMakes]
  );
  const inverterModelsSafe = useMemo(
    () => asArray(inverterModels),
    [inverterModels]
  );
  const essMakesSafe = useMemo(() => asArray(essMakes), [essMakes]);
  const essModelsSafe = useMemo(() => asArray(essModels), [essModels]);
  const bcpMakesSafe = useMemo(() => asArray(bcpMakes), [bcpMakes]);
  const bcpModelsSafe = useMemo(() => asArray(bcpModels), [bcpModels]);
  const batteryMakesSafe = useMemo(() => asArray(batteryMakes), [batteryMakes]);
  const batteryModelsSafe = useMemo(
    () => asArray(batteryModels),
    [batteryModels]
  );
  const battery2MakesSafe = useMemo(
    () => asArray(battery2Makes),
    [battery2Makes]
  );
  const battery2ModelsSafe = useMemo(
    () => asArray(battery2Models),
    [battery2Models]
  );
  const smsMakesSafe = useMemo(() => asArray(smsMakes), [smsMakes]);
  const smsModelsSafe = useMemo(() => asArray(smsModels), [smsModels]);
  const backupMakesSafe = useMemo(() => asArray(backupMakes), [backupMakes]);
  const backupModelsSafe = useMemo(() => asArray(backupModels), [backupModels]);

  // Stabilize load functions ---------------------------------------------------
  const solarLoadMakes = useStableFn(solarLoadMakesRaw);
  const solarLoadModels = useStableFn(solarLoadModelsRaw);
  const microLoadMakes = useStableFn(microLoadMakesRaw);
  const microLoadModels = useStableFn(microLoadModelsRaw);
  const combinerLoadMakes = useStableFn(combinerLoadMakesRaw);
  const combinerLoadModels = useStableFn(combinerLoadModelsRaw);
  const inverterLoadMakes = useStableFn(inverterLoadMakesRaw);
  const inverterLoadModels = useStableFn(inverterLoadModelsRaw);
  const essLoadMakes = useStableFn(essLoadMakesRaw);
  const essLoadModels = useStableFn(essLoadModelsRaw);
  const bcpLoadMakes = useStableFn(bcpLoadMakesRaw);
  const bcpLoadModels = useStableFn(bcpLoadModelsRaw);
  const batteryLoadMakes = useStableFn(batteryLoadMakesRaw);
  const batteryLoadModels = useStableFn(batteryLoadModelsRaw);
  const battery2LoadMakes = useStableFn(battery2LoadMakesRaw);
  const battery2LoadModels = useStableFn(battery2LoadModelsRaw);
  const smsLoadMakes = useStableFn(smsLoadMakesRaw);
  const smsLoadModels = useStableFn(smsLoadModelsRaw);
  const backupLoadMakes = useStableFn(backupLoadMakesRaw);
  const backupLoadModels = useStableFn(backupLoadModelsRaw);

  // APS Configuration Evaluation -----------------------------------------------
  const buildEquipmentState = useCallback((): EquipmentState => {
    return {
      currentSystem: (systemPrefix.replace('_', '') as 'sys1' | 'sys2' | 'sys3' | 'sys4'),

      // Utility context
      utilityName: utilityName || 'APS',
      utilityBOSCombination: activeUtilityRequirements?.combination || '',
      utilityBOSRequirements: activeUtilityRequirements ? {
        bos1: activeUtilityRequirements.bos_type_1,
        bos2: activeUtilityRequirements.bos_type_2,
        bos3: activeUtilityRequirements.bos_type_3,
        bos4: activeUtilityRequirements.bos_type_4,
        bos5: activeUtilityRequirements.bos_type_5,
        bos6: activeUtilityRequirements.bos_type_6,
      } : undefined,

      // Solar
      hasSolarPanels: !!(solarSection?.selectedMake && solarSection?.selectedModel),
      solarMake: solarSection?.selectedMake,
      solarModel: solarSection?.selectedModel,

      // Inverter
      inverterMake: inverterSection?.selectedMake,
      inverterModel: inverterSection?.selectedModel,
      inverterType: null, // TODO: Detect from equipment specs

      // Battery
      batteryQuantity: parseInt(battery1Section?.quantity || '0'),
      batteryMake: battery1Section?.selectedMake,
      batteryModel: battery1Section?.selectedModel,
      batteryChargingSource: (battery1Section as any)?.chargingSource || 'grid-only',

      // Backup
      hasBackupPanel: backupOption === 'Whole Home' || backupOption === 'Partial Home',
      backupOption: backupOption === '' ? undefined : backupOption,
    };
  }, [systemPrefix, solarSection, inverterSection, battery1Section, backupOption, utilityName, activeUtilityRequirements]);

  const evaluateAPSConfiguration = useCallback(() => {
    // 🔴 TEMPORARY KILL SWITCH: Disable auto-configuration modal while developing switchboard logic
    // TODO: Remove this return statement once APSConfigurationSwitchboard is fully tested
    console.log('[CONFIG-DEBUG] Auto-configuration DISABLED - Manual configuration only');
    return;
    // 🔴 END KILL SWITCH

    console.log('[CONFIG-DEBUG] ===== evaluateAPSConfiguration CALLED =====');
    console.log('[CONFIG-DEBUG] State check:', {
      apsConfigAskLater,
      hasUtilityRequirements: !!activeUtilityRequirements,
      currentAPSConfig,
      utilityName: activeUtilityRequirements?.utility_name,
      combination: activeUtilityRequirements?.combination
    });

    // Don't evaluate if user clicked "Ask Later"
    if (apsConfigAskLater) {
      console.log('[CONFIG-DEBUG] EARLY RETURN: Ask Later is true');
      return;
    }

    // Don't evaluate if no utility requirements loaded
    if (!activeUtilityRequirements) {
      console.log('[CONFIG-DEBUG] EARLY RETURN: No utility requirements');
      return;
    }

    // Build current equipment state
    const equipmentState = buildEquipmentState();
    console.log('[CONFIG-DEBUG] Equipment state built:', equipmentState);

    // Evaluate configuration (works for all utilities now)
    const newConfig = apsConfigManager.evaluateConfiguration(equipmentState);
    console.log('[CONFIG-DEBUG] Configuration evaluated:', newConfig);

    // Skip if invalid configuration
    if (newConfig === 'INVALID') {
      console.log('[CONFIG-DEBUG] EARLY RETURN: Invalid configuration');
      return;
    }

    // Handle NO-BOS configuration (skip modal)
    if (newConfig === 'NO-BOS') {
      console.log('[CONFIG-DEBUG] EARLY RETURN: NO-BOS configuration');
      // No modal needed - utility doesn't require BOS
      return;
    }

    // Check if configuration changed
    if (currentAPSConfig && currentAPSConfig !== newConfig) {
      console.log('[CONFIG-DEBUG] Configuration CHANGED from', currentAPSConfig, 'to', newConfig);
      // Configuration changed - show change modal (if supported)
      const change = apsConfigManager.getConfigurationChange(newConfig);
      if (change) {
        console.log('[CONFIG-DEBUG] Showing CHANGE modal');
        setPendingConfigChange(change);
        setShowAPSChangeModal(true);
      }
    } else if (!currentAPSConfig) {
      console.log('[CONFIG-DEBUG] FIRST TIME configuration - showing BOS modal');
      // First time configuration - show BOS modal
      apsConfigManager.setCurrentConfig(newConfig);
      setCurrentAPSConfig(newConfig);
      const details = APSConfigurationSwitchboard.getConfigurationDetails(newConfig);
      console.log('[CONFIG-DEBUG] Configuration details:', details);
      setApsConfigDetails(details);
      setShowAPSBOSModal(true);
    } else {
      console.log('[CONFIG-DEBUG] Config unchanged, no action needed');
    }
  }, [activeUtilityRequirements, apsConfigAskLater, buildEquipmentState, currentAPSConfig, apsConfigManager]);

  // Modal Handlers -------------------------------------------------------------
  const handleAPSBOSAccept = useCallback(() => {
    // User accepted BOS configuration - equipment will be added via BOS sections
    setShowAPSBOSModal(false);
    // TODO: Optionally pre-populate BOS sections based on configuration
  }, []);

  const handleAPSBOSCustom = useCallback(() => {
    // User wants to manually configure equipment
    setShowAPSBOSModal(false);
  }, []);

  const handleAPSBOSAskLater = useCallback(() => {
    // User wants to be asked later
    setShowAPSBOSModal(false);
    setApsConfigAskLater(true);
  }, []);

  const handleAPSChangeAccept = useCallback(() => {
    // User accepted configuration changes
    if (pendingConfigChange) {
      apsConfigManager.setCurrentConfig(pendingConfigChange.newConfig);
      setCurrentAPSConfig(pendingConfigChange.newConfig);
      const details = APSConfigurationSwitchboard.getConfigurationDetails(pendingConfigChange.newConfig);
      setApsConfigDetails(details);
      // TODO: Update BOS sections based on changes
    }
    setShowAPSChangeModal(false);
    setPendingConfigChange(null);
  }, [pendingConfigChange, apsConfigManager]);

  const handleAPSChangeCustom = useCallback(() => {
    // User wants to manually adjust equipment
    setShowAPSChangeModal(false);
    setPendingConfigChange(null);
  }, []);

  const handleAPSChangeCancel = useCallback(() => {
    // User cancelled configuration change
    setShowAPSChangeModal(false);
    setPendingConfigChange(null);
  }, []);

  // CRITICAL: Fetch utility requirements when inverter is selected
  // This ensures we always have fresh utility requirements for evaluation
  useEffect(() => {
    const fetchRequirements = async () => {
      if (!inverterSection?.selectedMake || !inverterSection?.selectedModel) {
        console.log('[CONFIG-DEBUG] Inverter not fully selected - skipping utility requirements fetch');
        return;
      }

      const utility = project?.site?.utility;
      const state = project?.site?.state;

      if (!utility || !state || !companyUuid) {
        console.log('[CONFIG-DEBUG] Missing project site data for utility requirements fetch', {
          utility,
          state,
          hasToken: !!companyUuid,
          projectSite: project?.site
        });
        return;
      }

      console.log('[CONFIG-DEBUG] Fetching utility requirements because inverter was selected', {
        utility,
        state,
        make: inverterSection.selectedMake,
        model: inverterSection.selectedModel
      });

      try {
        const requirements = await fetchUtilityRequirements(state, utility, companyUuid);
        console.log('[CONFIG-DEBUG] Successfully fetched utility requirements:', requirements);
        setInternalUtilityRequirements(requirements);
        setUtilityName(utility);
      } catch (error) {
        console.error('[CONFIG-DEBUG] Error fetching utility requirements:', error);
      }
    };

    fetchRequirements();
  }, [inverterSection?.selectedMake, inverterSection?.selectedModel, project?.site?.utility, project?.site?.state, companyUuid]);

  // Trigger configuration evaluation when inverter is selected
  useEffect(() => {
    if (inverterSection?.selectedMake && inverterSection?.selectedModel) {
      // Small delay to let state settle
      const timer = setTimeout(() => {
        evaluateAPSConfiguration();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inverterSection?.selectedMake, inverterSection?.selectedModel]);

  // Trigger configuration re-evaluation when battery changes
  useEffect(() => {
    if (battery1Section?.selectedMake && battery1Section?.selectedModel && battery1Section?.quantity) {
      const timer = setTimeout(() => {
        evaluateAPSConfiguration();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battery1Section?.selectedMake, battery1Section?.selectedModel, battery1Section?.quantity]);

  // Trigger configuration re-evaluation when backup option changes
  useEffect(() => {
    if (backupOption && backupOption !== '') {
      const timer = setTimeout(() => {
        evaluateAPSConfiguration();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupOption]);

  // CRITICAL: Re-evaluate when utilityRequirements become available
  // This handles the case where equipment is added BEFORE utility requirements finish loading
  useEffect(() => {
    // If utility requirements just became available AND we have equipment already selected,
    // trigger evaluation immediately
    if (activeUtilityRequirements && !apsConfigAskLater) {
      const hasInverter = !!(inverterSection?.selectedMake && inverterSection?.selectedModel);
      const hasBattery = !!(battery1Section?.selectedMake && battery1Section?.selectedModel && battery1Section?.quantity);
      const hasBackup = !!(backupOption && backupOption !== '');

      if (hasInverter || hasBattery || hasBackup) {
        const timer = setTimeout(() => {
          evaluateAPSConfiguration();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUtilityRequirements, apsConfigAskLater, inverterSection?.selectedMake, inverterSection?.selectedModel, battery1Section?.selectedMake, battery1Section?.selectedModel, battery1Section?.quantity, backupOption]);

  // ---- Return everything -----------------------------------------------------
  return {
    // loading state
    isLoadingSystemData,

    // header/system
    headerHeight,
    setHeaderHeight,
    systemType,
    setSystemType,
    stringingType: inverterSection.stringingType || "auto", // System-specific stringing type from inverter section
    setStringingType: (type: StringingType) => {
      setInverterSection((prev: any) => ({ ...prev, stringingType: type }));
    },
    backupOption,
    setBackupOption: setBackupOptionWithTimestamp,
    utilityServiceAmps,
    setUtilityServiceAmps,

    // visibility + battery 2 toggles
    visible,
    showBattery2,
    addBatteryType2,
    removeBatteryType2,
    showBt1Config,

    // Solar
    solarSection,
    setSolarSection,
    solarMakes: solarMakesSafe,
    solarModels: solarModelsSafe,
    solarLoadMakes,
    solarLoadModels,
    solarLoadingMakes,
    solarLoadingModels,
    solarLoadingData,

    // Solar Type 2
    solarType2Section,
    setSolarType2Section,
    solarType2Makes,
    solarType2Models,
    solarType2LoadMakes: useStableFn(solarType2LoadMakesRaw),
    solarType2LoadModels: useStableFn(solarType2LoadModelsRaw),
    solarType2LoadingMakes,
    solarType2LoadingModels,
    solarType2LoadingData,

    // Micro
    microSection,
    setMicroSection,
    microMakes: microMakesSafe,
    microModels: microModelsSafe,
    microLoadMakes,
    microLoadModels,
    microLoadingMakes,
    microLoadingModels,
    microLoadingData,

    // Combiner
    combinerSection,
    setCombinerSection,
    combinerMakes: combinerMakesSafe,
    combinerModels: combinerModelsSafe,
    combinerLoadMakes,
    combinerLoadModels,
    combinerLoadingMakes,
    combinerLoadingModels,
    combinerLoadingData,

    // Inverter
    inverterSection,
    setInverterSection,
    inverterMakes: inverterMakesSafe,
    inverterModels: inverterModelsSafe,
    inverterLoadMakes,
    inverterLoadModels,
    inverterLoadingMakes,
    inverterLoadingModels,
    inverterLoadingData,

    // ESS (main card / helper)
    essSection,
    setEssSection,
    essMakes: essMakesSafe,
    essModels: essModelsSafe,
    essLoadMakes,
    essLoadModels,
    essLoadingMakes,
    essLoadingModels,
    essLoadingData,

    // Battery Combiner Panel
    batteryCombinerPanelSection,
    setBatteryCombinerPanelSection,
    bcpMakes: bcpMakesSafe,
    bcpModels: bcpModelsSafe,
    bcpLoadMakes,
    bcpLoadModels,
    bcpLoadingMakes,
    bcpLoadingModels,
    bcpLoadingData,

    // Battery 1
    battery1Section,
    setBattery1Section,
    batteryMakes: batteryMakesSafe,
    batteryModels: batteryModelsSafe,
    batteryLoadMakes,
    batteryLoadModels,
    batteryLoadingMakes,
    batteryLoadingModels,
    batteryLoadingData,

    // Battery 2
    battery2Section,
    setBattery2Section,
    battery2Makes: battery2MakesSafe,
    battery2Models: battery2ModelsSafe,
    battery2LoadMakes,
    battery2LoadModels,
    battery2LoadingMakes,
    battery2LoadingModels,
    battery2LoadingData,

    // SMS (panel)
    smsSection,
    setSmsSection,
    smsMakes: smsMakesSafe,
    smsModels: smsModelsSafe,
    smsLoadMakes,
    smsLoadModels,
    smsLoadingMakes,
    smsLoadingModels,
    smsLoadingData,

    // Backup Subpanel
    backupSection,
    setBackupSection,
    backupMakes: backupMakesSafe,
    backupModels: backupModelsSafe,
    backupLoadMakes,
    backupLoadModels,
    backupLoadingMakes,
    backupLoadingModels,

    // Optimizer
    optimizerSection,
    setOptimizerSection,
    optimizerMakes: useMemo(() => asArray(optimizerMakes), [optimizerMakes]),
    optimizerModels: useMemo(() => asArray(optimizerModels), [optimizerModels]),
    optimizerLoadMakes: useStableFn(optimizerLoadMakesRaw),
    optimizerLoadModels: useStableFn(optimizerLoadModelsRaw),
    optimizerLoadingMakes,
    optimizerLoadingModels,

    // APS Configuration
    currentAPSConfig,
    apsConfigDetails,
    showAPSBOSModal,
    showAPSChangeModal,
    pendingConfigChange,
    handleAPSBOSAccept,
    handleAPSBOSCustom,
    handleAPSBOSAskLater,
    handleAPSChangeAccept,
    handleAPSChangeCustom,
    handleAPSChangeCancel,
    setUtilityName,
    evaluateAPSConfiguration,
  };
}
