import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import { toast } from "react-toastify";
import axios from "../../config/axios";
import logger from "../../services/devLogger";
import { useSystemDetails } from "../../hooks";
import { calculatePanelsRemaining } from "../../utils/stringingUtils";
import SolarPanelSection from "./equipment/SolarPanelSection";
import SolarPanel2Section from "./equipment/SolarPanel2Section";
import InverterMicroSection from "./equipment/InverterMicroSection";
// import InverterStringingSection from './equipment/InverterStringingSection'; // MOVED INTO InverterMicroSection
import StringCombinerPanelSection from "./equipment/StringCombinerPanelSection";
// import MicroinverterStringingSection from './equipment/MicroinverterStringingSection'; // MOVED INTO InverterMicroSection
import EnergyStorageSection from "./equipment/EnergyStorageSection";
import IQCombiner6CConfigSection from "./equipment/IQCombiner6CConfigSection";
import StorageManagementSystemSection from "./equipment/StorageManagementSystemSection";
import BatteryTypeSection from "./equipment/BatteryTypeSection";
import IQMeterCollarSection from "./equipment/IQMeterCollarSection";
import BatteryCombinerPanelSection from "./equipment/storage/BatteryCombinerPanelSection";
import BOSEquipmentSection from "./equipment/BOSEquipmentSection";
import PostCombineBOSSection from "./equipment/PostCombineBOSSection";
import CombineSystemsForm from "./equipment/CombineSystemsForm";
import BOSPanel from "./equipment/BOSPanel";
import SystemContainer from "./equipment/SystemContainer";
import FormNavigationFooter from "./FormNavigationFooter";
import ConfirmDialog from "../ui/ConfirmDialog";
import EquipmentValidationModal from "../modals/EquipmentValidationModal";
import POIPromptModal from "../modals/POIPromptModal";
import {
  AddSectionButton,
  AddButton,
  Alert,
  TableRowButton,
} from "../ui";
import { detectProjectConfiguration } from "../../utils/bosConfigurationSwitchboard";
import {
  prepareBOSPopulation,
  saveBOSPopulation,
} from "../../services/bosAutoPopulationService";
import { patchSystemDetails } from "../../services/systemDetailsAPI";
import {
  isTeslaPowerWall,
  shouldSuppressESS,
  isPowerWall3,
  isPowerWallPlus,
} from "../../utils/powerWallDetection";
import {
  ENPHASE_6C_CONFIG,
  isDuracellInverter,
  isSolArkInverter,
} from "../../utils/constants";
import {
  SYSTEM_PREFIXES,
  systemHasData as checkSystemHasDataUtil,
  getActiveSystems as getActiveSystemsUtil,
  getSchemaField,
} from "../../utils/systemFieldMapping";
import equipStyles from "./EquipmentForm.module.css";
import formStyles from "../../styles/FormSections.module.css";
import flameIcon from "../../assets/images/Skyfire Flame Icon.png";

/**
 * Debounce hook - delays value updates for expensive calculations
 */
const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// === TOGGLE GROUP DEFINITIONS ===
// Maps field prefixes to their _existing toggle field name.
// Used by piggyback logic to auto-persist toggle defaults when any field
// in the same equipment group saves � eliminates scattered useEffect auto-init.
// Order: longest prefix first to prevent partial matches.
const TOGGLE_GROUP_PREFIXES = [
  ["battery_combiner_panel_", "battery_combiner_panel_existing"],
  ["solar_panel_type2_", null], // Excluded � uses Category B _isnew toggle
  ["combiner_panel_", "combiner_panel_existing"],
  ["backup_panel_", "backup_panel_existing"],
  ["solar_panel_", "solar_panel_existing"],
  ["optimizer_type2_", "optimizer_type2_existing"],
  ["optimizer_", "optimizer_existing"],
  ["inverter_", "inverter_existing"],
  ["battery1_", "battery1_existing"],
  ["battery2_", "battery2_existing"],
  ["sms_", "sms_existing"],
];

/**
 * Returns the toggle field for an equipment field, or null if:
 * - Field doesn't belong to any toggle group
 * - Field IS the toggle itself (no self-piggyback)
 * - Group is excluded (e.g., solar_panel_type2_ has its own Category B toggle)
 */
function getToggleForField(field) {
  for (const [prefix, toggleField] of TOGGLE_GROUP_PREFIXES) {
    if (field.startsWith(prefix)) {
      return toggleField && field !== toggleField ? toggleField : null;
    }
  }
  return null;
}

/**
 * EquipmentForm - Main equipment configuration component
 * Modular design: imports section components based on configuration
 */
