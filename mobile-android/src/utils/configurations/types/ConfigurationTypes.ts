// ConfigurationTypes.ts
// Shared types and interfaces for Universal Configuration Switchboard

/**
 * Equipment state extracted from system details
 * Supports all 4 systems (sys1, sys2, sys3, sys4)
 */
export interface EquipmentState {
  // Project context (for multi-system detection)
  projectId?: string;

  // System context
  systemPrefix: 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';
  systemNumber: 1 | 2 | 3 | 4;

  // Utility context
  utilityName: string;
  utilityState?: string;
  utilityBOSCombination: string;
  utilityBOSRequirements?: {
    bos_1?: string;
    bos_2?: string;
    bos_3?: string;
    bos_4?: string;
    bos_5?: string;
    bos_6?: string;
  };

  // Solar equipment
  hasSolarPanels: boolean;
  solarMake?: string;
  solarModel?: string;
  solarQuantity?: number;
  solarWattage?: number;

  // Inverter/Microinverter equipment
  inverterMake?: string;
  inverterModel?: string;
  inverterType?: 'grid-following' | 'grid-forming-following' | 'hybrid' | null;
  inverterQuantity?: number;
  inverterMaxContinuousOutput?: number; // Amps (max_cont_output_amps from inverter_data)
  inverterIsNew?: boolean; // True if new equipment, false if existing

  // Microinverter (separate from string inverter)
  microInverterMake?: string;
  microInverterModel?: string;
  microInverterIsNew?: boolean; // True if new equipment, false if existing

  // System type selection
  systemType?: 'microinverter' | 'inverter' | 'battery-only';

  // Battery equipment
  batteryQuantity: number;
  batteryMake?: string;
  batteryModel?: string;
  batteryChargingSource: 'grid-only' | 'grid-or-renewable';
  batteryMaxContinuousOutput?: number; // Amps

  // Battery 2 (if different type)
  battery2Quantity?: number;
  battery2Make?: string;
  battery2Model?: string;

  // SMS (Storage Management System)
  hasSMS: boolean;
  smsMake?: string;
  smsModel?: string;

  // Gateway
  hasGateway: boolean;
  gatewayMake?: string;
  gatewayModel?: string;

  // Backup power
  hasBackupPanel: boolean;
  backupOption?: 'Whole Home' | 'Partial Home' | 'None';
  backupPanelBusRating?: number; // Backup panel bus bar rating in amps
  utilityServiceAmps?: number; // Utility service amperage

  // System attributes (calculated)
  couplingType: 'AC' | 'DC';
  hasMultipleBatteries: boolean; // Same type, quantity > 1
  hasDifferentBatteryTypes: boolean; // Battery1 + Battery2
  isStandbyOnly: boolean;
  requiresBackupPower: boolean;
  supportsPeakShaving: boolean;

  // Existing BOS equipment (to avoid duplicates)
  existingBOS?: {
    utilityBOS?: Array<{
      equipmentType: string;
      make?: string;
      model?: string;
      ampRating?: string;
      position: number;
    }>;
    batteryBOS?: Array<{
      equipmentType: string;
      make?: string;
      model?: string;
      ampRating?: string;
      position: number;
    }>;
    postSMSBOS?: Array<{
      equipmentType: string;
      make?: string;
      model?: string;
      ampRating?: string;
      position: number;
    }>;
  };
}

/**
 * BOS Equipment to be added
 */
export interface BOSEquipment {
  equipmentType: string;
  make?: string; // Optional: auto-selected or user chooses
  model?: string; // Optional: auto-selected or user chooses
  ampRating?: string; // Optional: calculated or user chooses
  isNew: boolean;
  position: number; // Which BOS slot (1-6)
  section: 'utility' | 'battery' | 'backup' | 'post-sms' | 'combine'; // Which BOS section
  // - 'utility': String Combiner Panel BOS (bos_sys1_type1_*, bos_sys1_type2_*)
  // - 'battery': Battery Chain BOS (bos_sys1_battery1_type1_*, bos_sys1_battery1_type2_*)
  // - 'backup': Backup Load Sub Panel BOS (bos_sys1_backup_type1_*, bos_sys1_backup_type2_*)
  // - 'post-sms': Post-SMS BOS (post_sms_bos_sys1_type1_*, post_sms_bos_sys1_type2_*)
  // - 'combine': Equipment page Combine BOS (postcombine_1_1_*, postcombine_2_1_*, postcombine_3_1_*)

  // For multi-system configurations
  systemPrefix?: string; // Which system this BOS belongs to (sys1_, sys2_, etc.)
  // For 'combine' section, systemPrefix is NOT used (combine BOS has no system prefix)

  // For catalog lookup
  minAmpRating?: number; // Minimum amps required
  preferredMake?: string; // Preferred manufacturer

  // Display fields for BOS sizing information
  sizingLabel?: string; // Section-specific label (e.g., "Inverter Output", "Backup Panel Rating", "Total System Output")
  sizingCalculation?: string; // Calculation breakdown (e.g., "32A × 1.25 = 40A", "Inverter (32A) + Battery (30A) × 1.25 = 78A")
  sizingValue?: number; // Final amp value before equipment selection (e.g., 40)

  // Flags
  requiresUserSelection?: boolean; // True if multiple options exist
  autoSelected?: boolean; // True if only one option and auto-selected
}

/**
 * Configuration match result
 */
export interface ConfigurationMatch {
  // Identification
  configId: string; // e.g., "FRANKLIN_APS_WHOLE_HOME"
  configName: string; // e.g., "Franklin aPower + APS (Whole Home Backup)"
  description: string;

