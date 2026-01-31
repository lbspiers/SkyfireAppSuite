/**
 * BOS Configuration Types
 * Type definitions for utility-required BOS detection and auto-population
 */

/**
 * Equipment state extracted from project for configuration detection
 */
export interface EquipmentState {
  systemPrefix: 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';
  systemNumber: 1 | 2 | 3 | 4;
  utilityName: string;

  // Solar
  hasSolarPanels: boolean;
  solarPanelMake: string;
  solarPanelModel: string;
  solarQuantity: number;
  solarWattage: number;
  solarPanelIsNew: boolean;

  // Inverter
  hasInverter: boolean;
  inverterMake: string;
  inverterModel: string;
  inverterType: 'microinverter' | 'inverter' | '';
  inverterMaxContOutput: number;
  inverterQty: number;
  inverterIsNew: boolean;
  aggregatePVBreaker: number;

  // Battery
  hasBattery: boolean;
  batteryMake: string;
  batteryModel: string;
  batteryQuantity: number;
  batteryMaxContOutput: number;  // Max continuous output (for AC-coupled BOS sizing)
  batteryIsNew: boolean;
  batteryCoupleType?: 'AC' | 'DC' | '';  // From API lookup
  couplingType: 'AC' | 'DC';  // Derived from inverter type + battery coupling

  // SMS
  hasSMS: boolean;
  smsMake: string;
  smsModel: string;
  smsIsNew: boolean;

  // Backup
  hasBackupPanel: boolean;
  backupMake: string;
  backupModel: string;
  backupBusRating: number;
  backupPanelBusRating?: number;  // Bus bar rating from backup load sub panel
  backupOption: 'Whole Home' | 'Partial Home' | 'None' | '';
  backupIsNew: boolean;

  // Point of Interconnection (POI) - for utility-specific BOS detection
  poiType: 'supply_side' | 'load_side' | null;

  // Existing BOS (to skip duplicates)
  existingBOS: {
    utility: number[];      // Positions already filled
    battery1: number[];
    battery2: number[];
    backup: number[];
    postSMS: number[];
  };
}

/**
 * Single BOS equipment item to be added
 */
export interface BOSEquipmentItem {
  equipmentType: string;           // e.g., "Uni-Directional Meter", "AC Disconnect"
  position: number;                // Slot number (1-6 for utility, 1-3 for others)
  section: 'utility' | 'battery1' | 'battery2' | 'backup' | 'postSMS' | 'combine';
  systemNumber: number;
  minAmpRating: number;            // NEC 1.25× calculated minimum
  sizingCalculation: string;       // e.g., "32A × 1.25 = 40A"
  blockName: 'PRE COMBINE' | 'ESS' | 'BACKUP LOAD SUB PANEL' | 'POST SMS' | 'POST COMBINE';
  isNew: boolean;                  // New vs existing equipment

  // Auto-populated after catalog lookup
  make?: string;
  model?: string;
  ampRating?: string;
}

/**
 * Configuration match result
 */
export interface ConfigurationMatch {
  configId: string;
  configName: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  bosEquipment: BOSEquipmentItem[];
}

/**
 * Multi-system configuration result
 */
export interface ProjectConfigurationResult {
  system1?: ConfigurationMatch;
  system2?: ConfigurationMatch;
  system3?: ConfigurationMatch;
  system4?: ConfigurationMatch;
  combinedConfig?: ConfigurationMatch;  // For multi-system combine point BOS
  allBOSItems: BOSEquipmentItem[];
}

/**
 * Configuration detector function signature
 */
export type ConfigurationDetector = (equipment: EquipmentState) => ConfigurationMatch | null;
