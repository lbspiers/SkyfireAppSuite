import {
  fetchSystemDetails as _fetchSystemDetails,
  saveSystemDetails,
} from "../../../../api/systemDetails.service";
import Toast from "react-native-toast-message";

export const fetchSystemDetails = _fetchSystemDetails;

const toInt = (v: any) =>
  v === "" || v === undefined || v === null ? null : parseInt(String(v), 10);
const toText = (v: any) =>
  v === undefined ? null : v === "" ? null : String(v);

/* ──────────────────────────────────────────────────────────────────────────
   Mounting Hardware (A)  → rta_* columns
   ------------------------------------------------------------------------- */
export async function saveMountingHardwareA(
  projectUuid: string,
  args: {
    railMake?: string; // -> rta_rail_make
    railModel?: string; // -> rta_rail_model
    attachMake?: string; // -> rta_attachment_make
    attachModel?: string; // -> rta_attachment_model
  }
) {
  const payload: Record<string, any> = {};
  if (args.railMake !== undefined)
    payload.rta_rail_make = toText(args.railMake);
  if (args.railModel !== undefined)
    payload.rta_rail_model = toText(args.railModel);
  if (args.attachMake !== undefined)
    payload.rta_attachment_make = toText(args.attachMake);
  if (args.attachModel !== undefined)
    payload.rta_attachment_model = toText(args.attachModel);
  
  const result = await saveSystemDetails(projectUuid, payload);
  
  // Show success toast
  Toast.show({
    text1: "Data Saved",
    type: "success",
    position: "top",
    visibilityTime: 1500,
  });
  
  return result;
}

/* ──────────────────────────────────────────────────────────────────────────
   Mounting Hardware (B)  → rtb_* columns
   ------------------------------------------------------------------------- */
export async function saveMountingHardwareB(
  projectUuid: string,
  args: {
    railMake?: string; // -> rtb_rail_make
    railModel?: string; // -> rtb_rail_model
    attachMake?: string; // -> rtb_attachment_make
    attachModel?: string; // -> rtb_attachment_model
  }
) {
  const payload: Record<string, any> = {};
  if (args.railMake !== undefined)
    payload.rtb_rail_make = toText(args.railMake);
  if (args.railModel !== undefined)
    payload.rtb_rail_model = toText(args.railModel);
  if (args.attachMake !== undefined)
    payload.rtb_attachment_make = toText(args.attachMake);
  if (args.attachModel !== undefined)
    payload.rtb_attachment_model = toText(args.attachModel);
  
  const result = await saveSystemDetails(projectUuid, payload);
  
  // Show success toast
  Toast.show({
    text1: "Data Saved",
    type: "success",
    position: "top",
    visibilityTime: 1500,
  });
  
  return result;
}

/* ──────────────────────────────────────────────────────────────────────────
   Roofing (A)  → rta_* + st_roof_a_* columns
   NOTE: Using rta_roofing_material for material (your earlier sheet had a typo).
   ------------------------------------------------------------------------- */
export async function saveRoofA(
  projectUuid: string,
  args: {
    material?: string; // -> rta_roofing_material
    framingSize?: string; // -> rta_framing_size
    areaSqFt?: number | string; // -> st_roof_a_area_sqft
    framingSpacing?: string; // -> rta_framing_spacing
    framingType?: "Truss" | "Rafter" | ""; // -> st_roof_a_framing_type
  }
) {
  const payload: Record<string, any> = {};
  if (args.material !== undefined)
    payload.rta_roofing_material = toText(args.material);
  if (args.framingSize !== undefined)
    payload.rta_framing_size = toText(args.framingSize);
  if (args.areaSqFt !== undefined)
    payload.st_roof_a_area_sqft = toInt(args.areaSqFt);
  if (args.framingSpacing !== undefined)
    payload.rta_framing_spacing = toText(args.framingSpacing);
  if (args.framingType !== undefined)
    payload.st_roof_a_framing_type = toText(args.framingType);
  
  const result = await saveSystemDetails(projectUuid, payload);
  
  // Show success toast
  Toast.show({
    text1: "Data Saved",
    type: "success",
    position: "top",
    visibilityTime: 1500,
  });
  
  return result;
}

/* ──────────────────────────────────────────────────────────────────────────
   Roofing (B)  → rtb_* + st_roof_b_* columns
   ------------------------------------------------------------------------- */
export async function saveRoofB(
  projectUuid: string,
  args: {
    material?: string; // -> rtb_roofing_material
    framingSize?: string; // -> rtb_framing_size
    areaSqFt?: number | string; // -> st_roof_b_area_sqft
    framingSpacing?: string; // -> rtb_framing_spacing
    framingType?: "Truss" | "Rafter" | ""; // -> st_roof_b_framing_type
  }
) {
  const payload: Record<string, any> = {};
  if (args.material !== undefined)
    payload.rtb_roofing_material = toText(args.material);
  if (args.framingSize !== undefined)
    payload.rtb_framing_size = toText(args.framingSize);
  if (args.areaSqFt !== undefined)
    payload.st_roof_b_area_sqft = toInt(args.areaSqFt);
  if (args.framingSpacing !== undefined)
    payload.rtb_framing_spacing = toText(args.framingSpacing);
  if (args.framingType !== undefined)
    payload.st_roof_b_framing_type = toText(args.framingType);
  
  const result = await saveSystemDetails(projectUuid, payload);
  
  // Show success toast
  Toast.show({
    text1: "Data Saved",
    type: "success",
    position: "top",
    visibilityTime: 1500,
  });
  
  return result;
}

