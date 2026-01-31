/**
 * AC-Integrated Solar Panel Handler
 *
 * Handles automatic microinverter selection and quantity syncing for AC-integrated solar panels.
 * This file is isolated to prevent the behavior from being overwritten by other state management.
 */

import { saveSystemDetailsPartialExact } from '../screens/Project/SystemDetails/services/equipmentService';
import { AC_INTEGRATED_PANELS } from './constants';

export interface ACIntegratedPanelInfo {
  isAcIntegrated: boolean;
  integratedMicroMake?: string;
  integratedMicroModel?: string;
}

/**
 * Detects if a solar panel model is AC-integrated and returns the corresponding microinverter info
 */
export function detectACIntegratedPanel(panelModel: string): ACIntegratedPanelInfo {
  if (!panelModel) {
    return { isAcIntegrated: false };
  }

  const entry = AC_INTEGRATED_PANELS.find(p => p.panel === panelModel);

  if (entry) {
    console.log('[ACIntegrated] Detected AC-integrated panel:', {
      panel: panelModel,
      microinverter: entry.microinverter
    });

    return {
      isAcIntegrated: true,
      integratedMicroMake: entry.microinverter.split(' ').slice(0, -1).join(' '), // Everything except last word
      integratedMicroModel: entry.microinverter.split(' ').slice(-1)[0], // Last word is model
    };
  }

  return { isAcIntegrated: false };
}

/**
 * Auto-populates microinverter data when AC-integrated panel is selected
 */
export async function handleACIntegratedPanelSelection(
  projectID: string,
  systemPrefix: string,
  panelQuantity: number | string,
  acIntegratedInfo: ACIntegratedPanelInfo,
  currentSystemType: string
): Promise<void> {
  if (!acIntegratedInfo.isAcIntegrated) {
    return;
  }

  const quantity = typeof panelQuantity === 'string' ? parseInt(panelQuantity, 10) : panelQuantity;

  if (!quantity || quantity === 0) {
    console.log('[ACIntegrated] No panel quantity set - skipping auto-population');
    return;
  }

  const prefix = systemPrefix.replace('_', '');

  console.log('[ACIntegrated] Auto-populating microinverter:', {
    systemPrefix: prefix,
    make: acIntegratedInfo.integratedMicroMake,
    model: acIntegratedInfo.integratedMicroModel,
    quantity,
    currentSystemType
  });

  // Step 1: Set system type to microinverter if not already set
  if (currentSystemType !== 'microinverter') {
    console.log('[ACIntegrated] Setting system type to microinverter');
    await saveSystemDetailsPartialExact(projectID, {
      [`${prefix}_selectedsystem`]: 'microinverter',
    });
  }

  // Step 2: Populate microinverter data
  console.log('[ACIntegrated] Saving microinverter data to database');
  await saveSystemDetailsPartialExact(projectID, {
    [`${prefix}_micro_inverter_make`]: acIntegratedInfo.integratedMicroMake,
    [`${prefix}_micro_inverter_model`]: acIntegratedInfo.integratedMicroModel,
    [`${prefix}_micro_inverter_qty`]: quantity,
    [`${prefix}_microinverter_existing`]: false,
  });

  console.log('[ACIntegrated] Auto-population complete');
}

/**
 * Syncs microinverter quantity with panel quantity for AC-integrated panels
 */
export async function syncMicroinverterQuantity(
  projectID: string,
  systemPrefix: string,
  panelQuantity: number | string,
  isAcIntegrated: boolean
): Promise<void> {
  if (!isAcIntegrated) {
    return;
  }

  const quantity = typeof panelQuantity === 'string' ? parseInt(panelQuantity, 10) : panelQuantity;
  const prefix = systemPrefix.replace('_', '');

  console.log('[ACIntegrated] Syncing microinverter quantity:', {
    systemPrefix: prefix,
    panelQuantity: quantity
  });

  await saveSystemDetailsPartialExact(projectID, {
    [`${prefix}_micro_inverter_qty`]: quantity || 0,
  });
}
