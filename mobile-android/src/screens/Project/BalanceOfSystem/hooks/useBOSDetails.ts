// src/screens/Project/BalanceOfSystem/hooks/useBOSDetails.ts

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import type { DebouncedFunc } from "lodash";
import {
  fetchSystemDetails,
  saveBOSType1,
  saveBOSType2,
  saveBOSType3,
  saveBOSVisibility,
} from "../services/bosPersistence";

/** Stable wrapper for possibly-changing function refs (from SystemDetails pattern) */
function useStableFn<T extends (...args: any[]) => any>(fn?: T) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  // identity never changes
  return useCallback((...args: any[]) => fnRef.current?.(...args), []);
}

function useDebounced<T extends (...a: any[]) => any>(
  fn: T,
  ms = 400
): DebouncedFunc<T> {
  const ref = useRef<DebouncedFunc<T>>(debounce(fn, ms) as DebouncedFunc<T>);
  useEffect(() => () => ref.current.cancel(), []);
  return ref.current;
}

// Helper function to extract dynamic values based on system prefix
function extractDynamicValue(data: any, baseField: string, systemPrefix: string): any {
  // For BOS fields, replace bos_sys1_ with bos_sys2_, bos_sys3_, etc.
  // baseField format: "bos_sys1_type1_equipment_type"
  // systemPrefix format: "sys1_", "sys2_", "sys3_", "sys4_"
  const sysNumber = systemPrefix.replace(/[^0-9]/g, ''); // Extract just the number (1, 2, 3, 4)
  const dynamicField = baseField.replace(/sys1/, `sys${sysNumber}`);
  return data?.[dynamicField];
}

