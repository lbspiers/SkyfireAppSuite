// Barrel exports for hooks
export { useUserProfile } from './useUserProfile';
export { useProjects } from './useProjects';
export { useProject } from './useProject';
export { useLocationData } from './useLocationData';
export { useSystemDetails } from './useSystemDetails';
export { useEquipmentData } from './useEquipmentData';
export { useEquipmentForm } from './useEquipmentForm';
export { useBatteryForm } from './useBatteryForm';
export { useSMSForm } from './useSMSForm';
export { default as useBOSData } from './useBOSData';
export { useSectionDelete, DELETE_BEHAVIOR } from './useSectionDelete';

// Re-export types
export type { SystemNumber, EquipmentCategory } from './useEquipmentForm';