/* ──────────────────────────────────────────────────────────────────────────
   Mounting Plane N (1..10)
   - mode          → st_mp{n}_mode
   - stories       → mp{n}_stories
   - pitch         → mp{n}_pitch
   - azimuth       → mp{n}_azimuth
   - roof_type     → mp{n}_roof_type (defaults to 'A')
   - qty1..qty8    → st_mp{n}_arrayqty_{i}
   ------------------------------------------------------------------------- */
export type PlaneArgs = {
  mode?: "Flush" | "Tilt" | "Ground" | "";
  stories?: number | string;
  pitch?: number | string;
  azimuth?: number | string;
  qty1?: number | string;
  qty2?: number | string;
  qty3?: number | string;
  qty4?: number | string;
  qty5?: number | string;
  qty6?: number | string;
  qty7?: number | string;
  qty8?: number | string;
  roof_type?: "A" | "B" | "";
};

/**
 * Ensures roof_type is always set to 'A' if not specified
 * This is a temporary solution until roof type toggle is built
 */
function ensureRoofType(args: PlaneArgs): PlaneArgs {
  return {
    ...args,
    roof_type: args.roof_type || "A"
  };
}

/**
 * Bulk update to set roof_type='A' for all existing mounting planes
 * Call this function to migrate existing data
 */
export async function setDefaultRoofTypeForAllPlanes(projectUuid: string) {
  const payload: Record<string, any> = {};

  // Set roof_type='A' for all planes (1-10)
  for (let i = 1; i <= 10; i++) {
    payload[`mp${i}_roof_type`] = "A";
  }

  const result = await saveSystemDetails(projectUuid, payload);

  // Show success toast
  Toast.show({
    text1: "Roof Types Updated",
    text2: "All mounting planes set to roof type A",
    type: "success",
    position: "top",
    visibilityTime: 2000,
  });

  return result;
}

export async function saveMountingPlane(
  projectUuid: string,
  planeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  args: PlaneArgs
) {
  const p = planeIndex;
  const payload: Record<string, any> = {};

  // Ensure roof_type is always set
  const normalizedArgs = ensureRoofType(args);

  if (normalizedArgs.mode !== undefined) payload[`st_mp${p}_mode`] = toText(normalizedArgs.mode);
  if (normalizedArgs.stories !== undefined)
    payload[`mp${p}_stories`] = toInt(normalizedArgs.stories);
  if (normalizedArgs.pitch !== undefined) payload[`mp${p}_pitch`] = toInt(normalizedArgs.pitch);
  if (normalizedArgs.azimuth !== undefined)
    payload[`mp${p}_azimuth`] = toInt(normalizedArgs.azimuth);

  // Always include roof_type (now guaranteed to be set)
  payload[`mp${p}_roof_type`] = toText(normalizedArgs.roof_type);

  const qtys = [
    normalizedArgs.qty1,
    normalizedArgs.qty2,
    normalizedArgs.qty3,
    normalizedArgs.qty4,
    normalizedArgs.qty5,
    normalizedArgs.qty6,
    normalizedArgs.qty7,
    normalizedArgs.qty8,
  ];
  qtys.forEach((val, i) => {
    if (val !== undefined) payload[`st_mp${p}_arrayqty_${i + 1}`] = toInt(val);
  });

  const result = await saveSystemDetails(projectUuid, payload);

  // NOTE: Toast removed - this function is called on every keystroke for auto-save.
  // Showing a toast on every keystroke causes the TextInput to lose focus.

  return result;
}

/** Hard clear a plane (keeps record, nulls the fields) */
export async function clearMountingPlane(
  projectUuid: string,
  planeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
) {
  const p = planeIndex;
  const payload: Record<string, any> = {
    [`st_mp${p}_mode`]: null,
    [`mp${p}_stories`]: null,
    [`mp${p}_pitch`]: null,
    [`mp${p}_azimuth`]: null,
    [`mp${p}_roof_type`]: null,
  };
  for (let i = 1; i <= 8; i++) {
    payload[`st_mp${p}_arrayqty_${i}`] = null;
  }
  return saveSystemDetails(projectUuid, payload);
}
export async function resetMountingPlane(
  projectUuid: string,
  planeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
) {
  const p = planeIndex;
  const payload: Record<string, any> = {
    [`st_mp${p}_mode`]: null,
    [`mp${p}_stories`]: null,
    [`mp${p}_pitch`]: null,
    [`mp${p}_azimuth`]: null,
    [`mp${p}_roof_type`]: null,
  };
  for (let i = 1; i <= 8; i++) {
    payload[`st_mp${p}_arrayqty_${i}`] = null;
  }
  return saveSystemDetails(projectUuid, payload);
}
