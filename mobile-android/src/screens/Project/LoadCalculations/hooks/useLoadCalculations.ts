// src/screens/Project/LoadCalculations/hooks/useLoadCalculations.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { AdditionalLoad } from "../sections/AdditionalBreakersSection";
import {
  fetchLoadCalculations,
  saveLoadCalculations,
  clearLoadCalculations as clearLoadCalculationsService,
  PanelType,
} from "../services/loadCalculations.service";
import { fetchSystemDetails } from "../../../../api/systemDetails.service";

export interface LoadCalculationsValues {
  // Floor Area
  floorArea: string;

  // Breaker Quantities
  smallApplianceCircuits: string;
  bathroomCircuits: string;
  laundryCircuits: string;

  // Breaker Amp Ratings
  hvacAirHandler: string;
  electricalFurnace: string;
  electricVehicle: string;

  // Additional 2-Pole Breakers
  additionalLoads: AdditionalLoad[];
}

export interface LoadCalculationsErrors {
  floorArea?: string;
  smallApplianceCircuits?: string;
  bathroomCircuits?: string;
  laundryCircuits?: string;
  hvacAirHandler?: string;
  electricalFurnace?: string;
  electricVehicle?: string;
  [key: string]: string | undefined;
}

const initialValues: LoadCalculationsValues = {
  floorArea: "",
  smallApplianceCircuits: "",
  bathroomCircuits: "",
  laundryCircuits: "",
  hvacAirHandler: "",
  electricalFurnace: "",
  electricVehicle: "",
  additionalLoads: [
    // Start with 4 empty rows (users can add more up to 17 for MPA or 20 for SPB)
    { id: "load-1", name: "", amps: "" },
    { id: "load-2", name: "", amps: "" },
    { id: "load-3", name: "", amps: "" },
    { id: "load-4", name: "", amps: "" },
  ],
};

interface UseLoadCalculationsParams {
  projectId?: string;
  companyId?: string;
  panelType?: string;
}

