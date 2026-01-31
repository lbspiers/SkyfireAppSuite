import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, LayoutChangeEvent, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, DrawerActions, useRoute, RouteProp, ParamListBase } from "@react-navigation/native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import { BLUE_MD_TB } from "../../../../styles/gradient";
import { verticalScale, moderateScale } from "../../../../utils/responsive";
import LargeHeader from "../../../../components/Header/LargeHeader";

import SolarPanelsSection from "../sections/SolarPanelSection";
import SolarPanelType2Section from "../sections/SolarPanelType2Section";
import SystemSelectionSection from "../sections/SystemSelectionSection";
import MicroinverterSection from "../sections/MicroinverterSection";
import StringCombinerPanelSection from "../sections/StringCombinerPanelSection";
import EnergyStorageSection from "../sections/EnergyStorageSection";
import InverterSection from "../sections/InverterSection";
import PowerWallConfigurationSection from "../sections/PowerWallConfigurationSection";
import OptimizerSection from "../sections/OptimizerSection";
import BOSType1Section from "../sections/BOSType1Section";
import BOSType2Section from "../sections/BOSType2Section";
import BOSType3Section from "../sections/BOSType3Section";
import BOSType4Section from "../sections/BOSType4Section";
import BOSType5Section from "../sections/BOSType5Section";
import BOSType6Section from "../sections/BOSType6Section";
import BOSRequiredEquipmentModal from "../../../../components/Modals/BOSRequiredEquipmentModal";
import { APSBOSConfigurationModal } from "../../../../components/Modals/APSBOSConfigurationModal";
import SystemButton from "../../../../components/Button/SystemButton";

import Sys1BatteryType1Section from "../sections/ESS_Subsections/sys1_BatteryType1Section";
import Sys1BatteryType2Section from "../sections/ESS_Subsections/sys1_BatteryType2Section";
import Sys1BatteryCombinerPanel1Section from "../sections/ESS_Subsections/sys1_BatteryCombinerPanel1Section";
import Sys1SMSSection from "../sections/ESS_Subsections/sys1_SMS";
import Sys1BackupLoadSubPanelSection from "../sections/ESS_Subsections/sys1_BackuploadSubPanel";
import Sys1GatewayConfigurationSection from "../sections/ESS_Subsections/sys1_GatewayConfiguration";

import { BatteryChainBOS } from "./BOS/BatteryChainBOS";
import { BackupChainBOS } from "./BOS/BackupChainBOS";

import { useEquipmentDetails, StringingConfiguration } from "../hooks/useEquipmentDetails";
import {
  saveSystemDetailsPartialExact,
  saveBatteryConfiguration,
  savePcsSetting,
} from "../services/equipmentService";
import { fetchSystemDetails } from "../../../../api/systemDetails.service";
import { fetchUtilityRequirements } from "../../../../api/utility.service";
import { GetBatteryModels } from "../../../../api/inventry.service";
import { NotificationProvider } from "../context/NotificationContext";
import { BOS_EQUIPMENT_TRANSLATION } from "../../../../utils/constants";
import { compactBOSSlots, findExistingSystemCoreEquipment, findEquipmentByTrigger } from "../../../../utils/bosSlotCompactor";
import { getBOSBlockName } from "../../../../constants/bosBlockNames";

const findLabel = (
  list: { label: string; value: string }[] = [],
  value?: string
) => list.find((o) => o.value === value)?.label ?? value ?? "";

// Translate standard BOS equipment names to utility-specific variation names for display
// Direction: Standard Name (from DB) → Utility-Specific Variation (for header display)
const translateToUtilityVariation = (utilityAbbrev: string | undefined, standardName: string): string => {
  if (!utilityAbbrev || !standardName) return standardName;

  const utilityTranslations = BOS_EQUIPMENT_TRANSLATION[utilityAbbrev];
  if (!utilityTranslations) {
    // If no translation table for this utility, return as-is
    return standardName;
  }

  // Case-insensitive lookup: find matching standard name
  for (const [key, value] of Object.entries(utilityTranslations)) {
    if (key.toLowerCase() === standardName.toLowerCase()) {
      console.log(`[BOS Translation] ${utilityAbbrev}: "${standardName}" (standard) -> "${value}" (variation for display)`);
      return value;
    }
  }

  // No translation found, return original standard name
  console.log(`[BOS Translation] ${utilityAbbrev}: No translation found for "${standardName}"`);
  return standardName;
};

// Route params interface
interface RouteParams extends ParamListBase {
  EquipmentDetails: {
    systemLabel?: string;
    systemNumber?: number;
    systemPrefix?: string;
    details?: any;
    data?: any;
    showPostSMSBOS?: boolean;
  };
}

/**
 * RULES OF THE ROAD (fixing the loop):
 * - Effects depend ONLY on stable, primitive deps (no setters/functions from the hook).
 * - One-off prefetch uses a ref so StrictMode/double-renders won't re-hit it.
 * - "values" objects are memoized so children don't re-run effects on fresh object identities.
 * - Header onLayout only updates when the height actually changes.
 *
 */
