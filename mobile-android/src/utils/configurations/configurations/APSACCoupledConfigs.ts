// APSACCoupledConfigs.ts
// Generic AC-coupled configuration detectors for APS utility
// These are equipment-agnostic fallback configurations that work with ANY AC-coupled battery
// Priority: 4-5 (Lower than brand-specific detectors like Franklin/Enphase/Tesla)
//
// AC-Coupled Architecture:
// - Solar inverter and battery inverter are separate and independent on AC side
// - Both can discharge simultaneously at full power
// - Post-SMS BOS must handle: (inverter + battery) × 1.25
//
// Coverage:
// - String Inverter + AC-Coupled Battery + SMS + Backup
// - String Inverter + AC-Coupled Battery + SMS + No Backup
// - String Inverter + AC-Coupled Battery + No SMS + Backup
// - String Inverter + AC-Coupled Battery + No SMS + No Backup

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Calculate Post-SMS BOS amp rating for AC-coupled systems
 * AC-coupled = separate inverters that can output simultaneously
 * Post-SMS must handle both inverter + battery outputs at once
 */
function calculateACCoupledPostSMSAmps(equipment: EquipmentState): {
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
// DETECTOR 1: Generic AC-Coupled + SMS + Backup (Whole/Partial Home)
// Priority: 4
//
// Equipment-agnostic configuration for any AC-coupled battery system with SMS and backup
// - String inverter (NOT microinverter - see Enphase configs for that)
// - AC-coupled battery (any brand)
// - SMS present (any brand)
// - Backup panel (Whole Home or Partial Home)
// - APS utility
// ============================================================================

export const apsACCoupledSMSBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled + APS + SMS + Backup',
  configId: 'APS_AC_COUPLED_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' && // String inverter (NOT microinverter)
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled SMS Backup] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' && // String inverter only
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home') &&
      // AC-coupled check: Either explicitly marked as AC, or has separate battery inverter
      // (Most AC-coupled batteries have batteryMaxContinuousOutput > 0)
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const postSMSSizing = calculateACCoupledPostSMSAmps(equipment);

    console.log(`[APS AC-Coupled SMS Backup] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Build BOS equipment list
    // Pattern based on Franklin APS configurations (generic version)
    const bosEquipment: BOSEquipment[] = [
      // ========== UTILITY BOS (bos_type_1, bos_type_2) ==========
      // Between String Combiner and SMS

      // Utility BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
        position: 1,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2, 3) - BETWEEN BATTERY AND SMS ==========
      // For AC-coupled batteries with backup

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
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
      configId: 'APS_AC_COUPLED_SMS_BACKUP',
      configName: `Generic AC-Coupled + APS + SMS + ${equipment.backupOption}`,
      description:
        'Equipment-agnostic configuration for AC-coupled battery systems with SMS and backup capability on APS utility.',
      priority: 4,
      confidence: 'high',

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
        'Generic AC-coupled battery system with SMS and backup detected',
        `${equipment.backupOption} backup capability via SMS`,
        'APS utility requires uni-directional meter for solar production',
        'Bi-directional meter for battery charge/discharge monitoring',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: Generic AC-Coupled + SMS + No Backup
// Priority: 5
//
// Equipment-agnostic configuration for any AC-coupled battery system with SMS but no backup
// - String inverter
// - AC-coupled battery (any brand)
// - SMS present (any brand)
// - No backup panel
// - APS utility
// ============================================================================

export const apsACCoupledSMSNoBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled + APS + SMS + No Backup',
  configId: 'APS_AC_COUPLED_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled SMS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const postSMSSizing = calculateACCoupledPostSMSAmps(equipment);

    console.log(`[APS AC-Coupled SMS No Backup] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // No backup = simpler battery BOS (no DER Side Disconnect)
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY - no type_3) ==========
      // No backup = no DER Side Disconnect needed

      // Battery BOS Type 1: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
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
      configId: 'APS_AC_COUPLED_SMS_NO_BACKUP',
      configName: 'Generic AC-Coupled + APS + SMS + No Backup',
      description:
        'Equipment-agnostic grid-tied configuration for AC-coupled battery systems with SMS but no backup on APS utility.',
      priority: 5,
      confidence: 'high',

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
        stringCombinerPanel: false,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled battery system with SMS detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Optimized for energy storage and load shifting',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 3: Generic AC-Coupled + No SMS + Backup
