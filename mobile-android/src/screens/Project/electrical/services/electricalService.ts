// src/screens/Project/electrical/services/electricalPersistence.ts
import {
  fetchSystemDetails as _fetchSystemDetails,
  saveSystemDetails,
} from "../../../../api/systemDetails.service";

// Keep the fetcher name the same for existing imports
export const fetchSystemDetails = _fetchSystemDetails;

/** ---- Coercers (null-safe, NaN-safe) ------------------------------------- */
const toInt = (v: any) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};
const toBool = (v: any) => (v === null || v === undefined ? null : Boolean(v));
const toText = (v: any) =>
  v === undefined ? null : v === "" ? null : String(v);

/** Util: only send keys that are actually present (avoid {} / undefined) */
function send(uuid: string, payload: Record<string, any>) {
  // nothing to send → short-circuit to avoid 400s
  if (!Object.keys(payload).length) {
    return Promise.resolve({
      data: { success: true, skipped: true },
      status: 204,
    } as any);
  }
  return saveSystemDetails(uuid, payload);
}

/** --- Service Entrance / MPU --------------------------------------------- */
export async function saveServiceEntrance(
  projectUuid: string,
  args: {
    serviceEntranceType?: string; // -> ele_ses_type
    mcbCount?: number | string; // -> ele_main_circuit_breakers_qty
    mpuSelection?: "Yes" | "No" | "Help Me Decide"; // -> ele_main_panel_upgrade
  }
) {
  const payload: Record<string, any> = {};
  if (args.serviceEntranceType !== undefined)
    payload.ele_ses_type = toText(args.serviceEntranceType);
  if (args.mcbCount !== undefined)
    payload.ele_main_circuit_breakers_qty = toInt(args.mcbCount);
  if (args.mpuSelection !== undefined)
    payload.ele_main_panel_upgrade = toText(args.mpuSelection);
  return send(projectUuid, payload);
}

/** --- Main Panel A -------------------------------------------------------- */
export async function saveMainPanelA(
  projectUuid: string,
  args: {
    type?: "new" | "existing"; // -> mpa_bus_bar_existing (true when existing)
    busAmps?: number | string; // -> ele_bus_bar_rating
    mainBreakerAmps?: number | string; // -> ele_main_circuit_breaker_rating
    feederLocation?: string; // -> ele_feeder_location_on_bus_bar
    derated?: boolean | null; // -> el_mpa_derated
    // canCalculateLoad?: boolean;      // (no DB column requested)
  }
) {
  const payload: Record<string, any> = {};
  if (args.type !== undefined)
    payload.mpa_bus_bar_existing = toBool(args.type === "existing");
  if (args.busAmps !== undefined)
    payload.ele_bus_bar_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.ele_main_circuit_breaker_rating = toInt(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.ele_feeder_location_on_bus_bar = toText(args.feederLocation);
  if (args.derated !== undefined) payload.el_mpa_derated = toBool(args.derated);
  return send(projectUuid, payload);
}

/** --- Sub Panel B --------------------------------------------------------- */
export async function saveSubPanelB(
  projectUuid: string,
  args: {
    type?: "new" | "existing"; // -> spb_subpanel_existing
    busAmps?: number | string; // -> spb_bus_bar_rating
    mainBreakerAmps?: number | string; // -> spb_main_breaker_rating
    feederLocation?: string; // -> spb_subpanel_b_feeder_location
    derated?: boolean | null; // -> el_spb_derated
    upstreamBreakerAmps?: number | string; // -> spb_upstream_breaker_rating
    tieInLocation?: string; // -> spb_tie_in_location
    conductorSizing?: string; // -> spb_conductor_sizing
  }
) {
  const payload: Record<string, any> = {};
  if (args.type !== undefined)
    payload.spb_subpanel_existing = toBool(args.type === "existing");
  if (args.busAmps !== undefined)
    payload.spb_bus_bar_rating = toInt(args.busAmps);
  if (args.mainBreakerAmps !== undefined)
    payload.spb_main_breaker_rating = toInt(args.mainBreakerAmps);
  if (args.feederLocation !== undefined)
    payload.spb_subpanel_b_feeder_location = toText(args.feederLocation);
  if (args.derated !== undefined) payload.el_spb_derated = toBool(args.derated);
  if (args.upstreamBreakerAmps !== undefined)
    payload.spb_upstream_breaker_rating = toInt(args.upstreamBreakerAmps);
  if (args.tieInLocation !== undefined)
    payload.spb_tie_in_location = toText(args.tieInLocation);
  if (args.conductorSizing !== undefined)
    payload.spb_conductor_sizing = toText(args.conductorSizing);
  return send(projectUuid, payload);
}

/** --- Sub Panel C --------------------------------------------------------- */
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
  return send(projectUuid, payload);
}

/** --- Sub Panel D --------------------------------------------------------- */
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
  return send(projectUuid, payload);
}

/** --- Point of Interconnection ------------------------------------------- */
export async function savePOI(
  projectUuid: string,
  args: {
    poiType?: string; // -> ele_method_of_interconnection
    breakerRating?: number | string; // -> el_poi_breaker_rating
    disconnectRating?: number | string; // -> el_poi_disconnect_rating
    poiLocation?: string; // -> ele_breaker_location
    interconnectionMethod?: string; // alt -> ele_method_of_interconnection
    breakerLocation?: string; // alt -> ele_breaker_location
    mcaSystemBackFeed?: number | string; // -> el_mca_system_back_feed
  }
) {
  const payload: Record<string, any> = {};
  // type/method
  if (args.poiType !== undefined)
    payload.ele_method_of_interconnection = toText(args.poiType);
  if (args.interconnectionMethod !== undefined)
    payload.ele_method_of_interconnection = toText(args.interconnectionMethod);
  // ratings
  if (args.breakerRating !== undefined)
    payload.el_poi_breaker_rating = toInt(args.breakerRating);
  if (args.disconnectRating !== undefined)
    payload.el_poi_disconnect_rating = toInt(args.disconnectRating);
  // locations
  if (args.poiLocation !== undefined)
    payload.ele_breaker_location = toText(args.poiLocation);
  if (args.breakerLocation !== undefined)
    payload.ele_breaker_location = toText(args.breakerLocation);
  // Meter Collar Adapter backfeed
  if (args.mcaSystemBackFeed !== undefined)
    payload.el_mca_system_back_feed = toInt(args.mcaSystemBackFeed);

  return send(projectUuid, payload);
}
