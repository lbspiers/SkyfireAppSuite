// APSConfigurationManager.ts
// Service for monitoring equipment state and managing configuration detection
// Supports multiple utilities with APS-specific and universal logic

import {
  APSConfigurationSwitchboard,
  SwitchboardInputs,
  ConfigurationOutput,
} from '../utils/Apsconfigurationswitchboard';
import { UtilityConfigurationRegistry } from './UtilityConfigurationRegistry';

export interface EquipmentState {
  // Current system context
  currentSystem: 'sys1' | 'sys2' | 'sys3' | 'sys4';

  // Utility context (NEW)
  utilityName: string;
  utilityBOSCombination: string;
  utilityBOSRequirements?: {
    bos1?: string;
    bos2?: string;
    bos3?: string;
    bos4?: string;
    bos5?: string;
    bos6?: string;
  };

  // Solar equipment
  hasSolarPanels: boolean;
  solarMake?: string;
  solarModel?: string;

  // Inverter equipment
  inverterMake?: string;
  inverterModel?: string;
  inverterType?: 'grid-following' | 'grid-forming-following' | 'hybrid' | null;

  // Battery equipment
  batteryQuantity: number;
  batteryMake?: string;
  batteryModel?: string;
  batteryChargingSource: 'grid-only' | 'grid-or-renewable';

  // Backup power
  hasBackupPanel: boolean;
  backupOption?: 'Whole Home' | 'Partial Home' | 'None';
}

export interface ConfigurationChange {
  oldConfig: string | null;
  newConfig: string;
  removed: string[];
  added: string[];
  replaced: Array<{ old: string; new: string }>;
}

export class APSConfigurationManager {
  private currentConfig: string | null = null;
  private currentEquipment: EquipmentState | null = null;
  private configurationHistory: Array<{
    timestamp: Date;
    config: string;
    equipment: EquipmentState;
  }> = [];

  /**
   * Evaluate current equipment and determine APS configuration
   */
  evaluateConfiguration(equipment: EquipmentState): string {
    // Build switchboard inputs from equipment state
    const inputs = this.buildSwitchboardInputs(equipment);

    // Determine configuration
    const configId = APSConfigurationSwitchboard.determineConfiguration(inputs);

    // Store current state
    this.currentEquipment = equipment;

    // Add to history
    this.configurationHistory.push({
      timestamp: new Date(),
      config: configId,
      equipment: { ...equipment },
    });

    return configId;
  }

  /**
   * Build switchboard inputs from equipment state
   */
  private buildSwitchboardInputs(equipment: EquipmentState): SwitchboardInputs {
    // Check if utility has ESS support
    const utilitySupportsESS = UtilityConfigurationRegistry.hasESSSupport(equipment.utilityName);

    // Determine coupling type based on inverter
    const couplingType: 'AC' | 'DC' = equipment.inverterType === 'hybrid' ? 'DC' : 'AC';

    // Determine if this is standby only (battery with no solar, grid-only charging)
    const isStandbyOnly =
      !equipment.hasSolarPanels &&
      equipment.batteryChargingSource === 'grid-only';

    // Determine if backup power is required
    const requiresBackupPower = equipment.hasBackupPanel &&
      (equipment.backupOption === 'Whole Home' || equipment.backupOption === 'Partial Home');

    // Determine if peak shaving is supported (hybrid inverter only)
    const supportsPeakShaving = equipment.inverterType === 'hybrid';

    // Determine if multiple batteries (quantity > 1)
    const hasMultipleBatteries = equipment.batteryQuantity > 1;

    // Determine if system has batteries
    const hasBattery = equipment.batteryQuantity > 0;

    return {
      // Utility context
      utilityName: equipment.utilityName,
      utilityBOSCombination: equipment.utilityBOSCombination,
      utilitySupportsESS,
      utilityBOSRequirements: equipment.utilityBOSRequirements,

      // Equipment state
      hasBattery,
      isStandbyOnly,
      hasSolarPV: equipment.hasSolarPanels,
      batteryChargingSource: equipment.batteryChargingSource,
      couplingType,
      requiresBackupPower,
      supportsPeakShaving,
      hasMultipleBatteries,
    };
  }

