import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

type RootState = any;

// Memoized selectors
const selectProfile = (state: RootState) => state?.profile?.profile;
const selectProject = (state: RootState) => state?.project?.currentProject;
const selectUpdateProjectDetails = (state: RootState) => state?.project?.updateProjectDetails;
const selectInstallerId = (state: RootState) => 
  state?.project?.projectDetails?.data?.details?.installer_project_id;

// Create a memoized selector for system details with fallback chain
const createSystemDetailsSelector = () => createSelector(
  [
    (state: RootState) => state.project?.systemDetails?.data,
    (state: RootState) => state.project?.projectDetails?.data?.system_details,
    (state: RootState) => state.project?.updateProjectDetails?.system_details,
    (state: RootState) => state.project?.currentProject?.system_details,
  ],
  (systemDetails, projectDetails, updateDetails, currentDetails) => 
    systemDetails ?? projectDetails ?? updateDetails ?? currentDetails ?? {}
);

// Memoized selector for equipment sets grouped by label
const createEquipmentSetGroupSelector = () => createSelector(
  [selectUpdateProjectDetails],
  (updateProjectDetails) => {
    if (!updateProjectDetails?.equipment_sets) return {};
    return updateProjectDetails.equipment_sets.reduce(
      (acc: any, equipmentSet: any) => {
        acc[equipmentSet?.label] = equipmentSet;
        return acc;
      },
      {}
    );
  }
);

/**
 * Custom hook to manage Equipment component state
 * Centralizes all Redux selectors with proper memoization
 */
export const useEquipmentState = () => {
  // Create selector instances
  const systemDetailsSelector = useMemo(() => createSystemDetailsSelector(), []);
  const equipmentSetGroupSelector = useMemo(() => createEquipmentSetGroupSelector(), []);

  // Use selectors with shallowEqual for object comparisons
  const profile = useSelector(selectProfile, shallowEqual);
  const project = useSelector(selectProject, shallowEqual);
  const updateProjectDetails = useSelector(selectUpdateProjectDetails, shallowEqual);
  const installerId = useSelector(selectInstallerId);
  const systemDetailsFromStore = useSelector(systemDetailsSelector, shallowEqual);
  const equipmentSetGroup = useSelector(equipmentSetGroupSelector, shallowEqual);

  const user = profile?.user;
  const company = profile?.company;

  return {
    profile,
    project,
    updateProjectDetails,
    installerId,
    systemDetailsFromStore,
    equipmentSetGroup,
    user,
    company,
    projectUuid: project?.uuid,
    companyUuid: company?.uuid,
  };
};