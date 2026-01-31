// src/screens/Project/SystemDetails/sections/InverterSection.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { colors } from "../../../../theme/tokens/tokens";
import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import Button from "../../../../components/Button";
import SystemButton from "../../../../components/Button/SystemButton";
import RadialButton from "../../../../components/Button/RadialButton";
import InlineCustomStringing from "../../../../components/sections/InlineCustomStringing";
import OptimizerSection from "./OptimizerSection";
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
import { DEFAULT_INVERTER_PHOTO_TAGS, INVERTER_MANUFACTURERS_WITH_OPTIMIZERS, POWERWALL_3_KILOWATT_OPTIONS } from "../../../../utils/constants";
import { StringingConfiguration } from "../hooks/useEquipmentDetails";
import axiosInstance from "../../../../api/axiosInstance";
import apiEndpoints from "../../../../config/apiEndPoint";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP as wp,
} from "../../../../utils/responsive";
import { equipmentCacheManager } from "../../../../utils/equipmentCacheManager";

type Option = { label: string; value: string };

const requiredFields = ["selectedMake", "selectedModel"] as const;

type Props = {
  values: {
    selectedMake: string;
    selectedModel: string;
    isNew: boolean;
    hybrid?: string;
  };
  onChange: (
    field: "selectedMake" | "selectedModel" | "isNew" | "hybrid",
    value: any
  ) => void;
  errors: Record<string, string>;
  label?: string;
  debugFetch?: boolean;

  // OPTIONAL: if the parent supplies catalogs, we'll use them.
  makes?: Option[];
  models?: Option[];
  loadMakes?: () => void;
  loadModels?: () => void;
  loadingMakes?: boolean;
  loadingModels?: boolean;
  isLoading?: boolean;

  // Stringing props
  solarPanelQuantity?: number;
  branchStringValues?: {
    branchString1: string;
    branchString2: string;
    branchString3: string;
    branchString4: string;
    branchString5: string;
    branchString6: string;
  };
  onBranchStringChange?: (field: string, value: string) => void;
  stringingType?: "auto" | "custom" | "";
  onStringingTypeChange?: (type: "auto" | "custom") => void;
  solarPanelIsNew?: boolean;

  // Optimizer props (integrated into InverterSection)
  optimizerValues?: {
    selectedMake: string;
    selectedModel: string;
    isNew: boolean;
  };
  onOptimizerChange?: (
    field: "selectedMake" | "selectedModel" | "isNew",
    value: any
  ) => void;
  optimizerErrors?: Record<string, string>;
  optimizerMakes?: Option[];
  optimizerModels?: Option[];
  optimizerLoadMakes?: () => void;
  optimizerLoadModels?: () => void;
  optimizerLoadingMakes?: boolean;
  optimizerLoadingModels?: boolean;

  // BOS props
  showBOSButton?: boolean; // Show the Add BOS button
  onShowBOS?: () => void; // Callback when Add BOS button is clicked
  utilityRequirements?: any; // Utility requirements data for auto-populating BOS equipment
};

