// APSConfigurationSwitchboard.ts
// Configuration logic for ESS systems with multi-utility support
// Universal logic for PV-only and No BOS, utility-specific for ESS

export interface SwitchboardInputs {
  // Utility Context (NEW)
  utilityName: string; // The actual utility name (e.g., "APS", "SCE")
  utilityBOSCombination: string; // From utility_requirements.combination
  utilitySupportsESS: boolean; // Whether utility has ESS configurations
  utilityBOSRequirements?: {
    bos1?: string;
    bos2?: string;
    bos3?: string;
    bos4?: string;
    bos5?: string;
    bos6?: string;
  };

  // Equipment State
  hasBattery: boolean; // NEW: Whether system has batteries
  isStandbyOnly: boolean;
  hasSolarPV: boolean;
  batteryChargingSource: "grid-only" | "grid-or-renewable";
  couplingType: "AC" | "DC";
  requiresBackupPower: boolean;
  supportsPeakShaving: boolean;
  hasMultipleBatteries: boolean; // True if battery quantity > 1 (same battery type)
}

export interface ConfigurationOutput {
  configurationId: string;
  configurationName: string;
  description: string;
  requiredEquipment: RequiredEquipment;
  equipmentSections: EquipmentSections;
  meterConfiguration: MeterConfiguration;
  notes: string[];
}

export interface RequiredEquipment {
  // Core Equipment
  solarPanels: boolean;
  batteryQuantity: number; // Total number of batteries (can be multiple units of same type)
  batteryTypes: number; // Number of different battery types (usually just 1)

  // Inverter Types
  gridFollowingInverter: number;
  gridFormingFollowingInverter: number;
  hybridInverter: number;

  // Support Equipment
  backupLoadPanel: boolean;
  automaticDisconnectSwitch: boolean;
  transferSwitch: boolean;
  batteryCharger: boolean;
  dedicatedDERCombiner: boolean;

  // Meter Requirements
  biDirectionalMeters: number;
  uniDirectionalMeters: number;

  // System Features
  peakShaving: boolean;
}

export interface EquipmentSections {
  solar: boolean;
  solarType2: boolean;
  microInverter: boolean;
  inverter: boolean;
  optimizer: boolean;
  battery1: boolean;
  battery2: boolean; // Only used if actually need 2 different battery types
  batteryCombinerPanel: boolean;
  backupLoadSubPanel: boolean;
  gateway: boolean;
  sms: boolean;
  ess: boolean;
  stringCombinerPanel: boolean;
  bos: {
    type1: boolean;
    type2: boolean;
    type3: boolean;
    type4: boolean;
    type5: boolean;
    type6: boolean;
  };
}

export interface MeterConfiguration {
  utilityMeter: "bi-directional" | "uni-directional";
  productionMetering: "line-side" | "der-side" | "both" | "none";
  meterTestBlock: boolean;
}

// Main switchboard logic
export class APSConfigurationSwitchboard {
  /**
   * Main decision tree logic - determines configuration based on boolean inputs
   * Universal flow: No BOS → PV-only → ESS (utility-specific)
   */
  static determineConfiguration(inputs: SwitchboardInputs): string {
    const {
      utilityName,
      utilityBOSCombination,
      utilitySupportsESS,
      hasBattery,
      hasSolarPV,
    } = inputs;

    // STEP 1: Universal check for "No BOS"
    if (utilityBOSCombination === 'No BOS') {
      return 'NO-BOS';
    }

    // STEP 2: PV-only system (no battery) - works for all utilities
    if (!hasBattery && hasSolarPV) {
      return 'PV-UTILITY';
    }

    // STEP 3: ESS Configurations - utility-specific
    if (hasBattery) {
      // Check if this utility has ESS configurations
      if (utilityName === 'APS' && utilitySupportsESS) {
        // Run APS ESS logic (A-1 through D)
        return this.determineAPSESSConfiguration(inputs);
      }

      // Future: Add other utilities
      // if (utilityName === 'SCE' && utilitySupportsESS) {
      //   return this.determineSCEESSConfiguration(inputs);
      // }

      // Default: Utility doesn't have specific ESS configs
      return 'UTILITY-DEFAULT-ESS';
    }

    // Default fallback (should not reach here with valid inputs)
    return 'INVALID';
  }

