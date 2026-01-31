// TeslaPowerwall3APSConfigs.ts
// Configuration detector for Tesla Powerwall 3 + Gateway 3 + Multi-System setup
// PRIORITY 3: High priority multi-system configuration

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Check if inverter is Tesla Powerwall 3
 */
function isTeslaPowerwall3(equipment: EquipmentState): boolean {
  const make = equipment.inverterMake?.toLowerCase() || '';
  return make.includes('tesla') || make.includes('powerwall');
}

/**
 * Helper: Check if Gateway 3 is configured
 * Gateway 3 is stored in SMS fields with make="Tesla" and model="Gateway 3"
 * There are no separate gateway_make/gateway_model fields - Gateway IS the SMS
 */
function hasGateway3(equipment: EquipmentState): boolean {
  if (equipment.hasSMS) {
    const smsMake = equipment.smsMake?.toLowerCase() || '';
    const smsModel = equipment.smsModel?.toLowerCase() || '';
    return smsMake.includes('tesla') &&
           (smsModel.includes('gateway 3') || smsModel.includes('gateway3'));
  }
  return false;
}

/**
 * Helper: Calculate Post-Combine/Post-SMS BOS amp rating for AC-coupled Tesla system
 * Tesla Powerwall 3 is AC-coupled (battery-integrated inverter on AC side)
 * Post-Combine BOS must handle both solar inverter + battery inverter simultaneously
 */
function calculatePostCombineAmps(equipment: EquipmentState): {
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
      console.log('[Tesla PW3 APS Config] No system data found for project:', projectId);
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
    console.error('[Tesla PW3 APS Config] Failed to fetch System 1 equipment:', error);
    return null;
  }
}

// ============================================================================
// DETECTOR: Tesla Powerwall 3 Whole Home + APS (Multi-System Configuration)
// Priority: 3
//
// System 1: Microinverter + Solar panels (no batteries, no SMS)
// System 2: Tesla Powerwall 3 (battery-integrated inverter) + Gateway 3
//           + at least 1 battery + possible expansions (0-3) + Whole Home Backup
//
// NOTE: Gateway 3 IS stored as the SMS (sys2_sms_make="Tesla", sys2_sms_model="Gateway 3")
//       There are no separate gateway_make/gateway_model fields.
// ============================================================================

