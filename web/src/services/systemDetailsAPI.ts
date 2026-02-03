// src/services/systemDetailsAPI.ts

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';

// ============================================
// Utility Functions
// ============================================

/**
 * Remove only `undefined` values; keep null/empty so we can clear DB columns.
 * This is critical - sending null clears a field, undefined is ignored.
 */
function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
}

/**
 * Remove both undefined AND null values (for saves where we don't want to clear fields)
 */
function pruneNullish<T extends Record<string, any>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null);
  return Object.fromEntries(entries) as T;
}

// ============================================
// Core System Details API
// ============================================

/**
 * Fetch the system details row for a project.
 * Returns the row object or null if none exists (404).
 *
 * @param projectUuid - Project UUID
 * @param signal - Optional AbortSignal to cancel the request
 * @returns System details object or null if not found
 */
export async function fetchSystemDetails(
  projectUuid: string,
  signal?: AbortSignal
): Promise<Record<string, any> | null> {
  try {
    const path = apiEndpoints.PROJECT?.SYSTEM_DETAILS?.GET(projectUuid)
      ?? `/project/${projectUuid}/system-details`;

    console.debug('[systemDetailsAPI] GET', path);
    const resp = await axiosInstance.get(path, { signal });

    if (resp.status === 200 && (resp.data?.success || resp.data?.status === 'SUCCESS')) {
      const data = resp.data.data;
      const keyCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
      console.debug(`[systemDetailsAPI] fetchSystemDetails → ${keyCount} keys`);
      return data;
    }

    throw new Error(`Unexpected fetchSystemDetails response: ${JSON.stringify(resp.data)}`);
  } catch (err: any) {
    // 404 is normal - new projects don't have system details yet
    if (err?.response?.status === 404) {
      console.debug('[systemDetailsAPI] fetchSystemDetails → 404 (no data yet)');
      return null;
    }
    console.error('[systemDetailsAPI] fetchSystemDetails error:', err?.response?.status, err?.message);
    throw err;
  }
}

/**
 * Fetch system details, returning null on 404 (safe wrapper)
 */
export async function fetchSystemDetailsSafe(
  projectUuid: string
): Promise<Record<string, any> | null> {
  try {
    return await fetchSystemDetails(projectUuid);
  } catch (err) {
    console.warn('[systemDetailsAPI] fetchSystemDetailsSafe error:', err);
    return null;
  }
}

/**
 * Upsert (create/update) system details for a project (PUT).
 * Use this for full updates where you want to ensure all fields are set.
 *
 * @param projectUuid - Project UUID
 * @param payload - Fields to save (undefined values are pruned)
 * @returns Updated system details
 */
export async function saveSystemDetails(
  projectUuid: string,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const path = apiEndpoints.PROJECT?.SYSTEM_DETAILS?.UPSERT(projectUuid)
    ?? `/project/${projectUuid}/system-details`;

  const body = pruneUndefined(payload);
  const fieldCount = Object.keys(body).length;

  console.debug(`[systemDetailsAPI] PUT ${path} (${fieldCount} fields)`);

  const resp = await axiosInstance.put(path, body);

  if (resp.status === 200 && (resp.data?.success || resp.data?.status === 'SUCCESS')) {
    return resp.data.data;
  }

  throw new Error(`Unexpected saveSystemDetails response: ${JSON.stringify(resp.data)}`);
}

/**
 * Partial update (PATCH) - preferred for single-field updates.
 *
 * @param projectUuid - Project UUID
 * @param payload - Fields to update (undefined values are pruned, null clears field)
 * @returns Updated system details
 */
export async function patchSystemDetails(
  projectUuid: string,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const path = apiEndpoints.PROJECT?.SYSTEM_DETAILS?.UPSERT(projectUuid)
    ?? `/project/${projectUuid}/system-details`;

  const body = pruneUndefined(payload);
  const fieldCount = Object.keys(body).length;

  console.debug(`[systemDetailsAPI] PATCH ${path} (${fieldCount} fields)`);

  const resp = await axiosInstance.patch(path, body);

  if (resp.status === 200 && (resp.data?.success || resp.data?.status === 'SUCCESS')) {
    return resp.data.data;
  }

  throw new Error(`Unexpected patchSystemDetails response: ${JSON.stringify(resp.data)}`);
}

/**
 * Save partial fields, stripping null values (use when you DON'T want to clear fields)
 */
export async function saveSystemDetailsPartial(
  projectUuid: string,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const body = pruneNullish(payload);
  return patchSystemDetails(projectUuid, body);
}

/**
 * Save partial fields, keeping null values (use when you WANT to clear fields)
 */