const EquipmentDetails: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EquipmentDetails'>>();

  // Get system parameters from navigation
  const {
    systemLabel = "System 1",
    systemNumber = 1,
    systemPrefix = "sys1_",
    microInverterHint
  } = route.params || {};

  /**
   * Helper function to get correct Battery Combiner Panel field names based on system number
   * System 1 uses sys1_ess_* fields
   * System 2+ uses sys{N}_battery_combiner_panel_* / sys{N}_batterycombinerpanel_* fields
   */
  const getBCPFieldName = (baseField: 'make' | 'model' | 'busbar' | 'mainbreaker' | 'tieinbreaker' | 'existing'): string | null => {
    if (systemNumber === 1) {
      switch (baseField) {
        case 'make': return `${systemPrefix}ess_make`;
        case 'model': return `${systemPrefix}ess_model`;
        case 'busbar': return `${systemPrefix}ess_upstream_breaker_rating`;
        case 'mainbreaker': return `${systemPrefix}ess_main_breaker_rating`;
        case 'existing': return `${systemPrefix}ess_existing`;
        case 'tieinbreaker': return null; // System 1 doesn't have tie-in breaker field
        default: return null;
      }
    } else if (systemNumber === 2) {
      switch (baseField) {
        case 'make': return `${systemPrefix}battery_combiner_panel_make`;
        case 'model': return `${systemPrefix}battery_combiner_panel_model`;
        case 'busbar': return `${systemPrefix}batterycombinerpanel_bus_rating`;
        case 'mainbreaker': return `${systemPrefix}batterycombinerpanel_mcb_rating`;
        case 'tieinbreaker': return `${systemPrefix}batterycombinerpanel_tie_in_breaker_rating`;
        case 'existing': return null; // System 2 doesn't have existing field
        default: return null;
      }
    } else {
      // System 3, 4 follow System 2 pattern
      switch (baseField) {
        case 'make': return `${systemPrefix}battery_combiner_panel_make`;
        case 'model': return `${systemPrefix}battery_combiner_panel_model`;
        case 'busbar': return `${systemPrefix}batterycombinerpanel_bus_rating`;
        case 'mainbreaker': return `${systemPrefix}batterycombinerpanel_mcb_rating`;
        case 'tieinbreaker': return `${systemPrefix}batterycombinerpanel_tie_in_breaker_rating`;
        case 'existing': return null;
        default: return null;
      }
    }
  };

  const projectID = useSelector((s: any) => s.project.currentProject?.uuid);
  const companyUuid = useSelector((s: any) => s.profile.profile?.company?.uuid);
  const lastDataRefresh = useSelector((s: any) => s.project.lastDataRefresh);

  const {
    isLoadingSystemData,
    
    headerHeight,
    setHeaderHeight,

    systemType,
    setSystemType,

    stringingType,
    setStringingType,

    backupOption,
    setBackupOption,
    utilityServiceAmps,
    setUtilityServiceAmps,

    // visibility + battery2 controls
    visible,
    showBattery2,
    addBatteryType2,
    removeBatteryType2,
    showBt1Config,

    // Solar
    solarSection,
    setSolarSection,
    solarMakes,
    solarModels,
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
    solarType2LoadMakes,
    solarType2LoadModels,
    solarType2LoadingMakes,
    solarType2LoadingModels,
    solarType2LoadingData,

    // Micro
    microSection,
    setMicroSection,
    microMakes,
    microModels,
    microLoadMakes,
    microLoadModels,
    microLoadingMakes,
    microLoadingModels,
    microLoadingData,

    // String Combiner
    combinerSection,
    setCombinerSection,
    combinerMakes,
    combinerModels,
    combinerLoadMakes,
    combinerLoadModels,
    combinerLoadingMakes,
    combinerLoadingModels,
    combinerLoadingData,

    // Inverter
    inverterSection,
    setInverterSection,
    inverterMakes,
    inverterModels,
    inverterLoadMakes,
    inverterLoadModels,
    inverterLoadingMakes,
    inverterLoadingModels,
    inverterLoadingData,

    // Optimizers
    optimizerSection,
    setOptimizerSection,
    optimizerMakes,
    optimizerModels,
    optimizerLoadMakes,
    optimizerLoadModels,
    optimizerLoadingMakes,
    optimizerLoadingModels,

    // SMS
    smsSection,
    setSmsSection,
    smsMakes,
    smsModels,
    smsLoadMakes,
    smsLoadModels,
    smsLoadingMakes,
    smsLoadingModels,
    smsLoadingData,

    // Battery 1
    battery1Section,
    setBattery1Section,
    batteryMakes,
    batteryModels,
    batteryLoadMakes,
    batteryLoadModels,
    batteryLoadingMakes,
    batteryLoadingModels,
    batteryLoadingData,

    // Battery 2
    battery2Section,
    setBattery2Section,
    battery2Makes,
    battery2Models,
    battery2LoadMakes,
    battery2LoadModels,
    battery2LoadingMakes,
    battery2LoadingModels,
    battery2LoadingData,

    // Backup Subpanel
    backupSection,
    setBackupSection,
    backupMakes,
    backupModels,
    backupLoadMakes,
    backupLoadModels,
    backupLoadingMakes,
    backupLoadingModels,

    // ESS "combiner"
    essSection,
    setEssSection,
    essMakes,
    essModels,
    essLoadMakes,
    essLoadModels,
    essLoadingMakes,
    essLoadingModels,
    essLoadingData,

    // Battery Combiner Panel
    batteryCombinerPanelSection,
    setBatteryCombinerPanelSection,
    bcpMakes,
    bcpModels,
    bcpLoadMakes,
    bcpLoadModels,
    bcpLoadingMakes,
    bcpLoadingModels,
    bcpLoadingData,

    // Stringing Configuration
    saveStringingConfiguration,

    // APS Configuration
    currentAPSConfig,
    apsConfigDetails,
    showAPSBOSModal,
    handleAPSBOSAccept,
    handleAPSBOSCustom,
    handleAPSBOSAskLater,
    setUtilityName,
  } = useEquipmentDetails(projectID, companyUuid, systemPrefix, utilityRequirements, project?.site);

  // DEBUG: Log SMS section state

  // System-specific flag to prevent systemType cleanup from clearing AC-integrated microinverter data
  // This must be system-specific to prevent cross-system contamination
  const [isACIntegratedActive, setIsACIntegratedActive] = useState<{[key: string]: boolean}>({});

  // Track the system prefix that solarSection was hydrated for to prevent stale data usage
  // Initialize to empty string to force waiting for first hydration
  const solarSectionSystemRef = useRef<string>("");

  // When systemPrefix changes, mark solar data as stale
  useEffect(() => {
    console.log('[EquipmentDetails] System prefix changed, marking solar data as stale:', {
      from: solarSectionSystemRef.current,
      to: systemPrefix,
    });
    solarSectionSystemRef.current = ""; // Mark as stale until hydration completes
  }, [systemPrefix]);

  // Update the ref when solar data finishes loading for the current system
  useEffect(() => {
    if (!solarLoadingData && !isLoadingSystemData) {
      console.log('🔄 [EquipmentDetails] Solar data loaded for system:', {
        systemPrefix,
        isAcIntegrated: solarSection.isAcIntegrated,
        integratedMicroMake: solarSection.integratedMicroMake,
        integratedMicroModel: solarSection.integratedMicroModel,
      });
      solarSectionSystemRef.current = systemPrefix;
    }
  }, [solarLoadingData, isLoadingSystemData, systemPrefix, solarSection.isAcIntegrated, solarSection.integratedMicroMake, solarSection.integratedMicroModel]);

  // --- Cross-section hygiene --------------------------------------------------
  // IMPORTANT: only depend on systemType (setters may be unstable if not memoized inside the hook)
  useEffect(() => {
    if (!systemType) return;

    if (systemType === "microinverter") {
      setInverterSection((prev: any) => ({
        ...prev,
        isNew: true,
        selectedMakeLabel: "",
        selectedMakeValue: "",
        selectedModelLabel: "",
        selectedModelValue: "",
      }));
      setOptimizerSection((prev: any) => ({
        ...prev,
        isNew: true,
        selectedMakeLabel: "",
        selectedMakeValue: "",
        selectedModelLabel: "",
        selectedModelValue: "",
      }));
    } else if (systemType === "inverter") {
      // Don't clear microSection if AC-integrated is active FOR THIS SYSTEM
      const isThisSystemACIntegrated = isACIntegratedActive[systemPrefix];
      console.log('[EquipmentDetails] Cross-section cleanup check:', {
        systemPrefix,
        systemType,
        isThisSystemACIntegrated,
        allACIntegratedFlags: isACIntegratedActive,
        willClearMicroSection: !isThisSystemACIntegrated
      });

      if (!isThisSystemACIntegrated) {
        setMicroSection((prev: any) => ({
          ...prev,
          quantity: "",
          selectedMakeLabel: "",
          selectedMakeValue: "",
          selectedModelLabel: "",
          selectedModelValue: "",
          isNew: true,
        }));
      }
      setCombinerSection((prev: any) => ({
        ...prev,
        selectedMakeLabel: "",
        selectedMakeValue: "",
        selectedModelLabel: "",
        selectedModelValue: "",
        busAmps: "",
        mainBreaker: "",
        isNew: true,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemType, isACIntegratedActive, systemPrefix]);

  // Auto-set microinverter when AC integrated solar panel is selected
  // Auto-populate happens immediately when AC panel is detected (regardless of quantity)
  // Quantity sync happens separately in the quantity sync useEffect below
  // Works for all systems (sys1, sys2, sys3, sys4) with system-specific isacintegrated fields
  useEffect(() => {
    // CRITICAL FIX: Prevent cross-system contamination by not running this effect while solar data is loading
    // When switching systems, solarSection contains stale data from the previous system until hydration completes
    // Running this effect with stale data would save System 1's AC-integrated data to System 2's database fields
    if (isLoadingSystemData || solarLoadingData) {
      console.log('[EquipmentDetails] AC-integrated check skipped - data still loading:', {
        isLoadingSystemData,
        solarLoadingData,
        systemPrefix,
      });
      return;
    }

    // ADDITIONAL FIX: Check if solarSection data is for the current system
    // Even after loading completes, solarSection might contain data from a different system
    if (solarSectionSystemRef.current !== systemPrefix) {
      console.log('[EquipmentDetails] AC-integrated check skipped - solarSection is for different system:', {
        solarSectionSystem: solarSectionSystemRef.current,
        currentSystem: systemPrefix,
      });
      return;
    }

    console.log('[EquipmentDetails] AC-integrated check:', {
      isAcIntegrated: solarSection.isAcIntegrated,
      integratedMicroMake: solarSection.integratedMicroMake,
      integratedMicroModel: solarSection.integratedMicroModel,
      quantity: solarSection.quantity,
      systemType,
      systemPrefix,
    });

    // Apply AC-integrated logic for any system with AC-integrated panel
    const shouldApplyAcIntegrated =
      solarSection.isAcIntegrated &&
      solarSection.integratedMicroMake &&
      solarSection.integratedMicroModel;

    if (shouldApplyAcIntegrated) {
      // Set system-specific flag to prevent microSection from being cleared for THIS system only
      setIsACIntegratedActive(prev => ({ ...prev, [systemPrefix]: true }));

      const microMake = solarSection.integratedMicroMake;
      const microModel = solarSection.integratedMicroModel;

      // Save EVERYTHING to database in one operation to avoid race conditions
      // The microinverter section will hydrate from DB when it renders
      if (projectID && microMake && microModel) {
        const acIntegratedPayload = {
          // Set system type to microinverter
          [`${systemPrefix}selectedsystem`]: "microinverter",
          // Set microinverter make/model
          [`${systemPrefix}micro_inverter_make`]: microMake,
          [`${systemPrefix}micro_inverter_model`]: microModel,
          [`${systemPrefix}microinverter_existing`]: false,
        };

        console.log('[EquipmentDetails] Saving AC-integrated data directly to database (bypassing React state):', acIntegratedPayload);

        saveSystemDetailsPartialExact(projectID, acIntegratedPayload)
          .then(() => {
            // After DB save completes, update React state to trigger UI refresh
            // This ensures the microinverter section is visible
            if (systemType !== "microinverter") {
              console.log('[EquipmentDetails] DB save complete - updating systemType to trigger UI refresh');
              setSystemType("microinverter");
            }
          })
          .catch((error) => {
            console.error('[EquipmentDetails] Failed to save AC-integrated data:', error);
          });
      }
    } else {
      // Clear system-specific flag when AC-integrated is not active for this system
      setIsACIntegratedActive(prev => ({ ...prev, [systemPrefix]: false }));
    }
  }, [solarSection.isAcIntegrated, solarSection.integratedMicroMake, solarSection.integratedMicroModel, systemType, projectID, systemPrefix, isLoadingSystemData, solarLoadingData]);

  // =================================================================
  // MICROINVERTER QUANTITY SYNC (MICROINVERTERS ONLY!)
  // =================================================================
  // Sync microinverter quantity with solar panel quantity (1:1 ratio)
  // Exception: AP Systems, Hoymiles, and Hoymiles Power have different ratios, so skip them
  // Also skip sync if user has manually set a different quantity
  //
  // IMPORTANT: This sync ONLY applies to microinverters, NOT regular inverters!
  // Regular inverters (systemType === "inverter") always have an implicit quantity of 1
  // and do NOT have a quantity field in their UI or database schema (sys{N}_inverter_qty does not exist).
  // Only microinverters have sys{N}_micro_inverter_qty field.
  // =================================================================
  const [userModifiedMicroQty, setUserModifiedMicroQty] = useState(false);

  useEffect(() => {
    // Prevent cross-system contamination: don't run while data is loading
    if (isLoadingSystemData || solarLoadingData) return;

    // CRITICAL: Only sync for microinverters, never for regular inverters
    if (systemType !== "microinverter") {
      console.log('[EquipmentDetails] Skipping qty sync - not a microinverter system (systemType:', systemType, ')');
      return;
    }

    // Skip if AC-integrated (already handled in AC-integrated useEffect above)
    if (solarSection.isAcIntegrated) return;
    if (userModifiedMicroQty) return; // User manually changed quantity, don't override

    const microMake = microSection.selectedMakeLabel || microSection.selectedMakeValue;
    // Use partial matching to handle variations like "AP Systems, Inc.", "Hoymiles Energy", or "Hoymiles Power"
    const isNonStandardRatio =
      microMake?.includes("AP Systems") ||
      microMake?.includes("Hoymiles") ||
      (microMake?.includes("AP") && microMake?.includes("Systems"));

    // Only sync if not a non-standard ratio manufacturer
    if (!isNonStandardRatio && solarSection.quantity) {
      const shouldUpdate = microSection.quantity !== solarSection.quantity;

      if (shouldUpdate) {
        console.log('[EquipmentDetails] Syncing microinverter quantity with solar panel quantity:', {
          solarQuantity: solarSection.quantity,
          currentMicroQuantity: microSection.quantity,
          systemPrefix,
          systemType,
        });

        // Update React state
        setMicroSection((prev) => ({
          ...prev,
          quantity: solarSection.quantity,
        }));

        // Save to database (only micro_inverter_qty field)
        // Double-check systemType before saving as extra protection
        if (projectID && systemType === "microinverter") {
          const microQtyPayload = {
            [`${systemPrefix}micro_inverter_qty`]: Number(solarSection.quantity) || 0,
          };
          console.log('[EquipmentDetails] Saving synced microinverter quantity to database:', microQtyPayload);
          saveSystemDetailsPartialExact(projectID, microQtyPayload).catch((error) => {
            console.error('[EquipmentDetails] Failed to save synced microinverter quantity:', error);
          });
        } else if (projectID && systemType !== "microinverter") {
          console.error('[EquipmentDetails] ERROR: Attempted to save micro_inverter_qty but systemType is', systemType, '- this should never happen!');
        }
      }
    }
  }, [solarSection.quantity, systemType, microSection.selectedMakeLabel, microSection.selectedMakeValue, microSection.quantity, solarSection.isAcIntegrated, userModifiedMicroQty, projectID, systemPrefix, isLoadingSystemData, solarLoadingData]);

  // If backup option is cleared, reset ESS + Battery UI state
  useEffect(() => {
    if (backupOption !== "") return;

    setSmsSection((prev: any) => ({
      ...prev,
      isNew: true,
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      hasRSD: false,
      selectedMainBreaker: "",
      selectedBackupPanel: "",
      selectedPVBreaker: "",
      selectedESSBreaker: "",
      selectedTieInBreaker: "",
      activatePCS: false,
    }));

    setBattery1Section((prev: any) => ({
      ...prev,
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      configuration: "",
      isNew: true,
    }));

    setBattery2Section((prev: any) => ({
      ...prev,
      quantity: "",
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      configuration: "",
      isNew: true,
    }));

    setBackupSection((prev: any) => ({
      ...prev,
      selectedMakeLabel: "",
      selectedMakeValue: "",
      selectedModelLabel: "",
      selectedModelValue: "",
      busAmps: "",
      mainBreaker: "",
      isNew: true,
    }));

    removeBatteryType2();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupOption]);

  // Optionally prefetch inverter makes when inverter path becomes visible (once)
  const prefetchedInverterMakesRef = useRef(false);
  useEffect(() => {
    if (
      !prefetchedInverterMakesRef.current &&
      visible.inverter &&
      inverterMakes.length === 0
    ) {
      prefetchedInverterMakesRef.current = true;
      inverterLoadMakes?.();
    }
    // ONLY on visibility/makes length; don't depend on the (possibly unstable) function ref
  }, [visible.inverter, inverterMakes.length, inverterLoadMakes]);

  // ---- Value adapters (memoized) ---------------------------------------------
  const solarValues = useMemo(
    () => ({
      quantity: solarSection.quantity,
      selectedMake: solarSection.selectedMakeValue,
      selectedMakeLabel: solarSection.selectedMakeLabel,
      selectedModel: solarSection.selectedModelValue,
      selectedModelLabel: solarSection.selectedModelLabel,
      selectedPanelId: solarSection.selectedPanelId,
      isAcIntegrated: solarSection.isAcIntegrated,
      integratedMicroMake: solarSection.integratedMicroMake,
      integratedMicroModel: solarSection.integratedMicroModel,
      isNew: solarSection.isNew,
      isBatteryOnly: solarSection.isBatteryOnly,
      showSecondPanelType: solarSection.showSecondPanelType,
    }),
    [solarSection]
  );

  const solarType2Values = useMemo(
    () => ({
      quantity: solarType2Section.quantity,
      selectedMake: solarType2Section.selectedMakeValue,
      selectedMakeLabel: solarType2Section.selectedMakeLabel,
      selectedModel: solarType2Section.selectedModelValue,
      selectedModelLabel: solarType2Section.selectedModelLabel,
      isNew: solarType2Section.isNew,
    }),
    [solarType2Section]
  );

  const microValues = useMemo(
    () => ({
      quantity: microSection.quantity,
      selectedMake: microSection.selectedMakeValue,
      selectedMakeLabel: microSection.selectedMakeLabel,
      selectedModel: microSection.selectedModelValue,
      selectedModelLabel: microSection.selectedModelLabel,
      isNew: microSection.isNew,
      stringingType: microSection.stringingType,
    }),
    [microSection]
  );

  const combinerValues = useMemo(
    () => ({
      isNew: combinerSection.isNew,
      selectedMake: combinerSection.selectedMakeValue,
      selectedModel: combinerSection.selectedModelValue,
      selectedBusAmps: combinerSection.busAmps,
      selectedMainBreaker: combinerSection.mainBreaker,
      // Custom stringing branch fields
      branchString1: combinerSection.branchString1,
      branchString2: combinerSection.branchString2,
      branchString3: combinerSection.branchString3,
      branchString4: combinerSection.branchString4,
      branchString5: combinerSection.branchString5,
      branchString6: combinerSection.branchString6,
      branchString7: combinerSection.branchString7,
      branchString8: combinerSection.branchString8,
      // Get stringingType from microSection (controlled in microinverter section)
      stringingType: microSection.stringingType,
    }),
    [combinerSection, microSection.stringingType]
  );

  const inverterValues = useMemo(
    () => ({
      isNew: inverterSection.isNew,
      selectedMake: inverterSection.selectedMake,
      selectedModel: inverterSection.selectedModel,
      hybrid: inverterSection.hybrid,
    }),
    [inverterSection]
  );

  const optimizerValues = useMemo(
    () => {
      return {
        isNew: optimizerSection?.isNew ?? true,
        selectedMake: optimizerSection?.selectedMake ?? "",
        selectedModel: optimizerSection?.selectedModel ?? "",
      };
    },
    [optimizerSection]
  );

  // BOS Type 1 local state (TODO: move to useEquipmentDetails hook)
  const [showBOS, setShowBOS] = useState(false);
  const [showBOSType2, setShowBOSType2] = useState(false);
  const [showBOSType3, setShowBOSType3] = useState(false);
  const [showBOSType4, setShowBOSType4] = useState(false);
  const [showBOSType5, setShowBOSType5] = useState(false);
  const [showBOSType6, setShowBOSType6] = useState(false);

  // Removed bosTriggers state - now using trigger field in each BOS section state (persisted to DB)

  // Track whether BOS data has been hydrated from DB
  const [bosHydrated, setBosHydrated] = useState(false);


  // Header notification state
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Utility requirements state for auto-populating BOS equipment
  const [utilityRequirements, setUtilityRequirements] = useState<any>(null);

  // BOS Required Equipment Modal state
  const [showBOSModal, setShowBOSModal] = useState(false);
  const [bosModalResponse, setBosModalResponse] = useState<'yes' | 'no' | 'later' | null>(null);
  const [modalHasBeenShown, setModalHasBeenShown] = useState(false);

  // Modal handlers
  const handleBOSModalYes = useCallback((selectedIndices: number[]) => {
    console.log('[BOS Modal] User selected: Yes with indices:', selectedIndices);
    setBosModalResponse('yes');
    setShowBOSModal(false);
    setModalHasBeenShown(true);

    // Auto-insert BOS equipment from utility requirements
    if (!utilityRequirements) return;

    const { bos_1, bos_2, bos_3, bos_4, bos_5, bos_6, abbrev } = utilityRequirements;
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    console.log('[BOS Modal Yes] Auto-inserting equipment for utility:', abbrev);

    // ✅ CRITICAL: Prioritize required equipment (bos_1, bos_2) to ALWAYS land in slots 1 & 2
    // Order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 (required equipment FIRST)
    // This ensures that after string combiner panel, the most critical equipment is placed first
    const allRequirements = [
      { value: bos_1, label: 'bos_1' },
      { value: bos_2, label: 'bos_2' },
      { value: bos_3, label: 'bos_3' },
      { value: bos_4, label: 'bos_4' },
      { value: bos_5, label: 'bos_5' },
      { value: bos_6, label: 'bos_6' },
    ].filter(item => item.value); // Only keep items with values

    // Filter to only selected requirements based on checkbox indices
    const requirements = selectedIndices.map(index => allRequirements[index]);

    console.log('[BOS Modal Yes] Selected requirements (prioritized order):', requirements);

    // Insert into Type 1, Type 2, Type 3 sections
    if (requirements.length > 0) {
      const first = requirements[0];
      const translatedName = translateToUtilityVariation(abbrev, first.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 1 from ${first.label}: "${first.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosSection(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOS(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type1_equipment_type`]: translatedName,
          [`bos_${prefix}_type1_active`]: true,
          [`bos_${prefix}_type1_is_new`]: true,
          [`bos_${prefix}_type1_block_name`]: blockName,
        });
      }
    }

    if (requirements.length > 1) {
      const second = requirements[1];
      const translatedName = translateToUtilityVariation(abbrev, second.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 2 from ${second.label}: "${second.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosType2Section(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOSType2(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type2_equipment_type`]: translatedName,
          [`bos_${prefix}_type2_active`]: true,
          [`bos_${prefix}_type2_is_new`]: true,
          [`bos_${prefix}_type2_block_name`]: blockName,
        });
      }
    }

    if (requirements.length > 2) {
      const third = requirements[2];
      const translatedName = translateToUtilityVariation(abbrev, third.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 3 from ${third.label}: "${third.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosType3Section(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOSType3(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type3_equipment_type`]: translatedName,
          [`bos_${prefix}_type3_active`]: true,
          [`bos_${prefix}_type3_is_new`]: true,
          [`bos_${prefix}_type3_block_name`]: blockName,
        });
      }
    }

    if (requirements.length > 3) {
      const fourth = requirements[3];
      const translatedName = translateToUtilityVariation(abbrev, fourth.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 4 from ${fourth.label}: "${fourth.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosType4Section(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOSType4(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type4_equipment_type`]: translatedName,
          [`bos_${prefix}_type4_active`]: true,
          [`bos_${prefix}_type4_is_new`]: true,
          [`bos_${prefix}_type4_block_name`]: blockName,
        });
      }
    }

    if (requirements.length > 4) {
      const fifth = requirements[4];
      const translatedName = translateToUtilityVariation(abbrev, fifth.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 5 from ${fifth.label}: "${fifth.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosType5Section(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOSType5(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type5_equipment_type`]: translatedName,
          [`bos_${prefix}_type5_active`]: true,
          [`bos_${prefix}_type5_is_new`]: true,
          [`bos_${prefix}_type5_block_name`]: blockName,
        });
      }
    }

    if (requirements.length > 5) {
      const sixth = requirements[5];
      const translatedName = translateToUtilityVariation(abbrev, sixth.value);
      const trigger = `${prefix}_${bosSection.trigger || 'stringCombiner'}`;
      const blockName = getBOSBlockName(trigger, translatedName);
      console.log(`[BOS Modal Yes] Setting Type 6 from ${sixth.label}: "${sixth.value}" -> "${translatedName}" (block: "${blockName}")`);

      setBosType6Section(prev => ({
        ...prev,
        equipmentType: translatedName,
        isNew: true,
      }));
      setShowBOSType6(true);

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type6_equipment_type`]: translatedName,
          [`bos_${prefix}_type6_active`]: true,
          [`bos_${prefix}_type6_is_new`]: true,
          [`bos_${prefix}_type6_block_name`]: blockName,
        });
      }
    }
  }, [utilityRequirements, systemPrefix, projectID]);

  const handleBOSModalNo = useCallback(() => {
    console.log('[BOS Modal] User selected: No');
    setBosModalResponse('no');
    setShowBOSModal(false);
    setModalHasBeenShown(true);
    // Cascading buttons will be shown instead
  }, []);

  const handleBOSModalAskLater = useCallback(() => {
    console.log('[BOS Modal] User selected: Ask Me Later');
    setBosModalResponse('later');
    setShowBOSModal(false);
    // Modal will reappear next time they visit this section
    // modalHasBeenShown stays false so modal can show again
  }, []);

  const [bosSection, setBosSection] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [bosType2Section, setBosType2Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [bosType3Section, setBosType3Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [bosType4Section, setBosType4Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [bosType5Section, setBosType5Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [bosType6Section, setBosType6Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  // Track the SMS BOS slot position (loaded from bos_sys{N}_lastslot)
  const [smsLastSlot, setSmsLastSlot] = useState<number | null>(null);

  // Post SMS BOS state - for systems with batteries/ESS (only 3 types)
  // Equipment that goes AFTER the SMS (between SMS and main service panel)
  const [showPostSMSBOS, setShowPostSMSBOSLocal] = useState(false);
  const [showPostSMSBOSType2, setShowPostSMSBOSType2] = useState(false);
  const [showPostSMSBOSType3, setShowPostSMSBOSType3] = useState(false);

  const [postSMSBOSSection, setPostSMSBOSSection] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [postSMSBOSType2Section, setPostSMSBOSType2Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [postSMSBOSType3Section, setPostSMSBOSType3Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  // Battery Chain BOS state - Battery 1 (3 BOS slots)
  const [showBattery1BOS1, setShowBattery1BOS1] = useState(false);
  const [showBattery1BOS2, setShowBattery1BOS2] = useState(false);
  const [showBattery1BOS3, setShowBattery1BOS3] = useState(false);

  const [battery1BOS1Section, setBattery1BOS1Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [battery1BOS2Section, setBattery1BOS2Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [battery1BOS3Section, setBattery1BOS3Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  // Battery Chain BOS state - Battery 2 (3 BOS slots)
  const [showBattery2BOS1, setShowBattery2BOS1] = useState(false);
  const [showBattery2BOS2, setShowBattery2BOS2] = useState(false);
  const [showBattery2BOS3, setShowBattery2BOS3] = useState(false);

  const [battery2BOS1Section, setBattery2BOS1Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [battery2BOS2Section, setBattery2BOS2Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [battery2BOS3Section, setBattery2BOS3Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  // Backup Chain BOS state (3 BOS slots)
  const [showBackupBOS1, setShowBackupBOS1] = useState(false);
  const [showBackupBOS2, setShowBackupBOS2] = useState(false);
  const [showBackupBOS3, setShowBackupBOS3] = useState(false);

  const [backupBOS1Section, setBackupBOS1Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [backupBOS2Section, setBackupBOS2Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  const [backupBOS3Section, setBackupBOS3Section] = useState({
    isNew: true,
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    trigger: null as string | null,
  });

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper function to determine next available BOS slot and show it
  // triggerSection: 'stringCombiner', 'inverter', 'sms', 'battery1', 'battery2', 'postSMS'
  const showNextAvailableBOS = async (triggerSection: string, fromSlotPosition?: number) => {
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
    const fullTrigger = `${prefix}_${triggerSection}`; // e.g., 'sys1_stringCombiner', 'sys2_inverter'

    console.log(`[BOS] ${triggerSection} triggered showNextAvailableBOS${fromSlotPosition ? ` from slot ${fromSlotPosition}` : ''}`);

    // Main chain BOS slots (1-6)
    const bosSlots = [
      { num: 1, show: showBOS, setShow: setShowBOS, setState: setBosSection, type: bosSection.equipmentType, make: bosSection.make, model: bosSection.model },
      { num: 2, show: showBOSType2, setShow: setShowBOSType2, setState: setBosType2Section, type: bosType2Section.equipmentType, make: bosType2Section.make, model: bosType2Section.model },
      { num: 3, show: showBOSType3, setShow: setShowBOSType3, setState: setBosType3Section, type: bosType3Section.equipmentType, make: bosType3Section.make, model: bosType3Section.model },
      { num: 4, show: showBOSType4, setShow: setShowBOSType4, setState: setBosType4Section, type: bosType4Section.equipmentType, make: bosType4Section.make, model: bosType4Section.model },
      { num: 5, show: showBOSType5, setShow: setShowBOSType5, setState: setBosType5Section, type: bosType5Section.equipmentType, make: bosType5Section.make, model: bosType5Section.model },
      { num: 6, show: showBOSType6, setShow: setShowBOSType6, setState: setBosType6Section, type: bosType6Section.equipmentType, make: bosType6Section.make, model: bosType6Section.model },
    ];

    // Log current slot status for debugging
    console.log('[BOS] Current slot status:', bosSlots.map(s => `${s.num}:${s.type || 'empty'}`).join(', '));

    // Determine insertion slot based on where button was clicked
    let targetSlot: number;

    if (!fromSlotPosition) {
      // Called from inverter/string combiner - insert at front (slot 1)
      targetSlot = 1;
      console.log(`[BOS] Adding from ${triggerSection} - inserting at slot 1 (front of chain)`);
    } else {
      // Called from a BOS slot - insert after that slot
      targetSlot = fromSlotPosition + 1;
      console.log(`[BOS] Adding from slot ${fromSlotPosition} - inserting at slot ${targetSlot}`);
    }

    // Check if we have room (max 6 slots)
    const hasRoom = bosSlots.some(slot => !slot.show || !slot.type);
    if (!hasRoom) {
      console.log('[BOS] Chain full (6 slots max) - cannot add more equipment');
      return;
    }

    // If target slot is already occupied, we need to shift equipment backward
    const targetSlotData = bosSlots[targetSlot - 1];
    const needsShift = targetSlotData && (targetSlotData.show && targetSlotData.type);

    if (needsShift) {
      console.log(`[BOS] Target slot ${targetSlot} is occupied - will shift equipment backward to make room`);

      // Get current database state
      if (!projectID) return;
      const currentData = await fetchSystemDetails(projectID);
      if (!currentData) return;

      // Collect all equipment data from database (slots targetSlot through 6)
      const equipmentToShift: Array<{
        slotNum: number;
        data: Record<string, any>;
      }> = [];

      for (let i = targetSlot; i <= 6; i++) {
        const slotPrefix = `bos_${prefix}_type${i}`;
        const equipmentType = currentData[`${slotPrefix}_equipment_type`];

        if (equipmentType) {
          equipmentToShift.push({
            slotNum: i,
            data: {
              equipment_type: equipmentType,
              make: currentData[`${slotPrefix}_make`],
              model: currentData[`${slotPrefix}_model`],
              amp_rating: currentData[`${slotPrefix}_amp_rating`],
              is_new: currentData[`${slotPrefix}_is_new`],
              trigger: currentData[`${slotPrefix}_trigger`],
              block_name: currentData[`${slotPrefix}_block_name`],
              active: currentData[`${slotPrefix}_active`],
            },
          });
        }
      }

      console.log(`[BOS] Shifting ${equipmentToShift.length} equipment pieces backward:`,
        equipmentToShift.map(e => `Slot ${e.slotNum} → ${e.slotNum + 1}`).join(', '));

      // Shift equipment backward (start from end to avoid overwriting)
      const updates: Record<string, any> = {};
      for (let i = equipmentToShift.length - 1; i >= 0; i--) {
        const equipment = equipmentToShift[i];
        const newSlotNum = equipment.slotNum + 1;
        const newSlotPrefix = `bos_${prefix}_type${newSlotNum}`;

        updates[`${newSlotPrefix}_equipment_type`] = equipment.data.equipment_type;
        updates[`${newSlotPrefix}_make`] = equipment.data.make;
        updates[`${newSlotPrefix}_model`] = equipment.data.model;
        updates[`${newSlotPrefix}_amp_rating`] = equipment.data.amp_rating;
        updates[`${newSlotPrefix}_is_new`] = equipment.data.is_new;
        updates[`${newSlotPrefix}_trigger`] = equipment.data.trigger;
        updates[`${newSlotPrefix}_block_name`] = equipment.data.block_name;
        updates[`${newSlotPrefix}_active`] = equipment.data.active;
      }

      // Add new equipment to target slot
      updates[`bos_${prefix}_type${targetSlot}_trigger`] = fullTrigger;
      updates[`bos_${prefix}_type${targetSlot}_active`] = true;
      updates[`bos_${prefix}_type${targetSlot}_equipment_type`] = null; // Will be filled by user
      updates[`bos_${prefix}_type${targetSlot}_make`] = null;
      updates[`bos_${prefix}_type${targetSlot}_model`] = null;
      updates[`bos_${prefix}_type${targetSlot}_amp_rating`] = null;
      updates[`bos_${prefix}_type${targetSlot}_is_new`] = true;
      updates[`bos_${prefix}_type${targetSlot}_block_name`] = null;

      console.log(`[BOS] Saving ${Object.keys(updates).length} field updates for insertion`);
      await saveSystemDetailsPartialExact(projectID, updates);

      // Update UI state - shift visible slots backward
      for (let i = equipmentToShift.length - 1; i >= 0; i--) {
        const equipment = equipmentToShift[i];
        const newSlotNum = equipment.slotNum + 1;
        const newSlotData = bosSlots[newSlotNum - 1];

        if (newSlotData) {
          newSlotData.setShow(true);
          newSlotData.setState({
            equipmentType: equipment.data.equipment_type,
            make: equipment.data.make,
            model: equipment.data.model,
            ampRating: equipment.data.amp_rating,
            isNew: equipment.data.is_new,
            trigger: equipment.data.trigger,
          });
        }
      }

      // Open the target slot for user to fill
      targetSlotData.setShow(true);
      targetSlotData.setState({
        isNew: true,
        equipmentType: "",
        ampRating: "",
        make: "",
        model: "",
        trigger: fullTrigger,
      });

      console.log(`[BOS] Insertion complete - slot ${targetSlot} is now open for new equipment`);
    } else {
      // Target slot is empty - just open it
      console.log(`[BOS] Opening empty slot ${targetSlot}`);
      targetSlotData.setShow(true);
      targetSlotData.setState(prev => ({ ...prev, trigger: fullTrigger }));

      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_type${targetSlot}_trigger`]: fullTrigger,
          [`bos_${prefix}_type${targetSlot}_active`]: true,
        });
      }
    }
  };

  // Helper function for Post SMS BOS - equipment AFTER SMS (supports 3 types)
  const showNextAvailablePostSMSBOS = () => {
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
    const fullTrigger = `${prefix}_postSMS`;

    // Check which Post SMS BOS slots are currently showing (not filled, showing)
    // We check the state variables, not the equipment type, because a section
    // might have old data from a previous save but be hidden (active: false)
    const isType1Showing = showPostSMSBOS;
    const isType2Showing = showPostSMSBOSType2;
    const isType3Showing = showPostSMSBOSType3;

    // Find the first available slot
    if (!isType1Showing) {
      console.log(`[Post SMS BOS] Opening Type 1`);
      setShowPostSMSBOSLocal(true);
      setPostSMSBOSSection(prev => ({ ...prev, trigger: fullTrigger }));
      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`post_sms_bos_${prefix}_type1_trigger`]: fullTrigger,
          [`post_sms_bos_${prefix}_type1_active`]: true,
        });
      }
    } else if (!isType2Showing) {
      console.log(`[Post SMS BOS] Opening Type 2`);
      setShowPostSMSBOSType2(true);
      setPostSMSBOSType2Section(prev => ({ ...prev, trigger: fullTrigger }));
      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`post_sms_bos_${prefix}_type2_trigger`]: fullTrigger,
          [`post_sms_bos_${prefix}_type2_active`]: true,
        });
      }
    } else if (!isType3Showing) {
      console.log(`[Post SMS BOS] Opening Type 3`);
      setShowPostSMSBOSType3(true);
      setPostSMSBOSType3Section(prev => ({ ...prev, trigger: fullTrigger }));
      if (projectID) {
        void saveSystemDetailsPartialExact(projectID, {
          [`post_sms_bos_${prefix}_type3_trigger`]: fullTrigger,
          [`post_sms_bos_${prefix}_type3_active`]: true,
        });
      }
    } else {
      console.log('[Post SMS BOS] All slots (1-3) are filled - cannot add more');
    }
  };

  // Render function for draggable BOS items
  const renderDraggableBOSItem = useCallback(({ item, drag, isActive }: RenderItemParams<BOSItem>) => {
    const prefix = systemPrefix.replace('_', '');

    // Extract triggerName from the item's trigger field
    // Format: "sys1_stringCombiner" -> "stringCombiner"
    const itemTriggerName = item.data.trigger ? item.data.trigger.replace(`${prefix}_`, '') : '';

    // Map position to correct Section component
    const BOSComponent = (() => {
      switch (item.position) {
        case 1: return BOSType1Section;
        case 2: return BOSType2Section;
        case 3: return BOSType3Section;
        case 4: return BOSType4Section;
        case 5: return BOSType5Section;
        default: return null;
      }
    })();

    if (!BOSComponent) return null;

    // Show "Add Pre-Combine BOS" button if:
    // - This is not slot 6 (slot 6 is the last slot, no "add next" button)
    // - AND slot 6 is not occupied (there's room to push marbles backward)
    const showAddNextButton = item.position < 6 && !showBOSType6;

    const addNextButtonProp = (() => {
      switch (item.position) {
        case 1: return { showAddBOSType2Button: showAddNextButton, onAddBOSType2: () => showNextAvailableBOS(itemTriggerName, item.position) };
        case 2: return { showAddBOSType3Button: showAddNextButton, onAddBOSType3: () => showNextAvailableBOS(itemTriggerName, item.position) };
        case 3: return { showAddBOSType4Button: showAddNextButton, onAddBOSType4: () => showNextAvailableBOS(itemTriggerName, item.position) };
        case 4: return { showAddBOSType5Button: showAddNextButton, onAddBOSType5: () => showNextAvailableBOS(itemTriggerName, item.position) };
        case 5: return { showAddBOSType6Button: showAddNextButton, onAddBOSType6: () => showNextAvailableBOS(itemTriggerName, item.position) };
        default: return {};
      }
    })();

    return (
      <ScaleDecorator>
        <View style={[styles.bosItemContainer, isActive && styles.bosItemDragging]}>
          <TouchableOpacity
            onLongPress={drag}
            style={styles.dragHandle}
            activeOpacity={0.7}
          >
            <Text style={styles.dragHandleIcon}>⋮⋮</Text>
          </TouchableOpacity>
          <View style={styles.bosContentWrapper}>
            <BOSComponent
              key={`bos${item.position}-${systemPrefix}`}
              values={{
                isNew: item.data.isNew,
                equipmentType: item.data.equipmentType,
                ampRating: item.data.ampRating,
                make: item.data.make,
                model: item.data.model,
              }}
              label={item.label}
              onChange={async (field, val) => {
                // Update local state
                const updatedData = { ...item.data, [field]: val };
                item.setter(updatedData);

                if (projectID) {
                  const updates: any = {
                    [`bos_${prefix}_type${item.position}_${field === 'isNew' ? 'is_new' : field.replace(/([A-Z])/g, '_$1').toLowerCase()}`]: val,
                  };

                  // If equipment type changed, recalculate block name
                  if (field === 'equipmentType' && item.data.trigger) {
                    const blockName = getBOSBlockName(item.data.trigger, val);
                    updates[`bos_${prefix}_type${item.position}_block_name`] = blockName;
                  }

                  await saveSystemDetailsPartialExact(projectID, updates);

                  // Check if this slot is now complete (all required fields filled)
                  const isComplete = updatedData.equipmentType && updatedData.make && updatedData.model && updatedData.ampRating;

                  if (isComplete) {
                    console.log(`[MARBLE TUBE] 🔵 New marble added to slot ${item.position} (${updatedData.equipmentType})`);
                    console.log(`[MARBLE TUBE] Checking if marbles need reordering...`);

                    // Trigger compaction to ensure proper ordering (Pre-Combine → System-Core → Post-SMS)
                    const currentData = await fetchSystemDetails(projectID);
                    await compactBOSSlots(systemPrefix, projectID, currentData);

                    // Refresh UI to show compacted slots
                    console.log(`[MARBLE TUBE] Refreshing UI after marble addition...`);
                  }
                }
              }}
              onRemove={async () => {
                item.setter({ isNew: true, equipmentType: "", ampRating: "", make: "", model: "", trigger: null });
                // Update show state based on position
                switch (item.position) {
                  case 1: setShowBOS(false); break;
                  case 2: setShowBOSType2(false); break;
                  case 3: setShowBOSType3(false); break;
                  case 4: setShowBOSType4(false); break;
                  case 5: setShowBOSType5(false); break;
                }
                if (projectID) {
                  // Clear the slot
                  await saveSystemDetailsPartialExact(projectID, {
                    [`bos_${prefix}_type${item.position}_equipment_type`]: null,
                    [`bos_${prefix}_type${item.position}_amp_rating`]: null,
                    [`bos_${prefix}_type${item.position}_make`]: null,
                    [`bos_${prefix}_type${item.position}_model`]: null,
                    [`bos_${prefix}_type${item.position}_is_new`]: null,
                    [`bos_${prefix}_type${item.position}_trigger`]: null,
                    [`bos_${prefix}_type${item.position}_block_name`]: null,
                  });

                  // Trigger automatic slot compaction
                  console.log(`[MARBLE TUBE] 🔴 Marble removed from slot ${item.position}`);
                  console.log(`[MARBLE TUBE] Marbles will shift forward to fill gap...`);
                  const currentData = await fetchSystemDetails(projectID);
                  await compactBOSSlots(systemPrefix, projectID, currentData);

                  // Refresh UI to show compacted slots
                  console.log(`[MARBLE TUBE] Refreshing UI after marble removal...`);
                }
              }}
              {...addNextButtonProp}
              errors={{}}
              maxContinuousOutputAmps={maxContinuousOutputAmps}
              loadingMaxOutput={loadingMaxOutput}
              utilityAbbrev={utilityRequirements?.abbrev}
            />
          </View>
        </View>
      </ScaleDecorator>
    );
  }, [
    systemPrefix, projectID,
    showBOSType2, showBOSType3, showBOSType4, showBOSType5, showBOSType6,
    maxContinuousOutputAmps, loadingMaxOutput, utilityRequirements,
    showNextAvailableBOS, setShowBOS, setShowBOSType2, setShowBOSType3, setShowBOSType4, setShowBOSType5,
  ]);

  // Helper function to render BOS sections for a specific trigger section
  // This allows BOS sections to appear right after the section that triggered them
  // NOTE: BOS sections handle their own equipment catalog internally
  /**
   * Render standard/utility BOS equipment for a given trigger
   *
   * IMPORTANT: This function is for STANDARD BOS ONLY (pre-combine utility BOS)
   * It checks bosSection/bosType2Section/etc state variables (positions 1-6)
   *
   * DO NOT use for battery or backup BOS - they have dedicated components:
   * - Battery BOS: <BatteryChainBOS> (uses battery1BOS1Section, battery1BOS2Section, battery1BOS3Section)
   * - Backup BOS: <BackupChainBOS> (uses backupBOS1Section, backupBOS2Section, backupBOS3Section)
   *
   * Valid triggers: 'stringCombiner', 'inverter', 'sms', 'postSMS'
   * Invalid triggers: 'battery1', 'battery2', 'backup' (handled by dedicated components)
   */
  const renderBOSForTrigger = (triggerName: string) => {
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
    const fullTrigger = `${prefix}_${triggerName}`; // e.g., 'sys1_stringCombiner', 'sys2_inverter'

    // SAFETY CHECK: Prevent this function from being used for battery/backup BOS
    if (triggerName === 'battery1' || triggerName === 'battery2' || triggerName === 'backup') {
      console.error(`[BOS Render] ERROR: renderBOSForTrigger called with '${triggerName}' - this should use dedicated chain component instead!`);
      return null;
    }

    console.log(`[BOS Render] Checking trigger '${fullTrigger}' for section '${triggerName}'`, {
      showBOS,
      type1Trigger: bosSection.trigger,
      showBOSType2,
      type2Trigger: bosType2Section.trigger,
      showBOSType3,
      type3Trigger: bosType3Section.trigger,
      showBOSType4,
      type4Trigger: bosType4Section.trigger,
      showBOSType5,
      type5Trigger: bosType5Section.trigger,
      showBOSType6,
      type6Trigger: bosType6Section.trigger,
    });

    // Build BOS items list for this trigger
    const bosItemsList: BOSItem[] = [];

    // Only include items that are visible and match the current trigger
    if (showBOS && bosSection.trigger === fullTrigger && bosSection.equipmentType !== 'SMS') {
      bosItemsList.push({
        key: 'bos1',
        position: 1,
        data: bosSection,
        setter: setBosSection,
        showState: showBOS,
        label: `BOS Equipment 1 ${systemNumber}`,
      });
    }

    if (showBOSType2 && bosType2Section.trigger === fullTrigger && bosType2Section.equipmentType !== 'SMS') {
      bosItemsList.push({
        key: 'bos2',
        position: 2,
        data: bosType2Section,
        setter: setBosType2Section,
        showState: showBOSType2,
        label: `BOS Equipment 2 ${systemNumber}`,
      });
    }

    if (showBOSType3 && bosType3Section.trigger === fullTrigger && bosType3Section.equipmentType !== 'SMS') {
      bosItemsList.push({
        key: 'bos3',
        position: 3,
        data: bosType3Section,
        setter: setBosType3Section,
        showState: showBOSType3,
        label: `BOS Equipment 3 ${systemNumber}`,
      });
    }

    if (showBOSType4 && bosType4Section.trigger === fullTrigger && bosType4Section.equipmentType !== 'SMS') {
      bosItemsList.push({
        key: 'bos4',
        position: 4,
        data: bosType4Section,
        setter: setBosType4Section,
        showState: showBOSType4,
        label: `BOS Equipment 4 ${systemNumber}`,
      });
    }

    if (showBOSType5 && bosType5Section.trigger === fullTrigger && bosType5Section.equipmentType !== 'SMS') {
      bosItemsList.push({
        key: 'bos5',
        position: 5,
        data: bosType5Section,
        setter: setBosType5Section,
        showState: showBOSType5,
        label: `BOS Equipment 5 ${systemNumber}`,
      });
    }

    // Use drag-and-drop list for BOS Equipment 1-5 (skip if SMS - hidden in UI)
    const draggableBOSList = bosItemsList.length > 0 ? (
      <DraggableFlatList
        key={`draggable-bos-${systemPrefix}-${triggerName}`}
        data={bosItemsList}
        renderItem={renderDraggableBOSItem}
        keyExtractor={(item) => item.key}
        onDragBegin={() => setIsDragging(true)}
        onDragEnd={({ data }) => {
          setIsDragging(false);
          void handleBOSReorder(data);
        }}
        activationDistance={20}
        containerStyle={{ flex: 1 }}
        scrollEnabled={false}
      />
    ) : null;

    const bosComponents: JSX.Element[] = [];
    if (draggableBOSList) {
      bosComponents.push(draggableBOSList);
    }

    // BOS Type 6 (skip if SMS - hidden in UI)
    if (showBOSType6 && bosType6Section.trigger === fullTrigger && bosType6Section.equipmentType !== 'SMS') {
      bosComponents.push(
        <BOSType6Section
          key={`bos6-${systemPrefix}`}
          values={{
            isNew: bosType6Section.isNew,
            equipmentType: bosType6Section.equipmentType,
            ampRating: bosType6Section.ampRating,
            make: bosType6Section.make,
            model: bosType6Section.model,
          }}
          label={`BOS Equipment 6 ${systemNumber}`}
          onChange={async (field, val) => {
            // Update local state
            const updatedData = { ...bosType6Section, [field]: val };
            setBosType6Section(updatedData);

            if (projectID) {
              await saveSystemDetailsPartialExact(projectID, {
                [`bos_${prefix}_type6_${field === 'isNew' ? 'is_new' : field.replace(/([A-Z])/g, '_$1').toLowerCase()}`]: val,
              });

              // Check if this slot is now complete
              const isComplete = updatedData.equipmentType && updatedData.make && updatedData.model && updatedData.ampRating;

              if (isComplete) {
                console.log(`[MARBLE TUBE] 🔵 New marble added to slot 6 (${updatedData.equipmentType})`);
                console.log(`[MARBLE TUBE] Checking if marbles need reordering...`);

                const currentData = await fetchSystemDetails(projectID);
                await compactBOSSlots(systemPrefix, projectID, currentData);

                console.log(`[MARBLE TUBE] Refreshing UI after marble addition...`);
              }
            }
          }}
          onRemove={async () => {
            setBosType6Section({ isNew: true, equipmentType: "", ampRating: "", make: "", model: "", trigger: null });
            setShowBOSType6(false);
            if (projectID) {
              // Clear the slot
              await saveSystemDetailsPartialExact(projectID, {
                [`bos_${prefix}_type6_equipment_type`]: null,
                [`bos_${prefix}_type6_amp_rating`]: null,
                [`bos_${prefix}_type6_make`]: null,
                [`bos_${prefix}_type6_model`]: null,
                [`bos_${prefix}_type6_is_new`]: null,
                [`bos_${prefix}_type6_trigger`]: null,
              });

              // Trigger automatic slot compaction
              console.log(`[MARBLE TUBE] 🔴 Marble removed from slot 6`);
              console.log(`[MARBLE TUBE] Marbles will shift forward to fill gap...`);
              const currentData = await fetchSystemDetails(projectID);
              await compactBOSSlots(systemPrefix, projectID, currentData);

              console.log(`[MARBLE TUBE] Refreshing UI after marble removal...`);
            }
          }}
          errors={{}}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
          utilityAbbrev={utilityRequirements?.abbrev}
        />
      );
    }

    return bosComponents.length > 0 ? <>{bosComponents}</> : null;
  };

  // Render Post SMS BOS sections - equipment AFTER SMS (between SMS and main service panel)
  // Max continuous output = inverter/micro output + battery output
  // Min amp rating filter = backup subpanel bus rating (minimum 100 amps)
  const renderPostSMSBOS = () => {
    const bosComponents: JSX.Element[] = [];
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    // Calculate minimum amp rating based on backup subpanel bus rating AND utility service amperage
    // Equipment must be rated for at least the larger of the two (minimum 100 amps)
    const backupPanelBusRating = parseInt(backupSection.busAmps) || 0;
    const utilityServiceRating = parseInt(utilityServiceAmps) || 0;
    const batteryAmps = maxContinuousOutputAmps || 0;

    // Use the MAXIMUM of all three for conservative sizing
    const desiredMinAmps = Math.max(
      backupPanelBusRating,
      utilityServiceRating,
      batteryAmps,
      100  // Minimum default
    );

    // BOS sections multiply by 1.25 for safety margin, but for Post SMS BOS we want
    // the exact panel rating. So we divide by 1.25 here, and it becomes correct after
    // the BOS section multiplies it back up.
    // Example: 200 amp panel -> 200 / 1.25 = 160 -> BOS multiplies: 160 * 1.25 = 200
    const minAmpRatingFilter = desiredMinAmps / 1.25;

    console.log(`[Post SMS BOS Render] Amp sizing for system ${prefix}:`, {
      showPostSMSBOS,
      showType2: showPostSMSBOSType2,
      showType3: showPostSMSBOSType3,
      backupPanelBusRating,
      utilityServiceRating,
      batteryAmps,
      desiredMinAmps,
      minAmpRatingFilter: minAmpRatingFilter.toFixed(2),
      'After 1.25x multiplier in BOS': (minAmpRatingFilter * 1.25).toFixed(2),
      source: backupPanelBusRating >= utilityServiceRating && backupPanelBusRating >= batteryAmps
        ? 'backup panel'
        : utilityServiceRating >= batteryAmps
          ? 'utility service'
          : 'battery output',
    });

    // Post SMS BOS Type 1
    if (showPostSMSBOS) {
      bosComponents.push(
        <BOSType1Section
          key={`post-sms-bos1-${systemPrefix}`}
          values={{
            isNew: postSMSBOSSection.isNew,
            equipmentType: postSMSBOSSection.equipmentType,
            ampRating: postSMSBOSSection.ampRating,
            make: postSMSBOSSection.make,
            model: postSMSBOSSection.model,
          }}
          label={`${systemLabel} - Post SMS BOS Equipment 1`}
          onChange={async (field, val) => {
            setPostSMSBOSSection((prev) => ({ ...prev, [field]: val }));
            console.log('[Post-SMS BOS Type 1] onChange:', { field, val, projectID });

            if (!projectID) {
              console.log('[Post-SMS BOS Type 1] Save blocked - no projectID');
              return;
            }

            console.log(`[Post-SMS BOS Type 1] Saving to post_sms_bos_${prefix}_type1 fields`);

            const fieldName = field === 'isNew' ? 'is_new' : field.replace(/([A-Z])/g, '_$1').toLowerCase();
            const updates: any = {
              [`post_sms_bos_${prefix}_type1_${fieldName}`]: val,
            };

            // If equipment type changed, recalculate block name
            if (field === 'equipmentType' && postSMSBOSSection.trigger) {
              const blockName = getBOSBlockName(postSMSBOSSection.trigger, val);
              updates[`post_sms_bos_${prefix}_type1_block_name`] = blockName;
            }

            // When make or model is selected, also save is_new with current state
            // This ensures the default "New" value is saved even if toggle isn't changed
            if (field === 'make' || field === 'model') {
              updates[`post_sms_bos_${prefix}_type1_is_new`] = postSMSBOSSection.isNew;
            }

            void saveSystemDetailsPartialExact(projectID, updates);
          }}
          onRemove={async () => {
            setPostSMSBOSSection({ isNew: true, equipmentType: "", ampRating: "", make: "", model: "", trigger: null });
            setShowPostSMSBOSLocal(false);

            if (!projectID) return;

            console.log(`[Post-SMS BOS Type 1] Removing equipment`);

            // Clear the Post SMS BOS Type 1 slot
            await saveSystemDetailsPartialExact(projectID, {
              [`post_sms_bos_${prefix}_type1_equipment_type`]: null,
              [`post_sms_bos_${prefix}_type1_amp_rating`]: null,
              [`post_sms_bos_${prefix}_type1_make`]: null,
              [`post_sms_bos_${prefix}_type1_model`]: null,
              [`post_sms_bos_${prefix}_type1_is_new`]: null,
              [`post_sms_bos_${prefix}_type1_trigger`]: null,
              [`post_sms_bos_${prefix}_type1_block_name`]: null,
              [`post_sms_bos_${prefix}_type1_active`]: null,
            });

            console.log(`[Post-SMS BOS Type 1] Equipment removed successfully`);
          }}
          showAddBOSType2Button={!showPostSMSBOSType2}
          onAddBOSType2={showNextAvailablePostSMSBOS}
          addButtonLabel="Post SMS BOS Equipment"
          hideMaxOutput={true}
          errors={{}}
          maxContinuousOutputAmps={minAmpRatingFilter}
          loadingMaxOutput={false}
          utilityAbbrev={utilityRequirements?.abbrev}
        />
      );
    }

    // Post SMS BOS Type 2
    if (showPostSMSBOSType2) {
      bosComponents.push(
        <BOSType2Section
          key={`post-sms-bos2-${systemPrefix}`}
          values={{
            isNew: postSMSBOSType2Section.isNew,
            equipmentType: postSMSBOSType2Section.equipmentType,
            ampRating: postSMSBOSType2Section.ampRating,
            make: postSMSBOSType2Section.make,
            model: postSMSBOSType2Section.model,
          }}
          label={`${systemLabel} - Post SMS BOS Equipment 2`}
          onChange={async (field, val) => {
            setPostSMSBOSType2Section((prev) => ({ ...prev, [field]: val }));
            console.log('[Post-SMS BOS Type 2] onChange:', { field, val, projectID });

            if (!projectID) return;

            console.log(`[Post-SMS BOS Type 2] Saving to post_sms_bos_${prefix}_type2 fields`);

            const fieldName = field === 'isNew' ? 'is_new' : field.replace(/([A-Z])/g, '_$1').toLowerCase();
            const updates: any = {
              [`post_sms_bos_${prefix}_type2_${fieldName}`]: val,
            };

            // If equipment type changed, recalculate block name
            if (field === 'equipmentType' && postSMSBOSType2Section.trigger) {
              const blockName = getBOSBlockName(postSMSBOSType2Section.trigger, val);
              updates[`post_sms_bos_${prefix}_type2_block_name`] = blockName;
            }

            // When make or model is selected, also save is_new with current state
            // This ensures the default "New" value is saved even if toggle isn't changed
            if (field === 'make' || field === 'model') {
              updates[`post_sms_bos_${prefix}_type2_is_new`] = postSMSBOSType2Section.isNew;
            }

            void saveSystemDetailsPartialExact(projectID, updates);
          }}
          onRemove={async () => {
            setPostSMSBOSType2Section({ isNew: true, equipmentType: "", ampRating: "", make: "", model: "", trigger: null });
            setShowPostSMSBOSType2(false);

            if (!projectID) return;

            console.log(`[Post-SMS BOS Type 2] Removing equipment`);

            // Clear the Post SMS BOS Type 2 slot
            await saveSystemDetailsPartialExact(projectID, {
              [`post_sms_bos_${prefix}_type2_equipment_type`]: null,
              [`post_sms_bos_${prefix}_type2_amp_rating`]: null,
              [`post_sms_bos_${prefix}_type2_make`]: null,
              [`post_sms_bos_${prefix}_type2_model`]: null,
              [`post_sms_bos_${prefix}_type2_is_new`]: null,
              [`post_sms_bos_${prefix}_type2_trigger`]: null,
              [`post_sms_bos_${prefix}_type2_block_name`]: null,
              [`post_sms_bos_${prefix}_type2_active`]: null,
            });

            console.log(`[Post-SMS BOS Type 2] Equipment removed successfully`);
          }}
          showAddBOSType3Button={!showPostSMSBOSType3}
          onAddBOSType3={showNextAvailablePostSMSBOS}
          addButtonLabel="Post SMS BOS Equipment"
          hideMaxOutput={true}
          errors={{}}
          maxContinuousOutputAmps={minAmpRatingFilter}
          loadingMaxOutput={false}
          utilityAbbrev={utilityRequirements?.abbrev}
        />
      );
    }

    // Post SMS BOS Type 3
    if (showPostSMSBOSType3) {
      bosComponents.push(
        <BOSType3Section
          key={`post-sms-bos3-${systemPrefix}`}
          values={{
            isNew: postSMSBOSType3Section.isNew,
            equipmentType: postSMSBOSType3Section.equipmentType,
            ampRating: postSMSBOSType3Section.ampRating,
            make: postSMSBOSType3Section.make,
            model: postSMSBOSType3Section.model,
          }}
          label={`${systemLabel} - Post SMS BOS Equipment 3`}
          onChange={async (field, val) => {
            setPostSMSBOSType3Section((prev) => ({ ...prev, [field]: val }));
            console.log('[Post-SMS BOS Type 3] onChange:', { field, val, projectID });

            if (!projectID) return;

            console.log(`[Post-SMS BOS Type 3] Saving to post_sms_bos_${prefix}_type3 fields`);

            const fieldName = field === 'isNew' ? 'is_new' : field.replace(/([A-Z])/g, '_$1').toLowerCase();
            const updates: any = {
              [`post_sms_bos_${prefix}_type3_${fieldName}`]: val,
            };

            // If equipment type changed, recalculate block name
            if (field === 'equipmentType' && postSMSBOSType3Section.trigger) {
              const blockName = getBOSBlockName(postSMSBOSType3Section.trigger, val);
              updates[`post_sms_bos_${prefix}_type3_block_name`] = blockName;
            }

            // When make or model is selected, also save is_new with current state
            // This ensures the default "New" value is saved even if toggle isn't changed
            if (field === 'make' || field === 'model') {
              updates[`post_sms_bos_${prefix}_type3_is_new`] = postSMSBOSType3Section.isNew;
            }

            void saveSystemDetailsPartialExact(projectID, updates);
          }}
          onRemove={async () => {
            setPostSMSBOSType3Section({ isNew: true, equipmentType: "", ampRating: "", make: "", model: "", trigger: null });
            setShowPostSMSBOSType3(false);

            if (!projectID) return;

            console.log(`[Post-SMS BOS Type 3] Removing equipment`);

            // Clear the Post SMS BOS Type 3 slot
            await saveSystemDetailsPartialExact(projectID, {
              [`post_sms_bos_${prefix}_type3_equipment_type`]: null,
              [`post_sms_bos_${prefix}_type3_amp_rating`]: null,
              [`post_sms_bos_${prefix}_type3_make`]: null,
              [`post_sms_bos_${prefix}_type3_model`]: null,
              [`post_sms_bos_${prefix}_type3_is_new`]: null,
              [`post_sms_bos_${prefix}_type3_trigger`]: null,
              [`post_sms_bos_${prefix}_type3_block_name`]: null,
              [`post_sms_bos_${prefix}_type3_active`]: null,
            });

            console.log(`[Post-SMS BOS Type 3] Equipment removed successfully`);
          }}
          errors={{}}
          maxContinuousOutputAmps={minAmpRatingFilter}
          loadingMaxOutput={false}
          utilityAbbrev={utilityRequirements?.abbrev}
        />
      );
    }

    return bosComponents.length > 0 ? <>{bosComponents}</> : null;
  };

  // Load BOS data from database when system changes (each system has independent BOS)
  useEffect(() => {
    const loadBOSData = async () => {
      if (!projectID) return;

      console.log('[BOS Hydration] useEffect triggered - loading BOS data', {
        systemPrefix,
        projectID,
        lastDataRefresh,
        timestamp: new Date().toISOString()
      });

      try {
        const systemData = await fetchSystemDetails(projectID);
        if (!systemData) return;

        const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
        const systemDetails = systemData;

    // Load BOS Type 1
    const type1EquipmentType = systemDetails[`bos_${prefix}_type1_equipment_type`] || "";
    const type1Make = systemDetails[`bos_${prefix}_type1_make`] || "";
    const type1Model = systemDetails[`bos_${prefix}_type1_model`] || "";
    const type1AmpRating = systemDetails[`bos_${prefix}_type1_amp_rating`] || "";
    const type1IsNew = systemDetails[`bos_${prefix}_type1_is_new`] !== false; // default to true
    const type1Active = systemDetails[`bos_${prefix}_type1_active`] === true;
    const type1Trigger = systemDetails[`bos_${prefix}_type1_trigger`] || null;

    console.log(`[BOS Type 1 Hydration] ${prefix}:`, {
      equipmentType: type1EquipmentType,
      ampRating: type1AmpRating,
      make: type1Make,
      model: type1Model,
      active: type1Active,
      trigger: type1Trigger,
      willShow: type1Active,
      activeFieldKey: `bos_${prefix}_type1_active`,
      activeFieldRawValue: systemDetails[`bos_${prefix}_type1_active`],
      activeFieldType: typeof systemDetails[`bos_${prefix}_type1_active`],
      rawDbValues: {
        equipmentType: systemDetails[`bos_${prefix}_type1_equipment_type`],
        ampRating: systemDetails[`bos_${prefix}_type1_amp_rating`],
        make: systemDetails[`bos_${prefix}_type1_make`],
        model: systemDetails[`bos_${prefix}_type1_model`],
        trigger: systemDetails[`bos_${prefix}_type1_trigger`],
        active: systemDetails[`bos_${prefix}_type1_active`],
      }
    });

    setBosSection({
      isNew: type1IsNew,
      equipmentType: type1EquipmentType,
      ampRating: type1AmpRating,
      make: type1Make,
      model: type1Model,
      trigger: type1Trigger,
    });
    setShowBOS(type1Active);

    // Load BOS Type 2
    const type2EquipmentType = systemDetails[`bos_${prefix}_type2_equipment_type`] || "";
    const type2Make = systemDetails[`bos_${prefix}_type2_make`] || "";
    const type2Model = systemDetails[`bos_${prefix}_type2_model`] || "";
    const type2AmpRating = systemDetails[`bos_${prefix}_type2_amp_rating`] || "";
    const type2IsNew = systemDetails[`bos_${prefix}_type2_is_new`] !== false;
    const type2Active = systemDetails[`bos_${prefix}_type2_active`] === true;
    const type2Trigger = systemDetails[`bos_${prefix}_type2_trigger`] || null;

    console.log(`[BOS Type 2 Hydration] ${prefix}:`, {
      equipmentType: type2EquipmentType,
      ampRating: type2AmpRating,
      make: type2Make,
      model: type2Model,
      active: type2Active,
      trigger: type2Trigger,
      willShow: type2Active,
      activeFieldKey: `bos_${prefix}_type2_active`,
      activeFieldRawValue: systemDetails[`bos_${prefix}_type2_active`],
      activeFieldType: typeof systemDetails[`bos_${prefix}_type2_active`],
      rawDbValues: {
        equipmentType: systemDetails[`bos_${prefix}_type2_equipment_type`],
        ampRating: systemDetails[`bos_${prefix}_type2_amp_rating`],
        make: systemDetails[`bos_${prefix}_type2_make`],
        model: systemDetails[`bos_${prefix}_type2_model`],
        trigger: systemDetails[`bos_${prefix}_type2_trigger`],
        active: systemDetails[`bos_${prefix}_type2_active`],
      }
    });

    setBosType2Section({
      isNew: type2IsNew,
      equipmentType: type2EquipmentType,
      ampRating: type2AmpRating,
      make: type2Make,
      model: type2Model,
      trigger: type2Trigger,
    });
    setShowBOSType2(type2Active);

    // Load BOS Type 3
    const type3EquipmentType = systemDetails[`bos_${prefix}_type3_equipment_type`] || "";
    const type3Make = systemDetails[`bos_${prefix}_type3_make`] || "";
    const type3Model = systemDetails[`bos_${prefix}_type3_model`] || "";
    const type3AmpRating = systemDetails[`bos_${prefix}_type3_amp_rating`] || "";
    const type3IsNew = systemDetails[`bos_${prefix}_type3_is_new`] !== false;
    const type3Active = systemDetails[`bos_${prefix}_type3_active`] === true;
    const type3Trigger = systemDetails[`bos_${prefix}_type3_trigger`] || null;

    setBosType3Section({
      isNew: type3IsNew,
      equipmentType: type3EquipmentType,
      ampRating: type3AmpRating,
      make: type3Make,
      model: type3Model,
      trigger: type3Trigger,
    });
    setShowBOSType3(type3Active);

    // Load BOS Type 4
    const type4EquipmentType = systemDetails[`bos_${prefix}_type4_equipment_type`] || "";
    const type4Make = systemDetails[`bos_${prefix}_type4_make`] || "";
    const type4Model = systemDetails[`bos_${prefix}_type4_model`] || "";
    const type4AmpRating = systemDetails[`bos_${prefix}_type4_amp_rating`] || "";
    const type4IsNew = systemDetails[`bos_${prefix}_type4_is_new`] !== false;
    const type4Active = systemDetails[`bos_${prefix}_type4_active`] === true;
    const type4Trigger = systemDetails[`bos_${prefix}_type4_trigger`] || null;

    setBosType4Section({
      isNew: type4IsNew,
      equipmentType: type4EquipmentType,
      ampRating: type4AmpRating,
      make: type4Make,
      model: type4Model,
      trigger: type4Trigger,
    });
    setShowBOSType4(type4Active);

    // Load BOS Type 5
    const type5EquipmentType = systemDetails[`bos_${prefix}_type5_equipment_type`] || "";
    const type5Make = systemDetails[`bos_${prefix}_type5_make`] || "";
    const type5Model = systemDetails[`bos_${prefix}_type5_model`] || "";
    const type5AmpRating = systemDetails[`bos_${prefix}_type5_amp_rating`] || "";
    const type5IsNew = systemDetails[`bos_${prefix}_type5_is_new`] !== false;
    const type5Active = systemDetails[`bos_${prefix}_type5_active`] === true;
    const type5Trigger = systemDetails[`bos_${prefix}_type5_trigger`] || null;

    setBosType5Section({
      isNew: type5IsNew,
      equipmentType: type5EquipmentType,
      ampRating: type5AmpRating,
      make: type5Make,
      model: type5Model,
      trigger: type5Trigger,
    });
    setShowBOSType5(type5Active);

    // Load BOS Type 6
    const type6EquipmentType = systemDetails[`bos_${prefix}_type6_equipment_type`] || "";
    const type6Make = systemDetails[`bos_${prefix}_type6_make`] || "";
    const type6Model = systemDetails[`bos_${prefix}_type6_model`] || "";
    const type6AmpRating = systemDetails[`bos_${prefix}_type6_amp_rating`] || "";
    const type6IsNew = systemDetails[`bos_${prefix}_type6_is_new`] !== false;
    const type6Active = systemDetails[`bos_${prefix}_type6_active`] === true;
    const type6Trigger = systemDetails[`bos_${prefix}_type6_trigger`] || null;

    setBosType6Section({
      isNew: type6IsNew,
      equipmentType: type6EquipmentType,
      ampRating: type6AmpRating,
      make: type6Make,
      model: type6Model,
      trigger: type6Trigger,
    });
    setShowBOSType6(type6Active);

    // Load Battery 1 Chain BOS (3 slots)
    const battery1Type1EquipmentType = systemDetails[`bos_${prefix}_battery1_type1_equipment_type`] || "";
    const battery1Type1Make = systemDetails[`bos_${prefix}_battery1_type1_make`] || "";
    const battery1Type1Model = systemDetails[`bos_${prefix}_battery1_type1_model`] || "";
    const battery1Type1AmpRating = systemDetails[`bos_${prefix}_battery1_type1_amp_rating`] || "";
    const battery1Type1IsNew = systemDetails[`bos_${prefix}_battery1_type1_is_new`] !== false;
    const battery1Type1Trigger = systemDetails[`bos_${prefix}_battery1_type1_trigger`] || null;

    console.log(`[Battery1 BOS1 Hydration] ${prefix}:`, {
      equipmentType: battery1Type1EquipmentType,
      make: battery1Type1Make,
      model: battery1Type1Model,
      ampRating: battery1Type1AmpRating,
      trigger: battery1Type1Trigger,
      willShow: !!battery1Type1EquipmentType,
      fieldName: `bos_${prefix}_battery1_type1_equipment_type`,
      rawValue: systemDetails[`bos_${prefix}_battery1_type1_equipment_type`]
    });

    setBattery1BOS1Section({
      isNew: battery1Type1IsNew,
      equipmentType: battery1Type1EquipmentType,
      ampRating: battery1Type1AmpRating,
      make: battery1Type1Make,
      model: battery1Type1Model,
      trigger: battery1Type1Trigger,
    });
    setShowBattery1BOS1(!!battery1Type1EquipmentType);

    const battery1Type2EquipmentType = systemDetails[`bos_${prefix}_battery1_type2_equipment_type`] || "";
    const battery1Type2Make = systemDetails[`bos_${prefix}_battery1_type2_make`] || "";
    const battery1Type2Model = systemDetails[`bos_${prefix}_battery1_type2_model`] || "";
    const battery1Type2AmpRating = systemDetails[`bos_${prefix}_battery1_type2_amp_rating`] || "";
    const battery1Type2IsNew = systemDetails[`bos_${prefix}_battery1_type2_is_new`] !== false;
    const battery1Type2Trigger = systemDetails[`bos_${prefix}_battery1_type2_trigger`] || null;

    console.log(`[Battery1 BOS2 Hydration] ${prefix}:`, {
      equipmentType: battery1Type2EquipmentType,
      make: battery1Type2Make,
      model: battery1Type2Model,
      ampRating: battery1Type2AmpRating,
      trigger: battery1Type2Trigger,
      willShow: !!battery1Type2EquipmentType,
      fieldName: `bos_${prefix}_battery1_type2_equipment_type`,
      rawValue: systemDetails[`bos_${prefix}_battery1_type2_equipment_type`]
    });

    setBattery1BOS2Section({
      isNew: battery1Type2IsNew,
      equipmentType: battery1Type2EquipmentType,
      ampRating: battery1Type2AmpRating,
      make: battery1Type2Make,
      model: battery1Type2Model,
      trigger: battery1Type2Trigger,
    });
    setShowBattery1BOS2(!!battery1Type2EquipmentType);

    const battery1Type3EquipmentType = systemDetails[`bos_${prefix}_battery1_type3_equipment_type`] || "";
    const battery1Type3Make = systemDetails[`bos_${prefix}_battery1_type3_make`] || "";
    const battery1Type3Model = systemDetails[`bos_${prefix}_battery1_type3_model`] || "";
    const battery1Type3AmpRating = systemDetails[`bos_${prefix}_battery1_type3_amp_rating`] || "";
    const battery1Type3IsNew = systemDetails[`bos_${prefix}_battery1_type3_is_new`] !== false;
    const battery1Type3Trigger = systemDetails[`bos_${prefix}_battery1_type3_trigger`] || null;

    console.log(`[Battery1 BOS3 Hydration] ${prefix}:`, {
      equipmentType: battery1Type3EquipmentType,
      make: battery1Type3Make,
      model: battery1Type3Model,
      ampRating: battery1Type3AmpRating,
      trigger: battery1Type3Trigger,
      willShow: !!battery1Type3EquipmentType,
      fieldName: `bos_${prefix}_battery1_type3_equipment_type`,
      rawValue: systemDetails[`bos_${prefix}_battery1_type3_equipment_type`]
    });

    setBattery1BOS3Section({
      isNew: battery1Type3IsNew,
      equipmentType: battery1Type3EquipmentType,
      ampRating: battery1Type3AmpRating,
      make: battery1Type3Make,
      model: battery1Type3Model,
      trigger: battery1Type3Trigger,
    });
    setShowBattery1BOS3(!!battery1Type3EquipmentType);

    // Load Battery 2 Chain BOS (3 slots)
    const battery2Type1EquipmentType = systemDetails[`bos_${prefix}_battery2_type1_equipment_type`] || "";
    const battery2Type1Make = systemDetails[`bos_${prefix}_battery2_type1_make`] || "";
    const battery2Type1Model = systemDetails[`bos_${prefix}_battery2_type1_model`] || "";
    const battery2Type1AmpRating = systemDetails[`bos_${prefix}_battery2_type1_amp_rating`] || "";
    const battery2Type1IsNew = systemDetails[`bos_${prefix}_battery2_type1_is_new`] !== false;
    const battery2Type1Trigger = systemDetails[`bos_${prefix}_battery2_type1_trigger`] || null;

    setBattery2BOS1Section({
      isNew: battery2Type1IsNew,
      equipmentType: battery2Type1EquipmentType,
      ampRating: battery2Type1AmpRating,
      make: battery2Type1Make,
      model: battery2Type1Model,
      trigger: battery2Type1Trigger,
    });
    setShowBattery2BOS1(!!battery2Type1EquipmentType);

    const battery2Type2EquipmentType = systemDetails[`bos_${prefix}_battery2_type2_equipment_type`] || "";
    const battery2Type2Make = systemDetails[`bos_${prefix}_battery2_type2_make`] || "";
    const battery2Type2Model = systemDetails[`bos_${prefix}_battery2_type2_model`] || "";
    const battery2Type2AmpRating = systemDetails[`bos_${prefix}_battery2_type2_amp_rating`] || "";
    const battery2Type2IsNew = systemDetails[`bos_${prefix}_battery2_type2_is_new`] !== false;
    const battery2Type2Trigger = systemDetails[`bos_${prefix}_battery2_type2_trigger`] || null;

    setBattery2BOS2Section({
      isNew: battery2Type2IsNew,
      equipmentType: battery2Type2EquipmentType,
      ampRating: battery2Type2AmpRating,
      make: battery2Type2Make,
      model: battery2Type2Model,
      trigger: battery2Type2Trigger,
    });
    setShowBattery2BOS2(!!battery2Type2EquipmentType);

    const battery2Type3EquipmentType = systemDetails[`bos_${prefix}_battery2_type3_equipment_type`] || "";
    const battery2Type3Make = systemDetails[`bos_${prefix}_battery2_type3_make`] || "";
    const battery2Type3Model = systemDetails[`bos_${prefix}_battery2_type3_model`] || "";
    const battery2Type3AmpRating = systemDetails[`bos_${prefix}_battery2_type3_amp_rating`] || "";
    const battery2Type3IsNew = systemDetails[`bos_${prefix}_battery2_type3_is_new`] !== false;
    const battery2Type3Trigger = systemDetails[`bos_${prefix}_battery2_type3_trigger`] || null;

    setBattery2BOS3Section({
      isNew: battery2Type3IsNew,
      equipmentType: battery2Type3EquipmentType,
      ampRating: battery2Type3AmpRating,
      make: battery2Type3Make,
      model: battery2Type3Model,
      trigger: battery2Type3Trigger,
    });
    setShowBattery2BOS3(!!battery2Type3EquipmentType);

    // Load Backup Chain BOS (3 slots)
    const backupType1EquipmentType = systemDetails[`bos_${prefix}_backup_type1_equipment_type`] || "";
    const backupType1Make = systemDetails[`bos_${prefix}_backup_type1_make`] || "";
    const backupType1Model = systemDetails[`bos_${prefix}_backup_type1_model`] || "";
    const backupType1AmpRating = systemDetails[`bos_${prefix}_backup_type1_amp_rating`] || "";
    const backupType1IsNew = systemDetails[`bos_${prefix}_backup_type1_is_new`] !== false;
    const backupType1Trigger = systemDetails[`bos_${prefix}_backup_type1_trigger`] || null;

    setBackupBOS1Section({
      isNew: backupType1IsNew,
      equipmentType: backupType1EquipmentType,
      ampRating: backupType1AmpRating,
      make: backupType1Make,
      model: backupType1Model,
      trigger: backupType1Trigger,
    });
    setShowBackupBOS1(!!backupType1EquipmentType);

    const backupType2EquipmentType = systemDetails[`bos_${prefix}_backup_type2_equipment_type`] || "";
    const backupType2Make = systemDetails[`bos_${prefix}_backup_type2_make`] || "";
    const backupType2Model = systemDetails[`bos_${prefix}_backup_type2_model`] || "";
    const backupType2AmpRating = systemDetails[`bos_${prefix}_backup_type2_amp_rating`] || "";
    const backupType2IsNew = systemDetails[`bos_${prefix}_backup_type2_is_new`] !== false;
    const backupType2Trigger = systemDetails[`bos_${prefix}_backup_type2_trigger`] || null;

    setBackupBOS2Section({
      isNew: backupType2IsNew,
      equipmentType: backupType2EquipmentType,
      ampRating: backupType2AmpRating,
      make: backupType2Make,
      model: backupType2Model,
      trigger: backupType2Trigger,
    });
    setShowBackupBOS2(!!backupType2EquipmentType);

    const backupType3EquipmentType = systemDetails[`bos_${prefix}_backup_type3_equipment_type`] || "";
    const backupType3Make = systemDetails[`bos_${prefix}_backup_type3_make`] || "";
    const backupType3Model = systemDetails[`bos_${prefix}_backup_type3_model`] || "";
    const backupType3AmpRating = systemDetails[`bos_${prefix}_backup_type3_amp_rating`] || "";
    const backupType3IsNew = systemDetails[`bos_${prefix}_backup_type3_is_new`] !== false;
    const backupType3Trigger = systemDetails[`bos_${prefix}_backup_type3_trigger`] || null;

    setBackupBOS3Section({
      isNew: backupType3IsNew,
      equipmentType: backupType3EquipmentType,
      ampRating: backupType3AmpRating,
      make: backupType3Make,
      model: backupType3Model,
      trigger: backupType3Trigger,
    });
    setShowBackupBOS3(!!backupType3EquipmentType);

    // Load SMS lastslot position for Post-SMS BOS positioning
    const lastslot = systemDetails[`bos_${prefix}_lastslot`] || null;
    setSmsLastSlot(lastslot);

    // Mark hydration as complete - this signals that we've checked the DB
    // If no BOS data was found (all equipment types empty), auto-populate will run
    setBosHydrated(true);

    console.log(`[BOS Hydration Complete] ${prefix}:`, {
      hasType1: !!type1EquipmentType,
      hasType2: !!type2EquipmentType,
      hasType3: !!type3EquipmentType,
      hasType4: !!type4EquipmentType,
      hasType5: !!type5EquipmentType,
      hasType6: !!type6EquipmentType,
      type1Active,
      type2Active,
      type3Active,
      type4Active,
      type5Active,
      type6Active,
      hasBattery1BOS1: !!battery1Type1EquipmentType,
      hasBattery1BOS2: !!battery1Type2EquipmentType,
      hasBattery1BOS3: !!battery1Type3EquipmentType,
      hasBattery2BOS1: !!battery2Type1EquipmentType,
      hasBattery2BOS2: !!battery2Type2EquipmentType,
      hasBattery2BOS3: !!battery2Type3EquipmentType,
      hasBackupBOS1: !!backupType1EquipmentType,
      hasBackupBOS2: !!backupType2EquipmentType,
      hasBackupBOS3: !!backupType3EquipmentType,
    });
      } catch (error) {
        console.error("[BOS] Error loading BOS data:", error);
        setBosHydrated(true); // Mark complete even on error
      }
    };

    // Reset hydration flag when system changes
    setBosHydrated(false);
    loadBOSData();
  }, [systemPrefix, projectID, lastDataRefresh]);

  // Load Post SMS BOS data from database when system changes
  // Post-SMS BOS now loads from dedicated post_sms_bos fields
  useEffect(() => {
    const loadPostSMSBOSData = async () => {
      if (!projectID) return;

      console.log('[Post-SMS BOS Hydration] useEffect triggered - loading Post-SMS BOS data', {
        systemPrefix,
        projectID,
        lastDataRefresh,
        timestamp: new Date().toISOString()
      });

      try {
        const systemData = await fetchSystemDetails(projectID);
        if (!systemData) return;

        const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
        const systemDetails = systemData;

        // Load Post SMS BOS Type 1 from dedicated fields
        const postType1EquipmentType = systemDetails[`post_sms_bos_${prefix}_type1_equipment_type`] || "";
        const postType1Make = systemDetails[`post_sms_bos_${prefix}_type1_make`] || "";
        const postType1Model = systemDetails[`post_sms_bos_${prefix}_type1_model`] || "";
        const postType1AmpRating = systemDetails[`post_sms_bos_${prefix}_type1_amp_rating`] || "";
        const postType1IsNew = systemDetails[`post_sms_bos_${prefix}_type1_is_new`] !== false; // default to true
        const postType1Trigger = systemDetails[`post_sms_bos_${prefix}_type1_trigger`] || null;
        const postType1Active = systemDetails[`post_sms_bos_${prefix}_type1_active`] === true;

        console.log(`[Post SMS BOS Type 1 Hydration] ${prefix}:`, {
          equipmentType: postType1EquipmentType,
          ampRating: postType1AmpRating,
          make: postType1Make,
          model: postType1Model,
          isNew: postType1IsNew,
          trigger: postType1Trigger,
          active: postType1Active,
          willShow: postType1Active && !!postType1EquipmentType,
        });

        setPostSMSBOSSection({
          isNew: postType1IsNew,
          equipmentType: postType1EquipmentType,
          ampRating: postType1AmpRating,
          make: postType1Make,
          model: postType1Model,
          trigger: postType1Trigger,
        });
        setShowPostSMSBOSLocal(postType1Active && !!postType1EquipmentType);

        // Load Post SMS BOS Type 2 from dedicated fields
        const postType2EquipmentType = systemDetails[`post_sms_bos_${prefix}_type2_equipment_type`] || "";
        const postType2Make = systemDetails[`post_sms_bos_${prefix}_type2_make`] || "";
        const postType2Model = systemDetails[`post_sms_bos_${prefix}_type2_model`] || "";
        const postType2AmpRating = systemDetails[`post_sms_bos_${prefix}_type2_amp_rating`] || "";
        const postType2IsNew = systemDetails[`post_sms_bos_${prefix}_type2_is_new`] !== false; // default to true
        const postType2Trigger = systemDetails[`post_sms_bos_${prefix}_type2_trigger`] || null;
        const postType2Active = systemDetails[`post_sms_bos_${prefix}_type2_active`] === true;

        console.log(`[Post SMS BOS Type 2 Hydration] ${prefix}:`, {
          equipmentType: postType2EquipmentType,
          ampRating: postType2AmpRating,
          make: postType2Make,
          model: postType2Model,
          isNew: postType2IsNew,
          trigger: postType2Trigger,
          active: postType2Active,
          willShow: postType2Active && !!postType2EquipmentType,
        });

        setPostSMSBOSType2Section({
          isNew: postType2IsNew,
          equipmentType: postType2EquipmentType,
          ampRating: postType2AmpRating,
          make: postType2Make,
          model: postType2Model,
          trigger: postType2Trigger,
        });
        setShowPostSMSBOSType2(postType2Active && !!postType2EquipmentType);

        // Load Post SMS BOS Type 3 from dedicated fields
        const postType3EquipmentType = systemDetails[`post_sms_bos_${prefix}_type3_equipment_type`] || "";
        const postType3Make = systemDetails[`post_sms_bos_${prefix}_type3_make`] || "";
        const postType3Model = systemDetails[`post_sms_bos_${prefix}_type3_model`] || "";
        const postType3AmpRating = systemDetails[`post_sms_bos_${prefix}_type3_amp_rating`] || "";
        const postType3IsNew = systemDetails[`post_sms_bos_${prefix}_type3_is_new`] !== false; // default to true
        const postType3Trigger = systemDetails[`post_sms_bos_${prefix}_type3_trigger`] || null;
        const postType3Active = systemDetails[`post_sms_bos_${prefix}_type3_active`] === true;

        console.log(`[Post SMS BOS Type 3 Hydration] ${prefix}:`, {
          equipmentType: postType3EquipmentType,
          ampRating: postType3AmpRating,
          make: postType3Make,
          model: postType3Model,
          isNew: postType3IsNew,
          trigger: postType3Trigger,
          active: postType3Active,
          willShow: postType3Active && !!postType3EquipmentType,
        });

        setPostSMSBOSType3Section({
          isNew: postType3IsNew,
          equipmentType: postType3EquipmentType,
          ampRating: postType3AmpRating,
          make: postType3Make,
          model: postType3Model,
          trigger: postType3Trigger,
        });
        setShowPostSMSBOSType3(postType3Active && !!postType3EquipmentType);

        console.log(`[Post SMS BOS Hydration Complete] ${prefix}:`, {
          hasType1: postType1Active && !!postType1EquipmentType,
          hasType2: postType2Active && !!postType2EquipmentType,
          hasType3: postType3Active && !!postType3EquipmentType,
        });
      } catch (error) {
        console.error("[Post SMS BOS] Error loading data:", error);
      }
    };

    loadPostSMSBOSData();
  }, [systemPrefix, projectID, lastDataRefresh]);

  // Helper function to determine correct BOS slot for SMS (always after all non-SMS BOS items)
  const getSMSBOSSlot = useCallback((): { slot: 1 | 2 | 3 | 4 | 5 | 6 | null, currentSMSSlot: number | null } => {
    const bosSlots = [
      { num: 1, equipmentType: bosSection.equipmentType, isActive: showBOS, make: bosSection.make, model: bosSection.model },
      { num: 2, equipmentType: bosType2Section.equipmentType, isActive: showBOSType2, make: bosType2Section.make, model: bosType2Section.model },
      { num: 3, equipmentType: bosType3Section.equipmentType, isActive: showBOSType3, make: bosType3Section.make, model: bosType3Section.model },
      { num: 4, equipmentType: bosType4Section.equipmentType, isActive: showBOSType4, make: bosType4Section.make, model: bosType4Section.model },
      { num: 5, equipmentType: bosType5Section.equipmentType, isActive: showBOSType5, make: bosType5Section.make, model: bosType5Section.model },
      { num: 6, equipmentType: bosType6Section.equipmentType, isActive: showBOSType6, make: bosType6Section.make, model: bosType6Section.model },
    ];

    console.log('[getSMSBOSSlot] Current BOS state:', bosSlots.map(s => ({
      num: s.num,
      type: s.equipmentType,
      active: s.isActive,
      make: s.make,
      model: s.model
    })));

    // Find where SMS currently is (if anywhere)
    // Check for exact "SMS" type OR use intelligent detection for various SMS types
    let currentSMSSlot = bosSlots.find(s => s.equipmentType === 'SMS')?.num || null;

    // If not found with exact match, check for SMS-like equipment (Gateway, Storage Management, etc.)
    if (!currentSMSSlot) {
      currentSMSSlot = bosSlots.find(s => {
        if (!s.equipmentType) return false;
        const lower = s.equipmentType.toLowerCase();
        // Check for common SMS indicators
        return lower === 'sms' ||
               lower.includes('storage management') ||
               lower.includes('gateway') ||
               (s.make?.toLowerCase() === 'tesla' && s.model?.toLowerCase().includes('gateway'));
      })?.num || null;
    }

    // Count non-SMS BOS items that are active
    // Use intelligent SMS detection to avoid counting SMS-like equipment
    const nonSMSBOSCount = bosSlots.filter(s => {
      if (!s.isActive || !s.equipmentType) return false;
      if (s.equipmentType === 'SMS') return false;

      // Check if this is SMS-like equipment
      const lower = s.equipmentType.toLowerCase();
      const isSMSLike = lower.includes('storage management') ||
                        lower.includes('gateway') ||
                        (s.make?.toLowerCase() === 'tesla' && s.model?.toLowerCase().includes('gateway'));

      return !isSMSLike;
    }).length;

    // SMS should go in the slot right after all non-SMS BOS items
    const targetSlot = (nonSMSBOSCount + 1) as 1 | 2 | 3 | 4 | 5 | 6;

    console.log('[getSMSBOSSlot] Calculation:', {
      currentSMSSlot,
      nonSMSBOSCount,
      targetSlot
    });

    // Make sure we don't exceed 6 slots
    if (targetSlot > 6) return { slot: null, currentSMSSlot };

    return { slot: targetSlot, currentSMSSlot };
  }, [
    bosSection.equipmentType, bosSection.make, bosSection.model, showBOS,
    bosType2Section.equipmentType, bosType2Section.make, bosType2Section.model, showBOSType2,
    bosType3Section.equipmentType, bosType3Section.make, bosType3Section.model, showBOSType3,
    bosType4Section.equipmentType, bosType4Section.make, bosType4Section.model, showBOSType4,
    bosType5Section.equipmentType, bosType5Section.make, bosType5Section.model, showBOSType5,
    bosType6Section.equipmentType, bosType6Section.make, bosType6Section.model, showBOSType6,
  ]);

  // Helper function to save SMS to a BOS slot (always at the end of occupied slots)
  const saveSMSToBOSSlot = useCallback(async (make: string, model: string, isNew: boolean) => {
    if (!projectID) return;

    const { slot } = getSMSBOSSlot();

    if (!slot) {
      console.log('[SMS] No available BOS slot for SMS');
      return;
    }

    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    console.log(`[SMS] Saving SMS to BOS slot ${slot}:`, { make, model, isNew });

    try {
      await saveSystemDetailsPartialExact(projectID, {
        [`bos_${prefix}_type${slot}_equipment_type`]: 'SMS',
        [`bos_${prefix}_type${slot}_make`]: make,
        [`bos_${prefix}_type${slot}_model`]: model,
        [`bos_${prefix}_type${slot}_amp_rating`]: '', // SMS doesn't have amp rating
        [`bos_${prefix}_type${slot}_is_new`]: isNew,
        [`bos_${prefix}_type${slot}_trigger`]: `${prefix}`, // Main chain trigger
        [`bos_${prefix}_lastslot`]: slot, // Save the slot number for Post-SMS BOS positioning
      });

      // Update local state
      setSmsLastSlot(slot);

      console.log(`[SMS] Successfully saved SMS to BOS slot ${slot}, lastslot = ${slot}`);
    } catch (error) {
      console.error('[SMS] Error saving SMS to BOS slot:', error);
    }
  }, [projectID, systemPrefix, getSMSBOSSlot]);

  // Helper function to get or calculate SMS lastslot position
  // If smsLastSlot state is null, calculates it from current BOS data and saves to DB
  const getOrCalculateSMSLastSlot = useCallback(async (): Promise<number | null> => {
    // If we already have smsLastSlot in state, return it
    if (smsLastSlot !== null) {
      console.log('[SMS LastSlot] Using cached value:', smsLastSlot);
      return smsLastSlot;
    }

    // Otherwise, calculate it from current BOS data
    const { currentSMSSlot } = getSMSBOSSlot();

    if (!currentSMSSlot) {
      console.log('[SMS LastSlot] No SMS found in BOS slots');
      return null;
    }

    console.log('[SMS LastSlot] Calculated from BOS data:', currentSMSSlot);

    // Save the calculated value to database for future use
    if (projectID) {
      const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1
      try {
        await saveSystemDetailsPartialExact(projectID, {
          [`bos_${prefix}_lastslot`]: currentSMSSlot,
        });
        // Update local state
        setSmsLastSlot(currentSMSSlot);
        console.log('[SMS LastSlot] Saved calculated value to database:', currentSMSSlot);
      } catch (error) {
        console.error('[SMS LastSlot] Error saving to database:', error);
      }
    }

    return currentSMSSlot;
  }, [smsLastSlot, getSMSBOSSlot, projectID, systemPrefix]);

  // Helper function to clear SMS from BOS slot
  const clearSMSFromBOSSlot = useCallback(async () => {
    if (!projectID) return;

    const { currentSMSSlot } = getSMSBOSSlot();

    if (!currentSMSSlot) {
      console.log('[SMS] No SMS in BOS slots to clear');
      return;
    }

    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    console.log(`[SMS] Clearing SMS from BOS slot ${currentSMSSlot}`);

    try {
      await saveSystemDetailsPartialExact(projectID, {
        [`bos_${prefix}_type${currentSMSSlot}_equipment_type`]: null,
        [`bos_${prefix}_type${currentSMSSlot}_make`]: null,
        [`bos_${prefix}_type${currentSMSSlot}_model`]: null,
        [`bos_${prefix}_type${currentSMSSlot}_amp_rating`]: null,
        [`bos_${prefix}_type${currentSMSSlot}_is_new`]: null,
        [`bos_${prefix}_type${currentSMSSlot}_trigger`]: null,
        [`bos_${prefix}_lastslot`]: null, // Clear the lastslot field when SMS is removed
      });

      // Update local state
      setSmsLastSlot(null);

      console.log(`[SMS] Successfully cleared SMS from BOS slot ${currentSMSSlot} and lastslot`);
    } catch (error) {
      console.error('[SMS] Error clearing SMS from BOS slot:', error);
    }
  }, [projectID, systemPrefix, getSMSBOSSlot]);

  // ============================================================================
  // THREE-CHAIN BOS SYSTEM WITH REORDERING
  // ============================================================================
  //
  // ARCHITECTURE OVERVIEW:
  // ----------------------
  // This system uses three independent chains for equipment organization:
  //
  // 1. MAIN CHAIN (for String Combiner/Inverter path):
  //    - Slots 1-5: User-reorderable BOS equipment (use ↑↓ arrows)
  //    - Slot 1-6: SMS automatically positions at end of occupied slots
  //    - SMS saved to BOTH dedicated fields (sys1_sms_*) AND bos_sys1_type{X}_* slots
  //    - SMS always occupies last occupied slot + 1 (dynamically determined)
  //    - User can reorder positions 1-5 freely with up/down arrows
  //
  // 2. BATTERY CHAIN (for Battery/ESS path):
  //    - Slot 0: Battery equipment (fixed)
  //    - Slots 1-2: User-reorderable BOS equipment
  //
  // 3. BACKUP CHAIN (for Backup Panel path):
  //    - Slot 0: Backup panel (fixed)
  //    - Slots 1-2: User-reorderable BOS equipment
  //
  // KEY FEATURES:
  // -------------
  // - No automatic repositioning (eliminated all complex positioning logic)
  // - SMS always at conceptual "position 6" (fixed, not movable)
  // - Users control order with ↑↓ arrows
  // - Chains are completely independent
  // - Clear boundaries: max 5 BOS + 1 SMS in main chain
  //
  // BENEFITS:
  // ---------
  // - Predictable: same actions = same results
  // - No overwrites: SMS doesn't fight with BOS for slots
  // - User control: explicit reordering instead of automatic
  // - Simple debugging: clear logs for every action
  //
  // ============================================================================

  /**
   * Move equipment up or down within the main chain (positions 1-5)
   * Swaps the equipment at currentPosition with adjacent position
   * @param currentPosition Current position (1-5)
   * @param direction 'up' or 'down'
   */
  const moveMainChainEquipment = async (currentPosition: number, direction: 'up' | 'down') => {
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

    // Boundary checks
    if (newPosition < 1 || newPosition > 5) {
      console.log(`[Reorder] Cannot move position ${currentPosition} ${direction} - boundary reached`);
      return;
    }

    if (!projectID) return;
    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    // Get current and target section data
    const getSectionByPosition = (pos: number) => {
      switch (pos) {
        case 1: return { data: bosSection, setter: setBosSection };
        case 2: return { data: bosType2Section, setter: setBosType2Section };
        case 3: return { data: bosType3Section, setter: setBosType3Section };
        case 4: return { data: bosType4Section, setter: setBosType4Section };
        case 5: return { data: bosType5Section, setter: setBosType5Section };
        default: return null;
      }
    };

    const currentSection = getSectionByPosition(currentPosition);
    const targetSection = getSectionByPosition(newPosition);

    if (!currentSection || !targetSection) return;

    // Check if current position has equipment
    if (!currentSection.data.equipmentType) {
      console.log(`[Reorder] No equipment at position ${currentPosition} to move`);
      return;
    }

    console.log(`[Reorder] Moving ${currentSection.data.equipmentType} from position ${currentPosition} to ${newPosition}`);

    try {
      // Prepare the swap data
      const updates: any = {};

      // Move current equipment to new position
      updates[`bos_${prefix}_type${newPosition}_equipment_type`] = currentSection.data.equipmentType;
      updates[`bos_${prefix}_type${newPosition}_make`] = currentSection.data.make;
      updates[`bos_${prefix}_type${newPosition}_model`] = currentSection.data.model;
      updates[`bos_${prefix}_type${newPosition}_amp_rating`] = currentSection.data.ampRating;
      updates[`bos_${prefix}_type${newPosition}_is_new`] = currentSection.data.isNew;
      updates[`bos_${prefix}_type${newPosition}_active`] = true;
      updates[`bos_${prefix}_type${newPosition}_trigger`] = currentSection.data.trigger;

      // Move target equipment to current position (or clear if empty)
      if (targetSection.data.equipmentType) {
        // Swap with existing equipment
        updates[`bos_${prefix}_type${currentPosition}_equipment_type`] = targetSection.data.equipmentType;
        updates[`bos_${prefix}_type${currentPosition}_make`] = targetSection.data.make;
        updates[`bos_${prefix}_type${currentPosition}_model`] = targetSection.data.model;
        updates[`bos_${prefix}_type${currentPosition}_amp_rating`] = targetSection.data.ampRating;
        updates[`bos_${prefix}_type${currentPosition}_is_new`] = targetSection.data.isNew;
        updates[`bos_${prefix}_type${currentPosition}_active`] = true;
        updates[`bos_${prefix}_type${currentPosition}_trigger`] = targetSection.data.trigger;
      } else {
        // Clear the current position
        updates[`bos_${prefix}_type${currentPosition}_equipment_type`] = null;
        updates[`bos_${prefix}_type${currentPosition}_make`] = null;
        updates[`bos_${prefix}_type${currentPosition}_model`] = null;
        updates[`bos_${prefix}_type${currentPosition}_amp_rating`] = null;
        updates[`bos_${prefix}_type${currentPosition}_is_new`] = null;
        updates[`bos_${prefix}_type${currentPosition}_active`] = null;
        updates[`bos_${prefix}_type${currentPosition}_trigger`] = null;
      }

      // Check if SMS is being moved and update lastslot
      if (currentSection.data.equipmentType === 'SMS') {
        updates[`bos_${prefix}_lastslot`] = newPosition;
        setSmsLastSlot(newPosition);
        console.log(`[Reorder] SMS moved to slot ${newPosition}, updating lastslot`);
      } else if (targetSection.data.equipmentType === 'SMS') {
        updates[`bos_${prefix}_lastslot`] = currentPosition;
        setSmsLastSlot(currentPosition);
        console.log(`[Reorder] SMS moved to slot ${currentPosition}, updating lastslot`);
      }

      // Save to database
      await saveSystemDetailsPartialExact(projectID, updates);

      // Update local state to trigger UI refresh
      const tempCurrent = { ...currentSection.data };
      const tempTarget = targetSection.data.equipmentType ? { ...targetSection.data } : {
        isNew: true,
        equipmentType: "",
        ampRating: "",
        make: "",
        model: "",
        trigger: null,
      };

      currentSection.setter(tempTarget);
      targetSection.setter(tempCurrent);

      console.log(`[Reorder] Successfully moved equipment from position ${currentPosition} to ${newPosition}`);

    } catch (error) {
      console.error('[Reorder] Error moving equipment:', error);
    }
  };

  // Drag-and-drop: Unified BOS list for draggable rendering
  interface BOSItem {
    key: string;
    position: number;
    data: {
      isNew: boolean;
      equipmentType: string;
      ampRating: string;
      make: string;
      model: string;
      trigger: string | null;
    };
    setter: React.Dispatch<React.SetStateAction<any>>;
    showState: boolean;
    label: string;
  }

  // Handle BOS reordering via drag-and-drop
  const handleBOSReorder = useCallback(async (data: BOSItem[]) => {
    if (!projectID) return;
    const prefix = systemPrefix.replace('_', '');

    console.log('[Drag-Drop] Reordering BOS equipment');

    try {
      const updates: any = {};

      // Map dragged items to their new positions (1-5)
      data.forEach((item, index) => {
        const newPosition = index + 1;
        const oldPosition = item.position;

        if (oldPosition !== newPosition) {
          console.log(`[Drag-Drop] Moving ${item.data.equipmentType} from position ${oldPosition} to ${newPosition}`);
        }

        // Write equipment to new position
        updates[`bos_${prefix}_type${newPosition}_equipment_type`] = item.data.equipmentType;
        updates[`bos_${prefix}_type${newPosition}_make`] = item.data.make;
        updates[`bos_${prefix}_type${newPosition}_model`] = item.data.model;
        updates[`bos_${prefix}_type${newPosition}_amp_rating`] = item.data.ampRating;
        updates[`bos_${prefix}_type${newPosition}_is_new`] = item.data.isNew;
        updates[`bos_${prefix}_type${newPosition}_active`] = true;
        updates[`bos_${prefix}_type${newPosition}_trigger`] = item.data.trigger;
      });

      // Clear any positions beyond the dragged items
      for (let pos = data.length + 1; pos <= 5; pos++) {
        updates[`bos_${prefix}_type${pos}_equipment_type`] = null;
        updates[`bos_${prefix}_type${pos}_make`] = null;
        updates[`bos_${prefix}_type${pos}_model`] = null;
        updates[`bos_${prefix}_type${pos}_amp_rating`] = null;
        updates[`bos_${prefix}_type${pos}_is_new`] = null;
        updates[`bos_${prefix}_type${pos}_active`] = null;
        updates[`bos_${prefix}_type${pos}_trigger`] = null;
      }

      // Check if SMS is in the reordered items and update lastslot
      const smsItem = data.find(item => item.data.equipmentType === 'SMS');
      if (smsItem) {
        const smsNewPosition = data.indexOf(smsItem) + 1;
        updates[`bos_${prefix}_lastslot`] = smsNewPosition;
        setSmsLastSlot(smsNewPosition);
        console.log(`[Drag-Drop] SMS moved to slot ${smsNewPosition}, updating lastslot`);
      }

      // Save to database
      await saveSystemDetailsPartialExact(projectID, updates);

      // Update local state
      const getSectionSetter = (pos: number) => {
        switch (pos) {
          case 1: return setBosSection;
          case 2: return setBosType2Section;
          case 3: return setBosType3Section;
          case 4: return setBosType4Section;
          case 5: return setBosType5Section;
          default: return null;
        }
      };

      // First, clear all sections
      [setBosSection, setBosType2Section, setBosType3Section, setBosType4Section, setBosType5Section].forEach(setter => {
        setter({
          isNew: true,
          equipmentType: "",
          ampRating: "",
          make: "",
          model: "",
          trigger: null,
        });
      });

      // Then set the new data
      data.forEach((item, index) => {
        const newPosition = index + 1;
        const setter = getSectionSetter(newPosition);
        if (setter) {
          setter({ ...item.data });
        }
      });

      console.log('[Drag-Drop] Successfully reordered BOS equipment');

    } catch (error) {
      console.error('[Drag-Drop] Error reordering equipment:', error);
    }
  }, [projectID, systemPrefix, setBosSection, setBosType2Section, setBosType3Section, setBosType4Section, setBosType5Section]);

  // Max Continuous Output for BOS sizing
  const [maxContinuousOutputAmps, setMaxContinuousOutputAmps] = useState<number | null>(null);
  const [loadingMaxOutput, setLoadingMaxOutput] = useState(false);

  // Battery-specific Max Continuous Output for Battery/ESS BOS sections
  const [batteryMaxContinuousOutputAmps, setBatteryMaxContinuousOutputAmps] = useState<number | null>(null);
  const [loadingBatteryMaxOutput, setLoadingBatteryMaxOutput] = useState(false);

  // Fetch Max Continuous Output when inverter or microinverter data changes
  // This calculates INVERTER/MICROINVERTER output ONLY for Pre-Combine BOS sections
  // Battery output is calculated separately in batteryMaxContinuousOutputAmps
  useEffect(() => {
    const loadMaxOutput = async () => {
      setLoadingMaxOutput(true);
      try {
        let inverterAmps = 0;

        // Gather equipment data
        const microMake = microSection?.selectedMakeLabel || microSection?.selectedMakeValue;
        const microModel = microSection?.selectedModelLabel || microSection?.selectedModelValue;
        const microQty = parseInt(microSection?.quantity) || 0;
        const hasMicroData = visible.micro && microMake && microModel && microQty > 0;

        console.log(`[BOS Max Output] Calculating inverter/micro output: hasMicro=${hasMicroData}, hasInverter=${visible.inverter}`);

        // STEP 1: Calculate microinverter output (if present)
        if (hasMicroData) {
          console.log(`[BOS Max Output - Micro] Microinverter: Make="${microMake}", Model="${microModel}", Qty=${microQty}`);

          const URL = `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(microMake)}`;
          const response = await fetch(URL);
          const data = await response.json();

          console.log(`[BOS Max Output - Micro] API response:`, data);

          if (data?.success && Array.isArray(data.data)) {
            const matchedInverter = data.data.find(
              (inv: any) =>
                inv.model_number === microModel ||
                inv.name === microModel ||
                inv.make_model === `${microMake} ${microModel}`
            );

            console.log(`[BOS Max Output - Micro] Matched:`, matchedInverter);

            if (matchedInverter?.id) {
              const detailURL = `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`;
              const detailResponse = await fetch(detailURL);
              const detailData = await detailResponse.json();

              if (detailData?.success && detailData.data) {
                const amps = parseFloat(detailData.data.max_cont_output_amps) || 0;
                if (amps > 0) {
                  inverterAmps = amps * microQty;
                  console.log(`[BOS Max Output - Micro] ${amps}A × ${microQty} = ${inverterAmps}A`);
                }
              }
            }
          }
        }

        // STEP 2: Calculate standard inverter output (if present and no micro)
        if (!hasMicroData && visible.inverter) {
          const inverterMake = inverterSection?.selectedMakeLabel || inverterSection?.selectedMakeValue;
          const inverterModel = inverterSection?.selectedModel;

          if (inverterMake && inverterModel) {
            // Look up the actual model label from inverterModels if selectedModel is a UUID
            const selectedModelObj = inverterModels?.find((m: any) => m.value === inverterModel);
            const modelName = selectedModelObj?.label || inverterModel;

            console.log(`[BOS Max Output - Inverter] Make="${inverterMake}", Model="${modelName}"`);

            const URL = `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(inverterMake)}`;
            const response = await fetch(URL);
            const data = await response.json();

            if (data?.success && Array.isArray(data.data)) {
              const isPowerWall3Base = modelName.toLowerCase().includes('powerwall') &&
                                       modelName.toLowerCase().includes('3') &&
                                       !modelName.match(/\d+\.?\d*\s*kw/i);

              let matchedInverter;

              if (isPowerWall3Base) {
                matchedInverter = data.data.find(
                  (inv: any) =>
                    inv.model_number === modelName ||
                    inv.name === modelName ||
                    inv.make_model === `${inverterMake} ${modelName}`
                );

                if (!matchedInverter) {
                  matchedInverter = data.data.find(
                    (inv: any) => {
                      const invName = (inv.model_number || inv.name || '').toLowerCase();
                      return invName.includes('powerwall') &&
                             invName.includes('3') &&
                             invName.match(/\d+\.?\d*\s*kw/i);
                    }
                  );
                }
              } else {
                matchedInverter = data.data.find(
                  (inv: any) =>
                    inv.model_number === modelName ||
                    inv.name === modelName ||
                    inv.model_number === inverterModel ||
                    inv.name === inverterModel ||
                    inv.make_model === `${inverterMake} ${modelName}` ||
                    inv.make_model === `${inverterMake} ${inverterModel}`
                );
              }

              console.log(`[BOS Max Output - Inverter] Matched:`, matchedInverter);

              if (matchedInverter?.id) {
                const detailURL = `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`;
                const detailResponse = await fetch(detailURL);
                const detailData = await detailResponse.json();

                if (detailData?.success && detailData.data) {
                  const amps = parseFloat(detailData.data.max_cont_output_amps) || 0;
                  inverterAmps = amps;
                  console.log(`[BOS Max Output - Inverter] ${amps}A`);
                }
              }
            }
          }
        }

        // STEP 3: Set inverter/micro output for Pre-Combine BOS sections
        // Pre-Combine BOS (after string combiner/inverter) uses inverter output ONLY
        // Battery output is tracked separately in batteryMaxContinuousOutputAmps for Battery BOS sections
        console.log(`[BOS Max Output] Final inverter/micro output for Pre-Combine BOS: ${inverterAmps}A`);

        setMaxContinuousOutputAmps(inverterAmps > 0 ? Math.round(inverterAmps) : null);
      } catch (error) {
        console.error(`[BOS] Error loading max output for ${systemPrefix}:`, error);
      } finally {
        setLoadingMaxOutput(false);
      }
    };

    loadMaxOutput();
  }, [
    visible.micro,
    visible.inverter,
    visible.battery1,
    visible.battery2,
    inverterSection?.selectedMake,
    inverterSection?.selectedModel,
    microSection?.selectedMakeValue,
    microSection?.selectedModelValue,
    microSection?.quantity,
    battery1Section?.selectedMakeValue,
    battery1Section?.selectedMake,
    battery1Section?.selectedModelValue,
    battery1Section?.selectedModel,
    battery1Section?.quantity,
    inverterModels,
  ]);

  // Calculate Battery-specific Max Continuous Output for Battery/ESS BOS sections
  // This ONLY considers battery output, not inverters/microinverters
  useEffect(() => {
    console.log(`[Battery BOS useEffect] Triggered for ${systemPrefix}`);
    const loadBatteryMaxOutput = async () => {
      setLoadingBatteryMaxOutput(true);
      try {
        let finalAmps = null;

        const battery1Make = battery1Section?.selectedMakeLabel || battery1Section?.selectedMakeValue;
        const battery1Model = battery1Section?.selectedModelLabel || battery1Section?.selectedModelValue;
        const battery1Qty = parseInt(battery1Section?.quantity) || 0;
        const hasBatteryData = (visible.battery1 || visible.battery2) && battery1Make && battery1Model && battery1Qty > 0;

        console.log(`[Battery BOS useEffect] Battery data check:`, {
          visible1: visible.battery1,
          visible2: visible.battery2,
          make: battery1Make,
          model: battery1Model,
          qty: battery1Qty,
          hasBatteryData
        });

        if (hasBatteryData) {
          console.log(`[Battery BOS useEffect] Has battery data - proceeding with calculation`);
          // Check if Tesla battery - they have fixed 48A output and don't aggregate
          const isTesla = battery1Make?.toLowerCase().includes('tesla');

          if (isTesla) {
            // Tesla batteries: Fixed 48 amps, doesn't aggregate with quantity
            finalAmps = 48;
            console.log(`[Battery BOS useEffect] Tesla battery - fixed 48A`);
          } else {
            // Franklin and other batteries: ISC × Quantity × 1.25 (they aggregate)
            console.log(`[Battery BOS useEffect] Non-Tesla battery - calling GetBatteryModels API for: ${battery1Make}`);
            const response = await GetBatteryModels(battery1Make);
            console.log(`[Battery BOS useEffect] GetBatteryModels response:`, response);

            // FIXED: Correct response structure is response?.status === 200 and response?.data?.data
            // (not response?.data?.status === "SUCCESS")
            if (response?.status === 200 && Array.isArray(response?.data?.data)) {
              console.log(`[Battery BOS useEffect] API success - ${response.data.data.length} batteries found`);
              const matchedBattery = response.data.data.find(
                (bat: any) =>
                  bat.model_number === battery1Model ||
                  bat.name === battery1Model ||
                  bat.model === battery1Model
              );

              console.log(`[Battery BOS useEffect] Matched battery:`, matchedBattery);

              if (matchedBattery) {
                // Try multiple possible field names for ISC/overcurrent
                // New endpoint returns overcurrent_isc field from battery_data table
                let isc = parseFloat(
                  matchedBattery.overcurrent_isc ||
                  matchedBattery.isc ||
                  matchedBattery.overcurrent ||
                  matchedBattery.short_circuit_current ||
                  matchedBattery.max_short_circuit_current ||
                  0
                );

                console.log(`[Battery BOS useEffect] ISC value from API: ${isc}`);

                // FALLBACK: If ISC not in database, use known values for common batteries
                // This should rarely be needed with new dedicated battery endpoint
                if (isc === 0) {
                  const batteryKey = `${battery1Make}-${battery1Model}`.toLowerCase();
                  const knownBatteryISC: Record<string, number> = {
                    'franklin-apower': 20.8,
                    'franklin-apower 2': 10,
                    'franklin-apower s': 10,
                  };

                  if (knownBatteryISC[batteryKey]) {
                    isc = knownBatteryISC[batteryKey];
                    console.log(`[Battery BOS useEffect] Using known ISC fallback for ${batteryKey}: ${isc}A`);
                  }
                }

                if (isc > 0) {
                  // Formula for Franklin/other batteries: ISC × Quantity × 1.25 (they aggregate)
                  finalAmps = isc * battery1Qty * 1.25;
                  console.log(`[Battery BOS useEffect] Calculated: ${isc}A × ${battery1Qty} × 1.25 = ${finalAmps}A`);
                } else {
                  console.warn(`[Battery BOS useEffect] No valid ISC found in battery data or fallback`);
                }
              } else {
                console.warn(`[Battery BOS useEffect] No matching battery found for model: ${battery1Model}`);
              }
            } else {
              console.warn(`[Battery BOS useEffect] API failed or returned invalid data`);
            }
          }
        } else {
          console.log(`[Battery BOS useEffect] No battery data - skipping calculation`);
        }

        console.log(`[Battery BOS useEffect] Setting batteryMaxContinuousOutputAmps to: ${finalAmps}`);
        setBatteryMaxContinuousOutputAmps(finalAmps ? Math.round(finalAmps) : null);
      } catch (error) {
        console.error(`[Battery BOS] Error loading battery max output for ${systemPrefix}:`, error);
      } finally {
        setLoadingBatteryMaxOutput(false);
      }
    };

    loadBatteryMaxOutput();
  }, [
    visible.battery1,
    visible.battery2,
    battery1Section?.selectedMakeLabel,
    battery1Section?.selectedMakeValue,
    battery1Section?.selectedModelLabel,
    battery1Section?.selectedModelValue,
    battery1Section?.quantity,
    systemPrefix,
  ]);

  // Validate BOS equipment when max continuous output changes
  // If current amp rating no longer meets 1.25x requirement, clear amp/make/model and re-run auto-select
  useEffect(() => {
    if (!maxContinuousOutputAmps || !bosHydrated) return;

    const minRequiredAmps = maxContinuousOutputAmps * 1.25;
    const prefix = systemPrefix.replace('_', '');

    // Check BOS Type 1
    if (bosSection.ampRating) {
      const currentAmpRating = parseFloat(bosSection.ampRating);
      if (currentAmpRating < minRequiredAmps) {
        console.log(`[BOS Validation] Type 1 amp rating ${currentAmpRating}A no longer meets requirement ${minRequiredAmps.toFixed(2)}A - clearing`);
        setBosSection(prev => ({
          ...prev,
          ampRating: "",
          make: "",
          model: "",
        }));
        // Clear from database
        if (projectID) {
          void saveSystemDetailsPartialExact(projectID, {
            [`bos_${prefix}_type1_amp_rating`]: null,
            [`bos_${prefix}_type1_make`]: null,
            [`bos_${prefix}_type1_model`]: null,
          });
        }
      }
    }

    // Check BOS Type 2
    if (bosType2Section.ampRating) {
      const currentAmpRating = parseFloat(bosType2Section.ampRating);
      if (currentAmpRating < minRequiredAmps) {
        console.log(`[BOS Validation] Type 2 amp rating ${currentAmpRating}A no longer meets requirement ${minRequiredAmps.toFixed(2)}A - clearing`);
        setBosType2Section(prev => ({
          ...prev,
          ampRating: "",
          make: "",
          model: "",
        }));
        // Clear from database
        if (projectID) {
          void saveSystemDetailsPartialExact(projectID, {
            [`bos_${prefix}_type2_amp_rating`]: null,
            [`bos_${prefix}_type2_make`]: null,
            [`bos_${prefix}_type2_model`]: null,
          });
        }
      }
    }

    // Check BOS Type 3
    if (bosType3Section.ampRating) {
      const currentAmpRating = parseFloat(bosType3Section.ampRating);
      if (currentAmpRating < minRequiredAmps) {
        console.log(`[BOS Validation] Type 3 amp rating ${currentAmpRating}A no longer meets requirement ${minRequiredAmps.toFixed(2)}A - clearing`);
        setBosType3Section(prev => ({
          ...prev,
          ampRating: "",
          make: "",
          model: "",
        }));
        // Clear from database
        if (projectID) {
          void saveSystemDetailsPartialExact(projectID, {
            [`bos_${prefix}_type3_amp_rating`]: null,
            [`bos_${prefix}_type3_make`]: null,
            [`bos_${prefix}_type3_model`]: null,
          });
        }
      }
    }
  }, [maxContinuousOutputAmps, bosHydrated, systemPrefix, projectID]);

  const bosValues = useMemo(
    () => ({
      isNew: bosSection.isNew,
      equipmentType: bosSection.equipmentType,
      ampRating: bosSection.ampRating,
      make: bosSection.make,
      model: bosSection.model,
    }),
    [bosSection]
  );

  const smsValues = useMemo(
    () => ({
      isNew: smsSection.isNew,
      selectedMakeLabel: smsSection.selectedMakeLabel,
      selectedMakeValue: smsSection.selectedMakeValue,
      selectedModelLabel: smsSection.selectedModelLabel,
      selectedModelValue: smsSection.selectedModelValue,
      hasRSD: smsSection.hasRSD,
      selectedMainBreaker: smsSection.selectedMainBreaker,
      selectedBackupPanel: smsSection.selectedBackupPanel,
      selectedPVBreaker: smsSection.selectedPVBreaker,
      selectedESSBreaker: smsSection.selectedESSBreaker,
      selectedTieInBreaker: smsSection.selectedTieInBreaker,
      activatePCS: smsSection.activatePCS,
    }),
    [smsSection]
  );

  const battery1Values = useMemo(
    () => ({
      quantity: battery1Section.quantity,
      selectedMake: battery1Section.selectedMakeValue,
      selectedModel: battery1Section.selectedModelValue,
      configuration: battery1Section.configuration,
      isNew: battery1Section.isNew,
      tieInLocation: battery1Section.tieInLocation,
    }),
    [battery1Section]
  );

  const battery2Values = useMemo(
    () => ({
      quantity: battery2Section.quantity,
      selectedMake: battery2Section.selectedMakeValue,
      selectedModel: battery2Section.selectedModelValue,
      configuration: battery2Section.configuration,
      isNew: battery2Section.isNew,
      tieInLocation: battery2Section.tieInLocation,
    }),
    [battery2Section]
  );

  const backupValues = useMemo(
    () => ({
      isNew: backupSection.isNew,
      selectedMake: backupSection.selectedMakeValue,
      selectedModel: backupSection.selectedModelValue,
      selectedBusAmps: backupSection.busAmps,
      selectedMainBreaker: backupSection.mainBreaker,
      selectedTieInBreaker: backupSection.tieInBreaker,
    }),
    [backupSection]
  );

  // ---- Project header bits ---------------------------------------------------
  const project = useSelector((s: any) => s.project.currentProject);
  const fullName = useMemo(() => {
    return project?.details
      ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
      : undefined;
  }, [project?.details]);

  const addressLines = useMemo(() => {
    if (!project?.site) return undefined;
    return [
      project.site.address,
      [project.site.city, project.site.state, project.site.zip_code]
        .filter(Boolean)
        .join(", "),
    ];
  }, [project?.site]);

  // Fetch utility requirements for auto-populating BOS equipment
  useEffect(() => {
    const loadUtilityRequirements = async () => {
      const utility = project?.site?.utility;
      const state = project?.site?.state;
      const token = companyUuid;

      if (!utility || !state || !token) {
        setUtilityRequirements(null);
        return;
      }

      try {
        const requirements = await fetchUtilityRequirements(state, utility, token);
        setUtilityRequirements(requirements);

        // Set utility name for APS configuration detection
        setUtilityName(utility);

        // NOTE: BOS sections are now controlled by modal response (Yes/No/Ask Me Later)
        // Do NOT auto-show BOS sections - wait for user to respond to modal
      } catch (error) {
        console.error("[Utility] Error fetching utility requirements:", error);
        setUtilityRequirements(null);
      }
    };

    loadUtilityRequirements();
  }, [project?.site?.utility, project?.site?.state, companyUuid, setUtilityName]);

  // NOTE: AUTOMATIC BOS MODAL TRIGGER DISABLED
  // BOS equipment is now added via button click on Equipment page instead of automatic modal
  // Keeping the modal handlers and state for potential future use

  // // Trigger BOS modal when inverter make AND model are both entered
  // useEffect(() => {
  //   // Only check for inverter systems (not micro-inverter)
  //   if (!visible.inverter) return;

  //   const hasMake = !!inverterSection?.selectedMake;
  //   const hasModel = !!inverterSection?.selectedModel;

  //   // Check if utility has BOS requirements
  //   const hasBOSRequirements = utilityRequirements && (
  //     utilityRequirements.bos_1 ||
  //     utilityRequirements.bos_2 ||
  //     utilityRequirements.bos_3 ||
  //     utilityRequirements.bos_4 ||
  //     utilityRequirements.bos_5 ||
  //     utilityRequirements.bos_6
  //   );

  //   // Trigger modal if:
  //   // 1. Both make and model are entered
  //   // 2. Utility has BOS requirements
  //   // 3. Modal hasn't been shown yet OR user selected "Ask Me Later"
  //   // 4. User hasn't already responded with "Yes" or "No"
  //   const shouldShowModal = hasMake && hasModel && hasBOSRequirements &&
  //     (!modalHasBeenShown || bosModalResponse === 'later') &&
  //     bosModalResponse !== 'yes' && bosModalResponse !== 'no';

  //   if (shouldShowModal) {
  //     console.log('[BOS Modal] Triggering modal - inverter make and model entered');
  //     setShowBOSModal(true);
  //   }
  // }, [visible.inverter, inverterSection?.selectedMake, inverterSection?.selectedModel, utilityRequirements, modalHasBeenShown, bosModalResponse]);

  // // Trigger BOS modal when string combiner panel make AND model are both entered (for micro-inverter systems)
  // useEffect(() => {
  //   // Only check for micro-inverter systems with string combiner panel
  //   if (!visible.stringCombinerPanel) return;

  //   const hasMake = !!combinerSection?.selectedMakeValue;
  //   const hasModel = !!combinerSection?.selectedModelValue;

  //   // Check if utility has BOS requirements
  //   const hasBOSRequirements = utilityRequirements && (
  //     utilityRequirements.bos_1 ||
  //     utilityRequirements.bos_2 ||
  //     utilityRequirements.bos_3 ||
  //     utilityRequirements.bos_4 ||
  //     utilityRequirements.bos_5 ||
  //     utilityRequirements.bos_6
  //   );

  //   // Trigger modal if:
  //   // 1. Both make and model are entered
  //   // 2. Utility has BOS requirements
  //   // 3. Modal hasn't been shown yet OR user selected "Ask Me Later"
  //   // 4. User hasn't already responded with "Yes" or "No"
  //   const shouldShowModal = hasMake && hasModel && hasBOSRequirements &&
  //     (!modalHasBeenShown || bosModalResponse === 'later') &&
  //     bosModalResponse !== 'yes' && bosModalResponse !== 'no';

  //   if (shouldShowModal) {
  //     console.log('[BOS Modal] Triggering modal - string combiner panel make and model entered');
  //     setShowBOSModal(true);
  //   }
  // }, [visible.stringCombinerPanel, combinerSection?.selectedMakeValue, combinerSection?.selectedModelValue, utilityRequirements, modalHasBeenShown, bosModalResponse]);

  // NOTE: OLD AUTO-POPULATE LOGIC REMOVED
  // BOS equipment is now populated via modal-driven flow (Yes/No/Ask Me Later)
  // Auto-populate logic moved to handleBOSModalYes function below

  // Map local config tokens -> DB column label
  const toColumnBatteryConfig = (
    v: string
  ): "Daisy Chain" | "Battery Combiner Panel" | "" =>
    v === "daisy_chain"
      ? "Daisy Chain"
      : v === "combiner_panel"
      ? "Battery Combiner Panel"
      : "";

  const handleHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h !== headerHeight) setHeaderHeight(h);
    },
    [headerHeight, setHeaderHeight]
  );

  // Show notification in header
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotificationType(type);
    setNotificationMessage(message);
  }, []);

  const handleUtilityServiceAmpsChange = useCallback((value: string) => {
    console.log(`[EquipmentDetails] Utility service amperage changed to: ${value}`);

    // Update state
    setUtilityServiceAmps(value);

    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

    // Prepare database payload
    const dbPayload: Record<string, any> = {
      utility_service_amps: value || null,
    };

    // Auto-populate backup panel bus rating
    if (backupOption === "Whole Home") {
      // Whole Home: Set backup panel bus rating = utility service amperage
      console.log(`[EquipmentDetails] Auto-setting backup panel bus rating to ${value} (Whole Home)`);
      setBackupSection((prev) => ({
        ...prev,
        busAmps: value,
      }));

      // Add backup panel bus rating to database payload
      const busRatingField = systemPrefix === 'sys1_'
        ? 'bls1_backuploader_bus_bar_rating'
        : 'sys2_backuploadsubpanel_bus_rating';

      dbPayload[busRatingField] = value;
    } else if (backupOption === "Partial Home") {
      // Partial Home: User directly selects backup system size (30, 60, 100, 125, 150, 175, 200, 225)
      // Backup panel bus rating = selected value (1:1 mapping)
      console.log(`[EquipmentDetails] Auto-setting backup panel bus rating to ${value} (Partial Home)`);
      setBackupSection((prev) => ({
        ...prev,
        busAmps: value,
      }));

      // Add backup panel bus rating to database payload
      const busRatingField = systemPrefix === 'sys1_'
        ? 'bls1_backuploader_bus_bar_rating'
        : 'sys2_backuploadsubpanel_bus_rating';

      dbPayload[busRatingField] = value;
    }

    // Auto-populate Electrical Service fields for 100A and 200A only
    const utilityAmps = parseInt(value);
    if (utilityAmps === 100 || utilityAmps === 200) {
      console.log(`[EquipmentDetails] Auto-populating Electrical Service fields for ${value}A`);

      // Auto-select Main Circuit Breaker count = 1
      dbPayload.ele_main_circuit_breakers_qty = 1;

      // Auto-select Main Circuit Breaker rating based on utility amperage
      dbPayload.ele_main_circuit_breaker_rating = value; // 100A → 100A, 200A → 200A

      console.log(`[EquipmentDetails] Set MCB count to 1 and MCB rating to ${value}A`);
    }

    // Pre-populate Post-SMS BOS amp ratings (if those sections exist/are active)
    // This ensures when Post-SMS BOS sections render, they already have the correct amp rating
    if (showPostSMSBOS) {
      console.log(`[EquipmentDetails] Pre-populating Post-SMS BOS Type 1 amp rating to ${value}`);
      dbPayload[`post_sms_bos_${prefix}_type1_amp_rating`] = value;
      setPostSMSBOSSection((prev) => ({
        ...prev,
        ampRating: value,
      }));
    }
    if (showPostSMSBOSType2) {
      console.log(`[EquipmentDetails] Pre-populating Post-SMS BOS Type 2 amp rating to ${value}`);
      dbPayload[`post_sms_bos_${prefix}_type2_amp_rating`] = value;
      setPostSMSBOSType2Section((prev) => ({
        ...prev,
        ampRating: value,
      }));
    }
    if (showPostSMSBOSType3) {
      console.log(`[EquipmentDetails] Pre-populating Post-SMS BOS Type 3 amp rating to ${value}`);
      dbPayload[`post_sms_bos_${prefix}_type3_amp_rating`] = value;
      setPostSMSBOSType3Section((prev) => ({
        ...prev,
        ampRating: value,
      }));
    }

    // Save all updates to database in one call
    if (projectID) {
      void saveSystemDetailsPartialExact(projectID, dbPayload);
    }
  }, [projectID, systemPrefix, backupOption, setBackupSection, setUtilityServiceAmps, showPostSMSBOS, showPostSMSBOSType2, showPostSMSBOSType3, setPostSMSBOSSection, setPostSMSBOSType2Section, setPostSMSBOSType3Section]);

  return (
    // key forces full remount on project change → no lingering state
    <NotificationProvider showNotification={showNotification}>
      <LinearGradient
        key={projectID || "no-project"}
        {...BLUE_MD_TB}
        style={styles.gradient}
      >
        <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight, paddingBottom: verticalScale(100) },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEnabled={!isDragging}
        keyboardShouldPersistTaps="handled"
      >
        {/* Show loading indicator while fetching system data */}
        {isLoadingSystemData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading {systemLabel} data...</Text>
          </View>
        ) : (
        <>
        {/* Always on top */}
        <SolarPanelsSection
          key={`solar-${systemPrefix}`}
          values={solarValues}
          makes={solarMakes}
          models={solarModels}
          loadMakes={solarLoadMakes}
          loadModels={solarLoadModels}
          loadingMakes={solarLoadingMakes}
          loadingModels={solarLoadingModels}
          isLoading={solarLoadingData}
          label={`Solar Panel ${systemNumber}${solarSection.showSecondPanelType ? ' - Type 1' : ''}`}
          onChange={(field: string, val: any) => {
            if (field === "selectedMake") {
              const makeLabel = findLabel(solarMakes, val);
              setSolarSection((prev) => ({
                ...prev,
                selectedMakeValue: val,
                selectedMakeLabel: makeLabel,
                selectedModelValue: "",
                selectedModelLabel: "",
                selectedPanelId: undefined, // Clear panel ID when make changes
              }));
            } else if (field === "selectedModel") {
              const modelLabel = findLabel(solarModels, val);
              const selectedModel = solarModels.find((m) => m.value === val);
              const panelId = selectedModel?.id;

              setSolarSection((prev) => ({
                ...prev,
                selectedModelValue: val,
                selectedModelLabel: modelLabel,
                selectedPanelId: panelId, // Store panel ID
              }));
            } else {
              console.log('[EquipmentDetails] Solar onChange:', { field, val });
              setSolarSection((prev) => {
                const newState = { ...prev, [field]: val };
                console.log('[EquipmentDetails] Solar state update:', { field, val, prevQuantity: prev.quantity, newQuantity: newState.quantity });
                return newState;
              });
            }
          }}
          errors={{}}
          onClearType2={() => {
            // Clear Solar Panel Type 2 data from database when toggle is unchecked
            if (projectID) {
              void saveSystemDetailsPartialExact(projectID, {
                [`${systemPrefix}solar_panel_type2_quantity`]: null,
                [`${systemPrefix}solar_panel_type2_manufacturer`]: null,
                [`${systemPrefix}solar_panel_type2_model`]: null,
                [`${systemPrefix}solar_panel_type2_is_new`]: null,
              });
            }
          }}
        />

        {/* Solar Panel Type 2 Section - only show if enabled */}
        {solarSection.showSecondPanelType && (
          <SolarPanelType2Section
            key={`solar-type2-${systemPrefix}`}
            values={solarType2Values}
            makes={solarType2Makes}
            models={solarType2Models}
            loadMakes={solarType2LoadMakes}
            loadModels={solarType2LoadModels}
            loadingMakes={solarType2LoadingMakes}
            loadingModels={solarType2LoadingModels}
            isLoading={solarType2LoadingData}
            onChange={(field: string, val: any) => {
              if (field === "selectedMake") {
                const makeLabel = findLabel(solarType2Makes, val);
                setSolarType2Section((prev) => ({
                  ...prev,
                  selectedMakeValue: val,
                  selectedMakeLabel: makeLabel,
                  selectedModelValue: "",
                  selectedModelLabel: "",
                }));
              } else if (field === "selectedModel") {
                const modelLabel = findLabel(solarType2Models, val);
                setSolarType2Section((prev) => ({
                  ...prev,
                  selectedModelValue: val,
                  selectedModelLabel: modelLabel,
                }));
              } else {
                setSolarType2Section((prev) => ({ ...prev, [field]: val }));
              }
            }}
            errors={{}}
            label={`Solar Panel ${systemNumber} - Type 2`}
            onRemove={() => {
              setSolarSection(prev => ({
                ...prev,
                showSecondPanelType: false,
              }));
              // Clear database fields for Solar Panel Type 2
              if (projectID) {
                void saveSystemDetailsPartialExact(projectID, {
                  [`${systemPrefix}solar_panel_type2_quantity`]: null,
                  [`${systemPrefix}solar_panel_type2_manufacturer`]: null,
                  [`${systemPrefix}solar_panel_type2_model`]: null,
                  [`${systemPrefix}solar_panel_type2_is_new`]: null,
                });
              }
            }}
          />
        )}

        {/* System selection */}
        <SystemSelectionSection
          value={systemType}
          onChange={setSystemType}
          systemNumber={systemNumber}
          systemLabel={systemLabel}
          onSystemSwitch={() => {
            // Clear ALL system-specific data when switching between microinverter and inverter
            if (projectID) {
              // Create comprehensive payload to clear all micro/inverter/combiner/optimizer fields
              const clearPayload = {
                // Clear backup option (existing logic)
                [`${systemPrefix}backup_option`]: null,

                // Clear SMS fields (depends on backup option)
                [`${systemPrefix}sms_existing`]: null,
                [`${systemPrefix}sms_make`]: null,
                [`${systemPrefix}sms_model`]: null,
                [`${systemPrefix}sms_id`]: null,
                [`${systemPrefix}sms_breaker_rating`]: null,
                [`${systemPrefix}sms_pv_breaker_rating_override`]: null,
                [`${systemPrefix}sms_ess_breaker_rating_override`]: null,
                [`${systemPrefix}sms_tie_in_breaker_rating_override`]: null,
                [`${systemPrefix}sms_rsd_enabled`]: null,

                // Clear Battery 1 fields (depends on backup option)
                [`${systemPrefix}battery1_existing`]: null,
                [`${systemPrefix}battery_1_qty`]: null,
                [`${systemPrefix}battery_1_make`]: null,
                [`${systemPrefix}battery_1_model`]: null,
                [`${systemPrefix}battery1_id`]: null,

                // Clear Battery 2 fields (depends on backup option and Battery 1)
                [`${systemPrefix}battery2_existing`]: null,
                [`${systemPrefix}battery_2_qty`]: null,
                [`${systemPrefix}battery_2_make`]: null,
                [`${systemPrefix}battery_2_model`]: null,
                [`${systemPrefix}battery2_id`]: null,

                // Clear ESS fields (depends on backup option)
                [`${systemPrefix}ess_existing`]: null,
                [`${systemPrefix}ess_make`]: null,
                [`${systemPrefix}ess_model`]: null,
                [`${systemPrefix}ess_id`]: null,
                [`${systemPrefix}ess_main_breaker_rating`]: null,
                [`${systemPrefix}ess_upstream_breaker_rating`]: null,
                [`${systemPrefix}ess_upstream_breaker_location`]: null,

                // Clear microinverter fields
                [`${systemPrefix}micro_inverter_existing`]: null,
                [`${systemPrefix}micro_inverter_make`]: null,
                [`${systemPrefix}micro_inverter_model`]: null,
                [`${systemPrefix}micro_inverter_id`]: null,
                [`${systemPrefix}micro_inverter_qty`]: null,

                // Clear string combiner panel fields (micro path only)
                [`${systemPrefix}combiner_existing`]: null,
                [`${systemPrefix}combiner_panel_make`]: null,
                [`${systemPrefix}combiner_panel_model`]: null,
                [`${systemPrefix}combinerpanel_id`]: null,
                [`${systemPrefix}combinerpanel_bus_rating`]: null,
                [`${systemPrefix}combinerpanel_main_breaker_rating`]: null,

                // Clear optimizer fields
                [`${systemPrefix}optimizer_existing`]: null,
                [`${systemPrefix}optimizer_make`]: null,
                [`${systemPrefix}optimizer_model`]: null,
                [`${systemPrefix}optimizer_id`]: null,

                // Clear inverter-specific configuration fields
                [`${systemPrefix}inverter_configuration`]: null,
                [`${systemPrefix}stringing_type`]: null,
                [`${systemPrefix}teslagatewaytype`]: null,
                [`${systemPrefix}backupswitch_location`]: null,
                [`${systemPrefix}tesla_extensions`]: null,

                // Clear stringing configuration fields
                [`${systemPrefix}branch_string_1`]: null,
                [`${systemPrefix}branch_string_2`]: null,
                [`${systemPrefix}branch_string_3`]: null,
                [`${systemPrefix}branch_string_4`]: null,
                [`${systemPrefix}branch_string_5`]: null,
                [`${systemPrefix}branch_string_6`]: null,
                [`${systemPrefix}branch_string_7`]: null,
                [`${systemPrefix}branch_string_8`]: null,
                [`${systemPrefix}branch_string_9`]: null,
                [`${systemPrefix}branch_string_10`]: null,
                [`${systemPrefix}count_validation`]: null,
                [`${systemPrefix}inv_max_continuous_output`]: null,
                [`${systemPrefix}panel_count`]: null,
              };

              void saveSystemDetailsPartialExact(projectID, clearPayload);
              setBackupOption("");
              setStringingType("auto"); // Reset to default
            }
          }}
          errors={{}}
        />

        {/* =============== MICROINVERTER PATH =============== */}
        {visible.micro && (
          <>
            <MicroinverterSection
              key={`micro-${systemPrefix}`}
              values={microValues}
              makes={microMakes}
              models={microModels}
              loadMakes={microLoadMakes}
              loadModels={microLoadModels}
              loadingMakes={microLoadingMakes}
              loadingModels={microLoadingModels}
              isLoading={microLoadingData}
              label={`Microinverter ${systemNumber}`}
              hasCombinerPanel={!!(combinerSection.selectedMakeValue && combinerSection.selectedModelValue)}
              combinerMake={combinerSection.selectedMakeValue}
              combinerModel={combinerSection.selectedModelValue}
              solarPanelQuantity={parseInt(solarSection.quantity, 10) || 0}
              branchString1={combinerSection.branchString1}
              branchString2={combinerSection.branchString2}
              branchString3={combinerSection.branchString3}
              branchString4={combinerSection.branchString4}
              branchString5={combinerSection.branchString5}
              branchString6={combinerSection.branchString6}
              microInverterHint={microInverterHint}
              onBranchStringChange={(field: string, value: string) => {
                setCombinerSection((prev) => ({ ...prev, [field]: value }));
              }}
              micro1Panels={microSection.micro1Panels}
              micro2Panels={microSection.micro2Panels}
              micro3Panels={microSection.micro3Panels}
              micro4Panels={microSection.micro4Panels}
              micro5Panels={microSection.micro5Panels}
              micro6Panels={microSection.micro6Panels}
              micro7Panels={microSection.micro7Panels}
              micro8Panels={microSection.micro8Panels}
              micro9Panels={microSection.micro9Panels}
              micro10Panels={microSection.micro10Panels}
              micro11Panels={microSection.micro11Panels}
              micro12Panels={microSection.micro12Panels}
              micro13Panels={microSection.micro13Panels}
              micro14Panels={microSection.micro14Panels}
              micro15Panels={microSection.micro15Panels}
              micro16Panels={microSection.micro16Panels}
              micro17Panels={microSection.micro17Panels}
              micro18Panels={microSection.micro18Panels}
              micro19Panels={microSection.micro19Panels}
              micro20Panels={microSection.micro20Panels}
              micro21Panels={microSection.micro21Panels}
              micro22Panels={microSection.micro22Panels}
              micro23Panels={microSection.micro23Panels}
              micro24Panels={microSection.micro24Panels}
              micro25Panels={microSection.micro25Panels}
              onMicroPanelChange={(field: string, value: string) => {
                setMicroSection((prev) => ({ ...prev, [field]: value }));
              }}
              onChange={(field: string, val: any) => {
                if (field === "selectedMake") {
                  const makeLabel = findLabel(microMakes, val);

                  // Reset user modification flag when manufacturer changes
                  setUserModifiedMicroQty(false);

                  setMicroSection((prev) => {
                    // During hydration, don't clear model if it's already set
                    const shouldClearModel = !isLoadingSystemData && prev.selectedMakeValue !== val;

                    // Check if make is AP Systems, Hoymiles, or Hoymiles Power - these have non-1:1 ratios
                    // Use partial matching to handle variations like "AP Systems, Inc.", "Hoymiles Energy", or "Hoymiles Power"
                    const isNonStandardRatio =
                      makeLabel?.includes("AP Systems") ||
                      makeLabel?.includes("Hoymiles") ||
                      (makeLabel?.includes("AP") && makeLabel?.includes("Systems"));

                    return {
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      // Only clear model if not hydrating and make actually changed
                      ...(shouldClearModel ? {
                        selectedModelValue: "",
                        selectedModelLabel: "",
                      } : {}),
                      // Clear quantity for AP Systems, Hoymiles, or Hoymiles Power (non-1:1 ratio)
                      // Otherwise sync with solar panel quantity
                      quantity: isNonStandardRatio ? "" : solarSection.quantity || "",
                      // Note: Removed auto-capture logic - let user control new/existing toggle
                    };
                  });
                } else if (field === "selectedModel") {
                  const modelLabel = findLabel(microModels, val);
                  setMicroSection((prev) => ({
                    ...prev,
                    selectedModelValue: val,
                    selectedModelLabel: modelLabel,
                    // Note: Removed auto-capture logic - let user control new/existing toggle
                  }));
                } else if (field === "quantity") {
                  // User manually changed quantity - mark flag to prevent auto-sync
                  setUserModifiedMicroQty(true);
                  setMicroSection((prev) => ({ ...prev, [field]: val }));
                } else {
                  setMicroSection((prev) => ({ ...prev, [field]: val }));
                }
              }}
              errors={{}}
            />

            {visible.combiner && (
              <StringCombinerPanelSection
                key={`combiner-${systemPrefix}`}
                values={combinerValues}
                makes={combinerMakes}
                models={combinerModels}
                loadMakes={combinerLoadMakes}
                loadModels={combinerLoadModels}
                loadingMakes={combinerLoadingMakes}
                loadingModels={combinerLoadingModels}
                isLoading={combinerLoadingData}
                label={`String Combiner Panel ${systemNumber}`}
                solarPanelQuantity={parseInt(solarSection.quantity, 10) || 0}
                onChange={(field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(combinerMakes, val);
                    setCombinerSection((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                      isNew: true, // Auto-capture: when make changes, assume it's new equipment
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(combinerModels, val);
                    setCombinerSection((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                      isNew: true, // Auto-capture: when model changes, assume it's new equipment
                    }));
                  } else if (field === "selectedBusAmps") {
                    setCombinerSection((prev) => ({ ...prev, busAmps: val }));
                  } else if (field === "selectedMainBreaker") {
                    setCombinerSection((prev) => ({
                      ...prev,
                      mainBreaker: val,
                    }));
                  } else if (field === "isNew") {
                    setCombinerSection((prev) => ({ ...prev, isNew: !!val }));
                  } else {
                    setCombinerSection((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
                showBOSButton={true}
                onShowBOS={() => showNextAvailableBOS('stringCombiner')}
              />
            )}

            {/* Render BOS sections triggered by String Combiner Panel */}
            {renderBOSForTrigger('stringCombiner')}

            {/* Energy Storage chooser */}
            {visible.ess && (
              <EnergyStorageSection
                key={`ess-${systemPrefix}`}
                value={backupOption}
                onChange={setBackupOption}
                errors={{}}
                initiallyExpanded={false}
                label={`Energy Storage System ${systemNumber}`}
                onClear={() => {
                  if (!projectID) return;
                  // Clear ALL energy storage related fields
                  void saveSystemDetailsPartialExact(projectID, {
                    // Clear backup option
                    [`${systemPrefix}backup_option`]: null,

                    // Clear SMS fields
                    [`${systemPrefix}sms_existing`]: null,
                    [`${systemPrefix}sms_make`]: null,
                    [`${systemPrefix}sms_model`]: null,
                    [`${systemPrefix}sms_id`]: null,
                    [`${systemPrefix}sms_breaker_rating`]: null,
                    [`${systemPrefix}sms_pv_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_ess_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_tie_in_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_rsd_enabled`]: null,

                    // Clear Battery 1 fields
                    [`${systemPrefix}battery1_existing`]: null,
                    [`${systemPrefix}battery_1_qty`]: null,
                    [`${systemPrefix}battery_1_make`]: null,
                    [`${systemPrefix}battery_1_model`]: null,
                    [`${systemPrefix}battery1_id`]: null,

                    // Clear Battery 2 fields
                    [`${systemPrefix}battery2_existing`]: null,
                    [`${systemPrefix}battery_2_qty`]: null,
                    [`${systemPrefix}battery_2_make`]: null,
                    [`${systemPrefix}battery_2_model`]: null,
                    [`${systemPrefix}battery2_id`]: null,

                    // Clear ESS/Battery Combiner Panel fields
                    [`${systemPrefix}ess_existing`]: null,
                    [`${systemPrefix}ess_make`]: null,
                    [`${systemPrefix}ess_model`]: null,
                    [`${systemPrefix}ess_id`]: null,
                    [`${systemPrefix}ess_main_breaker_rating`]: null,
                    [`${systemPrefix}ess_upstream_breaker_rating`]: null,
                    [`${systemPrefix}ess_upstream_breaker_location`]: null,

                    // Clear Tesla-specific fields
                    [`${systemPrefix}teslagatewaytype`]: null,
                    [`${systemPrefix}backupswitch_location`]: null,
                    [`${systemPrefix}tesla_extensions`]: null,

                    // Clear utility service amps (part of backup option)
                    [`${systemPrefix}utility_service_amps`]: null,
                  });
                  // Clear UI state
                  setBackupOption("");
                  setUtilityServiceAmps("");
                }}
                suppressESS={(() => {
                  // Check if Tesla PowerWall is selected (same logic as OptimizerSection)
                  const make = inverterSection?.selectedMake || "";
                  const model = inverterSection?.selectedModel || "";
                  const modelLabel = inverterSection?.selectedModelLabel || "";
                  const isTesla = make.toLowerCase().includes('tesla');
                  const modelLower = model.toLowerCase();
                  const modelLabelLower = modelLabel.toLowerCase();
                  // Check both model (might be UUID) and modelLabel
                  const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3') ||
                                      modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3') || modelLabelLower.startsWith('powerwall 3');
                  const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                         modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
                  const shouldSuppress = isTesla && (isPowerWall3 || isPowerWallPlus);

                  return shouldSuppress;
                })()}
                utilityServiceAmps={utilityServiceAmps}
                onUtilityServiceAmpsChange={handleUtilityServiceAmpsChange}
              />
            )}

            {/* SMS - Renders in editing screen, hidden from EquipmentCard summary */}
            {visible.sms && (
              <Sys1SMSSection
                  key={`sms-${systemPrefix}`}
                  values={smsValues}
                makes={smsMakes}
                models={smsModels}
                loadMakes={smsLoadMakes}
                loadModels={smsLoadModels}
                loadingMakes={smsLoadingMakes}
                loadingModels={smsLoadingModels}
                isLoading={smsLoadingData}
                backupOption={backupOption}
                label={`Storage Mgmt. System ${systemNumber}`}
                showBOSButton={true}
                onShowBOS={() => showNextAvailableBOS('sms')}
                onClear={async () => {
                  if (!projectID) return;

                  const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

                  try {
                    // Clear SMS fields
                    await saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}sms_existing`]: null,
                      [`${systemPrefix}sms_make`]: null,
                      [`${systemPrefix}sms_model`]: null,
                      [`${systemPrefix}sms_id`]: null,
                      [`${systemPrefix}sms_breaker_rating`]: null,
                      [`${systemPrefix}sms_pv_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_ess_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_tie_in_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_rsd_enabled`]: null,
                    });

                    console.log('[SMS Clear] SMS cleared from dedicated fields');

                    // Clear local state
                    setSmsSection({
                      isNew: true,
                      selectedMakeLabel: '',
                      selectedMakeValue: '',
                      selectedModelLabel: '',
                      selectedModelValue: '',
                      hasRSD: false,
                      selectedMainBreaker: '',
                      selectedPVBreaker: '',
                      selectedESSBreaker: '',
                      selectedTieInBreaker: '',
                      activatePCS: false,
                    });

                    console.log('[SMS Clear] SMS cleared successfully');
                  } catch (error) {
                    console.error('[SMS Clear] Error clearing SMS:', error);
                  }
                }}
                onChange={(field: any, val: any) => {
                  if (field === "activatePCS") {
                    setSmsSection((prev) => ({ ...prev, activatePCS: !!val }));
                    if (projectID != null)
                      void savePcsSetting(projectID, !!val, systemPrefix);
                  } else if (field === "isNew") {
                    // Update local state
                    setSmsSection((prev) => ({ ...prev, isNew: val }));
                    // Save to database: sys1_sms_existing (inverted - isNew=true means existing=false)
                    if (projectID != null) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_existing`]: !val,
                      });
                    }
                  } else if (field === "selectedMakeValue") {
                    const makeLabel = findLabel(smsMakes, val);
                    setSmsSection((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                    // Save SMS make to dedicated field and clear model
                    // Also save sms_existing as false (New) by default when first configured
                    if (projectID != null && makeLabel) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_make`]: makeLabel,
                        [`${systemPrefix}sms_model`]: null, // Clear model when make changes
                        [`${systemPrefix}sms_existing`]: false, // Default to "New" when first configured
                      });
                    }
                  } else if (field === "selectedModelValue") {
                    const modelLabel = findLabel(smsModels, val);
                    setSmsSection((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                    // Save SMS model to dedicated field
                    if (projectID != null && modelLabel) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_model`]: modelLabel,
                        [`${systemPrefix}ess_equipment_type`]: "SMS",
                        [`${systemPrefix}sms_equipment_type`]: "SMS",
                      });
                    }
                  } else {
                    setSmsSection((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
              />
            )}

            {/* Render BOS sections triggered by SMS */}
            {renderBOSForTrigger('sms')}

            {/* Battery Type 1 */}
            {visible.battery1 && (
              <Sys1BatteryType1Section
                key={`battery1-${systemPrefix}`}
                values={battery1Values}
                makes={batteryMakes}
                models={batteryModels}
                loadMakes={batteryLoadMakes}
                loadModels={batteryLoadModels}
                loadingMakes={batteryLoadingMakes}
                loadingModels={batteryLoadingModels}
                isLoading={batteryLoadingData}
                smsData={smsSection.selectedMakeLabel && smsSection.selectedModelLabel ? {
                  make: smsSection.selectedMakeLabel,
                  model: smsSection.selectedModelLabel
                } : null}
                inverterData={inverterSection.selectedMakeLabel && inverterSection.selectedModelLabel ? {
                  make: inverterSection.selectedMakeLabel,
                  model: inverterSection.selectedModelLabel
                } : null}
                batteryCombinerPanelData={combinerSection.selectedMakeLabel && combinerSection.selectedModelLabel ? {
                  make: combinerSection.selectedMakeLabel,
                  model: combinerSection.selectedModelLabel
                } : null}
                onClear={() => {
                  if (!projectID) return;
                  void saveSystemDetailsPartialExact(projectID, {
                    [`${systemPrefix}battery1_existing`]: null,
                    [`${systemPrefix}battery_1_qty`]: null,
                    [`${systemPrefix}battery_1_make`]: null,
                    [`${systemPrefix}battery_1_model`]: null,
                    [`${systemPrefix}battery_1_couple_type`]: null,
                    [`${systemPrefix}battery1_id`]: null,
                    [`${systemPrefix}combination_method`]: null,
                    [`${systemPrefix}battery1_tie_in_location`]: null,
                  });
                }}
                onChange={(field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(batteryMakes, val);
                    setBattery1Section((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                      coupleType: "", // Clear couple_type when make changes
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(batteryModels, val);
                    // Extract couple_type from the selected battery model
                    const selectedModelData = batteryModels.find((m: any) => m.value === val);
                    const coupleType = selectedModelData?.couple_type || "";
                    console.log(`[Battery 1 Model Selected] Model: ${modelLabel}, couple_type: ${coupleType}`);
                    setBattery1Section((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                      coupleType: coupleType,
                    }));
                  } else if (field === "configuration") {
                    setBattery1Section((prev) => ({
                      ...prev,
                      configuration: val,
                    }));
                    // Save internal value directly (daisy_chain, combiner_panel, inverter)
                    // The buildPayload in useEquipmentDetails will save to sys1_combination_method
                    if (projectID && val) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}combination_method`]: val,
                      });
                    }
                  } else if (field === "tieInLocation") {
                    // Save tie-in location to database
                    setBattery1Section((prev) => ({ ...prev, tieInLocation: val }));
                    if (projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}battery1_tie_in_location`]: val || null,
                      });
                    }
                  } else {
                    setBattery1Section((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
                showAddType2={!showBattery2}
                onAddType2={addBatteryType2}
                showConfigInThisSection={showBt1Config}
                showBOSButton={true}
                onShowBOS={() => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_battery1`;
                  if (!showBattery1BOS1) {
                    setShowBattery1BOS1(true);
                    setBattery1BOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                    // Save trigger to database
                    if (projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`bos_${prefix}_battery1_type1_trigger`]: fullTrigger,
                      });
                    }
                  } else if (!showBattery1BOS2) {
                    setShowBattery1BOS2(true);
                    setBattery1BOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                    // Save trigger to database
                    if (projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`bos_${prefix}_battery1_type2_trigger`]: fullTrigger,
                      });
                    }
                  } else if (!showBattery1BOS3) {
                    setShowBattery1BOS3(true);
                    setBattery1BOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                    // Save trigger to database
                    if (projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`bos_${prefix}_battery1_type3_trigger`]: fullTrigger,
                      });
                    }
                  }
                }}
              />
            )}

            {/* Render BOS sections triggered by Battery Type 1 */}
            {(() => {
              console.log(`[BEFORE BatteryChainBOS] Rendering battery1 chain with props:`, {
                systemPrefix,
                showBOS1: showBattery1BOS1,
                showBOS2: showBattery1BOS2,
                showBOS3: showBattery1BOS3,
                bos1Equipment: battery1BOS1Section.equipmentType,
                bos1Trigger: battery1BOS1Section.trigger,
                bos2Equipment: battery1BOS2Section.equipmentType,
                bos2Trigger: battery1BOS2Section.trigger,
                bos3Equipment: battery1BOS3Section.equipmentType,
                bos3Trigger: battery1BOS3Section.trigger,
              });
              return null;
            })()}
            <BatteryChainBOS
              systemPrefix={systemPrefix}
              systemNumber={systemNumber}
              projectID={projectID}
              utilityAbbrev={utilityRequirements?.abbrev}
              maxContinuousOutputAmps={batteryMaxContinuousOutputAmps}
              loadingMaxOutput={loadingBatteryMaxOutput}
              batteryType="battery1"
              bos1Section={battery1BOS1Section}
              bos2Section={battery1BOS2Section}
              bos3Section={battery1BOS3Section}
              showBOS1={showBattery1BOS1}
              showBOS2={showBattery1BOS2}
              showBOS3={showBattery1BOS3}
              setBOS1Section={setBattery1BOS1Section}
              setBOS2Section={setBattery1BOS2Section}
              setBOS3Section={setBattery1BOS3Section}
              setShowBOS1={setShowBattery1BOS1}
              setShowBOS2={setShowBattery1BOS2}
              setShowBOS3={setShowBattery1BOS3}
              onAddNextBOS={() => {
                const prefix = systemPrefix.replace('_', '');
                const fullTrigger = `${prefix}_battery1`;
                if (!showBattery1BOS1) {
                  setShowBattery1BOS1(true);
                  setBattery1BOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                  // Save trigger to database
                  if (projectID) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`bos_${prefix}_battery1_type1_trigger`]: fullTrigger,
                    });
                  }
                } else if (!showBattery1BOS2) {
                  setShowBattery1BOS2(true);
                  setBattery1BOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  // Save trigger to database
                  if (projectID) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`bos_${prefix}_battery1_type2_trigger`]: fullTrigger,
                    });
                  }
                } else if (!showBattery1BOS3) {
                  setShowBattery1BOS3(true);
                  setBattery1BOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  // Save trigger to database
                  if (projectID) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`bos_${prefix}_battery1_type3_trigger`]: fullTrigger,
                    });
                  }
                }
              }}
            />

            {/* Battery Type 2 */}
            {visible.battery2 && (
              <Sys1BatteryType2Section
                key={`battery2-${systemPrefix}`}
                battery1Quantity={Number(battery1Section.quantity || 0)}
                values={battery2Values}
                makes={battery2Makes}
                models={battery2Models}
                loadMakes={battery2LoadMakes}
                loadModels={battery2LoadModels}
                loadingMakes={battery2LoadingMakes}
                loadingModels={battery2LoadingModels}
                isLoading={battery2LoadingData}
                smsData={smsSection.selectedMakeLabel && smsSection.selectedModelLabel ? {
                  make: smsSection.selectedMakeLabel,
                  model: smsSection.selectedModelLabel
                } : null}
                inverterData={inverterSection.selectedMakeLabel && inverterSection.selectedModelLabel ? {
                  make: inverterSection.selectedMakeLabel,
                  model: inverterSection.selectedModelLabel
                } : null}
                batteryCombinerPanelData={combinerSection.selectedMakeLabel && combinerSection.selectedModelLabel ? {
                  make: combinerSection.selectedMakeLabel,
                  model: combinerSection.selectedModelLabel
                } : null}
                onChange={(field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(battery2Makes, val);
                    setBattery2Section((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(battery2Models, val);
                    setBattery2Section((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                  } else if (field === "configuration") {
                    setBattery2Section((prev) => ({
                      ...prev,
                      configuration: val,
                    }));
                    // Save internal value directly (daisy_chain, combiner_panel)
                    // The buildPayload in useEquipmentDetails will save to sys1_combination_method
                    if (projectID && val) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}combination_method`]: val,
                      });
                    }
                  } else if (field === "tieInLocation") {
                    // Save tie-in location to database
                    setBattery2Section((prev) => ({ ...prev, tieInLocation: val }));
                    if (projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}battery2_tie_in_location`]: val || null,
                      });
                    }
                  } else {
                    setBattery2Section((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                onClearType2={removeBatteryType2}
                errors={{}}
                showBOSButton={true}
                onShowBOS={() => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_battery2`;
                  if (!showBattery2BOS1) {
                    setShowBattery2BOS1(true);
                    setBattery2BOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBattery2BOS2) {
                    setShowBattery2BOS2(true);
                    setBattery2BOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBattery2BOS3) {
                    setShowBattery2BOS3(true);
                    setBattery2BOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Render BOS sections triggered by Battery Type 2 */}
            <BatteryChainBOS
              systemPrefix={systemPrefix}
              systemNumber={systemNumber}
              projectID={projectID}
              utilityAbbrev={utilityRequirements?.abbrev}
              maxContinuousOutputAmps={batteryMaxContinuousOutputAmps}
              loadingMaxOutput={loadingBatteryMaxOutput}
              batteryType="battery2"
              bos1Section={battery2BOS1Section}
              bos2Section={battery2BOS2Section}
              bos3Section={battery2BOS3Section}
              showBOS1={showBattery2BOS1}
              showBOS2={showBattery2BOS2}
              showBOS3={showBattery2BOS3}
              setBOS1Section={setBattery2BOS1Section}
              setBOS2Section={setBattery2BOS2Section}
              setBOS3Section={setBattery2BOS3Section}
              setShowBOS1={setShowBattery2BOS1}
              setShowBOS2={setShowBattery2BOS2}
              setShowBOS3={setShowBattery2BOS3}
              onAddNextBOS={() => {
                const prefix = systemPrefix.replace('_', '');
                const fullTrigger = `${prefix}_battery2`;
                if (!showBattery2BOS1) {
                  setShowBattery2BOS1(true);
                  setBattery2BOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                } else if (!showBattery2BOS2) {
                  setShowBattery2BOS2(true);
                  setBattery2BOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                } else if (!showBattery2BOS3) {
                  setShowBattery2BOS3(true);
                  setBattery2BOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                }
              }}
            />

            {console.log('[BATTERY COMBINER PANEL CHECKPOINT] Code block reached!')}

            {/* Optional: ESS sub-combiner (Battery Combiner Panel) - shown only when specific conditions met */}
            {(() => {
              // Only show Battery Combiner Panel when:
              // 1. Battery Type 1 quantity > 1 OR Battery Type 2 is added
              // 2. AND Battery configuration is set to "Battery Combiner Panel" (not "Daisy Chain")
              const qty1 = Number(battery1Section.quantity || 0);
              const hasBattery2 = visible.battery2 && !!battery2Section.selectedModelValue;
              const config = battery1Section.configuration || battery2Section.configuration;
              const isCombinerConfig = config === "combiner_panel";

              const shouldShowCombinerPanel = (qty1 > 1 || hasBattery2) && isCombinerConfig;

              // DEBUG: Log visibility conditions with full context
              console.log('[Battery Combiner Panel] ========================================');
              console.log('[Battery Combiner Panel] Full battery1Section:', battery1Section);
              console.log('[Battery Combiner Panel] Full battery2Section:', battery2Section);
              console.log('[Battery Combiner Panel] Visibility check:', {
                qty1,
                hasBattery2,
                config,
                isCombinerConfig,
                shouldShowCombinerPanel,
                battery1Config: battery1Section.configuration,
                battery2Config: battery2Section.configuration,
                visible_battery2: visible.battery2,
                battery2Model: battery2Section.selectedModelValue,
                systemPrefix,
              });
              console.log('[Battery Combiner Panel] Will render:', shouldShowCombinerPanel ? 'YES ✓' : 'NO ✗');
              console.log('[Battery Combiner Panel] ========================================');

              if (!shouldShowCombinerPanel) {
                console.log('[Battery Combiner Panel] NOT RENDERING - conditions not met');
                return null;
              }

              console.log('[Battery Combiner Panel] RENDERING SECTION NOW...');

              return (
                <Sys1BatteryCombinerPanel1Section
                  key={`battery-combiner-panel-${systemPrefix}`}
                  values={{
                    isNew: batteryCombinerPanelSection.isNew,
                    selectedMake: batteryCombinerPanelSection.selectedMakeValue,
                    selectedModel: batteryCombinerPanelSection.selectedModelValue,
                    selectedBusAmps: batteryCombinerPanelSection.busBar,
                    selectedMainBreaker: batteryCombinerPanelSection.mainBreaker,
                    tieInBreaker: batteryCombinerPanelSection.tieInBreaker,
                  }}
                  isLoading={bcpLoadingData}
                  onClear={() => {
                    if (!projectID) return;
                    const clearPayload: Record<string, null> = {};

                    const makeField = getBCPFieldName('make');
                    const modelField = getBCPFieldName('model');
                    const busbarField = getBCPFieldName('busbar');
                    const mainbreakerField = getBCPFieldName('mainbreaker');
                    const tieinbreakerField = getBCPFieldName('tieinbreaker');
                    const existingField = getBCPFieldName('existing');

                    if (makeField) clearPayload[makeField] = null;
                    if (modelField) clearPayload[modelField] = null;
                    if (busbarField) clearPayload[busbarField] = null;
                    if (mainbreakerField) clearPayload[mainbreakerField] = null;
                    if (tieinbreakerField) clearPayload[tieinbreakerField] = null;
                    if (existingField) clearPayload[existingField] = null;

                    void saveSystemDetailsPartialExact(projectID, clearPayload);
                  }}
                  onChange={(field: string, val: any) => {
                    if (field === "selectedMake") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        selectedMakeValue: val,
                        selectedMakeLabel: val,
                      }));
                      if (projectID) {
                        const makeField = getBCPFieldName('make');
                        if (makeField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [makeField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedModel") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        selectedModelValue: val,
                        selectedModelLabel: val,
                      }));
                      if (projectID) {
                        const modelField = getBCPFieldName('model');
                        if (modelField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [modelField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedBusAmps") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        busBar: val,
                      }));
                      if (projectID) {
                        const busbarField = getBCPFieldName('busbar');
                        if (busbarField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [busbarField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedMainBreaker") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, mainBreaker: val }));
                      if (projectID) {
                        const mainbreakerField = getBCPFieldName('mainbreaker');
                        if (mainbreakerField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [mainbreakerField]: val || null,
                          });
                        }
                      }
                    } else if (field === "tieInBreaker") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, tieInBreaker: val }));
                      if (projectID) {
                        const tieinbreakerField = getBCPFieldName('tieinbreaker');
                        if (tieinbreakerField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [tieinbreakerField]: val || null,
                          });
                        }
                      }
                    } else if (field === "isNew") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, isNew: val }));
                      if (projectID) {
                        const existingField = getBCPFieldName('existing');
                        if (existingField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [existingField]: val ? false : true,
                          });
                        }
                      }
                    }
                  }}
                  errors={{}}
                />
              );
            })()}

            {/* Backup Subpanel (for Whole Home and Partial Home backup) */}
            {visible.backupSubpanel && (
              <Sys1BackupLoadSubPanelSection
                key={`backup-subpanel-${systemPrefix}`}
                values={backupValues}
                backupSystemSize={utilityServiceAmps}
                label={`Backup Load Sub Panel ${systemNumber}`}
                onChange={async (field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(backupMakes, val);
                    setBackupSection((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(backupModels, val);

                    // Extract bus rating from model label (e.g., "200 Amps" -> "200")
                    let busRating = "";
                    const ampMatch = modelLabel.match(/(\d+)\s*Amps?/i);
                    if (ampMatch) {
                      busRating = ampMatch[1];
                      console.log(`[Backup Panel] Extracted bus rating: ${busRating} from model: ${modelLabel}`);
                    }

                    setBackupSection((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                      busAmps: busRating || prev.busAmps, // Auto-populate bus rating if found, otherwise keep existing
                    }));

                    // Auto-save bus rating to database if extracted
                    if (busRating && projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: busRating });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: busRating });
                      }
                      console.log(`[Backup Panel] Auto-saved bus rating: ${busRating}`);
                    }
                  } else if (field === "selectedBusAmps") {
                    setBackupSection((prev) => ({ ...prev, busAmps: val }));
                    // Immediate save for bus amps to prevent loss during re-hydration
                    if (projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: val });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: val });
                      }
                    }
                  } else if (field === "selectedMainBreaker") {
                    setBackupSection((prev) => ({ ...prev, mainBreaker: val }));
                    // Immediate save for main breaker to prevent loss during re-hydration
                    if (projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_main_breaker_rating: val });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadpanel_mcb_rating: val });
                      }
                    }
                  } else if (field === "selectedTieInBreaker") {
                    setBackupSection((prev) => ({ ...prev, tieInBreaker: val }));
                  } else {
                    setBackupSection((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
                showBOSButton={true}
                onShowBOS={() => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_backup`;
                  if (!showBackupBOS1) {
                    setShowBackupBOS1(true);
                    setBackupBOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBackupBOS2) {
                    setShowBackupBOS2(true);
                    setBackupBOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBackupBOS3) {
                    setShowBackupBOS3(true);
                    setBackupBOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Render BOS sections for Backup Chain */}
            {visible.backupSubpanel && (
              <BackupChainBOS
                systemPrefix={systemPrefix}
                systemNumber={systemNumber}
                projectID={projectID}
                utilityAbbrev={utilityRequirements?.abbrev}
                maxContinuousOutputAmps={maxContinuousOutputAmps}
                loadingMaxOutput={loadingMaxOutput}
                bos1Section={backupBOS1Section}
                bos2Section={backupBOS2Section}
                bos3Section={backupBOS3Section}
                showBOS1={showBackupBOS1}
                showBOS2={showBackupBOS2}
                showBOS3={showBackupBOS3}
                setBOS1Section={setBackupBOS1Section}
                setBOS2Section={setBackupBOS2Section}
                setBOS3Section={setBackupBOS3Section}
                setShowBOS1={setShowBackupBOS1}
                setShowBOS2={setShowBackupBOS2}
                setShowBOS3={setShowBackupBOS3}
                onAddNextBOS={(position: number) => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_backup`;
                  if (position === 2) {
                    setShowBackupBOS2(true);
                    setBackupBOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (position === 3) {
                    setShowBackupBOS3(true);
                    setBackupBOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Post SMS BOS Button - Show when system has backup configured and ESS/batteries */}
            {visible.backupSubpanel && !showPostSMSBOS && !showPostSMSBOSType2 && !showPostSMSBOSType3 && (
              <View style={{ paddingHorizontal: moderateScale(16), marginTop: moderateScale(16) }}>
                <SystemButton
                  label="Post SMS BOS Equipment"
                  onPress={() => showNextAvailablePostSMSBOS()}
                  style={{ width: "100%" }}
                />
              </View>
            )}

            {/* Post SMS BOS - Equipment after SMS (for systems with batteries) */}
            {renderPostSMSBOS()}
          </>
        )}

        {/* ================ INVERTER PATH ================ */}
        {visible.inverter && (
          <>
            {console.log(`[EQUIPMENT DETAILS] Rendering InverterSection for ${systemLabel}:`, {
              systemNumber,
              systemPrefix,
              branchString1: inverterSection.branchString1,
              branchString2: inverterSection.branchString2,
              branchString3: inverterSection.branchString3,
            })}
            <InverterSection
              key={`inverter-${systemPrefix}`}
              values={inverterValues}
              makes={inverterMakes}
              models={inverterModels}
              loadMakes={inverterLoadMakes}
              loadModels={inverterLoadModels}
              loadingMakes={inverterLoadingMakes}
              loadingModels={inverterLoadingModels}
              isLoading={inverterLoadingData}
              label={`Inverter ${systemNumber}`}
              solarPanelQuantity={parseInt(solarSection.quantity) || 0}
              // Individual branch string fields (simple like solar panel qty)
              branchStringValues={{
                branchString1: inverterSection.branchString1 || "",
                branchString2: inverterSection.branchString2 || "",
                branchString3: inverterSection.branchString3 || "",
                branchString4: inverterSection.branchString4 || "",
                branchString5: inverterSection.branchString5 || "",
                branchString6: inverterSection.branchString6 || "",
              }}
              onBranchStringChange={(field, value) => {
                setInverterSection((prev) => ({
                  ...prev,
                  [field]: value,
                }));
              }}
              stringingType={stringingType}
              onStringingTypeChange={setStringingType}
              solarPanelIsNew={solarSection.isNew}

              // Optimizer props (integrated into InverterSection)
              optimizerValues={optimizerValues}
              optimizerMakes={optimizerMakes ?? []}
              optimizerModels={optimizerModels ?? []}
              optimizerLoadMakes={optimizerLoadMakes ?? (() => {})}
              optimizerLoadModels={optimizerLoadModels ?? (() => {})}
              optimizerLoadingMakes={!!optimizerLoadingMakes}
              optimizerLoadingModels={!!optimizerLoadingModels}
              optimizerErrors={{}}
              onOptimizerChange={(field: string, val: any) => {
                if (field === "selectedMake") {
                  const makeLabel = findLabel(optimizerMakes ?? [], val);
                  setOptimizerSection((prev) => ({
                    ...prev,
                    selectedMake: val,
                    selectedMakeValue: val,
                    selectedMakeLabel: makeLabel,
                    selectedModel: "",
                    selectedModelValue: "",
                    selectedModelLabel: "",
                  }));
                  optimizerLoadModels?.();
                } else if (field === "selectedModel") {
                  const modelLabel = findLabel(optimizerModels ?? [], val);
                  setOptimizerSection((prev) => ({
                    ...prev,
                    selectedModel: val,
                    selectedModelValue: val,
                    selectedModelLabel: modelLabel,
                  }));
                } else if (field === "isNew") {
                  setOptimizerSection((prev) => ({ ...prev, isNew: !!val }));
                } else {
                  setOptimizerSection((prev) => ({ ...prev, [field]: val }));
                }
              }}
              onChange={(field: string, val: any) => {
                if (field === "selectedMake") {
                  const makeLabel = findLabel(inverterMakes, val);
                  setInverterSection((prev) => {
                    // During hydration, don't clear model if it's already set
                    const shouldClearModel = !isLoadingSystemData && prev.selectedMake !== val;

                    // When inverter make changes, clear PowerWall/Gateway/Sol-Ark configuration fields
                    // This prevents old configuration from persisting when switching inverter brands
                    if (shouldClearModel && projectID) {
                      void saveSystemDetailsPartialExact(projectID, {
                        // PowerWall Configuration Section fields
                        [`${systemPrefix}ess_make`]: null,
                        [`${systemPrefix}ess_model`]: null,
                        [`${systemPrefix}backupswitch_location`]: null,
                        [`${systemPrefix}combination_method`]: null,
                        [`${systemPrefix}tesla_extensions`]: null,

                        // Gateway Configuration Section fields
                        [`${systemPrefix}ess_existing`]: null,
                        [`${systemPrefix}ess_main_breaker_rating`]: null,
                        [`${systemPrefix}ess_backup_subpanel_main_breaker_rating`]: null,
                        [`${systemPrefix}pcs_settings`]: null,
                        [`${systemPrefix}ess_pv_breaker_rating_override`]: null,
                        [`${systemPrefix}ess_ess_breaker_rating_override`]: null,
                        [`${systemPrefix}ess_upstream_breaker_rating`]: null,
                      });

                      console.log(`[Inverter Change] Cleared PowerWall/Gateway configuration fields for ${systemPrefix}`);
                    }

                    return {
                      ...prev,
                      selectedMake: val,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      // Only clear model if not hydrating and make actually changed
                      ...(shouldClearModel ? {
                        selectedModel: "",
                        selectedModelValue: "",
                        selectedModelLabel: "",
                      } : {}),
                      // Auto-capture: when make changes (and not during hydration), assume it's new equipment
                      ...(shouldClearModel ? { isNew: true } : {}),
                    };
                  });
                  inverterLoadModels?.();
                } else if (field === "selectedModel") {
                  const modelLabel = findLabel(inverterModels, val);

                  // Temporarily block empty onChange calls to prevent clearing
                  if (!val && !modelLabel) {
                    return;
                  }

                  setInverterSection((prev) => ({
                    ...prev,
                    selectedModel: val,
                    selectedModelValue: val,
                    selectedModelLabel: modelLabel,
                    // Auto-capture: when model changes (and not during hydration), assume it's new equipment
                    ...(!isLoadingSystemData && val ? { isNew: true } : {}),
                  }));

                  // Auto-populate battery fields when PowerWall 3 is selected
                  // PowerWall 3 has an integrated battery
                  if (val === "Powerwall 3" && inverterSection.selectedMake === "Tesla" && projectID) {
                    console.log('[PowerWall 3] Auto-populating battery fields for integrated battery');

                    // Set battery type 1 fields
                    setBatteryType1Section((prev) => ({
                      ...prev,
                      selectedMake: "Tesla",
                      selectedMakeValue: "Tesla",
                      selectedMakeLabel: "Tesla",
                      selectedModel: "Powerwall 3",
                      selectedModelValue: "Powerwall 3",
                      selectedModelLabel: "Powerwall 3",
                      isNew: true,
                      quantity: "1",
                    }));

                    // Save to database
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}battery_type_1_make`]: "Tesla",
                      [`${systemPrefix}battery_type_1_model`]: "Powerwall 3",
                      [`${systemPrefix}battery_type_1_existing`]: false, // New battery
                      [`${systemPrefix}battery_type_1_qty`]: 1,
                    });

                    console.log('[PowerWall 3] Battery fields auto-populated: Tesla Powerwall 3, qty=1, isNew=true');
                  }

                  // Fetch hybrid field from inverter API
                  if (inverterSection.selectedMake && val) {
                    const fetchHybrid = async () => {
                      try {
                        // First get the list to find the ID
                        const URL = `${require('../../../../config/apiEndPoint').default.BASE_URL}/api/inverters/models?manufacturer=${encodeURIComponent(inverterSection.selectedMake)}`;
                        const response = await require('../../../../api/axiosInstance').default.get(URL);

                        if (response?.data?.success && Array.isArray(response.data.data)) {
                          const modelData = response.data.data.find((item: any) =>
                            item.model_number === val ||
                            item.name === val ||
                            item.model === val ||
                            item.label === val ||
                            item.value === val ||
                            (item.make_model && item.make_model.includes(val))
                          );

                          if (modelData?.id) {
                            // Now fetch full details by ID
                            const detailURL = `${require('../../../../config/apiEndPoint').default.BASE_URL}/api/inverters/${modelData.id}`;
                            const detailResponse = await require('../../../../api/axiosInstance').default.get(detailURL);

                            if (detailResponse?.data?.success && detailResponse.data.data) {
                              const fullData = detailResponse.data.data;

                              const isHybrid = fullData.equipment_type === "Yes" ? "Yes" : fullData.hybrid;
                              if (isHybrid) {
                                setInverterSection((prev) => ({
                                  ...prev,
                                  hybrid: isHybrid
                                }));
                              }
                            }
                          }
                        }
                      } catch (error) {
                        // Silently fail
                      }
                    };
                    fetchHybrid();
                  }
                } else if (field === "isNew") {
                  setInverterSection((prev) => ({ ...prev, isNew: !!val }));
                } else if (field === "hybrid") {
                  setInverterSection((prev) => ({ ...prev, hybrid: val }));
                }
              }}
              showBOSButton={true}
              onShowBOS={() => showNextAvailableBOS('inverter')}
              utilityRequirements={utilityRequirements}
              errors={{}}
            />

            {/* Render BOS sections triggered by Inverter */}
            {renderBOSForTrigger('inverter')}

            {/* PowerWall Configuration Section */}
            <PowerWallConfigurationSection
              key={`powerwall-${systemPrefix}`}
              systemLabel={systemLabel}
              make={inverterSection?.selectedMake || ""}
              model={inverterSection?.selectedModel || ""}
              values={{
                expansionPacks: inverterSection?.expansionPacks || 0,
                gateway: inverterSection?.gateway || "",
                backupSwitchLocation: (() => {
                  // Map text values from database back to internal values for UI
                  const textValue = inverterSection?.backupSwitchLocation || "";
                  const reverseLocationMap: Record<string, string> = {
                    "Behind Utility Meter": "behind_utility_meter",
                    "Stand Alone Meter Panel": "stand_alone_meter_panel",
                  };
                  return reverseLocationMap[textValue] || textValue;
                })(),
                backupOption: backupOption,
                batteryExisting: inverterSection?.batteryExisting || false,
              }}
              onChange={async (field, value) => {
                if (field === "gateway") {
                  // Handle gateway field to save proper text labels to database
                  // Map gateway values to text labels for database storage
                  const gatewayLabels: Record<string, string> = {
                    "backup_gateway_2": "Backup Gateway 2",
                    "gateway_3": "Gateway 3",
                    "backup_switch": "Backup Switch",
                  };

                  const gatewayText = gatewayLabels[value] || value;

                  setInverterSection((prev) => ({
                    ...prev,
                    gateway: value, // Keep original value for UI logic
                    teslaGatewayType: gatewayText, // Store text label for database
                  }));

                  // Handle different gateway types differently
                  if (projectID && value === "backup_switch") {
                    // Backup Switch: ONLY save to teslagatewaytype field (not SMS or ESS)
                    // Note: sys1_gateway field doesn't exist in schema, only teslagatewaytype
                    const backupSwitchPayload = {
                      [`${systemPrefix}teslagatewaytype`]: gatewayText,
                    };
                    console.log('[Gateway] Saving Backup Switch to teslagatewaytype only:', backupSwitchPayload);
                    void saveSystemDetailsPartialExact(projectID, backupSwitchPayload);
                  } else if (projectID && value) {
                    // Gateway 3 or Backup Gateway 2: Save to SMS fields (merged - Gateway IS the SMS)
                    // Note: sys1_gateway field doesn't exist in schema, only teslagatewaytype
                    const smsPayload = {
                      [`${systemPrefix}sms_make`]: "Tesla",
                      [`${systemPrefix}sms_model`]: gatewayText, // Use the full text label as model
                      [`${systemPrefix}teslagatewaytype`]: gatewayText, // Also save for legacy compatibility
                      [`${systemPrefix}sms_existing`]: false, // Default to "New" (false) when first configured
                    };
                    console.log('[Gateway] Saving Gateway to SMS fields:', smsPayload);
                    void saveSystemDetailsPartialExact(projectID, smsPayload);
                  } else if (projectID && !value) {
                    // Clear SMS fields if no gateway selected
                    const clearPayload = {
                      [`${systemPrefix}sms_make`]: null,
                      [`${systemPrefix}sms_model`]: null,
                      [`${systemPrefix}teslagatewaytype`]: null,
                      [`${systemPrefix}sms_existing`]: null,
                    };
                    console.log('[Gateway] Clearing Gateway from SMS fields:', clearPayload);
                    void saveSystemDetailsPartialExact(projectID, clearPayload);
                  }

                  // Auto-add Gateway 3 to BOS chain for PowerWall 3 configurations
                  // ONLY Gateway 3 should set ESS fields - Backup Switch has its own dedicated fields
                  if (value === "gateway_3" && projectID) {
                    console.log('[PowerWall] Gateway 3 selected - checking for existing SMS before adding');

                    const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

                    // Check if SMS already exists in any BOS slot to prevent duplicates
                    const currentData = await fetchSystemDetails(projectID);
                    // Set ESS and SMS equipment type fields to "SMS" for Gateway 3 ONLY
                    // Backup Switch goes to its own fields and should NOT populate ESS fields
                    // SMS placement in BOS is now handled downstream in Excel/calculator
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${prefix}_ess_equipment_type`]: "SMS",
                      [`${prefix}_sms_equipment_type`]: "SMS",
                    });
                    console.log(`[PowerWall] Gateway 3 detected - SMS equipment type fields set`);
                  } else if (value === "backup_switch" && projectID) {
                    // Backup Switch should NOT populate ESS or SMS fields
                    // It only saves to teslagatewaytype field (line 4626)
                    // and has its own backup switch location field
                    console.log('[PowerWall] Backup Switch selected - saved to teslagatewaytype only, NOT to SMS or ESS fields');
                  }
                } else if (field === "backupSwitchLocation") {
                  // Map backup switch location values to text labels for database storage
                  const locationLabels: Record<string, string> = {
                    "behind_utility_meter": "Behind Utility Meter",
                    "stand_alone_meter_panel": "Stand Alone Meter Panel",
                  };

                  const locationText = locationLabels[value] || value;

                  setInverterSection((prev) => ({
                    ...prev,
                    backupSwitchLocation: value, // Keep original value for UI logic
                  }));

                  // Save to database with system prefix
                  if (projectID && locationText) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}backupswitch_location`]: locationText,
                    });
                  } else if (projectID && !value) {
                    // Clear the field if no value selected
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}backupswitch_location`]: null,
                    });
                  }
                } else if (field === "expansionPacks") {
                  // Handle expansionPacks field - hook will auto-save
                  setInverterSection((prev) => ({
                    ...prev,
                    [field]: value,
                  }));

                  // Set combination method to "Daisy Chain" when expansions > 0
                  if (projectID && value > 0) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}combination_method`]: "Daisy Chain",
                    });
                  } else if (projectID && value === 0) {
                    // Clear combination method when no expansions
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}combination_method`]: null,
                    });
                  }
                } else if (field === "backupOption") {
                  // Handle backup option - DON'T add to inverter state, only update top-level state
                  // NOTE: We deliberately don't call setInverterSection here because backupOption
                  // should ONLY be managed in the top-level hook state, not in inverter section state.
                  // Adding it to inverter state causes hydration race conditions where stale values overwrite user selections.

                  // IMPORTANT: Update the main backupOption state to trigger visibility changes
                  // This enables Backup Load Sub Panel section to appear for PowerWall 3 path
                  setBackupOption(value);

                  // Save to database with system prefix
                  if (projectID) {
                    void saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}backup_option`]: value || null,
                    });
                  }
                } else if (field === "batteryExisting") {
                  // Handle battery existing toggle - hook will auto-save
                  setInverterSection((prev) => ({
                    ...prev,
                    [field]: value,
                  }));
                } else {
                  setInverterSection((prev) => ({
                    ...prev,
                    [field]: value,
                  }));
                }
              }}
              visible={(() => {
                // Show ONLY for Tesla PowerWall models
                const make = inverterSection?.selectedMake || "";
                const model = inverterSection?.selectedModel || "";
                const modelLabel = inverterSection?.selectedModelLabel || "";
                const makeLower = make.toLowerCase();
                const modelLower = model.toLowerCase();
                const modelLabelLower = modelLabel.toLowerCase();

                // Check for Tesla PowerWall
                const isTesla = makeLower.includes('tesla');
                const isPowerWall = modelLower.includes('powerwall') || modelLabelLower.includes('powerwall');
                const isTeslaPowerWall = isTesla && isPowerWall;

                return isTeslaPowerWall;
              })()}
              showBOSButton={true}
              onShowBOS={() => showNextAvailableBOS('stringCombiner')}
            />

            {/* Render BOS sections triggered by String Combiner Panel / Inverter */}
            {renderBOSForTrigger('stringCombiner')}

            {/* Gateway Configuration Section - Show when Backup Gateway 2 or Gateway 3 selected */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const gateway = inverterSection?.gateway || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              // Check both model (might be UUID) and modelLabel
              const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') ||
                                  modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3');
              const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                     modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
              const showGatewayConfig = isTesla && (isPowerWall3 || isPowerWallPlus) &&
                                       (gateway === "backup_gateway_2" || gateway === "gateway_3");

              if (!showGatewayConfig) return null;

              // Save default values when section first becomes visible
              if (projectID && showGatewayConfig) {
                // Only save defaults if not already set to avoid overwriting user changes
                const hasDefaults = inverterSection?.gatewayConfigIsNew !== undefined;
                if (!hasDefaults) {
                  void saveSystemDetailsPartialExact(projectID, {
                    [`${systemPrefix}ess_existing`]: false, // Default to "New" (false)
                    [`${systemPrefix}ess_main_breaker_rating`]: "MLO", // Default to MLO
                  });
                }
              }

              return (
                <Sys1GatewayConfigurationSection
                  key={`gateway-config-${systemPrefix}`}
                  systemLabel={systemLabel}
                  values={{
                    isNew: inverterSection?.gatewayConfigIsNew ?? true,
                    selectedMainBreaker: inverterSection?.gatewayConfigMainBreaker ?? "",
                    selectedBackupPanel: inverterSection?.gatewayConfigBackupPanel ?? "",
                    activatePCS: inverterSection?.gatewayConfigActivatePCS ?? false,
                    selectedPVBreaker: inverterSection?.gatewayConfigPVBreaker ?? "",
                    selectedESSBreaker: inverterSection?.gatewayConfigESSBreaker ?? "",
                    selectedTieInBreaker: inverterSection?.gatewayConfigTieInBreaker ?? "",
                  }}
                  onChange={(field, value) => {
                    // Map field names to inverter section with prefix
                    const fieldMap: Record<string, string> = {
                      'isNew': 'gatewayConfigIsNew',
                      'selectedMainBreaker': 'gatewayConfigMainBreaker',
                      'selectedBackupPanel': 'gatewayConfigBackupPanel',
                      'activatePCS': 'gatewayConfigActivatePCS',
                      'selectedPVBreaker': 'gatewayConfigPVBreaker',
                      'selectedESSBreaker': 'gatewayConfigESSBreaker',
                      'selectedTieInBreaker': 'gatewayConfigTieInBreaker',
                    };

                    const mappedField = fieldMap[field] || field;
                    setInverterSection((prev) => ({
                      ...prev,
                      [mappedField]: value,
                    }));

                    // Gateway Configuration now saves to SMS fields (merged with SMS section)
                    if (projectID) {
                      if (field === 'isNew') {
                        // Save Gateway isNew to sys1_sms_existing field
                        // If Gateway is "new" (isNew=true), then sms_existing=false
                        // If Gateway is "existing" (isNew=false), then sms_existing=true
                        const smsExistingValue = !value; // Invert: new=false, existing=true
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_existing`]: smsExistingValue,
                        });
                        console.log(`[Gateway] isNew changed to ${value}, saving ${systemPrefix}sms_existing as ${smsExistingValue}`);
                      } else if (field === 'selectedMainBreaker') {
                        // Save to SMS main breaker field
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_breaker_rating`]: value || "MLO",
                        });
                      } else if (field === 'selectedBackupPanel') {
                        // Save to SMS backup load sub panel breaker rating
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_backup_load_sub_panel_breaker_rating`]: value || "MLO",
                        });
                      } else if (field === 'activatePCS') {
                        // Save sys1_pcs_settings (shared field)
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}pcs_settings`]: !!value,
                        });
                      } else if (field === 'selectedPVBreaker') {
                        // Save to SMS PV breaker override
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_pv_breaker_rating_override`]: value,
                        });
                      } else if (field === 'selectedESSBreaker') {
                        // Save to SMS ESS breaker override
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_ess_breaker_rating_override`]: value,
                        });
                      } else if (field === 'selectedTieInBreaker') {
                        // Save to SMS tie-in breaker override
                        void saveSystemDetailsPartialExact(projectID, {
                          [`${systemPrefix}sms_tie_in_breaker_rating_override`]: value,
                        });
                      }
                    }
                  }}
                  errors={{}}
                  gatewayType={gateway as "backup_gateway_2" | "gateway_3"}
                />
              );
            })()}

            {/* Backup Load Sub Panel - Show for PowerWall 3 when Whole Home or Partial Home is selected */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              // Use top-level backupOption state, not inverterSection.backupOption
              const backupOpt = backupOption || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') ||
                                  modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3');
              const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                     modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');

              // Check if inverter is hybrid (hybrid field is stored as "Yes" or empty string)
              const isHybridInverter = inverterSection.hybrid === "Yes" || inverterSection.hybrid === true;

              // Show backup panel for:
              // 1. Tesla PowerWall 3/+ with Whole/Partial Home backup
              // 2. Hybrid inverters (which act as SMS and may have backup capability)
              const showBackupPanel = (isTesla && (isPowerWall3 || isPowerWallPlus) &&
                                      (backupOpt === "Whole Home" || backupOpt === "Partial Home")) ||
                                      isHybridInverter;

              console.log(`[Backup Panel] Checking visibility: isTesla=${isTesla}, isPW3=${isPowerWall3}, isPW+=${isPowerWallPlus}, backupOpt=${backupOpt}, isHybrid=${isHybridInverter}, showPanel=${showBackupPanel}`);

              if (!showBackupPanel) return null;

              return (
                <Sys1BackupLoadSubPanelSection
                  key={`backup-subpanel-powerwall-${systemPrefix}`}
                  values={backupValues}
                  backupSystemSize={utilityServiceAmps}
                  onChange={(field: string, val: any) => {
                    if (field === "selectedMake") {
                      const makeLabel = findLabel(backupMakes, val);
                      setBackupSection((prev) => ({
                        ...prev,
                        selectedMakeValue: val,
                        selectedMakeLabel: makeLabel,
                        selectedModelValue: "",
                        selectedModelLabel: "",
                      }));
                      backupLoadMakes();
                    } else if (field === "selectedModel") {
                      const modelLabel = findLabel(backupModels, val);

                      // Extract bus rating from model label (e.g., "200 Amps" -> "200")
                      let busRating = "";
                      const ampMatch = modelLabel.match(/(\d+)\s*Amps?/i);
                      if (ampMatch) {
                        busRating = ampMatch[1];
                        console.log(`[PowerWall Backup Panel] Extracted bus rating: ${busRating} from model: ${modelLabel}`);
                      }

                      setBackupSection((prev) => ({
                        ...prev,
                        selectedModelValue: val,
                        selectedModelLabel: modelLabel,
                        busAmps: busRating || prev.busAmps, // Auto-populate bus rating if found, otherwise keep existing
                      }));

                      // Auto-save bus rating to database if extracted
                      if (busRating && projectID) {
                        const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                        if (sysNum === '1') {
                          void saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: busRating });
                        } else if (sysNum === '2') {
                          void saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: busRating });
                        }
                        console.log(`[PowerWall Backup Panel] Auto-saved bus rating: ${busRating}`);
                      }
                    } else if (field === "selectedBusAmps") {
                      setBackupSection((prev) => ({ ...prev, busAmps: val }));
                      // Immediate save for bus amps to prevent loss during re-hydration
                      if (projectID) {
                        const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                        if (sysNum === '1') {
                          void saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: val });
                        } else if (sysNum === '2') {
                          void saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: val });
                        }
                      }
                    } else if (field === "selectedMainBreaker") {
                      setBackupSection((prev) => ({ ...prev, mainBreaker: val }));
                      // Immediate save for main breaker to prevent loss during re-hydration
                      if (projectID) {
                        const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                        if (sysNum === '1') {
                          void saveSystemDetailsPartialExact(projectID, { bls1_backuploader_main_breaker_rating: val });
                        } else if (sysNum === '2') {
                          void saveSystemDetailsPartialExact(projectID, { sys2_backuploadpanel_mcb_rating: val });
                        }
                      }
                    } else if (field === "selectedTieInBreaker") {
                      setBackupSection((prev) => ({ ...prev, tieInBreaker: val }));
                    } else {
                      setBackupSection((prev) => ({ ...prev, [field]: val }));
                    }
                  }}
                  makes={backupMakes}
                  models={backupModels}
                  loadMakes={backupLoadMakes}
                  loadModels={backupLoadModels}
                  loadingMakes={backupLoadingMakes}
                  loadingModels={backupLoadingModels}
                  label={`Backup Load Sub Panel ${systemNumber}`}
                  errors={{}}
                />
              );
            })()}

            {/* BackupChainBOS - Show for PowerWall when backup panel is configured */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const backupOpt = backupOption || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') ||
                                  modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3');
              const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                     modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
              const showBackupBOS = isTesla && (isPowerWall3 || isPowerWallPlus) &&
                                   (backupOpt === "Whole Home" || backupOpt === "Partial Home");

              console.log(`[BackupChainBOS PowerWall] Checking visibility: isTesla=${isTesla}, isPW3=${isPowerWall3}, isPW+=${isPowerWallPlus}, backupOpt=${backupOpt}, showBackupBOS=${showBackupBOS}`);

              if (!showBackupBOS) return null;

              return (
                <BackupChainBOS
                  systemPrefix={systemPrefix}
                  systemNumber={systemNumber}
                  projectID={projectID}
                  utilityAbbrev={utilityRequirements?.abbrev}
                  maxContinuousOutputAmps={maxContinuousOutputAmps}
                  loadingMaxOutput={loadingMaxOutput}
                  bos1Section={backupBOS1Section}
                  bos2Section={backupBOS2Section}
                  bos3Section={backupBOS3Section}
                  showBOS1={showBackupBOS1}
                  showBOS2={showBackupBOS2}
                  showBOS3={showBackupBOS3}
                  setBOS1Section={setBackupBOS1Section}
                  setBOS2Section={setBackupBOS2Section}
                  setBOS3Section={setBackupBOS3Section}
                  setShowBOS1={setShowBackupBOS1}
                  setShowBOS2={setShowBackupBOS2}
                  setShowBOS3={setShowBackupBOS3}
                  onAddNextBOS={(position: number) => {
                    const prefix = systemPrefix.replace('_', '');
                    const fullTrigger = `${prefix}_backup`;
                    if (position === 2) {
                      setShowBackupBOS2(true);
                      setBackupBOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                    } else if (position === 3) {
                      setShowBackupBOS3(true);
                      setBackupBOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                    }
                  }}
                />
              );
            })()}

            {/* Post SMS BOS Button - Show for PowerWall when backup is configured */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const backupOpt = backupOption || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') ||
                                  modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3');
              const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                     modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
              const showButton = isTesla && (isPowerWall3 || isPowerWallPlus) &&
                                (backupOpt === "Whole Home" || backupOpt === "Partial Home") &&
                                !showPostSMSBOS && !showPostSMSBOSType2 && !showPostSMSBOSType3;

              if (!showButton) return null;

              return (
                <View style={{ paddingHorizontal: moderateScale(16), marginTop: moderateScale(16) }}>
                  <SystemButton
                    label="Post SMS BOS Equipment"
                    onPress={() => showNextAvailablePostSMSBOS()}
                    style={{ width: "100%" }}
                  />
                </View>
              );
            })()}

            {/* Post SMS BOS - Equipment after SMS for PowerWall */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const backupOpt = backupOption || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') ||
                                  modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3');
              const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                     modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
              const showPostSMS = isTesla && (isPowerWall3 || isPowerWallPlus) &&
                                 (backupOpt === "Whole Home" || backupOpt === "Partial Home");

              if (!showPostSMS) return null;

              return renderPostSMSBOS();
            })()}

            {/* OPTIMIZER SECTION - Commented out, now integrated into InverterSection */}
            {/* {visible.optimizer && optimizerSection && (
              <OptimizerSection
                key={`optimizer-${systemPrefix}`}
                values={optimizerValues}
                makes={optimizerMakes ?? []}
                models={optimizerModels ?? []}
                loadMakes={optimizerLoadMakes ?? (() => {})}
                loadModels={optimizerLoadModels ?? (() => {})}
                loadingMakes={!!optimizerLoadingMakes}
                loadingModels={!!optimizerLoadingModels}
                label={`Optimizer ${systemNumber}`}
                suppressOptimizer={(() => {
                  // Check if Tesla PowerWall is selected (same logic as InverterSection)
                  const make = inverterSection?.selectedMake || "";
                  const model = inverterSection?.selectedModel || "";
                  const modelLabel = inverterSection?.selectedModelLabel || "";
                  const isTesla = make.toLowerCase().includes('tesla');
                  const modelLower = model.toLowerCase();
                  const modelLabelLower = modelLabel.toLowerCase();
                  // Check both model (might be UUID) and modelLabel
                  const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3') ||
                                      modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3') || modelLabelLower.startsWith('powerwall 3');
                  const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                         modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
                  const shouldSuppress = isTesla && (isPowerWall3 || isPowerWallPlus);

                  return shouldSuppress;
                })()}
                onChange={(field, val) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(optimizerMakes ?? [], val);
                    setOptimizerSection((prev: any) => ({
                      ...prev,
                      selectedMake: val,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModel: "",
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(optimizerModels ?? [], val);
                    setOptimizerSection((prev: any) => ({
                      ...prev,
                      selectedModel: val,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                  } else if (field === "isNew") {
                    setOptimizerSection((prev: any) => ({
                      ...prev,
                      isNew: !!val,
                    }));
                  } else {
                    setOptimizerSection((prev: any) => ({
                      ...prev,
                      [field]: val,
                    }));
                  }
                }}
                errors={{}}
              />
            )} */}


            {/* Energy Storage chooser (in inverter path too) */}
            {visible.ess && (
              <EnergyStorageSection
                key={`ess-${systemPrefix}`}
                value={backupOption}
                onChange={setBackupOption}
                errors={{}}
                initiallyExpanded={false}
                label={`Energy Storage System ${systemNumber}`}
                onClear={() => {
                  if (!projectID) return;
                  // Clear ALL energy storage related fields
                  void saveSystemDetailsPartialExact(projectID, {
                    // Clear backup option
                    [`${systemPrefix}backup_option`]: null,

                    // Clear SMS fields
                    [`${systemPrefix}sms_existing`]: null,
                    [`${systemPrefix}sms_make`]: null,
                    [`${systemPrefix}sms_model`]: null,
                    [`${systemPrefix}sms_id`]: null,
                    [`${systemPrefix}sms_breaker_rating`]: null,
                    [`${systemPrefix}sms_pv_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_ess_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_tie_in_breaker_rating_override`]: null,
                    [`${systemPrefix}sms_rsd_enabled`]: null,

                    // Clear Battery 1 fields
                    [`${systemPrefix}battery1_existing`]: null,
                    [`${systemPrefix}battery_1_qty`]: null,
                    [`${systemPrefix}battery_1_make`]: null,
                    [`${systemPrefix}battery_1_model`]: null,
                    [`${systemPrefix}battery1_id`]: null,

                    // Clear Battery 2 fields
                    [`${systemPrefix}battery2_existing`]: null,
                    [`${systemPrefix}battery_2_qty`]: null,
                    [`${systemPrefix}battery_2_make`]: null,
                    [`${systemPrefix}battery_2_model`]: null,
                    [`${systemPrefix}battery2_id`]: null,

                    // Clear ESS/Battery Combiner Panel fields
                    [`${systemPrefix}ess_existing`]: null,
                    [`${systemPrefix}ess_make`]: null,
                    [`${systemPrefix}ess_model`]: null,
                    [`${systemPrefix}ess_id`]: null,
                    [`${systemPrefix}ess_main_breaker_rating`]: null,
                    [`${systemPrefix}ess_upstream_breaker_rating`]: null,
                    [`${systemPrefix}ess_upstream_breaker_location`]: null,

                    // Clear Tesla-specific fields
                    [`${systemPrefix}teslagatewaytype`]: null,
                    [`${systemPrefix}backupswitch_location`]: null,
                    [`${systemPrefix}tesla_extensions`]: null,

                    // Clear utility service amps (part of backup option)
                    [`${systemPrefix}utility_service_amps`]: null,
                  });
                  // Clear UI state
                  setBackupOption("");
                  setUtilityServiceAmps("");
                }}
                suppressESS={(() => {
                  // Check if Tesla PowerWall is selected (same logic as OptimizerSection)
                  const make = inverterSection?.selectedMake || "";
                  const model = inverterSection?.selectedModel || "";
                  const modelLabel = inverterSection?.selectedModelLabel || "";
                  const isTesla = make.toLowerCase().includes('tesla');
                  const modelLower = model.toLowerCase();
                  const modelLabelLower = modelLabel.toLowerCase();
                  // Check both model (might be UUID) and modelLabel
                  const isPowerWall3 = modelLower.includes('powerwall 3') || modelLower.includes('powerwall3') || modelLower.startsWith('powerwall 3') ||
                                      modelLabelLower.includes('powerwall 3') || modelLabelLower.includes('powerwall3') || modelLabelLower.startsWith('powerwall 3');
                  const isPowerWallPlus = modelLower.includes('powerwall+') || modelLower.includes('powerwall +') ||
                                         modelLabelLower.includes('powerwall+') || modelLabelLower.includes('powerwall +');
                  const shouldSuppress = isTesla && (isPowerWall3 || isPowerWallPlus);

                  return shouldSuppress;
                })()}
                utilityServiceAmps={utilityServiceAmps}
                onUtilityServiceAmpsChange={handleUtilityServiceAmpsChange}
              />
            )}

            {/* SMS - Renders in editing screen, hidden from EquipmentCard summary */}
            {visible.sms && (
              <Sys1SMSSection
                  key={`sms-${systemPrefix}`}
                  values={smsValues}
                makes={smsMakes}
                models={smsModels}
                loadMakes={smsLoadMakes}
                loadModels={smsLoadModels}
                loadingMakes={smsLoadingMakes}
                loadingModels={smsLoadingModels}
                isLoading={smsLoadingData}
                backupOption={backupOption}
                label={`Storage Mgmt. System ${systemNumber}`}
                showBOSButton={true}
                onShowBOS={() => showNextAvailableBOS('sms')}
                onClear={async () => {
                  if (!projectID) return;

                  const prefix = systemPrefix.replace('_', ''); // sys1_ -> sys1

                  try {
                    // Clear SMS fields
                    await saveSystemDetailsPartialExact(projectID, {
                      [`${systemPrefix}sms_existing`]: null,
                      [`${systemPrefix}sms_make`]: null,
                      [`${systemPrefix}sms_model`]: null,
                      [`${systemPrefix}sms_id`]: null,
                      [`${systemPrefix}sms_breaker_rating`]: null,
                      [`${systemPrefix}sms_pv_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_ess_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_tie_in_breaker_rating_override`]: null,
                      [`${systemPrefix}sms_rsd_enabled`]: null,
                    });

                    console.log('[SMS Clear] SMS cleared from dedicated fields');

                    // Clear local state
                    setSmsSection({
                      isNew: true,
                      selectedMakeLabel: '',
                      selectedMakeValue: '',
                      selectedModelLabel: '',
                      selectedModelValue: '',
                      hasRSD: false,
                      selectedMainBreaker: '',
                      selectedPVBreaker: '',
                      selectedESSBreaker: '',
                      selectedTieInBreaker: '',
                      activatePCS: false,
                    });

                    console.log('[SMS Clear] SMS cleared successfully');
                  } catch (error) {
                    console.error('[SMS Clear] Error clearing SMS:', error);
                  }
                }}
                onChange={(field: any, val: any) => {
                  if (field === "activatePCS") {
                    setSmsSection((prev) => ({ ...prev, activatePCS: !!val }));
                    if (projectID != null)
                      void savePcsSetting(projectID, !!val, systemPrefix);
                  } else if (field === "isNew") {
                    // Update local state
                    setSmsSection((prev) => ({ ...prev, isNew: val }));
                    // Save to database: sys1_sms_existing (inverted - isNew=true means existing=false)
                    if (projectID != null) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_existing`]: !val,
                      });
                    }
                  } else if (field === "selectedMakeValue") {
                    const makeLabel = findLabel(smsMakes, val);
                    setSmsSection((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                    // Save SMS make to dedicated field and clear model
                    // Also save sms_existing as false (New) by default when first configured
                    if (projectID != null && makeLabel) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_make`]: makeLabel,
                        [`${systemPrefix}sms_model`]: null, // Clear model when make changes
                        [`${systemPrefix}sms_existing`]: false, // Default to "New" when first configured
                      });
                    }
                  } else if (field === "selectedModelValue") {
                    const modelLabel = findLabel(smsModels, val);
                    setSmsSection((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                    // Save SMS model to dedicated field
                    if (projectID != null && modelLabel) {
                      void saveSystemDetailsPartialExact(projectID, {
                        [`${systemPrefix}sms_model`]: modelLabel,
                        [`${systemPrefix}ess_equipment_type`]: "SMS",
                        [`${systemPrefix}sms_equipment_type`]: "SMS",
                      });
                    }
                  } else {
                    setSmsSection((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
              />
            )}

            {/* Render BOS sections triggered by SMS */}
            {renderBOSForTrigger('sms')}

            {/* Battery 1 */}
            {visible.battery1 && (
              <Sys1BatteryType1Section
                key={`battery1-${systemPrefix}`}
                values={battery1Values}
                makes={batteryMakes}
                models={batteryModels}
                loadMakes={batteryLoadMakes}
                loadModels={batteryLoadModels}
                loadingMakes={batteryLoadingMakes}
                loadingModels={batteryLoadingModels}
                isLoading={batteryLoadingData}
                smsData={smsSection.selectedMakeLabel && smsSection.selectedModelLabel ? {
                  make: smsSection.selectedMakeLabel,
                  model: smsSection.selectedModelLabel
                } : null}
                inverterData={inverterSection.selectedMakeLabel && inverterSection.selectedModelLabel ? {
                  make: inverterSection.selectedMakeLabel,
                  model: inverterSection.selectedModelLabel
                } : null}
                batteryCombinerPanelData={combinerSection.selectedMakeLabel && combinerSection.selectedModelLabel ? {
                  make: combinerSection.selectedMakeLabel,
                  model: combinerSection.selectedModelLabel
                } : null}
                onClear={() => {
                  if (!projectID) return;
                  void saveSystemDetailsPartialExact(projectID, {
                    [`${systemPrefix}battery1_existing`]: null,
                    [`${systemPrefix}battery_1_qty`]: null,
                    [`${systemPrefix}battery_1_make`]: null,
                    [`${systemPrefix}battery_1_model`]: null,
                    [`${systemPrefix}battery1_id`]: null,
                    [`${systemPrefix}combination_method`]: null,
                  });
                }}
                onChange={(field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(batteryMakes, val);
                    setBattery1Section((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(batteryModels, val);
                    setBattery1Section((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                  } else if (field === "configuration") {
                    setBattery1Section((prev) => ({
                      ...prev,
                      configuration: val,
                    }));
                    const label = toColumnBatteryConfig(val);
                    if (projectID && label)
                      void saveBatteryConfiguration(projectID, label);
                  } else {
                    setBattery1Section((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
                showAddType2={!showBattery2}
                onAddType2={addBatteryType2}
                showConfigInThisSection={showBt1Config}
                showBOSButton={true}
                onShowBOS={() => showNextAvailableBOS('battery1')}
              />
            )}

            {/* Render BOS sections triggered by Battery Type 1 */}
            <BatteryChainBOS
              systemPrefix={systemPrefix}
              systemNumber={systemNumber}
              projectID={projectID}
              utilityAbbrev={utilityRequirements?.abbrev}
              maxContinuousOutputAmps={batteryMaxContinuousOutputAmps}
              loadingMaxOutput={loadingBatteryMaxOutput}
              batteryType="battery1"
              bos1Section={battery1BOS1Section}
              bos2Section={battery1BOS2Section}
              bos3Section={battery1BOS3Section}
              showBOS1={showBattery1BOS1}
              showBOS2={showBattery1BOS2}
              showBOS3={showBattery1BOS3}
              setBOS1Section={setBattery1BOS1Section}
              setBOS2Section={setBattery1BOS2Section}
              setBOS3Section={setBattery1BOS3Section}
              setShowBOS1={setShowBattery1BOS1}
              setShowBOS2={setShowBattery1BOS2}
              setShowBOS3={setShowBattery1BOS3}
              onAddNextBOS={() => showNextAvailableBOS('battery1')}
            />

            {/* Battery 2 */}
            {visible.battery2 && (
              <Sys1BatteryType2Section
                key={`battery2-${systemPrefix}`}
                battery1Quantity={Number(battery1Section.quantity || 0)}
                values={battery2Values}
                makes={battery2Makes}
                models={battery2Models}
                loadMakes={battery2LoadMakes}
                loadModels={battery2LoadModels}
                loadingMakes={battery2LoadingMakes}
                loadingModels={battery2LoadingModels}
                isLoading={battery2LoadingData}
                smsData={smsSection.selectedMakeLabel && smsSection.selectedModelLabel ? {
                  make: smsSection.selectedMakeLabel,
                  model: smsSection.selectedModelLabel
                } : null}
                inverterData={inverterSection.selectedMakeLabel && inverterSection.selectedModelLabel ? {
                  make: inverterSection.selectedMakeLabel,
                  model: inverterSection.selectedModelLabel
                } : null}
                batteryCombinerPanelData={combinerSection.selectedMakeLabel && combinerSection.selectedModelLabel ? {
                  make: combinerSection.selectedMakeLabel,
                  model: combinerSection.selectedModelLabel
                } : null}
                onChange={(field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(battery2Makes, val);
                    setBattery2Section((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(battery2Models, val);
                    setBattery2Section((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                    }));
                  } else if (field === "configuration") {
                    setBattery2Section((prev) => ({
                      ...prev,
                      configuration: val,
                    }));
                    const label = toColumnBatteryConfig(val);
                    if (projectID && label)
                      void saveBatteryConfiguration(projectID, label);
                  } else {
                    setBattery2Section((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                onClearType2={removeBatteryType2}
                errors={{}}
                showBOSButton={true}
                onShowBOS={() => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_battery2`;
                  if (!showBattery2BOS1) {
                    setShowBattery2BOS1(true);
                    setBattery2BOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBattery2BOS2) {
                    setShowBattery2BOS2(true);
                    setBattery2BOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBattery2BOS3) {
                    setShowBattery2BOS3(true);
                    setBattery2BOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Render BOS sections triggered by Battery Type 2 */}
            <BatteryChainBOS
              systemPrefix={systemPrefix}
              systemNumber={systemNumber}
              projectID={projectID}
              utilityAbbrev={utilityRequirements?.abbrev}
              maxContinuousOutputAmps={batteryMaxContinuousOutputAmps}
              loadingMaxOutput={loadingBatteryMaxOutput}
              batteryType="battery2"
              bos1Section={battery2BOS1Section}
              bos2Section={battery2BOS2Section}
              bos3Section={battery2BOS3Section}
              showBOS1={showBattery2BOS1}
              showBOS2={showBattery2BOS2}
              showBOS3={showBattery2BOS3}
              setBOS1Section={setBattery2BOS1Section}
              setBOS2Section={setBattery2BOS2Section}
              setBOS3Section={setBattery2BOS3Section}
              setShowBOS1={setShowBattery2BOS1}
              setShowBOS2={setShowBattery2BOS2}
              setShowBOS3={setShowBattery2BOS3}
              onAddNextBOS={() => showNextAvailableBOS('battery2')}
            />

            {/* Optional: ESS sub-combiner (Battery Combiner Panel) - shown only when specific conditions met */}
            {(() => {
              const qty1 = Number(battery1Section.quantity || 0);
              const hasBattery2 = visible.battery2 && !!battery2Section.selectedModelValue;
              const config = battery1Section.configuration || battery2Section.configuration;
              const isCombinerConfig = config === "combiner_panel";

              const shouldShowCombinerPanel = (qty1 > 1 || hasBattery2) && isCombinerConfig;

              console.log('[Battery Combiner Panel - Inverter Path] Visibility check:', {
                qty1, hasBattery2, config, isCombinerConfig, shouldShowCombinerPanel
              });

              if (!shouldShowCombinerPanel) return null;

              return (
                <Sys1BatteryCombinerPanel1Section
                  key={`battery-combiner-panel-${systemPrefix}`}
                  values={{
                    isNew: batteryCombinerPanelSection.isNew,
                    selectedMake: batteryCombinerPanelSection.selectedMakeValue,
                    selectedModel: batteryCombinerPanelSection.selectedModelValue,
                    selectedBusAmps: batteryCombinerPanelSection.busBar,
                    selectedMainBreaker: batteryCombinerPanelSection.mainBreaker,
                    tieInBreaker: batteryCombinerPanelSection.tieInBreaker,
                  }}
                  isLoading={bcpLoadingData}
                  onClear={() => {
                    if (!projectID) return;
                    const clearPayload: Record<string, null> = {};

                    const makeField = getBCPFieldName('make');
                    const modelField = getBCPFieldName('model');
                    const busbarField = getBCPFieldName('busbar');
                    const mainbreakerField = getBCPFieldName('mainbreaker');
                    const tieinbreakerField = getBCPFieldName('tieinbreaker');
                    const existingField = getBCPFieldName('existing');

                    if (makeField) clearPayload[makeField] = null;
                    if (modelField) clearPayload[modelField] = null;
                    if (busbarField) clearPayload[busbarField] = null;
                    if (mainbreakerField) clearPayload[mainbreakerField] = null;
                    if (tieinbreakerField) clearPayload[tieinbreakerField] = null;
                    if (existingField) clearPayload[existingField] = null;

                    void saveSystemDetailsPartialExact(projectID, clearPayload);
                  }}
                  onChange={(field: string, val: any) => {
                    if (field === "selectedMake") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        selectedMakeValue: val,
                        selectedMakeLabel: val,
                      }));
                      if (projectID) {
                        const makeField = getBCPFieldName('make');
                        if (makeField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [makeField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedModel") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        selectedModelValue: val,
                        selectedModelLabel: val,
                      }));
                      if (projectID) {
                        const modelField = getBCPFieldName('model');
                        if (modelField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [modelField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedBusAmps") {
                      setBatteryCombinerPanelSection((prev) => ({
                        ...prev,
                        busBar: val,
                      }));
                      if (projectID) {
                        const busbarField = getBCPFieldName('busbar');
                        if (busbarField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [busbarField]: val || null,
                          });
                        }
                      }
                    } else if (field === "selectedMainBreaker") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, mainBreaker: val }));
                      if (projectID) {
                        const mainbreakerField = getBCPFieldName('mainbreaker');
                        if (mainbreakerField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [mainbreakerField]: val || null,
                          });
                        }
                      }
                    } else if (field === "tieInBreaker") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, tieInBreaker: val }));
                      if (projectID) {
                        const tieinbreakerField = getBCPFieldName('tieinbreaker');
                        if (tieinbreakerField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [tieinbreakerField]: val || null,
                          });
                        }
                      }
                    } else if (field === "isNew") {
                      setBatteryCombinerPanelSection((prev) => ({ ...prev, isNew: val }));
                      if (projectID) {
                        const existingField = getBCPFieldName('existing');
                        if (existingField) {
                          void saveSystemDetailsPartialExact(projectID, {
                            [existingField]: val ? false : true,
                          });
                        }
                      }
                    }
                  }}
                  errors={{}}
                />
              );
            })()}

            {/* Backup Subpanel (partial backup) */}
            {visible.backupSubpanel && (
              <Sys1BackupLoadSubPanelSection
                key={`backup-subpanel-${systemPrefix}`}
                values={backupValues}
                backupSystemSize={utilityServiceAmps}
                label={`Backup Load Sub Panel ${systemNumber}`}
                onChange={async (field: string, val: any) => {
                  if (field === "selectedMake") {
                    const makeLabel = findLabel(backupMakes, val);
                    setBackupSection((prev) => ({
                      ...prev,
                      selectedMakeValue: val,
                      selectedMakeLabel: makeLabel,
                      selectedModelValue: "",
                      selectedModelLabel: "",
                    }));
                  } else if (field === "selectedModel") {
                    const modelLabel = findLabel(backupModels, val);

                    // Extract bus rating from model label (e.g., "200 Amps" -> "200")
                    let busRating = "";
                    const ampMatch = modelLabel.match(/(\d+)\s*Amps?/i);
                    if (ampMatch) {
                      busRating = ampMatch[1];
                      console.log(`[Backup Panel] Extracted bus rating: ${busRating} from model: ${modelLabel}`);
                    }

                    setBackupSection((prev) => ({
                      ...prev,
                      selectedModelValue: val,
                      selectedModelLabel: modelLabel,
                      busAmps: busRating || prev.busAmps, // Auto-populate bus rating if found, otherwise keep existing
                    }));

                    // Auto-save bus rating to database if extracted
                    if (busRating && projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: busRating });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: busRating });
                      }
                      console.log(`[Backup Panel] Auto-saved bus rating: ${busRating}`);
                    }
                  } else if (field === "selectedBusAmps") {
                    setBackupSection((prev) => ({ ...prev, busAmps: val }));
                    // Immediate save for bus amps to prevent loss during re-hydration
                    if (projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_bus_bar_rating: val });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadsubpanel_bus_rating: val });
                      }
                    }
                  } else if (field === "selectedMainBreaker") {
                    setBackupSection((prev) => ({ ...prev, mainBreaker: val }));
                    // Immediate save for main breaker to prevent loss during re-hydration
                    if (projectID) {
                      const sysNum = systemPrefix.replace('sys', '').replace('_', '');
                      if (sysNum === '1') {
                        await saveSystemDetailsPartialExact(projectID, { bls1_backuploader_main_breaker_rating: val });
                      } else if (sysNum === '2') {
                        await saveSystemDetailsPartialExact(projectID, { sys2_backuploadpanel_mcb_rating: val });
                      }
                    }
                  } else if (field === "selectedTieInBreaker") {
                    setBackupSection((prev) => ({ ...prev, tieInBreaker: val }));
                  } else {
                    setBackupSection((prev) => ({ ...prev, [field]: val }));
                  }
                }}
                errors={{}}
                showBOSButton={true}
                onShowBOS={() => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_backup`;
                  if (!showBackupBOS1) {
                    setShowBackupBOS1(true);
                    setBackupBOS1Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBackupBOS2) {
                    setShowBackupBOS2(true);
                    setBackupBOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (!showBackupBOS3) {
                    setShowBackupBOS3(true);
                    setBackupBOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Render BOS sections for Backup Chain */}
            {visible.backupSubpanel && (
              <BackupChainBOS
                systemPrefix={systemPrefix}
                systemNumber={systemNumber}
                projectID={projectID}
                utilityAbbrev={utilityRequirements?.abbrev}
                maxContinuousOutputAmps={maxContinuousOutputAmps}
                loadingMaxOutput={loadingMaxOutput}
                bos1Section={backupBOS1Section}
                bos2Section={backupBOS2Section}
                bos3Section={backupBOS3Section}
                showBOS1={showBackupBOS1}
                showBOS2={showBackupBOS2}
                showBOS3={showBackupBOS3}
                setBOS1Section={setBackupBOS1Section}
                setBOS2Section={setBackupBOS2Section}
                setBOS3Section={setBackupBOS3Section}
                setShowBOS1={setShowBackupBOS1}
                setShowBOS2={setShowBackupBOS2}
                setShowBOS3={setShowBackupBOS3}
                onAddNextBOS={(position: number) => {
                  const prefix = systemPrefix.replace('_', '');
                  const fullTrigger = `${prefix}_backup`;
                  if (position === 2) {
                    setShowBackupBOS2(true);
                    setBackupBOS2Section(prev => ({ ...prev, trigger: fullTrigger }));
                  } else if (position === 3) {
                    setShowBackupBOS3(true);
                    setBackupBOS3Section(prev => ({ ...prev, trigger: fullTrigger }));
                  }
                }}
              />
            )}

            {/* Post SMS BOS Button - Show when system has backup configured and ESS/batteries (NOT PowerWall) */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall = isTesla && (
                modelLower.includes('powerwall') || modelLabelLower.includes('powerwall')
              );

              const showButton = visible.backupSubpanel &&
                                !showPostSMSBOS && !showPostSMSBOSType2 && !showPostSMSBOSType3 &&
                                !isPowerWall; // Don't show for PowerWall (it has its own section)

              if (!showButton) return null;

              return (
                <View style={{ paddingHorizontal: moderateScale(16), marginTop: moderateScale(16) }}>
                  <SystemButton
                    label="Post SMS BOS Equipment"
                    onPress={() => showNextAvailablePostSMSBOS()}
                    style={{ width: "100%" }}
                  />
                </View>
              );
            })()}

            {/* Post SMS BOS - Equipment after SMS (for systems with batteries, NOT PowerWall) */}
            {(() => {
              const make = inverterSection?.selectedMake || "";
              const model = inverterSection?.selectedModel || "";
              const modelLabel = inverterSection?.selectedModelLabel || "";
              const isTesla = make.toLowerCase().includes('tesla');
              const modelLower = model.toLowerCase();
              const modelLabelLower = modelLabel.toLowerCase();
              const isPowerWall = isTesla && (
                modelLower.includes('powerwall') || modelLabelLower.includes('powerwall')
              );

              // Don't render for PowerWall - it has its own Post SMS BOS section
              if (isPowerWall) return null;

              return renderPostSMSBOS();
            })()}
          </>
        )}
        </>
        )}
      </ScrollView>

      <View style={styles.headerWrap} onLayout={handleHeaderLayout}>
        <LargeHeader
          title={systemLabel}
          name={fullName}
          addressLines={addressLines}
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          notificationMessage={notificationMessage}
          notificationType={notificationType}
          onNotificationComplete={() => setNotificationMessage(null)}
        />
      </View>

      {/* BOS Required Equipment Modal - DISABLED */}
      {/* BOS equipment is now added via button click on Equipment page */}
      {/* Keeping this code commented for potential future use */}
      {/* <BOSRequiredEquipmentModal
        visible={showBOSModal && utilityRequirements?.abbrev !== "APS"}
        utilityName={utilityRequirements?.abbrev || "Utility"}
        requiredEquipment={(() => {
          if (!utilityRequirements) return [];

          const { bos_1, bos_2, bos_3, bos_4, bos_5, bos_6, abbrev } = utilityRequirements;
          const equipment: string[] = [];

          // ✅ Collect all required BOS equipment and translate to utility-specific names
          // Order: bos_1 at top (required), bos_2 next (required), then 3, 4, 5, 6
          // This ensures required equipment is displayed FIRST and will land in slots 1 & 2
          [bos_1, bos_2, bos_3, bos_4, bos_5, bos_6].forEach(bosType => {
            if (bosType) {
              // Translate standard name to utility-specific variation for display
              const translatedName = translateToUtilityVariation(abbrev, bosType);
              equipment.push(translatedName);
            }
          });

          return equipment;
        })()}
        onYes={handleBOSModalYes}
        onNo={handleBOSModalNo}
        onAskLater={handleBOSModalAskLater}
      /> */}

      {/* APS Configuration Modals */}
      {apsConfigDetails && showAPSBOSModal && (
        <APSBOSConfigurationModal
          key={`aps-bos-${apsConfigDetails.configurationId}`}
          visible={showAPSBOSModal}
          configuration={apsConfigDetails}
          onAccept={handleAPSBOSAccept}
          onDecline={handleAPSBOSCustom}
          onAskLater={handleAPSBOSAskLater}
        />
      )}

    </LinearGradient>
    </NotificationProvider>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  // ======== NEW STYLES FOR THREE-CHAIN DRAG-AND-DROP SYSTEM ========
  bosItemContainer: {
    position: 'relative',
    marginVertical: moderateScale(4),
  },
  bosContentWrapper: {
    flex: 1,
  },
  dragHandle: {
    position: 'absolute',
    left: moderateScale(-30),
    top: moderateScale(12),
    width: moderateScale(24),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dragHandleIcon: {
    fontSize: moderateScale(16),
    color: '#999',
    fontWeight: '600',
    letterSpacing: moderateScale(-2),
  },
  bosItemDragging: {
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
  },
});

export default EquipmentDetails;