const EquipmentForm = ({
  projectUuid,
  projectData,
  onNavigateToTab,
  initialSubTab,
}) => {
  // Render counter for diagnostics
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
  });

  // Stabilize projectData dependencies - extract only what we need
  // CRITICAL: Memoize based on the actual site object to prevent cascade re-renders
  const projectSiteData = useMemo(() => {
    const site = projectData?.site || null;
    const utility = site?.utility || "";
    return { site, utility };
  }, [projectData?.site]); // Depend on the actual site object reference

  // Initialize system details hook for equipment data persistence
  const {
    data: systemDetails,
    loading: systemLoading,
    updateField,
    updateFields,
    refresh: refreshSystemDetails,
  } = useSystemDetails({ projectUuid });

  const [selectedSystem, setSelectedSystem] = useState(1);
  const [selectedView, setSelectedView] = useState("equipment"); // Keep for repurposing
  const [showAddSystemModal, setShowAddSystemModal] = useState(false);
  const [showStringingBlocker, setShowStringingBlocker] = useState(false);
  const [stringingBlockerMessage, setStringingBlockerMessage] = useState("");
  // Loading state removed - data loads fast enough that loading UI causes visual glitches
  const maxSystems = 4;

  // BOS Detection Modal State
  const [showBOSDetectionModal, setShowBOSDetectionModal] = useState(false);
  const [bosDetectionResult, setBosDetectionResult] = useState(null);
  const [bosDetectionSummary, setBosDetectionSummary] = useState("");

  // POI Prompt Modal State (for Oncor/Xcel Energy AC Disconnect)
  const [showPOIPromptModal, setShowPOIPromptModal] = useState(false);
  const [poiPromptSystemNumber, setPoiPromptSystemNumber] = useState(1);
  const [poiPromptCallback, setPoiPromptCallback] = useState(null);
  const [bosItemCount, setBosItemCount] = useState(0);
  const [bosDetectionLoading, setBosDetectionLoading] = useState(false);
  const [bosPayload, setBosPayload] = useState(null);

  // Visible systems state - System 1 always visible
  const [visibleSystems, setVisibleSystems] = useState([1]);

  // Combine systems toggle confirmation state
  const [showCombineConfirmModal, setShowCombineConfirmModal] = useState(false);
  const [pendingCombineChoice, setPendingCombineChoice] = useState(null);

  // Equipment validation modal state (for assessment scraper)
  const [showEquipmentValidationModal, setShowEquipmentValidationModal] =
    useState(false);
  const [equipmentValidationResults, setEquipmentValidationResults] = useState(
    [],
  );
  const [pendingEquipmentToPopulate, setPendingEquipmentToPopulate] =
    useState(null);

  // Ref to track previous gateway value for Gateway 3 SMS sync
  const prevGatewayRef = useRef("");

  // Ref to cache hydrated form data and prevent re-hydration on every render
  const hydratedFormDataCacheRef = useRef({});
  const lastSystemDetailsRef = useRef(null);

  // Refs for accessing latest values in callbacks without re-creating them
  // This prevents formData and systemDetails from being dependencies of memoized callbacks
  // Initialize with null, will be set in useEffect after state is defined
  const formDataRef = useRef(null);
  const systemDetailsRef = useRef(null);

  // Max continuous output state (for BOS equipment sizing) - System-specific
  const [
    maxContinuousOutputAmpsPerSystem,
    setMaxContinuousOutputAmpsPerSystem,
  ] = useState({});
  const [
    batteryMaxContinuousOutputAmpsPerSystem,
    setBatteryMaxContinuousOutputAmpsPerSystem,
  ] = useState({});
  const [loadingMaxOutput, setLoadingMaxOutput] = useState(false);

  // Form state - matches API field names from audit
  const [formDataRaw, setFormDataRaw] = useState({
    // Solar Panel fields
    solar_panel_existing: false,
    solar_panel_make: "",
    solar_panel_model: "",
    solar_panel_model_id: "", // Database ID of the solar panel model
    solar_panel_wattage: "",
    solar_panel_quantity: "",

    // System Type Selection (determines which equipment sections to show)
    system_type: "", // 'microinverter', 'inverter', or 'optimizer'

    // Inverter/Microinverter fields
    inverter_existing: false,
    inverter_make: "",
    inverter_model: "",
    inverter_model_id: "", // Database ID of the inverter model
    inverter_type: "", // 'inverter' or 'microinverter' - determined from DB
    inverter_max_cont_output_amps: "",
    inverter_max_strings_branches: null, // For string inverters only
    inverter_qty: "", // Microinverter quantity - syncs with solar panel count for 1:1 ratio micros

    // Optimizer fields (for SolarEdge, SOL-ARK, TIGO)
    optimizer_existing: false,
    optimizer_make: "",
    optimizer_model: "",

    // Type 2 Optimizer fields (for second panel type)
    optimizer_type2_existing: false,
    optimizer_type2_make: "",
    optimizer_type2_model: "",

    // String Combiner Panel fields (for microinverters)
    combiner_panel_existing: false,
    combiner_panel_make: "",
    combiner_panel_model: "",
    combiner_panel_bus_amps: "",
    combiner_panel_main_breaker: "MLO",
    combiner_panel_tie_in_breaker: "",
    aggregate_pv_breaker: "",

    // Stringing fields (used for both String Inverters and Microinverters)
    stringing_type: "auto", // 'auto' or 'custom'
    branch_string_1: "",
    branch_string_2: "",
    branch_string_3: "",
    branch_string_4: "",
    branch_string_5: "",
    branch_string_6: "",
    branch_string_7: "",
    branch_string_8: "",
    branch_string_9: "",
    branch_string_10: "",
    // Panel type for each string (1 or 2, for mixed panel types)
    branch_string_1_panel_type: "",
    branch_string_2_panel_type: "",
    branch_string_3_panel_type: "",
    branch_string_4_panel_type: "",
    branch_string_5_panel_type: "",
    branch_string_6_panel_type: "",
    branch_string_7_panel_type: "",
    branch_string_8_panel_type: "",
    branch_string_9_panel_type: "",
    branch_string_10_panel_type: "",

    // String Inverter Panels Per String (for MPPT custom stringing)
    branch_panels_per_string_1: "",
    branch_panels_per_string_2: "",
    branch_panels_per_string_3: "",
    branch_panels_per_string_4: "",
    branch_panels_per_string_5: "",
    branch_panels_per_string_6: "",
    branch_panels_per_string_7: "",
    branch_panels_per_string_8: "",
    branch_panels_per_string_9: "",
    branch_panels_per_string_10: "",

    // Hoymiles/APSystems Granular Microinverter Panel Tracking (camelCase)
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

    // Energy Storage System fields
    backup_option: "", // 'Whole Home', 'Partial Home', or 'No Backup'
    backup_system_size: "", // Amp rating for backup system

    // IQ Combiner 6C fields
    iq_combiner_config_id: null, // Configuration 1-10
    meter_collar_location: "", // 'behind_utility_meter' or 'discrete_meter_pan'
    iq_combiner_backup_type: "", // 'whole_home' or 'partial_home'

    // IQ Meter Collar fields (for Enphase Combiner 6C + Whole Home backup)
    iq_meter_collar_type: "", // 'Behind The Meter' or 'Stand Alone'

    // Storage Management System (SMS) fields
    sms_equipment_type: "",
    sms_existing: false,
    sms_make: "",
    sms_model: "",
    sms_main_breaker: "MLO",
    sms_pv_breaker: "",
    sms_ess_breaker: "",
    sms_tie_in_breaker: "",
    sms_has_rsd: false,
    sms_backup_load_sub_panel_breaker_rating: "MLO",
    sms_pv_breaker_rating_override: "",
    sms_ess_breaker_rating_override: "",
    sms_tie_in_breaker_rating_override: "",
    // System-specific SMS equipment type fields
    sys1_sms_equipment_type: "",
    sys2_sms_equipment_type: "",
    sys3_sms_equipment_type: "",
    sys4_sms_equipment_type: "",

    // System-specific battery combination method fields
    sys1_combination_method: "",
    sys2_combination_method: "",
    sys3_combination_method: "",
    sys4_combination_method: "",

    // Battery Type 1 fields
    battery1_existing: false,
    battery1_quantity: "",
    battery1_make: "",
    battery1_model: "",
    battery1_configuration: "", // 'Daisy Chain', 'Battery Combiner Panel', or 'Inverter'
    battery1_tie_in_location: "",

    // Battery Type 2 fields (optional)
    battery2_existing: false,
    battery2_quantity: "",
    battery2_make: "",
    battery2_model: "",
    battery2_configuration: "",
    battery2_tie_in_location: "",
    show_battery_type_2: false, // Controls whether Battery Type 2 section is shown

    // Combine Systems fields
    combine_systems: null, // null = no selection, false = do not combine, true = combine
    ele_combine_positions: "", // JSON string of combine configuration

    // Backup Load Sub Panel fields (for Whole Home / Partial Home)
    backup_loads_landing: "", // 'Backup Existing Panel' or 'Relocate Loads to New Backup Sub Panel'
    backup_panel_selection: "", // 'Main Panel (A)', 'Sub Panel (B)', or 'Sub Panel (C)'
    backup_panel_existing: false,
    backup_panel_make: "",
    backup_panel_model: "",
    backup_panel_bus_amps: "",
    backup_panel_main_breaker: "MLO",
    backup_panel_tie_in_breaker: "",
    backup_sp_tie_in_breaker_location: "",
    bls1_backuploader_main_breaker_rating: "MLO",

    // Battery Combiner Panel fields
    battery_combiner_panel_existing: false,
    battery_combiner_panel_make: "",
    battery_combiner_panel_model: "",
    battery_combiner_panel_bus_amps: "",
    battery_combiner_panel_main_breaker: "MLO",
    battery_combiner_panel_tie_in_breaker: "",

    // Tesla PowerWall Configuration fields
    expansionPacks: 0, // 0-3 battery expansion packs
    gateway: "", // 'backup_switch', 'backup_gateway_2', 'gateway_3'
    teslagatewaytype: "", // Display name for gateway type
    backupSwitchLocation: "", // 'behind_utility_meter', 'stand_alone_meter_panel'
    batteryExisting: false, // New or existing battery
    pcs_settings: false, // Power Control System activation

    // Gateway Configuration fields (for Backup Gateway 2 or Gateway 3)
    // Note: Gateway Config saves to SMS fields (they're shared in Tesla systems)
    gatewayConfigIsNew: true,
    gatewayConfigMainBreakerMode: "auto",
    gatewayConfigMainBreaker: "",
    gatewayConfigBackupSubPanelMode: "auto",
    gatewayConfigBackupPanel: "",
    gatewayConfigActivatePCS: false,
    gatewayConfigPCSAmps: "",
    gatewayConfigPVBreakerMode: "auto",
    gatewayConfigPVBreaker: "",
    gatewayConfigESSBreakerMode: "auto",
    gatewayConfigESSBreaker: "",
    gatewayConfigTieInBreakerMode: "auto",
    gatewayConfigTieInBreaker: "",

    // Electrical Section fields
    // Main Circuit Breakers (Service Entrance)
    ele_ses_type: "",
    ele_main_circuit_breakers_qty: 0,

    // Main Panel A
    mpa_bus_bar_existing: false,
    mpa_main_circuit_breaker_existing: false,
    ele_bus_bar_rating: "",
    ele_main_circuit_breaker_rating: "MLO",
    ele_feeder_location_on_bus_bar: "",
    el_mpa_derated: false,

    // Sub Panel B
    show_sub_panel_b: false,
    spb_activated: false,
    spb_subpanel_existing: false,
    spb_bus_bar_rating: "",
    spb_main_breaker_rating: "MLO",
    spb_subpanel_b_feeder_location: "",
    spb_upstream_breaker_rating: "",
    spb_conductor_sizing: "",
    spb_tie_in_location: "",
    el_spb_derated: false,

    // Point of Interconnection
    ele_method_of_interconnection: "",
    el_poi_breaker_rating: "",
    el_poi_disconnect_rating: "",
    ele_breaker_location: "",
    sys1_pcs_amps: "",
    sys1_pcs_settings: false,

    // System 2 inverter fields (to determine if Combine step is needed)
    sys2_inverter_make: "",
    sys2_inverter_model: "",

    // Note: ele_combine_positions is defined earlier (line 309) - removed duplicate
    // Combine Systems Sub Panel B configuration
    has_subpanel_b: false, // Whether Sub Panel B exists
    ele_subpanel_b_bus_rating: "",
    ele_subpanel_b_main_breaker: "",
    ele_subpanel_b_upstream_breaker: "",
  });

  // Create stable setFormData function (no dependencies to avoid breaking memoization)
  const setFormData = setFormDataRaw;
  const formData = formDataRaw;

  // Hydrate form data for a specific system
  const hydrateFormData = useCallback(
    (systemNum) => {
      const prefix = SYSTEM_PREFIXES[systemNum];

      // Check if systemDetails has changed
      const systemDetailsChanged =
        lastSystemDetailsRef.current !== systemDetails;
      if (
        !systemDetailsChanged &&
        hydratedFormDataCacheRef.current[systemNum]
      ) {
        // Return cached data if systemDetails hasn't changed
        return hydratedFormDataCacheRef.current[systemNum];
      }

      // Return empty defaults for new projects (systemDetails is null)
      if (!systemDetails) {
        return {
          // Solar Panel defaults
          solar_panel_existing: false,
          solar_panel_make: "",
          solar_panel_model: "",
          solar_panel_model_id: "",
          solar_panel_wattage: "",
          solar_panel_quantity: "",
          show_solar_panel_2: false,
          batteryonly: false,

          // System Type
          system_type: "",

          // Solar Panel 2 defaults
          solar_panel_type2_is_new: true, // true = New (default)
          solar_panel_type2_manufacturer: "",
          solar_panel_type2_model: "",
          solar_panel_type2_model_id: "",
          solar_panel_type2_wattage: "",
          solar_panel_type2_quantity: "",

          // Inverter defaults
          inverter_existing: false,
          inverter_make: "",
          inverter_model: "",
          inverter_model_id: "",
          inverter_type: "",
          inverter_max_cont_output_amps: "",
          inverter_qty: "",
          sys1_ap_hoy_breaker_size: "",

          // Optimizer defaults
          optimizer_existing: false,
          optimizer_make: "",
          optimizer_model: "",

          // Type 2 Optimizer defaults
          optimizer_type2_existing: false,
          optimizer_type2_make: "",
          optimizer_type2_model: "",

          // String Combiner Panel defaults
          combiner_panel_existing: false,
          combiner_panel_make: "",
          combiner_panel_model: "",
          combiner_panel_bus_amps: "",
          combiner_panel_main_breaker: "MLO",

          // Stringing defaults
          stringing_type: "auto",
          branch_string_1: "",
          branch_string_2: "",
          branch_string_3: "",
          branch_string_4: "",
          branch_string_5: "",
          branch_string_6: "",
          branch_string_7: "",
          branch_string_8: "",
          branch_string_9: "",
          branch_string_10: "",
          // Panel type defaults for each string
          branch_string_1_panel_type: "",
          branch_string_2_panel_type: "",
          branch_string_3_panel_type: "",
          branch_string_4_panel_type: "",
          branch_string_5_panel_type: "",
          branch_string_6_panel_type: "",
          branch_string_7_panel_type: "",
          branch_string_8_panel_type: "",
          branch_string_9_panel_type: "",
          branch_string_10_panel_type: "",

          // String Inverter Panels Per String defaults (for MPPT custom stringing)
          branch_panels_per_string_1: "",
          branch_panels_per_string_2: "",
          branch_panels_per_string_3: "",
          branch_panels_per_string_4: "",
          branch_panels_per_string_5: "",
          branch_panels_per_string_6: "",
          branch_panels_per_string_7: "",
          branch_panels_per_string_8: "",
          branch_panels_per_string_9: "",
          branch_panels_per_string_10: "",

          // Microinverter Panel Tracking defaults
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

          // Energy Storage defaults
          backup_option: "",
          backup_system_size: "",

          // IQ Combiner 6C defaults
          iq_combiner_config_id: null,
          meter_collar_location: "",
          iq_combiner_backup_type: "",

          // IQ Meter Collar defaults
          iq_meter_collar_type: "",

          // Tesla PowerWall Configuration defaults
          expansionPacks: 0,
          gateway: "",
          teslagatewaytype: "",
          backupSwitchLocation: "",
          batteryExisting: false,
          pcs_settings: false,

          // SMS (Storage Management System) defaults
          sms_equipment_type: "",
          sms_existing: false,
          sms_make: "",
          sms_model: "",
          sms_main_breaker: "MLO",
          sms_pv_breaker: "",
          sms_ess_breaker: "",
          sms_tie_in_breaker: "",
          sms_has_rsd: false,
          sms_backup_load_sub_panel_breaker_rating: "",
          sms_pv_breaker_rating_override: "",
          sms_ess_breaker_rating_override: "",
          sms_tie_in_breaker_rating_override: "",

          // Battery Type 1 defaults
          battery1_existing: false,
          battery1_quantity: "",
          battery1_make: "",
          battery1_model: "",
          battery1_configuration: "",
          battery1_tie_in_location: "",

          // Battery Type 2 defaults
          battery2_existing: false,
          battery2_quantity: "",
          battery2_make: "",
          battery2_model: "",
          battery2_tie_in_location: "",
          show_battery_type_2: false,

          // Backup Load Sub Panel defaults
          backup_loads_landing: "",
          backup_panel_selection: "",
          backup_panel_existing: false,
          backup_panel_make: "",
          backup_panel_model: "",
          backup_panel_bus_amps: "",
          backup_panel_main_breaker: "MLO",
          backup_panel_tie_in_breaker: "",

          // Battery Combiner Panel defaults
          battery_combiner_panel_existing: false,
          battery_combiner_panel_make: "",
          battery_combiner_panel_model: "",
          battery_combiner_panel_bus_amps: "",
          battery_combiner_panel_main_breaker: "MLO",
          battery_combiner_panel_tie_in_breaker: "",

          // Gateway Configuration defaults
          gatewayConfigIsNew: true,
          gatewayConfigMainBreakerMode: "auto",
          gatewayConfigMainBreaker: "",
          gatewayConfigBackupSubPanelMode: "auto",
          gatewayConfigBackupPanel: "",
          gatewayConfigActivatePCS: false,
          gatewayConfigPCSAmps: "",
          gatewayConfigPVBreakerMode: "auto",
          gatewayConfigPVBreaker: "",
          gatewayConfigESSBreakerMode: "auto",
          gatewayConfigESSBreaker: "",
          gatewayConfigTieInBreakerMode: "auto",
          gatewayConfigTieInBreaker: "",

          // ESS Combiner defaults
          ess_existing: false,
          ess_make: "",
          ess_model: "",
          ess_main_breaker: "",

          // Electrical defaults (global, not system-specific)
          ele_ses_type: "",
          ele_main_circuit_breakers_qty: "",
          ele_bus_bar_rating: "",
          ele_main_circuit_breaker_rating: "MLO",

          // BOS Equipment defaults (6 slots)
          ...Array.from({ length: 6 }, (_, i) => {
            const slot = i + 1;
            const bosPrefix = `bos_${prefix}_type${slot}`;
            return {
              [`${bosPrefix}_equipment_type`]: "",
              [`${bosPrefix}_make`]: "",
              [`${bosPrefix}_model`]: "",
              [`${bosPrefix}_amp_rating`]: "",
              [`${bosPrefix}_is_new`]: true,
              [`${bosPrefix}_active`]: null,
              [`${bosPrefix}_trigger`]: null,
              [`${bosPrefix}_block_name`]: "",
            };
          }).reduce((acc, curr) => ({ ...acc, ...curr }), {}),

          // Include site data for utility-specific BOS translations
          site: projectData?.site || null,
          // Also pass utility directly for easier access
          utility: (() => {
            const utilityValue = projectData?.site?.utility || "";
            return utilityValue;
          })(),
        };
      }

      // For existing projects, hydrate from systemDetails
      const hydratedData = {
        // Solar Panel (handle schema inconsistencies)
        solar_panel_existing:
          !!systemDetails[getSchemaField(systemNum, "solar_panel_existing")],
        solar_panel_make: systemDetails[`${prefix}_solar_panel_make`] || "",
        solar_panel_model: systemDetails[`${prefix}_solar_panel_model`] || "",
        solar_panel_model_id:
          systemDetails[getSchemaField(systemNum, "solarpanel_id")] || "",
        solar_panel_wattage:
          systemDetails[`${prefix}_solar_panel_wattage`] || "",
        solar_panel_quantity: systemDetails[`${prefix}_solar_panel_qty`] || "",

        // Solar Panel Type 2 visibility flag
        show_solar_panel_2: !!systemDetails[`${prefix}_show_second_panel_type`],
        batteryonly: !!systemDetails[`${prefix}_batteryonly`],

        // Solar Panel Type 2 fields
        // DB stores _is_new (true=new), component uses _is_new directly � no inversion needed
        solar_panel_type2_is_new:
          systemDetails[`${prefix}_solar_panel_type2_is_new`] ?? true,
        solar_panel_type2_manufacturer:
          systemDetails[`${prefix}_solar_panel_type2_manufacturer`] || "",
        solar_panel_type2_model:
          systemDetails[`${prefix}_solar_panel_type2_model`] || "",
        solar_panel_type2_quantity:
          systemDetails[`${prefix}_solar_panel_type2_quantity`] || "",
        solar_panel_type2_wattage:
          systemDetails[`${prefix}_solar_panel_type2_watts`] || "",
        solar_panel_type2_model_id:
          systemDetails[`${prefix}_solar_panel_type2_model_id`] || "",
        solar_panel_type2_voc:
          systemDetails[`${prefix}_solar_panel_type2_voc`] || "",
        solar_panel_type2_isc:
          systemDetails[`${prefix}_solar_panel_type2_isc`] || "",
        solar_panel_type2_vmp:
          systemDetails[`${prefix}_solar_panel_type2_vmp`] || "",
        solar_panel_type2_imp:
          systemDetails[`${prefix}_solar_panel_type2_imp`] || "",
        solar_panel_type2_temp_coeff_voc:
          systemDetails[`${prefix}_solar_panel_type2_temp_coeff_voc`] || "",

        // System Type
        system_type: systemDetails[`${prefix}_system_type`] || "",

        // Inverter/Microinverter (handle schema inconsistencies)
        inverter_existing:
          !!systemDetails[getSchemaField(systemNum, "micro_inverter_existing")],
        inverter_make: systemDetails[`${prefix}_micro_inverter_make`] || "",
        inverter_model: systemDetails[`${prefix}_micro_inverter_model`] || "",
        inverter_model_id: systemDetails[`${prefix}_micro_inverter_id`] || "",
        inverter_type: systemDetails[`${prefix}_inverter_type`] || "",
        inverter_max_cont_output_amps:
          systemDetails[`${prefix}_inv_max_continuous_output`] || "",
        inverter_qty: systemDetails[`${prefix}_micro_inverter_qty`] || "",
        sys1_ap_hoy_breaker_size: systemDetails.sys1_ap_hoy_breaker_size || "",

        // Optimizer
        optimizer_existing: !!systemDetails[`${prefix}_optimizer_existing`],
        optimizer_make: systemDetails[`${prefix}_optimizer_make`] || "",
        optimizer_model: systemDetails[`${prefix}_optimizer_model`] || "",

        // Type 2 Optimizer
        optimizer_type2_existing: !!systemDetails[`${prefix}_optimizer_type2_existing`],
        optimizer_type2_make: systemDetails[`${prefix}_optimizer_type2_make`] || "",
        optimizer_type2_model: systemDetails[`${prefix}_optimizer_type2_model`] || "",

        // String Combiner Panel
        combiner_panel_existing: !!systemDetails[`${prefix}_combiner_existing`],
        combiner_panel_make:
          systemDetails[`${prefix}_combiner_panel_make`] || "",
        combiner_panel_model:
          systemDetails[`${prefix}_combiner_panel_model`] || "",
        combiner_panel_bus_amps:
          systemDetails[`${prefix}_combinerpanel_bus_rating`] || "",
        combiner_panel_main_breaker:
          systemDetails[`${prefix}_combinerpanel_main_breaker_rating`] || "MLO",
        combiner_panel_tie_in_breaker:
          systemDetails[`${prefix}_combiner_panel_tie_in_breaker`] || "",
        aggregate_pv_breaker:
          systemDetails[`${prefix}_aggregate_pv_breaker`] || "",

        // Stringing
        stringing_type: systemDetails[`${prefix}_stringing_type`] || "auto",
        branch_string_1: systemDetails[`${prefix}_branch_string_1`] || "",
        branch_string_2: systemDetails[`${prefix}_branch_string_2`] || "",
        branch_string_3: systemDetails[`${prefix}_branch_string_3`] || "",
        branch_string_4: systemDetails[`${prefix}_branch_string_4`] || "",
        branch_string_5: systemDetails[`${prefix}_branch_string_5`] || "",
        branch_string_6: systemDetails[`${prefix}_branch_string_6`] || "",
        branch_string_7: systemDetails[`${prefix}_branch_string_7`] || "",
        branch_string_8: systemDetails[`${prefix}_branch_string_8`] || "",
        branch_string_9: systemDetails[`${prefix}_branch_string_9`] || "",
        branch_string_10: systemDetails[`${prefix}_branch_string_10`] || "",
        // Panel type for each string
        branch_string_1_panel_type: systemDetails[`${prefix}_branch_string_1_panel_type`] || "",
        branch_string_2_panel_type: systemDetails[`${prefix}_branch_string_2_panel_type`] || "",
        branch_string_3_panel_type: systemDetails[`${prefix}_branch_string_3_panel_type`] || "",
        branch_string_4_panel_type: systemDetails[`${prefix}_branch_string_4_panel_type`] || "",
        branch_string_5_panel_type: systemDetails[`${prefix}_branch_string_5_panel_type`] || "",
        branch_string_6_panel_type: systemDetails[`${prefix}_branch_string_6_panel_type`] || "",
        branch_string_7_panel_type: systemDetails[`${prefix}_branch_string_7_panel_type`] || "",
        branch_string_8_panel_type: systemDetails[`${prefix}_branch_string_8_panel_type`] || "",
        branch_string_9_panel_type: systemDetails[`${prefix}_branch_string_9_panel_type`] || "",
        branch_string_10_panel_type: systemDetails[`${prefix}_branch_string_10_panel_type`] || "",

        // String Inverter Panels Per String (for MPPT custom stringing)
        branch_panels_per_string_1:
          systemDetails[`${prefix}_branch_panels_per_string_1`] || "",
        branch_panels_per_string_2:
          systemDetails[`${prefix}_branch_panels_per_string_2`] || "",
        branch_panels_per_string_3:
          systemDetails[`${prefix}_branch_panels_per_string_3`] || "",
        branch_panels_per_string_4:
          systemDetails[`${prefix}_branch_panels_per_string_4`] || "",
        branch_panels_per_string_5:
          systemDetails[`${prefix}_branch_panels_per_string_5`] || "",
        branch_panels_per_string_6:
          systemDetails[`${prefix}_branch_panels_per_string_6`] || "",
        branch_panels_per_string_7:
          systemDetails[`${prefix}_branch_panels_per_string_7`] || "",
        branch_panels_per_string_8:
          systemDetails[`${prefix}_branch_panels_per_string_8`] || "",
        branch_panels_per_string_9:
          systemDetails[`${prefix}_branch_panels_per_string_9`] || "",
        branch_panels_per_string_10:
          systemDetails[`${prefix}_branch_panels_per_string_10`] || "",

        // Hoymiles/APSystems Granular Microinverter Panel Tracking
        micro1Panels: systemDetails[`${prefix}_micro1Panels`] || "",
        micro2Panels: systemDetails[`${prefix}_micro2Panels`] || "",
        micro3Panels: systemDetails[`${prefix}_micro3Panels`] || "",
        micro4Panels: systemDetails[`${prefix}_micro4Panels`] || "",
        micro5Panels: systemDetails[`${prefix}_micro5Panels`] || "",
        micro6Panels: systemDetails[`${prefix}_micro6Panels`] || "",
        micro7Panels: systemDetails[`${prefix}_micro7Panels`] || "",
        micro8Panels: systemDetails[`${prefix}_micro8Panels`] || "",
        micro9Panels: systemDetails[`${prefix}_micro9Panels`] || "",
        micro10Panels: systemDetails[`${prefix}_micro10Panels`] || "",
        micro11Panels: systemDetails[`${prefix}_micro11Panels`] || "",
        micro12Panels: systemDetails[`${prefix}_micro12Panels`] || "",
        micro13Panels: systemDetails[`${prefix}_micro13Panels`] || "",
        micro14Panels: systemDetails[`${prefix}_micro14Panels`] || "",
        micro15Panels: systemDetails[`${prefix}_micro15Panels`] || "",
        micro16Panels: systemDetails[`${prefix}_micro16Panels`] || "",
        micro17Panels: systemDetails[`${prefix}_micro17Panels`] || "",
        micro18Panels: systemDetails[`${prefix}_micro18Panels`] || "",
        micro19Panels: systemDetails[`${prefix}_micro19Panels`] || "",
        micro20Panels: systemDetails[`${prefix}_micro20Panels`] || "",
        micro21Panels: systemDetails[`${prefix}_micro21Panels`] || "",
        micro22Panels: systemDetails[`${prefix}_micro22Panels`] || "",
        micro23Panels: systemDetails[`${prefix}_micro23Panels`] || "",
        micro24Panels: systemDetails[`${prefix}_micro24Panels`] || "",
        micro25Panels: systemDetails[`${prefix}_micro25Panels`] || "",

        // Energy Storage (system-specific field)
        backup_option: (() => {
          return systemDetails[`${prefix}_backup_option`] || "";
        })(),
        backup_system_size: systemDetails.utility_service_amps || "",

        // IQ Combiner 6C
        iq_combiner_config_id:
          systemDetails[`${prefix}_iq_combiner_config_id`] || null,
        meter_collar_location:
          systemDetails[`${prefix}_meter_collar_setting`] || "",
        iq_combiner_backup_type:
          systemDetails[`${prefix}_iq_combiner_backup_type`] || "",

        // IQ Meter Collar
        iq_meter_collar_type:
          systemDetails[`${prefix}_meter_collar_setting`] || "",

        // Tesla PowerWall Configuration
        expansionPacks:
          parseInt(systemDetails[`${prefix}_tesla_extensions`]) || 0,
        gateway: systemDetails[`${prefix}_teslagatewaytype`] || "",
        teslagatewaytype: systemDetails[`${prefix}_teslagatewaytype`] || "",
        backupSwitchLocation:
          systemDetails[`${prefix}_backupswitch_location`] || "",
        batteryExisting: !!systemDetails[`${prefix}_battery1_existing`],
        pcs_settings: !!systemDetails[`${prefix}_pcs_settings`],

        // SMS (Storage Management System)
        // NOTE: SMS fields are NOT prefixed in the database (they're global, not system-specific)
        sms_equipment_type: systemDetails[`${prefix}_sms_equipment_type`] || "",
        sms_existing: !!systemDetails[`${prefix}_sms_existing`],
        sms_make: systemDetails[`${prefix}_sms_make`] || "",
        sms_model: systemDetails[`${prefix}_sms_model`] || "",
        sms_main_breaker:
          systemDetails[`${prefix}_sms_breaker_rating`] || "MLO",
        sms_pv_breaker:
          systemDetails[`${prefix}_sms_pv_breaker_rating_override`] || "",
        sms_ess_breaker:
          systemDetails[`${prefix}_sms_ess_breaker_rating_override`] || "",
        sms_tie_in_breaker:
          systemDetails[`${prefix}_sms_tie_in_breaker_rating_override`] || "",
        sms_has_rsd: !!systemDetails[`${prefix}_sms_rsd_enabled`],
        sms_backup_load_sub_panel_breaker_rating:
          systemDetails[`${prefix}_sms_backup_load_sub_panel_breaker_rating`] ||
          "",
        sms_pv_breaker_rating_override:
          systemDetails[`${prefix}_sms_pv_breaker_rating_override`] || "",
        sms_ess_breaker_rating_override:
          systemDetails[`${prefix}_sms_ess_breaker_rating_override`] || "",
        sms_tie_in_breaker_rating_override:
          systemDetails[`${prefix}_sms_tie_in_breaker_rating_override`] || "",

        // Battery Type 1
        // NOTE: battery1 core fields (make/model/qty/config) are system-prefixed in the database
        battery1_existing: !!systemDetails[`${prefix}_battery1_existing`],
        battery1_quantity: systemDetails[`${prefix}_battery_1_qty`] || "",
        battery1_make: systemDetails[`${prefix}_battery_1_make`] || "",
        battery1_model: systemDetails[`${prefix}_battery_1_model`] || "",
        battery1_configuration:
          systemDetails[`${prefix}_battery_configuration`] || "",
        battery1_tie_in_location:
          systemDetails[`${prefix}_battery1_tie_in_location`] || "",
        battery1_mount_type:
          systemDetails[`${prefix}_battery1_mount_type`] || "",

        // Battery Type 2
        // NOTE: battery2 core fields are system-prefixed in the database
        battery2_existing: !!systemDetails[`${prefix}_battery2_existing`],
        battery2_quantity: systemDetails[`${prefix}_battery_2_qty`] || "",
        battery2_make: systemDetails[`${prefix}_battery_2_make`] || "",
        battery2_model: systemDetails[`${prefix}_battery_2_model`] || "",
        battery2_tie_in_location:
          systemDetails[`${prefix}_battery2_tie_in_location`] || "",
        battery2_mount_type:
          systemDetails[`${prefix}_battery2_mount_type`] || "",

        // Battery Combination Method (shared field for both battery types)
        [`sys${systemNum}_combination_method`]:
          systemDetails[`${prefix}_combination_method`] || "",

        // Backup Load Sub Panel
        backup_loads_landing: systemDetails[`${prefix}_backupconfig`] || "",
        backup_panel_selection:
          systemDetails[`${prefix}_backupconfig_selectpanel`] || "",
        // backup_panel core fields use bls_ prefix in the database
        backup_panel_existing:
          !!systemDetails[`bls${systemNum}_backuploader_existing`],
        backup_panel_make:
          systemDetails[`bls${systemNum}_backup_load_sub_panel_make`] || "",
        backup_panel_model:
          systemDetails[`bls${systemNum}_backup_load_sub_panel_model`] || "",
        backup_panel_bus_amps:
          systemDetails[`bls${systemNum}_backuploader_bus_bar_rating`] || "",
        backup_panel_main_breaker:
          systemDetails[`bls${systemNum}_backuploader_main_breaker_rating`] ||
          "MLO",
        backup_panel_tie_in_breaker:
          systemDetails[
            `bls${systemNum}_backuploader_upstream_breaker_rating`
          ] || "",
        backup_sp_tie_in_breaker_location:
          systemDetails[`sys${systemNum}_backup_sp_tie_in_breaker_location`] ||
          "",

        // Battery Combiner Panel
        battery_combiner_panel_existing:
          !!systemDetails[`bcp${systemNum}_existing`],
        battery_combiner_panel_make:
          systemDetails[`bcp${systemNum}_make`] || "",
        battery_combiner_panel_model:
          systemDetails[`bcp${systemNum}_model`] || "",
        battery_combiner_panel_bus_amps:
          systemDetails[`bcp${systemNum}_busbar`] || "",
        battery_combiner_panel_main_breaker:
          systemDetails[`bcp${systemNum}_mainbreaker1`] || "MLO",
        battery_combiner_panel_tie_in_breaker:
          systemDetails[`bcp${systemNum}_tieinbreaker`] || "",

        // Gateway Configuration
        gatewayConfigIsNew: !systemDetails[`${prefix}_sms_existing`],
        gatewayConfigMainBreaker:
          systemDetails[`${prefix}_sms_breaker_rating`] || "",
        gatewayConfigBackupPanel:
          systemDetails[`${prefix}_sms_backup_load_sub_panel_breaker_rating`] ||
          "",
        gatewayConfigActivatePCS: !!systemDetails[`${prefix}_pcs_settings`],
        gatewayConfigPCSAmps: systemDetails[`${prefix}_pcs_amps`] || "",
        gatewayConfigPVBreaker:
          systemDetails[`${prefix}_sms_pv_breaker_rating_override`] || "",
        gatewayConfigESSBreaker:
          systemDetails[`${prefix}_sms_ess_breaker_rating_override`] || "",
        gatewayConfigTieInBreaker:
          systemDetails[`${prefix}_sms_tie_in_breaker_rating_override`] || "",

        // ESS Combiner
        ess_existing: !!systemDetails[`${prefix}_ess_existing`],
        ess_make: systemDetails[`${prefix}_ess_make`] || "",
        ess_model: systemDetails[`${prefix}_ess_model`] || "",
        ess_main_breaker:
          systemDetails[`${prefix}_ess_main_breaker_rating`] || "",

        // Electrical (uses ele_ prefix - not system-specific)
        ele_ses_type: systemDetails.ele_ses_type || "",
        ele_main_circuit_breakers_qty:
          systemDetails.ele_main_circuit_breakers_qty || "",
        ele_bus_bar_rating: systemDetails.ele_bus_bar_rating || "",
        ele_main_circuit_breaker_rating:
          systemDetails.ele_main_circuit_breaker_rating || "MLO",

        // BOS Equipment - Utility (6 slots)
        ...Array.from({ length: 6 }, (_, i) => {
          const slot = i + 1;
          const bosPrefix = `bos_${prefix}_type${slot}`;
          return {
            [`${bosPrefix}_equipment_type`]:
              systemDetails[`${bosPrefix}_equipment_type`] || "",
            [`${bosPrefix}_make`]: systemDetails[`${bosPrefix}_make`] || "",
            [`${bosPrefix}_model`]: systemDetails[`${bosPrefix}_model`] || "",
            [`${bosPrefix}_amp_rating`]:
              systemDetails[`${bosPrefix}_amp_rating`] || "",
            [`${bosPrefix}_is_new`]:
              systemDetails[`${bosPrefix}_is_new`] !== false,
            [`${bosPrefix}_active`]:
              systemDetails[`${bosPrefix}_active`] || null,
            [`${bosPrefix}_trigger`]:
              systemDetails[`${bosPrefix}_trigger`] || null,
            [`${bosPrefix}_block_name`]:
              systemDetails[`${bosPrefix}_block_name`] || "",
          };
        }).reduce((acc, curr) => ({ ...acc, ...curr }), {}),

        // BOS Visibility Flags - Derived from whether slots have data
        show_inverter_bos: [1,2,3,4,5,6].some(slot =>
          systemDetails[`bos_${prefix}_type${slot}_equipment_type`] ||
          systemDetails[`bos_${prefix}_type${slot}_make`]
        ),
        show_battery1_bos: [1,2,3].some(slot =>
          systemDetails[`bos_${prefix}_battery1_type${slot}_equipment_type`] ||
          systemDetails[`bos_${prefix}_battery1_type${slot}_make`]
        ),
        show_battery2_bos: [1,2,3].some(slot =>
          systemDetails[`bos_${prefix}_battery2_type${slot}_equipment_type`] ||
          systemDetails[`bos_${prefix}_battery2_type${slot}_make`]
        ),

        // ESS Section Visibility Flags - Show if backup option selected OR equipment configured
        show_sms: !!(systemDetails[`${prefix}_backup_option`]) || !!(systemDetails[`${prefix}_sms_make`]),
        show_battery1: !!(systemDetails[`${prefix}_backup_option`]) || !!(systemDetails[`${prefix}_battery_1_make`]),
        show_battery2: !!(systemDetails[`${prefix}_battery_2_make`]),
        show_backup_panel: (systemDetails[`${prefix}_backup_option`] === 'Whole Home' || systemDetails[`${prefix}_backup_option`] === 'Partial Home') || !!(systemDetails[`bls${systemNum}_backup_load_sub_panel_make`]),

        // Include site data for utility-specific BOS translations
        site: projectSiteData.site,
        // Also pass utility directly for easier access
        utility: projectSiteData.utility,
      };

      // Cache the result
      hydratedFormDataCacheRef.current[systemNum] = hydratedData;
      lastSystemDetailsRef.current = systemDetails;

      return hydratedData;
    },
    [systemDetails, projectSiteData],
  );
  // Batch update multiple fields at once (for auto-population)
  // Memoized to prevent child component re-renders
  const handleBatchFieldChange = useCallback(
    async (fieldUpdates) => {
      if (!fieldUpdates || fieldUpdates.length === 0) return;

      // Build field mapping for current system (same as in handleFieldChange)
      const systemPrefix = SYSTEM_PREFIXES[selectedSystem];
      const getFieldMapping = (sysNum, sysPrefix) => ({
        // Solar Panel
        solar_panel_existing: getSchemaField(sysNum, "solar_panel_existing"),
        solar_panel_make: `${sysPrefix}_solar_panel_make`,
        solar_panel_model: `${sysPrefix}_solar_panel_model`,
        solar_panel_quantity: `${sysPrefix}_solar_panel_qty`,
        solar_panel_watts: `${sysPrefix}_solar_panel_watts`,
        solar_panel_vmp: `${sysPrefix}_solar_panel_vmp`,
        solar_panel_imp: `${sysPrefix}_solar_panel_imp`,
        solar_panel_voc: `${sysPrefix}_solar_panel_voc`,
        solar_panel_isc: `${sysPrefix}_solar_panel_isc`,

        // Solar Panel 2 (for mixed systems)
        solar_panel_type2_is_new: getSchemaField(
          sysNum,
          "solar_panel_type2_is_new",
        ),
        solar_panel_type2_manufacturer: `${sysPrefix}_solar_panel_type2_manufacturer`,
        solar_panel_type2_model: `${sysPrefix}_solar_panel_type2_model`,
        solar_panel_type2_quantity: `${sysPrefix}_solar_panel_type2_quantity`,
        show_solar_panel_2: `${sysPrefix}_show_second_panel_type`,
        batteryonly: `${sysPrefix}_batteryonly`,

        // System Type
        system_type: `${sysPrefix}_system_type`,

        // Inverter/Microinverter
        inverter_existing: getSchemaField(sysNum, "micro_inverter_existing"),
        inverter_make: `${sysPrefix}_micro_inverter_make`,
        inverter_model: `${sysPrefix}_micro_inverter_model`,
        // inverter_type removed - derived from sys1_selectedsystem, not in DB
        inverter_max_cont_output_amps: `${sysPrefix}_inv_max_continuous_output`,
        inverter_max_strings_branches: `${sysPrefix}_inv_max_strings_branches`,
        inverter_max_vdc: `${sysPrefix}_inv_max_vdc`,
        inverter_min_vdc: `${sysPrefix}_inv_min_vdc`,
        inverter_max_input_isc: `${sysPrefix}_inv_max_input_isc`,
        inverter_model_id: `${sysPrefix}_micro_inverter_id`,

        // SolarEdge multi-kW
        solaredge_partnumber: `${sysPrefix}_solaredge_partnumber`,
        solaredge_setting: `${sysPrefix}_solaredge_setting`,

        // Hoymiles/APSystems Granular Microinverter Panel Tracking
        micro1Panels: `${sysPrefix}_micro1Panels`,
        micro2Panels: `${sysPrefix}_micro2Panels`,
        micro3Panels: `${sysPrefix}_micro3Panels`,
        micro4Panels: `${sysPrefix}_micro4Panels`,
        micro5Panels: `${sysPrefix}_micro5Panels`,
        micro6Panels: `${sysPrefix}_micro6Panels`,
        micro7Panels: `${sysPrefix}_micro7Panels`,
        micro8Panels: `${sysPrefix}_micro8Panels`,
        micro9Panels: `${sysPrefix}_micro9Panels`,
        micro10Panels: `${sysPrefix}_micro10Panels`,
        micro11Panels: `${sysPrefix}_micro11Panels`,
        micro12Panels: `${sysPrefix}_micro12Panels`,
        micro13Panels: `${sysPrefix}_micro13Panels`,
        micro14Panels: `${sysPrefix}_micro14Panels`,
        micro15Panels: `${sysPrefix}_micro15Panels`,
        micro16Panels: `${sysPrefix}_micro16Panels`,
        micro17Panels: `${sysPrefix}_micro17Panels`,
        micro18Panels: `${sysPrefix}_micro18Panels`,
        micro19Panels: `${sysPrefix}_micro19Panels`,
        micro20Panels: `${sysPrefix}_micro20Panels`,
        micro21Panels: `${sysPrefix}_micro21Panels`,
        micro22Panels: `${sysPrefix}_micro22Panels`,
        micro23Panels: `${sysPrefix}_micro23Panels`,
        micro24Panels: `${sysPrefix}_micro24Panels`,
        micro25Panels: `${sysPrefix}_micro25Panels`,

        // Optimizer
        optimizer_existing: getSchemaField(sysNum, "optimizer_existing"),
        optimizer_make: `${sysPrefix}_optimizer_make`,
        optimizer_model: `${sysPrefix}_optimizer_model`,

        // Type 2 Optimizer
        optimizer_type2_existing: getSchemaField(sysNum, "optimizer_type2_existing"),
        optimizer_type2_make: `${sysPrefix}_optimizer_type2_make`,
        optimizer_type2_model: `${sysPrefix}_optimizer_type2_model`,

        // String Combiner Panel
        combiner_panel_existing: getSchemaField(sysNum, "combiner_existing"),
        combiner_panel_make: `${sysPrefix}_combiner_panel_make`,
        combiner_panel_model: `${sysPrefix}_combiner_panel_model`,
        combiner_panel_bus_amps: `${sysPrefix}_combinerpanel_bus_rating`,
        combiner_panel_main_breaker: `${sysPrefix}_combinerpanel_main_breaker_rating`,
        combiner_panel_tie_in_breaker: `${sysPrefix}_combiner_panel_tie_in_breaker`,
        aggregate_pv_breaker: `${sysPrefix}_aggregate_pv_breaker`,

        // BOS Visibility Flags - REMOVED: Computed from BOS slot data, not stored
        // show_inverter_bos, show_battery1_bos, show_battery2_bos

        // ESS Section Visibility Flags - REMOVED: Computed from equipment data, not stored
        // show_sms, show_battery1, show_battery2, show_backup_panel

        // Hoymiles/APSystems breaker size
        sys1_ap_hoy_breaker_size: "sys1_ap_hoy_breaker_size",

        // Energy Storage System (ESS)
        backup_option: `${sysPrefix}_backup_option`,
        backup_system_size: "backup_system_size",

        // IQ Combiner 6C
        iq_combiner_config_id: `${sysPrefix}_iq_combiner_config_id`,
        meter_collar_location: `${sysPrefix}_meter_collar_setting`,
        iq_combiner_backup_type: `${sysPrefix}_iq_combiner_backup_type`,

        // IQ Meter Collar
        iq_meter_collar_type: `${sysPrefix}_meter_collar_setting`,

        // Storage Management System (SMS)
        sms_equipment_type: `${sysPrefix}_sms_equipment_type`,
        sms_existing: `${sysPrefix}_sms_existing`,
        sms_make: `${sysPrefix}_sms_make`,
        sms_model: `${sysPrefix}_sms_model`,
        sms_main_breaker: `${sysPrefix}_sms_breaker_rating`,
        // sms_pv_breaker removed - redundant, use sms_pv_breaker_rating_override
        // sms_ess_breaker removed - redundant, use sms_ess_breaker_rating_override
        // sms_tie_in_breaker removed - redundant, use sms_tie_in_breaker_rating_override
        sms_has_rsd: `${sysPrefix}_sms_rsd_enabled`,
        sms_pv_breaker_rating_override: `${sysPrefix}_sms_pv_breaker_rating_override`,
        sms_ess_breaker_rating_override: `${sysPrefix}_sms_ess_breaker_rating_override`,
        sms_tie_in_breaker_rating_override: `${sysPrefix}_sms_tie_in_breaker_rating_override`,
        sms_backup_load_sub_panel_breaker_rating: `${sysPrefix}_sms_backup_load_sub_panel_breaker_rating`,

        // Battery Type 1
        battery1_existing: `${sysPrefix}_battery1_existing`,
        battery1_make: `${sysPrefix}_battery_1_make`,
        battery1_model: `${sysPrefix}_battery_1_model`,
        battery1_quantity: `${sysPrefix}_battery_1_qty`,
        battery1_configuration: `${sysPrefix}_battery_configuration`,
        battery1_tie_in_location: `${sysPrefix}_battery1_tie_in_location`,
        // battery1_mount_type removed - not in DB or calc

        // Battery Type 2
        battery2_existing: `${sysPrefix}_battery2_existing`,
        battery2_make: `${sysPrefix}_battery_2_make`,
        battery2_model: `${sysPrefix}_battery_2_model`,
        battery2_quantity: `${sysPrefix}_battery_2_qty`,
        battery2_tie_in_location: `${sysPrefix}_battery2_tie_in_location`,
        // battery2_mount_type removed - not in DB or calc
        // show_battery_type_2 removed - UI toggle, not in DB

        // Backup Load Sub Panel
        backup_loads_landing: "sys1_backupconfig",
        backup_panel_selection: "sys1_backupconfig_selectpanel",
        backup_panel_existing: `bls${sysNum}_backuploader_existing`,
        backup_panel_make: `bls${sysNum}_backup_load_sub_panel_make`,
        backup_panel_model: `bls${sysNum}_backup_load_sub_panel_model`,
        backup_panel_bus_amps: `bls${sysNum}_backuploader_bus_bar_rating`,
        backup_panel_main_breaker: `bls${sysNum}_backuploader_main_breaker_rating`,
        backup_panel_tie_in_breaker: `bls${sysNum}_backuploader_upstream_breaker_rating`,

        // Battery Combiner Panel
        battery_combiner_panel_existing: `bcp${sysNum}_existing`,
        battery_combiner_panel_make: `bcp${sysNum}_Make`,
        battery_combiner_panel_model: `bcp${sysNum}_model`,
        battery_combiner_panel_bus_amps: `bcp${sysNum}_busbar`,
        battery_combiner_panel_main_breaker: `bcp${sysNum}_mainbreaker1`,
        battery_combiner_panel_tie_in_breaker: `bcp${sysNum}_TieInBreaker`,

        // Tesla PowerWall fields
        expansionPacks: `${sysPrefix}_tesla_extensions`,
        gateway: `${sysPrefix}_teslagatewaytype`, // Maps to same field as teslagatewaytype
        teslagatewaytype: `${sysPrefix}_teslagatewaytype`,
        backupSwitchLocation: `${sysPrefix}_backupswitch_location`,
        batteryExisting: `${sysPrefix}_battery1_existing`,

        // Tesla Gateway Config fields
        gatewayConfigIsNew: `${sysPrefix}_sms_existing`,
        gatewayConfigMainBreaker: `${sysPrefix}_sms_breaker_rating`,
        gatewayConfigBackupPanel: `${sysPrefix}_sms_backup_load_sub_panel_breaker_rating`,
        gatewayConfigActivatePCS: `${sysPrefix}_pcs_settings`,
        gatewayConfigPCSAmps: "sys1_pcs_amps",
        gatewayConfigPVBreaker: `${sysPrefix}_sms_pv_breaker_rating_override`,
        gatewayConfigESSBreaker: `${sysPrefix}_sms_ess_breaker_rating_override`,
        gatewayConfigTieInBreaker: `${sysPrefix}_sms_tie_in_breaker_rating_override`,
        pcs_settings: `${sysPrefix}_pcs_settings`,
      });

      const fieldMapping = getFieldMapping(selectedSystem, systemPrefix);

      // Build database updates object
      const dbUpdates = {};
      const stateUpdates = {};

      fieldUpdates.forEach(([field, value]) => {
        // Update local state object
        stateUpdates[field] = value;

        // BOS fields already match database schema - use directly
        const isBOSField =
          field.startsWith("bos_sys") ||
          field.startsWith("post_sms_bos_sys") ||
          field.startsWith("postcombine_");
        const dbFieldName = isBOSField ? field : fieldMapping[field];

        if (!dbFieldName) {
          logger.warn("EquipmentForm", `No field mapping found for: ${field}`);
          return;
        }

        // Handle special value transformations
        let dbValue = value;

        // Invert "isNew" fields to "existing" fields
        if (field.endsWith("_isnew")) {
          dbValue = !value; // isNew=true means existing=false
        }
        // Invert _existing fields that map to _is_new DB columns (opposite conventions)
        if (field.endsWith("_existing") && dbFieldName && dbFieldName.endsWith("_is_new")) {
          dbValue = !value; // existing=true means is_new=false
        }

        // Convert empty strings to null for database
        if (dbValue === "") {
          dbValue = null;
        }

        dbUpdates[dbFieldName] = dbValue;

        // No special handling needed for gateway - it now maps directly to sys1_teslagatewaytype
      });

      // Update local state immediately (optimistic update)
      setFormData((prev) => ({
        ...prev,
        ...stateUpdates,
      }));

      // Batch save to database
      try {
        if (Object.keys(dbUpdates).length > 0) {
          await updateFields(dbUpdates);
          logger.log(
            "EquipmentForm",
            `Batch saved ${Object.keys(dbUpdates).length} fields:`,
            dbUpdates,
          );
        }
      } catch (error) {
        logger.error("EquipmentForm", "Failed to batch save fields:", error);
      }
    },
    [selectedSystem, updateFields],
  ); // Dependencies: selectedSystem for prefix, updateFields for API call
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    systemDetailsRef.current = systemDetails;
  }, [systemDetails]);

  // Load equipment data from systemDetails hook
  // Reloads form data when selectedSystem changes
  useEffect(() => {
    if (systemDetails) {
      logger.log(
        "EquipmentForm",
        `Loading equipment data for System ${selectedSystem}`,
      );
      const hydratedData = hydrateFormData(selectedSystem);
      if (hydratedData) {
        setFormData((prev) => ({
          ...prev,
          ...hydratedData,
          // Load global combine systems fields (not system-specific)
          // Check both field names for backwards compatibility
          combine_systems:
            systemDetails.ele_combine_systems !== undefined
              ? systemDetails.ele_combine_systems
              : systemDetails.combine_systems !== undefined
                ? systemDetails.combine_systems
                : null,
          ele_combine_positions: systemDetails.ele_combine_positions || "",
        }));
      }
    } else if (!systemLoading) {
      // systemDetails is null and not loading = new project
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemDetails, systemLoading, selectedSystem]); // Removed hydrateFormData to prevent loop

  // Auto-show systems that have data (on initial load)
  // IMPORTANT: Only ADD systems with data, never REMOVE manually-added systems
  useEffect(() => {
    if (!systemDetails) return;

    const systemsWithData = [];
    for (let i = 1; i <= maxSystems; i++) {
      if (checkSystemHasDataUtil(systemDetails, i)) {
        systemsWithData.push(i);
      }
    }

    // Merge: add any systems with data that aren't already visible
    // Never remove systems - user may have manually added an empty system
    const systemsToAdd = systemsWithData.filter(
      (s) => !visibleSystems.includes(s),
    );

    if (systemsToAdd.length > 0) {
      setVisibleSystems((prev) =>
        [...prev, ...systemsToAdd].sort((a, b) => a - b),
      );
    }
  }, [systemDetails, maxSystems]); // REMOVED visibleSystems from dependencies to prevent loop

  // Auto-populate battery fields when PowerWall is detected
  useEffect(() => {
    const make = formData.inverter_make;
    const model = formData.inverter_model;
    const expansionPacks = formData.expansionPacks ?? 0;

    // Only auto-populate for Tesla PowerWall
    if (!isTeslaPowerWall(make, model)) {
      return;
    }

    const isPW3 = isPowerWall3(model);
    const isPWPlus = isPowerWallPlus(model);
    const batteryQty = parseInt(expansionPacks) + 1; // Base battery + expansion packs
    const batteryModel = isPW3
      ? "PowerWall 3"
      : isPWPlus
        ? "PowerWall+"
        : "PowerWall";

    // Batch check what needs updating to avoid unnecessary re-renders
    const updates = [];

    if (formData.battery1_quantity !== batteryQty) {
      updates.push(["battery1_quantity", batteryQty]);
    }
    if (formData.battery1_make !== "Tesla") {
      updates.push(["battery1_make", "Tesla"]);
    }
    if (formData.battery1_model !== batteryModel) {
      updates.push(["battery1_model", batteryModel]);
    }

    // Apply batch updates if there are any changes
    if (updates.length > 0) {
      handleBatchFieldChange(updates);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.inverter_make,
    formData.inverter_model,
    formData.expansionPacks,
  ]);

  // Auto-populate equipment from assessment scraper (EnergyAid) with validation
  // This runs once when the component mounts with a valid projectUuid
  useEffect(() => {
    const pendingEquipment = sessionStorage.getItem("pendingEquipmentData");

    if (!pendingEquipment || !projectUuid) return;

    const validateAndPopulateEquipment = async () => {
      try {
        const equipment = JSON.parse(pendingEquipment);
        logger.log(
          "EquipmentForm",
          "âš¡ Auto-populating from assessment:",
          equipment,
        );

        // Validate equipment against database
        const validationResults = [];

        // Validate solar panel
        if (equipment.panel_make && equipment.panel_model) {
          try {
            const panelValidation = await axios.post("/equipment/validate", {
              equipment_type: "solar_panel",
              manufacturer: equipment.panel_make,
              model: equipment.panel_model,
            });

            if (panelValidation.data.status === "unmatched") {
              validationResults.push({
                type: "Solar Panel",
                original: {
                  manufacturer: equipment.panel_make,
                  model: equipment.panel_model,
                },
                suggestions: panelValidation.data.suggestions || [],
              });
            }
          } catch (error) {
            logger.warn("EquipmentForm", "Panel validation failed:", error);
          }
        }

        // Validate inverter
        if (equipment.inverter_make && equipment.inverter_model) {
          try {
            const inverterValidation = await axios.post("/equipment/validate", {
              equipment_type: "inverter",
              manufacturer: equipment.inverter_make,
              model: equipment.inverter_model,
            });

            if (inverterValidation.data.status === "unmatched") {
              validationResults.push({
                type: "Inverter",
                original: {
                  manufacturer: equipment.inverter_make,
                  model: equipment.inverter_model,
                },
                suggestions: inverterValidation.data.suggestions || [],
              });
            }
          } catch (error) {
            logger.warn("EquipmentForm", "Inverter validation failed:", error);
          }
        }

        // Validate battery
        if (equipment.battery_make && equipment.battery_model) {
          try {
            const batteryValidation = await axios.post("/equipment/validate", {
              equipment_type: "battery",
              manufacturer: equipment.battery_make,
              model: equipment.battery_model,
            });

            if (batteryValidation.data.status === "unmatched") {
              validationResults.push({
                type: "Battery",
                original: {
                  manufacturer: equipment.battery_make,
                  model: equipment.battery_model,
                },
                suggestions: batteryValidation.data.suggestions || [],
              });
            }
          } catch (error) {
            logger.warn("EquipmentForm", "Battery validation failed:", error);
          }
        }

        // If we have unmatched equipment, show validation modal
        if (validationResults.length > 0) {
          logger.log(
            "EquipmentForm",
            "âš ï¸ Equipment validation warnings:",
            validationResults,
          );
          setPendingEquipmentToPopulate(equipment);
          setEquipmentValidationResults(validationResults);
          setShowEquipmentValidationModal(true);
        } else {
          // All equipment validated successfully - auto-populate immediately
          applyEquipmentData(equipment);
        }

        // Clear the pending data from sessionStorage
        sessionStorage.removeItem("pendingEquipmentData");
      } catch (error) {
        logger.error(
          "EquipmentForm",
          "Failed to validate/populate equipment:",
          error,
        );
        sessionStorage.removeItem("pendingEquipmentData");
      }
    };

    validateAndPopulateEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid]); // Only run when projectUuid is available

  // Helper function to apply equipment data to form
  const applyEquipmentData = useCallback(
    (equipment) => {
      const updates = [];

      // Map assessment equipment to sys1 fields
      if (equipment.panel_make) {
        updates.push(["solar_panel_make", equipment.panel_make]);
      }
      if (equipment.panel_model) {
        updates.push(["solar_panel_model", equipment.panel_model]);
      }
      if (equipment.panel_quantity) {
        updates.push(["solar_panel_qty", equipment.panel_quantity]);
      }
      if (equipment.inverter_make) {
        updates.push(["inverter_make", equipment.inverter_make]);
      }
      if (equipment.inverter_model) {
        updates.push(["inverter_model", equipment.inverter_model]);
      }
      if (equipment.battery_make) {
        updates.push(["battery1_make", equipment.battery_make]);
      }
      if (equipment.battery_model) {
        updates.push(["battery1_model", equipment.battery_model]);
      }
      if (equipment.battery_quantity) {
        updates.push(["battery1_quantity", equipment.battery_quantity]);
      }

      // Apply updates if we have any
      if (updates.length > 0) {
        // Use batch update for better performance
        handleBatchFieldChange(updates);

        // Also persist to database
        const updatesObj = Object.fromEntries(updates);
        updateFields(updatesObj);

        toast.success("Equipment auto-populated from assessment!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    },
    [handleBatchFieldChange, updateFields],
  );

  // Handler for when user selects a suggestion from validation modal
  const handleEquipmentSuggestionSelect = useCallback(
    (equipmentType, suggestion) => {
      if (!pendingEquipmentToPopulate) return;

      // Update the pending equipment with the selected suggestion
      const updatedEquipment = { ...pendingEquipmentToPopulate };

      if (equipmentType === "Solar Panel") {
        updatedEquipment.panel_make = suggestion.manufacturer;
        updatedEquipment.panel_model = suggestion.model;
      } else if (equipmentType === "Inverter") {
        updatedEquipment.inverter_make = suggestion.manufacturer;
        updatedEquipment.inverter_model = suggestion.model;
      } else if (equipmentType === "Battery") {
        updatedEquipment.battery_make = suggestion.manufacturer;
        updatedEquipment.battery_model = suggestion.model;
      }

      // Apply the updated equipment
      applyEquipmentData(updatedEquipment);

      // Close modal
      setShowEquipmentValidationModal(false);
      setPendingEquipmentToPopulate(null);
      setEquipmentValidationResults([]);

      toast.success(
        `${equipmentType} updated to: ${suggestion.manufacturer} ${suggestion.model}`,
        {
          position: "top-right",
          autoClose: 3000,
        },
      );
    },
    [pendingEquipmentToPopulate, applyEquipmentData],
  );

  // Handler for proceeding with original values despite validation warnings
  const handleProceedWithOriginalValues = useCallback(() => {
    if (!pendingEquipmentToPopulate) return;

    // Apply original equipment data
    applyEquipmentData(pendingEquipmentToPopulate);

    // Close modal
    setShowEquipmentValidationModal(false);
    setPendingEquipmentToPopulate(null);
    setEquipmentValidationResults([]);

    toast.info("Equipment populated with original assessment values", {
      position: "top-right",
      autoClose: 3000,
    });
  }, [pendingEquipmentToPopulate, applyEquipmentData]);

  // Sync Gateway selection with SMS fields
  // Gateway 2 and Gateway 3 auto-populate SMS for PowerWall systems
  useEffect(() => {
    const gateway = formData.gateway;
    const isPowerWall = isTeslaPowerWall(
      formData.inverter_make,
      formData.inverter_model,
    );
    const prevGateway = prevGatewayRef.current;

    // Only relevant for PowerWall systems
    if (!isPowerWall) {
      prevGatewayRef.current = gateway;
      return;
    }

    // Skip if gateway hasn't changed
    if (gateway === prevGateway) {
      return;
    }

    // Backup Gateway 2 selected - auto-populate SMS
    if (gateway === "Backup Gateway 2") {
      const updates = [];
      if (formData.sms_make !== "Tesla") {
        updates.push(["sms_make", "Tesla"]);
      }
      if (formData.sms_model !== "Backup Gateway 2") {
        updates.push(["sms_model", "Backup Gateway 2"]);
      }
      if (formData.sms_existing !== false) {
        updates.push(["sms_existing", false]); // true = new equipment
      }
      if (updates.length > 0) {
        handleBatchFieldChange(updates);
      }
    }

    // Gateway 3 selected - auto-populate SMS + ESS equipment type
    if (gateway === "Gateway 3") {
      const updates = [];
      if (formData.sms_make !== "Tesla") {
        updates.push(["sms_make", "Tesla"]);
      }
      if (formData.sms_model !== "Gateway 3") {
        updates.push(["sms_model", "Gateway 3"]);
      }
      if (formData.sms_existing !== false) {
        updates.push(["sms_existing", false]); // true = new equipment
      }
      // Gateway 3 specific - set SMS equipment type
      if (formData.sms_equipment_type !== "SMS") {
        updates.push(["sms_equipment_type", "SMS"]);
      }
      if (updates.length > 0) {
        handleBatchFieldChange(updates);
      }
    }

    // Changed FROM Backup Gateway 2 to something else - clear SMS if auto-set
    if (prevGateway === "Backup Gateway 2" && gateway !== "Backup Gateway 2") {
      // Only clear if SMS was auto-populated by Backup Gateway 2
      if (
        formData.sms_make === "Tesla" &&
        formData.sms_model === "Backup Gateway 2"
      ) {
        handleBatchFieldChange([
          ["sms_make", ""],
          ["sms_model", ""],
          ["sms_existing", false],
        ]);
      }
    }

    // Changed FROM Gateway 3 to something else - clear SMS if auto-set
    if (prevGateway === "Gateway 3" && gateway !== "Gateway 3") {
      // Only clear if SMS was auto-populated by Gateway 3
      if (formData.sms_make === "Tesla" && formData.sms_model === "Gateway 3") {
        handleBatchFieldChange([
          ["sms_make", ""],
          ["sms_model", ""],
          ["sms_existing", false],
          ["sms_equipment_type", ""],
        ]);
      }
    }

    // Update ref for next render
    prevGatewayRef.current = gateway;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.gateway,
    formData.inverter_make,
    formData.inverter_model,
    formData.sms_make,
    formData.sms_model,
    formData.sms_equipment_type,
  ]);

  // Auto-set Daisy Chain configuration when expansion packs are added
  useEffect(() => {
    const isPowerWall = isTeslaPowerWall(
      formData.inverter_make,
      formData.inverter_model,
    );
    if (!isPowerWall) return;

    const expansionPacks = formData.expansionPacks ?? 0;
    const currentConfig = formData.battery1_configuration;

    // Set Daisy Chain when expansion packs > 0
    if (expansionPacks > 0 && currentConfig !== "Daisy Chain") {
      handleFieldChange("battery1_configuration", "Daisy Chain");
    }
    // Clear Daisy Chain when expansion packs = 0 (only if it was auto-set)
    else if (expansionPacks === 0 && currentConfig === "Daisy Chain") {
      handleFieldChange("battery1_configuration", "");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.inverter_make,
    formData.inverter_model,
    formData.expansionPacks,
    formData.battery1_configuration,
  ]);

  // Clear gateway fields when "No Backup" is selected
  useEffect(() => {
    const isPowerWall = isTeslaPowerWall(
      formData.inverter_make,
      formData.inverter_model,
    );
    if (!isPowerWall) return;

    // When "No Backup" is selected, clear all gateway-related fields
    if (formData.backup_option === "No Backup") {
      const fieldsToClear = [];

      if (formData.gateway) {
        fieldsToClear.push(["gateway", ""]);
      }
      if (formData.backupSwitchLocation) {
        fieldsToClear.push(["backupSwitchLocation", ""]);
      }
      // Clear SMS fields if they were auto-populated by gateway selection
      if (
        formData.sms_make === "Tesla" &&
        (formData.sms_model === "Backup Gateway 2" ||
          formData.sms_model === "Gateway 3")
      ) {
        fieldsToClear.push(["sms_make", ""]);
        fieldsToClear.push(["sms_model", ""]);
        fieldsToClear.push(["sms_existing", false]);
      }
      if (formData.sms_equipment_type) {
        fieldsToClear.push(["sms_equipment_type", ""]);
      }

      if (fieldsToClear.length > 0) {
        handleBatchFieldChange(fieldsToClear);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.inverter_make, formData.inverter_model, formData.backup_option]);

  // Auto-sync inverter quantity based on type
  // - String inverters: Always qty = 1
  // - Microinverters (non-Hoymiles/APSystems): qty = solar panel count (1:1 ratio)
  // - Hoymiles/APSystems microinverters: Manual entry (2:1, 4:1 ratios)
  useEffect(() => {
    const inverterType = formData.inverter_type;
    const inverterMake = formData.inverter_make;
    const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
    const currentQty = parseInt(formData.inverter_qty) || 0;

    // String inverters: Always set qty to 1
    if (
      inverterType === "inverter" ||
      (inverterType && inverterType !== "microinverter")
    ) {
      if (currentQty !== 1) {
        handleFieldChange("inverter_qty", 1);
        logger.log("EquipmentForm", `Auto-set string inverter qty to 1`);
      }
      return;
    }

    // Microinverters: Auto-sync with panel count (except Hoymiles/APSystems)
    if (inverterType === "microinverter") {
      // Skip for Hoymiles/APSystems - they have variable ratios (2:1, 4:1)
      const isDualQtyManufacturer =
        inverterMake === "Hoymiles" ||
        inverterMake === "Hoymiles Power" ||
        inverterMake === "APSystems";

      if (isDualQtyManufacturer) {
        return;
      }

      // For standard microinverters (Enphase, etc.), qty = solar panel count
      // Only update if different to avoid unnecessary saves
      if (currentQty !== solarPanelQty) {
        handleFieldChange("inverter_qty", solarPanelQty);
        logger.log(
          "EquipmentForm",
          `Auto-synced microinverter qty to ${solarPanelQty} (matches solar panel count)`,
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.solar_panel_quantity,
    formData.inverter_type,
    formData.inverter_make,
  ]);

  // Debounce BOS inverter calculation inputs to prevent excessive API calls
  const bosInverterInputKey = useMemo(
    () =>
      JSON.stringify({
        inverterType: formData.inverter_type,
        inverterMake: formData.inverter_make,
        inverterModel: formData.inverter_model,
        inverterQty: formData.inverter_qty,
        selectedSystem,
      }),
    [
      formData.inverter_type,
      formData.inverter_make,
      formData.inverter_model,
      formData.inverter_qty,
      selectedSystem,
    ],
  );

  const debouncedBosInverterInputKey = useDebouncedValue(
    bosInverterInputKey,
    500,
  );

  // Calculate max continuous output when inverter/microinverter is selected (DEBOUNCED)
  useEffect(() => {
    if (!debouncedBosInverterInputKey) return;

    const calculateInverterOutput = async () => {
      // Determine if this is a microinverter based on inverter_type field
      const isMicro = formData.inverter_type === "microinverter";

      // formData uses simple field names (not sys{N}_ prefixed)
      const inverterMake = formData.inverter_make;
      const inverterModel = formData.inverter_model;
      const microQty = isMicro ? parseInt(formData.inverter_qty) || 0 : 1;

      // Guard: Check required fields
      if (!inverterMake || !inverterModel) {
        setMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: null,
        }));
        return;
      }

      setLoadingMaxOutput(true);

      try {
        // Step 1: Fetch inverter models by manufacturer
        const modelsResponse = await fetch(
          `https://api.skyfireapp.io/api/inverters/models?manufacturer=${encodeURIComponent(inverterMake)}`,
        );
        const modelsData = await modelsResponse.json();

        if (!modelsData?.success || !modelsData?.data) {
          console.warn("No inverter models found for:", inverterMake);
          setMaxContinuousOutputAmpsPerSystem((prev) => ({
            ...prev,
            [selectedSystem]: null,
          }));
          return;
        }

        // Step 2: Match selected model
        // Special handling for PowerWall 3 - normalize format for matching
        const isPowerWall3 = inverterModel && inverterModel.toLowerCase().includes('powerwall 3');
        const normalizedModel = isPowerWall3
          ? inverterModel.replace(/\s+kw/gi, 'kW').replace(/powerwall/i, 'PowerWall') // Normalize to "PowerWall 3 (11.5kW)"
          : inverterModel;

        const matchedInverter = modelsData.data.find(
          (inv) =>
            inv.model_number === inverterModel ||
            inv.name === inverterModel ||
            `${inv.manufacturer} ${inv.model_number}` === inverterModel ||
            // Try normalized version for PowerWall 3
            (isPowerWall3 && (
              inv.model_number === normalizedModel ||
              inv.name === normalizedModel
            )),
        );

        if (!matchedInverter?.id) {
          console.warn("No matching inverter found for model:", inverterModel, "normalized:", normalizedModel);
          setMaxContinuousOutputAmpsPerSystem((prev) => ({
            ...prev,
            [selectedSystem]: null,
          }));
          return;
        }

        // Step 3: Fetch inverter details
        const detailsResponse = await fetch(
          `https://api.skyfireapp.io/api/inverters/${matchedInverter.id}`,
        );
        const detailsData = await detailsResponse.json();

        // Step 4: Extract max continuous output amps
        const maxAmps = detailsData?.data?.max_cont_output_amps;

        if (!maxAmps) {
          console.warn("No max_cont_output_amps found for inverter");
          setMaxContinuousOutputAmpsPerSystem((prev) => ({
            ...prev,
            [selectedSystem]: null,
          }));
          return;
        }

        // Step 5: Apply quantity multiplier for microinverters
        const totalAmps = isMicro ? maxAmps * microQty : maxAmps;

        // Step 6: Update state for THIS SYSTEM ONLY
        setMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: Math.round(totalAmps),
        }));
      } catch (error) {
        console.error("Error calculating inverter output:", error);
        setMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: null,
        }));
      } finally {
        setLoadingMaxOutput(false);
      }
    };

    calculateInverterOutput();
  }, [debouncedBosInverterInputKey]); // Debounced - only runs 500ms after last change

  // Franklin ISC fallback values (if API doesn't return ISC)
  const FRANKLIN_ISC_FALLBACKS = {
    aPower: 20.8,
    "aPower 2": 10,
    "aPower S": 10,
  };

  // Debounce BOS battery calculation inputs to prevent excessive API calls
  const bosBatteryInputKey = useMemo(
    () =>
      JSON.stringify({
        batteryMake: formData.battery1_make,
        batteryModel: formData.battery1_model,
        batteryQty: formData.battery1_quantity,
        selectedSystem,
      }),
    [
      formData.battery1_make,
      formData.battery1_model,
      formData.battery1_quantity,
      selectedSystem,
    ],
  );

  const debouncedBosBatteryInputKey = useDebouncedValue(
    bosBatteryInputKey,
    500,
  );

  // Calculate battery max continuous output when battery is selected (DEBOUNCED)
  useEffect(() => {
    if (!debouncedBosBatteryInputKey) return;

    const calculateBatteryOutput = async () => {
      // formData uses simple field names (not sys{N}_ prefixed)
      const batteryMake = formData.battery1_make;
      const batteryModel = formData.battery1_model;
      const batteryQty = parseInt(formData.battery1_quantity) || 1;

      // Guard: Check required fields
      if (!batteryMake || !batteryModel) {
        setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: null,
        }));
        return;
      }

      // Special case: Tesla batteries always 48A (no quantity multiplier)
      if (batteryMake.toLowerCase().includes("tesla")) {
        setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: 48,
        }));
        return;
      }

      try {
        // Use cached GET to prevent duplicate API calls
        const { cachedGet } = await import("../../config/axios");
        const axiosInstance = (await import("../../config/axios")).default;

        const response = await cachedGet(
          `/api/batteries/models?manufacturer=${encodeURIComponent(batteryMake)}`,
          {},
          axiosInstance,
        );

        const data = response.data;

        if (!data?.success || !data?.data) {
          console.warn("No battery data found for:", batteryMake);
          setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
            ...prev,
            [selectedSystem]: null,
          }));
          return;
        }

        // Match selected battery model
        const matchedBattery = data.data.find(
          (bat) =>
            bat.model_number === batteryModel ||
            bat.name === batteryModel ||
            bat.model === batteryModel,
        );

        // Extract ISC value (priority order)
        let iscValue =
          matchedBattery?.overcurrent_isc ||
          matchedBattery?.isc ||
          matchedBattery?.overcurrent ||
          matchedBattery?.short_circuit_current ||
          matchedBattery?.max_short_circuit_current ||
          null;

        // Fallback for Franklin batteries
        if (!iscValue && batteryMake.toLowerCase().includes("franklin")) {
          for (const [key, fallbackISC] of Object.entries(
            FRANKLIN_ISC_FALLBACKS,
          )) {
            if (batteryModel.includes(key)) {
              iscValue = fallbackISC;
              break;
            }
          }
        }

        if (!iscValue) {
          console.warn("No ISC value found for battery:", batteryModel);
          setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
            ...prev,
            [selectedSystem]: null,
          }));
          return;
        }

        // Calculate: ISC Ã— quantity Ã— 1.25
        const totalAmps = iscValue * batteryQty * 1.25;
        setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: Math.round(totalAmps),
        }));
      } catch (error) {
        console.error("Error calculating battery output:", error);
        setBatteryMaxContinuousOutputAmpsPerSystem((prev) => ({
          ...prev,
          [selectedSystem]: null,
        }));
      }
    };

    calculateBatteryOutput();
  }, [debouncedBosBatteryInputKey]); // Debounced - only runs 500ms after last change

  // Calculate Post-SMS minimum amp rating filter
  // Uses MAX of backup panel, utility service, and inverter output, then DIVIDES by 1.25
  // (BOS section will multiply by 1.25, so this prevents double-application)
  const postSMSMinAmpFilter = useMemo(() => {
    // formData uses simple field names (not sys{N}_ prefixed)
    const backupBusRating = parseInt(formData.backup_panel_bus_amps) || 0;
    const utilityServiceAmps = parseInt(formData.utility_service_amps) || 0;
    const inverterAmps = maxContinuousOutputAmpsPerSystem[selectedSystem] || 0;

    const desiredMinAmps = Math.max(
      backupBusRating,
      utilityServiceAmps,
      inverterAmps,
      100, // NEC minimum default
    );

    // CRITICAL: Divide by 1.25 because BOS section will multiply by 1.25
    const filterValue = desiredMinAmps / 1.25;

    return filterValue;
  }, [
    formData.backup_panel_bus_amps,
    formData.utility_service_amps,
    maxContinuousOutputAmpsPerSystem,
    selectedSystem,
  ]);

  // NOTE: Field mapping is now handled dynamically in handleFieldChange()
  // to avoid async state update issues with multi-system support

  // Handle field changes and auto-save to system-details endpoint
  // Memoized to prevent child component re-renders
  const handleFieldChange = useCallback(
    async (field, value, overrideSystemNumber = null) => {
      console.log("[handleFieldChange] ENTRY:", field, value, "sys:", overrideSystemNumber);
      // Debug logging for show_solar_panel_2
      if (field === "show_solar_panel_2") {
        console.log(
          "[EquipmentForm handleFieldChange] show_solar_panel_2 called",
          {
            field,
            value,
            overrideSystemNumber,
            stack: new Error().stack,
          },
        );
      }

      // Use refs to access latest values without making them dependencies
      const currentFormData = formDataRef.current;
      const currentSystemDetails = systemDetailsRef.current;

      // BOS fields already match database schema - save directly without mapping
      const isBOSField =
        field.startsWith("bos_sys") ||
        field.startsWith("post_sms_bos_sys") ||
        field.startsWith("postcombine_");

      // Use override system number if provided, otherwise use selected system
      const systemNum =
        overrideSystemNumber !== null ? overrideSystemNumber : selectedSystem;
      const systemPrefix = SYSTEM_PREFIXES[systemNum];

      // Debug logging for batteryonly field
      if (field === "batteryonly") {
        console.log(
          `[EquipmentForm handleFieldChange] batteryonly field change:`,
          {
            field,
            value,
            overrideSystemNumber,
            selectedSystem,
            systemNum,
            systemPrefix,
          },
        );
      }

      // Build field mapping for the specific system
      const getFieldMapping = (sysNum, sysPrefix) => ({
        // Solar Panel
        solar_panel_existing: getSchemaField(sysNum, "solar_panel_existing"),
        solar_panel_make: `${sysPrefix}_solar_panel_make`,
        solar_panel_model: `${sysPrefix}_solar_panel_model`,
        solar_panel_model_id: getSchemaField(sysNum, "solarpanel_id"),
        // solar_panel_wattage removed - spec sheet derived, not in DB
        solar_panel_quantity: `${sysPrefix}_solar_panel_qty`,

        // Solar Panel Type 2 (for mixed systems)
        solar_panel_type2_is_new: `${sysPrefix}_solar_panel_type2_is_new`,
        solar_panel_type2_manufacturer: `${sysPrefix}_solar_panel_type2_manufacturer`,
        solar_panel_type2_model: `${sysPrefix}_solar_panel_type2_model`,
        solar_panel_type2_quantity: `${sysPrefix}_solar_panel_type2_quantity`,
        show_solar_panel_2: `${sysPrefix}_show_second_panel_type`,
        batteryonly: `${sysPrefix}_batteryonly`,

        // System Type
        system_type: `${sysPrefix}_system_type`,

        // Inverter/Microinverter
        inverter_existing: getSchemaField(sysNum, "micro_inverter_existing"),
        inverter_make: `${sysPrefix}_micro_inverter_make`,
        inverter_model: `${sysPrefix}_micro_inverter_model`,
        inverter_model_id: `${sysPrefix}_micro_inverter_id`,
        // inverter_type removed - derived from sys1_selectedsystem, not in DB
        inverter_max_cont_output_amps: `${sysPrefix}_inv_max_continuous_output`,
        inverter_qty: `${sysPrefix}_micro_inverter_qty`,
        sys1_ap_hoy_breaker_size: "sys1_ap_hoy_breaker_size",

        // SolarEdge multi-kW
        solaredge_partnumber: `${sysPrefix}_solaredge_partnumber`,
        solaredge_setting: `${sysPrefix}_solaredge_setting`,

        // Optimizer
        optimizer_existing: getSchemaField(sysNum, "optimizer_existing"),
        optimizer_make: `${sysPrefix}_optimizer_make`,
        optimizer_model: `${sysPrefix}_optimizer_model`,

        // Type 2 Optimizer
        optimizer_type2_existing: getSchemaField(sysNum, "optimizer_type2_existing"),
        optimizer_type2_make: `${sysPrefix}_optimizer_type2_make`,
        optimizer_type2_model: `${sysPrefix}_optimizer_type2_model`,

        // String Combiner Panel
        combiner_panel_existing: `${sysPrefix}_combiner_existing`,
        combiner_panel_make: `${sysPrefix}_combiner_panel_make`,
        combiner_panel_model: `${sysPrefix}_combiner_panel_model`,
        combiner_panel_bus_amps: `${sysPrefix}_combinerpanel_bus_rating`,
        combiner_panel_main_breaker: `${sysPrefix}_combinerpanel_main_breaker_rating`,
        combiner_panel_tie_in_breaker: `${sysPrefix}_combiner_panel_tie_in_breaker`,
        aggregate_pv_breaker: `${sysPrefix}_aggregate_pv_breaker`,

        // BOS Visibility Flags - NOT stored in DB, but used for local state
        show_inverter_bos: `${sysPrefix}_show_inverter_bos`,
        show_battery1_bos: `${sysPrefix}_show_battery1_bos`,
        show_battery2_bos: `${sysPrefix}_show_battery2_bos`,

        // ESS Section Visibility Flags - NOT stored in DB, but used for local state
        show_sms: `${sysPrefix}_show_sms`,
        show_battery1: `${sysPrefix}_show_battery1`,
        show_battery2: `${sysPrefix}_show_battery2`,
        show_backup_panel: `${sysPrefix}_show_backup_panel`,

        // Stringing
        stringing_type: `${sysPrefix}_stringing_type`,
        branch_string_1: `${sysPrefix}_branch_string_1`,
        branch_string_2: `${sysPrefix}_branch_string_2`,
        branch_string_3: `${sysPrefix}_branch_string_3`,
        branch_string_4: `${sysPrefix}_branch_string_4`,
        branch_string_5: `${sysPrefix}_branch_string_5`,
        branch_string_6: `${sysPrefix}_branch_string_6`,
        branch_string_7: `${sysPrefix}_branch_string_7`,
        branch_string_8: `${sysPrefix}_branch_string_8`,
        branch_string_9: `${sysPrefix}_branch_string_9`,
        branch_string_10: `${sysPrefix}_branch_string_10`,
        // Panel type for each string
        branch_string_1_panel_type: `${sysPrefix}_branch_string_1_panel_type`,
        branch_string_2_panel_type: `${sysPrefix}_branch_string_2_panel_type`,
        branch_string_3_panel_type: `${sysPrefix}_branch_string_3_panel_type`,
        branch_string_4_panel_type: `${sysPrefix}_branch_string_4_panel_type`,
        branch_string_5_panel_type: `${sysPrefix}_branch_string_5_panel_type`,
        branch_string_6_panel_type: `${sysPrefix}_branch_string_6_panel_type`,
        branch_string_7_panel_type: `${sysPrefix}_branch_string_7_panel_type`,
        branch_string_8_panel_type: `${sysPrefix}_branch_string_8_panel_type`,
        branch_string_9_panel_type: `${sysPrefix}_branch_string_9_panel_type`,
        branch_string_10_panel_type: `${sysPrefix}_branch_string_10_panel_type`,

        // String Inverter Panels Per String - removed, not in calc or DB
        // sys1_branch_string_* are the real columns (already mapped above)

        // Hoymiles/APSystems Granular Microinverter Panel Tracking
        micro1Panels: `${sysPrefix}_micro1Panels`,
        micro2Panels: `${sysPrefix}_micro2Panels`,
        micro3Panels: `${sysPrefix}_micro3Panels`,
        micro4Panels: `${sysPrefix}_micro4Panels`,
        micro5Panels: `${sysPrefix}_micro5Panels`,
        micro6Panels: `${sysPrefix}_micro6Panels`,
        micro7Panels: `${sysPrefix}_micro7Panels`,
        micro8Panels: `${sysPrefix}_micro8Panels`,
        micro9Panels: `${sysPrefix}_micro9Panels`,
        micro10Panels: `${sysPrefix}_micro10Panels`,
        micro11Panels: `${sysPrefix}_micro11Panels`,
        micro12Panels: `${sysPrefix}_micro12Panels`,
        micro13Panels: `${sysPrefix}_micro13Panels`,
        micro14Panels: `${sysPrefix}_micro14Panels`,
        micro15Panels: `${sysPrefix}_micro15Panels`,
        micro16Panels: `${sysPrefix}_micro16Panels`,
        micro17Panels: `${sysPrefix}_micro17Panels`,
        micro18Panels: `${sysPrefix}_micro18Panels`,
        micro19Panels: `${sysPrefix}_micro19Panels`,
        micro20Panels: `${sysPrefix}_micro20Panels`,
        micro21Panels: `${sysPrefix}_micro21Panels`,
        micro22Panels: `${sysPrefix}_micro22Panels`,
        micro23Panels: `${sysPrefix}_micro23Panels`,
        micro24Panels: `${sysPrefix}_micro24Panels`,
        micro25Panels: `${sysPrefix}_micro25Panels`,

        // Energy Storage
        backup_option: `${sysPrefix}_backup_option`,
        backup_system_size: "utility_service_amps",

        // IQ Combiner 6C
        iq_combiner_config_id: `${sysPrefix}_iq_combiner_config_id`,
        meter_collar_location: `${sysPrefix}_meter_collar_setting`,
        iq_combiner_backup_type: `${sysPrefix}_iq_combiner_backup_type`,

        // IQ Meter Collar
        iq_meter_collar_type: `${sysPrefix}_meter_collar_setting`,

        // SMS
        sms_equipment_type: `${sysPrefix}_sms_equipment_type`,
        sms_existing: `${sysPrefix}_sms_existing`,
        sms_make: `${sysPrefix}_sms_make`,
        sms_model: `${sysPrefix}_sms_model`,
        sms_main_breaker: `${sysPrefix}_sms_breaker_rating`,
        // sms_pv_breaker removed - redundant, use sms_pv_breaker_rating_override
        // sms_ess_breaker removed - redundant, use sms_ess_breaker_rating_override
        // sms_tie_in_breaker removed - redundant, use sms_tie_in_breaker_rating_override
        sms_has_rsd: `${sysPrefix}_sms_rsd_enabled`,
        sms_backup_load_sub_panel_breaker_rating: `${sysPrefix}_sms_backup_load_sub_panel_breaker_rating`,
        sms_pv_breaker_rating_override: `${sysPrefix}_sms_pv_breaker_rating_override`,
        sms_ess_breaker_rating_override: `${sysPrefix}_sms_ess_breaker_rating_override`,
        sms_tie_in_breaker_rating_override: `${sysPrefix}_sms_tie_in_breaker_rating_override`,
        // System-specific SMS equipment type fields
        sys1_sms_equipment_type: "sys1_sms_equipment_type",
        sys2_sms_equipment_type: "sys2_sms_equipment_type",
        sys3_sms_equipment_type: "sys3_sms_equipment_type",
        sys4_sms_equipment_type: "sys4_sms_equipment_type",

        // Battery Type 1
        battery1_existing: `${sysPrefix}_battery1_existing`,
        battery1_quantity: `${sysPrefix}_battery_1_qty`,
        battery1_make: `${sysPrefix}_battery_1_make`,
        battery1_model: `${sysPrefix}_battery_1_model`,
        battery1_configuration: `${sysPrefix}_battery_configuration`,
        battery1_tie_in_location: `${sysPrefix}_battery1_tie_in_location`,
        // battery1_mount_type removed - not in DB or calc

        // Battery Type 2
        battery2_existing: `${sysPrefix}_battery2_existing`,
        battery2_quantity: `${sysPrefix}_battery_2_qty`,
        battery2_make: `${sysPrefix}_battery_2_make`,
        battery2_model: `${sysPrefix}_battery_2_model`,
        battery2_tie_in_location: `${sysPrefix}_battery2_tie_in_location`,
        // battery2_mount_type removed - not in DB or calc

        // Battery Combination Method (shared field for both battery types)
        [`sys${sysNum}_combination_method`]: `${sysPrefix}_combination_method`,

        // Backup Load Sub Panel
        backup_loads_landing: `${sysPrefix}_backupconfig`,
        backup_panel_selection: `${sysPrefix}_backupconfig_selectpanel`,
        backup_panel_existing: `bls${sysNum}_backuploader_existing`,
        backup_panel_make: `bls${sysNum}_backup_load_sub_panel_make`,
        backup_panel_model: `bls${sysNum}_backup_load_sub_panel_model`,
        backup_panel_bus_amps: `bls${sysNum}_backuploader_bus_bar_rating`,
        backup_panel_main_breaker: `bls${sysNum}_backuploader_main_breaker_rating`,
        backup_panel_tie_in_breaker: `bls${sysNum}_backuploader_upstream_breaker_rating`,
        backup_sp_tie_in_breaker_location: `sys${sysNum}_backup_sp_tie_in_breaker_location`,
        // Direct field mapping for bls1_backuploader_main_breaker_rating
        bls1_backuploader_main_breaker_rating:
          "bls1_backuploader_main_breaker_rating",

        // Battery Combiner Panel
        battery_combiner_panel_existing: `bcp${sysNum}_existing`,
        battery_combiner_panel_make: `bcp${sysNum}_make`,
        battery_combiner_panel_model: `bcp${sysNum}_model`,
        battery_combiner_panel_bus_amps: `bcp${sysNum}_busbar`,
        battery_combiner_panel_main_breaker: `bcp${sysNum}_mainbreaker1`,
        battery_combiner_panel_tie_in_breaker: `bcp${sysNum}_tieinbreaker`,

        // Tesla PowerWall Configuration
        expansionPacks: `${sysPrefix}_tesla_extensions`,
        gateway: `${sysPrefix}_teslagatewaytype`, // Maps to same field as teslagatewaytype
        teslagatewaytype: `${sysPrefix}_teslagatewaytype`,
        backupSwitchLocation: `${sysPrefix}_backupswitch_location`,
        batteryExisting: `battery${sysNum}_existing`,
        pcs_settings: `${sysPrefix}_pcs_settings`,

        // Gateway Configuration
        gatewayConfigIsNew: `${sysPrefix}_sms_existing`,
        gatewayConfigMainBreaker: `${sysPrefix}_sms_breaker_rating`,
        gatewayConfigBackupPanel: `${sysPrefix}_sms_backup_load_sub_panel_breaker_rating`,
        gatewayConfigActivatePCS: `${sysPrefix}_pcs_settings`,
        gatewayConfigPCSAmps: `${sysPrefix}_pcs_amps`,
        gatewayConfigPVBreaker: `${sysPrefix}_sms_pv_breaker_rating_override`,
        gatewayConfigESSBreaker: `${sysPrefix}_sms_ess_breaker_rating_override`,
        gatewayConfigTieInBreaker: `${sysPrefix}_sms_tie_in_breaker_rating_override`,

        // ESS Combiner
        ess_existing: `${sysPrefix}_ess_existing`,
        ess_make: `${sysPrefix}_ess_make`,
        ess_model: `${sysPrefix}_ess_model`,
        ess_main_breaker: `${sysPrefix}_ess_main_breaker_rating`,

        // Electrical (global, not system-specific)
        ele_ses_type: "ele_ses_type",
        ele_main_circuit_breakers_qty: "ele_main_circuit_breakers_qty",
        ele_bus_bar_rating: "ele_bus_bar_rating",
        ele_main_circuit_breaker_rating: "ele_main_circuit_breaker_rating",

        // Combine Systems (global, not system-specific)
        combine_systems: "ele_combine_systems", // Maps to database field ele_combine_systems
        ele_combine_positions: "ele_combine_positions",

        // Note: backup_option is system-specific (sys1_backup_option, sys2_backup_option, etc.)
        // It's defined earlier in the mapping as `${sysPrefix}_backup_option`
        // show_battery_type_2 removed - UI toggle, not in DB
      });

      const fieldMapping = getFieldMapping(systemNum, systemPrefix);

      // Get database field name from mapping or use field directly for BOS
      const dbFieldName = isBOSField ? field : fieldMapping[field];

      // Debug logging for batteryonly, backup_option, inverter_existing, show_solar_panel_2
      if (
        field === "batteryonly" ||
        field === "backup_option" ||
        field === "inverter_existing" ||
        field === "show_solar_panel_2"
      ) {
        console.log(
          `[EquipmentForm handleFieldChange] ${field} field mapping:`,
          {
            field,
            systemNum,
            systemPrefix,
            "fieldMapping[field]": fieldMapping[field],
            dbFieldName,
            value,
            "ends with _isnew": field.endsWith("_isnew"),
            "will save to DB as": { [dbFieldName]: value },
          },
        );
      }

      // Check if this is a visibility flag (state-only, not saved to DB)
      // Exception: show_solar_panel_2 maps to sys_show_second_panel_type in DB and MUST be saved
      const isVisibilityFlag = field.startsWith('show_') && field !== 'show_solar_panel_2';

      // Spec-derived fields: no DB mapping but still need local state updates for UI calculations
      // (e.g. solar_panel_type2_voc used for stringing range display in InverterMicroSection)
      const isSpecDerivedField = !dbFieldName && !isVisibilityFlag;

      if (isSpecDerivedField) {
        // Update local state only — no DB save
        // Store under both unprefixed name AND prefixed DB name so mergedFormDataBySystem can pick it up
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          [`${systemPrefix}_${field}`]: value,
        }));
        return;
      }

      // Update local state immediately (optimistic update) using the database field name
      // This ensures each system has its own state (e.g., sys1_micro_inverter_existing vs sys2_micro_inverter_existing)
      setFormData((prev) => {
        const updated = {
          ...prev,
        };

        // Store using DB field name to keep systems separate
        if (dbFieldName) {
          updated[dbFieldName] = value;
        }

        // ALSO store using component field name for immediate UI updates
        updated[field] = value;

        // Debug logging for show_solar_panel_2 and visibility flags
        if (field === "show_solar_panel_2" || isVisibilityFlag) {
          console.log(
            `[EquipmentForm handleFieldChange] setFormData for ${field}:`,
            {
              dbFieldName,
              field,
              value,
              isVisibilityFlag,
              "updated keys": Object.keys(updated).filter(k => updated[k] === value),
            },
          );
        }

        return updated;
      });

      // Skip database save for visibility flags (they're computed on load from actual equipment data)
      if (isVisibilityFlag) {
        console.log(
          `[EquipmentForm handleFieldChange] Skipping DB save for visibility flag: ${field}`,
        );
        return;
      }

      try {
        // Handle special value transformations
        let dbValue = value;

        // Invert "isNew" fields to "existing" fields
        if (field.endsWith("_isnew")) {
          dbValue = !value; // isNew=true means existing=false
        }
        // Invert _existing fields that map to _is_new DB columns (opposite conventions)
        if (field.endsWith("_existing") && dbFieldName && dbFieldName.endsWith("_is_new")) {
          dbValue = !value; // existing=true means is_new=false
        }

        // Convert empty strings to null for database
        if (dbValue === "") {
          dbValue = null;
        }

        // Save to system-details endpoint via hook
        // The hook automatically handles saving state and deduplication
        await updateField(dbFieldName, dbValue);

        // === TOGGLE PIGGYBACK (single path) ===
        // When saving any equipment field, auto-persist its group's _existing toggle.
        // Ensures toggle default (false = New) reaches DB even if user never clicks it.
        const _toggleField = getToggleForField(field);
        if (_toggleField) {
          const _toggleDbField = fieldMapping[_toggleField];
          if (_toggleDbField) {
            // Read current value from formData (hydration default, user click, or DB value)
            // Check both component field name and DB field name, fall back to false (= New)
            const _toggleValue =
              currentFormData[_toggleField] ??
              currentFormData[_toggleDbField] ??
              false;
            await updateField(_toggleDbField, _toggleValue);
            logger.log(
              "EquipmentForm",
              `Toggle piggyback: saved ${_toggleField} (${_toggleDbField}) = ${_toggleValue}`,
            );
          }
        }

        // Auto-activate system when key equipment is added (isDirty flag pattern)
        // Set sys{N}_selectedsystem field when user selects inverter model
        // This marks the system as "active" and shows the system button as highlighted
        if (field === "inverter_model" && value && value !== "") {
          const activateSystemPrefix = `sys${systemNum}`;
          const selectedSystemField = `${activateSystemPrefix}_selectedsystem`;

          // Determine system type from inverter type
          const inverterType = currentFormData.inverter_type || "inverter";
          const systemType =
            inverterType === "microinverter" ? "microinverter" : "inverter";

          // Only set if not already set
          if (
            !currentSystemDetails ||
            !currentSystemDetails[selectedSystemField]
          ) {
            await updateField(selectedSystemField, systemType);
            logger.log(
              "EquipmentForm",
              `Activated system ${systemNum} as ${systemType}`,
            );
          }

          // Auto-show Battery Type 2 for Duracell inverters
          const make = currentFormData.inverter_make;
          if (
            isDuracellInverter(make, value) &&
            !currentFormData.show_battery_type_2
          ) {
            logger.log(
              "EquipmentForm",
              "Duracell Inverter DETECTED - Auto-showing Battery Type 2 section",
            );
            handleFieldChange("show_battery_type_2", true);
          }
        }

        logger.log(
          "EquipmentForm",
          `Saved ${field} (${dbFieldName}) = ${dbValue} for system ${systemNum}`,
        );
      } catch (error) {
        logger.error("EquipmentForm", `Failed to save ${field}:`, error);
      }
    },
    [selectedSystem, updateField],
  ); // Dependencies: selectedSystem for system number, updateField for API calls

  /**
   * Handle Enphase 6C combiner selection
   * Auto-enables both battery inputs with Enphase 10C pre-selected
   */
  const handleEnphase6CChange = (is6C) => {
    logger.log(
      "EquipmentForm",
      `6C Combiner ${is6C ? "DETECTED" : "CLEARED"}`,
      {
        currentBackupOption: formData.backup_option,
        showBatteryType2: formData.show_battery_type_2,
      },
    );

    if (is6C) {
      // Check if Energy Storage System is enabled (backup_option is set)
      if (!formData.backup_option) {
        logger.log(
          "EquipmentForm",
          '6C Mode: Auto-enabling ESS with "No Backup"',
        );
        // Auto-enable ESS with "No Backup" since 6C has integrated SMS
        handleFieldChange("backup_option", "No Backup");
      }

      // Auto-enable Battery Type 2 section
      logger.log(
        "EquipmentForm",
        "6C Mode: Auto-showing Battery Type 2 section",
      );
      handleFieldChange("show_battery_type_2", true);

      // Note: Battery make/model will auto-select when user enters quantity > 0
      // This is handled in BatteryTypeSection via useEffect
    }
    // When 6C is deselected, we don't automatically remove battery data
    // User may have intentionally configured batteries
  };

  // Respond to initialSubTab when navigating back from other tabs
  useEffect(() => {
    if (initialSubTab) {
      setSelectedView(initialSubTab);
    }
  }, [initialSubTab]);

  // Determine if Combine step should be shown
  const showCombineStep = useMemo(() => {
    // Show combine if there are multiple systems with equipment data
    return formData.sys2_inverter_make && formData.sys2_inverter_model;
  }, [formData.sys2_inverter_make, formData.sys2_inverter_model]);

  // Check if Enphase Combiner 6C (has integrated SMS)
  const isEnphaseCombiner6C = useMemo(() => {
    const make = formData.combiner_panel_make?.toLowerCase();
    const model = formData.combiner_panel_model;
    return make === "enphase" && model?.includes("6C");
  }, [formData.combiner_panel_make, formData.combiner_panel_model]);

  // Calculate total batteries across both inputs for 6C mode
  const totalBatteries6C = useMemo(() => {
    if (!isEnphaseCombiner6C) return 0;
    const qty1 = parseInt(formData.battery1_quantity) || 0;
    const qty2 = parseInt(formData.battery2_quantity) || 0;
    return qty1 + qty2;
  }, [
    isEnphaseCombiner6C,
    formData.battery1_quantity,
    formData.battery2_quantity,
  ]);

  // Memoize merged form data for each visible system to prevent unnecessary re-renders
  const mergedFormDataBySystem = useMemo(() => {
    const merged = {};
    const prefix = (sysNum) => SYSTEM_PREFIXES[sysNum];

    visibleSystems.forEach((systemNumber) => {
      const systemFormData = hydrateFormData(systemNumber);
      if (systemFormData) {
        const sysPrefix = prefix(systemNumber);

        // Merge system form data with optimistic updates from formData
        // Check for system-specific database field names in formData and map back to component field names
        const batteryOnlyDbField = `${sysPrefix}_batteryonly`;
        const showSolarPanel2DbField = `${sysPrefix}_show_second_panel_type`;
        const optimisticUpdates = {
          show_solar_panel_2:
            formData[showSolarPanel2DbField] ??
            formData.show_solar_panel_2 ??
            systemFormData.show_solar_panel_2,
          batteryonly:
            formData[batteryOnlyDbField] ?? systemFormData.batteryonly,
        };

        // Map database field names back to component field names for this system
        const dbFieldName = getSchemaField(
          systemNumber,
          "micro_inverter_existing",
        );
        if (formData[dbFieldName] !== undefined) {
          optimisticUpdates.inverter_existing = formData[dbFieldName]; // Direct: both store "existing" semantics
        }

        const optimizerDbField = getSchemaField(
          systemNumber,
          "optimizer_existing",
        );
        if (formData[optimizerDbField] !== undefined) {
          optimisticUpdates.optimizer_existing = formData[optimizerDbField]; // Direct: both store "existing" semantics
        }

        // Map system-specific inverter fields to component field names
        // IMPORTANT: systemFormData already contains unprefixed component field names
        // because hydrateFormData() does the databaseâ†’component mapping
        // State stores fields using DATABASE field names (e.g., sys2_micro_inverter_make)
        // Component expects unprefixed names: 'inverter_make', 'inverter_model', etc.

        const inverterFieldMappings = [
          // Solar Panel fields
          {
            component: "solar_panel_make",
            state: `${sysPrefix}_solar_panel_make`,
          },
          {
            component: "solar_panel_model",
            state: `${sysPrefix}_solar_panel_model`,
          },
          {
            component: "solar_panel_model_id",
            state: `${sysPrefix}_solar_panel_model_id`,
          },
          {
            component: "solar_panel_quantity",
            state: `${sysPrefix}_solar_panel_qty`,
          },
          {
            component: "solar_panel_wattage",
            state: `${sysPrefix}_solar_panel_wattage`,
          },
          {
            component: "solar_panel_voc",
            state: `${sysPrefix}_solar_panel_voc`,
          },
          {
            component: "solar_panel_isc",
            state: `${sysPrefix}_solar_panel_isc`,
          },
          {
            component: "solar_panel_vmp",
            state: `${sysPrefix}_solar_panel_vmp`,
          },
          {
            component: "solar_panel_imp",
            state: `${sysPrefix}_solar_panel_imp`,
          },
          {
            component: "solar_panel_temp_coeff_voc",
            state: `${sysPrefix}_solar_panel_temp_coeff_voc`,
          },
          {
            component: "solar_panel_existing",
            state: getSchemaField(systemNumber, "solar_panel_existing"),
          },
          // Solar Panel Type 2 fields
          {
            component: "show_solar_panel_2",
            state: `${sysPrefix}_show_second_panel_type`,
          },
          {
            component: "solar_panel_type2_manufacturer",
            state: `${sysPrefix}_solar_panel_type2_manufacturer`,
          },
          {
            component: "solar_panel_type2_model",
            state: `${sysPrefix}_solar_panel_type2_model`,
          },
          {
            component: "solar_panel_type2_model_id",
            state: `${sysPrefix}_solar_panel_type2_model_id`,
          },
          {
            component: "solar_panel_type2_quantity",
            state: `${sysPrefix}_solar_panel_type2_qty`,
          },
          {
            component: "solar_panel_type2_wattage",
            state: `${sysPrefix}_solar_panel_type2_wattage`,
          },
          {
            component: "solar_panel_type2_voc",
            state: `${sysPrefix}_solar_panel_type2_voc`,
          },
          {
            component: "solar_panel_type2_isc",
            state: `${sysPrefix}_solar_panel_type2_isc`,
          },
          {
            component: "solar_panel_type2_vmp",
            state: `${sysPrefix}_solar_panel_type2_vmp`,
          },
          {
            component: "solar_panel_type2_imp",
            state: `${sysPrefix}_solar_panel_type2_imp`,
          },
          {
            component: "solar_panel_type2_temp_coeff_voc",
            state: `${sysPrefix}_solar_panel_type2_temp_coeff_voc`,
          },
          {
            component: "solar_panel_type2_is_new",
            state: getSchemaField(systemNumber, "solar_panel_type2_is_new"),
          },
          // Inverter fields
          {
            component: "inverter_make",
            state: `${sysPrefix}_micro_inverter_make`,
          },
          {
            component: "inverter_model",
            state: `${sysPrefix}_micro_inverter_model`,
          },
          {
            component: "inverter_model_id",
            state: `${sysPrefix}_micro_inverter_id`,
          },
          { component: "inverter_type", state: `${sysPrefix}_inverter_type` },
          {
            component: "inverter_qty",
            state: `${sysPrefix}_micro_inverter_qty`,
          },
          {
            component: "inverter_max_cont_output_amps",
            state: `${sysPrefix}_inv_max_continuous_output`,
          },
          {
            component: "inverter_max_strings_branches",
            state: `${sysPrefix}_inv_max_strings_branches`,
          },
          { component: "inverter_max_vdc", state: `${sysPrefix}_inv_max_vdc` },
          { component: "inverter_min_vdc", state: `${sysPrefix}_inv_min_vdc` },
          {
            component: "inverter_max_input_isc",
            state: `${sysPrefix}_inv_max_input_isc`,
          },
          // Optimizer fields
          { component: "optimizer_make", state: `${sysPrefix}_optimizer_make` },
          {
            component: "optimizer_model",
            state: `${sysPrefix}_optimizer_model`,
          },
          { component: "optimizer_qty", state: `${sysPrefix}_optimizer_qty` },
          // Type 2 Optimizer fields
          { component: "optimizer_type2_make", state: `${sysPrefix}_optimizer_type2_make` },
          {
            component: "optimizer_type2_model",
            state: `${sysPrefix}_optimizer_type2_model`,
          },
          // Stringing fields
          { component: "stringing_type", state: `${sysPrefix}_stringing_type` },
          {
            component: "branch_string_1",
            state: `${sysPrefix}_branch_string_1`,
          },
          {
            component: "branch_string_2",
            state: `${sysPrefix}_branch_string_2`,
          },
          {
            component: "branch_string_3",
            state: `${sysPrefix}_branch_string_3`,
          },
          {
            component: "branch_string_4",
            state: `${sysPrefix}_branch_string_4`,
          },
          {
            component: "branch_string_5",
            state: `${sysPrefix}_branch_string_5`,
          },
          {
            component: "branch_string_6",
            state: `${sysPrefix}_branch_string_6`,
          },
          {
            component: "branch_string_7",
            state: `${sysPrefix}_branch_string_7`,
          },
          {
            component: "branch_string_8",
            state: `${sysPrefix}_branch_string_8`,
          },
          {
            component: "branch_string_9",
            state: `${sysPrefix}_branch_string_9`,
          },
          {
            component: "branch_string_10",
            state: `${sysPrefix}_branch_string_10`,
          },
          // Gateway fields
          { component: "gateway", state: `${sysPrefix}_teslagatewaytype` },
          {
            component: "gateway_meter_type",
            state: `${sysPrefix}_gateway_meter_type`,
          },
          {
            component: "backup_loads_label",
            state: `${sysPrefix}_backup_loads_label`,
          },
          // BOS Visibility Flags
          {
            component: "show_inverter_bos",
            state: `${sysPrefix}_show_inverter_bos`,
          },
          {
            component: "show_battery1_bos",
            state: `${sysPrefix}_show_battery1_bos`,
          },
          {
            component: "show_battery2_bos",
            state: `${sysPrefix}_show_battery2_bos`,
          },
          // ESS Section Visibility Flags
          { component: "show_sms", state: `${sysPrefix}_show_sms` },
          { component: "show_battery1", state: `${sysPrefix}_show_battery1` },
          { component: "show_battery2", state: `${sysPrefix}_show_battery2` },
          {
            component: "show_backup_panel",
            state: `${sysPrefix}_show_backup_panel`,
          },
          // SMS fields (global, not system-specific)
          // IMPORTANT: State field names match what handleSystemBatchChange saves to formData
          { component: "sms_make", state: `${sysPrefix}_sms_make` },
          { component: "sms_model", state: `${sysPrefix}_sms_model` },
          { component: "sms_existing", state: `${sysPrefix}_sms_existing` },
          {
            component: "sms_main_breaker",
            state: `${sysPrefix}_sms_breaker_rating`,
          },
          {
            component: "sms_pv_breaker",
            state: `${sysPrefix}_sms_pv_breaker_rating_override`,
          },
          {
            component: "sms_ess_breaker",
            state: `${sysPrefix}_sms_ess_breaker_rating_override`,
          },
          {
            component: "sms_tie_in_breaker",
            state: `${sysPrefix}_sms_tie_in_breaker_rating_override`,
          },
          { component: "sms_has_rsd", state: `${sysPrefix}_sms_rsd_enabled` },
          {
            component: "sys1_sms_equipment_type",
            state: "sys1_sms_equipment_type",
          },
          // Battery Type 1 fields
          {
            component: "battery1_existing",
            state: `${sysPrefix}_battery1_existing`,
          },
          { component: "battery1_make", state: `${sysPrefix}_battery_1_make` },
          {
            component: "battery1_model",
            state: `${sysPrefix}_battery_1_model`,
          },
          {
            component: "battery1_quantity",
            state: `${sysPrefix}_battery_1_qty`,
          },
          {
            component: "battery1_configuration",
            state: `${sysPrefix}_battery_configuration`,
          },
          {
            component: "battery1_tie_in_location",
            state: `${sysPrefix}_battery1_tie_in_location`,
          },
          // Battery Type 2 fields
          {
            component: "battery2_existing",
            state: `${sysPrefix}_battery2_existing`,
          },
          { component: "battery2_make", state: `${sysPrefix}_battery_2_make` },
          {
            component: "battery2_model",
            state: `${sysPrefix}_battery_2_model`,
          },
          {
            component: "battery2_quantity",
            state: `${sysPrefix}_battery_2_qty`,
          },
          {
            component: "battery2_tie_in_location",
            state: `${sysPrefix}_battery2_tie_in_location`,
          },
          // Backup Panel fields
          {
            component: "backup_panel_existing",
            state: `bls${systemNumber}_backuploader_existing`,
          },
          {
            component: "backup_panel_make",
            state: `bls${systemNumber}_backup_load_sub_panel_make`,
          },
          {
            component: "backup_panel_model",
            state: `bls${systemNumber}_backup_load_sub_panel_model`,
          },
          {
            component: "backup_panel_bus_amps",
            state: `bls${systemNumber}_backuploader_bus_bar_rating`,
          },
          {
            component: "backup_panel_main_breaker",
            state: `bls${systemNumber}_backuploader_main_breaker_rating`,
          },
          {
            component: "backup_panel_tie_in_breaker",
            state: `bls${systemNumber}_backuploader_upstream_breaker_rating`,
          },
          // String Combiner Panel existing toggle
          {
            component: "combiner_panel_existing",
            state: `${sysPrefix}_combiner_existing`,
          },
          // Optimizer Type 2 existing toggle
          {
            component: "optimizer_type2_existing",
            state: `${sysPrefix}_optimizer_type2_existing`,
          },
          // Battery Combiner Panel existing toggle
          {
            component: "battery_combiner_panel_existing",
            state: `bcp${systemNumber}_existing`,
          },
          // ESS Combiner existing toggle
          {
            component: "ess_existing",
            state: `${sysPrefix}_ess_existing`,
          },
          // ESS fields
          { component: "backup_option", state: `${sysPrefix}_backup_option` },
        ];

        inverterFieldMappings.forEach(
          ({ component, state: stateFieldName }) => {
            // Priority 1: Check state updates (optimistic updates from formData with database field name)
            if (formData[stateFieldName] !== undefined) {
              let value = formData[stateFieldName];
              // Map _existing database fields to _existing component fields (no inversion after refactor)
              if (
                component.endsWith("_isnew") &&
                stateFieldName.includes("_existing")
              ) {
                value = !value; // DB stores "existing", component uses "isNew"
              }
              // Invert _is_new DB fields to _existing component fields
              if (
                component.endsWith("_existing") &&
                stateFieldName.includes("_is_new")
              ) {
                value = !value; // DB stores "is_new", component uses "existing"
              }
              optimisticUpdates[component] = value;
            }
            // Priority 2: Check if systemFormData already has the unprefixed component field
            // (hydrateFormData already mapped databaseâ†'component names)
            else if (systemFormData[component] !== undefined) {
              optimisticUpdates[component] = systemFormData[component];
            }
          },
        );

        // Include BOS fields that match this system number
        Object.keys(formData).forEach((key) => {
          if (
            key.startsWith(`bos_sys${systemNumber}_`) ||
            key.startsWith(`post_sms_bos_sys${systemNumber}_`)
          ) {
            optimisticUpdates[key] = formData[key];
          }
        });

        // BOS visibility flags - preserve user's explicit open/close over hydration
        ['show_inverter_bos', 'show_battery1_bos', 'show_battery2_bos'].forEach(key => {
          const stateKey = `${sysPrefix}_${key}`;
          if (formData[stateKey] !== undefined) {
            optimisticUpdates[key] = formData[stateKey];
          } else if (formData[key] !== undefined) {
            optimisticUpdates[key] = formData[key];
          }
        });

        // ESS visibility flags - preserve user's explicit open/close over hydration
        ['show_sms', 'show_battery1', 'show_battery2', 'show_backup_panel'].forEach(key => {
          const stateKey = `${sysPrefix}_${key}`;
          if (formData[stateKey] !== undefined) {
            optimisticUpdates[key] = formData[stateKey];
          } else if (formData[key] !== undefined) {
            optimisticUpdates[key] = formData[key];
          }
        });

        merged[systemNumber] = {
          ...systemFormData,
          ...optimisticUpdates,
        };
      }
    });
    return merged;
  }, [visibleSystems, systemDetails, projectData, formData]);

  // Add a new system to visible list
  const handleAddSystem = (systemNumber) => {
    if (!visibleSystems.includes(systemNumber) && systemNumber <= maxSystems) {
      setVisibleSystems([...visibleSystems, systemNumber]);
      setSelectedSystem(systemNumber);
    }
  };

  // Remove a system (only for systems 2+)
  const handleDeleteSystem = async (systemNumber) => {
    // CRITICAL: Prevent System 1 deletion - multiple safeguards
    if (systemNumber === 1) {
      console.error("âŒ BLOCKED: Cannot delete System 1");
      toast.error(
        "System 1 cannot be deleted. You can clear individual sections, but System 1 must always exist.",
        {
          position: "top-center",
          autoClose: 4000,
        },
      );
      return;
    }

    if (systemNumber <= 1 || !systemNumber) {
      console.error(
        "âŒ BLOCKED: Invalid system number for deletion:",
        systemNumber,
      );
      return;
    }

    // Clear all data for this system in database
    const prefix = SYSTEM_PREFIXES[systemNumber];
    const dbFields = {};

    // Build field mapping for this system to get all fields to clear
    const getFieldMapping = (sysNum, sysPrefix) => ({
      // Solar Panel
      solar_panel_existing: getSchemaField(sysNum, "solar_panel_existing"),
      solar_panel_make: `${sysPrefix}_solar_panel_make`,
      solar_panel_model: `${sysPrefix}_solar_panel_model`,
      solar_panel_quantity: `${sysPrefix}_solar_panel_qty`,
      solar_panel_watts: `${sysPrefix}_solar_panel_watts`,
      solar_panel_vmp: `${sysPrefix}_solar_panel_vmp`,
      solar_panel_imp: `${sysPrefix}_solar_panel_imp`,
      solar_panel_voc: `${sysPrefix}_solar_panel_voc`,
      solar_panel_isc: `${sysPrefix}_solar_panel_isc`,

      // Solar Panel 2 (for mixed systems)
      solar_panel_type2_is_new: getSchemaField(
        sysNum,
        "solar_panel_type2_is_new",
      ),
      solar_panel_type2_manufacturer: `${sysPrefix}_solar_panel_type2_manufacturer`,
      solar_panel_type2_model: `${sysPrefix}_solar_panel_type2_model`,
      solar_panel_type2_quantity: `${sysPrefix}_solar_panel_type2_quantity`,
      // solar_panel_type2_wattage removed - spec sheet derived, not in DB
      // solar_panel_type2_vmp removed - spec sheet derived, not in DB
      // solar_panel_type2_imp removed - spec sheet derived, not in DB
      // solar_panel_type2_voc removed - spec sheet derived, not in DB
      // solar_panel_type2_isc removed - spec sheet derived, not in DB
      // solar_panel_type2_model_id removed - spec sheet derived, not in DB
      // solar_panel_type2_temp_coeff_voc removed - spec sheet derived, not in DB
      show_solar_panel_2: `${sysPrefix}_show_second_panel_type`,
      batteryonly: `${sysPrefix}_batteryonly`,

      // Inverter/Microinverter
      inverter_existing: getSchemaField(sysNum, "micro_inverter_existing"),
      inverter_make: `${sysPrefix}_micro_inverter_make`,
      inverter_model: `${sysPrefix}_micro_inverter_model`,
      // inverter_type removed - derived from sys1_selectedsystem, not in DB
      inverter_max_cont_output_amps: `${sysPrefix}_inv_max_continuous_output`,
      inverter_max_strings_branches: `${sysPrefix}_inv_max_strings_branches`,
      inverter_max_vdc: `${sysPrefix}_inv_max_vdc`,
      inverter_min_vdc: `${sysPrefix}_inv_min_vdc`,
      inverter_max_input_isc: `${sysPrefix}_inv_max_input_isc`,
      inverter_model_id: `${sysPrefix}_micro_inverter_id`,

      // SolarEdge multi-kW
      solaredge_partnumber: `${sysPrefix}_solaredge_partnumber`,
      solaredge_setting: `${sysPrefix}_solaredge_setting`,

      // Hoymiles/APSystems Granular Microinverter Panel Tracking
      micro1Panels: `${sysPrefix}_micro1Panels`,
      micro2Panels: `${sysPrefix}_micro2Panels`,
      micro3Panels: `${sysPrefix}_micro3Panels`,
      micro4Panels: `${sysPrefix}_micro4Panels`,
      micro5Panels: `${sysPrefix}_micro5Panels`,
      micro6Panels: `${sysPrefix}_micro6Panels`,
      micro7Panels: `${sysPrefix}_micro7Panels`,
      micro8Panels: `${sysPrefix}_micro8Panels`,
      micro9Panels: `${sysPrefix}_micro9Panels`,
      micro10Panels: `${sysPrefix}_micro10Panels`,
      micro11Panels: `${sysPrefix}_micro11Panels`,
      micro12Panels: `${sysPrefix}_micro12Panels`,
      micro13Panels: `${sysPrefix}_micro13Panels`,
      micro14Panels: `${sysPrefix}_micro14Panels`,
      micro15Panels: `${sysPrefix}_micro15Panels`,
      micro16Panels: `${sysPrefix}_micro16Panels`,
      micro17Panels: `${sysPrefix}_micro17Panels`,
      micro18Panels: `${sysPrefix}_micro18Panels`,
      micro19Panels: `${sysPrefix}_micro19Panels`,
      micro20Panels: `${sysPrefix}_micro20Panels`,
      micro21Panels: `${sysPrefix}_micro21Panels`,
      micro22Panels: `${sysPrefix}_micro22Panels`,
      micro23Panels: `${sysPrefix}_micro23Panels`,
      micro24Panels: `${sysPrefix}_micro24Panels`,
      micro25Panels: `${sysPrefix}_micro25Panels`,

      // Optimizer
      optimizer_existing: getSchemaField(sysNum, "optimizer_existing"),
      optimizer_make: `${sysPrefix}_optimizer_make`,
      optimizer_model: `${sysPrefix}_optimizer_model`,

      // String Combiner Panel
      combiner_panel_existing: getSchemaField(sysNum, "combiner_existing"),
      combiner_panel_make: `${sysPrefix}_combiner_panel_make`,
      combiner_panel_model: `${sysPrefix}_combiner_panel_model`,
      combiner_panel_bus_amps: `${sysPrefix}_combinerpanel_bus_rating`,
      combiner_panel_main_breaker: `${sysPrefix}_combinerpanel_main_breaker_rating`,
      combiner_panel_tie_in_breaker: `${sysPrefix}_combiner_panel_tie_in_breaker`,
      aggregate_pv_breaker: `${sysPrefix}_aggregate_pv_breaker`,

      // BOS Visibility Flags - REMOVED: Computed from BOS slot data, not stored
      // show_inverter_bos, show_battery1_bos, show_battery2_bos

      // ESS Section Visibility Flags - REMOVED: Computed from equipment data, not stored
      // show_sms, show_battery1, show_battery2, show_backup_panel
    });

    const fieldMapping = getFieldMapping(systemNumber, prefix);

    // Add all system fields to clear
    Object.keys(fieldMapping).forEach((key) => {
      const dbField = fieldMapping[key];
      if (dbField && dbField.includes(prefix)) {
        dbFields[dbField] = null;
      }
    });

    await updateFields(dbFields);

    // Remove from visible systems (with additional System 1 safeguard)
    setVisibleSystems((prev) => {
      // Double-check: Never allow System 1 to be removed from visibleSystems
      if (systemNumber === 1) {
        console.error(
          "âŒ BLOCKED: Attempted to remove System 1 from visibleSystems",
        );
        return prev;
      }
      return prev.filter((s) => s !== systemNumber);
    });

    // Switch to System 1 if we deleted the current system
    if (selectedSystem === systemNumber) {
      setSelectedSystem(1);
    }
  };

  const handleAddBatteryType2 = () => {
    setFormData((prev) => ({
      ...prev,
      show_battery_type_2: true,
    }));
  };

  // Get dynamic section title based on inverter type
  // Get array of active system numbers using utility function
  const getActiveSystemsList = useCallback(() => {
    if (!systemDetails) return [];
    return getActiveSystemsUtil(systemDetails);
  }, [systemDetails]);

  // Handle saving combine configuration
  const handleCombineSave = async (configData) => {
    const jsonString = JSON.stringify(configData);

    // Save to formData as JSON (optimistic update)
    setFormData((prev) => ({
      ...prev,
      ele_combine_positions: jsonString,
    }));

    try {
      // Save to database via system-details API
      await updateField("ele_combine_positions", jsonString);
      logger.log(
        "Equipment",
        "Combine configuration saved to database",
        configData,
      );
    } catch (error) {
      logger.error("Equipment", "Failed to save combine configuration:", error);
      toast.error("Failed to save combine configuration");
    }
  };

  // Handle combine systems toggle with dirty check
  const handleCombineToggle = async (newValue) => {
    const currentValue = formData.combine_systems;

    // If already at the desired value, do nothing
    if (currentValue === newValue) return;

    // Check if there's existing configuration (dirty check)
    const hasExistingConfig =
      formData.ele_combine_positions &&
      formData.ele_combine_positions.trim().length > 0;

    // If switching from Combine (true) to Do Not Combine (false) and there's config, confirm first
    if (currentValue === true && newValue === false && hasExistingConfig) {
      setPendingCombineChoice(newValue);
      setShowCombineConfirmModal(true);
      return;
    }

    // Otherwise, proceed with the change
    await applyCombineToggle(newValue);
  };

  // Apply the combine toggle change
  const applyCombineToggle = async (newValue) => {
    try {
      // Save both fields to ensure proper state
      // NOTE: updateField expects the DATABASE field name, not the form field name
      if (newValue === false) {
        // Switching to "Do Not Combine" - set flag to false and mark as "Do Not"
        await updateField("ele_combine_systems", false); // Database field name
        await updateField("ele_combine_positions", "Do Not"); // Mark as explicitly not combined
        setFormData((prev) => ({
          ...prev,
          combine_systems: false,
          ele_combine_positions: "Do Not",
        }));
        logger.log(
          "Equipment",
          'Set to Do Not Combine - ele_combine_positions = "Do Not"',
        );
      } else {
        // Switching to "Combine" - set flag to true
        await updateField("ele_combine_systems", true); // Database field name
        setFormData((prev) => ({
          ...prev,
          combine_systems: true,
        }));
        logger.log("Equipment", "Enabled combine systems mode");
      }
    } catch (error) {
      logger.error("Equipment", "Failed to toggle combine systems:", error);
      toast.error("Failed to update combine systems setting");
    }
  };

  // Auto-save "Do Not" when Combine Systems section first becomes visible (2+ systems)
  useEffect(() => {
    // Only run if we have 2+ visible systems AND ele_combine_positions is empty/null
    if (visibleSystems.length >= 2) {
      const currentValue = formData.ele_combine_positions;

      // If no value set yet (null, undefined, or empty string), default to "Do Not"
      if (!currentValue || currentValue.trim() === "") {
        logger.log(
          "Equipment",
          'Auto-saving default "Do Not" for combine_positions (2+ systems detected)',
        );
        updateField("ele_combine_positions", "Do Not");
        setFormData((prev) => ({
          ...prev,
          ele_combine_positions: "Do Not",
          combine_systems: false, // Ensure combine_systems is also false
        }));
      }
    }
  }, [visibleSystems.length, formData.ele_combine_positions, updateField]);

  // Confirm switching to "Do Not Combine" and clearing configuration
  const handleConfirmCombineToggle = async () => {
    await applyCombineToggle(pendingCombineChoice);
    setShowCombineConfirmModal(false);
    setPendingCombineChoice(null);
  };

  // Cancel switching to "Do Not Combine"
  const handleCancelCombineToggle = () => {
    setShowCombineConfirmModal(false);
    setPendingCombineChoice(null);
  };

  // Helper: Check if utility requires AC Disconnect (Oncor or Xcel Energy)
  const isOncorOrXcelEnergy = (utilityName) => {
    if (!utilityName) return false;
    const normalized = utilityName.toLowerCase().trim();
    return (
      normalized.includes("oncor") ||
      normalized.includes("xcel energy") ||
      normalized.includes("xcel")
    );
  };

  // Helper: Determine AC Disconnect type based on POI type
  const getACDisconnectType = (poiType) => {
    // Fused AC Disconnect for these POI types
    const fusedTypes = [
      "Lug Kit",
      "Line Side Connection",
      "Line (Supply) Side Tap",
      "Line Side Tap",
    ];
    if (fusedTypes.includes(poiType)) {
      return "Fused AC Disconnect";
    }
    // Standard AC Disconnect for all other types
    return "AC Disconnect";
  };

  // Helper: Add AC Disconnect to Post Combine BOS
  const addACDisconnectToBOS = async (systemNumber, disconnectType) => {
    try {
      const fieldPrefix = `post_sms_bos_sys${systemNumber}_type1`;

      await patchSystemDetails(projectUuid, {
        [`${fieldPrefix}_equipment_type`]: disconnectType,
        [`${fieldPrefix}_is_new`]: true, // Default to new equipment
      });

      logger.log(
        "Equipment",
        `Added ${disconnectType} to System ${systemNumber} Post Combine BOS`,
      );
      return true;
    } catch (error) {
      logger.error(
        "Equipment",
        `Failed to add AC Disconnect to System ${systemNumber}:`,
        error,
      );
      throw error;
    }
  };

  // Helper: Prompt user for POI details if missing
  const promptForPOI = (systemNumber) => {
    return new Promise((resolve) => {
      setPoiPromptSystemNumber(systemNumber);
      setPoiPromptCallback(() => resolve);
      setShowPOIPromptModal(true);
    });
  };

  // Handle POI prompt confirmation
  const handlePOIPromptConfirm = async ({ poiType, poiLocation }) => {
    try {
      // Close modal
      setShowPOIPromptModal(false);

      // Determine which fields to save based on system number and combine status
      const isCombined = formData.combine_systems === true;
      const sysNum = isCombined ? 1 : poiPromptSystemNumber;

      // Field names for System 1 or combined systems
      const poiTypeField =
        sysNum === 1
          ? "ele_method_of_interconnection"
          : `sys${sysNum}_ele_method_of_interconnection`;
      const poiLocationField =
        sysNum === 1
          ? "ele_breaker_location"
          : `sys${sysNum}_ele_breaker_location`;

      // Save POI details to database
      await patchSystemDetails(projectUuid, {
        [poiTypeField]: poiType,
        [poiLocationField]: poiLocation,
      });

      logger.log(
        "Equipment",
        `Saved POI details for System ${poiPromptSystemNumber}:`,
        { poiType, poiLocation },
      );

      // Refresh system details to get updated POI values
      await refreshSystemDetails();

      // Call the stored callback with POI data
      if (poiPromptCallback) {
        poiPromptCallback({ poiType, poiLocation });
        setPoiPromptCallback(null);
      }
    } catch (error) {
      logger.error("Equipment", "Failed to save POI details:", error);
      toast.error("Failed to save POI details. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  // BOS Detection Handler
  const handleDetectUtilityBOS = async () => {
    try {
      setBosDetectionLoading(true);
      setShowBOSDetectionModal(true);

      // Get utility name from project site data
      const utilityName =
        projectData?.site?.utility || systemDetails?.utility || "";

      // ============================================
      // ONCOR / XCEL ENERGY AC DISCONNECT LOGIC
      // ============================================

      if (isOncorOrXcelEnergy(utilityName)) {
        logger.log(
          "Equipment",
          `Detected Oncor/Xcel Energy utility: ${utilityName}`,
        );

        const isCombined = formData.combine_systems === true;
        const activeSystems = getActiveSystemsList();

        // Determine which systems need AC Disconnects
        const systemsToProcess = isCombined ? [1] : activeSystems;

        let acDisconnectsAdded = 0;
        const acDisconnectSummary = [];

        for (const sysNum of systemsToProcess) {
          // Get POI type for this system
          const poiTypeField =
            sysNum === 1
              ? "ele_method_of_interconnection"
              : `sys${sysNum}_ele_method_of_interconnection`;
          const poiLocationField =
            sysNum === 1
              ? "ele_breaker_location"
              : `sys${sysNum}_ele_breaker_location`;

          let poiType = systemDetails?.[poiTypeField] || "";
          let poiLocation = systemDetails?.[poiLocationField] || "";

          // If POI type or location is missing, prompt user
          if (!poiType || !poiLocation) {
            logger.log(
              "Equipment",
              `POI details missing for System ${sysNum}, prompting user...`,
            );

            // Prompt for POI details
            const poiData = await promptForPOI(sysNum);
            poiType = poiData.poiType;
            poiLocation = poiData.poiLocation;
          }

          // Determine AC Disconnect type based on POI type
          const disconnectType = getACDisconnectType(poiType);

          // Add AC Disconnect to Post Combine BOS
          await addACDisconnectToBOS(sysNum, disconnectType);
          acDisconnectsAdded++;
          acDisconnectSummary.push(`System ${sysNum}: ${disconnectType}`);

          logger.log(
            "Equipment",
            `Added ${disconnectType} for System ${sysNum} with POI type: ${poiType}`,
          );
        }

        // Refresh system details to show new equipment
        await refreshSystemDetails();

        // Show success summary
        setBosDetectionResult({ oncorXcelACDisconnect: true });
        setBosDetectionSummary(
          `${utilityName} - AC Disconnect Requirement\n\n${acDisconnectSummary.join("\n")}`,
        );
        setBosItemCount(acDisconnectsAdded);
        setBosPayload(null); // No additional payload needed
        setBosDetectionLoading(false);

        toast.success(
          `Added ${acDisconnectsAdded} AC Disconnect${acDisconnectsAdded !== 1 ? "s" : ""} to Post Combine BOS`,
          {
            position: "top-center",
            autoClose: 3000,
          },
        );

        // Close modal automatically after a short delay
        setTimeout(() => {
          setShowBOSDetectionModal(false);
        }, 2000);

        logger.log(
          "Equipment",
          `Oncor/Xcel Energy AC Disconnects added: ${acDisconnectsAdded}`,
        );
        return; // Exit early, no need for regular BOS detection
      }

      // ============================================
      // STANDARD BOS DETECTION (NON-ONCOR/XCEL)
      // ============================================

      // Step 1: Try hardcoded utility-specific configurations first (PRIMARY)
      // Pass utility name as second parameter
      const detectionResult = await detectProjectConfiguration(
        systemDetails || {},
        utilityName,
      );
      const populationResult = await prepareBOSPopulation(
        projectUuid,
        detectionResult,
      );

      let finalItemCount = populationResult.itemCount;
      let finalSummary = populationResult.summary;
      let finalPayload = populationResult.payload;

      // Step 2: If no hardcoded configurations found, try database fallback (FALLBACK)
      if (finalItemCount === 0) {
        logger.log(
          "Equipment",
          "No hardcoded BOS configurations found, checking database...",
        );

        const utilityName = systemDetails?.utility || null;
        if (utilityName) {
          const { getUtilityBOSRequirements } =
            await import("../../services/utilityRequirementsService");
          const dbRequirements = await getUtilityBOSRequirements(utilityName);

          if (dbRequirements && dbRequirements.length > 0) {
            logger.log(
              "Equipment",
              `Database returned ${dbRequirements.length} BOS requirements for ${utilityName}`,
            );

            // Convert database requirements to BOS items format
            const { convertDatabaseToBOSItems } =
              await import("../../utils/bosUtils");
            const dbBOSItems = await convertDatabaseToBOSItems(
              dbRequirements,
              systemDetails,
              projectUuid,
            );

            if (dbBOSItems.length > 0) {
              // Build detection result from database items
              const dbDetectionResult = {
                allBOSItems: dbBOSItems,
              };

              // Prepare population with catalog lookups
              const dbPopulationResult = await prepareBOSPopulation(
                projectUuid,
                dbDetectionResult,
              );

              finalItemCount = dbPopulationResult.itemCount;
              finalSummary = `Database Fallback - ${utilityName}\n${dbPopulationResult.summary}`;
              finalPayload = dbPopulationResult.payload;

              logger.log(
                "Equipment",
                `Database fallback found ${finalItemCount} BOS items`,
              );
            }
          } else {
            logger.log(
              "Equipment",
              `No database requirements found for ${utilityName}`,
            );
          }
        }
      } else {
        logger.log(
          "Equipment",
          `Hardcoded configurations found ${finalItemCount} BOS items`,
        );
      }

      // Update modal state with final results (hardcoded or database)
      setBosDetectionResult(detectionResult);
      setBosDetectionSummary(finalSummary);
      setBosItemCount(finalItemCount);
      setBosPayload(finalPayload);
      setBosDetectionLoading(false);

      logger.log("Equipment", `Final result: ${finalItemCount} BOS items`);
    } catch (error) {
      logger.error("Equipment", "BOS detection failed:", error);
      setBosDetectionLoading(false);
      toast.error("Failed to detect BOS configurations. Please try again.", {
        position: "top-center",
        autoClose: 5000,
      });
      setShowBOSDetectionModal(false);
    }
  };

  // BOS Detection Modal Confirm Handler
  const handleBOSDetectionConfirm = async () => {
    try {
      if (!bosPayload) {
        toast.warning("No BOS data to save", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      // Save BOS to database
      const saveResult = await saveBOSPopulation(projectUuid, bosPayload);

      if (saveResult.success) {
        // Check how many active systems exist
        const activeSystems = getActiveSystemsList();
        const shouldCombine = activeSystems.length >= 2;

        // Set the flag to show BOS sections in the UI
        // For single-system projects, ensure combine_systems is false
        const updates = {
          show_inverter_bos: true,
        };

        // Only override combine_systems if it's a single-system project
        if (!shouldCombine) {
          updates.combine_systems = false;
        }

        setFormData((prev) => ({
          ...prev,
          ...updates,
        }));

        // If we're forcing combine_systems to false, save it to the database
        if (!shouldCombine && formData.combine_systems === true) {
          await updateField("ele_combine_systems", false);
        }

        // Refresh system details to show new BOS
        await refreshSystemDetails();
        logger.log("Equipment", "BOS equipment saved successfully");
        toast.success(
          `Successfully added ${bosItemCount} BOS equipment items!`,
          {
            position: "top-center",
            autoClose: 3000,
          },
        );
      } else {
        toast.error(saveResult.message || "Failed to save BOS equipment", {
          position: "top-center",
          autoClose: 5000,
        });
      }

      // Close modal
      setShowBOSDetectionModal(false);
      setBosDetectionResult(null);
      setBosDetectionSummary("");
      setBosItemCount(0);
      setBosPayload(null);
    } catch (error) {
      logger.error("Equipment", "BOS save failed:", error);
      toast.error("Failed to save BOS equipment. Please try again.", {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  // Navigation handlers for footer
  const handlePrev = () => {
    if (selectedView === "bos") {
      // BOS â†’ Combine (if exists) or Equipment
      if (showCombineStep) {
        setSelectedView("combine");
      } else {
        setSelectedView("equipment");
      }
    } else if (selectedView === "combine") {
      // Combine â†’ Equipment
      setSelectedView("equipment");
    } else if (selectedView === "equipment") {
      // Equipment â†’ Previous System's Equipment (if not System 1)
      if (selectedSystem > 1) {
        setSelectedSystem(selectedSystem - 1);
        // Stay on Equipment view of previous system
      }
      // If System 1, button is disabled so this won't be called
    }
  };

  const handleNext = () => {
    // BLOCKING VALIDATION: Check custom stringing before allowing navigation
    if (selectedView === "equipment") {
      // Get current system's form data
      const mergedFormData = systemDetails[`system${selectedSystem}`] || {};

      // Only validate if custom stringing mode is active
      if (mergedFormData.stringing_type === "custom") {
        const isMicroinverter =
          mergedFormData.inverter_type === "microinverter";
        const { panelsRemaining } = calculatePanelsRemaining(
          mergedFormData,
          isMicroinverter,
        );

        if (panelsRemaining !== 0) {
          // Block navigation and show modal
          const absRemaining = Math.abs(panelsRemaining);
          const message =
            panelsRemaining > 0
              ? `You have ${absRemaining} solar panel${absRemaining !== 1 ? "s" : ""} remaining to assign. Please complete stringing configuration or switch to Auto mode.`
              : `You have ${absRemaining} solar panel${absRemaining !== 1 ? "s" : ""} over-assigned. Please adjust stringing configuration or switch to Auto mode.`;

          setStringingBlockerMessage(message);
          setShowStringingBlocker(true);
          return; // Block navigation
        }
      }

      // Validation passed, proceed
      setShowAddSystemModal(true);
    } else if (selectedView === "combine") {
      // From Combine, go to BOS
      setSelectedView("bos");
    } else if (selectedView === "bos") {
      // From BOS, show modal asking about additional system
      setShowAddSystemModal(true);
    }
  };

  const handleAddSystemConfirm = (addSystem) => {
    setShowAddSystemModal(false);

    if (addSystem && selectedSystem < maxSystems) {
      // User wants to add additional system
      setSelectedSystem(selectedSystem + 1);
      setSelectedView("equipment");
    } else {
      // User doesn't want additional system
      if (selectedView === "equipment") {
        // From Equipment â†’ go to Combine
        setSelectedView("combine");
      } else if (selectedView === "bos") {
        // From BOS â†’ go to Electrical tab
        if (onNavigateToTab) {
          onNavigateToTab("electrical");
        }
      }
    }
  };

  // Only disable Previous when on System 1 AND Equipment sub-tab
  const isPrevDisabled = selectedSystem === 1 && selectedView === "equipment";

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className={equipStyles.formFullHeight}
    >
      {/* Scrollable Content - Full width, breaks out of parent padding */}
      <div className={equipStyles.scrollableContent}>
        {/* Render all visible systems in SystemContainers */}
        {visibleSystems.map((systemNumber) => {
          // Use memoized merged form data to prevent unnecessary re-renders
          const mergedFormData = mergedFormDataBySystem[systemNumber];
          if (!mergedFormData) return null;

          // Calculate PowerWall detection for this system
          const systemIsPowerWall = isTeslaPowerWall(
            mergedFormData.inverter_make,
            mergedFormData.inverter_model,
          );
          const systemSuppressESS = shouldSuppressESS(
            mergedFormData.inverter_make,
            mergedFormData.inverter_model,
          );
          const systemIsGatewaySMS =
            systemIsPowerWall &&
            mergedFormData.sms_make === "Tesla" &&
            (mergedFormData.sms_model === "Backup Gateway 2" ||
              mergedFormData.sms_model === "Gateway 3");
          const systemIsEnphaseCombiner6C =
            mergedFormData.combiner_panel_make?.toLowerCase() === "enphase" &&
            mergedFormData.combiner_panel_model?.includes("6C");
          const systemIsDuracellInverter = isDuracellInverter(
            mergedFormData.inverter_make,
            mergedFormData.inverter_model,
          );
          const systemIsSolArkInverter = isSolArkInverter(
            mergedFormData.inverter_make,
            mergedFormData.inverter_model,
          );

          // Create system-specific onChange handler that passes system number
          const handleSystemFieldChange = async (field, value) => {
            // Pass systemNumber as override to ensure correct field mapping
            await handleFieldChange(field, value, systemNumber);
          };

          // Create system-specific batch handler
          const handleSystemBatchChange = async (fieldUpdates) => {
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] handleSystemBatchChange ENTRY:`,
              { fieldUpdates, length: fieldUpdates?.length },
            );
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 1: Checking if empty...`,
            );
            if (!fieldUpdates || fieldUpdates.length === 0) {
              logger.debug(
                'EquipmentForm',
                `[System ${systemNumber}] Batch change SKIPPED - empty or null updates`,
              );
              return;
            }
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 2: Not empty, proceeding...`,
            );

            logger.log(
              "EquipmentForm",
              `[System ${systemNumber}] Batch change called with ${fieldUpdates.length} updates:`,
              fieldUpdates,
            );
            logger.debug('EquipmentForm', `[System ${systemNumber}] Step 3: After logger.log`);

            const systemPrefix = SYSTEM_PREFIXES[systemNumber];
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 4: systemPrefix = ${systemPrefix}`,
            );

            const stateUpdates = {};
            const dbUpdates = {};

            // Define field mapping for inverter fields
            const fieldMapping = {
              // Solar Panel fields
              solar_panel_existing: getSchemaField(
                systemNumber,
                "solar_panel_existing",
              ),
              solar_panel_make: `${systemPrefix}_solar_panel_make`,
              solar_panel_model: `${systemPrefix}_solar_panel_model`,
              solar_panel_model_id: `${systemPrefix}_solar_panel_model_id`,
              solar_panel_quantity: `${systemPrefix}_solar_panel_qty`,
              solar_panel_wattage: `${systemPrefix}_solar_panel_wattage`,
              solar_panel_voc: `${systemPrefix}_solar_panel_voc`,
              solar_panel_isc: `${systemPrefix}_solar_panel_isc`,
              solar_panel_vmp: `${systemPrefix}_solar_panel_vmp`,
              solar_panel_imp: `${systemPrefix}_solar_panel_imp`,
              solar_panel_temp_coeff_voc: `${systemPrefix}_solar_panel_temp_coeff_voc`,
              // Solar Panel Type 2 fields
              solar_panel_type2_manufacturer: `${systemPrefix}_solar_panel_type2_manufacturer`,
              solar_panel_type2_model: `${systemPrefix}_solar_panel_type2_model`,
              solar_panel_type2_model_id: `${systemPrefix}_solar_panel_type2_model_id`,
              solar_panel_type2_quantity: `${systemPrefix}_solar_panel_type2_qty`,
              solar_panel_type2_wattage: `${systemPrefix}_solar_panel_type2_wattage`,
              solar_panel_type2_is_new: getSchemaField(
                systemNumber,
                "solar_panel_type2_is_new",
              ),
              solar_panel_type2_voc: `${systemPrefix}_solar_panel_type2_voc`,
              solar_panel_type2_isc: `${systemPrefix}_solar_panel_type2_isc`,
              solar_panel_type2_vmp: `${systemPrefix}_solar_panel_type2_vmp`,
              solar_panel_type2_imp: `${systemPrefix}_solar_panel_type2_imp`,
              solar_panel_type2_temp_coeff_voc: `${systemPrefix}_solar_panel_type2_temp_coeff_voc`,
              show_solar_panel_2: `${systemPrefix}_show_second_panel_type`,
              batteryonly: `${systemPrefix}_batteryonly`,
              // Inverter fields
              inverter_existing: getSchemaField(
                systemNumber,
                "micro_inverter_existing",
              ),
              inverter_make: `${systemPrefix}_micro_inverter_make`,
              inverter_model: `${systemPrefix}_micro_inverter_model`,
              inverter_model_id: `${systemPrefix}_micro_inverter_id`,
              inverter_type: `${systemPrefix}_inverter_type`,
              inverter_max_cont_output_amps: `${systemPrefix}_inv_max_continuous_output`,
              inverter_max_strings_branches: `${systemPrefix}_inv_max_strings_branches`,
              inverter_max_vdc: `${systemPrefix}_inv_max_vdc`,
              inverter_min_vdc: `${systemPrefix}_inv_min_vdc`,
              inverter_max_input_isc: `${systemPrefix}_inv_max_input_isc`,
              inverter_qty: `${systemPrefix}_micro_inverter_qty`,
              // Optimizer fields
              optimizer_existing: getSchemaField(
                systemNumber,
                "optimizer_existing",
              ),
              optimizer_make: `${systemPrefix}_optimizer_make`,
              optimizer_model: `${systemPrefix}_optimizer_model`,
              // Type 2 Optimizer fields
              optimizer_type2_existing: getSchemaField(
                systemNumber,
                "optimizer_type2_existing",
              ),
              optimizer_type2_make: `${systemPrefix}_optimizer_type2_make`,
              optimizer_type2_model: `${systemPrefix}_optimizer_type2_model`,
              // Stringing fields
              stringing_type: `${systemPrefix}_stringing_type`,
              branch_string_1: `${systemPrefix}_branch_string_1`,
              branch_string_2: `${systemPrefix}_branch_string_2`,
              branch_string_3: `${systemPrefix}_branch_string_3`,
              branch_string_4: `${systemPrefix}_branch_string_4`,
              branch_string_5: `${systemPrefix}_branch_string_5`,
              branch_string_6: `${systemPrefix}_branch_string_6`,
              branch_string_7: `${systemPrefix}_branch_string_7`,
              branch_string_8: `${systemPrefix}_branch_string_8`,
              branch_string_9: `${systemPrefix}_branch_string_9`,
              branch_string_10: `${systemPrefix}_branch_string_10`,
              // Panel type for each string
              branch_string_1_panel_type: `${systemPrefix}_branch_string_1_panel_type`,
              branch_string_2_panel_type: `${systemPrefix}_branch_string_2_panel_type`,
              branch_string_3_panel_type: `${systemPrefix}_branch_string_3_panel_type`,
              branch_string_4_panel_type: `${systemPrefix}_branch_string_4_panel_type`,
              branch_string_5_panel_type: `${systemPrefix}_branch_string_5_panel_type`,
              branch_string_6_panel_type: `${systemPrefix}_branch_string_6_panel_type`,
              branch_string_7_panel_type: `${systemPrefix}_branch_string_7_panel_type`,
              branch_string_8_panel_type: `${systemPrefix}_branch_string_8_panel_type`,
              branch_string_9_panel_type: `${systemPrefix}_branch_string_9_panel_type`,
              branch_string_10_panel_type: `${systemPrefix}_branch_string_10_panel_type`,
              // String Combiner Panel fields
              combiner_panel_existing: getSchemaField(
                systemNumber,
                "combiner_existing",
              ),
              combiner_panel_make: `${systemPrefix}_combiner_panel_make`,
              combiner_panel_model: `${systemPrefix}_combiner_panel_model`,
              combiner_panel_bus_amps: `${systemPrefix}_combinerpanel_bus_rating`,
              combiner_panel_main_breaker: `${systemPrefix}_combinerpanel_main_breaker_rating`,
              combiner_panel_tie_in_breaker: `${systemPrefix}_combiner_panel_tie_in_breaker`,
              // BOS visibility flags - REMOVED: Computed values, not stored in DB
              // SMS fields
              sms_existing: `${systemPrefix}_sms_existing`,
              sms_make: `${systemPrefix}_sms_make`,
              sms_model: `${systemPrefix}_sms_model`,
              sms_main_breaker: `${systemPrefix}_sms_breaker_rating`,
              sms_pv_breaker: `${systemPrefix}_sms_pv_breaker`,
              sms_ess_breaker: `${systemPrefix}_sms_ess_breaker`,
              sms_tie_in_breaker: `${systemPrefix}_sms_tie_in_breaker`,
              sms_has_rsd: `${systemPrefix}_sms_rsd_enabled`,
              sys1_sms_equipment_type: "sys1_sms_equipment_type",
              // ESS Section fields
              backup_option: `${systemPrefix}_backup_option`,
              backup_system_size: "utility_service_amps",
              // Battery Type 1 fields
              battery1_existing: `${systemPrefix}_battery1_existing`,
              battery1_make: `${systemPrefix}_battery_1_make`,
              battery1_model: `${systemPrefix}_battery_1_model`,
              battery1_quantity: `${systemPrefix}_battery_1_qty`,
              battery1_configuration: `${systemPrefix}_battery_configuration`,
              battery1_tie_in_location: `${systemPrefix}_battery1_tie_in_location`,
              // battery1_mount_type removed - not in DB or calc
              // Battery Type 2 fields
              battery2_existing: `${systemPrefix}_battery2_existing`,
              battery2_make: `${systemPrefix}_battery_2_make`,
              battery2_model: `${systemPrefix}_battery_2_model`,
              battery2_quantity: `${systemPrefix}_battery_2_qty`,
              battery2_tie_in_location: `${systemPrefix}_battery2_tie_in_location`,
              battery2_mount_type: `${systemPrefix}_battery2_mount_type`,
              show_battery_type_2: "show_battery_type_2",
              // Backup Panel fields
              backup_loads_landing: "sys1_backupconfig",
              backup_panel_selection: "sys1_backupconfig_selectpanel",
              backup_panel_existing: `bls${systemNumber}_backuploader_existing`,
              backup_panel_make: `bls${systemNumber}_backup_load_sub_panel_make`,
              backup_panel_model: `bls${systemNumber}_backup_load_sub_panel_model`,
              backup_panel_bus_amps: `bls${systemNumber}_backuploader_bus_bar_rating`,
              backup_panel_main_breaker: `bls${systemNumber}_backuploader_main_breaker_rating`,
              backup_panel_tie_in_breaker: `bls${systemNumber}_backuploader_upstream_breaker_rating`,
              // ESS visibility flags - NOT stored in DB, but used for local state
              show_sms: `${systemPrefix}_show_sms`,
              show_battery1: `${systemPrefix}_show_battery1`,
              show_battery2: `${systemPrefix}_show_battery2`,
              show_backup_panel: `${systemPrefix}_show_backup_panel`,
              show_inverter_bos: `${systemPrefix}_show_inverter_bos`,
              show_battery1_bos: `${systemPrefix}_show_battery1_bos`,
              show_battery2_bos: `${systemPrefix}_show_battery2_bos`,
            };

            // === TOGGLE PIGGYBACK (batch path) ===
            // Scan fieldUpdates for group membership. For each group present,
            // inject the toggle's current formData value if not already in the batch.
            // Zero cost � piggybacks on the existing single API call.
            const _batchFields = new Set(fieldUpdates.map(([f]) => f));
            TOGGLE_GROUP_PREFIXES.forEach(([prefix, toggleField]) => {
              if (!toggleField) return; // Skip excluded groups
              if (_batchFields.has(toggleField)) return; // Toggle already in batch
              // Check if any field in this batch belongs to this toggle's group
              const _hasGroupMember = fieldUpdates.some(
                ([f]) => f.startsWith(prefix) && f !== toggleField,
              );
              if (_hasGroupMember) {
                const _toggleValue = mergedFormData[toggleField] ?? false;
                fieldUpdates.push([toggleField, _toggleValue]);
                _batchFields.add(toggleField); // Prevent duplicate injection
                logger.log(
                  "EquipmentForm",
                  `Toggle piggyback (batch): injecting ${toggleField} = ${_toggleValue}`,
                );
              }
            });

            // Process each field update
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 5: Starting forEach loop, ${fieldUpdates.length} items`,
            );
            fieldUpdates.forEach(([field, value], index) => {
              logger.debug(
                'EquipmentForm',
                `[System ${systemNumber}] Processing field ${index}:`,
                { field, value },
              );
              const isBOSField =
                field.startsWith("bos_sys") ||
                field.startsWith("post_sms_bos_sys") ||
                field.startsWith("postcombine_");

              // Map to state and database fields based on system number
              let stateFieldName = field; // Default to unprefixed for System 1
              let dbFieldName;

              if (isBOSField) {
                // BOS fields don't get prefixed
                dbFieldName = field;
                stateFieldName = field;
              } else {
                // For state, use the local field name (unprefixed for System 1, prefixed for System 2+)
                if (systemNumber === 1) {
                  stateFieldName = field; // System 1 uses unprefixed names in state
                } else {
                  // System 2+ needs prefixed names in state to match what components expect
                  stateFieldName = `${systemPrefix}_${field}`;
                }

                // For database, always use the mapped field name
                dbFieldName = fieldMapping[field];
              }

              // Check if this is a visibility flag (state-only, not saved to DB)
              // Exception: show_solar_panel_2 maps to sys_show_second_panel_type in DB and MUST be saved
              const isVisibilityFlag = field.startsWith('show_') && field !== 'show_solar_panel_2';

              // Update state
              stateUpdates[stateFieldName] = value;
              // Also store under DB field name for optimistic update layer
              if (dbFieldName) {
                stateUpdates[dbFieldName] = value;
              }

              // Update database (skip for visibility flags - they're computed on load)
              if (dbFieldName && !isVisibilityFlag) {
                let dbValue = value;
                // Invert "isNew" fields to "existing" fields
                if (field.endsWith("_isnew")) {
                  dbValue = !value; // isNew=true means existing=false
                }
                if (dbValue === "") dbValue = null;
                dbUpdates[dbFieldName] = dbValue;
              } else if (!dbFieldName && !isVisibilityFlag) {
                logger.warn(
                  "EquipmentForm",
                  `[System ${systemNumber}] No field mapping found for: ${field}`,
                );
              }
            });

            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 6: forEach complete. stateUpdates:`,
              stateUpdates,
            );
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 7: dbUpdates:`,
              dbUpdates,
            );

            // Update local state immediately in ONE call (optimistic update)
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 8: Calling setFormData...`,
            );
            setFormData((prev) => {
              const newFormData = {
                ...prev,
                ...stateUpdates,
              };
              logger.debug(
                'EquipmentForm',
                `[System ${systemNumber}] Step 9: setFormData merging:`,
                {
                  prev: Object.keys(prev).length,
                  stateUpdates,
                  result: Object.keys(newFormData).length,
                },
              );
              return newFormData;
            });
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 10: setFormData complete`,
            );

            // Save to database in ONE call
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 11: About to save to DB, dbUpdates count:`,
              Object.keys(dbUpdates).length,
            );
            try {
              if (Object.keys(dbUpdates).length > 0) {
                logger.debug(
                  'EquipmentForm',
                  `[System ${systemNumber}] Step 12: Calling updateFields...`,
                );
                await updateFields(dbUpdates);
                logger.debug(
                  'EquipmentForm',
                  `[System ${systemNumber}] Step 13: updateFields completed`,
                );
                logger.log(
                  "EquipmentForm",
                  `[System ${systemNumber}] Batch saved ${Object.keys(dbUpdates).length} fields:`,
                  dbUpdates,
                );
              } else {
                logger.debug(
                  'EquipmentForm',
                  `[System ${systemNumber}] Step 12: No DB updates to save (dbUpdates empty)`,
                );
              }
            } catch (error) {
              logger.error(
                'EquipmentForm',
                `[System ${systemNumber}] Step ERROR: Database save failed:`,
                error,
              );
              logger.error(
                "EquipmentForm",
                `[System ${systemNumber}] Failed to batch save fields:`,
                error,
              );
            }
            logger.debug(
              'EquipmentForm',
              `[System ${systemNumber}] Step 14: handleSystemBatchChange COMPLETE`,
            );
          };

          return (
            <SystemContainer
              key={systemNumber}
              systemNumber={systemNumber}
              onDelete={
                systemNumber > 1 ? () => handleDeleteSystem(systemNumber) : null
              }
            >
              {/* Solar Panel Section */}
              <SolarPanelSection
                formData={mergedFormData}
                onChange={handleSystemFieldChange}
                onBatchChange={handleSystemBatchChange}
                systemNumber={systemNumber}
                onShowType2={() => handleSystemFieldChange('show_solar_panel_2', true, systemNumber)}
              />

              {/* 2nd Solar Panel Section - optimizer systems render it inside InverterMicroSection */}
              {mergedFormData.show_solar_panel_2 &&
                !mergedFormData.batteryonly &&
                mergedFormData.system_type !== 'optimizer' && (
                  <SolarPanel2Section
                    formData={mergedFormData}
                    onChange={handleSystemFieldChange}
                    systemNumber={systemNumber}
                  />
                )}

              {/* Inverter/Microinverter Section - Show based on system_type selection */}
              {(mergedFormData.system_type === 'microinverter' ||
                mergedFormData.system_type === 'inverter' ||
                mergedFormData.system_type === 'optimizer') && (
                <InverterMicroSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                  onBatchChange={handleSystemBatchChange}
                  systemNumber={systemNumber}
                  maxContinuousOutputAmps={
                    maxContinuousOutputAmpsPerSystem[systemNumber]
                  }
                  loadingMaxOutput={loadingMaxOutput}
                  siteZipCode={projectData?.site?.zip_code || ''}
                />
              )}


              {/* BOS Equipment - Only show when flag is set (button-triggered from InverterMicroSection) */}
              {/* Hide BOS sections when systems are combined - they should appear in Post Combine BOS container instead */}
              {/* ONLY for string inverters - microinverters render BOS inside StringCombinerPanelSection */}
              {mergedFormData.show_inverter_bos &&
                formData.combine_systems !== true &&
                mergedFormData.inverter_type !== "microinverter" &&
                (() => {
                  // For PowerWall with Gateway Configuration, use Post-SMS BOS (saves to post_sms_bos_sys{N}_type{slot}_*)
                  // For other inverters, use Utility BOS (saves to bos_sys{N}_type{slot}_*)
                  const isPowerWallWithGateway =
                    mergedFormData.inverter_make
                      ?.toLowerCase()
                      .includes("tesla") &&
                    mergedFormData.inverter_model
                      ?.toLowerCase()
                      .includes("powerwall") &&
                    (mergedFormData.gateway === "Gateway 3" ||
                      mergedFormData.gateway === "Backup Gateway 2");
                  const bosSection = isPowerWallWithGateway
                    ? "postSMS"
                    : "utility";

                  return (
                    <BOSEquipmentSection
                      formData={mergedFormData}
                      onChange={handleSystemFieldChange}
                      section={bosSection}
                      systemNumber={systemNumber}
                      maxContinuousOutputAmps={
                        maxContinuousOutputAmpsPerSystem[systemNumber]
                      }
                      loadingMaxOutput={loadingMaxOutput}
                    />
                  );
                })()}

              {/* Energy Storage System - For String Inverters */}
              {!systemSuppressESS &&
                mergedFormData.inverter_type === "inverter" &&
                mergedFormData.inverter_model && (
                  <EnergyStorageSection
                    formData={mergedFormData}
                    onChange={handleSystemFieldChange}
                    onBatchChange={handleBatchFieldChange}
                  />
                )}

              {/* String Combiner Panel - Only shown for Microinverters */}
              {mergedFormData.system_type === "microinverter" && (
                <StringCombinerPanelSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                  onBatchChange={handleSystemBatchChange}
                  systemNumber={systemNumber}
                  // Stringing props
                  solarPanelQty={
                    parseInt(mergedFormData.solar_panel_quantity) || 0
                  }
                  solarPanelQty2={
                    parseInt(mergedFormData.solar_panel_type2_quantity) || 0
                  }
                  inverterMake={mergedFormData.inverter_make || ""}
                  inverterModel={mergedFormData.inverter_model || ""}
                  inverterMaxContOutput={
                    parseFloat(mergedFormData.inverter_max_cont_output_amps) ||
                    0
                  }
                  onEnphase6CChange={handleEnphase6CChange}
                  maxContinuousOutputAmps={
                    maxContinuousOutputAmpsPerSystem[systemNumber]
                  }
                  loadingMaxOutput={loadingMaxOutput}
                />
              )}

              {/* Microinverter Stringing - MOVED INTO InverterMicroSection */}
              {/* {mergedFormData.inverter_type === 'microinverter' && (
                <MicroinverterStringingSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                />
              )} */}

              {/* Energy Storage System - For Microinverters */}
              {!systemSuppressESS &&
                mergedFormData.inverter_type === "microinverter" &&
                mergedFormData.inverter_model && (
                  <EnergyStorageSection
                    formData={mergedFormData}
                    onChange={handleSystemFieldChange}
                    onBatchChange={handleBatchFieldChange}
                  />
                )}

              {/* IQ Combiner 6C Configuration Summary - Shows auto-detected config */}
              {systemIsEnphaseCombiner6C && (
                <IQCombiner6CConfigSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                />
              )}

              {/* IQ Meter Collar - Show ONLY for Enphase Combiner 6C + Whole/Partial Home backup + Backup Switch (not Gateway 3) */}
              {systemIsEnphaseCombiner6C &&
                (mergedFormData.backup_option === "Whole Home" ||
                  mergedFormData.backup_option === "Partial Home") &&
                mergedFormData.gateway === "backup_switch" && (
                  <IQMeterCollarSection
                    formData={mergedFormData}
                    onChange={handleSystemFieldChange}
                  />
                )}

              {/* EV Charger - Show when String Combiner Panel is configured */}
              {/* SUPPRESSED FOR NOW */}
              {/* {mergedFormData.combiner_panel_make && mergedFormData.combiner_panel_model && (
                <EVChargerSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                />
              )} */}

              {/* Integrated Load Controller - Show when String Combiner Panel is configured */}
              {/* SUPPRESSED FOR NOW */}
              {/* {mergedFormData.combiner_panel_make && mergedFormData.combiner_panel_model && (
                <IntegratedLoadControllerSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                />
              )} */}

              {/* Storage Management System - Show when visibility flag is true (NOT PowerWall, NOT Enphase 6C, NOT Sol-Ark, NOT Duracell) */}
              {mergedFormData.inverter_model &&
                !systemIsEnphaseCombiner6C &&
                !systemIsPowerWall &&
                !systemIsSolArkInverter &&
                !systemIsDuracellInverter &&
                mergedFormData.show_sms &&
                (() => {
                  console.log(
                    `[System ${systemNumber}] Rendering SMS section, handleSystemBatchChange exists?`,
                    typeof handleSystemBatchChange,
                  );
                  return (
                    <StorageManagementSystemSection
                      formData={mergedFormData}
                      onChange={handleSystemFieldChange}
                      onBatchChange={handleSystemBatchChange}
                      backupOption={mergedFormData.backup_option}
                      maxContinuousOutputAmps={postSMSMinAmpFilter}
                      loadingMaxOutput={loadingMaxOutput}
                    />
                  );
                })()}


              {/* Battery Type/Input 1 - Show when visibility flag is true (NOT PowerWall) */}
              {mergedFormData.show_battery1 && (mergedFormData.show_battery_type_1 === undefined || mergedFormData.show_battery_type_1 === true) && !systemIsPowerWall && (
                <BatteryTypeSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                  onBatchChange={handleSystemBatchChange}
                  batteryNumber={1}
                  showAddButton={
                    !mergedFormData.show_battery_type_2 &&
                    !systemIsEnphaseCombiner6C &&
                    !systemIsDuracellInverter
                  }
                  onAddBatteryType2={handleAddBatteryType2}
                  isEnphase6CMode={systemIsEnphaseCombiner6C}
                  combinerPanelMake={mergedFormData.combiner_panel_make}
                  combinerPanelModel={mergedFormData.combiner_panel_model}
                  maxContinuousOutputAmps={
                    batteryMaxContinuousOutputAmpsPerSystem[systemNumber]
                  }
                  loadingMaxOutput={loadingMaxOutput}
                />
              )}

              {/* Battery Type/Input 2 - Show when visibility flag is true OR when manually added OR when Enphase 6C mode OR when Duracell inverter */}
              {(mergedFormData.show_battery2 ||
                mergedFormData.show_battery_type_2 ||
                (systemIsEnphaseCombiner6C && mergedFormData.show_battery1) ||
                systemIsDuracellInverter) && (
                <BatteryTypeSection
                  formData={mergedFormData}
                  onChange={handleSystemFieldChange}
                  onBatchChange={handleSystemBatchChange}
                  batteryNumber={2}
                  showAddButton={false}
                  isEnphase6CMode={systemIsEnphaseCombiner6C}
                  combinerPanelMake={mergedFormData.combiner_panel_make}
                  combinerPanelModel={mergedFormData.combiner_panel_model}
                  maxContinuousOutputAmps={
                    batteryMaxContinuousOutputAmpsPerSystem[systemNumber]
                  }
                  loadingMaxOutput={loadingMaxOutput}
                />
              )}

              {/* 6C Total Battery Warning */}
              {systemIsEnphaseCombiner6C &&
                totalBatteries6C > ENPHASE_6C_CONFIG.maxTotalBatteries && (
                  <Alert variant="warning" style={{ margin: "var(--spacing)" }}>
                    Total battery quantity ({totalBatteries6C}) exceeds maximum
                    of {ENPHASE_6C_CONFIG.maxTotalBatteries} for Enphase 6C
                    combiner.
                  </Alert>
                )}

              {/* Backup Load Sub Panel - MOVED TO ELECTRICAL TAB */}

              {/* Battery Combiner Panel - Show when battery1 configuration = "Battery Combiner Panel" AND (qty > 1 OR battery2 exists) */}
              {mergedFormData.battery1_configuration ===
                "Battery Combiner Panel" &&
                (parseInt(mergedFormData.battery1_quantity || "0") > 1 ||
                  mergedFormData.battery2_make) && (
                  <BatteryCombinerPanelSection
                    formData={mergedFormData}
                    onChange={handleSystemFieldChange}
                  />
                )}
            </SystemContainer>
          );
        })}

        {/* Add System 2/3/4 Button */}
        {visibleSystems.length < maxSystems && (
          <AddSectionButton
            label={`System ${visibleSystems.length + 1}`}
            onClick={() => handleAddSystem(visibleSystems.length + 1)}
          />
        )}

        {/* Post Combine BOS for Single System - Hidden unless combine decision is made */}
        {visibleSystems.length === 1 && formData.combine_systems === false && (
          <SystemContainer systemNumber="Post Combine BOS">
            <PostCombineBOSSection
              projectUuid={projectUuid}
              systemDetails={systemDetails}
              activeSystems={visibleSystems}
              utility={
                systemDetails?.utility || systemDetails?.sys1_utility || ""
              }
            />
          </SystemContainer>
        )}

        {/* BOS Detection Button - Show for 1 system (below Post Combine BOS) */}
        {visibleSystems.length === 1 && (
          <div className={equipStyles.sectionMarginTop}>
            <div
              className={`${formStyles.infoBox} ${equipStyles.infoBoxMarginBase}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <img
                src={flameIcon}
                alt=""
                className={formStyles.infoBoxIcon}
                style={{
                  width: "20px",
                  height: "20px",
                  objectFit: "contain",
                  cursor: "help",
                }}
              />
              <span className={formStyles.infoBoxContent}>
                Select all equipment and combination method before clicking to add Utility Required BOS.
              </span>
              <TableRowButton
                label="+ Utility Required BOS"
                onClick={handleDetectUtilityBOS}
                variant="outline"
              />
            </div>
          </div>
        )}

        {/* Combine Systems Section - Show when there are 2+ systems with data */}
        {visibleSystems.length >= 2 && (
          <SystemContainer systemNumber="Combine Systems">
            <div className={equipStyles.infoBoxMarginTight}>
              {/* Combine Choice Buttons */}
              <div className={equipStyles.combineButtonGroup}>
                <AddButton
                  label="Do Not Combine"
                  active={formData.combine_systems === false}
                  onClick={() => handleCombineToggle(false)}
                  showPlus={false}
                />
                <AddButton
                  label="Combine"
                  active={formData.combine_systems === true}
                  onClick={() => handleCombineToggle(true)}
                  showPlus={false}
                />
              </div>

              {/* Show landing configuration when Combine is selected */}
              {formData.combine_systems === true && (
                <CombineSystemsForm
                  projectUuid={projectUuid}
                  activeSystems={visibleSystems}
                  systemData={systemDetails}
                  existingConfiguration={{
                    combine_systems: true, // Force combine mode
                    ...(() => {
                      try {
                        return formData.ele_combine_positions &&
                          typeof formData.ele_combine_positions === "string"
                          ? JSON.parse(formData.ele_combine_positions)
                          : {};
                      } catch (e) {
                        console.warn(
                          "[EquipmentForm] Failed to parse ele_combine_positions:",
                          formData.ele_combine_positions,
                          e,
                        );
                        return {};
                      }
                    })(),
                  }}
                  onSave={handleCombineSave}
                  hasSubPanelB={formData.has_subpanel_b || false}
                  subPanelBData={{
                    busAmps: formData.ele_subpanel_b_bus_rating,
                    mainBreakerAmps: formData.ele_subpanel_b_main_breaker,
                    upstreamBreakerAmps:
                      formData.ele_subpanel_b_upstream_breaker,
                  }}
                />
              )}
            </div>
          </SystemContainer>
        )}

        {/* Post Combine BOS Container - Show for multi-system scenarios */}
        {visibleSystems.length >= 2 && (() => {
          // Case 1: Systems are NOT combined - always show PostCombineBOS
          if (formData.combine_systems === false) {
            return (
              <SystemContainer systemNumber="Post Combine BOS">
                <PostCombineBOSSection
                  projectUuid={projectUuid}
                  systemDetails={systemDetails}
                  activeSystems={visibleSystems}
                  utility={
                    systemDetails?.utility || systemDetails?.sys1_utility || ""
                  }
                />
              </SystemContainer>
            );
          }

          // Case 2: Systems ARE combined - only show if configuration is complete
          if (formData.combine_systems === true) {
            // Check if configuration is complete (all active systems have landing positions)
            const configData = (() => {
              try {
                return formData.ele_combine_positions &&
                  typeof formData.ele_combine_positions === "string"
                  ? JSON.parse(formData.ele_combine_positions)
                  : {};
              } catch (e) {
                return {};
              }
            })();

            // Check if all active systems have landing positions
            const configComplete = configData.active_systems?.every(
              (sysNum) => {
                const landing = configData.system_landings?.[`system${sysNum}`];
                return landing && landing !== "";
              },
            );

            return configComplete ? (
              <SystemContainer systemNumber="Post Combine BOS">
                <PostCombineBOSSection
                  projectUuid={projectUuid}
                  systemDetails={systemDetails}
                  activeSystems={visibleSystems}
                  utility={
                    systemDetails?.utility || systemDetails?.sys1_utility || ""
                  }
                />
              </SystemContainer>
            ) : null;
          }

          // Case 3: combine_systems is undefined/null - don't show yet
          return null;
        })()}

        {/* BOS Detection Button - Show for 2+ systems (below Combine UI) */}
        {visibleSystems.length >= 2 && (
          <div className={equipStyles.sectionMarginTop}>
            <div
              className={`${formStyles.infoBox} ${equipStyles.infoBoxMarginBase}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                textAlign: "center",
              }}
            >
              <img
                src={flameIcon}
                alt=""
                className={formStyles.infoBoxIcon}
                style={{
                  width: "20px",
                  height: "20px",
                  objectFit: "contain",
                  cursor: "help",
                }}
              />
              <span className={formStyles.infoBoxContent}>
                Select all equipment and combination method before clicking to add Utility Required BOS.
              </span>
              <TableRowButton
                label="+ Utility Required BOS"
                onClick={handleDetectUtilityBOS}
                variant="outline"
              />
            </div>
          </div>
        )}

        {/* Combine View */}
        {selectedView === "combine" && (
          <div className={equipStyles.section}>
            <CombineSystemsForm
              projectUuid={projectUuid}
              activeSystems={getActiveSystemsList()}
              systemData={formData}
              existingConfiguration={(() => {
                try {
                  return formData.ele_combine_positions &&
                    typeof formData.ele_combine_positions === "string"
                    ? JSON.parse(formData.ele_combine_positions)
                    : null;
                } catch (e) {
                  console.warn(
                    "[EquipmentForm] Failed to parse ele_combine_positions:",
                    formData.ele_combine_positions,
                    e,
                  );
                  return null;
                }
              })()}
              onSave={handleCombineSave}
              hasSubPanelB={formData.has_subpanel_b || false}
              subPanelBData={{
                busAmps: formData.ele_subpanel_b_bus_rating,
                mainBreakerAmps: formData.ele_subpanel_b_main_breaker,
                upstreamBreakerAmps: formData.ele_subpanel_b_upstream_breaker,
              }}
            />
          </div>
        )}

        {/* BOS View */}
        {selectedView === "bos" && (
          <div className={equipStyles.section}>
            <BOSPanel
              projectUuid={projectUuid}
              systemNumber={selectedSystem}
              formData={systemDetails || {}}
              projectData={projectData}
              onNavigateToTab={onNavigateToTab}
              maxContinuousOutputAmps={
                maxContinuousOutputAmpsPerSystem[selectedSystem]
              }
              batteryMaxContinuousOutputAmps={
                batteryMaxContinuousOutputAmpsPerSystem[selectedSystem]
              }
              postSMSMinAmpFilter={postSMSMinAmpFilter}
              loadingMaxOutput={loadingMaxOutput}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <FormNavigationFooter
        onPrev={handlePrev}
        onNext={handleNext}
        showPrev={true}
        prevDisabled={isPrevDisabled}
        nextLabel="Next"
      />

      {/* Add System Modal */}
      <ConfirmDialog
        isOpen={showAddSystemModal}
        onClose={() => handleAddSystemConfirm(false)}
        onConfirm={() => handleAddSystemConfirm(true)}
        title="Adding an additional system?"
        message="Would you like to add another system to this project?"
        confirmText="Yes"
        cancelText="No"
        variant="info"
        contained={true}
      />

      {/* Stringing Blocker Modal - Prevents navigation when custom stringing is incomplete */}
      <ConfirmDialog
        isOpen={showStringingBlocker}
        onClose={() => setShowStringingBlocker(false)}
        onConfirm={null}
        title="Stringing Configuration Incomplete"
        message={stringingBlockerMessage}
        confirmText={null}
        cancelText="Return to Equipment"
        variant="warning"
        contained={true}
      />

      {/* Combine Systems Toggle Confirmation Modal */}
      <ConfirmDialog
        isOpen={showCombineConfirmModal}
        onClose={handleCancelCombineToggle}
        onConfirm={handleConfirmCombineToggle}
        title="Confirm: No Longer Combining Systems"
        message="Please confirm you are no longer combining systems. This will clear all combine configuration."
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
        contained={true}
      />

      {/* BOS Detection Modal */}
      <ConfirmDialog
        isOpen={showBOSDetectionModal}
        onClose={() => setShowBOSDetectionModal(false)}
        onConfirm={handleBOSDetectionConfirm}
        title="Utility Required Equipment"
        confirmText={
          bosDetectionLoading || !bosDetectionResult || bosItemCount === 0
            ? null
            : `Add Equipment (${bosItemCount} items)`
        }
        cancelText="Cancel"
        variant="info"
        loading={bosDetectionLoading}
        contained={true}
        scopedToPanel={true}
        size="md"
        showConfirm={
          !bosDetectionLoading && bosDetectionResult && bosItemCount > 0
        }
      >
        {bosDetectionLoading ? (
          <p
            style={{
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "var(--spacing-wide)",
            }}
          >
            Detecting BOS configurations...
          </p>
        ) : bosDetectionResult && bosItemCount > 0 ? (
          <>
            <p style={{ marginBottom: "var(--spacing)" }}>
              <strong>
                Detected {bosItemCount} BOS equipment item
                {bosItemCount !== 1 ? "s" : ""}
              </strong>
            </p>

            {/* Oncor/Xcel Energy AC Disconnect Summary */}
            {bosDetectionResult.oncorXcelACDisconnect && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--primary-color)",
                  marginBottom: "var(--spacing)",
                  whiteSpace: "pre-line",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-sm)",
                    color: "var(--text-primary)",
                  }}
                >
                  {bosDetectionSummary}
                </p>
              </div>
            )}

            {bosDetectionResult.system1 && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--border-accent)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  System 1: {bosDetectionResult.system1.configName}
                </p>
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {bosDetectionResult.system1.description}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  Confidence: {bosDetectionResult.system1.confidence}
                </p>
              </div>
            )}

            {bosDetectionResult.system2 && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--border-accent)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  System 2: {bosDetectionResult.system2.configName}
                </p>
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {bosDetectionResult.system2.description}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  Confidence: {bosDetectionResult.system2.confidence}
                </p>
              </div>
            )}

            {bosDetectionResult.system3 && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--border-accent)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  System 3: {bosDetectionResult.system3.configName}
                </p>
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {bosDetectionResult.system3.description}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  Confidence: {bosDetectionResult.system3.confidence}
                </p>
              </div>
            )}

            {bosDetectionResult.system4 && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--border-accent)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  System 4: {bosDetectionResult.system4.configName}
                </p>
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {bosDetectionResult.system4.description}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  Confidence: {bosDetectionResult.system4.confidence}
                </p>
              </div>
            )}

            {bosDetectionResult.combinedConfig && (
              <div
                style={{
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--border-accent)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  Combine Point: {bosDetectionResult.combinedConfig.configName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {bosDetectionResult.combinedConfig.description}
                </p>
              </div>
            )}

            {bosDetectionSummary && (
              <div
                style={{
                  marginTop: "var(--spacing-loose)",
                  padding: "var(--spacing)",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--spacing)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-semibold)",
                    color: "var(--text-primary)",
                  }}
                >
                  Equipment to be added:
                </p>
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "'Courier New', monospace",
                    fontSize: "var(--text-xs)",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                  }}
                >
                  {bosDetectionSummary}
                </pre>
              </div>
            )}

            <div
              style={{
                marginTop: "var(--spacing)",
                padding: "var(--spacing)",
                background: "rgba(255, 193, 7, 0.1)",
                borderLeft: "3px solid #ffc107",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                }}
              >
                <strong>Note:</strong> Equipment with catalog matches will be
                auto-populated. Items without matches will require manual
                selection.
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--spacing-wide)" }}>
            <p
              style={{
                margin: "0 0 var(--spacing) 0",
                color: "var(--text-primary)",
              }}
            >
              <strong>No BOS configurations detected</strong>
            </p>
            <p
              style={{
                margin: "0 0 var(--spacing) 0",
                color: "var(--text-secondary)",
              }}
            >
              Please ensure all equipment is filled out completely (solar
              panels, inverters, batteries, etc.) and try again.
            </p>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              If you have 2+ systems, make sure to select a combination method
              (Combiner Panel or Junction Box).
            </p>
          </div>
        )}
      </ConfirmDialog>

      {/* POI Prompt Modal (for Oncor/Xcel Energy AC Disconnect) */}
      <POIPromptModal
        isOpen={showPOIPromptModal}
        onClose={() => setShowPOIPromptModal(false)}
        onConfirm={handlePOIPromptConfirm}
        systemNumber={poiPromptSystemNumber}
      />

      {/* Equipment Validation Modal (for assessment scraper) */}
      <EquipmentValidationModal
        isOpen={showEquipmentValidationModal}
        onClose={() => {
          setShowEquipmentValidationModal(false);
          setPendingEquipmentToPopulate(null);
          setEquipmentValidationResults([]);
        }}
        validationResults={equipmentValidationResults}
        onSelect={handleEquipmentSuggestionSelect}
        onProceed={handleProceedWithOriginalValues}
      />
    </form>
  );
};

export default memo(EquipmentForm);