export function useLoadCalculations({
  projectId,
  companyId,
  panelType,
}: UseLoadCalculationsParams) {
  const [values, setValues] = useState<LoadCalculationsValues>(initialValues);
  const [errors, setErrors] = useState<LoadCalculationsErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Determine panel type for backend field mapping
  const getPanelType = (): PanelType => {
    if (panelType === "Sub Panel B" || panelType?.includes("Sub Panel")) {
      return "Sub Panel B";
    }
    return "Main Panel A"; // default
  };

  // Load existing data on mount
  useEffect(() => {
    if (projectId && companyId && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadExistingData();
    }
  }, [projectId, companyId]);

  const loadExistingData = async () => {
    if (!projectId || !companyId) {
      console.warn("[LoadCalculations] Missing projectId or companyId");
      return;
    }

    setIsLoading(true);
    setSaveError(null);

    try {
      console.log(`[LoadCalculations] Loading data for ${getPanelType()}`);

      // Fetch both load calculations data and system details in parallel
      const [loadCalcData, systemData] = await Promise.all([
        fetchLoadCalculations(projectId, companyId, getPanelType()),
        fetchSystemDetails(projectId),
      ]);

      // Prepare the values object
      let loadedValues = { ...initialValues };

      // If load calculations data exists, use it
      if (loadCalcData) {
        loadedValues = loadCalcData;
        console.log("[LoadCalculations] Load calc data loaded successfully");
      } else {
        console.log("[LoadCalculations] No existing load calc data, using defaults");
      }

      // If floorArea is empty but house_sqft exists in system-details, use it
      if ((!loadedValues.floorArea || loadedValues.floorArea.trim() === "") && systemData?.house_sqft) {
        loadedValues.floorArea = String(systemData.house_sqft);
        console.log("[LoadCalculations] Hydrated floorArea from system-details house_sqft:", systemData.house_sqft);
      }

      setValues(loadedValues);
    } catch (error) {
      console.error("[LoadCalculations] Error loading data:", error);
      setSaveError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save function with debouncing
  const triggerAutoSave = useCallback(() => {
    if (!projectId || !companyId) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for 1.5 seconds
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);
      setHasUnsavedChanges(false);

      try {
        console.log(`[LoadCalculations] Auto-saving ${getPanelType()} data`);
        await saveLoadCalculations(
          projectId,
          companyId,
          values,
          getPanelType()
        );
        console.log("[LoadCalculations] Auto-save successful");
      } catch (error) {
        console.error("[LoadCalculations] Auto-save failed:", error);
        setSaveError("Failed to save changes");
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [projectId, companyId, values, panelType]);

  // Trigger auto-save whenever values change (after initial load)
  useEffect(() => {
    if (initialLoadRef.current && !isLoading) {
      setHasUnsavedChanges(true);
      triggerAutoSave();
    }
  }, [values, triggerAutoSave, isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is edited
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleDynamicLoadAdd = useCallback(() => {
    const newId = `load-${Date.now()}`;
    setValues((prev) => ({
      ...prev,
      additionalLoads: [
        ...prev.additionalLoads,
        { id: newId, name: "", amps: "" },
      ],
    }));
  }, []);

  const handleDynamicLoadRemove = useCallback((id: string) => {
    setValues((prev) => ({
      ...prev,
      additionalLoads: prev.additionalLoads.filter((load) => load.id !== id),
    }));

    // Clear errors for removed load
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`load_${id}_name`];
      delete newErrors[`load_${id}_amps`];
      return newErrors;
    });
  }, []);

  const handleDynamicLoadChange = useCallback(
    (id: string, field: "name" | "amps", value: string) => {
      setValues((prev) => ({
        ...prev,
        additionalLoads: prev.additionalLoads.map((load) =>
          load.id === id ? { ...load, [field]: value } : load
        ),
      }));

      // Clear error when field is edited
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`load_${id}_${field}`];
        return newErrors;
      });
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: LoadCalculationsErrors = {};

    // Floor Area is required
    if (!values.floorArea || values.floorArea.trim() === "") {
      newErrors.floorArea = "Floor area is required";
    }

    // Validate additional loads - if name is provided, amps must be provided
    values.additionalLoads.forEach((load) => {
      if (load.name && !load.amps) {
        newErrors[`load_${load.id}_amps`] = "Amps required";
      }
      if (load.amps && !load.name) {
        newErrors[`load_${load.id}_name`] = "Name required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const saveData = useCallback(
    async (skipValidation = false) => {
      if (!projectId || !companyId) {
        console.warn("[LoadCalculations] Cannot save: missing project info");
        return false;
      }

      if (!skipValidation && !validateForm()) {
        console.warn("[LoadCalculations] Validation failed");
        return false;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        console.log(`[LoadCalculations] Manually saving ${getPanelType()} data`);
        await saveLoadCalculations(
          projectId,
          companyId,
          values,
          getPanelType()
        );
        console.log("[LoadCalculations] Save successful");
        setHasUnsavedChanges(false);
        return true;
      } catch (error) {
        console.error("[LoadCalculations] Save failed:", error);
        setSaveError("Failed to save data");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, companyId, values, validateForm, panelType]
  );

  const clearData = useCallback(async () => {
    if (!projectId || !companyId) {
      console.warn("[LoadCalculations] Cannot clear: missing project info");
      return false;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log(`[LoadCalculations] Clearing ${getPanelType()} data`);
      await clearLoadCalculationsService(projectId, companyId, getPanelType());
      setValues(initialValues);
      setErrors({});
      setHasUnsavedChanges(false);
      console.log("[LoadCalculations] Clear successful");
      return true;
    } catch (error) {
      console.error("[LoadCalculations] Clear failed:", error);
      setSaveError("Failed to clear data");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId, companyId, panelType]);

  return {
    values,
    errors,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveError,
    handleFieldChange,
    handleDynamicLoadAdd,
    handleDynamicLoadRemove,
    handleDynamicLoadChange,
    validateForm,
    saveData,
    clearData,
    reloadData: loadExistingData,
  };
}