  // Matching confidence
  priority: number; // Lower = higher priority (1 = highest)
  confidence: 'exact' | 'high' | 'medium' | 'low';

  // Required equipment summary
  requiredEquipment: {
    solarPanels: boolean;
    batteryQuantity: number;
    batteryTypes: number; // 1 or 2
    inverterTypes: string[];
    backupPanel: boolean;
    sms: boolean;
    gateway: boolean;

    // Inverter counts
    gridFollowingInverter?: number;
    gridFormingFollowingInverter?: number;
    hybridInverter?: number;

    // Support equipment
    automaticDisconnectSwitch?: boolean;
    transferSwitch?: boolean;
    batteryCharger?: boolean;
    dedicatedDERCombiner?: boolean;

    // Meters
    biDirectionalMeters?: number;
    uniDirectionalMeters?: number;
  };

  // BOS equipment to add
  bosEquipment: BOSEquipment[];

  // Equipment sections to enable/show
  equipmentSections?: {
    solar?: boolean;
    solarType2?: boolean;
    microInverter?: boolean;
    inverter?: boolean;
    optimizer?: boolean;
    battery1?: boolean;
    battery2?: boolean;
    batteryCombinerPanel?: boolean;
    backupLoadSubPanel?: boolean;
    gateway?: boolean;
    sms?: boolean;
    ess?: boolean;
    stringCombinerPanel?: boolean;
  };

  // Meter configuration
  meterConfiguration?: {
    utilityMeter: 'bi-directional' | 'uni-directional';
    productionMetering: 'line-side' | 'der-side' | 'both' | 'none';
    meterTestBlock: boolean;
  };

  // Multi-system configuration (optional)
  multiSystemConfig?: {
    totalSystems: number; // Number of systems in this configuration
    sys1CombinesAt?: string; // Where System 1 combines (e.g., "Sol-Ark", "Main Panel A")
    sys2CombinesAt?: string; // Where System 2 combines
    sys3CombinesAt?: string; // Where System 3 combines
    sys4CombinesAt?: string; // Where System 4 combines
  };

  // User-facing information
  notes: string[];
  warnings?: string[]; // Potential issues or considerations

  // Metadata
  source: string; // Which detector file found this
  detectedAt: Date;

  // System context
  systemPrefix: string;
  systemNumber: number;
}

/**
 * Configuration detector function interface
 * Each detector checks if equipment matches a specific configuration
 */
export interface ConfigurationDetector {
  // Identification
  name: string; // Human-readable detector name
  configId: string; // Unique configuration ID

  // Execution priority (lower = earlier)
  priority: number;

  // Which utilities this applies to
  utilities: string[]; // ['APS', 'SRP', 'SCE'] or ['*'] for all

  // Multi-system configuration flags
  isMultiSystem?: boolean; // True if this config spans multiple systems
  affectedSystems?: ('sys1_' | 'sys2_' | 'sys3_' | 'sys4_')[]; // Which systems are part of this config

  // Detection function (can be async for multi-system detection)
  detect: (equipment: EquipmentState) => ConfigurationMatch | null | Promise<ConfigurationMatch | null>;

  // Optional: Pre-check before running full detection (performance optimization)
  quickCheck?: (equipment: EquipmentState) => boolean;
}

/**
 * Multi-system configuration result
 * When analyzing all 4 systems together
 */
export interface MultiSystemConfigurationResult {
  // Individual system results
  systems: {
    system1?: ConfigurationMatch[];
    system2?: ConfigurationMatch[];
    system3?: ConfigurationMatch[];
    system4?: ConfigurationMatch[];
  };

  // Best match per system
  bestMatches: {
    system1?: ConfigurationMatch;
    system2?: ConfigurationMatch;
    system3?: ConfigurationMatch;
    system4?: ConfigurationMatch;
  };

  // Overall summary
  totalSystemsAnalyzed: number;
  totalMatchesFound: number;

  // Recommendations
  recommendations: string[];
  warnings: string[];
}

/**
 * BOS auto-population request
 */
export interface BOSAutoPopulationRequest {
  projectUuid: string;
  companyUuid?: string; // For fetching preferred equipment
  systemPrefix: 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';
  systemNumber: 1 | 2 | 3 | 4;
  configurationMatch: ConfigurationMatch;

  // User preferences
  autoSelectWhenPossible: boolean; // Auto-select make/model if only one option
  skipExisting: boolean; // Skip BOS equipment that already exists
}

/**
 * BOS auto-population result
 */
export interface BOSAutoPopulationResult {
  success: boolean;
  message: string;

  // What was added
  addedEquipment: BOSEquipment[];
  skippedEquipment: BOSEquipment[]; // Already exists

  // What needs user input
  requiresUserSelection: BOSEquipment[]; // Multiple options available

  // Database payload
  databasePayload?: Record<string, any>;

  // Errors
  errors?: string[];
}

/**
 * Equipment catalog item
 */
export interface CatalogEquipment {
  type: string;
  make: string;
  model: string;
  amp: string;
  // Add other catalog fields as needed
}

/**
 * Helper type for equipment section field names
 */
export type SystemPrefix = 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';

/**
 * Utility requirements from database
 */
export interface UtilityRequirements {
  utility_name: string;
  state?: string;
  combination: string;
  bos_type_1?: string;
  bos_type_2?: string;
  bos_type_3?: string;
  bos_type_4?: string;
  bos_type_5?: string;
  bos_type_6?: string;
}