export async function saveSystemDetailsPartialExact(
  projectUuid: string,
  payload: Record<string, any>
): Promise<Record<string, any>> {
  return patchSystemDetails(projectUuid, payload);
}

// ============================================
// Field-Specific Fetchers (Optimized)
// ============================================

/**
 * Fetch only the fields needed for a specific system (1-4)
 */
export async function fetchSystemEquipmentFields(
  projectUuid: string,
  systemNumber: 1 | 2 | 3 | 4
): Promise<Record<string, any> | null> {
  const prefix = `sys${systemNumber}_`;

  const systemFields = [
    // Solar Panel
    `${prefix}solar_panel_qty`,
    `${prefix}solar_panel_make`,
    `${prefix}solar_panel_model`,
    `${prefix}solar_panel_existing`,
    `${prefix}batteryonly`,
    `${prefix}show_second_panel_type`,
    // Solar Panel Type 2
    `${prefix}solar_panel_type2_quantity`,
    `${prefix}solar_panel_type2_manufacturer`,
    `${prefix}solar_panel_type2_model`,
    `${prefix}solar_panel_type2_is_new`,
    // Microinverter
    `${prefix}micro_inverter_make`,
    `${prefix}micro_inverter_model`,
    `${prefix}micro_inverter_qty`,
    `${prefix}micro_inverter_existing`,
    `${prefix}inverter_type`,
    // Optimizer
    `${prefix}optimizer_make`,
    `${prefix}optimizer_model`,
    `${prefix}optimizer_qty`,
    `${prefix}optimizer_existing`,
    // String Combiner Panel
    `${prefix}combiner_panel_make`,
    `${prefix}combiner_panel_model`,
    `${prefix}combiner_existing`,
    `${prefix}combinerpanel_bus_rating`,
    `${prefix}combinerpanel_main_breaker_rating`,
    // Battery Type 1
    `${prefix}battery_1_make`,
    `${prefix}battery_1_model`,
    `${prefix}battery_1_qty`,
    `${prefix}battery1_existing`,
    `${prefix}battery1_tie_in_location`,
    // Battery Type 2
    `${prefix}battery_2_make`,
    `${prefix}battery_2_model`,
    `${prefix}battery_2_qty`,
    `${prefix}battery2_existing`,
    `${prefix}battery2_tie_in_location`,
    // Battery Config
    `${prefix}battery_configuration`,
    `${prefix}combination_method`,
    // ESS Combiner
    `${prefix}ess_make`,
    `${prefix}ess_model`,
    `${prefix}ess_existing`,
    `${prefix}ess_main_breaker_rating`,
    `${prefix}ess_upstream_breaker_rating`,
    `${prefix}ess_upstream_breaker_location`,
    // SMS
    `${prefix}sms_make`,
    `${prefix}sms_model`,
    `${prefix}sms_existing`,
    `${prefix}sms_equipment_type`,
    `${prefix}sms_breaker_rating`,
    `${prefix}sms_rsd_enabled`,
    `${prefix}no_sms`,
    // Tesla/Gateway
    `${prefix}teslagatewaytype`,
    `${prefix}tesla_extensions`,
    `${prefix}backupswitch_location`,
    // Stringing
    `${prefix}stringing_type`,
    `${prefix}inverter_stringing_configuration`,
    `${prefix}branch_string_1`,
    `${prefix}branch_string_2`,
    `${prefix}branch_string_3`,
    `${prefix}branch_string_4`,
    `${prefix}branch_string_5`,
    `${prefix}branch_string_6`,
    `${prefix}branch_string_7`,
    `${prefix}branch_string_8`,
    // Other
    `${prefix}backup_option`,
    `${prefix}pcs_settings`,
    `${prefix}isacintegrated`,
  ];

  try {
    const path = `/project/${projectUuid}/system-details?fields=${systemFields.join(',')}`;
    const resp = await axiosInstance.get(path);

    if (resp.status === 200 && resp.data?.data) {
      return resp.data.data;
    }
    return null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.warn(`[systemDetailsAPI] fetchSystemEquipmentFields(${systemNumber}) error:`, err?.message);
    return null;
  }
}

/**
 * Fetch electrical configuration fields
 */
