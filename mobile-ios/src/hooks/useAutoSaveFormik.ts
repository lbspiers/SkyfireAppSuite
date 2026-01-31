// src/hooks/useAutoSaveFormik.ts
import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import { FormikProps } from "formik";
import { DEBUG_MODE, writeDebugLog } from "../utils/debugTools";

/**
 * Custom hook to autosave Formik values intelligently
 * @param formikRef - Ref to Formik
 * @param onSave - Function to save form values
 * @param debounceMs - Debounce time in milliseconds (default 800ms)
 * @param isPaused - Optional flag to pause autosave (useful during Formik hydration)
 */
export function useAutoSaveFormik<T>(
  formikRef: React.RefObject<FormikProps<T>>,
  onSave: (values: T) => Promise<void>,
  debounceMs = 800,
  isPaused = false
) {
  const lastSavedValues = useRef<T | null>(null);

  useEffect(() => {
    if (!formikRef.current) return;
    const formik = formikRef.current;

    const debouncedSave = debounce(async () => {
      const currentValues = formik.values;
      if (!currentValues || isPaused) {
        if (DEBUG_MODE && isPaused)
          writeDebugLog("⏸️ AutoSave paused during hydration");
        return;
      }

      const isDirty = formik.dirty;
      const hasChanges =
        JSON.stringify(currentValues) !==
        JSON.stringify(lastSavedValues.current);

      if (isDirty && hasChanges) {
        try {
          if (DEBUG_MODE) writeDebugLog("💾 AutoSave triggered");
          await onSave(currentValues);
          lastSavedValues.current = currentValues;
        } catch (err) {
          console.error("❌ Auto-save error:", err);
          if (DEBUG_MODE) writeDebugLog(`❌ Auto-save error: ${err}`);
        }
      }
    }, debounceMs);

    debouncedSave();

    return () => {
      debouncedSave.cancel();
    };
  }, [formikRef, onSave, debounceMs, isPaused]);

  useEffect(() => {
    if (!formikRef.current) return;
    const formik = formikRef.current;

    const debouncedSave = debounce(async () => {
      const currentValues = formik.values;
      if (!currentValues || isPaused) {
        if (DEBUG_MODE && isPaused)
          writeDebugLog("⏸️ AutoSave skipped on value change due to pause");
        return;
      }

      const isDirty = formik.dirty;
      const hasChanges =
        JSON.stringify(currentValues) !==
        JSON.stringify(lastSavedValues.current);

      if (isDirty && hasChanges) {
        try {
          if (DEBUG_MODE) writeDebugLog("💾 AutoSave (value change)");
          await onSave(currentValues);
          lastSavedValues.current = currentValues;
        } catch (err) {
          console.error("❌ Auto-save error:", err);
          if (DEBUG_MODE) writeDebugLog(`❌ Auto-save error: ${err}`);
        }
      }
    }, debounceMs);

    debouncedSave();

    return () => {
      debouncedSave.cancel();
    };
  }, [formikRef.current?.values, isPaused]);
}