export function useBOSDetails(projectUuid?: string, systemPrefix: string = "sys1_") {
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<any | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // BOS Type 1 state
  const [type1, setType1] = useState({
    equipmentType: "",
    make: "",
    model: "",
    ampRating: "",
    isNew: true,
    active: false,
  });

  // BOS Type 2 state
  const [type2, setType2] = useState({
    equipmentType: "",
    make: "",
    model: "",
    ampRating: "",
    isNew: true,
    active: false,
  });

  // BOS Type 3 state
  const [type3, setType3] = useState({
    equipmentType: "",
    make: "",
    model: "",
    ampRating: "",
    isNew: true,
    active: false,
  });

  // UI visibility state
  const [visibility, setVisibility] = useState({
    showType1: false,
    showType2: false,
    showType3: false,
  });

  // Load baseline data
  useEffect(() => {
    if (!projectUuid) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchSystemDetails(projectUuid);
        if (cancelled) return;
        setRow(data ?? null);

        const r = data ?? {};

        // Type 1 - use systemPrefix for dynamic field access
        setType1({
          equipmentType: extractDynamicValue(r, 'bos_sys1_type1_equipment_type', systemPrefix) ?? "",
          make: extractDynamicValue(r, 'bos_sys1_type1_make', systemPrefix) ?? "",
          model: extractDynamicValue(r, 'bos_sys1_type1_model', systemPrefix) ?? "",
          ampRating: extractDynamicValue(r, 'bos_sys1_type1_amp_rating', systemPrefix) ?? "",
          isNew: extractDynamicValue(r, 'bos_sys1_type1_is_new', systemPrefix) ?? true,
          active: extractDynamicValue(r, 'bos_sys1_type1_active', systemPrefix) ?? false,
        });

        // Type 2 - use systemPrefix for dynamic field access
        setType2({
          equipmentType: extractDynamicValue(r, 'bos_sys1_type2_equipment_type', systemPrefix) ?? "",
          make: extractDynamicValue(r, 'bos_sys1_type2_make', systemPrefix) ?? "",
          model: extractDynamicValue(r, 'bos_sys1_type2_model', systemPrefix) ?? "",
          ampRating: extractDynamicValue(r, 'bos_sys1_type2_amp_rating', systemPrefix) ?? "",
          isNew: extractDynamicValue(r, 'bos_sys1_type2_is_new', systemPrefix) ?? true,
          active: extractDynamicValue(r, 'bos_sys1_type2_active', systemPrefix) ?? false,
        });

        // Type 3 - use systemPrefix for dynamic field access
        setType3({
          equipmentType: extractDynamicValue(r, 'bos_sys1_type3_equipment_type', systemPrefix) ?? "",
          make: extractDynamicValue(r, 'bos_sys1_type3_make', systemPrefix) ?? "",
          model: extractDynamicValue(r, 'bos_sys1_type3_model', systemPrefix) ?? "",
          ampRating: extractDynamicValue(r, 'bos_sys1_type3_amp_rating', systemPrefix) ?? "",
          isNew: extractDynamicValue(r, 'bos_sys1_type3_is_new', systemPrefix) ?? true,
          active: extractDynamicValue(r, 'bos_sys1_type3_active', systemPrefix) ?? false,
        });

        // Visibility - use systemPrefix for dynamic field access
        setVisibility({
          showType1: extractDynamicValue(r, 'bos_sys1_show_type1', systemPrefix) ?? false,
          showType2: extractDynamicValue(r, 'bos_sys1_show_type2', systemPrefix) ?? false,
          showType3: extractDynamicValue(r, 'bos_sys1_show_type3', systemPrefix) ?? false,
        });
      } catch (error) {
        console.error(`[useBOSDetails ${systemPrefix}] Error loading data:`, error);
        // Don't show toast on initial load errors - let the UI handle it
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHasMounted(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectUuid, systemPrefix]);

  // Debounced writers
  const dType1 = useDebounced(saveBOSType1);
  const dType2 = useDebounced(saveBOSType2);
  const dType3 = useDebounced(saveBOSType3);
  const dVisibility = useDebounced(saveBOSVisibility);

  // Stable update functions (prevents infinite re-renders)
  const update = useMemo(() => ({
    // Type 1 updaters
    type1: {
      equipmentType: (v: string) => {
        if (!hasMounted) return; // Prevent saves during initial hydration
        setType1((s) => ({ ...s, equipmentType: v }));
        if (projectUuid) dType1(projectUuid, { equipmentType: v }, systemPrefix);
      },
      make: (v: string) => {
        if (!hasMounted) return;
        setType1((s) => ({ ...s, make: v }));
        if (projectUuid) dType1(projectUuid, { make: v }, systemPrefix);
      },
      model: (v: string) => {
        if (!hasMounted) return;
        setType1((s) => ({ ...s, model: v }));
        if (projectUuid) dType1(projectUuid, { model: v }, systemPrefix);
      },
      ampRating: (v: string) => {
        if (!hasMounted) return;
        setType1((s) => ({ ...s, ampRating: v }));
        if (projectUuid) dType1(projectUuid, { ampRating: v }, systemPrefix);
      },
      isNew: (v: boolean) => {
        if (!hasMounted) return;
        setType1((s) => ({ ...s, isNew: v }));
        if (projectUuid) dType1(projectUuid, { isNew: v }, systemPrefix);
      },
      active: (v: boolean) => {
        if (!hasMounted) return;
        setType1((s) => ({ ...s, active: v }));
        if (projectUuid) dType1(projectUuid, { active: v }, systemPrefix);
      },
    },

    // Type 2 updaters
    type2: {
      equipmentType: (v: string) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, equipmentType: v }));
        if (projectUuid) dType2(projectUuid, { equipmentType: v }, systemPrefix);
      },
      make: (v: string) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, make: v }));
        if (projectUuid) dType2(projectUuid, { make: v }, systemPrefix);
      },
      model: (v: string) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, model: v }));
        if (projectUuid) dType2(projectUuid, { model: v }, systemPrefix);
      },
      ampRating: (v: string) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, ampRating: v }));
        if (projectUuid) dType2(projectUuid, { ampRating: v }, systemPrefix);
      },
      isNew: (v: boolean) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, isNew: v }));
        if (projectUuid) dType2(projectUuid, { isNew: v }, systemPrefix);
      },
      active: (v: boolean) => {
        if (!hasMounted) return;
        setType2((s) => ({ ...s, active: v }));
        if (projectUuid) dType2(projectUuid, { active: v }, systemPrefix);
      },
    },

    // Type 3 updaters
    type3: {
      equipmentType: (v: string) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, equipmentType: v }));
        if (projectUuid) dType3(projectUuid, { equipmentType: v }, systemPrefix);
      },
      make: (v: string) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, make: v }));
        if (projectUuid) dType3(projectUuid, { make: v }, systemPrefix);
      },
      model: (v: string) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, model: v }));
        if (projectUuid) dType3(projectUuid, { model: v }, systemPrefix);
      },
      ampRating: (v: string) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, ampRating: v }));
        if (projectUuid) dType3(projectUuid, { ampRating: v }, systemPrefix);
      },
      isNew: (v: boolean) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, isNew: v }));
        if (projectUuid) dType3(projectUuid, { isNew: v }, systemPrefix);
      },
      active: (v: boolean) => {
        if (!hasMounted) return;
        setType3((s) => ({ ...s, active: v }));
        if (projectUuid) dType3(projectUuid, { active: v }, systemPrefix);
      },
    },

    // Visibility updaters
    visibility: {
      showType1: (v: boolean) => {
        setVisibility((s) => ({ ...s, showType1: v }));
        if (projectUuid && hasMounted) dVisibility(projectUuid, { showType1: v }, systemPrefix);
      },
      showType2: (v: boolean) => {
        setVisibility((s) => ({ ...s, showType2: v }));
        if (projectUuid && hasMounted) dVisibility(projectUuid, { showType2: v }, systemPrefix);
      },
      showType3: (v: boolean) => {
        setVisibility((s) => ({ ...s, showType3: v }));
        if (projectUuid && hasMounted) dVisibility(projectUuid, { showType3: v }, systemPrefix);
      },
    },
  }), [projectUuid, hasMounted, dType1, dType2, dType3, dVisibility, systemPrefix]);

  return {
    loading,
    type1,
    type2,
    type3,
    visibility,
    update,
    row,
  };
}