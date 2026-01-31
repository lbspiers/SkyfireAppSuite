// src/screens/Project/structural/hooks/usePlanesManager.ts
import { useMemo } from "react";

type PlaneVM = {
  mode: string;
  stories: string;
  pitch: string;
  azimuth: string;
  qty1?: string;
  qty2?: string;
  qty3?: string;
  qty4?: string;
  qty5?: string;
  qty6?: string;
  qty7?: string;
  qty8?: string;
};

type UpdateApi = {
  // already exposed from useStructuralDetails
  plane: (
    index1to10: number,
    field:
      | "mode"
      | "stories"
      | "pitch"
      | "azimuth"
      | "qty1"
      | "qty2"
      | "qty3"
      | "qty4"
      | "qty5"
      | "qty6"
      | "qty7"
      | "qty8",
    value: any
  ) => void;
  clearPlane?: (index1to10: number) => Promise<void>; // optional convenience your svc can provide
};

export function usePlanesManager(planes: PlaneVM[], update: UpdateApi) {
  // A plane is considered “active” if it has a mode or any qty
  const isActive = (p?: PlaneVM) =>
    !!p?.mode ||
    !!p?.qty1 ||
    !!p?.qty2 ||
    !!p?.qty3 ||
    !!p?.qty4 ||
    !!p?.qty5 ||
    !!p?.qty6 ||
    !!p?.qty7 ||
    !!p?.qty8;

  const visibleCount = useMemo(() => {
    // Always show at least 1. Then include consecutive planes while active.
    let count = 1;
    for (let i = 0; i < Math.min(10, planes.length); i++) {
      if (i === 0 || isActive(planes[i])) count = i + 1;
      else break;
    }
    return Math.min(count, 10);
  }, [planes]);

  const canAdd = visibleCount < 10;

  // Persist minimal “enable” by setting a default mode on the next plane
  const addNext = () => {
    if (!canAdd) return;
    const nextIndex = visibleCount + 1; // 2..10 (1-based)
    update.plane(nextIndex, "mode", "Flush"); // or "Ground" if that’s your default
  };

  const remove = async (index1to10: number) => {
    if (index1to10 <= 1 || index1to10 > 10) return; // keep MP1 always present
    if (update.clearPlane) {
      await update.clearPlane(index1to10);
    } else {
      // Fallback: clear by writing empty strings/nulls
      (
        [
          "mode",
          "stories",
          "pitch",
          "azimuth",
          "qty1",
          "qty2",
          "qty3",
          "qty4",
          "qty5",
          "qty6",
          "qty7",
          "qty8",
        ] as const
      ).forEach((f) => update.plane(index1to10, f, ""));
    }
  };

  return {
    visibleCount,
    canAdd,
    addNext,
    remove,
  };
}