  /**
   * Compare two configurations and determine what changed
   */
  compareConfigurations(oldConfig: string, newConfig: string): {
    removed: string[];
    added: string[];
    replaced: Array<{ old: string; new: string }>;
  } {
    const oldDetails = APSConfigurationSwitchboard.getConfigurationDetails(oldConfig);
    const newDetails = APSConfigurationSwitchboard.getConfigurationDetails(newConfig);

    const removed: string[] = [];
    const added: string[] = [];
    const replaced: Array<{ old: string; new: string }> = [];

    // Compare equipment sections
    const oldSections = oldDetails.equipmentSections;
    const newSections = newDetails.equipmentSections;

    // Check BOS types
    for (let i = 1; i <= 6; i++) {
      const typeKey = `type${i}` as keyof typeof oldSections.bos;
      if (oldSections.bos[typeKey] && !newSections.bos[typeKey]) {
        removed.push(`BOS Type ${i}`);
      } else if (!oldSections.bos[typeKey] && newSections.bos[typeKey]) {
        added.push(`BOS Type ${i}`);
      }
    }

    // Check equipment sections
    const sectionNames: Array<keyof typeof oldSections> = [
      'solar',
      'inverter',
      'battery1',
      'battery2',
      'batteryCombinerPanel',
      'backupLoadSubPanel',
      'gateway',
      'sms',
      'ess',
      'stringCombinerPanel',
    ];

    for (const section of sectionNames) {
      if (section === 'bos') continue; // Already handled

      const sectionValue = oldSections[section];
      const newSectionValue = newSections[section];

      if (typeof sectionValue === 'boolean' && typeof newSectionValue === 'boolean') {
        if (sectionValue && !newSectionValue) {
          removed.push(this.formatSectionName(section));
        } else if (!sectionValue && newSectionValue) {
          added.push(this.formatSectionName(section));
        }
      }
    }

    // Check for inverter type changes
    const oldReq = oldDetails.requiredEquipment;
    const newReq = newDetails.requiredEquipment;

    if (oldReq.hybridInverter > 0 && newReq.hybridInverter === 0) {
      if (newReq.gridFormingFollowingInverter > 0) {
        replaced.push({
          old: 'Hybrid Inverter',
          new: 'Grid Forming/Following Inverter',
        });
      } else if (newReq.gridFollowingInverter > 0) {
        replaced.push({
          old: 'Hybrid Inverter',
          new: 'Grid Following Inverter',
        });
      }
    } else if (oldReq.gridFormingFollowingInverter > 0 && newReq.gridFormingFollowingInverter === 0) {
      if (newReq.hybridInverter > 0) {
        replaced.push({
          old: 'Grid Forming/Following Inverter',
          new: 'Hybrid Inverter',
        });
      } else if (newReq.gridFollowingInverter > 0) {
        replaced.push({
          old: 'Grid Forming/Following Inverter',
          new: 'Grid Following Inverter',
        });
      }
    } else if (oldReq.gridFollowingInverter > 0 && newReq.gridFollowingInverter === 0) {
      if (newReq.hybridInverter > 0) {
        replaced.push({
          old: 'Grid Following Inverter',
          new: 'Hybrid Inverter',
        });
      } else if (newReq.gridFormingFollowingInverter > 0) {
        replaced.push({
          old: 'Grid Following Inverter',
          new: 'Grid Forming/Following Inverter',
        });
      }
    }

    // Check battery quantity changes
    if (oldReq.batteryQuantity !== newReq.batteryQuantity) {
      replaced.push({
        old: `${oldReq.batteryQuantity} Battery(ies)`,
        new: `${newReq.batteryQuantity} Battery(ies)`,
      });
    }

    return { removed, added, replaced };
  }

  /**
   * Format section name for display
   */
  private formatSectionName(section: string): string {
    const nameMap: Record<string, string> = {
      solar: 'Solar Panels',
      inverter: 'Inverter',
      battery1: 'Battery',
      battery2: 'Second Battery',
      batteryCombinerPanel: 'Battery Combiner Panel',
      backupLoadSubPanel: 'Backup Load Sub-Panel',
      gateway: 'Gateway',
      sms: 'SMS',
      ess: 'ESS Helper/Combiner Card',
      stringCombinerPanel: 'String Combiner Panel',
    };

    return nameMap[section] || section;
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): string | null {
    return this.currentConfig;
  }

