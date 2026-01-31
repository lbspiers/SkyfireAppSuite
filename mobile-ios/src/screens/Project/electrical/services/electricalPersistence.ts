// src/screens/Project/electrical/services/electricalPersistence.ts
import {
  fetchSystemDetails as _fetchSystemDetails,
  saveSystemDetails,
} from "../../../../api/systemDetails.service";
import Toast from "react-native-toast-message";

// Expose the same fetch used by Equipment (or wrap in 404-safe helper if you prefer)
export const fetchSystemDetails = _fetchSystemDetails;

const toInt = (v: any) =>
  v === "" || v === undefined || v === null ? null : parseInt(String(v), 10);
const toBool = (v: any) => (v === null || v === undefined ? null : !!v);
const toText = (v: any) =>
  v === undefined ? null : v === "" ? null : String(v);
// Helper for breaker ratings that can be either numeric or "MLO"
const toBreakerRating = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const str = String(v).toUpperCase().trim();
  if (str === "MLO") return "MLO";
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
};

// --- Service Entrance / MPU ---
export async function saveServiceEntrance(
  projectUuid: string,
  args: {
    serviceEntranceType?: string; // -> ele_ses_type
    mcbCount?: number | string; // -> ele_main_circuit_breakers_qty
    mpuSelection?: "Yes" | "No" | "Help Me Decide"; // -> ele_main_panel_upgrade
    utilityServiceAmps?: string; // -> utility_service_amps
  }
) {
  const payload: Record<string, any> = {};
  if (args.serviceEntranceType !== undefined)
    payload.ele_ses_type = toText(args.serviceEntranceType);
  if (args.mcbCount !== undefined)
    payload.ele_main_circuit_breakers_qty = toInt(args.mcbCount);
  if (args.mpuSelection !== undefined)
    payload.ele_main_panel_upgrade = toText(args.mpuSelection);
  if (args.utilityServiceAmps !== undefined)
    payload.utility_service_amps = toText(args.utilityServiceAmps);
  
  const result = await saveSystemDetails(projectUuid, payload);
  return result;
}

