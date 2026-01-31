// APSGenericConfigs.ts
// Generic APS utility configuration detectors
// Based on APS Configuration Switchboard (A-1, A-2, B-1 through B-5, C-1, C-2, D)
// Priority 10-29: Run after Franklin-specific configurations

import {
  ConfigurationDetector,
  EquipmentState,
  ConfigurationMatch,
  BOSEquipment,
} from '../types/ConfigurationTypes';

/**
 * Helper: Calculate BOS amp rating for AC-coupled systems
 * AC-Coupled systems: Separate inverters on AC side
 * Post-SMS BOS must handle inverter + battery simultaneously
 */
function calculateACCoupledAmps(equipment: EquipmentState): {
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
 * Helper: Calculate BOS amp rating for DC-coupled systems
 * DC-Coupled systems: Battery on DC bus BEFORE inverter
 * Post-SMS BOS sized to inverter output only (inverter regulates all AC power)
 */
function calculateDCCoupledAmps(equipment: EquipmentState): {
  requiredAmps: number;
  calculation: string;
  inverterOutput: number;
} {
  const inverterOutput = equipment.inverterMaxContinuousOutput || 100;
  const requiredAmps = Math.ceil(inverterOutput * 1.25);
  const calculation = `${inverterOutput}A × 1.25 = ${requiredAmps}A (DC-Coupled)`;

  return { requiredAmps, calculation, inverterOutput };
}

// ============================================================================
// CONFIGURATION A-1: Grid-only battery with backup
// Priority: 10
// ============================================================================

const apsConfigA1Detector: ConfigurationDetector = {
  name: 'APS A-1 (Grid-only + Backup)',
  configId: 'APS_A1',
  priority: 10,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      !equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      !equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.batteryChargingSource === 'grid-only' &&
      equipment.couplingType === 'AC' &&
      equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      {
        equipmentType: 'Automatic Disconnect Switch',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_A1',
      configName: 'AC Coupled A-1 (Grid-only + Backup)',
      description: 'Battery charged from grid only with backup power capability',
      priority: 10,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: false,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Forming/Following'],
        backupPanel: true,
        sms: false,
        gateway: true,
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: true,
        biDirectionalMeters: 3,
        uniDirectionalMeters: 0,
      },

      bosEquipment,

      equipmentSections: {
        solar: false,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'Battery charges from grid only',
        'Provides backup power during outages',
        'Requires ADS for grid isolation',
        'No solar PV in this configuration',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION A-2: Grid-only battery with PCS (no backup)
// Priority: 11
// ============================================================================

const apsConfigA2Detector: ConfigurationDetector = {
  name: 'APS A-2 (Grid-only + PCS)',
  configId: 'APS_A2',
  priority: 11,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      !equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      !equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.batteryChargingSource === 'grid-only' &&
      equipment.couplingType === 'AC' &&
      !equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      {
        equipmentType: 'Disconnect Switch',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 1,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_A2',
      configName: 'AC Coupled A-2 (Grid-only + PCS)',
      description: 'Battery charged from grid only with Power Control System (curtailment)',
      priority: 11,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: false,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        gridFollowingInverter: 1,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 0,
      },

      bosEquipment,

      equipmentSections: {
        solar: false,
        inverter: true,
        battery1: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'der-side',
        meterTestBlock: false,
      },

      notes: [
        'Battery charges from grid only',
        'Provides customer load curtailment/PCS',
        'System shuts down during grid outage',
        'Used for peak shaving and load shifting',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION B-1: Multiple batteries + backup
// Priority: 12
// ============================================================================

const apsConfigB1Detector: ConfigurationDetector = {
  name: 'APS B-1 (Solar + Multiple Batteries + Backup)',
  configId: 'APS_B1',
  priority: 12,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 1 &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 1 &&
      equipment.hasMultipleBatteries &&
      equipment.batteryChargingSource === 'grid-or-renewable' &&
      equipment.couplingType === 'AC' &&
      equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Automatic Disconnect Switch',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      { equipmentType: 'Dedicated DER Combiner Panel', isNew: true, position: 4, section: 'utility', systemPrefix: equipment.systemPrefix },
    ];

    return {
      configId: 'APS_B1',
      configName: 'AC Coupled B-1 (Solar + Multiple Batteries + Backup)',
      description: 'Battery charged from grid or renewable with multiple batteries (qty > 1) and backup',
      priority: 12,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: true,
        sms: false,
        gateway: true,
        gridFollowingInverter: 1,
        gridFormingFollowingInverter: 2,
        automaticDisconnectSwitch: true,
        dedicatedDERCombiner: true,
        biDirectionalMeters: 1,
        uniDirectionalMeters: 2,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        batteryCombinerPanel: true,
        backupLoadSubPanel: true,
        gateway: true,
        ess: true,
        stringCombinerPanel: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'Multiple battery units of the same type (quantity > 1)',
        'Includes solar PV array',
        'Provides backup power during outages',
        'Requires dedicated DER combiner panel for multiple batteries',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION B-2: Solar + Battery + PCS (no backup)
// Priority: 13
// ============================================================================

const apsConfigB2Detector: ConfigurationDetector = {
  name: 'APS B-2 (Solar + Battery + PCS)',
  configId: 'APS_B2',
  priority: 13,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      equipment.batteryChargingSource === 'grid-or-renewable' &&
      equipment.couplingType === 'AC' &&
      !equipment.hasBackupPanel &&
      equipment.supportsPeakShaving;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_B2',
      configName: 'AC Coupled B-2 (Solar + Battery + PCS)',
      description: 'Battery charged from grid or renewable with PCS (curtailment)',
      priority: 13,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        gridFollowingInverter: 2,
        biDirectionalMeters: 1,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Single battery system',
        'Includes solar PV array',
        'Provides customer load curtailment/PCS',
        'System shuts down during grid outage',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION B-3: Solar + Single Battery + Backup
// Priority: 14
// ============================================================================

const apsConfigB3Detector: ConfigurationDetector = {
  name: 'APS B-3 (Solar + Single Battery + Backup)',
  configId: 'APS_B3',
  priority: 14,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      equipment.batteryChargingSource === 'grid-or-renewable' &&
      equipment.couplingType === 'AC' &&
      equipment.hasBackupPanel &&
      !equipment.hasMultipleBatteries;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Automatic Disconnect Switch',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_B3',
      configName: 'AC Coupled B-3 (Solar + Single Battery + Backup)',
      description: 'Battery charged from grid or renewable with single battery and backup',
      priority: 14,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Following', 'Grid Forming/Following'],
        backupPanel: true,
        sms: false,
        gateway: true,
        gridFollowingInverter: 1,
        gridFormingFollowingInverter: 1,
        automaticDisconnectSwitch: true,
        biDirectionalMeters: 1,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Single battery system',
        'Includes solar PV array',
        'Provides backup power during outages',
        'Requires ADS for grid isolation',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION B-4: Solar + Battery (Standard)
// Priority: 15
// ============================================================================

const apsConfigB4Detector: ConfigurationDetector = {
  name: 'APS B-4 (Solar + Battery Standard)',
  configId: 'APS_B4',
  priority: 15,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity === 1 &&
      equipment.batteryChargingSource === 'grid-or-renewable' &&
      equipment.couplingType === 'AC' &&
      !equipment.hasBackupPanel &&
      !equipment.supportsPeakShaving;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_B4',
      configName: 'AC Coupled B-4 (Solar + Battery Standard)',
      description: 'Battery charged from grid or renewable (standard configuration)',
      priority: 15,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        gridFollowingInverter: 2,
        dedicatedDERCombiner: true,
        biDirectionalMeters: 1,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        batteryCombinerPanel: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'Standard configuration',
        'No backup power capability',
        'No PCS/curtailment',
        'Includes dedicated DER combiner panel',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION B-5: Multiple batteries + PCS (no backup)
// Priority: 16
// ============================================================================

const apsConfigB5Detector: ConfigurationDetector = {
  name: 'APS B-5 (Multiple Batteries + PCS)',
  configId: 'APS_B5',
  priority: 16,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 1 &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 1 &&
      equipment.hasMultipleBatteries &&
      equipment.batteryChargingSource === 'grid-or-renewable' &&
      equipment.couplingType === 'AC' &&
      !equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR AC-COUPLED SYSTEM ==========
    const bosSizing = calculateACCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Total System Output (AC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_B5',
      configName: 'AC Coupled B-5 (Multiple Batteries + PCS)',
      description: 'Battery charged from grid or renewable with multiple batteries and PCS',
      priority: 16,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: equipment.batteryQuantity,
        batteryTypes: 1,
        inverterTypes: ['Grid Following'],
        backupPanel: false,
        sms: false,
        gateway: false,
        gridFollowingInverter: 2,
        biDirectionalMeters: 1,
        uniDirectionalMeters: 1,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'line-side',
        meterTestBlock: false,
      },

      notes: [
        'Multiple battery units of the same type (quantity > 1)',
        'Includes solar PV array',
        'Provides customer load curtailment/PCS',
        'Two utility disconnects required',
        `AC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter + battery × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION C-1: DC Coupled Hybrid (peak shaving only)
// Priority: 17
// ============================================================================

const apsConfigC1Detector: ConfigurationDetector = {
  name: 'APS C-1 (DC Coupled Hybrid)',
  configId: 'APS_C1',
  priority: 17,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.couplingType === 'DC' &&
      !equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.couplingType === 'DC' &&
      equipment.supportsPeakShaving &&
      !equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR DC-COUPLED SYSTEM ==========
    const bosSizing = calculateDCCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Uni-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_C1',
      configName: 'DC Coupled Hybrid C-1 (Peak Shaving)',
      description: 'DC coupled hybrid system with peak shaving capability',
      priority: 17,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Hybrid'],
        backupPanel: true,
        sms: false,
        gateway: false,
        hybridInverter: 1,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 2,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'both',
        meterTestBlock: false,
      },

      notes: [
        'DC coupled system with hybrid inverter',
        'Battery may provide peak shaving',
        'Optional backup load equipment',
        'PV array directly connected to hybrid inverter',
        `DC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter only × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION C-2: DC Coupled Hybrid + Backup
// Priority: 18
// ============================================================================

const apsConfigC2Detector: ConfigurationDetector = {
  name: 'APS C-2 (DC Coupled Hybrid + Backup)',
  configId: 'APS_C2',
  priority: 18,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.couplingType === 'DC' &&
      equipment.hasBackupPanel
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.hasSolarPanels &&
      equipment.couplingType === 'DC' &&
      equipment.supportsPeakShaving &&
      equipment.hasBackupPanel;

    if (!matches) return null;

    // ========== CALCULATE BOS SIZING FOR DC-COUPLED SYSTEM ==========
    const bosSizing = calculateDCCoupledAmps(equipment);

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'String Combiner Panel', isNew: true, position: 1, section: 'utility', systemPrefix: equipment.systemPrefix },
      {
        equipmentType: 'Automatic Disconnect Switch',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 2,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
      {
        equipmentType: 'Bi-Directional Meter',
        ampRating: bosSizing.requiredAmps.toString(),
        isNew: true,
        position: 3,
        section: 'utility',
        systemPrefix: equipment.systemPrefix,
        minAmpRating: bosSizing.requiredAmps,
        requiresUserSelection: false,
        sizingLabel: 'Inverter Output (DC-Coupled)',
        sizingCalculation: bosSizing.calculation,
        sizingValue: bosSizing.requiredAmps,
      },
    ];

    return {
      configId: 'APS_C2',
      configName: 'DC Coupled Hybrid C-2 (Peak Shaving + Backup)',
      description: 'DC coupled hybrid system with peak shaving and backup power',
      priority: 18,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: true,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Hybrid'],
        backupPanel: true,
        sms: false,
        gateway: true,
        hybridInverter: 1,
        automaticDisconnectSwitch: true,
        biDirectionalMeters: 2,
        uniDirectionalMeters: 0,
      },

      bosEquipment,

      equipmentSections: {
        solar: true,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        ess: true,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'der-side',
        meterTestBlock: false,
      },

      notes: [
        'DC coupled system with hybrid inverter',
        'Provides backup power during outages',
        'Battery may provide peak shaving',
        'Requires ADS for grid isolation',
        `DC-coupled system: BOS sized to ${bosSizing.requiredAmps}A (inverter only × 1.25)`,
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// CONFIGURATION D: Standby Battery Only
// Priority: 19
// ============================================================================

const apsConfigDDetector: ConfigurationDetector = {
  name: 'APS D (Standby Battery)',
  configId: 'APS_D',
  priority: 19,
  utilities: ['APS'],

  quickCheck: (equipment: EquipmentState): boolean => {
    return (
      equipment.utilityName === 'APS' &&
      !equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0 &&
      equipment.isStandbyOnly
    );
  },

  detect: (equipment: EquipmentState): ConfigurationMatch | null => {
    const matches =
      equipment.utilityName === 'APS' &&
      equipment.isStandbyOnly === true;

    if (!matches) return null;

    const bosEquipment: BOSEquipment[] = [
      { equipmentType: 'Transfer Switch', isNew: true, position: 1, section: 'utility' },
    ];

    return {
      configId: 'APS_D',
      configName: 'Standby Battery Configuration D',
      description: 'Standby battery system without renewable energy sources',
      priority: 19,
      confidence: 'high',

      requiredEquipment: {
        solarPanels: false,
        batteryQuantity: 1,
        batteryTypes: 1,
        inverterTypes: ['Grid Forming/Following'],
        backupPanel: true,
        sms: false,
        gateway: true,
        gridFormingFollowingInverter: 1,
        transferSwitch: true,
        batteryCharger: true,
        biDirectionalMeters: 0,
        uniDirectionalMeters: 0,
      },

      bosEquipment,

      equipmentSections: {
        solar: false,
        inverter: true,
        battery1: true,
        backupLoadSubPanel: true,
        gateway: true,
        ess: false,
      },

      meterConfiguration: {
        utilityMeter: 'bi-directional',
        productionMetering: 'none',
        meterTestBlock: false,
      },

      notes: [
        'Standby battery only - no solar',
        'Includes battery charger',
        'Requires transfer switch',
        'Provides backup power during outages',
      ],

      source: 'APSGenericConfigs',
      detectedAt: new Date(),
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
    };
  },
};

// ============================================================================
// Export all APS generic detectors
// ============================================================================

export const apsGenericDetectors: ConfigurationDetector[] = [
  apsConfigA1Detector,
  apsConfigA2Detector,
  apsConfigB1Detector,
  apsConfigB2Detector,
  apsConfigB3Detector,
  apsConfigB4Detector,
  apsConfigB5Detector,
  apsConfigC1Detector,
  apsConfigC2Detector,
  apsConfigDDetector,
];
