// src/screens/Project/electrical/hooks/useElectricalDetails.ts
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import type { DebouncedFunc } from "lodash";
import {
  fetchSystemDetails,
  saveServiceEntrance,
  saveMainPanelA,
  saveSubPanelB,
  saveSubPanelC,
  saveSubPanelD,
  savePOI,
} from "../services/electricalPersistence";

type YesNoHelp = "Yes" | "No" | "Help Me Decide" | "";

function useDebounced<T extends (...a: any[]) => any>(
  fn: T,
  ms = 400
): DebouncedFunc<T> {
  const ref = useRef<DebouncedFunc<T>>(debounce(fn, ms) as DebouncedFunc<T>);
  useEffect(() => () => ref.current.cancel(), []);
  return ref.current;
}

export function useElectricalDetails(projectUuid?: string) {
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<any | null>(null); // server baseline (raw)

  // —— local UI state (keep simple strings/numbers) ————————————————
  const [serviceEntranceType, setServiceEntranceType] = useState<string>("");
  const [mcbCount, setMcbCount] = useState<number | null>(null);
  const [mpuSelection, setMpuSelection] = useState<YesNoHelp>("");
  const [utilityServiceAmps, setUtilityServiceAmps] = useState<string>("");

  // Panel A
  const [mpaType, setMpaType] = useState<"new" | "existing" | null>(null);
  const [mpaBus, setMpaBus] = useState<string>("");
  const [mpaMain, setMpaMain] = useState<string>("");
  const [mpaFeeder, setMpaFeeder] = useState<string>("");
  const [mpaDerated, setMpaDerated] = useState<boolean | null>(null);

  // Panel B
  const [spbType, setSpbType] = useState<"new" | "existing" | null>(null);
  const [spbBus, setSpbBus] = useState<string>("");
  const [spbMain, setSpbMain] = useState<string>("");
  const [spbFeeder, setSpbFeeder] = useState<string>("");
  const [spbDerated, setSpbDerated] = useState<boolean | null>(null);
  const [spbUpBreaker, setSpbUpBreaker] = useState<string>("");
  const [spbTieInLocation, setSpbTieInLocation] = useState<string>("");
  const [spbConductorSizing, setSpbConductorSizing] = useState<string>("");

  // Panel C
  const [spcType, setSpcType] = useState<"new" | "existing" | null>(null);
  const [spcBus, setSpcBus] = useState<string>("");
  const [spcMain, setSpcMain] = useState<string>("");
  const [spcFeeder, setSpcFeeder] = useState<string>("");
  const [spcUpBreaker, setSpcUpBreaker] = useState<string>("");
  const [spcUpLocation, setSpcUpLocation] = useState<string>("");

  // Panel D
  const [spdType, setSpdType] = useState<"new" | "existing" | null>(null);
  const [spdBus, setSpdBus] = useState<string>("");
  const [spdMain, setSpdMain] = useState<string>("");
  const [spdFeeder, setSpdFeeder] = useState<string>("");
  const [spdUpBreaker, setSpdUpBreaker] = useState<string>("");
  const [spdUpLocation, setSpdUpLocation] = useState<string>("");

  // POI
  const [poiType, setPoiType] = useState<string>("");
  const [poiBreaker, setPoiBreaker] = useState<string>("");
  const [poiDisconnect, setPoiDisconnect] = useState<string>("");
  const [poiLocation, setPoiLocation] = useState<string>("");
  const [poiLocation2, setPoiLocation2] = useState<string>("");
  const [poiLocation3, setPoiLocation3] = useState<string>("");
  const [poiLocation4, setPoiLocation4] = useState<string>("");
  const [mcaBackfeed, setMcaBackfeed] = useState<string>("");

  // PCS (Power Control System) - per system
  const [pcsActivated, setPcsActivated] = useState<boolean>(false);
  const [pcsAmps, setPcsAmps] = useState<string>("");
  const [pcsAmps2, setPcsAmps2] = useState<string>("");
  const [pcsAmps3, setPcsAmps3] = useState<string>("");
  const [pcsAmps4, setPcsAmps4] = useState<string>("");

  // —— load baseline once ————————————————————————————————
  useEffect(() => {
    if (!projectUuid) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSystemDetails(projectUuid); // 404 bubbles; if you prefer, wrap like equipmentSafe
        if (cancelled) return;
        setRow(data ?? null);

        const r = data ?? {};
        // SES/MPU
        setServiceEntranceType(r.ele_ses_type ?? "");
        setMcbCount(r.ele_main_circuit_breakers_qty ?? null);
        setMpuSelection(r.ele_main_panel_upgrade ?? "");
        setUtilityServiceAmps(r.utility_service_amps ?? "");

        // A
        setMpaType(
          r.mpa_bus_bar_existing === true
            ? "existing"
            : r.mpa_bus_bar_existing === false
            ? "new"
            : null
        );
        setMpaBus((r.ele_bus_bar_rating ?? "").toString());
        setMpaMain((r.ele_main_circuit_breaker_rating ?? "").toString());
        setMpaFeeder(r.ele_feeder_location_on_bus_bar ?? "");
        setMpaDerated(r.el_mpa_derated ?? null);

        // B
        setSpbType(
          r.spb_subpanel_existing === true
            ? "existing"
            : r.spb_subpanel_existing === false
            ? "new"
            : null
        );
        setSpbBus((r.spb_bus_bar_rating ?? "").toString());
        setSpbMain((r.spb_main_breaker_rating ?? "").toString());
        setSpbFeeder(r.spb_subpanel_b_feeder_location ?? "");
        setSpbDerated(r.el_spb_derated ?? null);
        setSpbUpBreaker((r.spb_upstream_breaker_rating ?? "").toString());
        setSpbTieInLocation(r.spb_tie_in_location ?? "");
        setSpbConductorSizing(r.spb_conductor_sizing ?? "");

        // C
        setSpcType(
          r.el_spc_existing === true
            ? "existing"
            : r.el_spc_existing === false
            ? "new"
            : null
        );
        setSpcBus((r.el_spc_bus_rating ?? "").toString());
        setSpcMain((r.el_spc_main_breaker_rating ?? "").toString());
        setSpcFeeder(r.el_spc_feeder_location ?? "");
        setSpcUpBreaker((r.el_spc_upstream_breaker_rating ?? "").toString());
        setSpcUpLocation(r.el_spc_upstream_breaker_location ?? "");

        // D
        setSpdType(
          r.el_spd_existing === true
            ? "existing"
            : r.el_spd_existing === false
            ? "new"
            : null
        );
        setSpdBus((r.el_spd_bus_rating ?? "").toString());
        setSpdMain((r.el_spd_main_breaker_rating ?? "").toString());
        setSpdFeeder(r.el_spd_feeder_location ?? "");
        setSpdUpBreaker((r.el_spd_upstream_breaker_rating ?? "").toString());
        setSpdUpLocation(r.el_spd_upstream_breaker_location ?? "");

        // POI
        setPoiType(r.ele_method_of_interconnection ?? "");
        setPoiBreaker((r.el_poi_breaker_rating ?? "").toString());
        setPoiDisconnect((r.el_poi_disconnect_rating ?? "").toString());
        setPoiLocation(r.ele_breaker_location ?? "");
        setPoiLocation2(r.sys2_ele_breaker_location ?? "");
        setPoiLocation3(r.sys3_ele_breaker_location ?? "");
        setPoiLocation4(r.sys4_ele_breaker_location ?? "");
        setMcaBackfeed((r.el_mca_system_back_feed ?? "").toString());

        // PCS - load from sys{N}_pcs_amps fields
        setPcsActivated(r.sys1_pcs_settings ?? false);
        setPcsAmps((r.sys1_pcs_amps ?? "").toString());
        setPcsAmps2((r.sys2_pcs_amps ?? "").toString());
        setPcsAmps3((r.sys3_pcs_amps ?? "").toString());
        setPcsAmps4((r.sys4_pcs_amps ?? "").toString());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  // —— debounced writers (send single-field updates) ————————————————
  const dService = useDebounced(saveServiceEntrance);
  const dA = useDebounced(saveMainPanelA);
  const dB = useDebounced(saveSubPanelB);
  const dC = useDebounced(saveSubPanelC);
  const dD = useDebounced(saveSubPanelD);
  const dPOI = useDebounced(savePOI);

  // helpers so screens can call set+save in one go
  const update = {
    serviceEntranceType: (v: string) => {
      setServiceEntranceType(v);
      if (projectUuid) dService(projectUuid, { serviceEntranceType: v });
    },
    mcbCount: (v: number) => {
      setMcbCount(v);
      if (projectUuid) dService(projectUuid, { mcbCount: v });
    },
    mpuSelection: (v: YesNoHelp) => {
      setMpuSelection(v);
      if (projectUuid) dService(projectUuid, { mpuSelection: v as any });
    },
    utilityServiceAmps: (v: string) => {
      setUtilityServiceAmps(v);
      if (projectUuid) dService(projectUuid, { utilityServiceAmps: v });
    },

    mpaType: (v: "new" | "existing") => {
      setMpaType(v);
      if (projectUuid) dA(projectUuid, { type: v });
    },
    mpaBus: (v: string) => {
      setMpaBus(v);
      if (projectUuid) {
        console.debug('[useElectricalDetails] Saving mpaBus:', v, 'projectUuid:', projectUuid);
        dA(projectUuid, { busAmps: v });

        // Auto-calculate and save utility_service_amps based on bus amps
        const busAmpsValue = parseFloat(v);
        if (!isNaN(busAmpsValue) && busAmpsValue > 0) {
          const calculatedUtilityServiceAmps = busAmpsValue <= 225 ? "200" : "400";
          console.debug('[useElectricalDetails] Auto-calculating utility_service_amps:', calculatedUtilityServiceAmps, 'based on bus amps:', busAmpsValue);
          setUtilityServiceAmps(calculatedUtilityServiceAmps);
          dService(projectUuid, { utilityServiceAmps: calculatedUtilityServiceAmps });
        }
      } else {
        console.warn('[useElectricalDetails] Cannot save mpaBus - no projectUuid!');
      }
    },
    mpaMain: (v: string) => {
      setMpaMain(v);
      if (projectUuid) dA(projectUuid, { mainBreakerAmps: v });
    },
    mpaFeeder: (v: string) => {
      setMpaFeeder(v);
      if (projectUuid) dA(projectUuid, { feederLocation: v });
    },
    mpaDerated: (v: boolean | null) => {
      setMpaDerated(v);
      if (projectUuid) dA(projectUuid, { derated: v });
    },
    mpaBusBarExisting: (v: boolean) => {
      console.debug('[useElectricalDetails] Saving mpaBusBarExisting:', v);
      if (projectUuid) {
        // Use non-debounced call to ensure this is saved immediately
        // This prevents debounce conflicts with other field saves
        saveMainPanelA(projectUuid, { mpaBusBarExisting: v });
      }
    },
    mpaMainCircuitBreakerExisting: (v: boolean) => {
      console.debug('[useElectricalDetails] Saving mpaMainCircuitBreakerExisting:', v);
      if (projectUuid) {
        // Use non-debounced call to ensure this is saved immediately
        // This prevents debounce conflicts with other field saves
        saveMainPanelA(projectUuid, { mpaMainCircuitBreakerExisting: v });
      }
    },

    spbType: (v: "new" | "existing") => {
      setSpbType(v);
      // Save type immediately when changed
      if (projectUuid) dB(projectUuid, { type: v });
    },
    spbBus: (v: string) => {
      setSpbBus(v);
      if (projectUuid) {
        // When busAmps is selected, also save the type (new/existing toggle) to ensure spb_subpanel_existing is persisted
        const payload: any = { busAmps: v };
        // Always include type in payload when busAmps changes, defaulting to current type or "new" if not set
        payload.type = spbType || "new";
        console.debug('[useElectricalDetails] Saving spbBus with type:', payload);
        dB(projectUuid, payload);
      }
    },
    spbMain: (v: string) => {
      setSpbMain(v);
      if (projectUuid) dB(projectUuid, { mainBreakerAmps: v });
    },
    spbFeeder: (v: string) => {
      setSpbFeeder(v);
      if (projectUuid) dB(projectUuid, { feederLocation: v });
    },
    spbDerated: (v: boolean | null) => {
      setSpbDerated(v);
      if (projectUuid) dB(projectUuid, { derated: v });
    },
    spbUpBreaker: (v: string) => {
      setSpbUpBreaker(v);
      if (projectUuid) dB(projectUuid, { upstreamBreakerAmps: v });
    },
    spbTieInLocation: (v: string) => {
      setSpbTieInLocation(v);
      if (projectUuid) dB(projectUuid, { tieInLocation: v });
    },
    spbConductorSizing: (v: string) => {
      setSpbConductorSizing(v);
      if (projectUuid) dB(projectUuid, { conductorSizing: v });
    },

    spcType: (v: "new" | "existing") => {
      setSpcType(v);
      if (projectUuid) dC(projectUuid, { type: v });
    },
    spcBus: (v: string) => {
      setSpcBus(v);
      if (projectUuid) dC(projectUuid, { busAmps: v });
    },
    spcMain: (v: string) => {
      setSpcMain(v);
      if (projectUuid) dC(projectUuid, { mainBreakerAmps: v });
    },
    spcFeeder: (v: string) => {
      setSpcFeeder(v);
      if (projectUuid) dC(projectUuid, { feederLocation: v });
    },
    spcUpBreaker: (v: string) => {
      setSpcUpBreaker(v);
      if (projectUuid) dC(projectUuid, { upstreamBreakerAmps: v });
    },
    spcUpLocation: (v: string) => {
      setSpcUpLocation(v);
      if (projectUuid) dC(projectUuid, { upstreamBreakerLocation: v });
    },

    spdType: (v: "new" | "existing") => {
      setSpdType(v);
      if (projectUuid) dD(projectUuid, { type: v });
    },
    spdBus: (v: string) => {
      setSpdBus(v);
      if (projectUuid) dD(projectUuid, { busAmps: v });
    },
    spdMain: (v: string) => {
      setSpdMain(v);
      if (projectUuid) dD(projectUuid, { mainBreakerAmps: v });
    },
    spdFeeder: (v: string) => {
      setSpdFeeder(v);
      if (projectUuid) dD(projectUuid, { feederLocation: v });
    },
    spdUpBreaker: (v: string) => {
      setSpdUpBreaker(v);
      if (projectUuid) dD(projectUuid, { upstreamBreakerAmps: v });
    },
    spdUpLocation: (v: string) => {
      setSpdUpLocation(v);
      if (projectUuid) dD(projectUuid, { upstreamBreakerLocation: v });
    },

    poiType: (v: string) => {
      setPoiType(v);
      if (projectUuid) dPOI(projectUuid, { poiType: v });
    },
    poiBreaker: (v: string) => {
      setPoiBreaker(v);
      if (projectUuid) dPOI(projectUuid, { breakerRating: v });
    },
    poiDisconnect: (v: string) => {
      setPoiDisconnect(v);
      if (projectUuid) dPOI(projectUuid, { disconnectRating: v });
    },
    poiLocation: (v: string) => {
      setPoiLocation(v);
      if (projectUuid) dPOI(projectUuid, { poiLocation: v });
    },
    poiLocation2: (v: string) => {
      setPoiLocation2(v);
      if (projectUuid) dPOI(projectUuid, { poiLocation2: v });
    },
    poiLocation3: (v: string) => {
      setPoiLocation3(v);
      if (projectUuid) dPOI(projectUuid, { poiLocation3: v });
    },
    poiLocation4: (v: string) => {
      setPoiLocation4(v);
      if (projectUuid) dPOI(projectUuid, { poiLocation4: v });
    },
    mcaBackfeed: (v: string) => {
      setMcaBackfeed(v);
      if (projectUuid) dPOI(projectUuid, { mcaSystemBackFeed: v });
    },
    pcsAmps: (v: string) => {
      setPcsAmps(v);
      if (projectUuid) dPOI(projectUuid, { pcsAmps: v });
    },
    pcsAmps2: (v: string) => {
      setPcsAmps2(v);
      if (projectUuid) dPOI(projectUuid, { pcsAmps2: v });
    },
    pcsAmps3: (v: string) => {
      setPcsAmps3(v);
      if (projectUuid) dPOI(projectUuid, { pcsAmps3: v });
    },
    pcsAmps4: (v: string) => {
      setPcsAmps4(v);
      if (projectUuid) dPOI(projectUuid, { pcsAmps4: v });
    },

    // Clear all Sub Panel B data
    clearSubPanelB: () => {
      setSpbType(null);
      setSpbBus("");
      setSpbMain("");
      setSpbFeeder("");
      setSpbDerated(null);
      setSpbUpBreaker("");
      setSpbTieInLocation("");
      setSpbConductorSizing("");
      if (projectUuid) {
        // Send null values to clear all Sub Panel B fields in the database
        saveSubPanelB(projectUuid, {
          type: null,
          busAmps: null,
          mainBreakerAmps: null,
          feederLocation: null,
          derated: null,
          upstreamBreakerAmps: null,
          tieInLocation: null,
        });
      }
    },
  };

  return {
    loading,
    // values
    serviceEntranceType,
    mcbCount,
    mpuSelection,
    utilityServiceAmps,
    mpaType,
    mpaBus,
    mpaMain,
    mpaFeeder,
    mpaDerated,
    spbType,
    spbBus,
    spbMain,
    spbFeeder,
    spbDerated,
    spbUpBreaker,
    spbTieInLocation,
    spbConductorSizing,
    spcType,
    spcBus,
    spcMain,
    spcFeeder,
    spcUpBreaker,
    spcUpLocation,
    spdType,
    spdBus,
    spdMain,
    spdFeeder,
    spdUpBreaker,
    spdUpLocation,
    poiType,
    poiBreaker,
    poiDisconnect,
    poiLocation,
    poiLocation2,
    poiLocation3,
    poiLocation4,
    mcaBackfeed,
    pcsActivated,
    pcsAmps,
    pcsAmps2,
    pcsAmps3,
    pcsAmps4,
    // setters that also save
    update,
    // raw row if needed
    row,
  };
}