export const teslaPW3WholeHomeAPSDetector: ConfigurationDetector = {
  name: 'Tesla Powerwall 3 + Gateway 3 + APS (Multi-System)',
  configId: 'TESLA_PW3_GATEWAY3_APS',
  priority: 3,
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
      equipment.backupOption === 'Whole Home' // Must be Whole Home for this configuration
    );
  },

  detect: async (equipment: EquipmentState): Promise<ConfigurationMatch | null> => {
    console.log('[Tesla PW3 APS Multi-System] Starting detection...');

    // MUST be System 2
    if (equipment.systemNumber !== 2) {
      console.log('[Tesla PW3 APS Multi-System] ❌ Not System 2, skipping');
      return null;
    }

    // Check System 2 criteria with detailed logging
    const checks = {
      isAPS: equipment.utilityName === 'APS',
      noSolar: !equipment.hasSolarPanels,
      isTeslaPW3: isTeslaPowerwall3(equipment),
      hasGateway3: hasGateway3(equipment), // Gateway 3 is stored in SMS fields (make="Tesla", model="Gateway 3")
      hasBatteries: equipment.batteryQuantity > 0,
      isWholeHome: equipment.backupOption === 'Whole Home', // Must be Whole Home backup
      hasBackupPanel: equipment.hasBackupPanel,
    };

    console.log('[Tesla PW3 APS Multi-System] System 2 criteria check:', checks);
    console.log('[Tesla PW3 APS Multi-System] Equipment details:', {
      utility: equipment.utilityName,
      hasSolar: equipment.hasSolarPanels,
      inverterMake: equipment.inverterMake,
      batteryMake: equipment.batteryMake,
      batteryQty: equipment.batteryQuantity,
      backup: equipment.backupOption,
      hasBackupPanel: equipment.hasBackupPanel,
      hasGateway: equipment.hasGateway,
      hasSMS: equipment.hasSMS,
      // Debug Gateway fields
      gatewayMake: equipment.gatewayMake,
      gatewayModel: equipment.gatewayModel,
      smsMake: equipment.smsMake,
      smsModel: equipment.smsModel,
    });

    const sys2Matches = Object.values(checks).every(v => v === true);

    if (!sys2Matches) {
      const failedChecks = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check);
      console.log('[Tesla PW3 APS Multi-System] ❌ System 2 criteria not met. Failed checks:', failedChecks);
      return null;
    }

    console.log('[Tesla PW3 APS Multi-System] ✅ System 2 criteria met, checking System 1...');

    // Fetch and check System 1 equipment
    const sys1Equipment = await getSystem1Equipment(equipment.projectId || '');

    if (!sys1Equipment) {
      console.log('[Tesla PW3 APS Multi-System] ⚠️  Could not fetch System 1 equipment');
      return null;
    }

    // Check System 1 criteria
    const sys1Matches =
      sys1Equipment.systemType === 'microinverter' &&
      sys1Equipment.hasSolarPanels &&
      sys1Equipment.batteryQuantity === 0 && // No batteries on System 1
      !sys1Equipment.hasSMS; // No SMS on System 1

    if (!sys1Matches) {
      console.log('[Tesla PW3 APS Multi-System] ❌ System 1 criteria not met');
      return null;
    }

    console.log('[Tesla PW3 APS Multi-System] ✅ ALL CRITERIA MET! Multi-system configuration detected.');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Get backup panel size for System 2 BOS sizing
    const backupPanelAmps = equipment.backupPanelBusRating || 200; // Default to 200A

    // Calculate Post-Combine BOS: AC-COUPLED = (inverter + battery) × 1.25
    const postCombineSizing = calculatePostCombineAmps(equipment);

    console.log(`[Tesla PW3 APS Multi-System] BOS Sizing:`, {
      inverterOutput: postCombineSizing.inverterOutput,
      batteryOutput: postCombineSizing.batteryOutput,
      couplingType: 'AC',
      'Post-Combine (AC-coupled)': postCombineSizing.calculation,
    });

    // Build BOS equipment list for BOTH systems
    const bosEquipment: BOSEquipment[] = [
      // ========== SYSTEM 1 BOS (Pre-Combine) ==========
      // These go on System 1 on the microinverter system after the string combiner
      // In the pre-combined BOS section (like regular BOS types 1-6)

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
      // Only renders if hasBackupPanel is true (backup load sub panel is present)

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
      // AC-COUPLED: Sized to total system output (inverter + battery)
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
        sizingLabel: 'Total System Output (AC-Coupled)',
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
        sizingLabel: 'Total System Output (AC-Coupled)',
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
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postCombineSizing.calculation,
        sizingValue: postCombineSizing.requiredAmps,
      },
    ];

    return {
      configId: 'TESLA_PW3_GATEWAY3_APS',
      configName: 'Tesla Powerwall 3 + Gateway 3 + APS Whole Home (Multi-System)',
      description: 'Multi-system configuration: Microinverter solar (Sys1) + Tesla Powerwall 3 (battery-integrated inverter) with Gateway 3 acting as SMS + Whole Home backup (Sys2)',
      priority: 3,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true, // On System 1
        batteryQuantity: 1, // On System 2
        batteryTypes: 1,
        inverterTypes: ['Tesla Powerwall 3'],
        backupPanel: true,
        sms: false, // Gateway 3 acts as SMS, but not technically SMS
        gateway: true, // Gateway 3
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Post-combine
        uniDirectionalMeters: 4, // Sys1 (2) + Sys2 Backup (2)
      },

      bosEquipment,

      equipmentSections: {
        solar: true, // System 1
        inverter: true, // System 2 (Tesla Powerwall 3)
        battery1: true, // System 2 (Tesla batteries)
        backupLoadSubPanel: true, // System 2
        gateway: true, // Gateway 3
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
        sys1CombinesAt: 'Tesla Powerwall 3', // System 1 combines into Powerwall 3
        sys2CombinesAt: 'Main Panel A', // System 2 combines at Main Panel A
      },

      notes: [
        'Multi-system configuration with 2 systems',
        'System 1: Microinverter + Solar panels (no batteries, no SMS)',
        'System 2: Tesla Powerwall 3 (battery-integrated inverter) + Gateway 3',
        'Powerwall 3 is a battery-integrated inverter - at least 1 battery always present',
        'Supports 0-3 Tesla expansion packs (configured in PowerWall Configuration section)',
        'Gateway 3 IS the SMS - stored in sys2_sms_make="Tesla", sys2_sms_model="Gateway 3"',
        'No separate gateway_make/gateway_model fields - Gateway 3 is detected via SMS fields',
        'Whole Home backup configuration (not Partial Home)',
        'Backup Load Sub Panel may or may not be present',
        'System 1 pre-combine BOS: 2x Uni-Directional (types 1-6) (renders after String Combiner)',
        'System 2 backup BOS: 2x Uni-Directional (if backup panel present) (renders under Backup Load Sub Panel)',
        `AC-coupled system: Post-Combine BOS sized to ${postCombineSizing.requiredAmps}A (inverter + battery × 1.25)`,
        'Post-combine BOS: 3x equipment on Equipment page (1: Bi-Dir Meter + DER Disconnect, 2: Bi-Dir Meter, 3: Utility Disconnect)',
        'Systems combine at: Sys1→Tesla Powerwall 3, Sys2→Main Panel A',
        'Total BOS: 2 on sys1 (pre-combine), 2 on sys2 backup (if backup panel), 3 post-combine on Equipment page',
      ],

      source: 'TeslaPowerwall3APSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR: Tesla Powerwall 3 + Gateway 3 + APS (Single System Only)
