// StorzAPSConfigs.ts
// Configuration detector for Storz Power Battery + APS Utility + Multi-System setup
// PRIORITY 2: High priority multi-system configuration

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Check if equipment is Storz Power battery
 */
function isStorzPowerBattery(equipment: EquipmentState): boolean {
  const make = equipment.batteryMake?.toLowerCase() || '';
  return (
    (make.includes('storz') || make.includes('storz power')) &&
    equipment.batteryQuantity > 0
  );
}

/**
 * Helper: Check if inverter is Sol-Ark
 */
function isSolArkInverter(equipment: EquipmentState): boolean {
  const make = equipment.inverterMake?.toLowerCase() || '';
  return make.includes('sol-ark') || make.includes('solark');
}

/**
 * Helper: Calculate Post-Combine BOS amp rating for DC-coupled Storz system
 * Sol-Ark is a hybrid inverter with DC-coupled batteries (battery on DC bus)
 * Post-Combine BOS sized to inverter output only (inverter regulates all AC power)
 */
function calculatePostCombineAmps(equipment: EquipmentState): {
  requiredAmps: number;
  calculation: string;
  inverterOutput: number;
} {
  const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
  const requiredAmps = Math.ceil(inverterOutput * 1.25);
  const calculation = `${inverterOutput}A × 1.25 = ${requiredAmps}A (DC-Coupled)`;

  return { requiredAmps, calculation, inverterOutput };
}

/**
 * Helper: Fetch System 1 equipment state from database
 * This is needed because we're detecting on System 2 but need to check System 1
 */
async function getSystem1Equipment(projectId: string): Promise<EquipmentState | null> {
  try {
    // Dynamic import to avoid circular dependencies
    const { fetchSystemDetailsSafe } = await import('../../../screens/Project/SystemDetails/services/equipmentService');
    const { EquipmentStateExtractor } = await import('../EquipmentStateExtractor');

    const systemData = await fetchSystemDetailsSafe(projectId);

    if (!systemData) {
      console.log('[Storz APS Config] No system data found for project:', projectId);
      return null;
    }

    // Extract System 1 equipment state
    const utilityInfo = {
      utility_name: systemData.utility || 'APS',
      state: systemData.state || 'AZ',
      combination: systemData.bos_combination || '',
    };

    const sys1State = EquipmentStateExtractor.extractForSystem(
      systemData,
      1,
      utilityInfo
    );

    return sys1State;
  } catch (error) {
    console.error('[Storz APS Config] Failed to fetch System 1 equipment:', error);
    return null;
  }
}

// ============================================================================
// DETECTOR: Storz Whole Home + APS (Multi-System Configuration)
// Priority: 2
//
// System 1: Microinverter + Solar panels (no batteries, no SMS)
// System 2: Sol-Ark inverter + Storz batteries + Whole Home Backup
// ============================================================================

