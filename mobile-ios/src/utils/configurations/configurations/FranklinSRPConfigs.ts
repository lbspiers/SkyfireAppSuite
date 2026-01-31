// FranklinSRPConfigs.ts
// Configuration detectors for Franklin Battery + SRP Utility combinations
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
// DETECTOR 1: Franklin aPower + SRP + Whole Home Backup
// Priority: 1 (HIGHEST)
// ============================================================================

export const franklinSRPWholeHomeDetector: ConfigurationDetector = {
  name: 'Franklin aPower + SRP (Whole Home Backup)',
  configId: 'FRANKLIN_SRP_WHOLE_HOME',
  priority: 1,
  utilities: ['SRP'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Whole Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin SRP Whole Home] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      equipment.backupOption === 'Whole Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin SRP Whole Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin SRP Whole Home] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Build BOS equipment list
    // SRP configuration: Simpler than APS
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) - BETWEEN STRING COMBINER AND SMS ==========

      // Utility BOS Type 1: Dedicated DER Meter (PV Meter)
      {
        equipmentType: 'Dedicated DER Meter',
        isNew: true,
        position: 1,
        section: 'utility',
        requiresUserSelection: false,
      },

      // Utility BOS Type 2: DER Meter Disconnect Switch (AC Disconnect)
      {
        equipmentType: 'DER Meter Disconnect Switch',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility AC Disconnect Switch
      {
        equipmentType: 'Utility AC Disconnect Switch',
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
      configId: 'FRANKLIN_SRP_WHOLE_HOME',
      configName: 'Franklin aPower + SRP (Whole Home Backup)',
      description:
        'Optimized configuration for Franklin aPower battery with Agate SMS on SRP utility with whole home backup capability.',
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
        biDirectionalMeters: 0,
        uniDirectionalMeters: 1, // Dedicated DER Meter
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
        'SRP utility requires dedicated DER meter for solar production',
        'DER meter disconnect switch for safety isolation',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'FranklinSRPConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: Franklin aPower + SRP + Partial Home Backup
// Priority: 2
// ============================================================================

export const franklinSRPPartialHomeDetector: ConfigurationDetector = {
  name: 'Franklin aPower + SRP (Partial Home Backup)',
  configId: 'FRANKLIN_SRP_PARTIAL_HOME',
  priority: 2,
  utilities: ['SRP'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Partial Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin SRP Partial Home] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      equipment.backupOption === 'Partial Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin SRP Partial Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin SRP Partial Home] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // SAME BOS equipment as Whole Home (only difference is backup panel configuration)
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) - BETWEEN STRING COMBINER AND SMS ==========

      // Utility BOS Type 1: Dedicated DER Meter (PV Meter)
      {
        equipmentType: 'Dedicated DER Meter',
        isNew: true,
        position: 1,
        section: 'utility',
        requiresUserSelection: false,
      },

      // Utility BOS Type 2: DER Meter Disconnect Switch (AC Disconnect)
      {
        equipmentType: 'DER Meter Disconnect Switch',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility AC Disconnect Switch
      {
        equipmentType: 'Utility AC Disconnect Switch',
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
      configId: 'FRANKLIN_SRP_PARTIAL_HOME',
      configName: 'Franklin aPower + SRP (Partial Home Backup)',
      description:
        'Configuration for Franklin aPower battery with Agate SMS on SRP utility with partial home backup (critical loads panel).',
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
        biDirectionalMeters: 0,
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
        'SRP utility metering requirements met',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'FranklinSRPConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 3: Franklin aPower + SRP + No Backup
// Priority: 3
// ============================================================================

export const franklinSRPNoBackupDetector: ConfigurationDetector = {
  name: 'Franklin aPower + SRP (No Backup)',
  configId: 'FRANKLIN_SRP_NO_BACKUP',
  priority: 3,
  utilities: ['SRP'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Franklin SRP No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      isFranklinAgateSMS(equipment) &&
      isFranklinAPowerBattery(equipment) &&
      (!equipment.backupOption || equipment.backupOption === 'None');

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Franklin SRP No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const batteryBOSAmps = calculateBatteryBOSAmps(equipment);
    const postSMSSizing = calculatePostSMSAmps(equipment);

    console.log(`[Franklin SRP No Backup] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Same utility BOS, same post-SMS BOS as other configs
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) - BETWEEN STRING COMBINER AND SMS ==========

      // Utility BOS Type 1: Dedicated DER Meter (PV Meter)
      {
        equipmentType: 'Dedicated DER Meter',
        isNew: true,
        position: 1,
        section: 'utility',
        requiresUserSelection: false,
      },

      // Utility BOS Type 2: DER Meter Disconnect Switch (AC Disconnect)
      {
        equipmentType: 'DER Meter Disconnect Switch',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS BOS Type 1: Utility AC Disconnect Switch
      {
        equipmentType: 'Utility AC Disconnect Switch',
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
      configId: 'FRANKLIN_SRP_NO_BACKUP',
      configName: 'Franklin aPower + SRP (Grid-Tied, No Backup)',
      description:
        'Grid-tied configuration for Franklin aPower battery with Agate SMS on SRP utility. No backup power capability.',
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
        biDirectionalMeters: 0,
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

      source: 'FranklinSRPConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all Franklin + SRP detectors
// ============================================================================

export const franklinSRPDetectors: ConfigurationDetector[] = [
  franklinSRPWholeHomeDetector,
  franklinSRPPartialHomeDetector,
  franklinSRPNoBackupDetector,
];
