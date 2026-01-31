// index.ts
// Main entry point for Universal Configuration System

// Export the orchestrator and singleton
export { UniversalConfigurationSwitchboard, universalSwitchboard } from './UniversalConfigurationSwitchboard';

// Export equipment state extractor
export { EquipmentStateExtractor, extractEquipmentForSystem, extractEquipmentForAllSystems } from './EquipmentStateExtractor';

// Export BOS auto-population service
export { BOSAutoPopulationService, autoPopulateBOS, validateRequiredEquipment } from './BOSAutoPopulationService';

// Export all types
export * from './types/ConfigurationTypes';

// Export individual configuration modules (if needed for direct access)
export { franklinAPSDetectors } from './configurations/FranklinAPSConfigs';
export { franklinSRPDetectors } from './configurations/FranklinSRPConfigs';
export { enphaseAPSDetectors } from './configurations/EnphaseAPSConfigs';
export { apsPVOnlyDetectors } from './configurations/APSPVOnlyConfigs';
export { apsDCCoupledDetectors } from './configurations/APSDCCoupledConfigs';
export { apsACCoupledDetectors } from './configurations/APSACCoupledConfigs';
export { apsGenericDetectors } from './configurations/APSGenericConfigs';
export { storzAPSDetectors } from './configurations/StorzAPSConfigs';
export { teslaPW3APSDetectors } from './configurations/TeslaPowerwall3APSConfigs';
