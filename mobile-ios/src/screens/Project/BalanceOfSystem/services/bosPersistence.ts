// src/screens/Project/BalanceOfSystem/services/bosPersistence.ts

import {
  fetchSystemDetails as _fetchSystemDetails,
  saveSystemDetails,
} from "../../../../api/systemDetails.service";
import Toast from "react-native-toast-message";

/** Last successfully-sent values per project (simple session dedupe). */
const lastSentByProject: Record<string, Record<string, any>> = Object.create(null);

/** Diff against the last-sent snapshot to avoid redundant saves */
function diffAgainstSnapshot(
  projectUuid: string,
  next: Record<string, any>
): Record<string, any> {
  const prev = lastSentByProject[projectUuid] || {};
  const changed: Record<string, any> = {};
  for (const [k, v] of Object.entries(next)) {
    if (prev[k] !== v) {
      changed[k] = v;
    }
  }
  return changed;
}

/** Merge into the session snapshot after a successful save */
function commitLastSent(projectUuid: string, applied: Record<string, any>) {
  if (!lastSentByProject[projectUuid]) {
    lastSentByProject[projectUuid] = {};
  }
  Object.assign(lastSentByProject[projectUuid], applied);
}

export const fetchSystemDetails = _fetchSystemDetails;

const toInt = (v: any) =>
  v === "" || v === undefined || v === null ? null : parseInt(String(v), 10);
const toBool = (v: any) => (v === null || v === undefined ? null : !!v);
const toText = (v: any) =>
  v === undefined ? null : v === "" ? null : String(v);

/**
 * Helper to create dynamic payloads with system prefix support
 * @param basePayload - Payload with sys1 field names
 * @param systemPrefix - System prefix (sys1_, sys2_, sys3_, sys4_)
 */
function createDynamicPayload(
  basePayload: Record<string, any>,
  systemPrefix: string = "sys1_"
): Record<string, any> {
  if (systemPrefix === "sys1_") return basePayload;

  const dynamicPayload: Record<string, any> = {};
  const sysNumber = systemPrefix.replace(/[^0-9]/g, ''); // Extract just the number

  for (const [key, value] of Object.entries(basePayload)) {
    // Replace bos_sys1_ with bos_sys2_, bos_sys3_, etc.
    const dynamicKey = key.replace(/sys1/, `sys${sysNumber}`);
    dynamicPayload[dynamicKey] = value;
  }

  return dynamicPayload;
}

/* ──────────────────────────────────────────────────────────────────────────
   BOS Type 1
   ------------------------------------------------------------------------- */
