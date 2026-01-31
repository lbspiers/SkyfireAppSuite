// EnphaseAPSConfigs.ts
// Configuration detectors for Enphase Microinverter + Enphase Battery + APS Utility combinations
// Priority: 1-3 (High priority - specific Enphase configurations)

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Check if system uses Enphase microinverters
 */
function isEnphaseMicroinverter(equipment: EquipmentState): boolean {
  const microMake = equipment.microInverterMake?.toLowerCase() || '';
  return microMake.includes('enphase');
}

/**
 * Helper: Check if SMS is Enphase
 */
function isEnphaseSMS(equipment: EquipmentState): boolean {
  return !!(
    equipment.hasSMS &&
    equipment.smsMake?.toLowerCase().includes('enphase')
  );
}

/**
 * Helper: Check if batteries are Enphase
 */
function isEnphaseBattery(equipment: EquipmentState): boolean {
  return !!(
    equipment.batteryMake?.toLowerCase().includes('enphase') &&
    equipment.batteryQuantity > 0
  );
}

// ============================================================================
// DETECTOR 1: Enphase + APS + Whole Home Backup
// Priority: 1 (HIGHEST)
// ============================================================================

export const enphaseAPSWholeHomeDetector: ConfigurationDetector = {
  name: 'Enphase Microinverter + Enphase Battery + APS (Whole Home Backup)',
  configId: 'enphase_aps_wholeHome',
  priority: 1,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Whole Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Enphase APS Whole Home] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      isEnphaseMicroinverter(equipment) &&
      isEnphaseSMS(equipment) &&
      isEnphaseBattery(equipment) &&
      equipment.backupOption === 'Whole Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Enphase APS Whole Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========

    // Enphase systems are AC-COUPLED:
    // - Microinverters have their own AC output (solar → AC)
    // - Encharge batteries have separate battery inverters (battery → AC)
    // - Both can output simultaneously at full power
    // - Therefore: Post-SMS BOS = (microinverter + battery) × 1.25

    // 1. Pre-Combine BOS: Microinverter output only × 1.25
    const microinverterOutput = equipment.inverterMaxContinuousOutput || 0; // This holds microinverter output
    const preCombineRequiredAmps = Math.ceil(microinverterOutput * 1.25);
    const preCombineCalculation = `${microinverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. Post-SMS BOS: AC-COUPLED = (microinverter + battery) × 1.25
    //    Both inverters are independent and can discharge simultaneously
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalSystemOutput = microinverterOutput + batteryOutput;
    const postSMSRequiredAmps = Math.ceil(totalSystemOutput * 1.25);
    const postSMSCalculation = `Microinverter (${microinverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postSMSRequiredAmps}A (AC-Coupled)`;

    console.log(`[Enphase APS Whole Home] BOS Sizing:`, {
      microinverterOutput,
      batteryOutput,
      batteryQuantity: equipment.batteryQuantity,
      couplingType: 'AC',
      'Pre-Combine (microinverter only)': preCombineCalculation,
      'Post-SMS (AC-coupled, micro + battery)': postSMSCalculation,
      'Note': 'AC-coupled: separate inverters can output simultaneously',
    });

    // Build BOS equipment list
    // Enphase system has 3 BOS items:
    // - 2 Pre-Combine BOS (after Enphase Combiner Panel)
    // - 1 Post-SMS BOS
    const bosEquipment: BOSEquipment[] = [
      // ========== PRE-COMBINE BOS (bos_type_1, bos_type_2) ==========
      // These go after the Enphase Combiner Panel

      // Pre-Combine BOS Type 1: Uni-Directional Meter (Fixed - always Milbank U5929XL @ 100A)
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

      // Pre-Combine BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSCalculation,
        sizingValue: postSMSRequiredAmps,
      },
    ];

    return {
      configId: 'enphase_aps_wholeHome',
      configName: 'Enphase Microinverter + Enphase Battery + APS (Whole Home Backup)',
      description:
        'Optimized configuration for Enphase microinverter system with Enphase batteries and SMS on APS utility with whole home backup capability.',
      priority: 1,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: true,
        sms: true,
        gateway: true,
        biDirectionalMeters: 0, // No bi-directional meters for Enphase
        uniDirectionalMeters: 2, // 2 pre-combine uni-directional meters
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false, // Microinverter, not string inverter
        microInverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        sms: true,
        ess: true,
        stringCombinerPanel: false, // Enphase uses built-in combiner
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Enphase microinverter system with Enphase batteries and SMS detected',
        'Whole home backup capability via Enphase SMS',
        'APS utility requires uni-directional meter for solar production',
        'Enphase batteries managed by Enphase SMS (no separate battery BOS needed)',
        '3 total BOS items: 2 pre-combine + 1 post-SMS',
      ],

      source: 'EnphaseAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: Enphase + APS + Partial Home Backup
// Priority: 2
// ============================================================================

export const enphaseAPSPartialHomeDetector: ConfigurationDetector = {
  name: 'Enphase Microinverter + Enphase Battery + APS (Partial Home Backup)',
  configId: 'enphase_aps_partialHome',
  priority: 2,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Partial Home'
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Enphase APS Partial Home] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      isEnphaseMicroinverter(equipment) &&
      isEnphaseSMS(equipment) &&
      isEnphaseBattery(equipment) &&
      equipment.backupOption === 'Partial Home';

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Enphase APS Partial Home] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Same sizing logic as Whole Home - only difference is backup panel configuration

    // 1. Pre-Combine BOS: Microinverter output only × 1.25
    const microinverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const preCombineRequiredAmps = Math.ceil(microinverterOutput * 1.25);
    const preCombineCalculation = `${microinverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. Post-SMS BOS: AC-COUPLED = (microinverter + battery) × 1.25
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalSystemOutput = microinverterOutput + batteryOutput;
    const postSMSRequiredAmps = Math.ceil(totalSystemOutput * 1.25);
    const postSMSCalculation = `Microinverter (${microinverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postSMSRequiredAmps}A (AC-Coupled)`;

    console.log(`[Enphase APS Partial Home] BOS Sizing:`, {
      microinverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Pre-Combine (microinverter only)': preCombineCalculation,
      'Post-SMS (AC-coupled, micro + battery)': postSMSCalculation,
    });

    // SAME BOS equipment as Whole Home (only difference is backup panel configuration)
    const bosEquipment: BOSEquipment[] = [
      // ========== PRE-COMBINE BOS (bos_type_1, bos_type_2) ==========

      // Pre-Combine BOS Type 1: Uni-Directional Meter
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

      // Pre-Combine BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSCalculation,
        sizingValue: postSMSRequiredAmps,
      },
    ];

    return {
      configId: 'enphase_aps_partialHome',
      configName: 'Enphase Microinverter + Enphase Battery + APS (Partial Home Backup)',
      description:
        'Configuration for Enphase microinverter system with Enphase batteries and SMS on APS utility with partial home backup (critical loads panel).',
      priority: 2,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: true,
        sms: true,
        gateway: true,
        biDirectionalMeters: 0,
        uniDirectionalMeters: 2,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false,
        microInverter: true,
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
        'Enphase microinverter system with Enphase batteries and SMS detected',
        'Partial home backup via critical loads panel',
        'Only selected circuits will have backup power',
        'APS utility metering requirements met',
        'Enphase batteries managed by Enphase SMS',
        '3 total BOS items: 2 pre-combine + 1 post-SMS',
      ],

      source: 'EnphaseAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 3: Enphase + APS + No Backup
// Priority: 3
// ============================================================================

export const enphaseAPSNoBackupDetector: ConfigurationDetector = {
  name: 'Enphase Microinverter + Enphase Battery + APS (No Backup)',
  configId: 'enphase_aps_noBackup',
  priority: 3,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[Enphase APS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      isEnphaseMicroinverter(equipment) &&
      isEnphaseSMS(equipment) &&
      isEnphaseBattery(equipment) &&
      (!equipment.backupOption || equipment.backupOption === 'None');

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[Enphase APS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Same sizing logic as Whole/Partial Home - no backup panel

    // 1. Pre-Combine BOS: Microinverter output only × 1.25
    const microinverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const preCombineRequiredAmps = Math.ceil(microinverterOutput * 1.25);
    const preCombineCalculation = `${microinverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. Post-SMS BOS: AC-COUPLED = (microinverter + battery) × 1.25
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalSystemOutput = microinverterOutput + batteryOutput;
    const postSMSRequiredAmps = Math.ceil(totalSystemOutput * 1.25);
    const postSMSCalculation = `Microinverter (${microinverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postSMSRequiredAmps}A (AC-Coupled)`;

    console.log(`[Enphase APS No Backup] BOS Sizing:`, {
      microinverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Pre-Combine (microinverter only)': preCombineCalculation,
      'Post-SMS (AC-coupled, micro + battery)': postSMSCalculation,
    });

    // No backup panel = same BOS (Enphase systems don't require different BOS for no-backup)
    const bosEquipment: BOSEquipment[] = [
      // ========== PRE-COMBINE BOS (bos_type_1, bos_type_2) ==========

      // Pre-Combine BOS Type 1: Uni-Directional Meter
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

      // Pre-Combine BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) - AFTER SMS ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)

      // Post-SMS BOS Type 1: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSCalculation,
        sizingValue: postSMSRequiredAmps,
      },
    ];

    return {
      configId: 'enphase_aps_noBackup',
      configName: 'Enphase Microinverter + Enphase Battery + APS (Grid-Tied, No Backup)',
      description:
        'Grid-tied configuration for Enphase microinverter system with Enphase batteries and SMS on APS utility. No backup power capability.',
      priority: 3,
      confidence: 'exact',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: false,
        sms: true,
        gateway: false,
        biDirectionalMeters: 0,
        uniDirectionalMeters: 2,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false,
        microInverter: true,
        battery1: true,
        backupLoadSubPanel: false,
        gateway: false,
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
        'Enphase microinverter system with Enphase batteries and SMS detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Optimized for energy storage and load shifting',
        'Enphase batteries managed by Enphase SMS',
        '3 total BOS items: 2 pre-combine + 1 post-SMS',
      ],

      source: 'EnphaseAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all Enphase + APS detectors
// ============================================================================

export const enphaseAPSDetectors: ConfigurationDetector[] = [
  enphaseAPSWholeHomeDetector,
  enphaseAPSPartialHomeDetector,
  enphaseAPSNoBackupDetector,
];