export default function InverterSection({
  values,
  onChange,
  errors,
  label = "Inverter",
  debugFetch = true,

  // external catalogs (optional)
  makes: makesProp,
  models: modelsProp,
  loadMakes: loadMakesProp,
  loadModels: loadModelsProp,
  loadingMakes: loadingMakesProp,
  loadingModels: loadingModelsProp,
  isLoading = false,

  // stringing props
  solarPanelQuantity = 0,
  branchStringValues,
  onBranchStringChange,
  stringingType = "auto",
  onStringingTypeChange,
  solarPanelIsNew = true,

  // optimizer props
  optimizerValues,
  onOptimizerChange,
  optimizerErrors = {},
  optimizerMakes = [],
  optimizerModels = [],
  optimizerLoadMakes,
  optimizerLoadModels,
  optimizerLoadingMakes = false,
  optimizerLoadingModels = false,

  // BOS props
  showBOSButton = false,
  onShowBOS,
  utilityRequirements,
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

  // Preferred equipment state
  const [preferredEquipment, setPreferredEquipment] = useState<PreferredEquipment[]>([]);
  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [allMakes, setAllMakes] = useState<Option[]>([]);
  const [allModels, setAllModels] = useState<Option[]>([]);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showStringingChangeModal, setShowStringingChangeModal] = useState(false);
  const [showOptimizerClearModal, setShowOptimizerClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [inverterSpecs, setInverterSpecs] = useState<any>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  // Optimizer state
  const [showOptimizers, setShowOptimizers] = useState(false);

  // Powerwall 3 kilowatt rating state
  const [selectedKilowattRating, setSelectedKilowattRating] = useState<string>("11.5");

  // ── Load flags ──────────────────────────────────────────────────────────────
  // Using centralized cache manager instead of local useRef flags

  // Track previous make to clear models if make changes
  const prevMakeRef = useRef<string>("");

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Determine if optimizers should be shown
  // 1. Check if manufacturer supports optimizers
  // 2. If optimizer data exists, show optimizers
  // 3. Otherwise, show "Add Optimizers" button for supported manufacturers
  const supportsOptimizers = INVERTER_MANUFACTURERS_WITH_OPTIMIZERS.some(
    (manufacturer) => values.selectedMake?.toLowerCase().includes(manufacturer.toLowerCase())
  );
  const hasOptimizerData = optimizerValues && (
    optimizerValues.selectedMake ||
    optimizerValues.selectedModel ||
    !optimizerValues.isNew
  );



  useEffect(() => {
    if (supportsOptimizers || hasOptimizerData) {
      setShowOptimizers(true);
    }
  }, [supportsOptimizers, hasOptimizerData]);

  // Track if user has interacted with kilowatt rating
  const [hasInteractedWithKilowatt, setHasInteractedWithKilowatt] = useState(false);


  // Fetch hybrid field when component mounts with existing make/model
  useEffect(() => {
    if (values.selectedMake && values.selectedModel && !values.hybrid) {
      fetchInverterSpecifications(values.selectedMake, values.selectedModel)
        .then((specs) => {
          // Specs fetched and processed
        })
        .catch((error) => {
          // Error handled silently
        });
    }
  }, [values.selectedMake, values.selectedModel]);


  // ── Company context ─────────────────────────────────────────────────────────
  const companyUUID = useSelector(
    (store: any) => store.profile.profile?.company?.uuid
  );

  // Load preferred equipment on mount
  useEffect(() => {
    const loadPreferred = async () => {
      if (!companyId) {
        return;
      }

      setLoadingPreferred(true);
      try {
        const equipmentType = getEquipmentTypeForPreferred('inverter');
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
        console.error("[InverterSection] Error loading preferred equipment:", error);
      } finally {
        setLoadingPreferred(false);
      }
    };

    loadPreferred();
  }, [companyId, label]); // Only run when company or system changes

  // Re-filter makes/models when isNew toggle changes
  useEffect(() => {
    if (!useExternal && allMakes.length > 0) {
      const filtered = filterEquipmentByPreferred(
        allMakes,
        allModels,
        preferredEquipment,
        values.isNew,
        values.selectedMake
      );

      setMakesLocal(filtered.makes);
    }

    if (!useExternal && allModels.length > 0) {
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function normalize(item: any): Option {
    if (typeof item === "string") return { label: item, value: item };
    const label = item.manufacturer ?? item.name ?? item.label ?? "";
    const value = item.uuid ?? label;
    return { label, value };
  }


  // ── Internal fetchers (used only when not in external mode) ─────────────────
  const handleMakeOpenInternal = useCallback(() => {
    if (useExternal) return;
    if (!companyUUID || loadingMakesLocal || equipmentCacheManager.getCacheFlag('inverterMakes')) return;
    equipmentCacheManager.setCacheFlag('inverterMakes', true);
    setLoadingMakesLocal(true);
    equipmentManufacturers("Inverter")
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
          'Inverter Makes',
          values.isNew,
          preferredEquipment.length,
          filtered.makes.length,
          formatted.length,
          !!filtered.defaultMake
        );
      })
      .catch((err: any) => {
        debugFetch &&
          console.warn("[Inverter] error fetching makes:", err?.message ?? err);
      })
      .finally(() => setLoadingMakesLocal(false));
  }, [companyUUID, loadingMakesLocal, debugFetch, useExternal, preferredEquipment, values.isNew, values.selectedMake, allModels]);

  const handleModelOpenInternal = useCallback(() => {
    if (useExternal) return;
    const make = values.selectedMake;
    if (!make || loadingModelsLocal || equipmentCacheManager.getCacheFlag('inverterModels')) return;
    equipmentCacheManager.setCacheFlag('inverterModels', true);
    setLoadingModelsLocal(true);
    GetModelNumber("Inverter", make)
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
        debugFetch &&
          console.warn(
            "[Inverter] error fetching models:",
            err?.message ?? err
          );
      })
      .finally(() => setLoadingModelsLocal(false));
  }, [values.selectedMake, loadingModelsLocal, debugFetch, useExternal, allMakes, preferredEquipment, values.isNew]);

  // ── When make changes, clear model and reset model loader state ─────────────
  useEffect(() => {
    const prev = prevMakeRef.current;
    const cur = values.selectedMake;
    if (prev !== cur) {
      prevMakeRef.current = cur;
      // clear selected model whenever make changes
      if (values.selectedModel) onChange("selectedModel", "");
      // reset model loader state
      equipmentCacheManager.setCacheFlag('inverterModels', false);
      if (!useExternal) setModelsLocal([]);
    }
  }, [values.selectedMake, values.selectedModel, onChange, useExternal]);


  // ── Choose which data source to display ─────────────────────────────────────
  const makes = useExternal ? makesProp ?? [] : makesLocal;
  const models = useExternal ? modelsProp ?? [] : modelsLocal;
  const loadingMakes = useExternal ? !!loadingMakesProp : loadingMakesLocal;
  const loadingModels = useExternal ? !!loadingModelsProp : loadingModelsLocal;

  // Detect if Powerwall 3 is selected (case-insensitive check with multiple patterns)
  // MUST be after models is defined since we need to look up the label
  const isPowerwall3 = React.useMemo(() => {
    if (!values.selectedModel) return false;

    // Find the selected model's label from the models array
    // values.selectedModel might be a UUID, so we need to look up the label
    const selectedModelObj = models.find(m => m.value === values.selectedModel);
    const modelName = selectedModelObj?.label || values.selectedModel;
    const modelLower = modelName.toLowerCase();

    const result = (
      modelLower.includes("powerwall 3") ||
      modelLower.includes("powerwall-3") ||
      modelLower.includes("powerwall_3") ||
      modelLower.includes("powerwall3") ||
      modelLower.includes("pw3") ||
      modelLower.includes("pw 3") ||
      // Also check if it contains both "powerwall" and "3" separately
      (modelLower.includes("powerwall") && modelLower.includes("3"))
    );
    console.log(`[InverterSection] PowerWall 3 Detection - Model Value: "${values.selectedModel}", Model Name: "${modelName}", Detected: ${result}`);
    return result;
  }, [values.selectedModel, models]);

  // Extract kilowatt rating from existing model if present (e.g., "Powerwall 3 (7.6 kW)")
  // OR auto-select 11.5 kW as default if no rating is present
  useEffect(() => {
    if (isPowerwall3 && values.selectedModel) {
      const selectedModelObj = models.find(m => m.value === values.selectedModel);
      const modelName = selectedModelObj?.label || values.selectedModel;
      const match = modelName.match(/\((\d+\.?\d*)\s*kW\)/i);

      if (match && match[1]) {
        // Existing rating found in model name
        const existingRating = match[1];
        if (selectedKilowattRating !== existingRating) {
          setSelectedKilowattRating(existingRating);
          setHasInteractedWithKilowatt(true);
        }
      } else if (!hasInteractedWithKilowatt) {
        // No rating in model name and user hasn't selected one yet
        // Auto-select 11.5 kW as default
        console.log(`[InverterSection] Auto-selecting default 11.5 kW for PowerWall 3`);
        setSelectedKilowattRating("11.5");
        setHasInteractedWithKilowatt(true);
      }
    }
  }, [values.selectedModel, isPowerwall3, selectedKilowattRating, models, hasInteractedWithKilowatt]);

  // When Powerwall 3 is selected and kilowatt rating changes, update the model to include the rating
  useEffect(() => {
    if (isPowerwall3 && selectedKilowattRating && hasInteractedWithKilowatt) {
      // Find the selected model's label to get the base name
      const selectedModelObj = models.find(m => m.value === values.selectedModel);
      const modelName = selectedModelObj?.label || values.selectedModel;

      // Extract base model name (without any existing kilowatt rating)
      const baseModel = modelName.replace(/\s*\([^)]*kW\)/i, "").trim() || "";
      const newModelWithKw = `${baseModel} (${selectedKilowattRating} kW)`;

      // Only update if different to avoid infinite loop
      if (modelName !== newModelWithKw && baseModel) {
        console.log(`[InverterSection] Updating model from "${modelName}" to "${newModelWithKw}"`);
        // Update the model to include the kilowatt rating
        // This will be saved as the model name in the database
        onChange("selectedModel", newModelWithKw);
      }
    }
  }, [isPowerwall3, selectedKilowattRating, hasInteractedWithKilowatt, models]);

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

  // Fetch inverter specifications for custom stringing
  const fetchInverterSpecifications = async (make: string, model: string) => {
    try {
      const URL = `${
        apiEndpoints.BASE_URL
      }/api/inverters/models?manufacturer=${encodeURIComponent(make)}`;
      const response = await axiosInstance.get(URL);

      if (response?.data?.success && Array.isArray(response.data.data)) {
        const modelData = response.data.data.find((item: any) => {
          const matches = (
            item.model_number === model ||
            item.name === model ||
            item.model === model ||
            item.label === model ||
            item.value === model ||
            (item.make_model && item.make_model.includes(model))
          );

          return matches;
        });

        if (modelData) {
          // Use equipment_type field to determine hybrid status (equipment_type="Yes" means it's a hybrid)
          const isHybrid = modelData.equipment_type === "Yes" ? "Yes" : modelData.hybrid;

          // Update hybrid field in parent component
          if (isHybrid !== undefined && isHybrid !== null) {
            onChange("hybrid", isHybrid);
          }

          return {
            max_strings_branches: modelData.max_strings_branches || 3,
            id: modelData.id,
            make_model: modelData.make_model || `${make} ${model}`,
            hybrid: isHybrid,
          };
        }
      }

      return { max_strings_branches: 3 };
    } catch (error) {
      console.error(
        `Error fetching inverter specs for ${make} ${model}:`,
        error
      );
      return { max_strings_branches: 3 };
    }
  };

  // Handle custom stringing selection
  const handleCustomSelection = async () => {
    if (onStringingTypeChange) {
      onStringingTypeChange("custom");
    }

    if (values.selectedMake && values.selectedModel) {
      setLoadingSpecs(true);
      try {
        const specs = await fetchInverterSpecifications(
          values.selectedMake,
          values.selectedModel
        );
        setInverterSpecs(specs);
      } catch (error) {
        setInverterSpecs({ max_strings_branches: 3 });
      } finally {
        setLoadingSpecs(false);
      }
    } else {
      setInverterSpecs({ max_strings_branches: 3 });
    }
  };

  // Handle auto stringing selection
  const handleAutoSelection = () => {
    // If we're currently on custom stringing, show confirmation modal
    if (stringingType === "custom") {
      setShowStringingChangeModal(true);
      return;
    }

    // Otherwise, switch directly to auto
    switchToAutoStringing();
  };

  // Function to actually switch to auto stringing
  const switchToAutoStringing = () => {
    if (onStringingTypeChange) {
      onStringingTypeChange("auto");
    }
    setInverterSpecs(null);
    // Clear all branch string values when switching to auto
    if (onBranchStringChange) {
      onBranchStringChange('branchString1', '');
      onBranchStringChange('branchString2', '');
      onBranchStringChange('branchString3', '');
      onBranchStringChange('branchString4', '');
      onBranchStringChange('branchString5', '');
      onBranchStringChange('branchString6', '');
    }
  };

  // ── Clear all fields ────────────────────────────────────────────────────────
  const clearAll = () => {
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("isNew", true);
    equipmentCacheManager.setCacheFlag('inverterModels', false);
    if (!useExternal) {
      setModelsLocal([]);
    }
    setSectionNote("");
    // Reset stringing to auto (directly without modal since clearing all)
    switchToAutoStringing();
  };






  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      console.warn("Missing project context for photo capture");
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

  // Clear optimizer data
  const clearOptimizerData = () => {
    if (onOptimizerChange) {
      onOptimizerChange("isNew", true);
      onOptimizerChange("selectedMake", "");
      onOptimizerChange("selectedModel", "");
    }
    setShowOptimizers(false);
    setShowOptimizerClearModal(false);
  };

  // ── UI state checks ─────────────────────────────────────────────────────────
  const isDirty =
    values.selectedMake.trim() !== "" || values.selectedModel.trim() !== "";
  const isComplete = requiredFields.every((f) => {
    const v = (values as any)[f];
    return v != null && String(v).trim() !== "";
  });

  // Extract system number from label (e.g., "Inverter 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <CollapsibleSection
      title={titleWithoutNumber}
      systemNumber={systemNumber}
      initiallyExpanded={false}
      isDirty={!!isDirty}
      isRequiredComplete={isComplete}
      photoCount={photoCount}
      onCameraPress={handleCameraPress}
      isLoading={isLoading}
    >
      <View style={styles.sectionContent}>
        <View style={styles.toggleRow}>
          <NewExistingToggle
            isNew={values.isNew}
            onToggle={(v) => onChange("isNew", v)}
            onTrashPress={() => setShowClearModal(true)}
          />
        </View>

        <ConfirmClearModal
          visible={showClearModal}
          sectionTitle={label}
          onConfirm={() => {
            clearAll();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        <ConfirmClearModal
          visible={showStringingChangeModal}
          sectionTitle="Custom Stringing to Auto Stringing"
          onConfirm={() => {
            switchToAutoStringing();
            setShowStringingChangeModal(false);
          }}
          onCancel={() => setShowStringingChangeModal(false)}
        />

        {/* Make* */}
        <Dropdown
          label="Make*"
          data={makes}
          value={values.selectedMake}
          onOpen={handleMakeOpen}
          loading={loadingMakes}
          disabled={loadingMakes}
          onChange={(val) => {
            onChange("selectedMake", val);
            onChange("selectedModel", "");
            // optional: kick model load right after make selection in external mode
            if (useExternal) {
              loadModelsProp?.();
            } else {
              equipmentCacheManager.setCacheFlag('inverterModels', false);
              setModelsLocal([]);
            }
          }}
          errorText={errors.selectedMake}
        />

        {/* Model* (IMPORTANT: uses `models`) */}
        <Dropdown
          label="Model*"
          data={models}
          value={values.selectedModel}
          onOpen={handleModelOpen}
          loading={loadingModels}
          disabled={!values.selectedMake || loadingModels}
          onChange={async (val) => {
            onChange("selectedModel", val);

            // Fetch inverter specifications to get hybrid field
            if (values.selectedMake && val) {
              try {
                await fetchInverterSpecifications(values.selectedMake, val);
              } catch (error) {
                // Error handled silently
              }
            }
          }}
          errorText={errors.selectedModel}
        />

        {/* Powerwall 3 Kilowatt Rating Selection */}
        {isPowerwall3 && (
          <View style={styles.kilowattSection}>
            <Text style={styles.kilowattLabel}>Select PowerWall 3 kW setting</Text>
            <View style={styles.kilowattButtonRow}>
              {POWERWALL_3_KILOWATT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  title={option.label}
                  selected={selectedKilowattRating === option.value}
                  onPress={() => {
                    setSelectedKilowattRating(option.value);
                    setHasInteractedWithKilowatt(true);
                  }}
                  width={wp("21%")}
                  rounded={24}
                  textStyle={{ fontSize: moderateScale(20), fontWeight: "700" }}
                />
              ))}
            </View>
          </View>
        )}


        {/* Optimizer Section */}
        {supportsOptimizers && !showOptimizers && (
          <View style={styles.optimizerSection}>
            <SystemButton
              label="Add Optimizers"
              onPress={() => {
                setShowOptimizers(true);
              }}
              style={styles.addOptimizerButton}
              scaleOverride={0.85}
            />
          </View>
        )}

        {(supportsOptimizers || showOptimizers) && optimizerValues && onOptimizerChange && (
          <View style={styles.optimizerSection}>
            {/* Optimizer Label */}
            <View style={styles.optimizerHeaderRow}>
              <Text style={styles.optimizerLabel}>Optimizer</Text>
            </View>

            <OptimizerSection
              values={optimizerValues}
              onChange={onOptimizerChange}
              errors={optimizerErrors}
              makes={optimizerMakes}
              models={optimizerModels}
              loadMakes={optimizerLoadMakes || (() => {})}
              loadModels={optimizerLoadModels || (() => {})}
              loadingMakes={optimizerLoadingMakes}
              loadingModels={optimizerLoadingModels}
              label="Optimizer"
              suppressOptimizer={false}
              isSolarEdge={supportsOptimizers}
              onHideOptimizer={() => {
                setShowOptimizers(false);
              }}
            />
          </View>
        )}

        {/* Stringing Section */}
        <View style={styles.stringingSection}>
          {/* Section Label */}
          <View style={styles.stringingLabelRow}>
            <Text style={styles.stringingLabel}>Choose System Stringing</Text>
          </View>

          {/* Auto/Custom Buttons */}
          <View style={styles.stringingButtonRow}>
            <Button
              title="Auto"
              onPress={handleAutoSelection}
              selected={stringingType === "auto"}
              width={wp("44%")}
              style={{ marginRight: moderateScale(10) }}
            />
            <Button
              title="Custom"
              onPress={handleCustomSelection}
              selected={stringingType === "custom"}
              width={wp("44%")}
            />
          </View>

          {/* Conditional Content */}
          {stringingType === "auto" ? (
            /* Auto Stringing Note */
            <Text style={styles.noteText}>
              Note: Stringing will auto size to distribute total Quantity in
              Solar Panel 1 and to stay within Manufacturer stringing
              requirements and limits.
            </Text>
          ) : stringingType === "custom" ? (
            /* Custom Stringing Interface */
            <View style={styles.customSection}>
              {values.selectedMake && values.selectedModel ? (
                <InlineCustomStringing
                  key={`stringing_sys${systemNumber || label}`}
                  inverterData={{
                    makeModel: `${values.selectedMake} ${values.selectedModel}`,
                    max_strings_branches: inverterSpecs?.max_strings_branches || 3,
                  }}
                  solarPanelQuantity={solarPanelQuantity}
                  // Pass simple field values directly - just like solar panel quantity
                  branchString1={branchStringValues?.branchString1 || ""}
                  branchString2={branchStringValues?.branchString2 || ""}
                  branchString3={branchStringValues?.branchString3 || ""}
                  branchString4={branchStringValues?.branchString4 || ""}
                  branchString5={branchStringValues?.branchString5 || ""}
                  branchString6={branchStringValues?.branchString6 || ""}
                  // Simple onChange callback - saves directly to database
                  onBranchStringChange={(field, value) => {
                    console.log(`[CUSTOM STRINGING] Saving ${field} = ${value} for System ${systemNumber || label}`);
                    if (onBranchStringChange) {
                      onBranchStringChange(field, value);
                    }
                  }}
                  inverterIsNew={values.isNew}
                />
              ) : (
                <Text style={styles.warningText}>
                  Please select an inverter make and model first to configure custom stringing.
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* BOS Section - REMOVED: Button moved to different location */}
        {showBOSButton && onShowBOS && (
          <View style={styles.bosSection}>
            <SystemButton
              label="Add Pre-Combine BOS Equipment"
              onPress={() => {
                onShowBOS();
              }}
              style={styles.addBOSButton}
              scaleOverride={0.85}
            />
          </View>
        )}

      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stringingSection: {
    // Removed marginTop since model dropdown already has bottom spacing
  },
  stringingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  stringingLabel: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "700",
    flex: 1,
  },
  stringingButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  noteText: {
    color: "#fff",
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    fontStyle: "normal",
  },
  customSection: {
    marginTop: verticalScale(10),
  },
  warningText: {
    color: "#FFA500",
    fontSize: moderateScale(16),
    marginTop: verticalScale(10),
    fontStyle: "italic",
  },
  optimizerSection: {
    width: "100%",
    marginTop: 0,
  },
  optimizerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  optimizerLabel: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "700",
  },
  addOptimizerButton: {
    width: "100%",
    height: verticalScale(40),
    marginBottom: verticalScale(10),
  },
  bosSection: {
    width: "100%",
    marginTop: 0,
  },
  addBOSButton: {
    width: "100%",
    height: verticalScale(40),
    marginBottom: verticalScale(10),
  },
  kilowattSection: {
    width: "100%",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20), // Increased bottom spacing
  },
  kilowattLabel: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(12),
  },
  kilowattButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Space out pill buttons
    alignItems: "center",
    width: "100%",
    marginTop: verticalScale(8),
  },
});