export async function fetchElectricalFields(
  projectUuid: string
): Promise<Record<string, any> | null> {
  const electricalFields = [
    // Service Entrance
    'ele_ses_type',
    'ele_main_circuit_breakers_qty',
    'ele_bus_bar_rating',
    'ele_main_circuit_breaker_rating',
    'ele_feeder_location_on_bus_bar',
    'ele_main_panel_upgrade',
    'ele_method_of_interconnection',
    'ele_breaker_location',
    'ele_utility_meter_behind_fence',
    // Main Panel A
    'mpa_bus_bar_existing',
    'mpa_main_circuit_breaker_existing',
    'mpa_mainpanela_acunit_amps',
    'mpa_mainpanela_furnace_amps',
    // Sub Panel B
    'spb_subpanel_existing',
    'spb_bus_bar_rating',
    'spb_main_breaker_rating',
    'spb_upstream_breaker_rating',
    'spb_sub_panel_make',
    'spb_sub_panel_model',
    'spb_subpanelb_mcbexisting',
    // POI
    'el_poi_breaker_rating',
    'el_poi_disconnect_rating',
    // Utility
    'utility_service_amps',
    'allowable_backfeed',
  ];

  try {
    const path = `/project/${projectUuid}/system-details?fields=${electricalFields.join(',')}`;
    const resp = await axiosInstance.get(path);

    if (resp.status === 200 && resp.data?.data) {
      return resp.data.data;
    }
    return null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.warn('[systemDetailsAPI] fetchElectricalFields error:', err?.message);
    return null;
  }
}

/**
 * Fetch structural/mounting fields
 */
export async function fetchStructuralFields(
  projectUuid: string
): Promise<Record<string, any> | null> {
  const structuralFields: string[] = [];

  // Roof type A/B
  ['rta_', 'rtb_'].forEach(prefix => {
    structuralFields.push(
      `${prefix}roofing_material`,
      `${prefix}framing_size`,
      `${prefix}framing_spacing`,
      `${prefix}rail_make`,
      `${prefix}rail_model`,
      `${prefix}attachment_make`,
      `${prefix}attachment_model`
    );
  });

  // Mounting planes 1-10
  for (let i = 1; i <= 10; i++) {
    const prefix = `mp${i}_`;
    structuralFields.push(
      `${prefix}roof_type`,
      `${prefix}stories`,
      `${prefix}pitch`,
      `${prefix}azimuth`,
      `${prefix}tilt_mount_azimuth`,
      `${prefix}tilt_mount_pitch`
    );
  }

  // Additional structural fields
  structuralFields.push(
    'roof_sq_ft',
    'roof_a_panel_count',
    'roof_b_panel_count',
    'house_sqft',
    'st_roof_a_area_sqft',
    'st_roof_b_area_sqft',
    'st_roof_a_framing_type',
    'st_roof_b_framing_type'
  );

  try {
    const path = `/project/${projectUuid}/system-details?fields=${structuralFields.join(',')}`;
    const resp = await axiosInstance.get(path);

    if (resp.status === 200 && resp.data?.data) {
      return resp.data.data;
    }
    return null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.warn('[systemDetailsAPI] fetchStructuralFields error:', err?.message);
    return null;
  }
}

/**
 * Fetch BOS (Balance of System) fields for a system
 */
export async function fetchBOSFields(
  projectUuid: string,
  systemNumber: 1 | 2 | 3 | 4
): Promise<Record<string, any> | null> {
  const prefix = `bos_sys${systemNumber}_`;
  const bosFields: string[] = [];

  // BOS types 1-6
  for (let i = 1; i <= 6; i++) {
    bosFields.push(
      `${prefix}type${i}_equipment_type`,
      `${prefix}type${i}_make`,
      `${prefix}type${i}_model`,
      `${prefix}type${i}_amp_rating`,
      `${prefix}type${i}_is_new`,
      `${prefix}type${i}_block_name`
    );
  }

  // Battery BOS types
  ['battery1_', 'battery2_', 'backup_'].forEach(batteryPrefix => {
    for (let i = 1; i <= 3; i++) {
      bosFields.push(
        `${prefix}${batteryPrefix}type${i}_equipment_type`,
        `${prefix}${batteryPrefix}type${i}_make`,
        `${prefix}${batteryPrefix}type${i}_model`,
        `${prefix}${batteryPrefix}type${i}_amp_rating`,
        `${prefix}${batteryPrefix}type${i}_is_new`,
        `${prefix}${batteryPrefix}type${i}_block_name`
      );
    }
  });

  // Post-SMS BOS
  for (let i = 1; i <= 3; i++) {
    bosFields.push(
      `post_sms_${prefix}type${i}_block_name`
    );
  }

  // Slot tracking
  bosFields.push(`${prefix}lastslot`);

  try {
    const path = `/project/${projectUuid}/system-details?fields=${bosFields.join(',')}`;
    const resp = await axiosInstance.get(path);

    if (resp.status === 200 && resp.data?.data) {
      return resp.data.data;
    }
    return null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.warn(`[systemDetailsAPI] fetchBOSFields(${systemNumber}) error:`, err?.message);
    return null;
  }
}