export const storzWholeHomeAPSDetector: ConfigurationDetector = {
  name: 'Storz Whole Home + APS (Multi-System)',
  configId: 'STORZ_WHOLE_HOME_APS',
  priority: 2,
  utilities: ['APS'],

  // Multi-system configuration flags
  isMultiSystem: true,
  affectedSystems: ['sys1_', 'sys2_'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check - only run on System 2
    return (
      equipment.systemNumber === 2 &&
      equipment.utilityName === 'APS' &&
      equipment.batteryQuantity > 0 &&
      equipment.backupOption === 'Whole Home'
    );
  },

  detect: async (equipment: EquipmentState): Promise<ConfigurationMatch | null> => {
    console.log('[Storz APS Multi-System] Starting detection...');

    // MUST be System 2
    if (equipment.systemNumber !== 2) {
      console.log('[Storz APS Multi-System] ❌ Not System 2, skipping');
      return null;
    }

    // Check System 2 criteria with detailed logging
    const checks = {
      isAPS: equipment.utilityName === 'APS',
      noSolar: !equipment.hasSolarPanels,
      isSolArk: isSolArkInverter(equipment),
      isStorzBattery: isStorzPowerBattery(equipment),
      isWholeHome: equipment.backupOption === 'Whole Home',
      hasBackupPanel: equipment.hasBackupPanel,
      noSMS: !equipment.hasSMS,
    };

    console.log('[Storz APS Multi-System] System 2 criteria check:', checks);
    console.log('[Storz APS Multi-System] Equipment details:', {
      utility: equipment.utilityName,
      hasSolar: equipment.hasSolarPanels,
      inverterMake: equipment.inverterMake,
      batteryMake: equipment.batteryMake,
      batteryQty: equipment.batteryQuantity,
      backup: equipment.backupOption,
      hasBackupPanel: equipment.hasBackupPanel,
      hasSMS: equipment.hasSMS,
    });

    const sys2Matches = Object.values(checks).every(v => v === true);

    if (!sys2Matches) {
      const failedChecks = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check);
      console.log('[Storz APS Multi-System] ❌ System 2 criteria not met. Failed checks:', failedChecks);
      return null;
    }

    console.log('[Storz APS Multi-System] ✅ System 2 criteria met, checking System 1...');

    // Fetch and check System 1 equipment
    // We need to get the project ID from somewhere - it should be in the equipment state context
    // For now, we'll try to extract it from the system data
    const sys1Equipment = await getSystem1Equipment(equipment.projectId || '');

    if (!sys1Equipment) {
      console.log('[Storz APS Multi-System] ⚠️  Could not fetch System 1 equipment');
      return null;
    }

    // Check System 1 criteria
    const sys1Matches =
      sys1Equipment.systemType === 'microinverter' &&
      sys1Equipment.hasSolarPanels &&
      sys1Equipment.batteryQuantity === 0 && // No batteries on System 1
      !sys1Equipment.hasSMS; // No SMS on System 1

    if (!sys1Matches) {
      console.log('[Storz APS Multi-System] ❌ System 1 criteria not met');
      return null;
    }

    console.log('[Storz APS Multi-System] ✅ ALL CRITERIA MET! Multi-system configuration detected.');

    // ========== CALCULATE BOS SIZING FOR DC-COUPLED SYSTEM ==========
    // Get backup panel size for System 2 BOS sizing
    const backupPanelAmps = equipment.backupPanelBusRating || 200; // Default to 200A

    // Calculate Post-Combine BOS: DC-COUPLED = inverter × 1.25 (battery on DC bus)
    const postCombineSizing = calculatePostCombineAmps(equipment);

    console.log(`[Storz APS Multi-System] BOS Sizing:`, {
      inverterOutput: postCombineSizing.inverterOutput,
      couplingType: 'DC',
      'Post-Combine (DC-coupled)': postCombineSizing.calculation,
    });

    // Build BOS equipment list for BOTH systems
    const bosEquipment: BOSEquipment[] = [
      // ========== SYSTEM 1 BOS (Pre-Combine) ==========
      // These go on System 1 after the microinverters/string combiner

      // System 1 BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
        position: 1,
        section: 'utility', // sys1_ bos_type_1
        systemPrefix: 'sys1_',
        autoSelected: true,
      },

      // System 1 BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        preferredMake: 'Siemens',
        isNew: true,
        position: 2,
        section: 'utility', // sys1_ bos_type_2
        systemPrefix: 'sys1_',
        requiresUserSelection: false,
      },

      // ========== SYSTEM 2 BACKUP LOAD BOS ==========
      // These are sized to the backup panel bus rating and render under Backup Load Sub Panel

      // System 2 Backup BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: backupPanelAmps.toString(),
        isNew: true,
        position: 1,
        section: 'backup', // Renders under Backup Load Sub Panel (bos_sys2_backup_type1_*)
        systemPrefix: 'sys2_',
        minAmpRating: backupPanelAmps,
        requiresUserSelection: false,
      },

      // System 2 Backup BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        ampRating: backupPanelAmps.toString(),
        isNew: true,
        position: 2,
        section: 'backup', // Renders under Backup Load Sub Panel (bos_sys2_backup_type2_*)
        systemPrefix: 'sys2_',
        minAmpRating: backupPanelAmps,
        requiresUserSelection: false,
      },

      // ========== POST-COMBINE BOS (Equipment Page - After combining systems) ==========
      // DC-COUPLED: Sized to inverter output only (battery on DC bus)
      // Renders on Equipment page in Combine BOS section

      // Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: postCombineSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'combine', // Renders on Equipment page (postcombine_1_1_*)
        // NO systemPrefix for combine BOS - it combines all systems
        minAmpRating: postCombineSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postCombineSizing.calculation,
        sizingValue: postCombineSizing.requiredAmps,
      },

      // Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: postCombineSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'combine', // Renders on Equipment page (postcombine_2_1_*)
        // NO systemPrefix for combine BOS
        minAmpRating: postCombineSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postCombineSizing.calculation,
        sizingValue: postCombineSizing.requiredAmps,
      },

      // Combine BOS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postCombineSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'combine', // Renders on Equipment page (postcombine_3_1_*)
        // NO systemPrefix for combine BOS
        minAmpRating: postCombineSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postCombineSizing.calculation,
        sizingValue: postCombineSizing.requiredAmps,
      },
    ];

    return {
      configId: 'STORZ_WHOLE_HOME_APS',
      configName: 'Storz Whole Home + APS (Multi-System)',
      description: 'Multi-system configuration: Microinverter solar (Sys1) + Sol-Ark battery backup (Sys2)',
      priority: 2,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true, // On System 1
        batteryQuantity: 1, // On System 2
        batteryTypes: 1,
        inverterTypes: ['Sol-Ark'],
        backupPanel: true,
        sms: false,
        gateway: false,
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Post-combine
        uniDirectionalMeters: 4, // Sys1 (2) + Sys2 Backup (2)
      },

      bosEquipment,

      equipmentSections: {
        solar: true, // System 1
        inverter: true, // System 2 (Sol-Ark)
        battery1: true, // System 2 (Storz)
        backupLoadSubPanel: true, // System 2
        gateway: false,
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Post-combine
        productionMetering: 'both',
        meterTestBlock: false,
      },

      // Multi-system specific configuration
      multiSystemConfig: {
        totalSystems: 2,
        sys1CombinesAt: 'Sol-Ark', // System 1 combines into Sol-Ark inverter
        sys2CombinesAt: 'Main Panel A', // System 2 combines at Main Panel A
      },

      notes: [
        'Multi-system configuration with 2 systems',
        'System 1: Microinverter + Solar (no batteries)',
        'System 2: Sol-Ark inverter + Storz batteries + Whole Home backup',
        'Sol-Ark is a hybrid inverter with DC-coupled batteries (battery on DC bus)',
        `DC-coupled system: Post-Combine BOS sized to ${postCombineSizing.requiredAmps}A (inverter only × 1.25)`,
        'System 1 pre-combine BOS: 2x Uni-Directional (renders on String Combiner)',
        'System 2 backup BOS: 2x Uni-Directional (renders under Backup Load Sub Panel)',
        'Post-combine BOS: 3x equipment (renders on Equipment page Combine BOS)',
        'Systems combine at: Sys1→Sol-Ark, Sys2→Main Panel A',
        'Total BOS: 2 on sys1, 2 on sys2 backup, 3 on Equipment page',
      ],

      source: 'StorzAPSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// Export all detectors
export const storzAPSDetectors: ConfigurationDetector[] = [
  storzWholeHomeAPSDetector,
];