  /**
   * Set current configuration
   */
  setCurrentConfig(config: string): void {
    this.currentConfig = config;
  }

  /**
   * Get configuration details for current config
   */
  getCurrentConfigDetails(): ConfigurationOutput | null {
    if (!this.currentConfig) return null;
    return APSConfigurationSwitchboard.getConfigurationDetails(this.currentConfig);
  }

  /**
   * Check if configuration has changed
   */
  hasConfigurationChanged(newConfig: string): boolean {
    return this.currentConfig !== null && this.currentConfig !== newConfig;
  }

  /**
   * Get configuration change details
   */
  getConfigurationChange(newConfig: string): ConfigurationChange | null {
    if (!this.currentConfig) return null;

    const changes = this.compareConfigurations(this.currentConfig, newConfig);

    return {
      oldConfig: this.currentConfig,
      newConfig,
      ...changes,
    };
  }

  /**
   * Reset configuration state
   */
  reset(): void {
    this.currentConfig = null;
    this.currentEquipment = null;
  }

  /**
   * Get configuration history
   */
  getHistory(): Array<{ timestamp: Date; config: string; equipment: EquipmentState }> {
    return [...this.configurationHistory];
  }

  /**
   * Extract equipment state from useEquipmentDetails hook return value
   */
  static extractEquipmentState(
    equipmentDetails: any,
    systemPrefix: 'sys1' | 'sys2' | 'sys3' | 'sys4',
    utilityRequirements?: {
      combination: string;
      bos_type_1?: string;
      bos_type_2?: string;
      bos_type_3?: string;
      bos_type_4?: string;
      bos_type_5?: string;
      bos_type_6?: string;
    }
  ): EquipmentState {
    return {
      currentSystem: systemPrefix,

      // Utility context
      utilityName: equipmentDetails.utility || 'APS',
      utilityBOSCombination: utilityRequirements?.combination || '',
      utilityBOSRequirements: utilityRequirements ? {
        bos1: utilityRequirements.bos_type_1,
        bos2: utilityRequirements.bos_type_2,
        bos3: utilityRequirements.bos_type_3,
        bos4: utilityRequirements.bos_type_4,
        bos5: utilityRequirements.bos_type_5,
        bos6: utilityRequirements.bos_type_6,
      } : undefined,

      // Solar
      hasSolarPanels: !!equipmentDetails.solarSection?.selectedMake,
      solarMake: equipmentDetails.solarSection?.selectedMake,
      solarModel: equipmentDetails.solarSection?.selectedModel,

      // Inverter
      inverterMake: equipmentDetails.inverterSection?.selectedMake,
      inverterModel: equipmentDetails.inverterSection?.selectedModel,
      inverterType: this.detectInverterType(equipmentDetails.inverterSection),

      // Battery
      batteryQuantity: parseInt(equipmentDetails.battery1Section?.quantity || '0'),
      batteryMake: equipmentDetails.battery1Section?.selectedMake,
      batteryModel: equipmentDetails.battery1Section?.selectedModel,
      batteryChargingSource: equipmentDetails.battery1Section?.chargingSource || 'grid-only',

      // Backup
      hasBackupPanel: !!equipmentDetails.backupSection,
      backupOption: equipmentDetails.backupChoice,
    };
  }

  /**
   * Detect inverter type from inverter section data using InverterTypeDetector
   */
  private static detectInverterType(inverterSection: any): 'grid-following' | 'grid-forming-following' | 'hybrid' | null {
    if (!inverterSection?.selectedMake || !inverterSection?.selectedModel) return null;

    // Use InverterTypeDetector for accurate detection
    // Note: This is synchronous pattern-based detection
    // For async API-based detection, use detectInverterTypeAsync in the hook
    const { InverterTypeDetector } = require('./InverterTypeDetection');
    return InverterTypeDetector.detectSync(
      inverterSection.selectedMake,
      inverterSection.selectedModel
    );
  }
}

// Export singleton instance
export const apsConfigurationManager = new APSConfigurationManager();
