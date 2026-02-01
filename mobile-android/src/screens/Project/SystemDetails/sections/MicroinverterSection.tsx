// src/screens/Project/SystemDetails/sections/MicroinverterSection.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text as RNText,
} from "react-native";
import { useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import EquipmentSection from "../../../../components/UI/EquipmentSection";
import InlineField from "../../../../components/UI/InlineField";
import InlineDropdown from "../../../../components/UI/InlineDropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { colors } from "../../../../theme/tokens/tokens";
import Button from "../../../../components/Button";
import InlineCustomStringing from "../../../../components/sections/InlineCustomStringing";
import InlineHoymilesStringing from "../../../../components/sections/InlineHoymilesStringing";
import { equipmentManufacturers } from "../../../../api/project.service";
import { GetModelNumber } from "../../../../api/inventry.service";
import { PreferredEquipment } from "../../../../api/preferredEquipment.service";
import {
  fetchPreferredEquipment,
  filterEquipmentByPreferred,
  getEquipmentTypeForPreferred,
  getAutoSelectEquipment,
  logPreferredFiltering,
} from "../../../../utils/preferredEquipmentHelper";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_INVERTER_PHOTO_TAGS, HOYMILES_STRINGING_SPECS } from "../../../../utils/constants";
import { equipmentCacheManager } from "../../../../utils/equipmentCacheManager";
import { moderateScale, verticalScale, widthPercentageToDP as wp } from "../../../../utils/responsive";

const pencilIcon = require("../../../../assets/Images/icons/pencil_icon_white.png");
const requiredFields = ["selectedMake", "selectedModel"] as const;

type Option = { label: string; value: string };

type Props = {
  values: {
    quantity: string;
    selectedMake: string;
    selectedModel: string;
    isNew: boolean;
    stringingType?: "auto" | "custom" | "";
  };
  onChange: (
    field: "quantity" | "selectedMake" | "selectedModel" | "isNew" | "stringingType",
    value: any
  ) => void;
  errors: Record<string, string>;
  label?: string;
  debugFetch?: boolean;
  onEditStringingNote?: () => void;

  // Combiner panel status and data
  hasCombinerPanel?: boolean;
  combinerMake?: string;
  combinerModel?: string;

  // Solar panel quantity for custom stringing
  solarPanelQuantity?: number;

  // Custom stringing branch fields (controlled by parent)
  branchString1?: string;
  branchString2?: string;
  branchString3?: string;
  branchString4?: string;
  branchString5?: string;
  branchString6?: string;
  onBranchStringChange?: (field: string, value: string) => void;

  // Individual microinverter panel quantities (for Hoymiles/APSystems granular tracking)
  micro1Panels?: string;
  micro2Panels?: string;
  micro3Panels?: string;
  micro4Panels?: string;
  micro5Panels?: string;
  micro6Panels?: string;
  micro7Panels?: string;
  micro8Panels?: string;
  micro9Panels?: string;
  micro10Panels?: string;
  micro11Panels?: string;
  micro12Panels?: string;
  micro13Panels?: string;
  micro14Panels?: string;
  micro15Panels?: string;
  micro16Panels?: string;
  micro17Panels?: string;
  micro18Panels?: string;
  micro19Panels?: string;
  micro20Panels?: string;
  micro21Panels?: string;
  micro22Panels?: string;
  micro23Panels?: string;
  micro24Panels?: string;
  micro25Panels?: string;
  onMicroPanelChange?: (field: string, value: string) => void;

  // OPTIONAL: if the parent supplies catalogs, we'll use them.
  makes?: Option[];
  models?: Option[];
  loadMakes?: () => void;
  loadModels?: () => void;
  loadingMakes?: boolean;
  loadingModels?: boolean;
  isLoading?: boolean;

  // Navigation hint from Equipment page with pre-loaded model UUID
  microInverterHint?: {
    make: string;
    model: string; // Label from DB
    modelUUID?: string; // Pre-resolved UUID
    isHoymiles?: boolean;
    isAPSystems?: boolean;
  };
};