/**
 * Fetch backup load sub-panel fields
 */
export async function fetchBackupLoadFields(
  projectUuid: string
): Promise<Record<string, any> | null> {
  const backupFields: string[] = [];

  // BLS1 (Backup Load Sub-panel 1)
  backupFields.push(
    'bls1_backuploader_existing',
    'bls1_backuploader_bus_bar_rating',
    'bls1_backuploader_main_breaker_rating',
    'bls1_backuploader_upstream_breaker_rating',
    'bls1_backup_load_sub_panel_make',
    'bls1_backup_load_sub_panel_model',
    'bsp_backup_feeder_location',
    'bsp_backupload_mcbexisting'
  );

  // BLS1 load types 1-20
  for (let i = 1; i <= 20; i++) {
    backupFields.push(
      `bls1_load_type_${i}`,
      `bls1_breaker_rating_${i}`
    );
  }

  // BLS2 (Battery Combiner Panel)
  backupFields.push(
    'bls2_backuploader_existing',
    'bls2_bus_bar_rating',
    'bls2_main_breaker_rating',
    'bls2_upstream_breaker_rating',
    'bls2_battery_combiner_panel_make',
    'bls2_battery_combiner_panel_model'
  );

  try {
    const path = `/project/${projectUuid}/system-details?fields=${backupFields.join(',')}`;
    const resp = await axiosInstance.get(path);

    if (resp.status === 200 && resp.data?.data) {
      return resp.data.data;
    }
    return null;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.warn('[systemDetailsAPI] fetchBackupLoadFields error:', err?.message);
    return null;
  }
}

// ============================================
// Batch Field Operations
// ============================================

/**
 * Clear all fields for a specific equipment type in a system
 * Use this when removing equipment (e.g., removing Battery Type 2)
 */
export async function clearEquipmentFields(
  projectUuid: string,
  systemNumber: 1 | 2 | 3 | 4,
  equipmentType: 'solar_panel' | 'battery_1' | 'battery_2' | 'micro_inverter' | 'optimizer' | 'ess' | 'sms'
): Promise<void> {
  const prefix = `sys${systemNumber}_`;
  const clearPayload: Record<string, null> = {};

  const fieldMappings: Record<string, string[]> = {
    solar_panel: [
      'solar_panel_qty', 'solar_panel_make', 'solar_panel_model', 'solar_panel_existing'
    ],
    battery_1: [
      'battery_1_qty', 'battery_1_make', 'battery_1_model', 'battery1_existing', 'battery1_tie_in_location'
    ],
    battery_2: [
      'battery_2_qty', 'battery_2_make', 'battery_2_model', 'battery2_existing', 'battery2_tie_in_location'
    ],
    micro_inverter: [
      'micro_inverter_make', 'micro_inverter_model', 'micro_inverter_qty', 'micro_inverter_existing'
    ],
    optimizer: [
      'optimizer_make', 'optimizer_model', 'optimizer_qty', 'optimizer_existing'
    ],
    ess: [
      'ess_make', 'ess_model', 'ess_existing', 'ess_main_breaker_rating',
      'ess_upstream_breaker_rating', 'ess_upstream_breaker_location'
    ],
    sms: [
      'sms_make', 'sms_model', 'sms_existing', 'sms_breaker_rating', 'sms_rsd_enabled'
    ],
  };

  const fields = fieldMappings[equipmentType] || [];
  fields.forEach(field => {
    clearPayload[`${prefix}${field}`] = null;
  });

  if (Object.keys(clearPayload).length > 0) {
    await saveSystemDetailsPartialExact(projectUuid, clearPayload);
  }
}

// ============================================
// Type Definitions
// ============================================

export type SystemNumber = 1 | 2 | 3 | 4;
export type SystemPrefix = 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';

export const SYSTEM_PREFIXES: Record<SystemNumber, SystemPrefix> = {
  1: 'sys1_',
  2: 'sys2_',
  3: 'sys3_',
  4: 'sys4_',
};

/**
 * Get the field prefix for a system number
 */
export function getSystemPrefix(systemNumber: SystemNumber): SystemPrefix {
  return SYSTEM_PREFIXES[systemNumber];
}

/**
 * Build a prefixed field name
 */
export function buildFieldName(systemNumber: SystemNumber, fieldName: string): string {
  return `${SYSTEM_PREFIXES[systemNumber]}${fieldName}`;
}