// Priority: 4
//
// Single system ONLY: Powerwall 3 (battery-integrated inverter)
//                     + Gateway 3 + 0-3 expansions
//                     + Partial Home OR Whole Home Backup
//                     + Backup Load Sub Panel
//
// Can be battery-only OR with solar panels
// For multi-system configurations, use a different detector
// ============================================================================

export const teslaPW3APSSingleOrCombinedDetector: ConfigurationDetector = {
  name: 'Tesla Powerwall 3 + Gateway 3 + APS (Single System)',
  configId: 'TESLA_PW3_GATEWAY3_APS_SINGLE_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check - must be System 1 for single-system config
    // Note: Powerwall 3 has integrated battery, so no need to check batteryQuantity
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      isTeslaPowerwall3(equipment) &&
      hasGateway3(equipment) &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home')
    );
  },

  detect: async (equipment: EquipmentState): Promise<ConfigurationMatch | null> => {
    console.log('[Tesla PW3 APS Single System] Starting detection...');

    // MUST be System 1 for single-system configuration
    if (equipment.systemNumber !== 1) {
      console.log('[Tesla PW3 APS Single System] ❌ Not System 1, skipping');
      return null;
    }

    // Check criteria
    // Note: Powerwall 3 is battery-integrated, always has 1 battery built-in
    // batteryQuantity represents expansion batteries (0-3)
    const checks = {
      isAPS: equipment.utilityName === 'APS',
      isInverterSystem: equipment.systemType === 'inverter', // Extra layer: must be inverter project
      isTeslaPW3: isTeslaPowerwall3(equipment),
      hasGateway3: hasGateway3(equipment), // Gateway 3 is stored in SMS fields
      hasBackup: equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home',
      hasBackupPanel: equipment.hasBackupPanel,
    };

    console.log('[Tesla PW3 APS Single System] Criteria check:', checks);
    console.log('[Tesla PW3 APS Single System] Equipment details:', {
      utility: equipment.utilityName,
      hasSolar: equipment.hasSolarPanels,
      inverterMake: equipment.inverterMake,
      batteryMake: equipment.batteryMake,
      batteryQty: equipment.batteryQuantity,
      backup: equipment.backupOption,
      hasBackupPanel: equipment.hasBackupPanel,
      hasGateway: equipment.hasGateway,
      hasSMS: equipment.hasSMS,
      smsMake: equipment.smsMake,
      smsModel: equipment.smsModel,
    });

    const matches = Object.values(checks).every(v => v === true);

    if (!matches) {
      const failedChecks = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check);
      console.log('[Tesla PW3 APS Single System] ❌ Criteria not met. Failed checks:', failedChecks);
      return null;
    }

    console.log('[Tesla PW3 APS Single System] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Get backup panel size for Backup BOS sizing
    const backupPanelAmps = equipment.backupPanelBusRating || 200; // Default to 200A

    // Calculate Pre-Combine and Post-SMS BOS: AC-COUPLED = (inverter + battery) × 1.25
    const postSMSSizing = calculatePostCombineAmps(equipment);

    console.log(`[Tesla PW3 APS Single System] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Build BOS equipment list
    const bosEquipment: BOSEquipment[] = [
      // ========== BACKUP LOAD SUB PANEL BOS ==========
      // Sized to backup panel bus rating

      // Backup BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: backupPanelAmps.toString(),
        isNew: true,
        position: 1,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupPanelAmps,
        requiresUserSelection: false,
      },

      // Backup BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        ampRating: backupPanelAmps.toString(),
        isNew: true,
        position: 2,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupPanelAmps,
        requiresUserSelection: false,
      },

      // ========== PRE-COMBINE BOS (Between Tesla Powerwall 3 and Gateway 3) ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)
      // Renders in the pre-combined BOS section (bos_type_1, bos_type_2)

      // Pre-Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders between Powerwall 3 and Gateway 3
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },

      // Pre-Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders between Powerwall 3 and Gateway 3
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },

      // ========== POST-SMS BOS (Equipment Page) ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'post-sms', // Renders on Equipment page
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },
    ];

    const backupType = equipment.backupOption === 'Whole Home' ? 'Whole Home' : 'Partial Home';
    const solarStatus = equipment.hasSolarPanels ? 'with solar panels' : 'battery-only';

    return {
      configId: 'TESLA_PW3_GATEWAY3_APS_SINGLE_BACKUP',
      configName: `Tesla Powerwall 3 + Gateway 3 + APS ${backupType} (${solarStatus})`,
      description: `Single system: Tesla Powerwall 3 (battery-integrated inverter) with Gateway 3 acting as SMS + ${backupType} backup. ${equipment.hasSolarPanels ? 'Includes solar panels.' : 'Battery-only configuration.'}`,
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: equipment.hasSolarPanels,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Tesla Powerwall 3'],
        backupPanel: true,
        sms: false, // Gateway 3 acts as SMS
        gateway: true, // Gateway 3
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Post-SMS
        uniDirectionalMeters: 2, // Backup
      },

      bosEquipment,

      equipmentSections: {
        solar: equipment.hasSolarPanels,
        inverter: true, // Powerwall 3
        battery1: true, // Tesla batteries
        backupLoadSubPanel: true,
        gateway: true, // Gateway 3
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Post-SMS
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'Single system configuration (System 1 only)',
        `Tesla Powerwall 3 (battery-integrated inverter) - ${solarStatus}`,
        `${backupType} backup configuration`,
        'Supports 0-3 Tesla expansion packs (configured in PowerWall Configuration section)',
        'Gateway 3 IS the SMS - stored in SMS fields (make="Tesla", model="Gateway 3")',
        'Backup Load Sub Panel present',
        'Backup BOS: 2x Uni-Directional (Type 1: Meter, Type 2: Meter + Line Side Disconnect)',
        `AC-coupled system: Pre-Combine and Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
        'Pre-Combine BOS: 2x Bi-Directional between Powerwall 3 and Gateway 3 (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter)',
        'Post-SMS BOS: 1x Utility Disconnect on Equipment page',
      ],

      source: 'TeslaPowerwall3APSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR: Tesla Powerwall 3 + Gateway 3 + APS No Backup (Single System Only)
// Priority: 5
//
// Single system ONLY: Powerwall 3 (battery-integrated inverter)
//                     + Gateway 3 + 0-3 expansions
//                     + NO Backup (user selects "No Backup" in Powerwall Configuration)
//                     + NO Backup Load Sub Panel
//
// Can be battery-only OR with solar panels
// Only needs Post-SMS BOS (3 items), no Backup BOS
// ============================================================================

export const teslaPW3APSNoBackupDetector: ConfigurationDetector = {
  name: 'Tesla Powerwall 3 + Gateway 3 + APS No Backup (Single System)',
  configId: 'TESLA_PW3_GATEWAY3_APS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check - must be System 1 for single-system config
    // Note: Powerwall 3 has integrated battery, so no need to check batteryQuantity
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      isTeslaPowerwall3(equipment) &&
      hasGateway3(equipment) &&
      (equipment.backupOption === 'None' || !equipment.hasBackupPanel)
    );
  },

  detect: async (equipment: EquipmentState): Promise<ConfigurationMatch | null> => {
    console.log('[Tesla PW3 APS No Backup] Starting detection...');

    // MUST be System 1 for single-system configuration
    if (equipment.systemNumber !== 1) {
      console.log('[Tesla PW3 APS No Backup] ❌ Not System 1, skipping');
      return null;
    }

    // Check criteria
    // Note: Powerwall 3 is battery-integrated, always has 1 battery built-in
    // batteryQuantity represents expansion batteries (0-3)
    const checks = {
      isAPS: equipment.utilityName === 'APS',
      isInverterSystem: equipment.systemType === 'inverter', // Extra layer: must be inverter project
      isTeslaPW3: isTeslaPowerwall3(equipment),
      hasGateway3: hasGateway3(equipment), // Gateway 3 is stored in SMS fields
      noBackup: equipment.backupOption === 'None' || !equipment.hasBackupPanel,
    };

    console.log('[Tesla PW3 APS No Backup] Criteria check:', checks);
    console.log('[Tesla PW3 APS No Backup] Equipment details:', {
      utility: equipment.utilityName,
      hasSolar: equipment.hasSolarPanels,
      inverterMake: equipment.inverterMake,
      batteryMake: equipment.batteryMake,
      batteryQty: equipment.batteryQuantity,
      backup: equipment.backupOption,
      hasBackupPanel: equipment.hasBackupPanel,
      hasGateway: equipment.hasGateway,
      hasSMS: equipment.hasSMS,
      smsMake: equipment.smsMake,
      smsModel: equipment.smsModel,
    });

    const matches = Object.values(checks).every(v => v === true);

    if (!matches) {
      const failedChecks = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([check]) => check);
      console.log('[Tesla PW3 APS No Backup] ❌ Criteria not met. Failed checks:', failedChecks);
      return null;
    }

    console.log('[Tesla PW3 APS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    // Calculate Post-SMS BOS: AC-COUPLED = (inverter + battery) × 1.25
    const postSMSSizing = calculatePostCombineAmps(equipment);

    console.log(`[Tesla PW3 APS No Backup] BOS Sizing:`, {
      inverterOutput: postSMSSizing.inverterOutput,
      batteryOutput: postSMSSizing.batteryOutput,
      couplingType: 'AC',
      'Post-SMS (AC-coupled)': postSMSSizing.calculation,
    });

    // Build BOS equipment list - ONLY Post-SMS BOS (no Backup BOS)
    const bosEquipment: BOSEquipment[] = [
      // ========== POST-SMS BOS ==========
      // AC-COUPLED: Sized to total system output (inverter + battery)

      // Post-SMS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'post-sms', // Renders in Post-SMS BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },

      // Post-SMS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'post-sms', // Renders in Post-SMS BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },

      // Post-SMS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'post-sms', // Renders in Post-SMS BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: postSMSSizing.calculation,
        sizingValue: postSMSSizing.requiredAmps,
      },
    ];

    const solarStatus = equipment.hasSolarPanels ? 'with solar panels' : 'battery-only';

    return {
      configId: 'TESLA_PW3_GATEWAY3_APS_NO_BACKUP',
      configName: `Tesla Powerwall 3 + Gateway 3 + APS No Backup (${solarStatus})`,
      description: `Single system: Tesla Powerwall 3 (battery-integrated inverter) with Gateway 3 acting as SMS + No Backup. ${equipment.hasSolarPanels ? 'Includes solar panels.' : 'Battery-only configuration.'}`,
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: equipment.hasSolarPanels,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Tesla Powerwall 3'],
        backupPanel: false, // No backup panel
        sms: false, // Gateway 3 acts as SMS
        gateway: true, // Gateway 3
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Post-SMS
        uniDirectionalMeters: 0, // No backup BOS
      },

      bosEquipment,

      equipmentSections: {
        solar: equipment.hasSolarPanels,
        inverter: true, // Powerwall 3
        battery1: true, // Tesla batteries
        backupLoadSubPanel: false, // No backup panel
        gateway: true, // Gateway 3
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Post-SMS
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'Single system configuration (System 1 only)',
        `Tesla Powerwall 3 (battery-integrated inverter) - ${solarStatus}`,
        'No Backup configuration (user selected "No Backup" in Powerwall Configuration)',
        'No Backup Load Sub Panel',
        'Supports 0-3 Tesla expansion packs (configured in PowerWall Configuration section)',
        'Gateway 3 IS the SMS - stored in SMS fields (make="Tesla", model="Gateway 3")',
        `AC-coupled system: Post-SMS BOS sized to ${postSMSSizing.requiredAmps}A (inverter + battery × 1.25)`,
        'Post-SMS BOS only: 3x equipment (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter, Type 3: Utility Disconnect)',
        'No Backup BOS required (no backup panel)',
      ],

      source: 'TeslaPowerwall3APSConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// Export all detectors
export const teslaPW3APSDetectors: ConfigurationDetector[] = [
  teslaPW3WholeHomeAPSDetector,
  teslaPW3APSSingleOrCombinedDetector,
  teslaPW3APSNoBackupDetector,
];