export async function saveBOSType1(
  projectUuid: string,
  args: {
    equipmentType?: string; // -> bos_sys1_type1_equipment_type
    make?: string; // -> bos_sys1_type1_make
    model?: string; // -> bos_sys1_type1_model
    ampRating?: string; // -> bos_sys1_type1_amp_rating
    isNew?: boolean; // -> bos_sys1_type1_is_new
    active?: boolean; // -> bos_sys1_type1_active (whether this type is being used)
  },
  systemPrefix: string = "sys1_"
) {
  if (!projectUuid) throw new Error("Missing projectUuid");

  const basePayload: Record<string, any> = {};
  if (args.equipmentType !== undefined)
    basePayload.bos_sys1_type1_equipment_type = toText(args.equipmentType);
  if (args.make !== undefined)
    basePayload.bos_sys1_type1_make = toText(args.make);
  if (args.model !== undefined)
    basePayload.bos_sys1_type1_model = toText(args.model);
  if (args.ampRating !== undefined)
    basePayload.bos_sys1_type1_amp_rating = toText(args.ampRating);
  if (args.isNew !== undefined)
    basePayload.bos_sys1_type1_is_new = toBool(args.isNew);
  if (args.active !== undefined)
    basePayload.bos_sys1_type1_active = toBool(args.active);

  // Apply systemPrefix to create dynamic payload
  const payload = createDynamicPayload(basePayload, systemPrefix);

  // Check if there are actually changes to send
  const toSend = diffAgainstSnapshot(projectUuid, payload);
  if (Object.keys(toSend).length === 0) {
    console.log(`[saveBOSType1 ${systemPrefix}] No changes to send - skipped`);
    return { data: { success: true, skipped: true }, status: 204 } as any;
  }

  try {
    const result = await saveSystemDetails(projectUuid, toSend);
    commitLastSent(projectUuid, toSend);

    // Show success toast (less frequent)
    const sysNumber = systemPrefix.replace(/[^0-9]/g, '');
    Toast.show({
      text1: `System ${sysNumber} BOS Type 1 Saved`,
      type: "success",
      position: "top",
      visibilityTime: 1000, // Shorter duration
    });

    return result;
  } catch (error: any) {
    console.error(`[saveBOSType1 ${systemPrefix}] Error:`, error?.message || error);
    Toast.show({
      text1: "Save Failed",
      text2: "BOS Type 1 could not be saved",
      type: "error",
      position: "top",
    });
    throw error;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   BOS Type 2
   ------------------------------------------------------------------------- */
export async function saveBOSType2(
  projectUuid: string,
  args: {
    equipmentType?: string; // -> bos_sys1_type2_equipment_type
    make?: string; // -> bos_sys1_type2_make
    model?: string; // -> bos_sys1_type2_model
    ampRating?: string; // -> bos_sys1_type2_amp_rating
    isNew?: boolean; // -> bos_sys1_type2_is_new
    active?: boolean; // -> bos_sys1_type2_active
  },
  systemPrefix: string = "sys1_"
) {
  if (!projectUuid) throw new Error("Missing projectUuid");

  const basePayload: Record<string, any> = {};
  if (args.equipmentType !== undefined)
    basePayload.bos_sys1_type2_equipment_type = toText(args.equipmentType);
  if (args.make !== undefined)
    basePayload.bos_sys1_type2_make = toText(args.make);
  if (args.model !== undefined)
    basePayload.bos_sys1_type2_model = toText(args.model);
  if (args.ampRating !== undefined)
    basePayload.bos_sys1_type2_amp_rating = toText(args.ampRating);
  if (args.isNew !== undefined)
    basePayload.bos_sys1_type2_is_new = toBool(args.isNew);
  if (args.active !== undefined)
    basePayload.bos_sys1_type2_active = toBool(args.active);

  const payload = createDynamicPayload(basePayload, systemPrefix);

  const toSend = diffAgainstSnapshot(projectUuid, payload);
  if (Object.keys(toSend).length === 0) {
    console.log(`[saveBOSType2 ${systemPrefix}] No changes to send - skipped`);
    return { data: { success: true, skipped: true }, status: 204 } as any;
  }

  try {
    const result = await saveSystemDetails(projectUuid, toSend);
    commitLastSent(projectUuid, toSend);

    const sysNumber = systemPrefix.replace(/[^0-9]/g, '');
    Toast.show({
      text1: `System ${sysNumber} BOS Type 2 Saved`,
      type: "success",
      position: "top",
      visibilityTime: 1000,
    });

    return result;
  } catch (error: any) {
    console.error(`[saveBOSType2 ${systemPrefix}] Error:`, error?.message || error);
    Toast.show({
      text1: "Save Failed",
      text2: "BOS Type 2 could not be saved",
      type: "error",
      position: "top",
    });
    throw error;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   BOS Type 3
   ------------------------------------------------------------------------- */
export async function saveBOSType3(
  projectUuid: string,
  args: {
    equipmentType?: string; // -> bos_sys1_type3_equipment_type
    make?: string; // -> bos_sys1_type3_make
    model?: string; // -> bos_sys1_type3_model
    ampRating?: string; // -> bos_sys1_type3_amp_rating
    isNew?: boolean; // -> bos_sys1_type3_is_new
    active?: boolean; // -> bos_sys1_type3_active
  },
  systemPrefix: string = "sys1_"
) {
  if (!projectUuid) throw new Error("Missing projectUuid");

  const basePayload: Record<string, any> = {};
  if (args.equipmentType !== undefined)
    basePayload.bos_sys1_type3_equipment_type = toText(args.equipmentType);
  if (args.make !== undefined)
    basePayload.bos_sys1_type3_make = toText(args.make);
  if (args.model !== undefined)
    basePayload.bos_sys1_type3_model = toText(args.model);
  if (args.ampRating !== undefined)
    basePayload.bos_sys1_type3_amp_rating = toText(args.ampRating);
  if (args.isNew !== undefined)
    basePayload.bos_sys1_type3_is_new = toBool(args.isNew);
  if (args.active !== undefined)
    basePayload.bos_sys1_type3_active = toBool(args.active);

  const payload = createDynamicPayload(basePayload, systemPrefix);

  const toSend = diffAgainstSnapshot(projectUuid, payload);
  if (Object.keys(toSend).length === 0) {
    console.log(`[saveBOSType3 ${systemPrefix}] No changes to send - skipped`);
    return { data: { success: true, skipped: true }, status: 204 } as any;
  }

  try {
    const result = await saveSystemDetails(projectUuid, toSend);
    commitLastSent(projectUuid, toSend);

    const sysNumber = systemPrefix.replace(/[^0-9]/g, '');
    Toast.show({
      text1: `System ${sysNumber} BOS Type 3 Saved`,
      type: "success",
      position: "top",
      visibilityTime: 1000,
    });

    return result;
  } catch (error: any) {
    console.error(`[saveBOSType3 ${systemPrefix}] Error:`, error?.message || error);
    Toast.show({
      text1: "Save Failed",
      text2: "BOS Type 3 could not be saved",
      type: "error",
      position: "top",
    });
    throw error;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   BOS Visibility State (which types are shown/active)
   ------------------------------------------------------------------------- */
export async function saveBOSVisibility(
  projectUuid: string,
  args: {
    showType1?: boolean; // -> bos_sys1_show_type1
    showType2?: boolean; // -> bos_sys1_show_type2
    showType3?: boolean; // -> bos_sys1_show_type3
  },
  systemPrefix: string = "sys1_"
) {
  if (!projectUuid) throw new Error("Missing projectUuid");

  const basePayload: Record<string, any> = {};
  if (args.showType1 !== undefined)
    basePayload.bos_sys1_show_type1 = toBool(args.showType1);
  if (args.showType2 !== undefined)
    basePayload.bos_sys1_show_type2 = toBool(args.showType2);
  if (args.showType3 !== undefined)
    basePayload.bos_sys1_show_type3 = toBool(args.showType3);

  const payload = createDynamicPayload(basePayload, systemPrefix);

  const toSend = diffAgainstSnapshot(projectUuid, payload);
  if (Object.keys(toSend).length === 0) {
    console.log(`[saveBOSVisibility ${systemPrefix}] No changes to send - skipped`);
    return { data: { success: true, skipped: true }, status: 204 } as any;
  }

  try {
    const result = await saveSystemDetails(projectUuid, toSend);
    commitLastSent(projectUuid, toSend);

    // No toast for visibility changes (too frequent)
    console.log(`[saveBOSVisibility ${systemPrefix}] Visibility state saved`);

    return result;
  } catch (error: any) {
    console.error(`[saveBOSVisibility ${systemPrefix}] Error:`, error?.message || error);
    // Only show error toast for actual failures
    Toast.show({
      text1: "Save Failed",
      text2: "Visibility state could not be saved",
      type: "error",
      position: "top",
    });
    throw error;
  }
}