// APSDCCoupledConfigs.ts
// Configuration detectors for generic DC-coupled systems (equipment-agnostic)
// Priority: 4-5 (High priority - architecture-based, runs after equipment-specific configs)

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

// ============================================================================
// DETECTOR 1: DC Coupled + SMS + Backup Panel
// Priority: 4
//
// Generic DC-coupled configuration with SMS and backup capability
// Equipment-agnostic (works with any DC-coupled inverter/battery combination)
// ============================================================================

export const apsDCCoupledSMSBackupDetector: ConfigurationDetector = {
  name: 'APS DC Coupled + SMS + Backup',
  configId: 'APS_DC_COUPLED_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      equipment.hasSMS &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS DC Coupled SMS Backup] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      equipment.hasSMS &&
      equipment.hasBackupPanel;

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS DC Coupled SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR DIFFERENT SECTIONS ==========

    // 1. PRE-COMBINE BOS (between inverter and SMS): Use inverter max output only
    //    For DC-coupled, battery is connected to inverter, so only inverter output matters here
    const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
    const preCombineRequiredAmps = Math.ceil(inverterOutput * 1.25);

    // Determine inverter type for display label
    const isMicroinverter = equipment.systemType === 'microinverter';
    const inverterLabel = isMicroinverter ? 'Microinverter Output' : 'Inverter Output';
    const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. BACKUP BOS (at backup load sub panel): Use backup panel bus rating
    const backupPanelAmps = equipment.backupPanelBusRating || 200;
    const backupRequiredAmps = backupPanelAmps; // No 1.25x multiplier, use exact panel rating

    // 3. POST-SMS BOS (after SMS, before utility): DC-COUPLED SYSTEMS
    //    For DC-coupled systems, battery is on the DC bus BEFORE the inverter
    //    The inverter regulates ALL power flow to/from the grid
    //    Therefore: ALL AC-side BOS is sized to INVERTER OUTPUT ONLY
    //    The battery cannot discharge more AC power than the inverter can convert
    const postSMSRequiredAmps = preCombineRequiredAmps; // Same as pre-combine (inverter output × 1.25)

    // Build Post-SMS calculation breakdown - DC-coupled uses inverter-only sizing
    const postSMSCalculation = `${inverterOutput}A × 1.25 = ${postSMSRequiredAmps}A (DC-Coupled)`;

    console.log(`[APS DC Coupled SMS Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput: equipment.batteryMaxContinuousOutput,
      batteryQuantity: equipment.batteryQuantity,
      couplingType: 'DC',
      'Pre-Combine (inverter only)': `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`,
      'Backup (panel rating)': `${backupPanelAmps}A (exact)`,
      'Post-SMS (DC-coupled, inverter only)': `${inverterOutput}A × 1.25 = ${postSMSRequiredAmps}A`,
      'Note': 'DC-coupled: battery on DC bus, inverter regulates all AC power',
    });

    // Build BOS equipment list
    const bosEquipment: BOSEquipment[] = [
      // ========== BACKUP LOAD SUB PANEL BOS ==========
      // Sized to backup panel bus rating

      // Backup BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: backupRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Backup Panel Rating',
        sizingCalculation: `${backupPanelAmps}A`,
        sizingValue: backupPanelAmps,
      },

      // Backup BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        ampRating: backupRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Backup Panel Rating',
        sizingCalculation: `${backupPanelAmps}A`,
        sizingValue: backupPanelAmps,
      },

      // ========== PRE-COMBINE BOS (Between DC-coupled inverter and SMS) ==========
      // Sized to inverter max output with 1.25x safety factor
      // Renders in the pre-combined BOS section (bos_type_1, bos_type_2)

      // Pre-Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders between inverter and SMS
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // Pre-Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders between inverter and SMS
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // ========== POST-SMS BOS (Equipment Page) ==========
      // DC-COUPLED: Sized to inverter output only (battery on DC bus)
      // Inverter regulates all AC power flow to/from grid

      // Post-SMS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSRequiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'post-sms', // Renders on Equipment page
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postSMSCalculation,
        sizingValue: postSMSRequiredAmps,
      },
    ];

    const backupType = equipment.backupOption === 'Whole Home' ? 'Whole Home' :
                       equipment.backupOption === 'Partial Home' ? 'Partial Home' : 'Backup';

    return {
      configId: 'APS_DC_COUPLED_SMS_BACKUP',
      configName: `APS DC Coupled + SMS + ${backupType}`,
      description: `DC-coupled configuration with SMS and ${backupType} backup capability. Equipment-agnostic (works with any DC-coupled battery + hybrid inverter combination).`,
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Hybrid', 'Grid Forming/Following'],
        backupPanel: true,
        sms: true,
        gateway: equipment.hasGateway,
        hybridInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Pre-Combine
        uniDirectionalMeters: 2, // Backup
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: equipment.hasGateway,
        sms: true,
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Pre-Combine
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'DC-coupled system (equipment-agnostic)',
        'DC-coupled battery directly connected to hybrid inverter',
        `${backupType} backup capability via SMS`,
        'Backup Load Sub Panel present',
        'Backup BOS: 2x Uni-Directional (Type 1: Meter, Type 2: Meter + Line Side Disconnect)',
        'Pre-Combine BOS: 2x Bi-Directional between inverter and SMS (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter)',
        'Post-SMS BOS: 1x Utility Disconnect on Equipment page',
        'Total BOS: 5 items (2 backup + 2 pre-combine + 1 post-SMS)',
      ],

      source: 'APSDCCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 2: DC Coupled + SMS + No Backup
// Priority: 5
//
// Generic DC-coupled configuration with SMS but no backup capability
// Equipment-agnostic (works with any DC-coupled inverter/battery combination)
// ============================================================================

export const apsDCCoupledSMSNoBackupDetector: ConfigurationDetector = {
  name: 'APS DC Coupled + SMS + No Backup',
  configId: 'APS_DC_COUPLED_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS DC Coupled SMS No Backup] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      equipment.hasSMS &&
      !equipment.hasBackupPanel;

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS DC Coupled SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR DIFFERENT SECTIONS ==========

    // 1. PRE-COMBINE BOS (between inverter and SMS): Use inverter max output only
    const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
    const preCombineRequiredAmps = Math.ceil(inverterOutput * 1.25);

    // Determine inverter type for display label
    const isMicroinverter = equipment.systemType === 'microinverter';
    const inverterLabel = isMicroinverter ? 'Microinverter Output' : 'Inverter Output';
    const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. POST-SMS BOS (after SMS, before utility): DC-COUPLED SYSTEMS
    //    For DC-coupled systems, battery is on the DC bus BEFORE the inverter
    //    The inverter regulates ALL power flow to/from the grid
    //    Therefore: ALL AC-side BOS is sized to INVERTER OUTPUT ONLY
    const postSMSRequiredAmps = preCombineRequiredAmps; // Same as pre-combine (inverter output × 1.25)

    // Build Post-SMS calculation breakdown - DC-coupled uses inverter-only sizing
    const postSMSCalculation = `${inverterOutput}A × 1.25 = ${postSMSRequiredAmps}A (DC-Coupled)`;

    console.log(`[APS DC Coupled SMS No Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput: equipment.batteryMaxContinuousOutput,
      batteryQuantity: equipment.batteryQuantity,
      couplingType: 'DC',
      'Pre-Combine (inverter only)': `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`,
      'Post-SMS (DC-coupled, inverter only)': `${inverterOutput}A × 1.25 = ${postSMSRequiredAmps}A`,
      'Note': 'DC-coupled: battery on DC bus, inverter regulates all AC power',
    });

    // Build BOS equipment list - No Backup BOS, only Pre-Combine + Post-SMS
    const bosEquipment: BOSEquipment[] = [
      // ========== PRE-COMBINE BOS (Between DC-coupled inverter and SMS) ==========
      // Sized to inverter max output with 1.25x safety factor

      // Pre-Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders between inverter and SMS
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // Pre-Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders between inverter and SMS
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // ========== POST-SMS BOS ==========
      // DC-COUPLED: Sized to inverter output only (battery on DC bus)
      // Inverter regulates all AC power flow to/from grid

      // Post-SMS Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postSMSRequiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'post-sms', // Renders in Post-SMS BOS section
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postSMSRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postSMSCalculation,
        sizingValue: postSMSRequiredAmps,
      },
    ];

    return {
      configId: 'APS_DC_COUPLED_SMS_NO_BACKUP',
      configName: 'APS DC Coupled + SMS + No Backup',
      description: 'DC-coupled configuration with SMS but no backup power capability. Equipment-agnostic (works with any DC-coupled battery + hybrid inverter combination).',
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Hybrid', 'Grid Following'],
        backupPanel: false,
        sms: true,
        gateway: false,
        hybridInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Pre-Combine
        uniDirectionalMeters: 0, // No backup BOS
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: false,
        gateway: false,
        sms: true,
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Pre-Combine
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'DC-coupled system (equipment-agnostic)',
        'DC-coupled battery directly connected to hybrid inverter',
        'No backup power capability - system will not operate during grid outages',
        'Grid-tied only with SMS for monitoring/control',
        'No Backup Load Sub Panel',
        'Pre-Combine BOS: 2x Bi-Directional between inverter and SMS (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter)',
        'Post-SMS BOS: 1x Utility Disconnect',
        'Total BOS: 3 items (2 pre-combine + 1 post-SMS)',
      ],

      source: 'APSDCCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 3: DC Coupled + No SMS + Backup Panel