// Priority: 4
//
// Equipment-agnostic configuration for AC-coupled battery without SMS but with backup
// - String inverter
// - AC-coupled battery (any brand)
// - NO SMS (direct battery management)
// - Backup panel present
// - APS utility
//
// Note: This is less common but possible with batteries that have built-in inverters
// and don't require separate SMS (e.g., some all-in-one battery systems)
// ============================================================================

export const apsACCoupledNoSMSBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled + APS + No SMS + Backup',
  configId: 'APS_AC_COUPLED_NO_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled No SMS Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled No SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // No SMS means no post-SMS BOS; instead we have post-inverter BOS
    const inverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalOutput = inverterOutput + batteryOutput;
    const postInverterAmps = Math.ceil(totalOutput * 1.25);
    const calculation = `Inverter (${inverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postInverterAmps}A (AC-Coupled)`;

    console.log(`[APS AC-Coupled No SMS Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Post-Inverter (AC-coupled)': calculation,
    });

    // No SMS = simplified BOS structure
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2, 3) ==========

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== UTILITY BOS Type 3 (Utility Disconnect) ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)
      // No SMS means this goes in utility section as Type 3

      // Utility BOS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postInverterAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postInverterAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: calculation,
        sizingValue: postInverterAmps,
      },
    ];

    return {
      configId: 'APS_AC_COUPLED_NO_SMS_BACKUP',
      configName: `Generic AC-Coupled + APS + No SMS + ${equipment.backupOption}`,
      description:
        'Equipment-agnostic configuration for AC-coupled battery systems with backup but without SMS on APS utility.',
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: true,
        sms: false,
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
        sms: false,
        ess: true,
        stringCombinerPanel: false,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled battery system with backup but no SMS detected',
        `${equipment.backupOption} backup capability`,
        'Battery managed directly without SMS',
        'APS utility metering requirements met',
        `AC-coupled system: Utility Disconnect sized to ${postInverterAmps}A (inverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 4: Generic AC-Coupled + No SMS + No Backup
// Priority: 5
//
// Equipment-agnostic configuration for AC-coupled battery without SMS and no backup
// - String inverter
// - AC-coupled battery (any brand)
// - NO SMS
// - No backup panel
// - APS utility
// ============================================================================

export const apsACCoupledNoSMSNoBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled + APS + No SMS + No Backup',
  configId: 'APS_AC_COUPLED_NO_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled No SMS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled No SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const inverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalOutput = inverterOutput + batteryOutput;
    const postInverterAmps = Math.ceil(totalOutput * 1.25);
    const calculation = `Inverter (${inverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postInverterAmps}A (AC-Coupled)`;

    console.log(`[APS AC-Coupled No SMS No Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Post-Inverter (AC-coupled)': calculation,
    });

    // No SMS + No Backup = simplest BOS structure
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY) ==========

      // Battery BOS Type 1: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== UTILITY BOS Type 3 (Utility Disconnect) ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)
      // No SMS means this goes in utility section as Type 3

      // Utility BOS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postInverterAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postInverterAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: calculation,
        sizingValue: postInverterAmps,
      },
    ];

    return {
      configId: 'APS_AC_COUPLED_NO_SMS_NO_BACKUP',
      configName: 'Generic AC-Coupled + APS + No SMS + No Backup',
      description:
        'Equipment-agnostic grid-tied configuration for AC-coupled battery systems without SMS or backup on APS utility.',
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: false,
        sms: false,
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
        sms: false,
        ess: true,
        stringCombinerPanel: false,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled battery system without SMS or backup detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Battery managed directly without SMS',
        `AC-coupled system: Utility Disconnect sized to ${postInverterAmps}A (inverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 5: Generic AC-Coupled Microinverter + SMS + Backup
// Priority: 4
//
// Equipment-agnostic configuration for AC-coupled battery with microinverters, SMS and backup
// - Microinverter system (NOT string inverter)
// - AC-coupled battery (any brand)
// - SMS present (any brand)
// - Backup panel (Whole Home or Partial Home)
// - APS utility
// ============================================================================

export const apsACCoupledMicroSMSBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled Microinverter + APS + SMS + Backup',
  configId: 'APS_AC_COUPLED_MICRO_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' && // Microinverter (NOT string inverter)
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled Micro SMS Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled Micro SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const postSMSSizing = calculateACCoupledPostSMSAmps(equipment);

    console.log(`[APS AC-Coupled Micro SMS Backup] BOS Sizing:`, {
      microinverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Same BOS pattern as string inverter version
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2, 3) ==========

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)

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
      configId: 'APS_AC_COUPLED_MICRO_SMS_BACKUP',
      configName: `Generic AC-Coupled Microinverter + APS + SMS + ${equipment.backupOption}`,
      description:
        'Equipment-agnostic configuration for AC-coupled battery with microinverters, SMS and backup on APS utility.',
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: true,
        sms: true,
        gateway: true,
        biDirectionalMeters: 3,
        uniDirectionalMeters: 1,
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
        stringCombinerPanel: true, // Microinverters need combiner
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled microinverter + battery system with SMS and backup detected',
        `${equipment.backupOption} backup capability via SMS`,
        'Microinverter system with string combiner panel',
        'APS utility requires uni-directional meter for solar production',
        'Bi-directional meter for battery charge/discharge monitoring',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (microinverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 6: Generic AC-Coupled Microinverter + SMS + No Backup
// Priority: 5
// ============================================================================

export const apsACCoupledMicroSMSNoBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled Microinverter + APS + SMS + No Backup',
  configId: 'APS_AC_COUPLED_MICRO_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled Micro SMS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled Micro SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const postSMSSizing = calculateACCoupledPostSMSAmps(equipment);

    console.log(`[APS AC-Coupled Micro SMS No Backup] BOS Sizing:`, {
      microinverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // No backup = simpler battery BOS (no DER Side Disconnect)
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY) ==========

      // Battery BOS Type 1: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== POST-SMS BOS (post_sms_bos_type_1) ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)

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
      configId: 'APS_AC_COUPLED_MICRO_SMS_NO_BACKUP',
      configName: 'Generic AC-Coupled Microinverter + APS + SMS + No Backup',
      description:
        'Equipment-agnostic grid-tied configuration for AC-coupled battery with microinverters and SMS but no backup on APS utility.',
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: false,
        sms: true,
        gateway: false,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 1,
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
        stringCombinerPanel: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled microinverter + battery system with SMS detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Microinverter system with string combiner panel',
        'Optimized for energy storage and load shifting',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (microinverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 7: Generic AC-Coupled Microinverter + No SMS + Backup
// Priority: 4
// ============================================================================

export const apsACCoupledMicroNoSMSBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled Microinverter + APS + No SMS + Backup',
  configId: 'APS_AC_COUPLED_MICRO_NO_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled Micro No SMS Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled Micro No SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const microinverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalOutput = microinverterOutput + batteryOutput;
    const postCombinerAmps = Math.ceil(totalOutput * 1.25);
    const calculation = `Microinverter (${microinverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postCombinerAmps}A (AC-Coupled)`;

    console.log(`[APS AC-Coupled Micro No SMS Backup] BOS Sizing:`, {
      microinverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Post-Combiner (AC-coupled)': calculation,
    });

    // No SMS = utility disconnect goes in utility section
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2, 3) ==========

      // Battery BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 3: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 3,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== UTILITY BOS Type 3 (Utility Disconnect) ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)
      // No SMS means this goes in utility section as Type 3

      // Utility BOS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postCombinerAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postCombinerAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: calculation,
        sizingValue: postCombinerAmps,
      },
    ];

    return {
      configId: 'APS_AC_COUPLED_MICRO_NO_SMS_BACKUP',
      configName: `Generic AC-Coupled Microinverter + APS + No SMS + ${equipment.backupOption}`,
      description:
        'Equipment-agnostic configuration for AC-coupled battery with microinverters, backup but no SMS on APS utility.',
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: true,
        sms: false,
        gateway: true,
        biDirectionalMeters: 3,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false,
        microInverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        sms: false,
        ess: true,
        stringCombinerPanel: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled microinverter + battery system with backup but no SMS detected',
        `${equipment.backupOption} backup capability`,
        'Battery managed directly without SMS',
        'Microinverter system with string combiner panel',
        'APS utility metering requirements met',
        `AC-coupled system: Utility Disconnect sized to ${postCombinerAmps}A (microinverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 8: Generic AC-Coupled Microinverter + No SMS + No Backup
// Priority: 5
// ============================================================================

export const apsACCoupledMicroNoSMSNoBackupDetector: ConfigurationDetector = {
  name: 'Generic AC-Coupled Microinverter + APS + No SMS + No Backup',
  configId: 'APS_AC_COUPLED_MICRO_NO_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None')
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS AC-Coupled Micro No SMS No Backup] Checking criteria...');

    const meetsAllCriteria =
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'microinverter' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel &&
      (!equipment.backupOption || equipment.backupOption === 'None') &&
      (equipment.couplingType === 'AC' || equipment.batteryMaxContinuousOutput > 0);

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS AC-Coupled Micro No SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const microinverterOutput = equipment.inverterMaxContinuousOutput || 0;
    const batteryOutput = equipment.batteryMaxContinuousOutput || 0;
    const totalOutput = microinverterOutput + batteryOutput;
    const postCombinerAmps = Math.ceil(totalOutput * 1.25);
    const calculation = `Microinverter (${microinverterOutput}A) + Battery (${batteryOutput}A) × 1.25 = ${postCombinerAmps}A (AC-Coupled)`;

    console.log(`[APS AC-Coupled Micro No SMS No Backup] BOS Sizing:`, {
      microinverterOutput,
      batteryOutput,
      couplingType: 'AC',
      'Post-Combiner (AC-coupled)': calculation,
    });

    // No SMS + No Backup = simplest BOS structure
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
        systemPrefix: equipment.systemPrefix,
        autoSelected: true,
      },

      // Utility BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== BATTERY BOS (battery_bos_type_1, 2 ONLY) ==========

      // Battery BOS Type 1: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        isNew: true,
        position: 1,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // Battery BOS Type 2: Bi-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter Line Side Disconnect',
        isNew: true,
        position: 2,
        section: 'battery',
        systemPrefix: equipment.systemPrefix,
        requiresUserSelection: false,
      },

      // ========== UTILITY BOS Type 3 (Utility Disconnect) ==========
      // AC-COUPLED: Sized to total system output (microinverter + battery)
      // No SMS means this goes in utility section as Type 3

      // Utility BOS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postCombinerAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postCombinerAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: calculation,
        sizingValue: postCombinerAmps,
      },
    ];

    return {
      configId: 'APS_AC_COUPLED_MICRO_NO_SMS_NO_BACKUP',
      configName: 'Generic AC-Coupled Microinverter + APS + No SMS + No Backup',
      description:
        'Equipment-agnostic grid-tied configuration for AC-coupled battery with microinverters without SMS or backup on APS utility.',
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Microinverter'],
        backupPanel: false,
        sms: false,
        gateway: false,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: false,
        microInverter: true,
        battery1: true,
        backupLoadSubPanel: false,
        gateway: false,
        sms: false,
        ess: true,
        stringCombinerPanel: true,
      },

      meterConfiguration: {
        utilityMeter: 'uni-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Generic AC-coupled microinverter + battery system without SMS or backup detected',
        'Grid-tied only - no backup power during outages',
        'System shuts down when grid goes down',
        'Battery managed directly without SMS',
        'Microinverter system with string combiner panel',
        `AC-coupled system: Utility Disconnect sized to ${postCombinerAmps}A (microinverter + battery × 1.25)`,
        'Equipment-agnostic configuration - works with any AC-coupled battery brand',
      ],

      source: 'APSACCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all APS AC-Coupled detectors
// ============================================================================

export const apsACCoupledDetectors: ConfigurationDetector[] = [
  // String inverter versions
  apsACCoupledSMSBackupDetector,
  apsACCoupledNoSMSBackupDetector,
  apsACCoupledSMSNoBackupDetector,
  apsACCoupledNoSMSNoBackupDetector,
  // Microinverter versions
  apsACCoupledMicroSMSBackupDetector,
  apsACCoupledMicroNoSMSBackupDetector,
  apsACCoupledMicroSMSNoBackupDetector,
  apsACCoupledMicroNoSMSNoBackupDetector,
];
