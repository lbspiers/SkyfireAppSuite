// FranklinAPSConfigs.ts
// Configuration detectors for Franklin Battery + APS Utility combinations
// HIGHEST PRIORITY - Most specific configurations

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Check if equipment is Franklin aPower battery
 */
function isFranklinAPowerBattery(equipment: EquipmentState): boolean {
  return !!(
    equipment.batteryMake?.toLowerCase().includes('franklin') &&
    equipment.batteryModel?.toLowerCase().includes('apower') &&
    equipment.batteryQuantity > 0
  );
}

/**
 * Helper: Check if SMS is Franklin Agate
 */
function isFranklinAgateSMS(equipment: EquipmentState): boolean {
  return !!(
    equipment.smsMake?.toLowerCase().includes('franklin') &&
    equipment.smsModel?.toLowerCase().includes('agate')
  );
}

/**
 * Helper: Calculate battery BOS amp rating with 1.25x safety factor
 */
function calculateBatteryBOSAmps(equipment: EquipmentState): number {
  const baseAmps = equipment.batteryMaxContinuousOutput || 100; // Default to 100A if not specified
  return Math.ceil(baseAmps * 1.25);
}

/**
 * Helper: Calculate Post-SMS BOS amp rating for AC-coupled systems
 * Franklin aPower has separate battery inverter (AC-coupled)
 * Post-SMS must handle both inverter + battery outputs simultaneously
 */
function calculatePostSMSAmps(equipment: EquipmentState): {
  requiredAmps: number;
  calculation: string;
  inverterOutput: number;
  batteryOutput: number;
} {
  const inverterOutput = equipment.inverterMaxContinuousOutput || 0;
  const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;
  const requiredAmps = Math.ceil(totalOutput * 1.25);
  const calculation = `Inverter (${inverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${requiredAmps}A (AC-Coupled)`;

  return { requiredAmps, calculation, inverterOutput, batteryOutput };
}

// ============================================================================
// DETECTOR 1: Franklin aPower + APS + Whole Home Backup
// Priority: 1 (HIGHEST)
// ============================================================================

export const franklinAPSWholeHomeDetector: ConfigurationDetector = {
  name: 'Franklin aPower + APS (Whole Home Backup)',
  configId: 'FRANKLIN_APS_WHOLE_HOME',
  priority: 1,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Whole Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin APS Whole Home] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      equipment.backupOption === 'Whole Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin APS Whole Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Franklin aPower batteries are AC-COUPLED (separate battery inverter)
    // Post-SMS BOS must handle inverter + battery outputs simultaneously

    // Battery BOS sizing (battery chain equipment)
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);

    // Post-SMS BOS sizing: AC-coupled = (inverter + battery) × 1.25
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin APS Whole Home] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Battery BOS': `${equipment.batteryMaxContinuousOutput}A × 1.25 = ${batteryBOSAmps}A`,
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Build BOS equipment list
    // Based on franklinAPSAutoConfig.ts existing implementation
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) ==========

      // Utility BOS Type 1: Uni-Directional Meter (Fixed - always Milbank U5929XL @ 100A)
      {
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
        position: 1,
        section: 'utility',
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY) - BETWEEN BATTERY AND SMS ==========
      // NOTE: Database currently only has type1 and type2. Type3-6 columns need to be added via database migration.
      // TODO: Add type3 back once database migration is complete

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },
    ];

    return {
      configId: 'FRANKLIN_APS_WHOLE_HOME',
      configName: 'Franklin aPower + APS (Whole Home Backup)',
      description:
        'Optimized configuration for Franklin aPower battery with Agate SMS on APS utility with whole home backup capability.',
      priority: 1,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: true,
        sms: true,
        gateway: true,
        biDirectionalMeters: 3,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        sms: true,
        ess: true,
        stringCombinerPanel: false,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Franklin aPower battery system with Agate SMS detected',
        'Whole home backup capability via Franklin Agate gateway',
        'APS utility requires uni-directional meter for solar production',
        'Bi-directional meter for battery charge/discharge monitoring',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'FranklinAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: Franklin aPower + APS + Partial Home Backup
// Priority: 2
// ============================================================================

export const franklinAPSPartialHomeDetector: ConfigurationDetector = {
  name: 'Franklin aPower + APS (Partial Home Backup)',
  configId: 'FRANKLIN_APS_PARTIAL_HOME',
  priority: 2,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Partial Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin APS Partial Home] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      equipment.backupOption === 'Partial Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin APS Partial Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin APS Partial Home] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // SAME BOS equipment as Whole Home (only difference is backup panel configuration)
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) ==========

      // Utility BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
        position: 1,
        section: 'utility',
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY) - BETWEEN BATTERY AND SMS ==========
      // NOTE: Database currently only has type1 and type2. Type3-6 columns need to be added via database migration.
      // TODO: Add type3 back once database migration is complete

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },
    ];

    return {
      configId: 'FRANKLIN_APS_PARTIAL_HOME',
      configName: 'Franklin aPower + APS (Partial Home Backup)',
      description:
        'Configuration for Franklin aPower battery with Agate SMS on APS utility with partial home backup (critical loads panel).',
      priority: 2,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: true,
        sms: true,
        gateway: true,
        biDirectionalMeters: 3,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        sms: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Franklin aPower battery with Agate SMS detected',
        'Partial home backup via critical loads panel',
        'Only selected circuits will have backup power',
        'APS utility metering requirements met',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'FranklinAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 3: Franklin aPower + APS + No Backup
// Priority: 3
// ============================================================================

export const franklinAPSNoBackupDetector: ConfigurationDetector = {
  name: 'Franklin aPower + APS (No Backup)',
  configId: 'FRANKLIN_APS_NO_BACKUP',
  priority: 3,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin APS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      (!equipment.backupOption || equipment.backupOption === 'None');

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin APS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin APS No Backup] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // No backup panel = simpler BOS (no DER Side Disconnect needed)
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) ==========

      // Utility BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
        position: 1,
        section: 'utility',
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY - no type_3) ==========

      // Battery BOS Type 1: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 1,
        section: 'battery',
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 2,
        section: 'battery',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },
    ];

    return {
      configId: 'FRANKLIN_APS_NO_BACKUP',
      configName: 'Franklin aPower + APS (Grid-Tied, No Backup)',
      description:
        'Grid-tied configuration for Franklin aPower battery with Agate SMS on APS utility. No backup power capability.',
      priority: 3,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: false,
        sms: true,
        gateway: false,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: false,
        gateway: false,
        sms: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Franklin aPower battery with Agate SMS detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Optimized for energy storage and load shifting',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'FranklinAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all Franklin + APS detectors
// ============================================================================

export const franklinAPSDetectors: ConfigurationDetector[] = [
  franklinAPSWholeHomeDetector,
  franklinAPSPartialHomeDetector,
  franklinAPSNoBackupDetector,
];