// --- Main Panel A ---
export async function saveMainPanelA(
  projectUuid: string,
  args: {
    type?: "new" | "existing"; // -> mpa_bus_bar_existing (true when existing)
    busAmps?: number | string; // -> ele_bus_bar_rating
    mainBreakerAmps?: number | string; // -> ele_main_circuit_breaker_rating
    feederLocation?: string; // -> ele_feeder_location_on_bus_bar
    derated?: boolean | null; // -> el_mpa_derated
    mpaBusBarExisting?: boolean; // -> mpa_bus_bar_existing
    mpaMainCircuitBreakerExisting?: boolean; // -> mpa_main_circuit_breaker_existing
  }
) {
  const payload: Record<string, any> = {};

  // Handle legacy type field (for backward compatibility)
  if (args.type !== undefined)
    payload.mpa_bus_bar_existing = toBool(args.type === "existing");

  // Handle explicit MPA fields (these override the legacy type field)
  if (args.mpaBusBarExisting !== undefined)
    payload.mpa_bus_bar_existing = toBool(args.mpaBusBarExisting);
  if (args.mpaMainCircuitBreakerExisting !== undefined)
    payload.mpa_main_circuit_breaker_existing = toBool(args.mpaMainCircuitBreakerExisting);

  // Handle other fields
  if (args.busAmps !== undefined)
    payload.ele_bus_bar_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.ele_main_circuit_breaker_rating = toBreakerRating(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.ele_feeder_location_on_bus_bar = toText(args.feederLocation);
  if (args.derated !== undefined)
    payload.el_mpa_derated = toBool(args.derated);

  // Don't send empty payloads
  if (Object.keys(payload).length === 0) {
    console.warn('[saveMainPanelA] No fields to save, skipping API call');
    return { success: true, message: 'No changes to save' };
  }

  const result = await saveSystemDetails(projectUuid, payload);
  return result;
}

// --- Sub Panel B ---
export async function saveSubPanelB(
  projectUuid: string,
  args: {
    type?: "new" | "existing" | null; // -> spb_subpanel_existing
    busAmps?: number | string | null; // -> spb_bus_bar_rating
    mainBreakerAmps?: number | string | null; // -> spb_main_breaker_rating (can be "MLO" or numeric)
    feederLocation?: string | null; // -> spb_subpanel_b_feeder_location
    derated?: boolean | null; // -> el_spb_derated
    upstreamBreakerAmps?: number | string | null; // -> spb_upstream_breaker_rating
    tieInLocation?: string | null; // -> spb_tie_in_location
    conductorSizing?: string | null; // -> spb_conductor_sizing
  }
) {
  const payload: Record<string, any> = {};
  if (args.type !== undefined) {
    // Handle null type to clear the field
    payload.spb_subpanel_existing = args.type === null ? null : toBool(args.type === "existing");
  }
  if (args.busAmps !== undefined)
    payload.spb_bus_bar_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.spb_main_breaker_rating = toBreakerRating(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.spb_subpanel_b_feeder_location = toText(args.feederLocation);
  if (args.derated !== undefined) payload.el_spb_derated = args.derated === null ? null : toBool(args.derated);
  if (args.upstreamBreakerAmps !== undefined)
    payload.spb_upstream_breaker_rating = toInt(args.upstreamBreakerAmps);
  if (args.tieInLocation !== undefined)
    payload.spb_tie_in_location = toText(args.tieInLocation);
  if (args.conductorSizing !== undefined)
    payload.spb_conductor_sizing = toText(args.conductorSizing);

  console.debug('[saveSubPanelB] Saving payload:', payload);
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

// --- Sub Panel C ---
export async function saveSubPanelC(
  projectUuid: string,
  args: {
    type?: "new" | "existing"; // -> el_spc_existing
    busAmps?: number | string; // -> el_spc_bus_rating
    mainBreakerAmps?: number | string; // -> el_spc_main_breaker_rating
    feederLocation?: string; // -> el_spc_feeder_location
    upstreamBreakerAmps?: number | string; // -> el_spc_upstream_breaker_rating
    upstreamBreakerLocation?: string; // -> el_spc_upstream_breaker_location
  }
) {
  const payload: Record<string, any> = {};
  if (args.type !== undefined)
    payload.el_spc_existing = toBool(args.type === "existing");
  if (args.busAmps !== undefined)
    payload.el_spc_bus_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.el_spc_main_breaker_rating = toInt(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.el_spc_feeder_location = toText(args.feederLocation);
  if (args.upstreamBreakerAmps !== undefined)
    payload.el_spc_upstream_breaker_rating = toInt(args.upstreamBreakerAmps);
  if (args.upstreamBreakerLocation !== undefined)
    payload.el_spc_upstream_breaker_location = toText(
      args.upstreamBreakerLocation
    );
  
  const result = await saveSystemDetails(projectUuid, payload);
  return result;
}

// --- Sub Panel D ---
export async function saveSubPanelD(
  projectUuid: string,
  args: {
    type?: "new" | "existing"; // -> el_spd_existing
    busAmps?: number | string; // -> el_spd_bus_rating
    mainBreakerAmps?: number | string; // -> el_spd_main_breaker_rating
    feederLocation?: string; // -> el_spd_feeder_location
    upstreamBreakerAmps?: number | string; // -> el_spd_upstream_breaker_rating
    upstreamBreakerLocation?: string; // -> el_spd_upstream_breaker_location
  }
) {
  const payload: Record<string, any> = {};
  if (args.type !== undefined)
    payload.el_spd_existing = toBool(args.type === "existing");
  if (args.busAmps !== undefined)
    payload.el_spd_bus_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.el_spd_main_breaker_rating = toInt(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.el_spd_feeder_location = toText(args.feederLocation);
  if (args.upstreamBreakerAmps !== undefined)
    payload.el_spd_upstream_breaker_rating = toInt(args.upstreamBreakerAmps);
  if (args.upstreamBreakerLocation !== undefined)
    payload.el_spd_upstream_breaker_location = toText(
      args.upstreamBreakerLocation
    );
  
  const result = await saveSystemDetails(projectUuid, payload);
  return result;
}

// --- Point of Interconnection ---
export async function savePOI(
  projectUuid: string,
  args: {
    poiType?: string; // -> ele_method_of_interconnection
    breakerRating?: number | string; // -> el_poi_breaker_rating
    disconnectRating?: number | string; // -> el_poi_disconnect_rating
    poiLocation?: string; // -> ele_breaker_location
    poiLocation2?: string; // -> sys2_ele_breaker_location
    poiLocation3?: string; // -> sys3_ele_breaker_location
    poiLocation4?: string; // -> sys4_ele_breaker_location
    interconnectionMethod?: string; // alt -> ele_method_of_interconnection
    breakerLocation?: string; // alt -> ele_breaker_location
    mcaSystemBackFeed?: number | string; // -> el_mca_system_back_feed (optional if in DB)
    pcsAmps?: number | string; // -> sys1_pcs_amps
    pcsAmps2?: number | string; // -> sys2_pcs_amps
    pcsAmps3?: number | string; // -> sys3_pcs_amps
    pcsAmps4?: number | string; // -> sys4_pcs_amps
  }
) {
  const payload: Record<string, any> = {};
  if (args.poiType !== undefined)
    payload.ele_method_of_interconnection = toText(args.poiType);
  if (args.interconnectionMethod !== undefined)
    payload.ele_method_of_interconnection = toText(args.interconnectionMethod);

  if (args.breakerRating !== undefined)
    payload.el_poi_breaker_rating = toInt(args.breakerRating);
  if (args.disconnectRating !== undefined)
    payload.el_poi_disconnect_rating = toInt(args.disconnectRating);

  if (args.poiLocation !== undefined)
    payload.ele_breaker_location = toText(args.poiLocation);
  if (args.poiLocation2 !== undefined)
    payload.sys2_ele_breaker_location = toText(args.poiLocation2);
  if (args.poiLocation3 !== undefined)
    payload.sys3_ele_breaker_location = toText(args.poiLocation3);
  if (args.poiLocation4 !== undefined)
    payload.sys4_ele_breaker_location = toText(args.poiLocation4);
  if (args.breakerLocation !== undefined)
    payload.ele_breaker_location = toText(args.breakerLocation);

  if (args.mcaSystemBackFeed !== undefined)
    payload.el_mca_system_back_feed = toInt(args.mcaSystemBackFeed);

  if (args.pcsAmps !== undefined)
    payload.sys1_pcs_amps = toInt(args.pcsAmps);
  if (args.pcsAmps2 !== undefined)
    payload.sys2_pcs_amps = toInt(args.pcsAmps2);
  if (args.pcsAmps3 !== undefined)
    payload.sys3_pcs_amps = toInt(args.pcsAmps3);
  if (args.pcsAmps4 !== undefined)
    payload.sys4_pcs_amps = toInt(args.pcsAmps4);

  const result = await saveSystemDetails(projectUuid, payload);
  return result;
}
