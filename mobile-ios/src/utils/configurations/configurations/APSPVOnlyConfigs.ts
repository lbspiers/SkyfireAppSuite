// APSPVOnlyConfigs.ts
// Configuration detectors for standard APS PV-only projects (no battery, no backup)
// Priority: 3 (Must run before AC/DC-coupled configs to properly detect battery-less systems)

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Calculate BOS amp rating for PV-only systems
 * PV-only systems: No batteries, only inverter output needs to be considered
 * BOS sized to inverter output × 1.25
 */
function calculatePVOnlyBOSAmps(equipment: EquipmentState): {
  requiredAmps: number;
  calculation: string;
  inverterOutput: number;
} {
  const inverterOutput = equipment.inverterMaxContinuousOutput || 0;
  const requiredAmps = Math.ceil(inverterOutput * 1.25);
  const calculation = `${inverterOutput}A × 1.25 = ${requiredAmps}A (PV-Only)`;

  return { requiredAmps, calculation, inverterOutput };
}

// ============================================================================
// DETECTOR 1: APS PV-Only String Inverter
// Priority: 6
//
// Standard solar-only configuration with string inverter:
// - Solar panels required
// - String inverter system
// - No batteries
// - No backup
// - No SMS
// - Single system only (System 1)
// - APS utility
//
// BOS Equipment (2 items):
// - Type 1: Uni-Directional Meter (placed after inverter)
// - Type 2: Utility Disconnect (Fused AC Disconnect)
// ============================================================================

export const apsPVOnlyStringInverterDetector: ConfigurationDetector = {
  name: 'APS PV-Only String Inverter (No Battery, No Backup)',
  configId: 'APS_PV_ONLY_STRING_INVERTER',
  priority: 3,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    // Works for any system number (1, 2, 3, or 4)
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 0 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS PV-Only String Inverter] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    // Works for any system number (1, 2, 3, or 4)
    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None');

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS PV-Only String Inverter] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR PV-ONLY SYSTEM ==========
    const bosSizing = calculatePVOnlyBOSAmps(equipment);

    // Build BOS equipment list
    // BOS is placed after the inverter in the utility section
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (After Inverter) ==========
      // Sized to inverter output × 1.25

      // Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (PV-Only)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },

      // Type 2: Utility Disconnect (Fused AC Disconnect)
      {
        equipmentType: 'Utility Disconnect',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (PV-Only)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_PV_ONLY_STRING_INVERTER',
      configName: 'APS PV-Only String Inverter (No Battery, No Backup)',
      description:
        'Standard solar-only configuration for APS utility with string inverter system. Grid-tied with no battery storage or backup power capability.',
      priority: 3,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 0,
        batteryTypes: 0,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        biDirectionalMeters: 0,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        microInverter: false,
        battery1: false,
        backupLoadSubPanel: false,
        gateway: false,
        sms: false,
        ess: false,
        stringCombinerPanel: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Standard string inverter solar-only system detected',
        'Grid-tied only - no battery storage',
        'No backup power capability',
        'System shuts down when grid goes down (NEC 690.12 rapid shutdown)',
        'APS utility requires uni-directional meter for solar production',
        'BOS equipment installed after inverter',
        '2 total BOS items: Uni-Directional Meter + Utility Disconnect (Fused)',
        `PV-only system: BOS sized to ${bosSizing.requiredAmps}A (inverter × 1.25)`,
      ],

      source: 'APSPVOnlyConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: APS PV-Only Microinverter
// Priority: 6
//
// Standard solar-only configuration with microinverters:
// - Solar panels required
// - Microinverter system
// - No batteries
// - No backup
// - No SMS
// - Single system only (System 1)
// - APS utility
//
// BOS Equipment (2 items):
// - Type 1: Uni-Directional Meter (placed after string combiner)
// - Type 2: Utility Disconnect (Fused AC Disconnect)
// ============================================================================

export const apsPVOnlyMicroinverterDetector: ConfigurationDetector = {
  name: 'APS PV-Only Microinverter (No Battery, No Backup)',
  configId: 'APS_PV_ONLY_MICROINVERTER',
  priority: 3,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    // Works for any system number (1, 2, 3, or 4)
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 0 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS PV-Only Microinverter] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    // Works for any system number (1, 2, 3, or 4)
    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None');

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS PV-Only Microinverter] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR PV-ONLY SYSTEM ==========
    const bosSizing = calculatePVOnlyBOSAmps(equipment);

    // Build BOS equipment list
    // BOS is placed after the string combiner in the pre-combine section
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (After String Combiner) ==========
      // Sized to inverter output × 1.25

      // Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Utility BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (PV-Only)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },

      // Type 2: Utility Disconnect (Fused AC Disconnect)
      {
        equipmentType: 'Utility Disconnect',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Utility BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (PV-Only)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_PV_ONLY_MICROINVERTER',
      configName: 'APS PV-Only Microinverter (No Battery, No Backup)',
      description:
        'Standard solar-only configuration for APS utility with microinverter system. Grid-tied with no battery storage or backup power capability.',
      priority: 3,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 0,
        batteryTypes: 0,
        inverterTypes: ['Microinverter'],
        backupPanel: false,
        sms: false,
        gateway: false,
        biDirectionalMeters: 0,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false,
        microInverter: true,
        battery1: false,
        backupLoadSubPanel: false,
        gateway: false,
        sms: false,
        ess: false,
        stringCombinerPanel: false, // Microinverter systems typically use built-in combiner
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Standard microinverter solar-only system detected',
        'Grid-tied only - no battery storage',
        'No backup power capability',
        'System shuts down when grid goes down (NEC 690.12 rapid shutdown)',
        'APS utility requires uni-directional meter for solar production',
        'BOS equipment installed after string combiner',
        '2 total BOS items: Uni-Directional Meter + Utility Disconnect (Fused)',
        `PV-only system: BOS sized to ${bosSizing.requiredAmps}A (inverter × 1.25)`,
      ],

      source: 'APSPVOnlyConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all APS PV-Only detectors
// ============================================================================

export const apsPVOnlyDetectors: ConfigurationDetector[] = [
  apsPVOnlyStringInverterDetector,
  apsPVOnlyMicroinverterDetector,
];
