import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import {
  fetchSystemDetails,
  saveMountingHardwareA,
  saveMountingHardwareB,
  saveRoofA,
  saveRoofB,
  saveMountingPlane,
  clearMountingPlane,
  PlaneArgs,
} from "../services/structuralPersistence";

type FramingType = "Truss" | "Rafter" | "";
type ModeType = "Flush" | "Tilt" | "Ground" | "";

function useDebounced<T extends (...a: any[]) => any>(fn: T, ms = 400) {
  const ref = useRef(debounce(fn, ms));
  useEffect(() => () => ref.current.cancel(), []);
  return ((...args: any[]) => ref.current(...args)) as T;
}

export function useStructuralDetails(projectUuid?: string) {
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<any | null>(null);

  // Mounting Hardware A
  const [mha, setMha] = useState({
    railMake: "",
    railModel: "",
    attachMake: "",
    attachModel: "",
  });

  // Mounting Hardware B
  const [mhb, setMhb] = useState({
    railMake: "",
    railModel: "",
    attachMake: "",
    attachModel: "",
  });

  // Roofing A
  const [roofA, setRoofA] = useState({
    material: "",
    framingSize: "",
    areaSqFt: "",
    framingSpacing: "",
    framingType: "" as FramingType,
  });

  // Roofing B
  const [roofB, setRoofB] = useState({
    material: "",
    framingSize: "",
    areaSqFt: "",
    framingSpacing: "",
    framingType: "" as FramingType,
  });

  // Mounting Planes [1..10]
  type PlaneState = {
    mode: ModeType;
    stories: string;
    pitch: string;
    azimuth: string;
    qty1: string;
    qty2: string;
    qty3: string;
    qty4: string;
    qty5: string;
    qty6: string;
    qty7: string;
    qty8: string;
    roof_type: "A" | "B" | "";
  };
  const emptyPlane = (): PlaneState => ({
    mode: "",
    stories: "",
    pitch: "",
    azimuth: "",
    qty1: "",
    qty2: "",
    qty3: "",
    qty4: "",
    qty5: "",
    qty6: "",
    qty7: "",
    qty8: "",
    roof_type: "A", // Default to 'A'
  });
  const [planes, setPlanes] = useState<PlaneState[]>(
    Array.from({ length: 10 }, () => emptyPlane())
  );

  // load baseline
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

        // MHA
        setMha({
          railMake: r.rta_rail_make ?? "",
          railModel: r.rta_rail_model ?? "",
          attachMake: r.rta_attachment_make ?? "",
          attachModel: r.rta_attachment_model ?? "",
        });

        // MHB
        setMhb({
          railMake: r.rtb_rail_make ?? "",
          railModel: r.rtb_rail_model ?? "",
          attachMake: r.rtb_attachment_make ?? "",
          attachModel: r.rtb_attachment_model ?? "",
        });

        // Roof A
        setRoofA({
          material: r.rta_roofing_material ?? "",
          framingSize: r.rta_framing_size ?? "",
          areaSqFt: (r.st_roof_a_area_sqft ?? "").toString(),
          framingSpacing: r.rta_framing_spacing ?? "",
          framingType: r.st_roof_a_framing_type ?? "",
        });

        // Roof B
        setRoofB({
          material: r.rtb_roofing_material ?? "",
          framingSize: r.rtb_framing_size ?? "",
          areaSqFt: (r.st_roof_b_area_sqft ?? "").toString(),
          framingSpacing: r.rtb_framing_spacing ?? "",
          framingType: r.st_roof_b_framing_type ?? "",
        });

        // Planes 1..10
        const next: PlaneState[] = [];
        for (let i = 1; i <= 10; i++) {
          next.push({
            mode: r[`st_mp${i}_mode`] ?? "",
            stories: (r[`mp${i}_stories`] ?? "").toString(),
            pitch: (r[`mp${i}_pitch`] ?? "").toString(),
            azimuth: (r[`mp${i}_azimuth`] ?? "").toString(),
            qty1: (r[`st_mp${i}_arrayqty_1`] ?? "").toString(),
            qty2: (r[`st_mp${i}_arrayqty_2`] ?? "").toString(),
            qty3: (r[`st_mp${i}_arrayqty_3`] ?? "").toString(),
            qty4: (r[`st_mp${i}_arrayqty_4`] ?? "").toString(),
            qty5: (r[`st_mp${i}_arrayqty_5`] ?? "").toString(),
            qty6: (r[`st_mp${i}_arrayqty_6`] ?? "").toString(),
            qty7: (r[`st_mp${i}_arrayqty_7`] ?? "").toString(),
            qty8: (r[`st_mp${i}_arrayqty_8`] ?? "").toString(),
            roof_type: r[`mp${i}_roof_type`] ?? "A", // Default to 'A' if not set
          });
        }
        setPlanes(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  // debounced writers
  const dMHA = useDebounced(saveMountingHardwareA);
  const dMHB = useDebounced(saveMountingHardwareB);
  const dRoofA = useDebounced(saveRoofA);
  const dRoofB = useDebounced(saveRoofB);
  const dPlane = useDebounced(saveMountingPlane);

  // updaters
  const update = {
    // MHA
    mha: {
      railMake: (v: string) => {
        setMha((s) => ({ ...s, railMake: v }));
        if (projectUuid) dMHA(projectUuid, { railMake: v });
      },
      railModel: (v: string) => {
        setMha((s) => ({ ...s, railModel: v }));
        if (projectUuid) dMHA(projectUuid, { railModel: v });
      },
      attachMake: (v: string) => {
        setMha((s) => ({ ...s, attachMake: v }));
        if (projectUuid) dMHA(projectUuid, { attachMake: v });
      },
      attachModel: (v: string) => {
        setMha((s) => ({ ...s, attachModel: v }));
        if (projectUuid) dMHA(projectUuid, { attachModel: v });
      },
    },
    // MHB
    mhb: {
      railMake: (v: string) => {
        setMhb((s) => ({ ...s, railMake: v }));
        if (projectUuid) dMHB(projectUuid, { railMake: v });
      },
      railModel: (v: string) => {
        setMhb((s) => ({ ...s, railModel: v }));
        if (projectUuid) dMHB(projectUuid, { railModel: v });
      },
      attachMake: (v: string) => {
        setMhb((s) => ({ ...s, attachMake: v }));
        if (projectUuid) dMHB(projectUuid, { attachMake: v });
      },
      attachModel: (v: string) => {
        setMhb((s) => ({ ...s, attachModel: v }));
        if (projectUuid) dMHB(projectUuid, { attachModel: v });
      },
    },
    // RoofA
    roofA: {
      material: (v: string) => {
        setRoofA((s) => ({ ...s, material: v }));
        if (projectUuid) dRoofA(projectUuid, { material: v });
      },
      framingSize: (v: string) => {
        setRoofA((s) => ({ ...s, framingSize: v }));
        if (projectUuid) dRoofA(projectUuid, { framingSize: v });
      },
      areaSqFt: (v: string) => {
        setRoofA((s) => ({ ...s, areaSqFt: v }));
        if (projectUuid) dRoofA(projectUuid, { areaSqFt: v });
      },
      framingSpacing: (v: string) => {
        setRoofA((s) => ({ ...s, framingSpacing: v }));
        if (projectUuid) dRoofA(projectUuid, { framingSpacing: v });
      },
      framingType: (v: FramingType) => {
        setRoofA((s) => ({ ...s, framingType: v }));
        if (projectUuid) dRoofA(projectUuid, { framingType: v });
      },
    },
    // RoofB
    roofB: {
      material: (v: string) => {
        setRoofB((s) => ({ ...s, material: v }));
        if (projectUuid) dRoofB(projectUuid, { material: v });
      },
      framingSize: (v: string) => {
        setRoofB((s) => ({ ...s, framingSize: v }));
        if (projectUuid) dRoofB(projectUuid, { framingSize: v });
      },
      areaSqFt: (v: string) => {
        setRoofB((s) => ({ ...s, areaSqFt: v }));
        if (projectUuid) dRoofB(projectUuid, { areaSqFt: v });
      },
      framingSpacing: (v: string) => {
        setRoofB((s) => ({ ...s, framingSpacing: v }));
        if (projectUuid) dRoofB(projectUuid, { framingSpacing: v });
      },
      framingType: (v: FramingType) => {
        setRoofB((s) => ({ ...s, framingType: v }));
        if (projectUuid) dRoofB(projectUuid, { framingType: v });
      },
    },
    // Plane n (1..10)
    plane: (
      n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
      field: keyof PlaneState,
      v: string | ModeType
    ) => {
      setPlanes((prev) => {
        const copy = [...prev];
        copy[n - 1] = { ...copy[n - 1], [field]: v as any };
        return copy;
      });
      if (!projectUuid) return;

      const args: PlaneArgs = {};
      if (field === "mode") args.mode = v as ModeType;
      if (field === "stories") args.stories = v as string;
      if (field === "pitch") args.pitch = v as string;
      if (field === "azimuth") args.azimuth = v as string;
      if (field === "roof_type") args.roof_type = v as "A" | "B" | "";
      if (field.startsWith("qty")) (args as any)[field] = v;

      dPlane(projectUuid, n, args);
    },
    // Clear a plane in DB + local (MP1 or others)
    clearPlane: async (n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
      setPlanes((prev) => {
        const copy = [...prev];
        copy[n - 1] = emptyPlane();
        return copy;
      });
      if (projectUuid) await clearMountingPlane(projectUuid, n);
    },
  };

  return {
    loading,
    row,
    mha,
    mhb,
    roofA,
    roofB,
    planes, // planes[0] = MP1 … planes[9] = MP10
    update,
  };
}