export default function MicroinverterSection({
  values,
  onChange,
  errors,
  label = "Microinverter",
  debugFetch = true,
  onEditStringingNote,

  // Combiner panel status and data
  hasCombinerPanel = false,
  combinerMake = "",
  combinerModel = "",

  // Solar panel quantity for custom stringing
  solarPanelQuantity = 0,

  // Custom stringing branch fields
  branchString1 = "",
  branchString2 = "",
  branchString3 = "",
  branchString4 = "",
  branchString5 = "",
  branchString6 = "",
  onBranchStringChange,

  // Individual microinverter panel quantities (for Hoymiles/APSystems granular tracking)
  micro1Panels = "",
  micro2Panels = "",
  micro3Panels = "",
  micro4Panels = "",
  micro5Panels = "",
  micro6Panels = "",
  micro7Panels = "",
  micro8Panels = "",
  micro9Panels = "",
  micro10Panels = "",
  micro11Panels = "",
  micro12Panels = "",
  micro13Panels = "",
  micro14Panels = "",
  micro15Panels = "",
  micro16Panels = "",
  micro17Panels = "",
  micro18Panels = "",
  micro19Panels = "",
  micro20Panels = "",
  micro21Panels = "",
  micro22Panels = "",
  micro23Panels = "",
  micro24Panels = "",
  micro25Panels = "",
  onMicroPanelChange,

  // external catalogs (optional)
  makes: makesProp,
  models: modelsProp,
  loadMakes: loadMakesProp,
  loadModels: loadModelsProp,
  loadingMakes: loadingMakesProp,

  // Navigation hint
  microInverterHint,
  loadingModels: loadingModelsProp,
  isLoading = false,
}: Props) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // ── Detect whether we're in external-catalog mode ───────────────────────────
  const useExternal =
    !!makesProp ||
    !!modelsProp ||
    typeof loadMakesProp === "function" ||
    typeof loadModelsProp === "function";

  // ── Local state (used only if NOT using external catalogs) ──────────────────
  const [makesLocal, setMakesLocal] = useState<Option[]>([]);
  const [modelsLocal, setModelsLocal] = useState<Option[]>([]);
  const [loadingMakesLocal, setLoadingMakesLocal] = useState(false);
  const [loadingModelsLocal, setLoadingModelsLocal] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Track previous make to clear models if make changes
  const prevMakeRef = useRef<string>("");

  // Preferred equipment state
  const [preferredEquipment, setPreferredEquipment] = useState<PreferredEquipment[]>([]);
  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [allMakes, setAllMakes] = useState<Option[]>([]);
  const [allModels, setAllModels] = useState<Option[]>([]);

  // Company context
  const companyUUID = useSelector(
    (store: any) => store.profile.profile?.company?.uuid
  );

  // Choose which data source to display (must be before useEffects that use these)
  const makes = useExternal ? makesProp ?? [] : makesLocal;
  const models = useExternal ? modelsProp ?? [] : modelsLocal;
  const loadingMakes = useExternal ? !!loadingMakesProp : loadingMakesLocal;
  const loadingModels = useExternal ? !!loadingModelsProp : loadingModelsLocal;

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Track if we've run the initial Hoymiles auto-calculation on hydration
  const hasRunInitialHoymilesCalc = useRef(false);

  // Helper function to determine max branches based on combiner make/model
  const getMaxBranches = (make: string, model: string): number => {
    if (make !== "Enphase") {
      return 8; // Default for non-Enphase
    }

    // Check for specific Enphase models
    if (model.includes("6C")) {
      return 5; // IQ Combiner 6C has 5 branches
    } else {
      return 4; // All other Enphase models have 4 branches
    }
  };

  // Auto-load models when make is hydrated (external mode only)
  // This runs once after hydration when we have a make but no models loaded
  const hasTriedLoadingModels = useRef(false);
  const loadModelsRef = useRef(loadModelsProp);
  const previousMakeRef = useRef<string>('');

  // Keep ref up to date
  useEffect(() => {
    loadModelsRef.current = loadModelsProp;
  }, [loadModelsProp]);

  // Reset the flag when make changes (but not during initial hydration)
  useEffect(() => {
    const prevMake = previousMakeRef.current;
    const currentMake = values.selectedMake || '';

    // Only reset if make actually changed AND we're not going from empty to a value (initial hydration)
    if (prevMake && currentMake && prevMake !== currentMake) {
      console.log('[Microinverter Hydration] Make changed, resetting flag:', { prevMake, currentMake });
      hasTriedLoadingModels.current = false;
    }

    previousMakeRef.current = currentMake;
  }, [values.selectedMake]);

  useEffect(() => {
    console.log('[Microinverter Hydration] Auto-load useEffect triggered:', {
      useExternal,
      selectedMake: values.selectedMake,
      modelsLength: models?.length ?? 'undefined',
      hasTriedLoading: hasTriedLoadingModels.current,
      loadModelsProp: !!loadModelsProp,
    });

    if (!useExternal) {
      console.log('[Microinverter Hydration] Skipping - not in external mode');
      return;
    }
    if (!values.selectedMake) {
      console.log('[Microinverter Hydration] Skipping - no make selected');
      return;
    }
    if (models && models.length > 0) {
      console.log('[Microinverter Hydration] Skipping - models already loaded');
      return;
    }
    if (hasTriedLoadingModels.current) {
      console.log('[Microinverter Hydration] Skipping - already tried loading');
      return;
    }

    // Use setTimeout to ensure this runs after the section is hydrated and enabled
    // This prevents the "enabled: false" abort issue
    console.log('[Microinverter Hydration] Setting up auto-load timeout for make:', values.selectedMake);
    const timeoutId = setTimeout(() => {
      console.log('[Microinverter Hydration] ⏰ TIMEOUT FIRED! Attempting to load models for make:', values.selectedMake);
      console.log('[Microinverter Hydration] loadModelsRef.current exists:', !!loadModelsRef.current);
      hasTriedLoadingModels.current = true;
      if (loadModelsRef.current) {
        console.log('[Microinverter Hydration] Calling loadModelsRef.current()...');
        loadModelsRef.current();
        console.log('[Microinverter Hydration] loadModelsRef.current() call completed');
      } else {
        console.log('[Microinverter Hydration] ❌ loadModelsRef.current is null/undefined!');
      }
    }, 300);

    return () => {
      console.log('[Microinverter Hydration] Cleanup - clearing timeout');
      clearTimeout(timeoutId);
    };
  }, [useExternal]);

  // Fix up selectedModel after hydration: convert label to UUID if needed
  // Priority: use pre-loaded UUID from hint if available, otherwise search models
  useEffect(() => {
    if (!values.selectedModel) return;

    // Check if selectedModel is already a UUID (contains dashes) or a label
    const looksLikeUUID = values.selectedModel.includes('-');

    if (!looksLikeUUID) {
      // Priority 1: Use pre-loaded UUID from navigation hint (Equipment page already resolved it)
      if (microInverterHint?.modelUUID && microInverterHint.model === values.selectedModel) {
        console.log('[Microinverter Hydration] Using pre-loaded UUID from hint:', {
          label: values.selectedModel,
          uuid: microInverterHint.modelUUID,
        });
        onChange("selectedModel", microInverterHint.modelUUID);
        return;
      }

      // Priority 2: Search loaded models to find UUID
      if (models && models.length > 0) {
        const matchingModel = models.find(m => m.label === values.selectedModel);
        if (matchingModel && matchingModel.value !== values.selectedModel) {
          console.log('[Microinverter Hydration] Converting model label to UUID from models:', {
            label: values.selectedModel,
            uuid: matchingModel.value,
          });
          onChange("selectedModel", matchingModel.value);
        }
      }
    }
  }, [models, values.selectedModel, onChange, microInverterHint]);

  // Auto-switch to custom mode when Hoymiles/APSystems is detected with a model
  // This runs as soon as the model is selected, before full data is ready
  useEffect(() => {
    if ((values.selectedMake === "Hoymiles Power" || values.selectedMake === "APSystems") && values.selectedModel) {
      if (values.stringingType !== "custom") {
        console.log('[Hoymiles Mode Switch] Auto-selecting custom stringing for Hoymiles/APSystems');
        onChange("stringingType", "custom");
      }
    }
  }, [values.selectedMake, values.selectedModel, values.stringingType, onChange]);

  // Auto-calculate Hoymiles Power microinverter quantity and branch distribution
  useEffect(() => {
    console.log('[Hoymiles Auto-Calc] Checking conditions:', {
      make: values.selectedMake,
      model: values.selectedModel,
      solarPanelQuantity,
      modelsLength: models?.length ?? 0,
    });

    // Only run for Hoymiles Power with a selected model
    if (values.selectedMake !== "Hoymiles Power" || !values.selectedModel) {
      console.log('[Hoymiles Auto-Calc] Skipping - not Hoymiles Power or no model selected');
      return;
    }

    // Try to find model label from multiple sources:
    // 1. If selectedModel is already a label (no dashes), use it directly
    // 2. If we have models loaded, find the label by UUID
    // 3. If we have hint with label, use that
    let modelLabel = values.selectedModel;

    // If selectedModel looks like a UUID, try to get the label
    if (values.selectedModel.includes('-')) {
      // Try models array first
      if (models && models.length > 0) {
        const selectedModelObj = models.find(m => m.value === values.selectedModel);
        if (selectedModelObj) {
          modelLabel = selectedModelObj.label;
        }
      }
      // Fallback to hint if available
      if (!modelLabel || modelLabel.includes('-')) {
        if (microInverterHint?.model && microInverterHint.modelUUID === values.selectedModel) {
          modelLabel = microInverterHint.model;
        }
      }
    }

    const specs = HOYMILES_STRINGING_SPECS[modelLabel];

    console.log('[Hoymiles Auto-Calc] Model lookup:', {
      modelLabel,
      hasSpecs: !!specs,
    });

    if (!specs) {
      console.log('[Hoymiles Auto-Calc] Skipping - no specs found for model:', modelLabel);
      return;
    }

    // Check if we have solar panel quantity
    if (!solarPanelQuantity) {
      console.log('[Hoymiles Auto-Calc] ⚠️ Hoymiles Power selected but missing solar panel quantity');
      // Auto-select custom stringing anyway so UI is ready
      if (values.stringingType !== "custom") {
        console.log('[Hoymiles Auto-Calc] Auto-selecting custom stringing mode');
        onChange("stringingType", "custom");
      }
      return;
    }

    if (!onBranchStringChange) {
      console.log('[Hoymiles Auto-Calc] Skipping - no onBranchStringChange callback');
      return;
    }

    console.log('[Hoymiles Auto-Calc] ✅ All conditions met, proceeding with calculations');

    // Parse ratio (e.g., "4:1" -> 4)
    const ratio = parseInt(specs.panelRatio.split(':')[0], 10);
    if (isNaN(ratio) || ratio === 0) {
      console.log('[Hoymiles Auto-Calc] Invalid ratio:', specs.panelRatio);
      return;
    }

    // Calculate microinverter quantity (round up)
    const calculatedMicroQty = Math.ceil(solarPanelQuantity / ratio);
    console.log('[Hoymiles Auto-Calc] Calculated micros:', {
      solarPanels: solarPanelQuantity,
      ratio,
      calculatedMicros: calculatedMicroQty,
      calculation: `ceil(${solarPanelQuantity} / ${ratio}) = ${calculatedMicroQty}`,
    });

    // Check if micro panels already have user data - if so, skip auto-population
    // This allows users to manually edit panel quantities without auto-calc overriding them
    const currentMicroPanelsCheck = [
      micro1Panels, micro2Panels, micro3Panels, micro4Panels, micro5Panels,
      micro6Panels, micro7Panels, micro8Panels, micro9Panels, micro10Panels,
      micro11Panels, micro12Panels, micro13Panels, micro14Panels, micro15Panels,
      micro16Panels, micro17Panels, micro18Panels, micro19Panels, micro20Panels,
      micro21Panels, micro22Panels, micro23Panels, micro24Panels, micro25Panels,
    ];
    const hasExistingMicroData = currentMicroPanelsCheck.some(val => val && val !== "" && val !== "0");

    // If we have existing micro data and this is the first run, mark the flag to prevent recalculation
    if (hasExistingMicroData && !hasRunInitialHoymilesCalc.current) {
      console.log('[Hoymiles Auto-Calc] Found existing saved micro data on hydration - marking as calculated');
      hasRunInitialHoymilesCalc.current = true;
    }

    if (hasExistingMicroData && hasRunInitialHoymilesCalc.current) {
      console.log('[Hoymiles Auto-Calc] Skipping - user has manually edited micro panel quantities');
      // Still update stringing type, but don't override manual micro panel edits or quantity
      if (values.stringingType !== "custom") {
        console.log('[Hoymiles Auto-Calc] Setting stringing type to custom');
        onChange("stringingType", "custom");
      }
      // Only INCREASE quantity if calculated is higher (never decrease user's manual count)
      const currentQty = parseInt(values.quantity, 10) || 0;
      if (calculatedMicroQty > currentQty) {
        console.log('[Hoymiles Auto-Calc] Increasing quantity to calculated value:', calculatedMicroQty);
        onChange("quantity", String(calculatedMicroQty));
      } else {
        console.log('[Hoymiles Auto-Calc] Keeping user quantity:', currentQty, '(calculated:', calculatedMicroQty, ')');
      }
      return;
    }

    // Auto-select custom stringing
    if (values.stringingType !== "custom") {
      console.log('[Hoymiles Auto-Calc] Setting stringing type to custom');
      onChange("stringingType", "custom");
    }

    // Update microinverter quantity
    if (values.quantity !== String(calculatedMicroQty)) {
      console.log('[Hoymiles Auto-Calc] Updating quantity field to:', calculatedMicroQty);
      onChange("quantity", String(calculatedMicroQty));
    }

    // Get max micros per branch
    const maxMicrosPerBranch = specs.maxUnitsBranch;
    const maxBranches = getMaxBranches(combinerMake, combinerModel);

    console.log('[Hoymiles Auto-Calc] Branch distribution config:', {
      maxMicrosPerBranch,
      maxBranches,
      totalMicros: calculatedMicroQty,
    });

    // Distribute microinverters across branches
    // NOTE: For Hoymiles Power, we store MICROINVERTER quantities per branch, not panel quantities
    // The InlineCustomStringing component shows "Micro Qty" column header
    const branchDistribution: Record<string, string> = {};
    let remainingMicros = calculatedMicroQty;

    for (let i = 1; i <= maxBranches && remainingMicros > 0; i++) {
      const microsThisBranch = Math.min(remainingMicros, maxMicrosPerBranch);
      const panelsThisBranch = microsThisBranch * ratio;

      // Store MICROINVERTER quantity (not panel quantity) for Hoymiles Power
      branchDistribution[`branchString${i}`] = String(microsThisBranch);

      console.log(`[Hoymiles Auto-Calc] Branch ${i}: ${microsThisBranch} micros (= ${panelsThisBranch} panels at ${ratio}:1 ratio)`);

      remainingMicros -= microsThisBranch;
    }

    console.log('[Hoymiles Auto-Calc] Final distribution:', branchDistribution);

    // Apply branch distribution to all branches (1-6)
    // IMPORTANT: Only call onBranchStringChange if the value has actually changed
    // to prevent infinite loops
    const currentBranchValues = [
      branchString1,
      branchString2,
      branchString3,
      branchString4,
      branchString5,
      branchString6,
    ];

    let hasChanges = false;
    for (let i = 1; i <= 6; i++) {
      const fieldName = `branchString${i}`;
      const newValue = branchDistribution[fieldName] || "";
      const currentValue = currentBranchValues[i - 1];

      if (newValue !== currentValue) {
        console.log(`[Hoymiles Auto-Calc] Branch ${i} changed: "${currentValue}" → "${newValue}"`);
        onBranchStringChange(fieldName, newValue);
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      console.log('[Hoymiles Auto-Calc] No branch changes needed - values already correct');
    }

    // Now populate individual microinverter panel quantities (micro1Panels - micro25Panels)
    // Fill each micro to max ratio (e.g., 4 panels for 4:1), put remainder in last micro
    if (onMicroPanelChange) {
      console.log('[Hoymiles Auto-Calc] Populating individual microinverter panel quantities');

      const microPanelDistribution: Record<string, string> = {};
      let remainingPanels = solarPanelQuantity;

      for (let i = 1; i <= calculatedMicroQty && i <= 25; i++) {
        const panelsThisMicro = Math.min(remainingPanels, ratio);
        microPanelDistribution[`micro${i}Panels`] = String(panelsThisMicro);
        remainingPanels -= panelsThisMicro;

        console.log(`[Hoymiles Auto-Calc] Micro ${i}: ${panelsThisMicro} panels`);
      }

      // Get current micro panel values
      const currentMicroPanels = [
        micro1Panels, micro2Panels, micro3Panels, micro4Panels, micro5Panels,
        micro6Panels, micro7Panels, micro8Panels, micro9Panels, micro10Panels,
        micro11Panels, micro12Panels, micro13Panels, micro14Panels, micro15Panels,
        micro16Panels, micro17Panels, micro18Panels, micro19Panels, micro20Panels,
        micro21Panels, micro22Panels, micro23Panels, micro24Panels, micro25Panels,
      ];

      // Only update if values have changed
      let hasMicroChanges = false;
      for (let i = 1; i <= 25; i++) {
        const fieldName = `micro${i}Panels`;
        const newValue = microPanelDistribution[fieldName] || "";
        const currentValue = currentMicroPanels[i - 1];

        if (newValue !== currentValue) {
          console.log(`[Hoymiles Auto-Calc] Micro ${i} panels changed: "${currentValue}" → "${newValue}"`);
          onMicroPanelChange(fieldName, newValue);
          hasMicroChanges = true;
        }
      }

      if (!hasMicroChanges) {
        console.log('[Hoymiles Auto-Calc] No micro panel changes needed - values already correct');
      }
    }

    console.log('[Hoymiles Auto-Calc] ✅ Distribution complete');

    // Mark that we've run the initial calculation
    hasRunInitialHoymilesCalc.current = true;
  }, [values.selectedMake, values.selectedModel, solarPanelQuantity, models, onBranchStringChange, onChange, values.stringingType, values.quantity, onMicroPanelChange, microInverterHint]);

  // Auto-calculate microinverter quantity for ALL makes (not just Hoymiles)
  // For Hoymiles/APSystems: uses ratio-based calculation (handled above)
  // For all other makes: 1:1 ratio (solar panels = microinverters)
  useEffect(() => {
    console.log('[Micro Qty Auto-Calc] Checking conditions:', {
      make: values.selectedMake,
      solarPanelQuantity,
      currentQuantity: values.quantity,
    });

    // Need solar panel quantity to calculate
    if (!solarPanelQuantity || solarPanelQuantity === 0) {
      console.log('[Micro Qty Auto-Calc] Skipping - no solar panels configured');
      return;
    }

    // Need a make selected
    if (!values.selectedMake) {
      console.log('[Micro Qty Auto-Calc] Skipping - no make selected');
      return;
    }

    let calculatedQty: number;

    // Check if this is Hoymiles Power or APSystems (ratio-based)
    if (values.selectedMake === "Hoymiles Power" || values.selectedMake === "APSystems") {
      // For Hoymiles/APSystems, quantity is already calculated in the previous useEffect
      // We don't need to recalculate here - just return
      console.log('[Micro Qty Auto-Calc] Skipping - Hoymiles/APSystems handled by dedicated useEffect');
      return;
    }

    // For all other makes: 1:1 ratio
    calculatedQty = solarPanelQuantity;
    console.log('[Micro Qty Auto-Calc] Using 1:1 ratio:', {
      solarPanels: solarPanelQuantity,
      calculatedMicros: calculatedQty,
    });

    // Only update if value has changed
    if (values.quantity !== String(calculatedQty)) {
      console.log('[Micro Qty Auto-Calc] Updating quantity:', {
        from: values.quantity,
        to: String(calculatedQty),
      });
      onChange("quantity", String(calculatedQty));
    } else {
      console.log('[Micro Qty Auto-Calc] Quantity already correct');
    }
  }, [values.selectedMake, solarPanelQuantity, values.quantity, onChange]);

  // Load preferred equipment on mount
  useEffect(() => {
    const loadPreferred = async () => {
      if (!companyId) {
        return;
      }

      setLoadingPreferred(true);
      try {
        const equipmentType = getEquipmentTypeForPreferred('microinverter');
        const preferred = await fetchPreferredEquipment(companyId, equipmentType);
        setPreferredEquipment(preferred);

        // Auto-select default equipment if applicable
        if (values.isNew && preferred.length > 0) {
          const autoSelect = getAutoSelectEquipment(preferred, values.isNew);
          if (autoSelect && !values.selectedMake && !values.selectedModel) {
            onChange("selectedMake", autoSelect.make);
            onChange("selectedModel", autoSelect.model);
          }
        }
      } catch (error) {
        console.error("[MicroinverterSection] Error loading preferred equipment:", error);
      } finally {
        setLoadingPreferred(false);
      }
    };

    loadPreferred();
  }, [companyId, label]); // Only run when company or system changes

  // Handle isNew toggle changes - re-filter equipment lists
  useEffect(() => {
    if (useExternal) return; // Skip if using external catalogs

    if (allMakes.length > 0) {
      const filtered = filterEquipmentByPreferred(
        allMakes,
        allModels,
        preferredEquipment,
        values.isNew,
        values.selectedMake
      );

      setMakesLocal(filtered.makes);

      // If switching to "New" and we have auto-select data, apply it
      if (values.isNew && filtered.defaultMake && !values.selectedMake) {
        onChange("selectedMake", filtered.defaultMake);

        if (filtered.defaultModel) {
          onChange("selectedModel", filtered.defaultModel);
        }
      }
    }

    // Also re-filter models if we have them loaded
    if (allModels.length > 0 && values.selectedMake) {
      const filtered = filterEquipmentByPreferred(
        allMakes,
        allModels,
        preferredEquipment,
        values.isNew,
        values.selectedMake
      );

      setModelsLocal(filtered.models);
    }
  }, [values.isNew, preferredEquipment.length, useExternal]); // Re-run when isNew changes or preferred equipment is loaded

  // Helpers
  function normalize(item: any): Option {
    if (typeof item === "string") return { label: item, value: item };
    const label = item.manufacturer ?? item.name ?? item.label ?? "";
    const value = item.uuid ?? label;
    return { label, value };
  }

  // Internal fetchers (used only when not in external mode)
  const handleMakeOpenInternal = useCallback(() => {
    if (useExternal) return;
    if (!companyUUID || loadingMakesLocal || equipmentCacheManager.getCacheFlag('microinverterMakes')) return;
    equipmentCacheManager.setCacheFlag('microinverterMakes', true);
    setLoadingMakesLocal(true);
    equipmentManufacturers("Microinverter")
      .then((resp: any) => {
        const list = resp.data?.data || [];
        const formatted = list.map(normalize);

        // Store all makes for filtering
        setAllMakes(formatted);

        // Apply preferred equipment filtering
        const filtered = filterEquipmentByPreferred(
          formatted,
          allModels,
          preferredEquipment,
          values.isNew,
          values.selectedMake
        );

        setMakesLocal(filtered.makes);

        logPreferredFiltering(
          'Microinverter Makes',
          values.isNew,
          preferredEquipment.length,
          filtered.makes.length,
          formatted.length,
          !!filtered.defaultMake
        );
      })
      .catch((err: any) => {
        // Error ignored
      })
      .finally(() => setLoadingMakesLocal(false));
  }, [companyUUID, loadingMakesLocal, debugFetch, useExternal, preferredEquipment, values.isNew, values.selectedMake, allModels]);

  const handleModelOpenInternal = useCallback(() => {
    if (useExternal) return;
    const make = values.selectedMake;
    if (!make || loadingModelsLocal || equipmentCacheManager.getCacheFlag('microinverterModels')) return;
    equipmentCacheManager.setCacheFlag('microinverterModels', true);
    setLoadingModelsLocal(true);
    GetModelNumber("Microinverter", make)
      .then((resp: any) => {
        const list = resp.data?.data || [];
        const formatted = list.map(normalize);

        // Store all models for filtering
        setAllModels(formatted);

        // Apply preferred equipment filtering
        const filtered = filterEquipmentByPreferred(
          allMakes,
          formatted,
          preferredEquipment,
          values.isNew,
          make
        );

        setModelsLocal(filtered.models);
      })
      .catch((err: any) => {
        // Error ignored
      })
      .finally(() => setLoadingModelsLocal(false));
  }, [values.selectedMake, loadingModelsLocal, debugFetch, useExternal, allMakes, preferredEquipment, values.isNew]);

  // When make changes, clear model and reset model loader state
  useEffect(() => {
    const prev = prevMakeRef.current;
    const cur = values.selectedMake;
    if (prev !== cur) {
      prevMakeRef.current = cur;
      // Only clear selected model if this is an actual make change from a non-empty previous value
      // This prevents clearing during initial hydration when prev is "" or undefined
      if (prev !== "" && prev !== undefined && prev !== cur && values.selectedModel) {
        onChange("selectedModel", "");
      }
      // reset model loader state only for actual changes, not hydration
      if (prev !== "" && prev !== undefined && prev !== cur) {
        equipmentCacheManager.setCacheFlag('microinverterModels', false);
        if (!useExternal) setModelsLocal([]);
      }
    }
  }, [values.selectedMake, onChange, useExternal]);

  // Dirty / complete flags
  const isDirty = Boolean(values.quantity) || Boolean(values.selectedMake) || Boolean(values.selectedModel);
  const isComplete = requiredFields.every(
    (f) => (values[f as keyof typeof values] || "").toString().trim() !== ""
  );

  // Handlers for dropdown open (call external or internal loader)
  const handleMakeOpen = useCallback(() => {
    if (useExternal) {
      loadMakesProp?.();
    } else {
      handleMakeOpenInternal();
    }
  }, [useExternal, loadMakesProp, handleMakeOpenInternal]);

  const handleModelOpen = useCallback(() => {
    if (!values.selectedMake) return; // need a make first
    if (useExternal) {
      loadModelsProp?.();
    } else {
      handleModelOpenInternal();
    }
  }, [
    useExternal,
    loadModelsProp,
    handleModelOpenInternal,
    values.selectedMake,
  ]);

  // Handlers
  const clearFields = () => {
    onChange("quantity", "");
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("isNew", true);
  };

  const handleMakeChange = (val: string) => {
    onChange("selectedMake", val);
    // selectedModel will be cleared by the useEffect that watches for make changes
  };

  const handleModelChange = (val: string) => {
    onChange("selectedModel", val);
  };

  // Handle total microinverters change (from Add Microinverter button)
  const handleTotalMicroinvertersChange = (newTotal: number) => {
    console.log('[MicroinverterSection] Updating total microinverters:', {
      from: values.quantity,
      to: newTotal,
    });
    onChange("quantity", String(newTotal));
  };

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_INVERTER_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {
        // Photo count will be updated automatically via useEffect
      },
    });
  };

  // Extract system number from label (e.g., "Microinverter 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <>
      <EquipmentSection
        title={label}
        isNew={values.isNew}
        onNewExistingToggle={(v) => onChange("isNew", v)}
        showNewExistingToggle={true}
        onCameraPress={handleCameraPress}
        photoCount={photoCount}
        onDeletePress={() => setShowClearModal(true)}
        isLoading={isLoading}
      >

          {/* Make */}
          <InlineField label="Make" required error={errors.selectedMake}>
            <InlineDropdown
              value={values.selectedMake || ""}
              options={makes}
              onChange={handleMakeChange}
              onOpen={handleMakeOpen}
              loading={loadingMakes}
              placeholder="Select make"
            />
          </InlineField>

          {/* Model */}
          <InlineField label="Model" required error={errors.selectedModel}>
            <InlineDropdown
              value={values.selectedModel || ""}
              displayValue={models.find(m => m.value === values.selectedModel)?.label}
              options={models}
              onChange={handleModelChange}
              onOpen={handleModelOpen}
              loading={loadingModels}
              disabled={!values.selectedMake}
              placeholder={values.selectedMake ? "Select model" : "Select make first"}
            />
          </InlineField>

          {/* Stringing Section */}
          <View style={styles.stringingSection}>
            <RNText style={styles.stringingLabel}>Choose System Stringing</RNText>

            {/* Auto/Custom Toggle Buttons (matches web TableRowButton design) */}
            <View style={styles.stringingButtonRow}>
              {/* Auto Button */}
              <TouchableOpacity
                style={[
                  styles.stringingToggleButton,
                  (values.stringingType || "auto") !== "auto" && styles.stringingToggleButtonInactive,
                ]}
                onPress={() => onChange("stringingType", "auto")}
                activeOpacity={0.7}
              >
                {(values.stringingType || "auto") === "auto" ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.stringingToggleGradient}
                  >
                    <RNText style={styles.stringingToggleTextActive}>Auto</RNText>
                  </LinearGradient>
                ) : (
                  <View style={styles.stringingToggleGradient}>
                    <RNText style={styles.stringingToggleTextInactive}>Auto</RNText>
                  </View>
                )}
              </TouchableOpacity>

              {/* Custom Button */}
              <TouchableOpacity
                style={[
                  styles.stringingToggleButton,
                  values.stringingType !== "custom" && styles.stringingToggleButtonInactive,
                ]}
                onPress={() => onChange("stringingType", "custom")}
                activeOpacity={0.7}
              >
                {values.stringingType === "custom" ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.stringingToggleGradient}
                  >
                    <RNText style={styles.stringingToggleTextActive}>Custom</RNText>
                  </LinearGradient>
                ) : (
                  <View style={styles.stringingToggleGradient}>
                    <RNText style={styles.stringingToggleTextInactive}>Custom</RNText>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Conditional Notes */}
            {(values.stringingType || "auto") === "auto" ? (
              <RNText style={styles.noteText}>
                Note: Stringing will auto‐size to distribute total Quantity in Solar Panel 1 and to stay within Manufacturer stringing requirements.
              </RNText>
            ) : !hasCombinerPanel ? (
              <RNText style={styles.warningText}>
                You must choose a Combiner Panel Make and Model to custom string the branches.
              </RNText>
            ) : null}
          </View>

          {/* Custom Stringing Section */}
          {values.stringingType === "custom" && hasCombinerPanel && (
            <View style={styles.customSection}>
              {combinerMake && combinerModel && solarPanelQuantity > 0 && onBranchStringChange ? (
                // Check if make is Hoymiles Power or APSystems - use granular component
                values.selectedMake === "Hoymiles Power" || values.selectedMake === "APSystems" ? (
                  (() => {
                    // Get specs for the selected model
                    // Same logic as auto-calc: if selectedModel is already a label (no dashes), use it directly
                    let modelLabel = values.selectedModel;

                    // If selectedModel looks like a UUID, try to get the label
                    if (values.selectedModel?.includes('-')) {
                      const selectedModelObj = models.find(m => m.value === values.selectedModel);
                      if (selectedModelObj) {
                        modelLabel = selectedModelObj.label;
                      }
                      // Fallback to hint if available
                      if (!modelLabel || modelLabel.includes('-')) {
                        if (microInverterHint?.model && microInverterHint.modelUUID === values.selectedModel) {
                          modelLabel = microInverterHint.model;
                        }
                      }
                    }

                    const specs = modelLabel ? HOYMILES_STRINGING_SPECS[modelLabel] : null;

                    if (!specs) {
                      return (
                        <RNText style={styles.warningText}>
                          Unable to find stringing specifications for selected model.
                        </RNText>
                      );
                    }

                    // Parse ratio (e.g., "4:1" -> 4)
                    const ratio = parseInt(specs.panelRatio.split(':')[0], 10);
                    const totalMicros = parseInt(values.quantity, 10) || 0;

                    return (
                      <InlineHoymilesStringing
                        panelRatio={ratio}
                        maxMicrosPerBranch={specs.maxUnitsBranch}
                        maxPanelsPerMicro={ratio}
                        totalMicroinverters={totalMicros}
                        totalSolarPanels={solarPanelQuantity}
                        micro1Panels={micro1Panels}
                        micro2Panels={micro2Panels}
                        micro3Panels={micro3Panels}
                        micro4Panels={micro4Panels}
                        micro5Panels={micro5Panels}
                        micro6Panels={micro6Panels}
                        micro7Panels={micro7Panels}
                        micro8Panels={micro8Panels}
                        micro9Panels={micro9Panels}
                        micro10Panels={micro10Panels}
                        micro11Panels={micro11Panels}
                        micro12Panels={micro12Panels}
                        micro13Panels={micro13Panels}
                        micro14Panels={micro14Panels}
                        micro15Panels={micro15Panels}
                        micro16Panels={micro16Panels}
                        micro17Panels={micro17Panels}
                        micro18Panels={micro18Panels}
                        micro19Panels={micro19Panels}
                        micro20Panels={micro20Panels}
                        micro21Panels={micro21Panels}
                        micro22Panels={micro22Panels}
                        micro23Panels={micro23Panels}
                        micro24Panels={micro24Panels}
                        micro25Panels={micro25Panels}
                        onMicroPanelChange={onMicroPanelChange!}
                        inverterIsNew={values.isNew}
                        onTotalMicroinvertersChange={handleTotalMicroinvertersChange}
                      />
                    );
                  })()
                ) : (
                  // For other makes, use standard custom stringing component
                  <InlineCustomStringing
                    inverterData={{
                      makeModel: `${combinerMake} ${combinerModel}`,
                      max_strings_branches: getMaxBranches(combinerMake, combinerModel),
                    }}
                    solarPanelQuantity={solarPanelQuantity}
                    branchString1={branchString1}
                    branchString2={branchString2}
                    branchString3={branchString3}
                    branchString4={branchString4}
                    branchString5={branchString5}
                    branchString6={branchString6}
                    onBranchStringChange={onBranchStringChange}
                    inverterIsNew={values.isNew}
                    branchLabelSingular="Branch"
                    branchLabelPlural="Branch Chains"
                    quantityLabel="Micro Qty"
                  />
                )
              ) : (
                <RNText style={styles.warningText}>
                  Please select a combiner make, model, and ensure solar panels are configured.
                </RNText>
              )}
            </View>
          )}
      </EquipmentSection>

      {/* Clear Confirmation Modal */}
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        onConfirm={() => {
          clearFields();
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionContent: { paddingHorizontal: 0, width: "100%" },
  quantityWrap: { width: moderateScale(180), marginBottom: verticalScale(8), alignSelf: "flex-start" },
  stringingSection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  stringingLabel: {
    color: colors.primary,
    fontSize: moderateScale(18),
    fontWeight: "600",
    marginBottom: verticalScale(10),
  },
  stringingButtonRow: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignSelf: "flex-start", // Keep buttons compact
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
  stringingToggleButton: {
    borderRadius: moderateScale(9999), // Fully rounded pill shape (matches web)
    overflow: "hidden",
  },
  stringingToggleButtonInactive: {
    borderWidth: 1,
    borderColor: `${colors.primary}80`, // 50% opacity orange border
    backgroundColor: "transparent",
  },
  stringingToggleGradient: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(8), // 8px all around (matches web)
    alignItems: "center",
    justifyContent: "center",
  },
  stringingToggleTextActive: {
    fontSize: moderateScale(12), // 12px (matches web)
    fontWeight: "600", // Semibold (matches web)
    color: colors.textPrimary, // White text for active state
  },
  stringingToggleTextInactive: {
    fontSize: moderateScale(12), // 12px (matches web)
    fontWeight: "600", // Semibold (matches web)
    color: colors.primary, // Orange text for inactive state
  },
  noteText: {
    color: colors.textPrimary,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(20),
    marginTop: 0,
    marginBottom: verticalScale(8),
  },
  warningText: {
    color: colors.warning,
    fontSize: moderateScale(16),
    lineHeight: moderateScale(20),
    marginTop: 0,
    marginBottom: verticalScale(8),
    fontStyle: "italic",
  },
  customSection: {
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
});