// Priority: 4
//
// Generic DC-coupled configuration without SMS but with backup capability
// Equipment-agnostic (works with any DC-coupled inverter/battery combination)
// ============================================================================

export const apsDCCoupledNoSMSBackupDetector: ConfigurationDetector = {
  name: 'APS DC Coupled + No SMS + Backup',
  configId: 'APS_DC_COUPLED_NO_SMS_BACKUP',
  priority: 4,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS DC Coupled No SMS Backup] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      !equipment.hasSMS &&
      equipment.hasBackupPanel;

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS DC Coupled No SMS Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR DIFFERENT SECTIONS ==========

    // 1. PRE-COMBINE BOS (after inverter, no SMS): Use inverter max output only
    const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
    const preCombineRequiredAmps = Math.ceil(inverterOutput * 1.25);

    // Determine inverter type for display label
    const isMicroinverter = equipment.systemType === 'microinverter';
    const inverterLabel = isMicroinverter ? 'Microinverter Output' : 'Inverter Output';
    const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. BACKUP BOS (at backup load sub panel): Use backup panel bus rating
    const backupPanelAmps = equipment.backupPanelBusRating || 200;
    const backupRequiredAmps = backupPanelAmps; // No 1.25x multiplier, use exact panel rating

    // 3. POST-INVERTER BOS (after inverter, before utility, no SMS): DC-COUPLED SYSTEMS
    //    For DC-coupled systems, battery is on the DC bus BEFORE the inverter
    //    The inverter regulates ALL power flow to/from the grid
    //    Therefore: ALL AC-side BOS is sized to INVERTER OUTPUT ONLY
    const postInverterRequiredAmps = preCombineRequiredAmps; // Same as pre-combine (inverter output × 1.25)

    // Build Post-Inverter calculation breakdown - DC-coupled uses inverter-only sizing
    const postInverterCalculation = `${inverterOutput}A × 1.25 = ${postInverterRequiredAmps}A (DC-Coupled)`;

    console.log(`[APS DC Coupled No SMS Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput: equipment.batteryMaxContinuousOutput,
      batteryQuantity: equipment.batteryQuantity,
      couplingType: 'DC',
      'Pre-Combine (inverter only)': `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`,
      'Backup (panel rating)': `${backupPanelAmps}A (exact)`,
      'Post-Inverter (DC-coupled, inverter only)': `${inverterOutput}A × 1.25 = ${postInverterRequiredAmps}A`,
      'Note': 'DC-coupled: battery on DC bus, inverter regulates all AC power',
    });

    // Build BOS equipment list
    const bosEquipment: BOSEquipment[] = [
      // ========== BACKUP LOAD SUB PANEL BOS ==========
      // Sized to backup panel bus rating

      // Backup BOS Type 1: Uni-Directional Meter
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: backupRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Backup Panel Rating',
        sizingCalculation: `${backupPanelAmps}A`,
        sizingValue: backupPanelAmps,
      },

      // Backup BOS Type 2: Uni-Directional Meter Line Side Disconnect
      {
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        ampRating: backupRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'backup', // Renders under Backup Load Sub Panel
        systemPrefix: equipment.systemPrefix,
        minAmpRating: backupRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Backup Panel Rating',
        sizingCalculation: `${backupPanelAmps}A`,
        sizingValue: backupPanelAmps,
      },

      // ========== PRE-COMBINE BOS (After DC-coupled inverter, no SMS) ==========
      // Sized to inverter max output with 1.25x safety factor
      // Renders in the pre-combined BOS section (bos_type_1, bos_type_2)

      // Pre-Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // Pre-Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // ========== POST-INVERTER BOS (Equipment Page) ==========
      // DC-COUPLED: No SMS, disconnect goes directly after inverter output
      // Sized to inverter output only (battery on DC bus)

      // Post-Inverter Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postInverterRequiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility', // Type 3: Post-inverter disconnect (no SMS present)
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postInverterRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postInverterCalculation,
        sizingValue: postInverterRequiredAmps,
      },
    ];

    const backupType = equipment.backupOption === 'Whole Home' ? 'Whole Home' :
                       equipment.backupOption === 'Partial Home' ? 'Partial Home' : 'Backup';

    return {
      configId: 'APS_DC_COUPLED_NO_SMS_BACKUP',
      configName: `APS DC Coupled + No SMS + ${backupType}`,
      description: `DC-coupled configuration without SMS but with ${backupType} backup capability. Equipment-agnostic (works with any DC-coupled battery + hybrid inverter combination).`,
      priority: 4,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Hybrid', 'Grid Forming/Following'],
        backupPanel: true,
        sms: false,
        gateway: equipment.hasGateway,
        hybridInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Pre-Combine
        uniDirectionalMeters: 2, // Backup
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: equipment.hasGateway,
        sms: false,
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Pre-Combine
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'DC-coupled system (equipment-agnostic)',
        'DC-coupled battery directly connected to hybrid inverter',
        `${backupType} backup capability (no SMS for monitoring)`,
        'Backup Load Sub Panel present',
        'No SMS - inverter provides backup switching',
        'Backup BOS: 2x Uni-Directional (Type 1: Meter, Type 2: Meter + Line Side Disconnect)',
        'Pre-Combine BOS: 2x Bi-Directional after inverter (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter)',
        'Post-Inverter BOS: 1x Utility Disconnect (no SMS, so disconnect directly after inverter)',
        'Total BOS: 5 items (2 backup + 2 pre-combine + 1 post-inverter)',
      ],

      source: 'APSDCCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// DETECTOR 4: DC Coupled + No SMS + No Backup
// Priority: 5
//
// Generic DC-coupled configuration without SMS and without backup capability
// Equipment-agnostic (works with any DC-coupled inverter/battery combination)
// ============================================================================

export const apsDCCoupledNoSMSNoBackupDetector: ConfigurationDetector = {
  name: 'APS DC Coupled + No SMS + No Backup',
  configId: 'APS_DC_COUPLED_NO_SMS_NO_BACKUP',
  priority: 5,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    // Fast pre-check before running full detection
    return (
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    console.log('[APS DC Coupled No SMS No Backup] Checking criteria...');

    // STRICT CRITERIA - ALL must match
    const meetsAllCriteria =
      equipment.systemNumber === 1 &&
      equipment.utilityName === 'APS' &&
      equipment.systemType === 'inverter' &&
      equipment.couplingType === 'DC' &&
      equipment.batteryQuantity > 0 &&
      equipment.hasSolarPanels &&
      !equipment.hasSMS &&
      !equipment.hasBackupPanel;

    if (!meetsAllCriteria) {
      return null;
    }

    console.log('[APS DC Coupled No SMS No Backup] ✅ ALL CRITERIA MET!');

    // ========== CALCULATE BOS SIZING FOR DIFFERENT SECTIONS ==========

    // 1. PRE-COMBINE BOS (after inverter, no SMS): Use inverter max output only
    const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
    const preCombineRequiredAmps = Math.ceil(inverterOutput * 1.25);

    // Determine inverter type for display label
    const isMicroinverter = equipment.systemType === 'microinverter';
    const inverterLabel = isMicroinverter ? 'Microinverter Output' : 'Inverter Output';
    const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`;

    // 2. POST-INVERTER BOS (after inverter, before utility, no SMS): DC-COUPLED SYSTEMS
    //    For DC-coupled systems, battery is on the DC bus BEFORE the inverter
    //    The inverter regulates ALL power flow to/from the grid
    //    Therefore: ALL AC-side BOS is sized to INVERTER OUTPUT ONLY
    const postInverterRequiredAmps = preCombineRequiredAmps; // Same as pre-combine (inverter output × 1.25)

    // Build Post-Inverter calculation breakdown - DC-coupled uses inverter-only sizing
    const postInverterCalculation = `${inverterOutput}A × 1.25 = ${postInverterRequiredAmps}A (DC-Coupled)`;

    console.log(`[APS DC Coupled No SMS No Backup] BOS Sizing:`, {
      inverterOutput,
      batteryOutput: equipment.batteryMaxContinuousOutput,
      batteryQuantity: equipment.batteryQuantity,
      couplingType: 'DC',
      'Pre-Combine (inverter only)': `${inverterOutput}A × 1.25 = ${preCombineRequiredAmps}A`,
      'Post-Inverter (DC-coupled, inverter only)': `${inverterOutput}A × 1.25 = ${postInverterRequiredAmps}A`,
      'Note': 'DC-coupled: battery on DC bus, inverter regulates all AC power',
    });

    // Build BOS equipment list - No Backup BOS, only Pre-Combine + Post-Inverter
    const bosEquipment: BOSEquipment[] = [
      // ========== PRE-COMBINE BOS (After DC-coupled inverter, no SMS) ==========
      // Sized to inverter max output with 1.25x safety factor

      // Pre-Combine BOS Type 1: Bi-Directional Meter DER Side Disconnect
      {
        equipmentType: 'Bi-Directional Meter DER Side Disconnect',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // Pre-Combine BOS Type 2: Bi-Directional Meter
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: preCombineRequiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility', // Renders after inverter
        systemPrefix: equipment.systemPrefix,
        minAmpRating: preCombineRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: inverterLabel,
        sizingCalculation: preCombineCalculation,
        sizingValue: preCombineRequiredAmps,
      },

      // ========== POST-INVERTER BOS ==========
      // DC-COUPLED: No SMS, disconnect goes directly after inverter output
      // Sized to inverter output only (battery on DC bus)

      // Post-Inverter Type 3: Utility Disconnect
      {
        equipmentType: 'Utility Disconnect',
        ampRating: postInverterRequiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility', // Type 3: Post-inverter disconnect (no SMS present)
        systemPrefix: equipment.systemPrefix,
        minAmpRating: postInverterRequiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: postInverterCalculation,
        sizingValue: postInverterRequiredAmps,
      },
    ];

    return {
      configId: 'APS_DC_COUPLED_NO_SMS_NO_BACKUP',
      configName: 'APS DC Coupled + No SMS + No Backup',
      description: 'DC-coupled configuration without SMS and without backup power capability. Equipment-agnostic (works with any DC-coupled battery + hybrid inverter combination).',
      priority: 5,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Hybrid', 'Grid Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        hybridInverter: 1,
        automaticDisconnectSwitch: false,
        biDirectionalMeters: 2, // Pre-Combine
        uniDirectionalMeters: 0, // No backup BOS
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: false,
        gateway: false,
        sms: false,
        ess: true, // Energy Storage System
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional', // Pre-Combine
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'DC-coupled system (equipment-agnostic)',
        'DC-coupled battery directly connected to hybrid inverter',
        'No backup power capability - system will not operate during grid outages',
        'Grid-tied only with no SMS or backup panel',
        'No Backup Load Sub Panel',
        'No SMS - simple grid-tied configuration',
        'Pre-Combine BOS: 2x Bi-Directional after inverter (Type 1: Bi-Dir Meter + DER Disconnect, Type 2: Bi-Dir Meter)',
        'Post-Inverter BOS: 1x Utility Disconnect',
        'Total BOS: 3 items (2 pre-combine + 1 post-inverter)',
      ],

      source: 'APSDCCoupledConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all APS DC Coupled detectors
// ============================================================================

export const apsDCCoupledDetectors: ConfigurationDetector[] = [
  apsDCCoupledSMSBackupDetector,
  apsDCCoupledNoSMSBackupDetector,
  apsDCCoupledSMSNoBackupDetector,
  apsDCCoupledNoSMSNoBackupDetector,
];
