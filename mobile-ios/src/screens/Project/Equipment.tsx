import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  DrawerActions,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import {
  EquipmentLists,
  getSystemDetails,
  getSystemEquipmentFields,
} from "../../api/project.service";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Toast from "react-native-toast-message";
import { setUpdateProjectDetails, triggerDataRefresh } from "../../store/slices/projectSlice";
import AppHeader from "../../components/Header/LargeHeader";
import SystemButton from "../../components/Button/SystemButton";
import EquipmentCard from "../../components/Equipment/EquipmentCard";
import LandingOptionButton from "../../components/Equipment/LandingOptionButton";
import ProgressIndicator from "../../components/Equipment/ProgressIndicator";
// import ElectricalDiagramOverview from "../../components/Equipment/ElectricalDiagramOverview";
import Button from "../../components/Button";
import Dropdown from "../../components/Dropdown";
import NewExistingToggle from "../../components/NewExistingToggle";
import ConfirmClearModal from "../../components/Modals/ConfirmClearModal";
import BOSConfigurationPreviewModal from "../../components/Modals/BOSConfigurationPreviewModal";
import { LoadingOverlay } from "../../components/UI/LoadingOverlay";
import CollapsibleSection from "../../components/UI/CollapsibleSection";
import CombineBOSTypeSection from "./Equipment/CombineBOSTypeSection";
import SystemCombinerPanelSection from "./SystemDetails/sections/SystemCombinerPanelSection";
import {
  universalSwitchboard,
  extractEquipmentForSystem,
  BOSAutoPopulationService,
  ConfigurationMatch,
} from "../../utils/configurations";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { logger } from "../../utils/logger";
import {
  fetchSystemDetails,
  saveSystemDetails,
} from "../../api/systemDetails.service";
import {
  clearProjectSnapshots,
  saveSystemDetailsPartialExact,
} from "./SystemDetails/services/equipmentService";
import { fetchUtilityRequirements } from "../../api/utility.service";
import { BLUE_MD_TB } from "../../styles/gradient";
import {
  SCROLL_PADDING,
  commonScrollViewProps,
} from "../../styles/commonStyles";
import { createSelector } from "@reduxjs/toolkit";
import {
  getLandingOptions,
  generateConfigurationData,
  isConfigurationComplete,
} from "../../utils/equipmentHelpers";
import {
  BOS_EQUIPMENT_TRANSLATION,
  EQUIPMENT_TYPE_OPTIONS,
  EQUIPMENT_CATALOG,
} from "../../utils/constants";
import { EQUIPMENT_TYPES } from "../../constants/equipmentTypes";
import { getMakes, getModels } from "../../utils/equipmentCache";

type RootState = any;

const { height: screenHeight } = Dimensions.get("window");
const BUTTON_HEIGHT = 50; // Match dropdown height

// Static dropdown options for System Combiner Panel
const busAmpOptions = [{ label: "###", value: "" }].concat(
  Array.from({ length: 22 }, (_, i) => ({
    label: String(40 + i * 10),
    value: String(40 + i * 10),
  }))
);
const mainBreakerOptions = [{ label: "###", value: "" }]
  .concat([{ label: "MLO", value: "mlo" }])
  .concat(
    [100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600].map(
      (v) => ({ label: String(v), value: String(v) })
    )
  );

const systems = [
  "System 1",
  "System 2",
  "System 3",
  "System 4",
  "Combine BOS", // Shows when System 2+ exists
];

const PREFIXES_BY_LABEL: Record<string, string[] | string> = {
  "System 1": "sys1_",
  "System 2": "sys2_",
  "System 3": "sys3_",
  "System 4": "sys4_",
  // Keep BOS prefixes for future reference
  // "Balance of System (BOS)": ["bls1_", "rta_", "st_", "mp1_", "mp2_"],
};

const IGNORE_KEYS = new Set(["keys", "requestId", "success"]);

const hasMeaningfulValue = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v; // only true counts
  if (typeof v === "number") return !Number.isNaN(v);
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return false;
};

// Memoized selectors to prevent unnecessary re-renders
const selectProfile = (state: RootState) => state?.profile?.profile;
const selectProject = (state: RootState) => state?.project?.currentProject;
const selectUpdateProjectDetails = (state: RootState) =>
  state?.project?.updateProjectDetails;
const selectInstallerId = (state: RootState) =>
  state?.project?.projectDetails?.data?.details?.installer_project_id;

// Create a memoized selector for system details with fallback chain
const selectSystemDetailsFromStore = createSelector(
  [
    (state: RootState) => state.project?.systemDetails?.data,
    (state: RootState) => state.project?.projectDetails?.data?.system_details,
    (state: RootState) => state.project?.updateProjectDetails?.system_details,
    (state: RootState) => state.project?.currentProject?.system_details,
  ],
  (systemDetails, projectDetails, updateDetails, currentDetails) =>
    systemDetails ?? projectDetails ?? updateDetails ?? currentDetails ?? {}
);

// Memoized selector for equipment sets grouped by label
const selectEquipmentSetGroup = createSelector(
  [selectUpdateProjectDetails],
  (updateProjectDetails) => {
    if (!updateProjectDetails?.equipment_sets) return {};
    return updateProjectDetails.equipment_sets.reduce(
      (acc: any, equipmentSet: any) => {
        acc[equipmentSet?.label] = equipmentSet;
        return acc;
      },
      {}
    );
  }
);

