import { useState, useEffect, useRef, useCallback } from "react";
import debounce from "lodash/debounce";
import {
  saveSystemDetailsPartial,
  saveSystemDetailsPartialExact,
} from "../services/equipmentService";
import { getMakes, getModels } from "../../../../utils/equipmentCache";
import { EquipmentType } from "../../../../constants/equipmentTypes";
import { useNotification } from "../context/NotificationContext";
import { PreferredEquipment } from "../../../../api/preferredEquipment.service";
import {
  fetchPreferredEquipment,
  filterEquipmentByPreferred,
  getEquipmentTypeForPreferred,
  getAutoSelectEquipment,
  logPreferredFiltering,
} from "../../../../utils/preferredEquipmentHelper";

export interface SectionConfig<TFetch, TState> {
  typeKey: EquipmentType;
  /** Set false to fully disable hydration, catalog fetches and saves. */
  enabled?: boolean;
  /** Optional system prefix to trigger re-hydration when switching systems */
  systemPrefix?: string;
  fetchFromDb: (projectUuid: string) => Promise<TFetch | null>;
  mapFetchToState: (db: TFetch) => TState;
  buildPayload: (id: string | undefined, s: TState) => Record<string, any>;
}

export function useEquipmentSection<TFetch, TState extends Record<string, any>>(
  projectUuid: string | undefined,
  companyUuid: string | undefined,
  {
    typeKey,
    enabled = true,
    systemPrefix,
    fetchFromDb,
    mapFetchToState,
    buildPayload,
  }: SectionConfig<TFetch, TState>
) {
  // Notification context
  const { showNotification } = useNotification();

  // Local state ---------------------------------------------------------------
  // Initialize once with a safe "empty" state derived from mapper.
  const [state, setState] = useState<TState>(() =>
    mapFetchToState(undefined as any)
  );
  const [localId, setLocalId] = useState<string>();
  const [makes, setMakes] = useState<Array<{ label: string; value: string }>>(
    []
  );
  const [modelsState, setModelsState] = useState<Array<{ label: string; value: string; id?: number }>>(
    []
  );
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModelsState, setLoadingModelsState] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Wrapped setters with logging
  const setModels = (value: Array<{ label: string; value: string; id?: number }> | ((prev: Array<{ label: string; value: string; id?: number }>) => Array<{ label: string; value: string; id?: number }>)) => {
    const newValue = typeof value === 'function' ? value(modelsState) : value;

    // Check if the new array is different from the current state to prevent unnecessary re-renders
    const isDifferent = modelsState.length !== newValue.length ||
      modelsState.some((item, index) =>
        item.value !== newValue[index]?.value ||
        item.label !== newValue[index]?.label
      );

    if (isDifferent) {
      // Get stack trace to see where setModels is being called from
      const stack = new Error().stack?.split('\n').slice(2, 4).join('\n    ') || 'unknown';
      console.log(`[useEquipmentSection - ${typeKey}] 📝 setModels called. Count: ${modelsState.length} → ${newValue.length}\n    Called from:\n    ${stack}`);
      setModelsState(newValue);
    } else {
      console.log(`[useEquipmentSection - ${typeKey}] ⏭️  setModels skipped - no actual change (${newValue.length} items)`);
    }
  };

  const setLoadingModels = (loading: boolean) => {
    console.log(`[useEquipmentSection - ${typeKey}] ⏳ setLoadingModels: ${loadingModelsState} → ${loading}`);
    setLoadingModelsState(loading);
  };

  const models = modelsState;
  const loadingModels = loadingModelsState;

  // Preferred equipment state
  const [preferredEquipment, setPreferredEquipment] = useState<PreferredEquipment[]>([]);
  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [allMakes, setAllMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [allModels, setAllModels] = useState<Array<{ label: string; value: string; id?: number }>>([]);

  // Stable refs for function props (avoid effect loops) -----------------------
  const fetchRef = useRef(fetchFromDb);
  const mapRef = useRef(mapFetchToState);
  const buildRef = useRef(buildPayload);

  useEffect(() => {
    fetchRef.current = fetchFromDb;
  }, [fetchFromDb]);
  useEffect(() => {
    mapRef.current = mapFetchToState;
  }, [mapFetchToState]);
  useEffect(() => {
    buildRef.current = buildPayload;
  }, [buildPayload]);

  // Bookkeeping to suppress saves during hydration & dedupe writes ------------
  const hydratingRef = useRef(false);
  const hydratedOnceRef = useRef(false);
  const hydratedPayloadRef = useRef<Record<string, any> | null>(null);
  const lastSavedPayloadRef = useRef<Record<string, any> | null>(null);

  // Reset hook state when project changes or section is disabled --------------
  const hasLoadedMakes = useRef(false);
  const hasLoadedModels = useRef(false);
  const prevProjectUuidRef = useRef(projectUuid);
  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    const prevProjectUuid = prevProjectUuidRef.current;
    const prevEnabled = prevEnabledRef.current;

    prevProjectUuidRef.current = projectUuid;
    prevEnabledRef.current = enabled;

    // Only reset if:
    // 1. Project changed (different projectUuid)
    // 2. Section was explicitly disabled (enabled went from true to false)
    // Do NOT reset when section becomes enabled (false to true) - this would clear hydrated data
    const projectChanged = prevProjectUuid !== projectUuid;
    const wasDisabled = prevEnabled === true && enabled === false;
    const shouldReset = projectChanged || wasDisabled;

    if (!shouldReset) {
      return;
    }

    console.log(`[useEquipmentSection - ${typeKey}] 🔄 Resetting state. Reason: ${projectChanged ? 'project changed' : 'section disabled'}`);

    // When project changes or becomes falsy, or section disabled, clear meta.
    hydratingRef.current = false;
    hydratedOnceRef.current = false;
    hydratedPayloadRef.current = null;
    lastSavedPayloadRef.current = null;
    setLocalId(undefined);

    // Reset per-project catalog flags so we can refetch makes/models.
    hasLoadedMakes.current = false;
    hasLoadedModels.current = false;
    setMakes([]);
    setModels([]);

    // Reset to an empty, safe state so UI never sees `undefined`
    setState(mapRef.current(undefined as any));
  }, [projectUuid, enabled, typeKey]);

  // Hydrate from DB once per project ------------------------------------------
  // Also re-hydrate when systemPrefix changes (for multi-system support)
  useEffect(() => {
    if (!enabled || !projectUuid) return;

    console.log(`🔄 [useEquipmentSection] Starting hydration for ${typeKey} (systemPrefix: ${systemPrefix || 'none'})`);

    let alive = true;
    hydratingRef.current = true;
    setLoadingData(true);

    fetchRef
      .current(projectUuid)
      .then((db) => {
        if (!alive) return;

        if (!db) {
          // nothing in DB; mark as hydrated so later user edits can save
          hydratedOnceRef.current = true;
          hydratedPayloadRef.current = null;
          return;
        }

        // Map DB → local state
        setLocalId((db as any).id);
        const next = mapRef.current(db);
        setState(next);

        console.log(`✅ [useEquipmentSection] Hydration complete for ${typeKey} (systemPrefix: ${systemPrefix || 'none'}):`, next);

        // Build a snapshot payload representing server values
        const payload = filterPayload(buildRef.current((db as any).id, next));
        hydratedPayloadRef.current = payload;
        hydratedOnceRef.current = true;
      })
      .finally(() => {
        // flip off after state commit tick
        setTimeout(() => {
          if (alive) {
            hydratingRef.current = false;
            setLoadingData(false);
          }
        }, 0);
      });

    return () => {
      alive = false;
    };
  }, [enabled, projectUuid, typeKey, systemPrefix]); // Include systemPrefix to re-hydrate on system switch

  // Load preferred equipment on mount -----------------------------------------
  useEffect(() => {
    const loadPreferred = async () => {
      if (!enabled || !companyUuid) return;

      setLoadingPreferred(true);
      try {
        const equipmentType = getEquipmentTypeForPreferred(typeKey);
        const preferred = await fetchPreferredEquipment(companyUuid, equipmentType);
        setPreferredEquipment(preferred);

        console.log(`[useEquipmentSection] Loaded ${preferred.length} preferred equipment for ${typeKey}`);

        // Auto-select default equipment if isNew=true and nothing selected
        const isNew = (state as any).isNew;
        const selectedMake = (state as any).selectedMake || (state as any).make;
        const selectedModel = (state as any).selectedModel || (state as any).model;

        if (isNew && preferred.length > 0 && !selectedMake && !selectedModel) {
          const autoSelect = getAutoSelectEquipment(preferred, isNew);
          if (autoSelect) {
            console.log(`[useEquipmentSection] Auto-selecting default equipment:`, autoSelect);
            // Update state with auto-selected equipment
            setState((prev) => ({
              ...prev,
              selectedMake: autoSelect.make,
              make: autoSelect.make,
              selectedModel: autoSelect.model,
              model: autoSelect.model,
            } as TState));
          }
        }
      } catch (error) {
        console.error(`[useEquipmentSection] Error loading preferred equipment for ${typeKey}:`, error);
      } finally {
        setLoadingPreferred(false);
      }
    };

    loadPreferred();
  }, [enabled, companyUuid, typeKey]);

  // Catalog: load makes once on demand (when enabled) -------------------------
  const loadMakes = useCallback(() => {
    if (!enabled || !companyUuid || hasLoadedMakes.current) return;
    hasLoadedMakes.current = true;

    setLoadingMakes(true);
    let alive = true;
    getMakes(typeKey)
      .then((list) => {
        if (!alive) return;
        const normalized = list.map(normalize);
        setAllMakes(normalized);

        // Apply preferred equipment filtering
        const isNew = (state as any).isNew;
        const selectedMake = (state as any).selectedMake || (state as any).make;

        const filtered = filterEquipmentByPreferred(
          normalized,
          allModels,
          preferredEquipment,
          isNew,
          selectedMake
        );

        setMakes(filtered.makes);

        logPreferredFiltering(
          `${typeKey} Makes`,
          isNew,
          preferredEquipment.length,
          filtered.makes.length,
          normalized.length,
          !!filtered.defaultMake
        );
      })
      .finally(() => {
        if (alive) setLoadingMakes(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled, companyUuid, typeKey, preferredEquipment, allModels]);

  // Track the current make in a ref to avoid re-creating the callback
  const currentMakeRef = useRef<string | undefined>();
  currentMakeRef.current = (state as any).selectedMakeValue;

  // Catalog: load models after a make is picked (when enabled) ----------------
  const loadModels = useCallback(() => {
    console.log(`[useEquipmentSection - ${typeKey}] 🚀 loadModels called. enabled: ${enabled}, makeUuid: "${currentMakeRef.current}", hasLoadedModels: ${hasLoadedModels.current}, loadingModels: ${loadingModels}, current models count: ${models.length}`);

    if (!enabled) {
      console.log(`[useEquipmentSection - ${typeKey}] ❌ loadModels aborted - not enabled`);
      return;
    }
    const makeUuid = currentMakeRef.current;
    if (!makeUuid) {
      console.log(`[useEquipmentSection - ${typeKey}] ❌ loadModels aborted - no makeUuid`);
      return;
    }
    // Allow retry if hasLoadedModels is true BUT we have 0 models (empty result from API)
    if (hasLoadedModels.current && models.length > 0) {
      console.log(`[useEquipmentSection - ${typeKey}] ❌ loadModels aborted - already loaded with ${models.length} models`);
      return;
    }
    if (hasLoadedModels.current && models.length === 0) {
      console.log(`[useEquipmentSection - ${typeKey}] 🔄 Allowing retry - previous load returned 0 models`);
      hasLoadedModels.current = false; // Reset to allow retry
    }
    if (loadingModels) {
      console.log(`[useEquipmentSection - ${typeKey}] ❌ loadModels aborted - already loading`);
      return;
    }

    console.log(`[useEquipmentSection - ${typeKey}] ✅ Loading models for make: ${makeUuid}`);
    hasLoadedModels.current = true;
    setLoadingModels(true);
    let alive = true;
    getModels(typeKey, makeUuid)
      .then((list) => {
        if (!alive) return;
        // Don't re-normalize - getModels already returns normalized data with IDs
        setAllModels(list);

        // Apply preferred equipment filtering
        const isNew = (state as any).isNew;
        const selectedMake = (state as any).selectedMake || (state as any).make;

        const filtered = filterEquipmentByPreferred(
          allMakes,
          list,
          preferredEquipment,
          isNew,
          selectedMake
        );

        setModels(filtered.models);

        logPreferredFiltering(
          `${typeKey} Models`,
          isNew,
          preferredEquipment.length,
          filtered.models.length,
          list.length,
          !!filtered.defaultModel
        );
      })
      .finally(() => {
        if (alive) setLoadingModels(false);
      });

    return () => {
      alive = false;
    };
  }, [enabled, typeKey, preferredEquipment, allMakes, loadingModels, models.length]);

  // Log when loadModels callback dependencies change
  const prevLoadModelsDeps = useRef({ enabled, typeKey, preferredEquipment: preferredEquipment.length, allMakes: allMakes.length, loadingModels });
  useEffect(() => {
    const prev = prevLoadModelsDeps.current;
    const curr = { enabled, typeKey, preferredEquipment: preferredEquipment.length, allMakes: allMakes.length, loadingModels };

    if (prev.enabled !== curr.enabled || prev.typeKey !== curr.typeKey ||
        prev.preferredEquipment !== curr.preferredEquipment ||
        prev.allMakes !== curr.allMakes ||
        prev.loadingModels !== curr.loadingModels) {
      console.log(`[useEquipmentSection - ${typeKey}] 🔄 loadModels callback recreated due to dependency change:`, {
        enabled: prev.enabled !== curr.enabled ? `${prev.enabled} → ${curr.enabled}` : 'unchanged',
        typeKey: prev.typeKey !== curr.typeKey ? `${prev.typeKey} → ${curr.typeKey}` : 'unchanged',
        preferredEquipment: prev.preferredEquipment !== curr.preferredEquipment ? `array[${prev.preferredEquipment}] → array[${curr.preferredEquipment}]` : 'unchanged',
        allMakes: prev.allMakes !== curr.allMakes ? `array[${prev.allMakes}] → array[${curr.allMakes}]` : 'unchanged',
        loadingModels: prev.loadingModels !== curr.loadingModels ? `${prev.loadingModels} → ${curr.loadingModels}` : 'unchanged',
      });
      prevLoadModelsDeps.current = curr;
    }
  }, [enabled, typeKey, preferredEquipment, allMakes, loadingModels]);

  // Reset models whenever a different make is picked --------------------------
  const prevMakeRef = useRef<string | undefined>();
  useEffect(() => {
    const currentMake = (state as any).selectedMakeValue;
    const currentModel = (state as any).selectedModelValue;
    console.log(`[useEquipmentSection - ${typeKey}] 🔍 Make effect triggered. Make: "${prevMakeRef.current}" → "${currentMake}", Model: "${currentModel}", Models count: ${models.length}, hasLoadedModels: ${hasLoadedModels.current}`);

    // Only reset models if the make value actually changed, not on initial mount
    if (currentMake !== prevMakeRef.current && prevMakeRef.current !== undefined) {
      console.log(`[useEquipmentSection - ${typeKey}] ⚠️ CLEARING MODELS - Make changed from "${prevMakeRef.current}" to "${currentMake}"`);
      setModels([]);
      hasLoadedModels.current = false;
    }
    prevMakeRef.current = currentMake;
  }, [(state as any).selectedMakeValue]);

  // Debounced save with diff & hydration guard --------------------------------
  const debouncedSave = useRef(
    debounce(
      (isEnabled: boolean, proj: string, id: string | undefined, s: TState) => {
        console.log("[useEquipmentSection] debouncedSave called:", { isEnabled, proj, id, hydratingRef: hydratingRef.current });
        if (!isEnabled || hydratingRef.current) {
          console.log("[useEquipmentSection] Save skipped - disabled or hydrating");
          return;
        }

        const built = buildRef.current(id, s);
        const filtered = filterPayload(built);
        console.log("[useEquipmentSection] Payload built:", { built, filtered });
        if (!Object.keys(filtered).length) {
          console.log("[useEquipmentSection] Save skipped - empty payload");
          return;
        }

        // If we haven't hydrated at least once, avoid writing initial empties.
        // BUT allow saving if we have meaningful default values (like isNew: true)
        if (!hydratedOnceRef.current) {
          // Check if payload contains meaningful default values
          const hasMeaningfulDefaults = Object.entries(filtered).some(([key, value]) => {
            // Allow boolean values (like isNew: true/false) and non-empty strings/numbers
            return typeof value === 'boolean' ||
                   (typeof value === 'string' && value.trim() !== '') ||
                   (typeof value === 'number' && value !== 0);
          });

          if (!hasMeaningfulDefaults) return;
        }

        // Skip if equal to the last hydrated snapshot (no-op echo).
        // But only if we actually have hydrated data to compare against
        if (hydratedPayloadRef.current && shallowEqual(filtered, hydratedPayloadRef.current)) {
          console.log("[useEquipmentSection] Save skipped - equals hydrated payload");
          return;
        }

        // Skip if equal to the last payload we already sent.
        if (shallowEqual(filtered, lastSavedPayloadRef.current)) {
          console.log("[useEquipmentSection] Save skipped - equals last saved payload");
          return;
        }

        // Choose endpoint based on presence of nulls
        const containsNull = Object.values(built).some((v) => v === null);
        console.log("[useEquipmentSection] Saving payload:", { filtered, containsNull });

        const p = containsNull
          ? saveSystemDetailsPartialExact(proj, filtered)
          : saveSystemDetailsPartial(proj, filtered);

        // Optimistically remember what we attempted to send to dedupe repeats.
        lastSavedPayloadRef.current = filtered;

        p.then((response: any) => {
          if (response?.status === 200) {
            showNotification("Data Saved", "success");
          }
        }).catch(() => {
          showNotification("Error saving data", "error");
          // Revert lastSavedPayloadRef on error so it can retry
          lastSavedPayloadRef.current = null;
        });
      },
      600 // a bit tighter than before; UI still feels snappy
    )
  ).current;

  // Track if component is mounted to flush on unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Flush any pending saves when component unmounts to prevent data loss
      debouncedSave.flush();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !projectUuid) return;

    console.log("[useEquipmentSection] State changed, triggering debounced save:", { enabled, projectUuid, localId, state });
    debouncedSave(enabled, projectUuid, localId, state);
    return () => {
      // Only cancel if not unmounting - we want to flush on unmount
      if (mountedRef.current) {
        debouncedSave.cancel();
      }
    };
  }, [enabled, projectUuid, localId, state]); // debouncedSave is stable via ref

  // Log models array reference changes
  const prevModelsRef = useRef(models);
  if (prevModelsRef.current !== models) {
    console.log(`[useEquipmentSection - ${typeKey}] 🔄 Models array reference changed. Length: ${prevModelsRef.current.length} → ${models.length}`);
    prevModelsRef.current = models;
  }

  return {
    state,
    setState,
    makes,
    models,
    loadingMakes,
    loadingModels,
    loadingData,
    loadMakes,
    loadModels,
  };
}

// Helpers ---------------------------------------------------------------------

/** Keep `null`, drop `undefined` and empty string. */
function filterPayload(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj).reduce<Record<string, any>>((acc, [k, v]) => {
    if (v !== undefined && v !== "") acc[k] = v; // keep nulls
    return acc;
  }, {});
}

function shallowEqual(
  a: Record<string, any> | null,
  b: Record<string, any> | null
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

// Normalize utility: prefers `item.model`, then name/label/manufacturer
function normalize(item: any): { label: string; value: string } {
  if (typeof item === "string") return { label: item, value: item };
  const label =
    item.model ?? item.name ?? item.label ?? item.manufacturer ?? "";
  const value = item.uuid ?? label;
  return { label, value };
}