  /**
   * APS-specific ESS configuration logic (A-1 through D)
   * Separated from universal logic for maintainability
   */
  private static determineAPSESSConfiguration(inputs: SwitchboardInputs): string {
    const {
      isStandbyOnly,
      hasSolarPV,
      batteryChargingSource,
      couplingType,
      requiresBackupPower,
      supportsPeakShaving,
      hasMultipleBatteries,
    } = inputs;

    // CONFIGURATION D: Standby Battery Only
    if (isStandbyOnly === true) {
      return "D";
    }

    // DC COUPLED CONFIGURATIONS (C-1, C-2)
    if (couplingType === "DC" && hasSolarPV === true) {
      if (supportsPeakShaving === true) {
        if (requiresBackupPower === true) {
          return "C-2"; // DC Coupled with backup and peak shaving
        } else {
          return "C-1"; // DC Coupled with peak shaving only
        }
      }
    }

    // AC COUPLED - GRID ONLY CONFIGURATION (A-1, A-2)
    if (batteryChargingSource === "grid-only" && couplingType === "AC") {
      if (requiresBackupPower === true) {
        return "A-1"; // Grid only with backup
      } else {
        return "A-2"; // Grid only without backup (PCS)
      }
    }

    // AC COUPLED - GRID OR RENEWABLE CONFIGURATIONS (B-1, B-2, B-3, B-4, B-5)
    if (
      batteryChargingSource === "grid-or-renewable" &&
      couplingType === "AC" &&
      hasSolarPV === true
    ) {
      if (requiresBackupPower === true) {
        if (hasMultipleBatteries === true) {
          return "B-1"; // Multiple batteries (qty > 1) with backup
        } else {
          return "B-3"; // Single battery with backup
        }
      } else {
        if (hasMultipleBatteries === true) {
          return "B-5"; // Multiple batteries without backup
        } else {
          // Could be B-2 (with PCS) or B-4 (standard)
          // Defaulting to B-4 for now
          return "B-4"; // Standard configuration (no backup)
        }
      }
    }

    // Default fallback
    return "INVALID";
  }

  /**
   * Detect if project has multiple batteries based on equipment
   * This can be called by your app to automatically set hasMultipleBatteries
   * @param batteryQuantity The quantity of batteries in the battery1 section
   * @returns true if quantity > 1
   */
  static detectMultipleBatteries(batteryQuantity: number | string): boolean {
    const qty =
      typeof batteryQuantity === "string"
        ? parseInt(batteryQuantity)
        : batteryQuantity;
    return qty > 1;
  }

  /**
   * Reverse engineer the configuration from existing equipment
   * This allows the app to identify which configuration is being used
   * based on equipment already entered
   *
   * @param equipment - Equipment state to analyze
   * @param utilityName - Utility name (defaults to "APS" for backwards compatibility)
   * @param utilityBOSCombination - BOS combination from utility requirements
   * @param utilitySupportsESS - Whether utility has ESS configurations
   */
  static identifyConfigurationFromEquipment(
    equipment: {
      solarPanels: boolean;
      batteryQuantity: number;
      inverterType: "grid-following" | "grid-forming-following" | "hybrid" | null;
      backupPower: boolean;
      chargingSource: "grid-only" | "grid-or-renewable";
      couplingType: "AC" | "DC";
    },
    utilityName: string = "APS",
    utilityBOSCombination: string = "",
    utilitySupportsESS: boolean = true
  ): string {
    // Build inputs from equipment
    const inputs: SwitchboardInputs = {
      // Utility context
      utilityName,
      utilityBOSCombination,
      utilitySupportsESS,
      utilityBOSRequirements: undefined,

      // Equipment state
      hasBattery: equipment.batteryQuantity > 0,
      isStandbyOnly:
        !equipment.solarPanels &&
        equipment.chargingSource === "grid-only",
      hasSolarPV: equipment.solarPanels,
      batteryChargingSource: equipment.chargingSource,
      couplingType:
        equipment.inverterType === "hybrid" ? "DC" : equipment.couplingType,
      requiresBackupPower: equipment.backupPower,
      supportsPeakShaving: equipment.inverterType === "hybrid",
      hasMultipleBatteries: equipment.batteryQuantity > 1,
    };

    return this.determineConfiguration(inputs);
  }