const Equipment: React.FC = () => {
  const dispatch = useDispatch();
  const navigation: any = useNavigation();

  // Use memoized selectors with shallowEqual for object comparisons
  const profile = useSelector(selectProfile, shallowEqual);
  const project = useSelector(selectProject, shallowEqual);
  const updateProjectDetails = useSelector(
    selectUpdateProjectDetails,
    shallowEqual
  );
  const InstallerId = useSelector(selectInstallerId);
  const systemDetailsFromStore = useSelector(
    selectSystemDetailsFromStore,
    shallowEqual
  );
  const equipmentSetGroup = useSelector(selectEquipmentSetGroup, shallowEqual);

  const { user, company } = profile || {};

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Fetch equipment set list (memoized to prevent unnecessary API calls)
  const projectUuid = project?.uuid;
  const companyUuid = profile?.company?.uuid;

  // ─────────────────────────────────────────────────────────────────────────────
  // STATE DECLARATIONS (must be before useEffect hooks that reference them)
  // ─────────────────────────────────────────────────────────────────────────────

  // System details state
  const [localSystemDetails, setLocalSystemDetails] = useState<Record<
    string,
    any
  > | null>(null);
  const [lastFetchedProjectId, setLastFetchedProjectId] = useState<
    string | null
  >(null);

  // Combine systems state
  const [combineSystems, setCombineSystems] = useState<boolean | null>(null);
  const [showCombineBOS, setShowCombineBOS] = useState(false);
  const [combineMethod, setCombineMethod] = useState<string>("");
  const [combineOptions, setCombineOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [combineValidationError, setCombineValidationError] =
    useState<string>("");

  // Progressive landing configuration state
  const [currentSystemConfig, setCurrentSystemConfig] = useState<number>(0); // 0 = not started, 1-4 = configuring that system
  const [systemLandings, setSystemLandings] = useState<Record<string, string>>(
    {}
  );
  const [completedSystems, setCompletedSystems] = useState<number[]>([]);

  // System Combiner Panel state
  const [showClearCombinerModal, setShowClearCombinerModal] = useState(false);
  const [combinerPanelExpanded, setCombinerPanelExpanded] = useState(false);

  // BOS Configuration Preview Modal state
  const [showBOSConfigModal, setShowBOSConfigModal] = useState(false);
  const [detectedConfiguration, setDetectedConfiguration] = useState<ConfigurationMatch | null>(null);
  const [detectedConfigurations, setDetectedConfigurations] = useState<ConfigurationMatch[]>([]); // For multi-system display
  const [bosDetectionLoading, setBosDetectionLoading] = useState(false);

  // Loading overlay state (for BOS auto-population)
  const [loadingOverlay, setLoadingOverlay] = useState<{
    visible: boolean;
    message?: string;
    submessage?: string;
  }>({ visible: false });

  // SAFETY PATCH: Operation-in-progress guard to prevent concurrent BOS operations
  const bosOperationInProgress = useRef(false);
  const [systemCombinerPanel, setSystemCombinerPanel] = useState({
    isNew: true,
    selectedMake: "",
    selectedModel: "",
    selectedBusAmps: "",
    selectedMainBreaker: "mlo",
  });

  // String Combiner Panel makes/models for System Combiner Panel (excludes Enphase)
  const [combinerPanelMakes, setCombinerPanelMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [combinerPanelModels, setCombinerPanelModels] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingCombinerPanelMakes, setLoadingCombinerPanelMakes] = useState(false);
  const [loadingCombinerPanelModels, setLoadingCombinerPanelModels] = useState(false);

  // Combine BOS Type 1 state
  const [bosType1Data, setBosType1Data] = useState({
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    isNew: true,
  });

  // Combine BOS Type 2 state
  const [bosType2Data, setBosType2Data] = useState({
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    isNew: true,
  });

  // Combine BOS Type 3 state
  const [bosType3Data, setBosType3Data] = useState({
    equipmentType: "",
    ampRating: "",
    make: "",
    model: "",
    isNew: true,
  });

  // Track if user has clicked to show each type (and should auto-expand)
  const [showBosType2, setShowBosType2] = useState(false);
  const [showBosType3, setShowBosType3] = useState(false);
  const [autoExpandType2, setAutoExpandType2] = useState(false);
  const [autoExpandType3, setAutoExpandType3] = useState(false);

  // Legacy BOS Type 2/3 active states (for old UI - will be removed)
  const [activeBOSType2, setActiveBOSType2] = useState<boolean>(false);
  const [showClearBOSType2Modal, setShowClearBOSType2Modal] = useState(false);
  const [activeBOSType3, setActiveBOSType3] = useState<boolean>(false);
  const [showClearBOSType3Modal, setShowClearBOSType3Modal] = useState(false);

  // Sub Panel B state
  const [hasSubPanelB, setHasSubPanelB] = useState(false);
  const [subPanelBData, setSubPanelBData] = useState<{
    type: "new" | "existing" | null;
    busAmps: string;
    mainBreakerAmps: string;
    feederLocation: string;
    derated?: boolean | null;
    upstreamBreakerAmps?: string;
  } | null>(null);

  // Utility requirements state
  const [utilityRequirements, setUtilityRequirements] = useState<any>(null);

  // Combined system max output state (for Post Combine BOS)
  const [combinedMaxOutput, setCombinedMaxOutput] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALLBACKS AND EFFECTS
  // ─────────────────────────────────────────────────────────────────────────────

  // OPTIMIZED: Load all systems data in parallel for faster performance
  const loadSystemDetails = useCallback(async (pid?: string) => {
    if (!pid) return;

    const startTime = performance.now();
    if (__DEV__) {
      // logger.debug("[Equipment] Starting optimized system data load...");
    }

    try {
      // Load all 4 systems in parallel - much faster than sequential
      const [sys1, sys2, sys3, sys4] = await Promise.all([
        getSystemEquipmentFields(pid, 1),
        getSystemEquipmentFields(pid, 2),
        getSystemEquipmentFields(pid, 3),
        getSystemEquipmentFields(pid, 4),
      ]);

      // Combine all system data
      const combinedData = {
        ...(sys1?.data?.data || {}),
        ...(sys2?.data?.data || {}),
        ...(sys3?.data?.data || {}),
        ...(sys4?.data?.data || {}),
      };

      const loadTime = performance.now() - startTime;
      const fieldCount = Object.keys(combinedData).length;

      if (fieldCount > 0) {
        setLocalSystemDetails(combinedData);
        setLastFetchedProjectId(pid);

        if (__DEV__) {
          // logger.debug(
          //   `[Equipment] Loaded ${fieldCount} fields in ${Math.round(
          //     loadTime
          //   )}ms`
          // );
        }
      } else {
        // Fallback to old method if optimized endpoints don't work
        if (__DEV__) {
          // logger.debug(
          //   "[Equipment] No data from optimized endpoints, using fallback..."
          // );
        }
        const resp = await getSystemDetails(pid);
        const data =
          resp?.data?.data && typeof resp.data.data === "object"
            ? resp.data.data
            : resp?.data && typeof resp.data === "object"
            ? resp.data
            : null;

        if (data) {
          setLocalSystemDetails(data);
          setLastFetchedProjectId(pid);
          if (__DEV__) {
            // logger.debug(
            //   "[Equipment] Fallback loaded keys:",
            //   Object.keys(data).length
            // );
          }
        } else {
          // Fresh project with no data - this is expected, set empty object
          setLocalSystemDetails({});
          setLastFetchedProjectId(pid);
          if (__DEV__) {
            // logger.debug("[Equipment] Fresh project - no system data yet");
          }
        }
      }
    } catch (e: any) {
      // For fresh projects, 404 errors are expected - don't show error UI
      if (__DEV__) {
        // logger.debug("[Equipment] Using fallback loading method");
      }

      // Fallback to old method on error
      try {
        const resp = await getSystemDetails(pid);
        const data =
          resp?.data?.data && typeof resp.data.data === "object"
            ? resp.data.data
            : resp?.data && typeof resp.data === "object"
            ? resp.data
            : null;

        if (data && Object.keys(data).length > 0) {
          setLocalSystemDetails(data);
          setLastFetchedProjectId(pid);
        } else {
          // Fresh project - set empty state
          setLocalSystemDetails({});
          setLastFetchedProjectId(pid);
        }
      } catch (fallbackError: any) {
        // Even fallback failed - likely a fresh project, set empty state
        setLocalSystemDetails({});
        setLastFetchedProjectId(pid);
        if (__DEV__) {
          // logger.debug(
          //   "[Equipment] Fresh project - initialized with empty data"
          // );
        }
      }
    }
  }, []);

  const fetchEquipmentSetList = useCallback(async () => {
    if (!projectUuid || !companyUuid) return;

    try {
      const response = await EquipmentLists(projectUuid, companyUuid);
      if (response?.status === 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        logger.warn("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error: any) {
      logger.error(error?.message);
    }
  }, [projectUuid, companyUuid, dispatch]);

  useEffect(() => {
    fetchEquipmentSetList();
  }, [fetchEquipmentSetList]);

  // String Combiner Panel makes/models for System Combiner Panel
  const loadCombinerPanelMakes = useCallback(async () => {
    if (!companyUuid || loadingCombinerPanelMakes || combinerPanelMakes.length > 0) return;

    setLoadingCombinerPanelMakes(true);
    try {
      const makes = await getMakes(EQUIPMENT_TYPES.STRING_COMBINER_PANEL);

      // Filter out Enphase and ensure correct format
      const formatted = makes
        .filter((item: any) => {
          const label = typeof item === 'string' ? item : (item.label || item.value || '');
          return label.toUpperCase() !== 'ENPHASE';
        })
        .map((item: any) => {
          if (typeof item === 'string') {
            return { label: item, value: item };
          }
          return {
            label: String(item.label || ''),
            value: String(item.value || item.label || ''),
          };
        });

      setCombinerPanelMakes(formatted);
    } catch (error) {
      logger.error("Failed to load String Combiner Panel makes", error);
    } finally {
      setLoadingCombinerPanelMakes(false);
    }
  }, [companyUuid, loadingCombinerPanelMakes, combinerPanelMakes.length]);

  const loadCombinerPanelModels = useCallback(async () => {
    const selectedMake = systemCombinerPanel.selectedMake;
    if (!companyUuid || !selectedMake || loadingCombinerPanelModels) return;

    setLoadingCombinerPanelModels(true);
    try {
      const models = await getModels(EQUIPMENT_TYPES.STRING_COMBINER_PANEL, selectedMake);

      // Ensure the data is in the correct format: { label: string, value: string }
      const formatted = models.map((item: any) => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        return {
          label: String(item.label || ''),
          value: String(item.value || item.label || ''),
        };
      });

      setCombinerPanelModels(formatted);
    } catch (error) {
      logger.error("Failed to load String Combiner Panel models", error);
    } finally {
      setLoadingCombinerPanelModels(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyUuid, systemCombinerPanel.selectedMake]);

  // Load makes when System Combiner Panel is shown
  useEffect(() => {
    const shouldShowCombinerPanel = Object.values(systemLandings).some((landing) =>
      landing?.includes("Combiner Panel")
    );
    if (shouldShowCombinerPanel) {
      loadCombinerPanelMakes();
    }
  }, [systemLandings, loadCombinerPanelMakes]);

  // Load models when a make is selected
  useEffect(() => {
    if (systemCombinerPanel.selectedMake) {
      // Reset models when make changes, then load new models
      setCombinerPanelModels([]);
      loadCombinerPanelModels();
    } else {
      setCombinerPanelModels([]); // Clear models when make is cleared
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemCombinerPanel.selectedMake]);

  // Fetch utility requirements when project site data is available
  useEffect(() => {
    const loadUtilityRequirements = async () => {
      const utility = project?.site?.utility;
      const state = project?.site?.state;
      const token = profile?.token;

      if (!utility || !token) {
        return;
      }

      try {
        const requirements = await fetchUtilityRequirements(
          state || "",
          utility,
          token
        );
        setUtilityRequirements(requirements);
        logger.debug("[Equipment] Utility requirements loaded:", requirements);
      } catch (error: any) {
        logger.error(
          "[Equipment] Failed to fetch utility requirements:",
          error
        );
        setUtilityRequirements(null);
      }
    };

    loadUtilityRequirements();
  }, [project?.site?.utility, project?.site?.state, profile?.token]);

  // Calculate combined system max output for Post Combine BOS
  useEffect(() => {
    if (!localSystemDetails) {
      setCombinedMaxOutput(null);
      return;
    }

    // Calculate max output for each system
    const calculateSystemMaxOutput = (systemNumber: number): number => {
      const prefix = `sys${systemNumber}_`;

      // Get inverter/microinverter max continuous output (stored when equipment selected)
      const invMaxOutput = parseFloat(localSystemDetails[`${prefix}inv_max_continuous_output`]) || 0;

      // Get battery max continuous output
      const battery1MaxOutput = parseFloat(localSystemDetails[`${prefix}battery_1_max_continuous_output`]) || 0;
      const battery2MaxOutput = parseFloat(localSystemDetails[`${prefix}battery_2_max_continuous_output`]) || 0;

      // Total for this system = inverter/micros output + battery outputs
      return invMaxOutput + battery1MaxOutput + battery2MaxOutput;
    };

    // Sum all systems
    let totalMaxOutput = 0;
    for (let i = 1; i <= 4; i++) {
      totalMaxOutput += calculateSystemMaxOutput(i);
    }

    // Apply 1.25 multiplier (125% for safety factor)
    const finalOutput = totalMaxOutput * 1.25;

    // Round to nearest whole number
    setCombinedMaxOutput(finalOutput > 0 ? Math.round(finalOutput) : null);

    console.log('[Equipment] Combined max output calculated:', {
      totalMaxOutput,
      finalOutput: Math.round(finalOutput),
    });
  }, [localSystemDetails]);

  // Auto-populate BOS equipment for all systems when utility requirements change
  useEffect(() => {
    const autoPopulateBOSForAllSystems = async () => {
      if (!utilityRequirements || !localSystemDetails || !projectUuid) {
        return;
      }

      const { bos_1, bos_2, bos_3, bos_4, bos_5, bos_6 } = utilityRequirements;
      const hasBOSRequirements = bos_1 || bos_2 || bos_3 || bos_4 || bos_5 || bos_6;

      if (!hasBOSRequirements) {
        return;
      }

      logger.debug(
        "[Equipment] Auto-populating BOS equipment for all systems based on utility requirements"
      );

      // Get utility name for translation
      const utilityName = project?.site?.utility || "";
      const utilityTranslation = BOS_EQUIPMENT_TRANSLATION[utilityName] || {};

      // Helper function to translate equipment name based on utility
      const translateEquipment = (equipmentName: string) => {
        if (!equipmentName) return equipmentName;
        // Apply utility-specific translation if it exists
        const translated = utilityTranslation[equipmentName] || equipmentName;
        if (__DEV__ && translated !== equipmentName) {
          logger.debug(
            `[Equipment] BOS Translation for ${utilityName}: "${equipmentName}" → "${translated}"`
          );
        }
        return translated;
      };

      // Collect all bos_1 through bos_6 requirements and apply translation
      // Only include non-null values, maintaining order from 1-6
      const type1Requirements = [
        {
          order: 1,
          value: translateEquipment(bos_1),
          label: "bos_1",
          original: bos_1,
        },
        {
          order: 2,
          value: translateEquipment(bos_2),
          label: "bos_2",
          original: bos_2,
        },
        {
          order: 3,
          value: translateEquipment(bos_3),
          label: "bos_3",
          original: bos_3,
        },
        {
          order: 4,
          value: translateEquipment(bos_4),
          label: "bos_4",
          original: bos_4,
        },
        {
          order: 5,
          value: translateEquipment(bos_5),
          label: "bos_5",
          original: bos_5,
        },
        {
          order: 6,
          value: translateEquipment(bos_6),
          label: "bos_6",
          original: bos_6,
        },
      ].filter((item) => item.value);

      // Prepare BOS data updates for all systems
      const bosUpdates: Record<string, any> = {};

      // For each system (1-4), check if it exists and auto-populate BOS if not already set
      for (let systemNum = 1; systemNum <= 4; systemNum++) {
        const prefix = `sys${systemNum}_`;

        // Check if this system has any data (is active)
        const hasSystemData = !!(
          localSystemDetails[`${prefix}solar_panel_make`] ||
          localSystemDetails[`${prefix}solar_panel_model`] ||
          localSystemDetails[`${prefix}solar_panel_qty`] ||
          localSystemDetails[`${prefix}micro_inverter_make`] ||
          localSystemDetails[`${prefix}batteryonly`]
        );

        // Also check if it's an inverter system (BOS only applies to inverter path)
        const systemType = localSystemDetails[`${prefix}selectedsystem`] || "";
        const isInverter = systemType === "inverter";

        if (!hasSystemData || !isInverter) {
          // Skip systems that don't exist or aren't inverter type
          continue;
        }

        const bosPrefix = `bos_${prefix}`;

        // Auto-populate BOS Types 1-6 if not already set
        // Loop through all available requirements and populate corresponding BOS types
        for (let typeIndex = 0; typeIndex < Math.min(type1Requirements.length, 6); typeIndex++) {
          const requirement = type1Requirements[typeIndex];
          const typeNum = typeIndex + 1; // Type 1-6
          const existingType =
            localSystemDetails[`${bosPrefix}type${typeNum}_equipment_type`];

          if (requirement && !existingType) {
            bosUpdates[`${bosPrefix}type${typeNum}_equipment_type`] = requirement.value;
            bosUpdates[`${bosPrefix}type${typeNum}_isnew`] = true;
            bosUpdates[`${bosPrefix}type${typeNum}_active`] = true;
            bosUpdates[`${bosPrefix}show_type${typeNum}`] = true;
            logger.debug(
              `[Equipment] Auto-populating BOS Type ${typeNum} for System ${systemNum}: ${requirement.value}`
            );
          }
        }
      }

      // Save BOS updates if any
      if (Object.keys(bosUpdates).length > 0) {
        try {
          await saveSystemDetails(projectUuid, bosUpdates);
          logger.debug(
            "[Equipment] BOS equipment auto-populated for all systems:",
            bosUpdates
          );

          // Reload system details to reflect changes
          await loadSystemDetails(projectUuid);
        } catch (error) {
          logger.error(
            "[Equipment] Error auto-populating BOS equipment:",
            error
          );
        }
      }
    };

    autoPopulateBOSForAllSystems();
  }, [utilityRequirements, localSystemDetails, projectUuid, loadSystemDetails]);

  // Default to "Do Not Combine" when System 2+ exists and user hasn't made a choice
  useEffect(() => {
    if (!localSystemDetails || combineSystems !== null) {
      // Skip if no data loaded or user has already made a choice
      return;
    }

    // Check if System 2 has any data
    const prefix2 = "sys2_";
    const hasSys2Data = !!(
      localSystemDetails[`${prefix2}solar_panel_make`] ||
      localSystemDetails[`${prefix2}solar_panel_model`] ||
      localSystemDetails[`${prefix2}solar_panel_qty`] ||
      localSystemDetails[`${prefix2}micro_inverter_make`] ||
      localSystemDetails[`${prefix2}batteryonly`]
    );

    if (hasSys2Data && combineSystems === null) {
      // System 2 exists and user hasn't made a choice - default to "Do Not Combine"
      // logger.debug("[Equipment] System 2 detected, defaulting to 'Do Not Combine'");
      setCombineSystems(false);
    }
  }, [localSystemDetails, combineSystems]);

  // Check and load Sub Panel B data from database
  useEffect(() => {
    if (!localSystemDetails) return;

    const spbType = localSystemDetails.spb_subpanel_existing;
    const spbBusRating = localSystemDetails.spb_bus_bar_rating;
    const spbMainBreaker = localSystemDetails.spb_main_breaker_rating;
    const spbFeederLocation = localSystemDetails.spb_subpanel_b_feeder_location;
    const spbDerated = localSystemDetails.el_spb_derated;
    const spbUpstreamBreaker = localSystemDetails.spb_upstream_breaker_rating;
    const spbActivated = localSystemDetails.spb_activated;

    // Check if Sub Panel B data exists in database
    // Filter out string "null" and empty strings as they indicate no actual data
    const hasValidBusRating =
      spbBusRating &&
      String(spbBusRating) !== "null" &&
      String(spbBusRating).trim() !== "";
    const hasValidMainBreaker =
      spbMainBreaker &&
      String(spbMainBreaker) !== "null" &&
      String(spbMainBreaker).trim() !== "";
    const hasValidFeederLocation =
      spbFeederLocation &&
      String(spbFeederLocation) !== "null" &&
      String(spbFeederLocation).trim() !== "";
    const hasData = !!(
      hasValidBusRating ||
      hasValidMainBreaker ||
      hasValidFeederLocation
    );

    if (__DEV__) {
      // logger.debug("[Equipment] Sub Panel B check:", {
      //   spbType,
      //   spbBusRating,
      //   spbMainBreaker,
      //   spbFeederLocation,
      //   spbDerated,
      //   spbUpstreamBreaker,
      //   spbActivated,
      //   hasData,
      // });
    }

    // Sub Panel B is considered active if it has data OR if it's been activated
    if (hasData || spbActivated) {
      setHasSubPanelB(true);
      setSubPanelBData({
        type: spbType === true ? "existing" : spbType === false ? "new" : null,
        busAmps: spbBusRating ? String(spbBusRating) : "",
        mainBreakerAmps: spbMainBreaker ? String(spbMainBreaker) : "",
        feederLocation: spbFeederLocation || "",
        derated: spbDerated,
        upstreamBreakerAmps: spbUpstreamBreaker
          ? String(spbUpstreamBreaker)
          : "",
      });
      // logger.debug("[Equipment] Sub Panel B data loaded from database");
    } else {
      setHasSubPanelB(false);
      setSubPanelBData(null);
      if (__DEV__) {
        // logger.debug("[Equipment] No Sub Panel B data found in database");
      }
    }
  }, [localSystemDetails]);

  // Load Combine BOS Type 1/2/3 data from database
  useEffect(() => {
    if (!localSystemDetails) return;

    console.log('[Equipment] Loading Combine BOS data from database...');

    // Load System Combiner Panel data
    const combinerMake = localSystemDetails.system_combiner_panel_1_make;
    const combinerModel = localSystemDetails.system_combiner_panel_1_model;
    const combinerBusAmps = localSystemDetails.system_combiner_panel_1_amp_rating;
    const combinerMainBreaker = localSystemDetails.system_combiner_panel_1_main_breaker;

    if (combinerMake || combinerModel) {
      console.log('[Equipment] System Combiner Panel data found:', { combinerMake, combinerModel, combinerBusAmps, combinerMainBreaker });
      setSystemCombinerPanel({
        isNew: false,
        selectedMake: combinerMake || "",
        selectedModel: combinerModel || "",
        selectedBusAmps: combinerBusAmps || "",
        selectedMainBreaker: combinerMainBreaker || "mlo",
      });
    }

    // Load Post Combine BOS data from dynamic slots based on combiner panel presence
    // If combiner panel exists: Type 1 → slot 2, Type 2 → slot 3
    // If no combiner: Type 1 → slot 1, Type 2 → slot 2, Type 3 → slot 3
    const hasCombinerPanel = !!(
      localSystemDetails.system_combiner_panel_1_make ||
      localSystemDetails.system_combiner_panel_1_model
    );

    const type1Slot = hasCombinerPanel ? 2 : 1;
    const type2Slot = hasCombinerPanel ? 3 : 2;
    const type3Slot = 3; // Only available when no combiner panel

    // Load Type 1
    const type1Equipment = localSystemDetails[`post_sms_bos_sys1_type${type1Slot}_equipment_type`];
    const type1Make = localSystemDetails[`post_sms_bos_sys1_type${type1Slot}_make`];
    const type1Model = localSystemDetails[`post_sms_bos_sys1_type${type1Slot}_model`];
    const type1AmpRating = localSystemDetails[`post_sms_bos_sys1_type${type1Slot}_amp_rating`];
    const type1Existing = localSystemDetails[`post_sms_bos_sys1_type${type1Slot}_existing`];

    // Filter out "String Combiner Panel" - that's not a Post Combine BOS
    if (type1Equipment && type1Equipment !== 'String Combiner Panel') {
      console.log(`[Equipment] Post Combine BOS Type 1 data found in slot ${type1Slot}:`, { type1Equipment, type1Make, type1Model, type1AmpRating });
      setBosType1Data({
        equipmentType: type1Equipment || "",
        ampRating: type1AmpRating || "",
        make: type1Make || "",
        model: type1Model || "",
        isNew: type1Existing !== true,
      });
    }

    // Load Type 2
    const type2Equipment = localSystemDetails[`post_sms_bos_sys1_type${type2Slot}_equipment_type`];
    const type2Make = localSystemDetails[`post_sms_bos_sys1_type${type2Slot}_make`];
    const type2Model = localSystemDetails[`post_sms_bos_sys1_type${type2Slot}_model`];
    const type2AmpRating = localSystemDetails[`post_sms_bos_sys1_type${type2Slot}_amp_rating`];
    const type2Existing = localSystemDetails[`post_sms_bos_sys1_type${type2Slot}_existing`];

    if (type2Equipment && type2Equipment !== 'String Combiner Panel') {
      console.log(`[Equipment] Post Combine BOS Type 2 data found in slot ${type2Slot}:`, { type2Equipment, type2Make, type2Model, type2AmpRating });
      setBosType2Data({
        equipmentType: type2Equipment || "",
        ampRating: type2AmpRating || "",
        make: type2Make || "",
        model: type2Model || "",
        isNew: type2Existing !== true,
      });
      setShowBosType2(true);
    }

    // Load Type 3 (only when no combiner panel)
    if (!hasCombinerPanel) {
      const type3Equipment = localSystemDetails[`post_sms_bos_sys1_type${type3Slot}_equipment_type`];
      const type3Make = localSystemDetails[`post_sms_bos_sys1_type${type3Slot}_make`];
      const type3Model = localSystemDetails[`post_sms_bos_sys1_type${type3Slot}_model`];
      const type3AmpRating = localSystemDetails[`post_sms_bos_sys1_type${type3Slot}_amp_rating`];
      const type3Existing = localSystemDetails[`post_sms_bos_sys1_type${type3Slot}_existing`];

      if (type3Equipment && type3Equipment !== 'String Combiner Panel') {
        console.log(`[Equipment] Post Combine BOS Type 3 data found in slot ${type3Slot}:`, { type3Equipment, type3Make, type3Model, type3AmpRating });
        setBosType3Data({
          equipmentType: type3Equipment || "",
          ampRating: type3AmpRating || "",
          make: type3Make || "",
          model: type3Model || "",
          isNew: type3Existing !== true,
        });
        setShowBosType3(true);
      }
    }
  }, [localSystemDetails]);

  // Auto-save System Combiner Panel data to database when it changes
  // IMPORTANT: System Combiner Panel saves ONLY to system-specific BOS (post_sms_bos_sys1_type1)
  // It does NOT occupy any Post Combine BOS slots
  useEffect(() => {
    if (!projectUuid || (!systemCombinerPanel.selectedMake && !systemCombinerPanel.selectedModel)) return;

    console.log('[Equipment] Auto-saving System Combiner Panel data:', systemCombinerPanel);

    const saveData = async () => {
      try {
        // Extract the actual model name from the models dropdown data
        // selectedModel might be a UUID, so we need to find the label (actual model name)
        const modelEntry = combinerPanelModels.find(m => m.value === systemCombinerPanel.selectedModel);
        const actualModelName = modelEntry?.label || systemCombinerPanel.selectedModel;

        console.log('[Equipment] Saving System Combiner Panel - model UUID to name mapping:', {
          selectedModel: systemCombinerPanel.selectedModel,
          actualModelName,
          modelsAvailable: combinerPanelModels.length
        });

        const payload: Record<string, any> = {
          // Save System Combiner Panel data to dedicated fields
          system_combiner_panel_1_make: systemCombinerPanel.selectedMake || null,
          system_combiner_panel_1_model: actualModelName || null,
          system_combiner_panel_1_amp_rating: systemCombinerPanel.selectedBusAmps || null,
          system_combiner_panel_1_main_breaker: systemCombinerPanel.selectedMainBreaker || null,

          // Save to System 1 BOS Type 1 slot (system-specific BOS)
          post_sms_bos_sys1_type1_equipment_type: 'Position Combiner Panel',
          post_sms_bos_sys1_type1_make: systemCombinerPanel.selectedMake || null,
          post_sms_bos_sys1_type1_model: actualModelName || null,
          post_sms_bos_sys1_type1_amp_rating: systemCombinerPanel.selectedBusAmps || null,
          post_sms_bos_sys1_type1_existing: !systemCombinerPanel.isNew,
        };

        await saveSystemDetailsPartialExact(projectUuid, payload);
        console.log('[Equipment] System Combiner Panel saved to post_sms_bos_sys1_type1 successfully');
      } catch (error) {
        logger.error('[Equipment] Failed to save System Combiner Panel:', error);
      }
    };

    saveData();
  }, [projectUuid, systemCombinerPanel, combinerPanelModels]);

  // Save Post Combine BOS Type 1 data to database when it changes
  // IMPORTANT: Dynamic slot allocation based on String Combiner Panel presence
  // If String Combiner Panel exists, it takes type1, so Post Combine BOS starts at type2
  useEffect(() => {
    if (!projectUuid || !bosType1Data.equipmentType) return;

    const hasCombinerPanel = !!(systemCombinerPanel.selectedMake || systemCombinerPanel.selectedModel);
    const targetSlot = hasCombinerPanel ? 2 : 1; // Skip type1 if combiner panel exists

    console.log('[Equipment] Saving Post Combine BOS Type 1 data to slot', targetSlot, ':', bosType1Data);

    const saveData = async () => {
      try {
        await saveSystemDetailsPartialExact(projectUuid, {
          [`post_sms_bos_sys1_type${targetSlot}_equipment_type`]: bosType1Data.equipmentType || null,
          [`post_sms_bos_sys1_type${targetSlot}_make`]: bosType1Data.make || null,
          [`post_sms_bos_sys1_type${targetSlot}_model`]: bosType1Data.model || null,
          [`post_sms_bos_sys1_type${targetSlot}_amp_rating`]: bosType1Data.ampRating || null,
          [`post_sms_bos_sys1_type${targetSlot}_existing`]: !bosType1Data.isNew,
        });
        console.log(`[Equipment] Post Combine BOS Type 1 saved to post_sms_bos_sys1_type${targetSlot} successfully`);
      } catch (error) {
        logger.error('[Equipment] Error saving Post Combine BOS Type 1:', error);
      }
    };

    saveData();
  }, [projectUuid, bosType1Data, systemCombinerPanel.selectedMake, systemCombinerPanel.selectedModel]);

  // Save Post Combine BOS Type 2 data to database when it changes
  // IMPORTANT: Dynamic slot allocation - if combiner panel exists, Type 2 goes to slot 3, otherwise slot 2
  useEffect(() => {
    if (!projectUuid || !bosType2Data.equipmentType) return;

    const hasCombinerPanel = !!(systemCombinerPanel.selectedMake || systemCombinerPanel.selectedModel);
    const targetSlot = hasCombinerPanel ? 3 : 2; // Shift if combiner panel exists

    console.log('[Equipment] Saving Post Combine BOS Type 2 data to slot', targetSlot, ':', bosType2Data);

    const saveData = async () => {
      try {
        await saveSystemDetailsPartialExact(projectUuid, {
          [`post_sms_bos_sys1_type${targetSlot}_equipment_type`]: bosType2Data.equipmentType || null,
          [`post_sms_bos_sys1_type${targetSlot}_make`]: bosType2Data.make || null,
          [`post_sms_bos_sys1_type${targetSlot}_model`]: bosType2Data.model || null,
          [`post_sms_bos_sys1_type${targetSlot}_amp_rating`]: bosType2Data.ampRating || null,
          [`post_sms_bos_sys1_type${targetSlot}_existing`]: !bosType2Data.isNew,
        });
        console.log(`[Equipment] Post Combine BOS Type 2 saved to post_sms_bos_sys1_type${targetSlot} successfully`);
      } catch (error) {
        logger.error('[Equipment] Error saving Post Combine BOS Type 2:', error);
      }
    };

    saveData();
  }, [projectUuid, bosType2Data, systemCombinerPanel.selectedMake, systemCombinerPanel.selectedModel]);

  // Save Post Combine BOS Type 3 data to database when it changes
  // IMPORTANT: Type 3 only available when NO combiner panel (otherwise we'd exceed 3 slots)
  // If no combiner: Type 3 goes to slot 3
  useEffect(() => {
    if (!projectUuid || !bosType3Data.equipmentType) return;

    const hasCombinerPanel = !!(systemCombinerPanel.selectedMake || systemCombinerPanel.selectedModel);

    // Type 3 should not be available if combiner panel exists (only 3 slots total)
    if (hasCombinerPanel) {
      console.warn('[Equipment] Post Combine BOS Type 3 cannot be saved when String Combiner Panel exists (max 3 slots)');
      return;
    }

    const targetSlot = 3;

    console.log('[Equipment] Saving Post Combine BOS Type 3 data to slot', targetSlot, ':', bosType3Data);

    const saveData = async () => {
      try {
        await saveSystemDetailsPartialExact(projectUuid, {
          [`post_sms_bos_sys1_type${targetSlot}_equipment_type`]: bosType3Data.equipmentType || null,
          [`post_sms_bos_sys1_type${targetSlot}_make`]: bosType3Data.make || null,
          [`post_sms_bos_sys1_type${targetSlot}_model`]: bosType3Data.model || null,
          [`post_sms_bos_sys1_type${targetSlot}_amp_rating`]: bosType3Data.ampRating || null,
          [`post_sms_bos_sys1_type${targetSlot}_existing`]: !bosType3Data.isNew,
        });
        console.log(`[Equipment] Post Combine BOS Type 3 saved to post_sms_bos_sys1_type${targetSlot} successfully`);
      } catch (error) {
        logger.error('[Equipment] Error saving Post Combine BOS Type 3:', error);
      }
    };

    saveData();
  }, [projectUuid, bosType3Data, systemCombinerPanel.selectedMake, systemCombinerPanel.selectedModel]);

  // ── Helper: Validate combine eligibility ──
  const validateCombineEligibility = useCallback((systemDetails: any) => {
    const errors: string[] = [];
    const activeSystems: number[] = [];

    // logger.debug("[Equipment] validateCombineEligibility - Starting validation");

    for (let i = 1; i <= 4; i++) {
      const prefix = `sys${i}_`;
      const hasSolarPanel = !!(
        systemDetails[`${prefix}solar_panel_make`] ||
        systemDetails[`${prefix}solar_panel_model`] ||
        systemDetails[`${prefix}solar_panel_qty`]
      );
      const hasInverter = !!(
        systemDetails[`${prefix}micro_inverter_make`] &&
        systemDetails[`${prefix}micro_inverter_model`]
      );
      const isBatteryOnly = systemDetails[`${prefix}batteryonly`] === true;

      // logger.debug(`[Equipment] System ${i} check:`, {
      //   hasSolarPanel,
      //   hasInverter,
      //   isBatteryOnly,
      //   solarMake: systemDetails[`${prefix}solar_panel_make`],
      //   solarModel: systemDetails[`${prefix}solar_panel_model`],
      //   solarQty: systemDetails[`${prefix}solar_panel_qty`],
      //   inverterMake: systemDetails[`${prefix}micro_inverter_make`],
      //   inverterModel: systemDetails[`${prefix}micro_inverter_model`],
      //   systemSelection: systemDetails[`${prefix}selectedsystem`],
      //   // Additional debug fields to understand what data exists
      //   allInverterFields: {
      //     micro_inverter_make: systemDetails[`${prefix}micro_inverter_make`],
      //     micro_inverter_model: systemDetails[`${prefix}micro_inverter_model`],
      //     micro_inverter_id: systemDetails[`${prefix}micro_inverter_id`],
      //     micro_inverter_qty: systemDetails[`${prefix}micro_inverter_qty`],
      //     micro_inverter_existing: systemDetails[`${prefix}micro_inverter_existing`],
      //   },
      // });

      // System is active if it has solar panels OR has an inverter/microinverter
      // (inverter-only systems are valid, e.g., for battery storage or future expansion)
      const isActiveSystem = hasSolarPanel || hasInverter || isBatteryOnly;

      if (isActiveSystem) {
        activeSystems.push(i);

        // Only validate inverter requirement for systems with solar panels
        if (hasSolarPanel && !hasInverter) {
          errors.push(`System ${i} needs an Inverter/Microinverter selected`);
        }
      }
    }

    // Need at least 2 systems to combine
    if (activeSystems.length < 2) {
      errors.push("At least 2 systems are required to combine");
    }

    // logger.debug("[Equipment] Validation complete:", { activeSystems, errors });

    return {
      valid: errors.length === 0,
      errors,
      activeSystems,
    };
  }, []);

  // ── Helper: Generate dynamic combine options ──
  const generateCombineOptions = useCallback(
    (systemDetails: any, activeSystems: number[]) => {
      const options: Array<{ label: string; value: string }> = [];

      // ── Special Equipment Detection ──
      // 1. SolarEdge Backup Interface (in SMS section)
      const solarEdgeBackupSystems: number[] = [];
      activeSystems.forEach((sysNum) => {
        const prefix = `sys${sysNum}_`;
        const smsModel = systemDetails[`${prefix}sms_model`];

        // Check if SMS model contains "Backup Interface"
        if (smsModel && smsModel.includes("Backup Interface")) {
          solarEdgeBackupSystems.push(sysNum);
        }
      });

      // 2. Tesla PowerWall 3 or PowerWall+ (in Inverter section)
      const powerWallSystems: number[] = [];
      activeSystems.forEach((sysNum) => {
        const prefix = `sys${sysNum}_`;
        const inverterModel = systemDetails[`${prefix}micro_inverter_model`];

        // Check if inverter model is PowerWall 3 or PowerWall+
        if (
          inverterModel &&
          (inverterModel.includes("PowerWall 3") ||
            inverterModel.includes("Powerwall 3") ||
            inverterModel.includes("PowerWall+") ||
            inverterModel.includes("Powerwall+"))
        ) {
          powerWallSystems.push(sysNum);
        }
      });

      // 3. Sol-Ark Inverters (in Inverter section)
      const solArkSystems: number[] = [];
      activeSystems.forEach((sysNum) => {
        const prefix = `sys${sysNum}_`;
        const inverterMake = systemDetails[`${prefix}micro_inverter_make`];

        console.log(`[Sol-Ark Detection] System ${sysNum} inverter make:`, inverterMake);

        // Check if inverter make is Sol-Ark (case-insensitive)
        if (
          inverterMake &&
          (inverterMake.toLowerCase().includes("sol-ark") ||
            inverterMake.toLowerCase().includes("solark"))
        ) {
          console.log(`[Sol-Ark Detection] ✅ Found Sol-Ark in System ${sysNum}`);
          solArkSystems.push(sysNum);
        }
      });

      console.log(`[Sol-Ark Detection] Total Sol-Ark systems found:`, solArkSystems);

      // ── Build Options ──
      // Add SolarEdge Backup Interface options
      if (solarEdgeBackupSystems.length > 0) {
        solarEdgeBackupSystems.forEach((sysNum) => {
          const label =
            solarEdgeBackupSystems.length > 1
              ? `SolarEdge Backup Interface - Sys ${sysNum}`
              : `SolarEdge Backup Interface`;

          options.push({
            label,
            value: label, // Explicit for Excel field
          });
        });
      }

      // Add Tesla PowerWall options
      if (powerWallSystems.length > 0) {
        powerWallSystems.forEach((sysNum) => {
          const label =
            powerWallSystems.length > 1
              ? `Tesla PowerWall 3 - Sys ${sysNum}`
              : `Tesla PowerWall 3`;

          options.push({
            label,
            value: label, // Explicit for Excel field
          });
        });
      }

      // Add Sol-Ark options
      if (solArkSystems.length > 0) {
        solArkSystems.forEach((sysNum) => {
          const label =
            solArkSystems.length > 1
              ? `Sol-Ark - Sys ${sysNum}`
              : `Sol-Ark`;

          options.push({
            label,
            value: label, // Explicit for Excel field
          });
        });
      }

      // ── Fallback: Combiner Panel ──
      // If no special equipment found, only option is Combiner Panel
      if (options.length === 0) {
        options.push({
          label: "Combiner Panel",
          value: "Combiner Panel",
        });
      }

      // logger.debug("[Equipment] Generated combine options:", {
      //   solarEdgeBackupSystems,
      //   powerWallSystems,
      //   options,
      // });

      return options;
    },
    []
  );

  // ── HYDRATION: Load saved configuration on focus ──
  useFocusEffect(
    useCallback(() => {
      const hydrateConfiguration = async () => {
        if (!projectUuid) return;

        try {
          const systemData = await fetchSystemDetails(projectUuid);
          const combineValue = systemData?.ele_combine_positions;

          // ── Try to load from individual fields first (new approach) ──
          const eleCombineSystems = systemData?.ele_combine_systems;
          const eleCombineActiveSystems =
            systemData?.ele_combine_active_systems;
          const eleCombineSystemDesc = systemData?.ele_combine_system_desc;

          // Check if we have the boolean flag set (either true or explicitly false)
          if (eleCombineSystems !== undefined && eleCombineSystems !== null) {
            // User has made a choice about combining systems

            if (eleCombineSystems === true && eleCombineActiveSystems) {
              // User chose to combine - load landing configurations
              const activeSystems = String(eleCombineActiveSystems)
                .split(",")
                .map(Number)
                .filter((n) => !isNaN(n));
              const landings: Record<string, string> = {};

              // Load each system's landing destination
              activeSystems.forEach((sysNum) => {
                const landing = systemData[`sys${sysNum}_landing_destination`];
                if (landing) {
                  landings[`system${sysNum}`] = landing;
                }
              });

              // Restore state from individual fields
              setCombineSystems(true);
              setSystemLandings(landings);
              setCompletedSystems(activeSystems);
              setCurrentSystemConfig(0);

              // Show Combine BOS button if systems are being combined
              setShowCombineBOS(true);

              // logger.debug("[Equipment] Loaded COMBINE configuration from individual fields");
            } else if (
              eleCombineSystems === false ||
              eleCombineSystemDesc === "No Combine"
            ) {
              // User explicitly chose "Do Not Combine"
              setCombineSystems(false);
              setSystemLandings({});
              setCompletedSystems([]);
              setCurrentSystemConfig(0);
              setShowCombineBOS(false);

              // logger.debug("[Equipment] Loaded NO COMBINE configuration from individual fields");
            }

            return;
          }

          if (!combineValue) {
            // No saved configuration - reset to initial state
            setCombineSystems(null);
            setShowCombineBOS(false);
            setCurrentSystemConfig(0);
            setSystemLandings({});
            setCompletedSystems([]);
            setHasSubPanelB(false);
            setSubPanelBData(null);
            // logger.debug("[Equipment] No saved configuration found");
            return;
          }

          // Try to parse as JSON (new format)
          try {
            const config = JSON.parse(combineValue);

            // Validate it's our new format
            if (config.version && config.combine_systems !== undefined) {
              // logger.debug("[Equipment] Hydrating from new format:", config);

              // Restore all state from saved configuration
              setCombineSystems(config.combine_systems);
              setSystemLandings(config.system_landings || {});
              setCompletedSystems(config.completed_systems || []);
              setCurrentSystemConfig(config.current_step || 0);

              // Restore Sub Panel B data - only if it has actual data
              // Filter out string "null" and empty strings
              const hasValidBusRating =
                config.sub_panel_b?.bus_rating &&
                String(config.sub_panel_b.bus_rating) !== "null" &&
                String(config.sub_panel_b.bus_rating).trim() !== "";
              const hasValidMainBreaker =
                config.sub_panel_b?.main_breaker_rating &&
                String(config.sub_panel_b.main_breaker_rating) !== "null" &&
                String(config.sub_panel_b.main_breaker_rating).trim() !== "";
              const hasValidFeederLocation =
                config.sub_panel_b?.feeder_location &&
                String(config.sub_panel_b.feeder_location) !== "null" &&
                String(config.sub_panel_b.feeder_location).trim() !== "";
              const spbHasData = !!(
                hasValidBusRating ||
                hasValidMainBreaker ||
                hasValidFeederLocation
              );

              if (config.sub_panel_b?.exists && spbHasData) {
                setHasSubPanelB(true);
                setSubPanelBData({
                  type: config.sub_panel_b.type || null,
                  busAmps: config.sub_panel_b.bus_rating || "",
                  mainBreakerAmps: config.sub_panel_b.main_breaker_rating || "",
                  feederLocation: config.sub_panel_b.feeder_location || "",
                  derated: config.sub_panel_b.derated || null,
                  upstreamBreakerAmps:
                    config.sub_panel_b.upstream_breaker_rating || "",
                });
              } else {
                // No Sub Panel B data, ensure state is cleared
                setHasSubPanelB(false);
                setSubPanelBData(null);
              }

              // If configuration is complete, show the overview
              if (
                config.current_step === 0 &&
                config.completed_systems?.length > 0
              ) {
                setShowCombineBOS(false); // Don't show BOS button
              }

              // logger.info("[Equipment] Configuration hydrated successfully");
              return;
            }
          } catch (parseError) {
            // Not JSON, try legacy formats
            // logger.debug("[Equipment] Not JSON format, checking legacy formats");
          }

          // ── Legacy Format Support ──
          if (combineValue === "Combine System 1 & 2") {
            // Old format - user started combining but didn't finish
            setCombineSystems(true);
            setShowCombineBOS(false);
            setCurrentSystemConfig(0);
            // logger.debug("[Equipment] Restored legacy incomplete configuration");
          } else if (
            typeof combineValue === "string" &&
            (combineValue.includes("SolarEdge Backup Interface") ||
              combineValue.includes("Tesla PowerWall") ||
              combineValue === "Combiner Panel")
          ) {
            // Old completed format - restore basic state
            setCombineSystems(true);
            setCombineMethod(combineValue);
            setShowCombineBOS(true);
            // logger.debug("[Equipment] Restored legacy completed configuration");
          } else {
            // Unknown format
            logger.warn(
              "[Equipment] Unknown configuration format:",
              combineValue
            );
            setCombineSystems(false);
          }
        } catch (error) {
          logger.error("[Equipment] Error during hydration:", error);
        }
      };

      hydrateConfiguration();
    }, [projectUuid, validateCombineEligibility, generateCombineOptions])
  );

  // Handle combine systems button click
  const handleCombineSystemsClick = async (shouldCombine: boolean) => {
    if (shouldCombine) {
      // Check if system details are loaded
      if (!localSystemDetails || Object.keys(localSystemDetails).length === 0) {
        Toast.show({
          text1: "Loading Equipment Data",
          text2: "Please wait for equipment data to load",
          type: "info",
          position: "bottom",
          visibilityTime: 3000,
        });
        return;
      }

      // Validate that all systems have required equipment
      const validation = validateCombineEligibility(localSystemDetails);

      if (!validation.valid) {
        // Show validation error
        const errorMessage = validation.errors.join(". ");
        setCombineValidationError(errorMessage);
        Toast.show({
          text1: "Cannot Combine Systems",
          text2: errorMessage,
          type: "error",
          position: "bottom",
          visibilityTime: 4000,
        });
        return;
      }

      // Validation passed - start progressive configuration
      setCombineSystems(true);
      setCombineValidationError("");

      // Show Combine BOS button for combined systems
      setShowCombineBOS(true);

      // Start with the first active system
      const firstSystem = validation.activeSystems[0];
      setCurrentSystemConfig(firstSystem);

      // Reset configuration state
      setSystemLandings({});
      setCompletedSystems([]);

      // Save initial combine status to database
      try {
        // Generate initial description
        const combineDesc =
          validation.activeSystems.length === 4
            ? "Combine All"
            : validation.activeSystems.length === 3
            ? `Combine ${validation.activeSystems.join(", ")}`
            : `Combine ${validation.activeSystems[0]} & ${validation.activeSystems[1]}`;

        await saveSystemDetails(projectUuid!, {
          ele_combine_positions: "Combine System 1 & 2", // Legacy
          ele_combine_systems: true,
          ele_combine_active_systems: validation.activeSystems.join(","),
          ele_combine_system_desc: combineDesc,
        });
      } catch (error) {
        logger.error("[Equipment] Error saving combine status:", error);
      }
    } else {
      // User unchecking combine - clear everything
      setCombineSystems(false);
      setCurrentSystemConfig(0);
      setSystemLandings({});
      setCompletedSystems([]);
      try {
        // Clear all combination-related fields and set description to "No Combine"
        await saveSystemDetails(projectUuid!, {
          ele_combine_positions: null,
          ele_combine_systems: false,
          ele_combine_active_systems: null,
          ele_combine_system_desc: "No Combine",
          sys1_landing_destination: null,
          sys2_landing_destination: null,
          sys3_landing_destination: null,
          sys4_landing_destination: null,
        });
        setShowCombineBOS(false);
        setCombineMethod("");
        setCombineOptions([]);
        setCombineValidationError("");
      } catch (error) {
        logger.error("[Equipment] Error clearing combine status:", error);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Always refresh data when screen comes into focus to detect changes from System 2, 3, 4
      if (project?.uuid) {
        // logger.debug("[Equipment] Screen focused - refreshing system data");
        loadSystemDetails(project.uuid);
      }
    }, [project?.uuid, loadSystemDetails])
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) Effective systemDetails chain (local → Redux fallbacks)
  const systemDetails = useMemo(
    () => localSystemDetails ?? systemDetailsFromStore ?? {},
    [localSystemDetails, systemDetailsFromStore]
  );

  if (__DEV__) {
    useEffect(() => {
      try {
        const k = Object.keys(systemDetails || {}).length;
        // logger.debug("[Equipment] systemDetails (effective) keys:", k);
      } catch {}
    }, [systemDetails]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) Compute "isDirty" (orange) per system - check only key indicators of user configuration
  const computedActive = useMemo(() => {
    const hasUserConfiguredSystem = (label: string) => {
      const pref = PREFIXES_BY_LABEL[label];
      const prefixes = Array.isArray(pref) ? pref : [pref];

      // For Systems 1-4, check specific key indicators:
      return prefixes.some((prefix) => {
        if (typeof prefix !== "string") return false;

        // 1. Check if system selection has been made (microinverter or inverter)
        const systemSelection = systemDetails[`${prefix}selectedsystem`];
        const hasSystemSelection =
          systemSelection === "microinverter" || systemSelection === "inverter";

        // 2. Check if solar panel section has meaningful data (make, model, or quantity > 0)
        const solarPanelMake = systemDetails[`${prefix}solar_panel_make`];
        const solarPanelModel = systemDetails[`${prefix}solar_panel_model`];
        const solarPanelQuantity =
          systemDetails[`${prefix}solar_panel_quantity`];

        const hasSolarPanelData =
          (solarPanelMake &&
            typeof solarPanelMake === "string" &&
            solarPanelMake.trim() !== "" &&
            solarPanelMake.trim() !== "00") ||
          (solarPanelModel &&
            typeof solarPanelModel === "string" &&
            solarPanelModel.trim() !== "" &&
            solarPanelModel.trim() !== "00") ||
          (typeof solarPanelQuantity === "number" && solarPanelQuantity > 0);

        // 3. Check if battery-only mode has been selected
        const hasBatteryOnly = systemDetails[`${prefix}batteryonly`] === true;

        // 4. Check if inverter/microinverter has been configured
        const microInverterMake = systemDetails[`${prefix}micro_inverter_make`];
        const microInverterModel =
          systemDetails[`${prefix}micro_inverter_model`];

        const hasInverterData =
          (microInverterMake &&
            typeof microInverterMake === "string" &&
            microInverterMake.trim() !== "") ||
          (microInverterModel &&
            typeof microInverterModel === "string" &&
            microInverterModel.trim() !== "");

        const isActive =
          hasSystemSelection ||
          hasSolarPanelData ||
          hasBatteryOnly ||
          hasInverterData;

        // DEBUG: Log detection for System 2 specifically
        if (prefix === "sys2_" && __DEV__) {
          // logger.debug(`[Equipment] System 2 Detection:`, {
          //   prefix,
          //   systemSelection,
          //   hasSystemSelection,
          //   solarPanelMake,
          //   solarPanelModel,
          //   solarPanelQuantity,
          //   hasSolarPanelData,
          //   hasBatteryOnly,
          //   microInverterMake,
          //   microInverterModel,
          //   hasInverterData,
          //   isActive,
          // });
        }

        // System is active if ANY of these criteria are met
        return isActive;
      });
    };

    // By default, all systems start as inactive (blue) until user configures key elements
    const result = systems.reduce<Record<string, boolean>>((acc, label) => {
      acc[label] = hasUserConfiguredSystem(label);
      return acc;
    }, {});

    // DEBUG: Log final active states
    if (__DEV__) {
      // logger.debug("[Equipment] Computed Active States:", result);
    }

    return result;
  }, [systemDetails]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) Progressive system display logic
  const systemDisplayStates = useMemo(() => {
    const states: Record<
      string,
      { show: boolean; deactivated: boolean; label: string }
    > = {};

    const sys1HasData = computedActive["System 1"];
    const sys2HasData = computedActive["System 2"];
    const sys3HasData = computedActive["System 3"];

    // System 1 is always shown and ready
    states["System 1"] = { show: true, deactivated: false, label: "System 1" };

    // System 2 always shows
    // - If no data: "Add System 2" with grey border (NOT deactivated - clickable!)
    // - If has data: "System 2" with orange/blue border (active)
    states["System 2"] = {
      show: true,
      deactivated: false, // ALWAYS clickable, even when showing "Add System 2"
      label: sys2HasData ? "System 2" : "Add System 2",
    };

    // System 3 only shows if System 2 has data
    // - Initially: "Add System 3" with grey border (NOT deactivated - clickable!)
    // - After data added: "System 3" with orange/blue border (active)
    states["System 3"] = {
      show: sys2HasData, // Only show if System 2 has data
      deactivated: false, // ALWAYS clickable when visible
      label: sys3HasData ? "System 3" : "Add System 3",
    };

    // System 4 only shows if System 3 has data
    // - Initially: "Add System 4" with grey border (NOT deactivated - clickable!)
    // - After data added: "System 4" with orange/blue border (active)
    const sys4HasData = computedActive["System 4"];
    states["System 4"] = {
      show: sys3HasData, // Only show if System 3 has data
      deactivated: false, // ALWAYS clickable when visible
      label: sys4HasData ? "System 4" : "Add System 4",
    };

    // Combine BOS shows only when explicitly enabled via showCombineBOS state
    states["Combine BOS"] = {
      show: showCombineBOS, // Only show when user clicks "Combine Systems"
      deactivated: false, // Not actually deactivated - it's clickable
      label: "Combine BOS",
    };

    if (__DEV__) {
      // logger.debug("[Equipment] System Display States:", states);
    }

    return states;
  }, [computedActive, showCombineBOS]);

  // System route mapping - consolidated to single EquipmentDetails screen
  const systemRouteMap = useMemo<Record<string, string>>(
    () => ({
      "System 1": "EquipmentDetails",
      "System 2": "EquipmentDetails",
      "System 3": "EquipmentDetails",
      "System 4": "EquipmentDetails",
      "Combine BOS": "CombineBOS", // New combined BOS screen (to be created)
    }),
    []
  );

  // Memoize navigation details to prevent recreation on every render
  const navigationDetails = useMemo(
    () => ({
      address: company
        ? {
            street: company.address || "",
            city: company.city || "",
            state: company.state || "",
            zip: company.zipCode || "",
          }
        : undefined,
      lastName: user?.lastName,
      firstName: user?.firstName,
      installerId: InstallerId,
    }),
    [company, user, InstallerId]
  );

  // Memoized handler with system-specific params
  const handleSystemPress = useCallback(
    async (systemLabel: string) => {
      const targetRoute = systemRouteMap[systemLabel] || "EquipmentDetails";

      // Extract system number for Systems 1-4
      const systemMatch = systemLabel.match(/System (\d+)/);
      const systemNumber = systemMatch ? parseInt(systemMatch[1]) : 1;
      const systemPrefix = systemMatch ? `sys${systemNumber}_` : "";

      // Detect Hoymiles/APSystems for this system to enable custom stringing mode
      const microInverterMake = systemDetails[`${systemPrefix}micro_inverter_make`];
      const microInverterModel = systemDetails[`${systemPrefix}micro_inverter_model`];
      const isHoymiles = microInverterMake === "Hoymiles Power";
      const isAPSystems = microInverterMake === "APSystems";

      // For Hoymiles/APSystems, pre-load models and convert label to UUID
      let modelUUID = microInverterModel;
      if ((isHoymiles || isAPSystems) && microInverterModel) {
        console.log(`[Equipment Navigation] Detected ${microInverterMake} system:`, {
          systemLabel,
          systemPrefix,
          make: microInverterMake,
          model: microInverterModel,
        });

        try {
          // Fetch models for this make to convert label to UUID
          const models = await getModels("micro-inverters", microInverterMake);
          console.log(`[Equipment Navigation] Loaded ${models.length} models for ${microInverterMake}`);

          // Find the model UUID by matching the label
          const matchingModel = models.find(m => m.label === microInverterModel);
          if (matchingModel) {
            modelUUID = matchingModel.value;
            console.log(`[Equipment Navigation] Converted model label to UUID:`, {
              label: microInverterModel,
              uuid: modelUUID,
            });
          } else {
            console.warn(`[Equipment Navigation] No matching model found for label:`, microInverterModel);
          }
        } catch (error) {
          console.error(`[Equipment Navigation] Failed to load models:`, error);
        }
      }

      navigation.navigate(targetRoute, {
        systemLabel,
        systemNumber,
        systemPrefix,
        details: navigationDetails,
        data: equipmentSetGroup[systemLabel],
        // Pass microinverter info to help with hydration
        microInverterHint: microInverterMake ? {
          make: microInverterMake,
          model: microInverterModel, // Keep original label for display
          modelUUID, // Pass the UUID for hydration
          isHoymiles,
          isAPSystems,
        } : undefined,
      });
    },
    [navigation, systemRouteMap, navigationDetails, equipmentSetGroup, systemDetails]
  );

  // Handle landing option selection
  const handleLandingSelection = useCallback(
    async (systemNum: number, landingValue: string) => {
      if (__DEV__) {
        // logger.debug("[Equipment] Landing selection:", {
        //   systemNum,
        //   landingValue,
        //   hasSubPanelB,
        //   subPanelBData,
        // });
      }

      // Check if user selected Sub Panel B but it doesn't exist - activate it
      if (landingValue.includes("Sub Panel B") && !hasSubPanelB) {
        console.log(
          "[Equipment] Sub Panel B selected but doesn't exist - activating section"
        );
        // Activate Sub Panel B section on Electrical page
        try {
          await saveSystemDetails(projectUuid!, {
            spb_activated: true, // Flag to show Sub Panel B section is needed
          });
          setHasSubPanelB(true); // Update local state
          console.log("[Equipment] Sub Panel B activated successfully");
        } catch (error) {
          logger.error("[Equipment] Error activating Sub Panel B:", error);
          Toast.show({
            text1: "Error",
            text2: "Failed to activate Sub Panel B",
            type: "error",
            position: "bottom",
            visibilityTime: 3000,
          });
          return; // Only return on error
        }
        // Continue with landing selection below (no early return)
      }

      // Update landing configuration
      const newLandings = {
        ...systemLandings,
        [`system${systemNum}`]: landingValue,
      };
      setSystemLandings(newLandings);

      // Mark system as completed
      if (!completedSystems.includes(systemNum)) {
        setCompletedSystems([...completedSystems, systemNum]);
      }

      // Get validation result to know active systems
      const validation = validateCombineEligibility(localSystemDetails || {});
      const activeSystems = validation.activeSystems;

      // Move to next system or complete
      const currentIndex = activeSystems.indexOf(systemNum);
      if (currentIndex < activeSystems.length - 1) {
        // Move to next system
        const nextSystem = activeSystems[currentIndex + 1];
        setCurrentSystemConfig(nextSystem);
      } else {
        // All systems configured - mark as complete
        setCurrentSystemConfig(0);

        // Generate configuration data for Excel/downstream processing
        const configData = generateConfigurationData(
          true,
          newLandings,
          activeSystems,
          localSystemDetails || {},
          hasSubPanelB,
          subPanelBData
        );

        // Create complete configuration object for database storage
        const fullConfig = {
          version: "2.0",
          combine_systems: true,
          active_systems: activeSystems,
          system_landings: newLandings,
          connections: configData.connections,
          sub_panel_b: {
            exists: hasSubPanelB,
            type: subPanelBData?.type || null,
            bus_rating: subPanelBData?.busAmps || "",
            main_breaker_rating: subPanelBData?.mainBreakerAmps || "",
            feeder_location: subPanelBData?.feederLocation || "",
            derated: subPanelBData?.derated || null,
            upstream_breaker_rating: subPanelBData?.upstreamBreakerAmps || "",
          },
          completed_systems: [...completedSystems, systemNum],
          current_step: 0, // 0 = configuration complete
          timestamp: new Date().toISOString(),
        };

        // Generate human-readable description of which systems are combined
        let combineDesc = "";
        if (activeSystems.length === 4) {
          combineDesc = "Combine All";
        } else if (activeSystems.length === 3) {
          combineDesc = `Combine ${activeSystems.join(", ")}`;
        } else if (activeSystems.length === 2) {
          combineDesc = `Combine ${activeSystems[0]} & ${activeSystems[1]}`;
        }

        // Build individual database fields following sys1, sys2, sys3, sys4 pattern
        const dbFields: Record<string, any> = {
          ele_combine_positions: JSON.stringify(fullConfig), // Keep for backwards compatibility
          ele_combine_systems: true,
          ele_combine_active_systems: activeSystems.join(","), // "1,2,3,4"
          ele_combine_system_desc: combineDesc, // Human-readable description
        };

        // Save individual landing destinations for each system
        activeSystems.forEach((sysNum) => {
          const landing = newLandings[`system${sysNum}`];
          if (landing) {
            dbFields[`sys${sysNum}_landing_destination`] = landing;
          }
        });

        // Save to database
        try {
          await saveSystemDetails(projectUuid!, dbFields);

          // logger.info("[Equipment] Configuration saved successfully:", fullConfig);
        } catch (error) {
          logger.error("[Equipment] Error saving configuration:", error);
          Toast.show({
            text1: "Save Failed",
            text2: "Could not save configuration",
            type: "error",
            position: "bottom",
            visibilityTime: 3000,
          });
        }
      }
    },
    [
      systemLandings,
      completedSystems,
      validateCombineEligibility,
      localSystemDetails,
      hasSubPanelB,
      subPanelBData,
      projectUuid,
    ]
  );

  // Compute active systems for current state
  const activeSystemsArray = useMemo(() => {
    if (!localSystemDetails) return [];
    const validation = validateCombineEligibility(localSystemDetails);
    return validation.activeSystems;
  }, [localSystemDetails, validateCombineEligibility]);

  // Handle configuration save (when user clicks "Save Configuration" button)
  const handleConfigurationSave = useCallback(async () => {
    if (!projectUuid) return;

    try {
      // Generate current configuration data
      const configData = generateConfigurationData(
        true,
        systemLandings,
        activeSystemsArray,
        localSystemDetails || {},
        hasSubPanelB,
        subPanelBData
      );

      // Create complete configuration object for database storage
      const fullConfig = {
        version: "2.0",
        combine_systems: combineSystems,
        active_systems: activeSystemsArray,
        system_landings: systemLandings,
        connections: configData.connections,
        sub_panel_b: {
          exists: hasSubPanelB,
          type: subPanelBData?.type || null,
          bus_rating: subPanelBData?.busAmps || "",
          main_breaker_rating: subPanelBData?.mainBreakerAmps || "",
          feeder_location: subPanelBData?.feederLocation || "",
          derated: subPanelBData?.derated || null,
          upstream_breaker_rating: subPanelBData?.upstreamBreakerAmps || "",
        },
        completed_systems: completedSystems,
        current_step: currentSystemConfig,
        timestamp: new Date().toISOString(),
      };

      // Generate human-readable description of which systems are combined
      let combineDesc = "";
      if (combineSystems) {
        if (activeSystemsArray.length === 4) {
          combineDesc = "Combine All";
        } else if (activeSystemsArray.length === 3) {
          combineDesc = `Combine ${activeSystemsArray.join(", ")}`;
        } else if (activeSystemsArray.length === 2) {
          combineDesc = `Combine ${activeSystemsArray[0]} & ${activeSystemsArray[1]}`;
        }
      }

      // Build individual database fields following sys1, sys2, sys3, sys4 pattern
      const dbFields: Record<string, any> = {
        ele_combine_positions: JSON.stringify(fullConfig), // Keep for backwards compatibility
        ele_combine_systems: combineSystems,
        ele_combine_active_systems: activeSystemsArray.join(","), // "1,2,3,4"
        ele_combine_system_desc: combineDesc || null, // Human-readable description
      };

      // Save individual landing destinations for each system
      activeSystemsArray.forEach((sysNum) => {
        const landing = systemLandings[`system${sysNum}`];
        if (landing) {
          dbFields[`sys${sysNum}_landing_destination`] = landing;
        }
      });

      await saveSystemDetails(projectUuid, dbFields);

      // logger.info("[Equipment] Configuration saved via button:", fullConfig);
    } catch (error) {
      logger.error("[Equipment] Error saving configuration:", error);
      Toast.show({
        text1: "Save Failed",
        text2: "Could not save configuration",
        type: "error",
        position: "bottom",
        visibilityTime: 2000,
      });
    }
  }, [
    projectUuid,
    combineSystems,
    systemLandings,
    activeSystemsArray,
    localSystemDetails,
    hasSubPanelB,
    subPanelBData,
    completedSystems,
    currentSystemConfig,
  ]);

  // Check if configuration is complete
  const configComplete = useMemo(() => {
    return (
      currentSystemConfig === 0 &&
      combineSystems === true &&
      isConfigurationComplete(activeSystemsArray, systemLandings)
    );
  }, [currentSystemConfig, combineSystems, activeSystemsArray, systemLandings]);

  // ============================================================================
  // BOS CONFIGURATION HANDLERS
  // ============================================================================

  /**
   * Handler for "Add Utility Required Equipment" button
   * Detects configuration and shows preview modal
   */
  const handleAddUtilityRequiredEquipment = async (systemNumber: 1 | 2 | 3 | 4) => {
    try {
      const detectionStartTime = Date.now();
      console.log('[PERF] BOS Detection started:', detectionStartTime);
      setBosDetectionLoading(true);

      console.log(`[Equipment] Detecting configuration for ALL systems (triggered from System ${systemNumber})...`);
      console.log(`[Equipment] Utility Requirements:`, utilityRequirements);
      console.log(`[Equipment] Project Utility:`, project?.site?.utility);

      // Build utility requirements object (use existing or fallback to project data)
      const effectiveUtilityRequirements = utilityRequirements || {
        utility_name: project?.site?.utility || 'Unknown',
        state: project?.site?.state,
        combination: '',
      };

      // Extract equipment state for ALL systems (for multi-system detection)
      console.log(`[Equipment] Extracting equipment state for all systems...`);
      const [system1Equipment, system2Equipment, system3Equipment, system4Equipment] = await Promise.all([
        extractEquipmentForSystem(
          localSystemDetails || {},
          1,
          effectiveUtilityRequirements
        ),
        extractEquipmentForSystem(
          localSystemDetails || {},
          2,
          effectiveUtilityRequirements
        ),
        extractEquipmentForSystem(
          localSystemDetails || {},
          3,
          effectiveUtilityRequirements
        ),
        extractEquipmentForSystem(
          localSystemDetails || {},
          4,
          effectiveUtilityRequirements
        ),
      ]);

      // Use multi-system detection (detects System 2 first, then applies to other systems if multi-system config found)
      const result = await universalSwitchboard.analyzeAllSystems({
        system1: system1Equipment || undefined,
        system2: system2Equipment || undefined,
        system3: system3Equipment || undefined,
        system4: system4Equipment || undefined,
      });

      const detectionEndTime = Date.now();
      console.log('[PERF] BOS Detection completed:', detectionEndTime);
      console.log('[PERF] Detection duration:', detectionEndTime - detectionStartTime, 'ms');

      console.log(`[Equipment] Multi-system analysis complete:`, {
        totalSystemsAnalyzed: result.totalSystemsAnalyzed,
        totalMatchesFound: result.totalMatchesFound,
        recommendations: result.recommendations,
        warnings: result.warnings,
      });

      // Collect ALL systems with detected configurations
      const allDetectedConfigs: ConfigurationMatch[] = [];

      // Check all 4 systems for matches
      if (result.bestMatches.system1) {
        console.log(`[Equipment] ✅ System 1 has configuration: ${result.bestMatches.system1.configName}`);
        allDetectedConfigs.push(result.bestMatches.system1);
      }
      if (result.bestMatches.system2) {
        console.log(`[Equipment] ✅ System 2 has configuration: ${result.bestMatches.system2.configName}`);
        allDetectedConfigs.push(result.bestMatches.system2);
      }
      if (result.bestMatches.system3) {
        console.log(`[Equipment] ✅ System 3 has configuration: ${result.bestMatches.system3.configName}`);
        allDetectedConfigs.push(result.bestMatches.system3);
      }
      if (result.bestMatches.system4) {
        console.log(`[Equipment] ✅ System 4 has configuration: ${result.bestMatches.system4.configName}`);
        allDetectedConfigs.push(result.bestMatches.system4);
      }

      console.log(`[Equipment] Total systems with configurations: ${allDetectedConfigs.length}`);

      // If no configurations found at all, show error
      if (allDetectedConfigs.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Configuration Match',
          text2: `No matching BOS configurations found for any system.`,
          visibilityTime: 4000,
        });
        setBosDetectionLoading(false);
        return;
      }

      // Check if systems should be combined (multi-system PV-only combination logic)
      if (allDetectedConfigs.length >= 2) {
        console.log('[Equipment] Multiple systems detected - checking for combination...');

        // Read combination status from ele_combine_positions JSON field
        let combineSystems = false;
        try {
          const eleCombinePositions = localSystemDetails?.ele_combine_positions;
          if (eleCombinePositions) {
            const combineConfig = typeof eleCombinePositions === 'string'
              ? JSON.parse(eleCombinePositions)
              : eleCombinePositions;
            combineSystems = combineConfig?.combine_systems === true;
            console.log('[Equipment] ele_combine_positions:', combineConfig);
          }
        } catch (error) {
          console.warn('[Equipment] Failed to parse ele_combine_positions:', error);
        }

        const hasCombination = combineSystems;

        // Check if all systems are PV-only (no batteries)
        const allPVOnly = allDetectedConfigs.every(config =>
          config.configName.includes('PV-Only') || config.requiredEquipment.batteryQuantity === 0
        );

        console.log('[Equipment] Combination check:', {
          hasCombination,
          combineSystems,
          allPVOnly,
          systemCount: allDetectedConfigs.length
        });

        // If combining multiple PV-only systems, check inverter new/existing status
        if (hasCombination && allPVOnly) {
          console.log('[Equipment] 🔗 Combining PV-only systems - checking inverter status...');

          // Check inverter new/existing status for each system
          const sys1Type = system1Equipment?.systemType;
          const sys2Type = system2Equipment?.systemType;

          const sys1IsNew = sys1Type === 'microinverter'
            ? system1Equipment?.microInverterIsNew
            : system1Equipment?.inverterIsNew;
          const sys2IsNew = sys2Type === 'microinverter'
            ? system2Equipment?.microInverterIsNew
            : system2Equipment?.inverterIsNew;

          const bothNew = sys1IsNew && sys2IsNew;

          console.log('[Equipment] Inverter status details:', {
            sys1Type,
            sys1InverterIsNew: system1Equipment?.inverterIsNew,
            sys1MicroInverterIsNew: system1Equipment?.microInverterIsNew,
            sys1IsNew,
            sys2Type,
            sys2InverterIsNew: system2Equipment?.inverterIsNew,
            sys2MicroInverterIsNew: system2Equipment?.microInverterIsNew,
            sys2IsNew,
            bothNew
          });

          let totalCombinedOutput = 0;

          if (bothNew) {
            // NEW/NEW: Both inverters are new - treat as one system split across two inverters
            // No precombine BOS needed, only postcombine meter + disconnect
            console.log('[Equipment] ⚡ Both inverters NEW - one system split across two inverters');
            console.log('[Equipment] → No precombine BOS needed');
            console.log('[Equipment] → Postcombine: Meter + Disconnect only');

            // Calculate combined output
            allDetectedConfigs.forEach((config) => {
              let systemEquipment = null;
              if (config.systemNumber === 1) systemEquipment = system1Equipment;
              else if (config.systemNumber === 2) systemEquipment = system2Equipment;
              else if (config.systemNumber === 3) systemEquipment = system3Equipment;
              else if (config.systemNumber === 4) systemEquipment = system4Equipment;

              const inverterOutput = systemEquipment?.inverterMaxContinuousOutput || 0;
              totalCombinedOutput += inverterOutput;

              // Remove ALL precombine BOS from each system
              config.bosEquipment = config.bosEquipment.filter(
                item => item.section !== 'utility'
              );
            });

            // Add shared postcombine BOS to FIRST config
            const combinedAmps = Math.ceil(totalCombinedOutput * 1.25);
            const combinedCalculation = `Combined: (${allDetectedConfigs.map(c => {
              const sysEquip = c.systemNumber === 1 ? system1Equipment :
                             c.systemNumber === 2 ? system2Equipment :
                             c.systemNumber === 3 ? system3Equipment : system4Equipment;
              return `${sysEquip?.inverterMaxContinuousOutput || 0}A`;
            }).join(' + ')}) × 1.25 = ${combinedAmps}A`;

            // Check if System Combiner Panel already exists in database (post_sms_bos_sys1_type1)
            const hasSystemCombinerPanel = !!(
              localSystemDetails?.post_sms_bos_sys1_type1_equipment_type ||
              localSystemDetails?.postcombine_1_1_equipment_type
            );

            let meterPosition = 1;
            let disconnectPosition = 2;

            if (hasSystemCombinerPanel) {
              // If System Combiner Panel exists (typically position 1), shift everything
              meterPosition = 2;
              disconnectPosition = 3;
              console.log(`[Equipment] System Combiner Panel detected in database - shifting positions`);
              console.log(`[Equipment] → post_sms_bos_sys1_type1_equipment_type: ${localSystemDetails?.post_sms_bos_sys1_type1_equipment_type}`);
            }

            console.log(`[Equipment] Adding postcombine: Meter (pos ${meterPosition}) + Disconnect (pos ${disconnectPosition}) (${combinedAmps}A)`);

            // Uni-Directional Meter
            allDetectedConfigs[0].bosEquipment.push({
              equipmentType: 'Uni-Directional Meter',
              ampRating: combinedAmps.toString(),
              isNew: true,
              position: meterPosition,
              section: 'combine',
              minAmpRating: combinedAmps,
              requiresUserSelection: false,
              sizingLabel: 'Combined System Output',
              sizingCalculation: combinedCalculation,
              sizingValue: combinedAmps,
            });

            // Utility Disconnect
            allDetectedConfigs[0].bosEquipment.push({
              equipmentType: 'Utility Disconnect',
              ampRating: combinedAmps.toString(),
              isNew: true,
              position: disconnectPosition,
              section: 'combine',
              minAmpRating: combinedAmps,
              requiresUserSelection: false,
              sizingLabel: 'Combined System Output',
              sizingCalculation: combinedCalculation,
              sizingValue: combinedAmps,
            });

          } else {
            // NEW/EXISTING or EXISTING/NEW: Traditional combination
            // 5 pieces total: Each system gets Meter + Line Side Disconnect (4 pieces) + shared Utility Disconnect (1 piece)
            console.log('[Equipment] 🔌 Mixed new/existing - traditional combination');
            console.log('[Equipment] → Each system: Uni-Directional Meter + Line Side Disconnect (precombine)');
            console.log('[Equipment] → Postcombine: Utility Disconnect');

            // Update each system's BOS
            allDetectedConfigs.forEach((config) => {
              // Find the system equipment to get inverter output
              let systemEquipment = null;
              if (config.systemNumber === 1) systemEquipment = system1Equipment;
              else if (config.systemNumber === 2) systemEquipment = system2Equipment;
              else if (config.systemNumber === 3) systemEquipment = system3Equipment;
              else if (config.systemNumber === 4) systemEquipment = system4Equipment;

              const inverterOutput = systemEquipment?.inverterMaxContinuousOutput || 0;
              totalCombinedOutput += inverterOutput;
              const requiredAmps = Math.ceil(inverterOutput * 1.25);

              // Remove ALL existing utility BOS (we'll rebuild it)
              config.bosEquipment = config.bosEquipment.filter(
                item => item.section !== 'utility'
              );

              // Add Uni-Directional Meter (position 1)
              console.log(`[Equipment] Adding Uni-Directional Meter to System ${config.systemNumber}`);
              config.bosEquipment.push({
                equipmentType: 'Uni-Directional Meter',
                ampRating: requiredAmps.toString(),
                isNew: true,
                position: 1,
                section: 'utility',
                systemPrefix: config.systemPrefix as any,
                minAmpRating: requiredAmps,
                requiresUserSelection: false,
                sizingLabel: `System ${config.systemNumber} Inverter Output`,
                sizingCalculation: `${inverterOutput}A × 1.25 = ${requiredAmps}A (PV-Only)`,
                sizingValue: requiredAmps,
              });

              // Add Line Side Disconnect (position 2)
              console.log(`[Equipment] Adding Line Side Disconnect to System ${config.systemNumber}`);
              config.bosEquipment.push({
                equipmentType: 'Uni-Directional Meter Line Side Disconnect',
                ampRating: requiredAmps.toString(),
                isNew: true,
                position: 2,
                section: 'utility',
                systemPrefix: config.systemPrefix as any,
                minAmpRating: requiredAmps,
                requiresUserSelection: false,
                sizingLabel: `System ${config.systemNumber} Inverter Output`,
                sizingCalculation: `${inverterOutput}A × 1.25 = ${requiredAmps}A (PV-Only)`,
                sizingValue: requiredAmps,
              });
            });

            // Add ONE shared postcombine Utility Disconnect
            // Check if System Combiner Panel already exists in database (post_sms_bos_sys1_type1)
            const hasSystemCombinerPanel = !!(
              localSystemDetails?.post_sms_bos_sys1_type1_equipment_type ||
              localSystemDetails?.postcombine_1_1_equipment_type
            );

            const utilityDisconnectPosition = hasSystemCombinerPanel ? 2 : 1;
            console.log(`[Equipment] System Combiner Panel in database: ${hasSystemCombinerPanel}`);
            console.log(`[Equipment] → post_sms_bos_sys1_type1_equipment_type: ${localSystemDetails?.post_sms_bos_sys1_type1_equipment_type}`);
            console.log(`[Equipment] → postcombine_1_1_equipment_type: ${localSystemDetails?.postcombine_1_1_equipment_type}`);
            console.log(`[Equipment] Utility Disconnect will be in postcombine slot ${utilityDisconnectPosition}`);

            const combinedAmps = Math.ceil(totalCombinedOutput * 1.25);
            const combinedCalculation = `Combined: (${allDetectedConfigs.map(c => {
              const sysEquip = c.systemNumber === 1 ? system1Equipment :
                             c.systemNumber === 2 ? system2Equipment :
                             c.systemNumber === 3 ? system3Equipment : system4Equipment;
              return `${sysEquip?.inverterMaxContinuousOutput || 0}A`;
            }).join(' + ')}) × 1.25 = ${combinedAmps}A`;

            console.log(`[Equipment] Adding shared postcombine Utility Disconnect: ${combinedAmps}A at position ${utilityDisconnectPosition}`);

            allDetectedConfigs[0].bosEquipment.push({
              equipmentType: 'Utility Disconnect',
              ampRating: combinedAmps.toString(),
              isNew: true,
              position: utilityDisconnectPosition,
              section: 'combine',
              minAmpRating: combinedAmps,
              requiresUserSelection: false,
              sizingLabel: 'Combined System Output',
              sizingCalculation: combinedCalculation,
              sizingValue: combinedAmps,
            });
          }
        }
      }

      // Show recommendations if any
      if (result.recommendations.length > 0) {
        console.log(`[Equipment] Recommendations:`, result.recommendations);
      }

      // Set detected configurations and show modal
      // If multiple systems, modal will show all; if single system, it shows just that one
      setDetectedConfigurations(allDetectedConfigs);
      setDetectedConfiguration(allDetectedConfigs[0]); // Keep for backward compatibility
      setShowBOSConfigModal(true);
      setBosDetectionLoading(false);
    } catch (error: any) {
      console.error('[Equipment] Error detecting configuration:', error);
      Toast.show({
        type: 'error',
        text1: 'Detection Error',
        text2: error.message || 'Failed to detect configuration',
      });
      setBosDetectionLoading(false);
    }
  };

  /**
   * Handler for "Yes" button in BOS Configuration Modal
   * Auto-populates BOS equipment for ALL detected configurations
   */
  const handleBOSConfigYes = async () => {
    const startTime = Date.now();
    console.log('[PERF] BOS Auto-population started:', startTime);
    console.log('[Equipment] ========== YES BUTTON CLICKED! ==========');
    console.log('[Equipment] detectedConfigurations:', detectedConfigurations);
    console.log('[Equipment] Total configurations to apply:', detectedConfigurations.length);
    console.log('[Equipment] project.uuid:', project?.uuid);

    if (detectedConfigurations.length === 0 || !project?.uuid) {
      console.log('[Equipment] ❌ Missing required data, returning early');
      const missingData = [];
      if (detectedConfigurations.length === 0) missingData.push('configurations');
      if (!project?.uuid) missingData.push('project UUID');

      Toast.show({
        type: 'error',
        text1: 'Cannot Add BOS Equipment',
        text2: `Missing required data: ${missingData.join(', ')}`,
      });
      return;
    }

    // SAFETY PATCH: Prevent concurrent BOS operations
    if (bosOperationInProgress.current) {
      console.log('[Equipment] ⚠️  BOS operation already in progress, ignoring request');
      Toast.show({
        type: 'info',
        text1: 'Operation in Progress',
        text2: 'Please wait for the current operation to complete',
      });
      return;
    }

    console.log('[Equipment] ✅ Proceeding with BOS auto-population...');

    // Mark operation as in-progress
    bosOperationInProgress.current = true;

    // SAFETY PATCH: Cleanup flag to prevent state updates after unmount
    let isMounted = true;

    try {
      setShowBOSConfigModal(false);

      // Show loading overlay to hide rendering flash
      if (isMounted) {
        setLoadingOverlay({
          visible: true,
          message: `Adding BOS Equipment for ${detectedConfigurations.length} system(s)...`,
          submessage: 'This may take a moment'
        });
      }

      // Auto-populate BOS equipment for ALL detected configurations
      const populateStartTime = Date.now();
      console.log('[PERF] BOS population service call started:', populateStartTime);
      console.log('[AUTO-BOS-DEBUG] ========================================');
      console.log('[AUTO-BOS-DEBUG] STARTING BOS AUTO-POPULATION');
      console.log('[AUTO-BOS-DEBUG] Processing', detectedConfigurations.length, 'system(s)');
      console.log('[AUTO-BOS-DEBUG] ========================================');

      const results = [];
      let hasCombineBOS = false;

      // Loop through all detected configurations and apply BOS to each
      for (const config of detectedConfigurations) {
        console.log('[AUTO-BOS-DEBUG] ----------------------------------------');
        console.log('[AUTO-BOS-DEBUG] Processing System', config.systemNumber);
        console.log('[AUTO-BOS-DEBUG] Project UUID:', project.uuid);
        console.log('[AUTO-BOS-DEBUG] System Prefix:', config.systemPrefix);
        console.log('[AUTO-BOS-DEBUG] System Number:', config.systemNumber);
        console.log('[AUTO-BOS-DEBUG] Configuration:', config.configName);

        const result = await BOSAutoPopulationService.autoPopulate({
          projectUuid: project.uuid,
          companyUuid, // For preferred equipment filtering
          systemPrefix: config.systemPrefix as any,
          systemNumber: config.systemNumber,
          configurationMatch: config,
          autoSelectWhenPossible: true,
          skipExisting: true,
        });

        results.push(result);

        // Check if this config has combine BOS
        if (config.bosEquipment.some((item) => item.section === 'combine')) {
          hasCombineBOS = true;
        }

        console.log('[AUTO-BOS-DEBUG] System', config.systemNumber, 'result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
      }

      const populateEndTime = Date.now();
      console.log('[PERF] BOS population service completed:', populateEndTime);
      console.log('[PERF] Population duration:', populateEndTime - populateStartTime, 'ms');

      // Check if all operations succeeded
      const allSuccess = results.every(r => r && r.success);
      const totalAdded = results.reduce((sum, r) => sum + (r?.addedEquipment?.length || 0), 0);

      console.log('[AUTO-BOS-DEBUG] ========================================');
      console.log('[AUTO-BOS-DEBUG] AUTO-POPULATION RESULTS SUMMARY');
      console.log('[AUTO-BOS-DEBUG] ========================================');
      console.log('[AUTO-BOS-DEBUG] Systems Processed:', results.length);
      console.log('[AUTO-BOS-DEBUG] All Successful:', allSuccess);
      console.log('[AUTO-BOS-DEBUG] Total Equipment Added:', totalAdded);
      console.log('[AUTO-BOS-DEBUG] Has Combine BOS:', hasCombineBOS);

      if (allSuccess) {
        // Auto-enable Combine Systems section if combine BOS was added
        if (hasCombineBOS && isMounted) {
          console.log('[AUTO-BOS-DEBUG] Combine BOS detected - auto-enabling Combine Systems section');
          setCombineSystems(true);
          setShowCombineBOS(true);
        }

        Toast.show({
          type: 'success',
          text1: 'BOS Equipment Added',
          text2: `Successfully added equipment for ${results.length} system(s). Total: ${totalAdded} item(s).`,
        });

        // Clear session cache to force fresh data load on next screen
        if (project?.uuid) {
          console.log('[AUTO-BOS-DEBUG] ========================================');
          console.log('[AUTO-BOS-DEBUG] CLEARING SESSION CACHE');
          console.log('[AUTO-BOS-DEBUG] ========================================');
          clearProjectSnapshots(project.uuid);
          console.log('[AUTO-BOS-DEBUG] Session cache cleared');
        }

        // Wait for database to commit (increased from 500ms for consistency)
        console.log('[AUTO-BOS-DEBUG] Waiting 800ms for database commit...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Refresh system details to show new BOS equipment
        if (project?.uuid) {
          console.log('[AUTO-BOS-DEBUG] ========================================');
          console.log('[AUTO-BOS-DEBUG] FETCHING FRESH SYSTEM DETAILS');
          console.log('[AUTO-BOS-DEBUG] ========================================');
          const freshDetails = await fetchSystemDetails(project.uuid);

          // SAFETY PATCH: Null check on fresh details
          if (!freshDetails) {
            console.error('[AUTO-BOS-DEBUG] ❌ No fresh details returned from fetchSystemDetails');
            throw new Error('Failed to fetch updated system details after BOS population. The equipment may have been added but the display could not be refreshed. Please reload the screen.');
          }

          console.log('[AUTO-BOS-DEBUG] Fresh details received, keys:', Object.keys(freshDetails).length);

          // Log ALL BOS trigger fields (all 6 that were saved)
          console.log('[AUTO-BOS-DEBUG] ========================================');
          console.log('[AUTO-BOS-DEBUG] CHECKING ALL TRIGGER FIELDS IN FRESH DATA');
          console.log('[AUTO-BOS-DEBUG] ========================================');

          // Utility BOS (2 sections)
          console.log('[AUTO-BOS-DEBUG] === UTILITY BOS ===');
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type1_trigger:', freshDetails?.bos_sys1_type1_trigger);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type1_active:', freshDetails?.bos_sys1_type1_active);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type1_equipment_type:', freshDetails?.bos_sys1_type1_equipment_type);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type2_trigger:', freshDetails?.bos_sys1_type2_trigger);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type2_active:', freshDetails?.bos_sys1_type2_active);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_type2_equipment_type:', freshDetails?.bos_sys1_type2_equipment_type);

          // Battery BOS (3 sections)
          console.log('[AUTO-BOS-DEBUG] === BATTERY BOS ===');
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type1_trigger:', freshDetails?.bos_sys1_battery1_type1_trigger);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type1_equipment_type:', freshDetails?.bos_sys1_battery1_type1_equipment_type);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type2_trigger:', freshDetails?.bos_sys1_battery1_type2_trigger);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type2_equipment_type:', freshDetails?.bos_sys1_battery1_type2_equipment_type);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type3_trigger:', freshDetails?.bos_sys1_battery1_type3_trigger);
          console.log('[AUTO-BOS-DEBUG] bos_sys1_battery1_type3_equipment_type:', freshDetails?.bos_sys1_battery1_type3_equipment_type);

          // Post-SMS BOS (1 section)
          console.log('[AUTO-BOS-DEBUG] === POST-SMS BOS ===');
          console.log('[AUTO-BOS-DEBUG] post_sms_bos_sys1_type1_trigger:', freshDetails?.post_sms_bos_sys1_type1_trigger);
          console.log('[AUTO-BOS-DEBUG] post_sms_bos_sys1_type1_active:', freshDetails?.post_sms_bos_sys1_type1_active);
          console.log('[AUTO-BOS-DEBUG] post_sms_bos_sys1_type1_equipment_type:', freshDetails?.post_sms_bos_sys1_type1_equipment_type);

          // Batch state updates using requestAnimationFrame to prevent cascading re-renders
          if (isMounted) {
            requestAnimationFrame(() => {
              if (isMounted) {
                setLocalSystemDetails(freshDetails);
                dispatch(setUpdateProjectDetails({
                  ...project,
                  systemDetails: freshDetails,
                }));
              }
            });
          }

          // Wait for render to complete before triggering refresh
          await new Promise(resolve => setTimeout(resolve, 100));
          if (isMounted) {
            dispatch(triggerDataRefresh());
          }

          // Wait for BOS sections to stabilize before hiding overlay
          await new Promise(resolve => setTimeout(resolve, 300));
          if (isMounted) {
            setLoadingOverlay({ visible: false });
          }

          const endTime = Date.now();
          console.log('[PERF] BOS Auto-population completed:', endTime);
          console.log('[PERF] Total duration:', endTime - startTime, 'ms');
          console.log('[PERF] Breakdown: Population=' + (populateEndTime - populateStartTime) + 'ms, Rendering=' + (endTime - populateEndTime) + 'ms');

          console.log('[AUTO-BOS-DEBUG] ========================================');
          console.log('[AUTO-BOS-DEBUG] STATE UPDATE COMPLETE');
          console.log('[AUTO-BOS-DEBUG] ========================================');
          console.log('[AUTO-BOS-DEBUG] Local system details state updated with fresh data');
          console.log('[AUTO-BOS-DEBUG] Redux store updated with fresh data');
          console.log('[AUTO-BOS-DEBUG] Data refresh triggered - hooks should reload');
          console.log('[AUTO-BOS-DEBUG] BOS sections should now be visible on screen');
          console.log('[AUTO-BOS-DEBUG] Please scroll down to verify sections are rendering');
        }

        if (isMounted) {
          Toast.show({
            type: 'success',
            text1: 'BOS Equipment Added',
            text2: result.message,
          });
        }
      } else {
        if (isMounted) {
          setLoadingOverlay({ visible: false });
          Toast.show({
            type: 'error',
            text1: 'Failed to Add BOS',
            text2: result.message,
          });
        }
      }

      if (isMounted) {
        setDetectedConfiguration(null);
      }
    } catch (error: any) {
      if (isMounted) {
        setLoadingOverlay({ visible: false });
      }
      console.error('[Equipment] Error adding BOS:', error);
      console.error('[Equipment] Error stack:', error.stack);

      // SAFETY PATCH: Better error messages with context
      if (isMounted) {
        let errorMessage = 'Failed to add BOS equipment';
        let errorDetail = error.message || 'An unexpected error occurred';

        // Provide more specific error messages based on error type
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Network Error';
          errorDetail = 'Could not connect to server. Please check your internet connection and try again.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Request Timeout';
          errorDetail = 'The operation took too long. Please try again.';
        } else if (error.message?.includes('session') || error.message?.includes('auth')) {
          errorMessage = 'Authentication Error';
          errorDetail = 'Your session may have expired. Please log in again.';
        } else if (error.message?.includes('no result')) {
          errorMessage = 'Service Error';
          errorDetail = 'The BOS population service failed. Please try again.';
        }

        Toast.show({
          type: 'error',
          text1: errorMessage,
          text2: errorDetail,
          visibilityTime: 5000, // Show for 5 seconds for error messages
        });
      }
    } finally {
      // Cleanup: Mark component as unmounted to prevent further state updates
      isMounted = false;
      // Reset operation-in-progress flag
      bosOperationInProgress.current = false;
    }
  };

  /**
   * Handler for "No" button in BOS Configuration Modal
   * Simply dismisses the modal
   */
  const handleBOSConfigNo = () => {
    setShowBOSConfigModal(false);
    setDetectedConfiguration(null);
  };

  return (
    <LinearGradient {...BLUE_MD_TB} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          title="Equipment"
          name={
            project?.details?.customer_last_name &&
            project?.details?.customer_first_name
              ? `${project.details.customer_last_name}, ${project.details.customer_first_name}`
              : undefined
          }
          addressLines={
            project?.site
              ? [
                  project.site.address || "",
                  [project.site.city, project.site.state, project.site.zip_code]
                    .filter(Boolean)
                    .join(", "),
                ]
              : undefined
          }
          projectId={project?.details?.installer_project_id}
          onDrawerPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          {...commonScrollViewProps}
          removeClippedSubviews={true}
        >
          <View style={styles.inner}>
            <View style={styles.buttonsContainer}>
              {/* Conditional System Buttons/Cards for Systems 1-4 */}
              {systems
                .filter((label) => label.startsWith("System"))
                .map((systemLabel) => {
                  const displayState = systemDisplayStates[systemLabel];
                  if (!displayState?.show) return null;

                  const systemMatch = systemLabel.match(/System (\d+)/);
                  const systemNumber = systemMatch
                    ? parseInt(systemMatch[1])
                    : 1;
                  const hasData = !!computedActive[systemLabel];

                  // If no data, show simple SystemButton with "+ Add System X"
                  // If has data, show detailed EquipmentCard
                  return (
                    <React.Fragment key={systemLabel}>
                      {hasData ? (
                        <>
                          <EquipmentCard
                            systemNumber={systemNumber}
                            systemData={localSystemDetails || {}}
                            isConfigured={completedSystems.includes(systemNumber)}
                            isActive={true}
                            isDeactivated={false}
                            onPress={() => handleSystemPress(systemLabel)}
                            onEdit={() => handleSystemPress(systemLabel)}
                            utilityRequirements={utilityRequirements}
                          />
                        </>
                      ) : (
                        <SystemButton
                          label={displayState.label} // "Add System 2", "Add System 3", etc.
                          active={false}
                          deactivated={false} // Clickable with orange border
                          onPress={() => handleSystemPress(systemLabel)}
                          style={{ width: "100%" }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

              {/* Add Utility Required Equipment Button - Single button for all systems */}
              {(() => {
                // Show button when at least one system has data (is active/configured)
                const hasAnyConfiguredSystem = Object.keys(computedActive).some(key =>
                  key.startsWith("System") && computedActive[key]
                );

                if (!hasAnyConfiguredSystem) return null;

                return (
                  <SystemButton
                    label={bosDetectionLoading ? "Detecting..." : "Add Utility Required Equipment"}
                    active={false}
                    deactivated={false}
                    onPress={() => {
                      // Find first configured system
                      const firstActiveSystem = Object.keys(computedActive)
                        .find(key => key.startsWith("System") && computedActive[key]);
                      if (firstActiveSystem) {
                        const systemNumber = parseInt(firstActiveSystem.replace('System ', '')) as 1 | 2 | 3 | 4;
                        handleAddUtilityRequiredEquipment(systemNumber);
                      }
                    }}
                    disabled={bosDetectionLoading}
                    style={{ width: "100%", marginBottom: moderateScale(16) }}
                  />
                );
              })()}

              {/* Show Combine Buttons after last available system */}
              {(() => {
                const sys2HasData = computedActive["System 2"];
                const sys3HasData = computedActive["System 3"];
                const sys4Visible = systemDisplayStates["System 4"]?.show;

                if (!sys2HasData) return null;

                return (
                  <>
                    <Text style={styles.selectLabel}>Select Combination Method</Text>
                    <View style={styles.combineButtonsRow}>
                      <Button
                        title="Combine Systems"
                        selected={combineSystems === true}
                        onPress={() => handleCombineSystemsClick(true)}
                        width="48%"
                        height={BUTTON_HEIGHT}
                        rounded={moderateScale(8)}
                        textStyle={styles.combineButtonText}
                      />
                      <Button
                        title="Do Not Combine"
                        selected={combineSystems === false}
                        onPress={() => handleCombineSystemsClick(false)}
                        width="48%"
                        height={BUTTON_HEIGHT}
                        rounded={moderateScale(8)}
                        textStyle={styles.combineButtonText}
                      />
                    </View>

                    {/* Configuration Summary - show what they selected */}
                    {combineSystems === true &&
                      Object.keys(systemLandings).length > 0 && (
                        <View style={styles.configurationSummary}>
                          <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTitle}>
                              System Configuration
                            </Text>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => {
                                // Reset to first system to allow editing
                                setCurrentSystemConfig(activeSystemsArray[0]);
                                setCompletedSystems([]);
                              }}
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                            >
                              <Image
                                source={require("../../assets/Images/icons/pencil_icon_white.png")}
                                style={styles.editIcon}
                                resizeMode="contain"
                              />
                            </TouchableOpacity>
                          </View>
                          {activeSystemsArray.map((sysNum) => {
                            const landing = systemLandings[`system${sysNum}`];
                            if (!landing) return null;

                            return (
                              <View
                                key={`summary-${sysNum}`}
                                style={styles.summaryRow}
                              >
                                <Text style={styles.summaryLabel}>
                                  System {sysNum}:
                                </Text>
                                <Text style={styles.summaryValue}>
                                  {landing}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                  </>
                );
              })()}

              {/* Progressive Landing Configuration Flow */}
              {combineSystems === true && currentSystemConfig > 0 && (
                <View style={styles.progressiveConfigContainer}>
                  {/* Progress Indicator */}
                  <ProgressIndicator
                    currentStep={
                      activeSystemsArray.indexOf(currentSystemConfig) + 1
                    }
                    totalSteps={activeSystemsArray.length}
                    completedSystems={completedSystems}
                    activeSystems={activeSystemsArray}
                  />

                  {/* Current System Configuration */}
                  <Text style={styles.questionText}>
                    Where are you landing System {currentSystemConfig}?
                  </Text>

                  {/* Landing Options */}
                  {getLandingOptions(
                    currentSystemConfig,
                    activeSystemsArray,
                    localSystemDetails || {},
                    systemLandings,
                    hasSubPanelB
                  ).map((option) => (
                    <LandingOptionButton
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      highlighted={option.highlight}
                      selected={
                        systemLandings[`system${currentSystemConfig}`] ===
                        option.value
                      }
                      onPress={() =>
                        handleLandingSelection(
                          currentSystemConfig,
                          option.value
                        )
                      }
                    />
                  ))}
                </View>
              )}

              {/* Combined System BOS Section */}
              {combineSystems === true &&
                Object.keys(systemLandings).length > 0 && (
                  <View style={styles.combinedBOSSection}>
                    {/* Show System Combiner Panel if "Combiner Panel" is selected in any landing */}
                    {Object.values(systemLandings).some((landing) =>
                      landing?.includes("Combiner Panel")
                    ) && (() => {
                      // Add divider before System Combiner Panel section
                      const showDivider = true;
                      const isDirty = !!(
                        systemCombinerPanel.selectedMake ||
                        systemCombinerPanel.selectedModel ||
                        systemCombinerPanel.selectedBusAmps ||
                        (systemCombinerPanel.selectedMainBreaker && systemCombinerPanel.selectedMainBreaker !== "mlo")
                      );
                      const isRequiredComplete = !!(
                        systemCombinerPanel.selectedMake &&
                        systemCombinerPanel.selectedModel &&
                        systemCombinerPanel.selectedBusAmps &&
                        systemCombinerPanel.selectedMainBreaker
                      );

                      return (
                        <>
                          {/* Divider before System Combiner Panel */}
                          <View style={styles.combinedBOSHeader}>
                            <LinearGradient
                              colors={["#FD7332", "#B92011"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.combinedBOSDivider}
                            />
                          </View>

                          {!isDirty && !combinerPanelExpanded ? (
                            // Show button when no data has been added and not expanded
                            <SystemButton
                              label="System Combiner Panel"
                              active={false}
                              onPress={() => {
                                setCombinerPanelExpanded(true);
                              }}
                              style={{
                                width: "100%",
                                marginBottom: moderateScale(8),
                              }}
                            />
                          ) : (
                            // Use new SystemCombinerPanelSection component
                            <SystemCombinerPanelSection
                              values={systemCombinerPanel}
                              onChange={(field, value) => {
                                setSystemCombinerPanel((prev) => ({ ...prev, [field]: value }));
                              }}
                              errors={{}}
                              label="System Combiner Panel"
                              makes={combinerPanelMakes}
                              models={combinerPanelModels}
                              loadMakes={loadCombinerPanelMakes}
                              loadModels={loadCombinerPanelModels}
                              loadingMakes={loadingCombinerPanelMakes}
                              loadingModels={loadingCombinerPanelModels}
                              onClear={async () => {
                                // Clear database fields (both dedicated fields and system-specific BOS)
                                await saveSystemDetails(projectUuid!, {
                                  system_combiner_panel_1_make: null,
                                  system_combiner_panel_1_model: null,
                                  system_combiner_panel_1_amp_rating: null,
                                  system_combiner_panel_1_main_breaker: null,
                                  system_combiner1_id: null,
                                  // Also clear system-specific BOS Type 1 slot
                                  post_sms_bos_sys1_type1_equipment_type: null,
                                  post_sms_bos_sys1_type1_make: null,
                                  post_sms_bos_sys1_type1_model: null,
                                  post_sms_bos_sys1_type1_amp_rating: null,
                                  post_sms_bos_sys1_type1_existing: null,
                                });
                                logger.debug("[Equipment] System Combiner Panel cleared successfully");
                              }}
                            />
                          )}
                        </>
                      );
                    })()}

                    {/* Combine BOS Types - render as siblings, not nested */}
                    {(() => {
                      // Check if System Combiner Panel exists
                      const hasCombinerPanel = !!(
                        systemCombinerPanel.selectedMake ||
                        systemCombinerPanel.selectedModel
                      );

                      // Check if System Combiner Panel is also showing as CollapsibleSection
                      const combinerPanelIsDirty = !!(
                        systemCombinerPanel.selectedMake ||
                        systemCombinerPanel.selectedModel ||
                        systemCombinerPanel.selectedBusAmps ||
                        (systemCombinerPanel.selectedMainBreaker && systemCombinerPanel.selectedMainBreaker !== "mlo")
                      );
                      const showCombinerPanel = Object.values(systemLandings).some((landing) =>
                        landing?.includes("Combiner Panel")
                      );
                      const combinerPanelIsCollapsible = showCombinerPanel && (combinerPanelIsDirty || combinerPanelExpanded);

                      // Calculate target slots based on combiner panel presence
                      // If combiner exists: Type 1 → slot 2, Type 2 → slot 3, Type 3 → not available
                      // If no combiner: Type 1 → slot 1, Type 2 → slot 2, Type 3 → slot 3
                      const type1Slot = hasCombinerPanel ? 2 : 1;
                      const type2Slot = hasCombinerPanel ? 3 : 2;
                      const type3Slot = 3;

                      // Check if each type has data
                      const type1HasData = !!(
                        bosType1Data.equipmentType ||
                        bosType1Data.ampRating ||
                        bosType1Data.make ||
                        bosType1Data.model
                      );

                      const type2HasData = !!(
                        bosType2Data.equipmentType ||
                        bosType2Data.ampRating ||
                        bosType2Data.make ||
                        bosType2Data.model
                      );

                      const type3HasData = !!(
                        bosType3Data.equipmentType ||
                        bosType3Data.ampRating ||
                        bosType3Data.make ||
                        bosType3Data.model
                      );

                      // Show Type 2 when: user clicked button OR Type 2 has data
                      const shouldShowType2 = showBosType2 || type2HasData;
                      // Show Type 3 when: user clicked button OR Type 3 has data (AND no combiner panel)
                      const shouldShowType3 = !hasCombinerPanel && (showBosType3 || type3HasData);

                      return (
                        <>
                          {/* Combined System Max Output Display */}
                          {combinedMaxOutput !== null && (
                            <View style={styles.combinedMaxOutputContainer}>
                              <Text style={styles.combinedMaxOutputLabel}>
                                Combined System Max Output
                              </Text>
                              <Text style={styles.combinedMaxOutputValue}>
                                {combinedMaxOutput} A
                              </Text>
                            </View>
                          )}

                          {/* Type 1 - always show */}
                          <CombineBOSTypeSection
                            typeNumber={1}
                            targetSlot={type1Slot as 1 | 2 | 3}
                            projectUuid={projectUuid!}
                            data={bosType1Data}
                            onDataChange={setBosType1Data}
                            hasPreviousType={combinerPanelIsCollapsible}
                            showNextTypeButton={!shouldShowType2}
                            onNextTypePress={() => {
                              setShowBosType2(true);
                              setAutoExpandType2(true);
                            }}
                            utilityAbbrev={project?.site?.utility}
                          />

                          {/* Type 2 - show when user clicked to add it or it has data */}
                          {shouldShowType2 && (
                            <CombineBOSTypeSection
                              typeNumber={2}
                              targetSlot={type2Slot as 1 | 2 | 3}
                              projectUuid={projectUuid!}
                              data={bosType2Data}
                              onDataChange={setBosType2Data}
                              hasPreviousType={type1HasData || combinerPanelIsCollapsible}
                              showNextTypeButton={!shouldShowType3}
                              onNextTypePress={() => {
                                setShowBosType3(true);
                                setAutoExpandType3(true);
                              }}
                              forceInitialExpand={autoExpandType2}
                              onClear={() => {
                                setShowBosType2(false);
                                setAutoExpandType2(false);
                              }}
                              utilityAbbrev={project?.site?.utility}
                            />
                          )}

                          {/* Type 3 - show when user clicked to add it or it has data (NOT available when combiner panel exists) */}
                          {shouldShowType3 && (
                            <CombineBOSTypeSection
                              typeNumber={3}
                              targetSlot={type3Slot as 1 | 2 | 3}
                              projectUuid={projectUuid!}
                              data={bosType3Data}
                              onDataChange={setBosType3Data}
                              hasPreviousType={type2HasData || type1HasData || combinerPanelIsCollapsible}
                              showNextTypeButton={false}
                              forceInitialExpand={autoExpandType3}
                              onClear={() => {
                                setShowBosType3(false);
                                setAutoExpandType3(false);
                              }}
                              utilityAbbrev={project?.site?.utility}
                            />
                          )}
                        </>
                      );
                    })()}

                  </View>
                )}

              {/* Configuration Complete Overview */}
              {/* Temporarily disabled - diagram needs more development */}
              {/* {configComplete && (
                <ElectricalDiagramOverview
                  systemLandings={systemLandings}
                  activeSystems={activeSystemsArray}
                  connections={
                    generateConfigurationData(
                      true,
                      systemLandings,
                      activeSystemsArray,
                      localSystemDetails || {},
                      hasSubPanelB,
                      subPanelBData
                    ).connections
                  }
                  systemData={localSystemDetails || {}}
                  onSave={handleConfigurationSave}
                  configData={generateConfigurationData(
                    true,
                    systemLandings,
                    activeSystemsArray,
                    localSystemDetails || {},
                    hasSubPanelB,
                    subPanelBData
                  )}
                />
              )} */}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* BOS Configuration Preview Modal */}
      <BOSConfigurationPreviewModal
        visible={showBOSConfigModal}
        configurationMatch={detectedConfiguration}
        configurationMatches={detectedConfigurations} // Pass all configurations for multi-system display
        onYes={handleBOSConfigYes}
        onNo={handleBOSConfigNo}
      />

      {/* Loading overlay for BOS auto-population */}
      <LoadingOverlay
        visible={loadingOverlay.visible}
        message={loadingOverlay.message}
        submessage={loadingOverlay.submessage}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: Dimensions.get("window").height * 0.05,
    ...SCROLL_PADDING.withTabBar,
  },
  inner: { flex: 1 },
  buttonsContainer: {
    width: "100%",
    gap: moderateScale(12),
  },
  selectLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(24),
    fontWeight: "600",
    marginTop: 0,
    marginBottom: moderateScale(8),
  },
  combineButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: moderateScale(12),
  },
  combineButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  combineMethodContainer: {
    width: "100%",
    marginTop: moderateScale(12),
    marginBottom: moderateScale(5),
  },
  combineMethodLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "500",
    marginBottom: moderateScale(0),
  },
  progressiveConfigContainer: {
    width: "100%",
    marginTop: 0,
    marginBottom: moderateScale(16),
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: moderateScale(22),
    fontWeight: "700",
    marginBottom: moderateScale(16),
    textAlign: "center",
  },
  configurationSummary: {
    width: "100%",
    marginTop: 0,
    marginBottom: moderateScale(8),
    backgroundColor: "rgba(12, 31, 63, 0.5)",
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    borderColor: "rgba(253, 115, 50, 0.3)",
    padding: moderateScale(16),
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(12),
    position: "relative",
  },
  summaryTitle: {
    color: "#FD7332",
    fontSize: moderateScale(18),
    fontWeight: "700",
    textAlign: "center",
  },
  editButton: {
    position: "absolute",
    right: 0,
    padding: moderateScale(4),
  },
  editIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: "#FD7332",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
    paddingBottom: moderateScale(8),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
    flex: 0,
    minWidth: moderateScale(90),
  },
  summaryValue: {
    color: "#D1D5DB",
    fontSize: moderateScale(16),
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  combinedBOSSection: {
    width: "100%",
    marginTop: 0,
  },
  combinedBOSHeader: {
    width: "100%",
    position: "relative",
    paddingBottom: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  combinedBOSDivider: {
    height: 2,
    position: "absolute",
    left: moderateScale(-20),
    right: moderateScale(-20),
    bottom: 0,
  },
  combinerPanelInputs: {
    width: "100%",
    backgroundColor: "rgba(12, 31, 63, 0.5)",
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    borderColor: "rgba(253, 115, 50, 0.3)",
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  combinerFieldRow: {
    width: moderateScale(160),
    marginBottom: moderateScale(8),
  },
  bosType1Inputs: {
    width: "100%",
    backgroundColor: "rgba(12, 31, 63, 0.5)",
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    borderColor: "rgba(253, 115, 50, 0.3)",
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  collapsibleContent: {
    width: "100%",
  },
  collapsibleSectionWrapper: {
    marginTop: moderateScale(-10),
  },
  collapsibleSectionWithSpacing: {
    marginTop: moderateScale(2),
  },
  combinedMaxOutputContainer: {
    backgroundColor: "rgba(253, 115, 50, 0.15)",
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    borderColor: "rgba(253, 115, 50, 0.5)",
    padding: moderateScale(12),
    marginBottom: moderateScale(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  combinedMaxOutputLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  combinedMaxOutputValue: {
    color: "#FD7332",
    fontSize: moderateScale(20),
    fontWeight: "700",
  },
});

export default Equipment;