  /**
   * Get full configuration details including all required equipment
   */
  static getConfigurationDetails(configId: string): ConfigurationOutput {
    const configurations: Record<string, ConfigurationOutput> = {
      "A-1": {
        configurationId: "A-1",
        configurationName: "AC Coupled A-1",
        description:
          "Battery charged from grid only with backup power capability",
        requiredEquipment: {
          solarPanels: false,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 1,
          hybridInverter: 0,
          backupLoadPanel: true,
          automaticDisconnectSwitch: true,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 3,
          uniDirectionalMeters: 0,
          peakShaving: false,
        },
        equipmentSections: {
          solar: false,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: true,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "both",
          meterTestBlock: false,
        },
        notes: [
          "Battery charges from grid only",
          "Provides backup power during outages",
          "Requires ADS for grid isolation",
          "No solar PV in this configuration",
        ],
      },

      "A-2": {
        configurationId: "A-2",
        configurationName: "AC Coupled A-2",
        description:
          "Battery charged from grid only with Power Control System (PCS/curtailment)",
        requiredEquipment: {
          solarPanels: false,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 1,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 2,
          uniDirectionalMeters: 0,
          peakShaving: true,
        },
        equipmentSections: {
          solar: false,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "der-side",
          meterTestBlock: false,
        },
        notes: [
          "Battery charges from grid only",
          "Provides customer load curtailment/PCS",
          "System shuts down during grid outage",
          "Used for peak shaving and load shifting",
        ],
      },

      "B-1": {
        configurationId: "B-1",
        configurationName: "AC Coupled B-1",
        description:
          "Battery charged from grid or renewable with multiple batteries (qty > 1) and backup",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 2, // Multiple units of same battery type
          batteryTypes: 1, // Single battery type
          gridFollowingInverter: 1,
          gridFormingFollowingInverter: 2,
          hybridInverter: 0,
          backupLoadPanel: true,
          automaticDisconnectSwitch: true,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: true,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 2,
          peakShaving: false,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true, // Battery Type 1 with quantity > 1
          battery2: false, // No second battery type needed
          batteryCombinerPanel: true,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: true,
          stringCombinerPanel: true,
          bos: {
            type1: true,
            type2: true,
            type3: true,
            type4: true,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "both",
          meterTestBlock: false,
        },
        notes: [
          "Multiple battery units of the same type (quantity > 1)",
          "Includes solar PV array",
          "Provides backup power during outages",
          "Requires dedicated DER combiner panel for multiple batteries",
        ],
      },

      "B-2": {
        configurationId: "B-2",
        configurationName: "AC Coupled B-2",
        description:
          "Battery charged from grid or renewable with PCS (curtailment)",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 2,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 1,
          peakShaving: true,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "line-side",
          meterTestBlock: false,
        },
        notes: [
          "Single battery system",
          "Includes solar PV array",
          "Provides customer load curtailment/PCS",
          "System shuts down during grid outage",
        ],
      },

      "B-3": {
        configurationId: "B-3",
        configurationName: "AC Coupled B-3",
        description:
          "Battery charged from grid or renewable with single battery and backup",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 1,
          gridFormingFollowingInverter: 1,
          hybridInverter: 0,
          backupLoadPanel: true,
          automaticDisconnectSwitch: true,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 1,
          peakShaving: false,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: true,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "line-side",
          meterTestBlock: false,
        },
        notes: [
          "Single battery system",
          "Includes solar PV array",
          "Provides backup power during outages",
          "Requires ADS for grid isolation",
        ],
      },

      "B-4": {
        configurationId: "B-4",
        configurationName: "AC Coupled B-4",
        description:
          "Battery charged from grid or renewable (standard configuration)",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 2,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: true,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 1,
          peakShaving: false,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: true,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "both",
          meterTestBlock: false,
        },
        notes: [
          "Standard configuration",
          "No backup power capability",
          "No PCS/curtailment",
          "Includes dedicated DER combiner panel",
        ],
      },

      "B-5": {
        configurationId: "B-5",
        configurationName: "AC Coupled B-5",
        description:
          "Battery charged from grid or renewable with multiple batteries (qty > 1) and PCS",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 2, // Multiple units of same battery type
          batteryTypes: 1, // Single battery type
          gridFollowingInverter: 2,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 1,
          peakShaving: true,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true, // Battery Type 1 with quantity > 1
          battery2: false, // No second battery type needed
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "line-side",
          meterTestBlock: false,
        },
        notes: [
          "Multiple battery units of the same type (quantity > 1)",
          "Includes solar PV array",
          "Provides customer load curtailment/PCS",
          "Two utility disconnects required",
        ],
      },

      "C-1": {
        configurationId: "C-1",
        configurationName: "DC Coupled Hybrid C-1",
        description: "DC coupled hybrid system with peak shaving capability",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 0,
          hybridInverter: 1,
          backupLoadPanel: true,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 2,
          uniDirectionalMeters: 2,
          peakShaving: true,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: false,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: true,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "both",
          meterTestBlock: false,
        },
        notes: [
          "DC coupled system with hybrid inverter",
          "Battery may provide peak shaving",
          "Optional backup load equipment",
          "PV array directly connected to hybrid inverter",
        ],
      },

      "C-2": {
        configurationId: "C-2",
        configurationName: "DC Coupled Hybrid C-2",
        description:
          "DC coupled hybrid system with peak shaving and backup power",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 0,
          hybridInverter: 1,
          backupLoadPanel: true,
          automaticDisconnectSwitch: true,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 2,
          uniDirectionalMeters: 0,
          peakShaving: true,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: true,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: true,
            type3: true,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "der-side",
          meterTestBlock: false,
        },
        notes: [
          "DC coupled system with hybrid inverter",
          "Provides backup power during outages",
          "Battery may provide peak shaving",
          "Requires ADS for grid isolation",
        ],
      },

      D: {
        configurationId: "D",
        configurationName: "Standby Battery Configuration",
        description: "Standby battery system without renewable energy sources",
        requiredEquipment: {
          solarPanels: false,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 1,
          hybridInverter: 0,
          backupLoadPanel: true,
          automaticDisconnectSwitch: false,
          transferSwitch: true,
          batteryCharger: true,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 0,
          uniDirectionalMeters: 0,
          peakShaving: false,
        },
        equipmentSections: {
          solar: false,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: false,
          stringCombinerPanel: false,
          bos: {
            type1: true,
            type2: false,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "none",
          meterTestBlock: false,
        },
        notes: [
          "Standby battery only - no solar",
          "Includes battery charger",
          "Requires transfer switch",
          "Provides backup power during outages",
        ],
      },

      "NO-BOS": {
        configurationId: "NO-BOS",
        configurationName: "No BOS Required",
        description:
          "Utility does not require BOS equipment - custom configuration only",
        requiredEquipment: {
          solarPanels: false,
          batteryQuantity: 0,
          batteryTypes: 0,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 0,
          uniDirectionalMeters: 0,
          peakShaving: false,
        },
        equipmentSections: {
          solar: false,
          solarType2: false,
          microInverter: false,
          inverter: false,
          optimizer: false,
          battery1: false,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: false,
          stringCombinerPanel: false,
          bos: {
            type1: false,
            type2: false,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "none",
          meterTestBlock: false,
        },
        notes: [
          "This utility does not require BOS equipment",
          "Configure equipment manually as needed",
        ],
      },

      "PV-UTILITY": {
        configurationId: "PV-UTILITY",
        configurationName: "PV-Only System",
        description:
          "Solar PV system without battery storage - uses utility-specific BOS requirements",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 0,
          batteryTypes: 0,
          gridFollowingInverter: 1,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 0,
          peakShaving: false,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: false,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: false,
          stringCombinerPanel: true,
          bos: {
            type1: false, // Will be populated from utility requirements
            type2: false,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "line-side",
          meterTestBlock: false,
        },
        notes: [
          "PV-only system without battery storage",
          "Uses utility-specific BOS requirements",
          "No backup power capability",
        ],
      },

      "UTILITY-DEFAULT-ESS": {
        configurationId: "UTILITY-DEFAULT-ESS",
        configurationName: "Utility Default ESS",
        description:
          "Standard ESS configuration for utilities without specific ESS requirements",
        requiredEquipment: {
          solarPanels: true,
          batteryQuantity: 1,
          batteryTypes: 1,
          gridFollowingInverter: 1,
          gridFormingFollowingInverter: 1,
          hybridInverter: 0,
          backupLoadPanel: true,
          automaticDisconnectSwitch: true,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 1,
          uniDirectionalMeters: 1,
          peakShaving: false,
        },
        equipmentSections: {
          solar: true,
          solarType2: false,
          microInverter: false,
          inverter: true,
          optimizer: false,
          battery1: true,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: true,
          gateway: true,
          sms: false,
          ess: true,
          stringCombinerPanel: true,
          bos: {
            type1: false, // Will be populated from utility requirements
            type2: false,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "both",
          meterTestBlock: false,
        },
        notes: [
          "Standard ESS configuration",
          "Uses utility-specific BOS requirements",
          "Suitable for utilities without custom ESS configurations",
        ],
      },

      INVALID: {
        configurationId: "INVALID",
        configurationName: "Invalid Configuration",
        description:
          "Unable to determine valid configuration from provided inputs",
        requiredEquipment: {
          solarPanels: false,
          batteryQuantity: 0,
          batteryTypes: 0,
          gridFollowingInverter: 0,
          gridFormingFollowingInverter: 0,
          hybridInverter: 0,
          backupLoadPanel: false,
          automaticDisconnectSwitch: false,
          transferSwitch: false,
          batteryCharger: false,
          dedicatedDERCombiner: false,
          biDirectionalMeters: 0,
          uniDirectionalMeters: 0,
          peakShaving: false,
        },
        equipmentSections: {
          solar: false,
          solarType2: false,
          microInverter: false,
          inverter: false,
          optimizer: false,
          battery1: false,
          battery2: false,
          batteryCombinerPanel: false,
          backupLoadSubPanel: false,
          gateway: false,
          sms: false,
          ess: false,
          stringCombinerPanel: false,
          bos: {
            type1: false,
            type2: false,
            type3: false,
            type4: false,
            type5: false,
            type6: false,
          },
        },
        meterConfiguration: {
          utilityMeter: "bi-directional",
          productionMetering: "none",
          meterTestBlock: false,
        },
        notes: [
          "Please check input parameters",
          "Ensure all required fields are provided",
        ],
      },
    };

    return configurations[configId] || configurations["INVALID"];
  }

  /**
   * Get a simplified decision matrix for quick reference
   */
  static getDecisionMatrix(): Array<{
    inputs: Partial<SwitchboardInputs>;
    output: string;
  }> {
    return [
      // Standby only
      { inputs: { isStandbyOnly: true }, output: "D" },

      // DC Coupled
      {
        inputs: {
          couplingType: "DC",
          hasSolarPV: true,
          supportsPeakShaving: true,
          requiresBackupPower: true,
        },
        output: "C-2",
      },
      {
        inputs: {
          couplingType: "DC",
          hasSolarPV: true,
          supportsPeakShaving: true,
          requiresBackupPower: false,
        },
        output: "C-1",
      },

      // AC Coupled - Grid Only
      {
        inputs: {
          batteryChargingSource: "grid-only",
          couplingType: "AC",
          requiresBackupPower: true,
        },
        output: "A-1",
      },
      {
        inputs: {
          batteryChargingSource: "grid-only",
          couplingType: "AC",
          requiresBackupPower: false,
        },
        output: "A-2",
      },

      // AC Coupled - Grid or Renewable (hasMultipleBatteries now means qty > 1)
      {
        inputs: {
          batteryChargingSource: "grid-or-renewable",
          couplingType: "AC",
          hasSolarPV: true,
          requiresBackupPower: true,
          hasMultipleBatteries: true,
        },
        output: "B-1",
      },
      {
        inputs: {
          batteryChargingSource: "grid-or-renewable",
          couplingType: "AC",
          hasSolarPV: true,
          requiresBackupPower: false,
          hasMultipleBatteries: true,
        },
        output: "B-5",
      },
      {
        inputs: {
          batteryChargingSource: "grid-or-renewable",
          couplingType: "AC",
          hasSolarPV: true,
          requiresBackupPower: true,
          hasMultipleBatteries: false,
        },
        output: "B-3",
      },
      {
        inputs: {
          batteryChargingSource: "grid-or-renewable",
          couplingType: "AC",
          hasSolarPV: true,
          requiresBackupPower: false,
          hasMultipleBatteries: false,
        },
        output: "B-2",
      },
      {
        inputs: {
          batteryChargingSource: "grid-or-renewable",
          couplingType: "AC",
          hasSolarPV: true,
          requiresBackupPower: false,
        },
        output: "B-4",
      },
    ];
  }

  /**
   * Validate that inputs are complete and consistent
   */
  static validateInputs(inputs: Partial<SwitchboardInputs>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for required fields when not standby
    if (inputs.isStandbyOnly === false) {
      if (inputs.hasSolarPV === undefined)
        errors.push("Solar PV selection required");
      if (inputs.batteryChargingSource === undefined)
        errors.push("Battery charging source required");
      if (inputs.couplingType === undefined)
        errors.push("Coupling type required");
      if (inputs.requiresBackupPower === undefined)
        errors.push("Backup power selection required");
      if (inputs.supportsPeakShaving === undefined)
        errors.push("Peak shaving selection required");
      if (inputs.hasMultipleBatteries === undefined)
        errors.push("Multiple batteries selection required");
    }

    // Check for logical inconsistencies
    if (
      inputs.batteryChargingSource === "grid-or-renewable" &&
      inputs.hasSolarPV === false
    ) {
      errors.push("Grid-or-renewable charging requires solar PV");
    }

    if (inputs.couplingType === "DC" && inputs.hasSolarPV === false) {
      errors.push("DC coupling requires solar PV");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Suggest equipment based on configuration
   */
  static suggestEquipment(configId: string): string[] {
    const config = this.getConfigurationDetails(configId);
    const suggestions: string[] = [];

    if (config.requiredEquipment.solarPanels) {
      suggestions.push("Add solar panel array");
    }

    // Handle battery suggestions based on quantity
    if (config.requiredEquipment.batteryQuantity === 1) {
      suggestions.push("Add single battery system (quantity: 1)");
    } else if (config.requiredEquipment.batteryQuantity > 1) {
      suggestions.push(
        `Add multiple units of the same battery type (quantity: ${config.requiredEquipment.batteryQuantity})`
      );
      if (config.requiredEquipment.dedicatedDERCombiner) {
        suggestions.push(
          "Add dedicated DER combiner panel for multiple batteries"
        );
      }
    }

    if (config.requiredEquipment.hybridInverter > 0) {
      suggestions.push("Add hybrid inverter (DC coupled system)");
    } else if (config.requiredEquipment.gridFormingFollowingInverter > 0) {
      suggestions.push(
        `Add ${config.requiredEquipment.gridFormingFollowingInverter} grid forming/following inverter(s)`
      );
    }

    if (config.requiredEquipment.gridFollowingInverter > 0) {
      suggestions.push(
        `Add ${config.requiredEquipment.gridFollowingInverter} grid following inverter(s)`
      );
    }

    if (config.requiredEquipment.backupLoadPanel) {
      suggestions.push("Add backup load panel");
    }

    if (config.requiredEquipment.automaticDisconnectSwitch) {
      suggestions.push(
        "Add automatic disconnect switch (ADS) for grid isolation"
      );
    }

    if (config.requiredEquipment.transferSwitch) {
      suggestions.push("Add automatic/manual transfer switch");
    }

    if (config.requiredEquipment.batteryCharger) {
      suggestions.push("Add battery charger");
    }

    suggestions.push(
      `Install ${config.requiredEquipment.biDirectionalMeters} bi-directional meter(s)`
    );

    if (config.requiredEquipment.uniDirectionalMeters > 0) {
      suggestions.push(
        `Install ${config.requiredEquipment.uniDirectionalMeters} uni-directional meter(s)`
      );
    }

    return suggestions;
  }
}

// Export convenience functions
export const determineAPSConfiguration =
  APSConfigurationSwitchboard.determineConfiguration;
export const getAPSConfigurationDetails =
  APSConfigurationSwitchboard.getConfigurationDetails;
export const validateAPSInputs = APSConfigurationSwitchboard.validateInputs;
export const suggestAPSEquipment = APSConfigurationSwitchboard.suggestEquipment;
export const detectMultipleBatteries =
  APSConfigurationSwitchboard.detectMultipleBatteries;
export const identifyConfigurationFromEquipment =
  APSConfigurationSwitchboard.identifyConfigurationFromEquipment;
