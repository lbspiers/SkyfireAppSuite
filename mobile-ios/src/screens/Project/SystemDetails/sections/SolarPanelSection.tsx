// src/screens/Project/SystemDetails/sections/SolarPanelSection.tsx - CLEAN VERSION
import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import TextInput from "../../../../components/TextInput";
import Dropdown from "../../../../components/Dropdown";
import NumericKeypad from "../../../../components/NumericKeypad";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import SolarPanelSpecsModal from "../../../../components/SolarPanelSpecsModal";
import Button from "../../../../components/Button";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_PANEL_PHOTO_TAGS } from "../../../../utils/constants";
import {
  getSolarPanelById,
  getSolarPanelByMakeModel,
  getSolarPanelManufacturers,
  getSolarPanelModels
} from "../../../../api/solarPanel.service";
import { PreferredEquipment } from "../../../../api/preferredEquipment.service";
import {
  fetchPreferredEquipment,
  filterEquipmentByPreferred,
  getEquipmentTypeForPreferred,
  getAutoSelectEquipment,
  logPreferredFiltering,
} from "../../../../utils/preferredEquipmentHelper";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP as wp,
} from "../../../../utils/responsive";
import {
  isACIntegratedPanel,
  getACIntegratedMicroinverter
} from "../../../../utils/constants";

const requiredFields = ["selectedMake", "selectedModel", "quantity"] as const;

interface SolarPanelsSectionProps {
  values: {
    quantity?: string;
    selectedMake?: string;
    selectedMakeLabel?: string;
    selectedModel?: string;
    selectedModelLabel?: string;
    selectedPanelId?: number; // Panel ID for specs lookup
    isAcIntegrated?: boolean; // AC integrated microinverter panel
    integratedMicroMake?: string; // Integrated microinverter make
    integratedMicroModel?: string; // Integrated microinverter model
    isNew: boolean;
    isBatteryOnly?: boolean;
    showSecondPanelType?: boolean;
  };
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string; id?: number }>; // Added id field
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  label?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  onClearType2?: () => void; // Callback to clear Solar Panel Type 2 data
}

export default function SolarPanelsSection({
  values,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,
  onChange,
  errors,
  label = "Solar Panel 1",
  onOpenGallery,
  onClearType2,
}: SolarPanelsSectionProps) {
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // Debug: Log values to check if selectedPanelId is present
  // useEffect(() => {
  //   console.log("[SolarPanelSection] Values updated:", {
  //     selectedModel: values.selectedModel,
  //     selectedPanelId: values.selectedPanelId,
  //     hasModel: !!values.selectedModel,
  //     hasPanelId: !!values.selectedPanelId,
  //     shouldShowSpecs: !!(values.selectedModel && values.selectedPanelId),
  //   });
  // }, [values.selectedModel, values.selectedPanelId]);

  const [keypadVisible, setKeypadVisible] = useState(false);
  const [wattsKeypadVisible, setWattsKeypadVisible] = useState(false);
  const [tempQty, setTempQty] = useState(values.quantity ?? "");
  const [tempWatts, setTempWatts] = useState("");
  const [watts, setWatts] = useState("");
  const [panelNote, setPanelNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);

  // Solar panel data from solar_panels table (with optional wattage filtering)
  const [solarMakes, setSolarMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [solarModels, setSolarModels] = useState<Array<{ label: string; value: string; id?: number }>>([]);
  const [loadingSolarMakes, setLoadingSolarMakes] = useState(false);
  const [loadingSolarModels, setLoadingSolarModels] = useState(false);

  // Preferred equipment state
  const [preferredEquipment, setPreferredEquipment] = useState<PreferredEquipment[]>([]);
  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [allMakes, setAllMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [allModels, setAllModels] = useState<Array<{ label: string; value: string; id?: number }>>([]);

  // Reset tempQty when label (system) changes
  useEffect(() => {
    const fresh = values.quantity ?? "";
    setTempQty(fresh);
  }, [label]); // Reset when system changes

  useEffect(() => setTempQty(values.quantity ?? ""), [values.quantity]);

  // Sync tempWatts with watts when watts changes externally
  useEffect(() => setTempWatts(watts), [watts]);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Handle isNew toggle changes - re-filter equipment lists
  useEffect(() => {
    if (allMakes.length > 0) {
      const filtered = filterEquipmentByPreferred(
        allMakes,
        allModels,
        preferredEquipment,
        values.isNew,
        values.selectedMake
      );

      setSolarMakes(filtered.makes);

      // If switching to "New" and we have auto-select data, apply it
      if (values.isNew && filtered.defaultMake && !values.selectedMake) {
        onChange("selectedMake", filtered.defaultMake);
        onChange("selectedMakeLabel", filtered.defaultMakeLabel || filtered.defaultMake);

        if (filtered.defaultModel) {
          onChange("selectedModel", filtered.defaultModel);
          onChange("selectedModelLabel", filtered.defaultModelLabel || filtered.defaultModel);
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

      setSolarModels(filtered.models);
    }
  }, [values.isNew, preferredEquipment.length]); // Re-run when isNew changes or preferred equipment is loaded

  // Load preferred equipment on mount
  useEffect(() => {
    const loadPreferred = async () => {
      if (!companyId) {
        return;
      }

      setLoadingPreferred(true);
      try {
        const equipmentType = getEquipmentTypeForPreferred('solar-panel');
        const preferred = await fetchPreferredEquipment(companyId, equipmentType);
        setPreferredEquipment(preferred);

        // Auto-select default equipment if applicable
        if (values.isNew && preferred.length > 0) {
          const autoSelect = getAutoSelectEquipment(preferred, values.isNew);
          if (autoSelect && !values.selectedMake && !values.selectedModel) {
            onChange("selectedMake", autoSelect.make);
            onChange("selectedMakeLabel", autoSelect.makeLabel);
            onChange("selectedModel", autoSelect.model);
            onChange("selectedModelLabel", autoSelect.modelLabel);
          }
        }
      } catch (error) {
        console.error("[SolarPanelSection] Error loading preferred equipment:", error);
      } finally {
        setLoadingPreferred(false);
      }
    };

    loadPreferred();
  }, [companyId, label]); // Only run when company or system changes

  // Rehydration: Check AC integrated status when component mounts with existing model selection
  useEffect(() => {
    const checkAcIntegratedOnMount = async () => {
      // Only run if we have a selected model but isAcIntegrated is not set
      if (!values.selectedModel || values.isAcIntegrated !== undefined && values.isAcIntegrated !== false) {
        return;
      }

      try {
        let response;

        // Try to fetch by ID first if available
        if (values.selectedPanelId) {
          response = await getSolarPanelById(values.selectedPanelId);
        }
        // Otherwise fetch by make/model
        else if (values.selectedMake && values.selectedModel) {
          response = await getSolarPanelByMakeModel(values.selectedMake, values.selectedModel);
        }

        if (response?.status === 200 && response?.data?.success) {
          const panelData = response.data.data;
          const isAcIntegrated = panelData.integrated_ac === true ||
                                 panelData.model_number?.includes('/AC');

          // Update the AC integrated status
          onChange("isAcIntegrated", isAcIntegrated);

          if (isAcIntegrated) {
            onChange("integratedMicroMake", panelData.integrated_micro_make || "Integrated");
            onChange("integratedMicroModel", panelData.integrated_micro_model || "Integrated with Panel");
          }

          // Store panel ID if we got it
          if (panelData.id && !values.selectedPanelId) {
            onChange("selectedPanelId", panelData.id);
          }
        }
      } catch (error) {
        console.error("[SolarPanelSection] Rehydration: Error checking AC integrated:", error);
      }
    };

    checkAcIntegratedOnMount();
  }, [values.selectedModel, values.selectedMake]); // Run when model/make are loaded

  // Reload models when watts changes (clear selections to force re-filter)
  const isInitialMount = useRef(true);
  useEffect(() => {
    console.log('[SolarPanelSection] Watts changed:', { watts, isInitialMount: isInitialMount.current });
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear model selection when watts changes (so user re-selects with new filter)
    setSolarModels([]);
    onChange("selectedModel", "");
    onChange("selectedModelLabel", "");

    // If a manufacturer is already selected, reload models with new filter
    if (values.selectedMake) {
      console.log('[SolarPanelSection] Reloading models due to watts change');
      loadSolarModels();
    }
  }, [watts]);

  // Load manufacturers from solar_panels table (NO wattage filter)
  const loadSolarMakes = async () => {
    setLoadingSolarMakes(true);
    try {
      // Don't filter manufacturers by wattage - show ALL manufacturers
      const response = await getSolarPanelManufacturers();

      if (response?.status === 200 && response?.data?.success) {
        const manufacturers = response.data.data || [];
        const formatted = manufacturers.map((m: any) => ({
          label: typeof m === 'string' ? m : m.manufacturer || m.label,
          value: typeof m === 'string' ? m : m.manufacturer || m.value,
        }));

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

        setSolarMakes(filtered.makes);

        logPreferredFiltering(
          'Solar Panel Makes',
          values.isNew,
          preferredEquipment.length,
          filtered.makes.length,
          formatted.length,
          !!filtered.defaultMake
        );
      } else {
        setSolarMakes([]);
        setAllMakes([]);
      }
    } catch (error) {
      console.error("[SolarPanelSection] Error loading solar makes:", error);
      setSolarMakes([]);
      setAllMakes([]);
    } finally {
      setLoadingSolarMakes(false);
    }
  };

  // Load models from solar_panels table
  const loadSolarModels = async (manufacturer?: string) => {
    const make = manufacturer || values.selectedMake;
    if (!make) return;

    setLoadingSolarModels(true);
    try {
      const pmax = watts && watts.trim() !== "" ? parseInt(watts) : undefined;
      console.log('[SolarPanelSection] Loading models with watt filter:', { make, pmax, watts });
      const response = await getSolarPanelModels(make, pmax);

      if (response?.status === 200 && response?.data?.success) {
        const models = response.data.data || [];
        console.log('[SolarPanelSection] Received models from API:', models.length, 'models');
        const formatted = models.map((m: any) => ({
          label: m.model_number || m.modelNumber || m.label,
          value: m.model_number || m.modelNumber || m.value,
          id: m.id,
        }));

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

        console.log('[SolarPanelSection] After preferred filtering:', filtered.models.length, 'models');
        setSolarModels(filtered.models);
      } else {
        setSolarModels([]);
        setAllModels([]);
      }
    } catch (error) {
      console.error("[SolarPanelSection] Error loading solar models:", error);
      setSolarModels([]);
      setAllModels([]);
    } finally {
      setLoadingSolarModels(false);
    }
  };

  const qty = (values.quantity ?? "").trim();
  const makeVal = values.selectedMake ?? "";
  const modelVal = values.selectedModel ?? "";

  const isDirty = Boolean(qty || makeVal || modelVal || values.isBatteryOnly);
  const isComplete =
    values.isBatteryOnly ||
    requiredFields.every((f) => {
      const v = (values as any)[f];
      return v != null && v.toString().trim() !== "";
    });

  const handleQuantityClose = () => {
    onChange("quantity", tempQty.replace(/^0+/, "") || "");
    setKeypadVisible(false);
  };

  // Always use solar_panels table data (not equipment cache)
  const makeData = values.selectedMakeLabel
    ? [{ label: values.selectedMakeLabel, value: makeVal }, ...solarMakes]
    : solarMakes;

  const modelData = values.selectedModelLabel
    ? [{ label: values.selectedModelLabel, value: modelVal }, ...solarModels]
    : solarModels;

  const handleMakeOpen = () => {
    loadSolarMakes();
  };

  const handleMakeChange = async (val: string) => {
    const human = makeData.find((m) => m.value === val)?.label ?? val;
    onChange("selectedMake", val);
    onChange("selectedMakeLabel", human);
    onChange("selectedModel", "");
    onChange("selectedModelLabel", "");

    // Load models for selected make
    if (val) {
      loadSolarModels(val);
    }
  };

  const handleModelOpen = () => {
    loadSolarModels();
  };
  const handleModelChange = async (val: string) => {
    const selectedModel = modelData.find((m) => m.value === val);
    const human = selectedModel?.label ?? val;
    const panelId = selectedModel?.id;

    onChange("selectedModel", val);
    onChange("selectedModelLabel", human);

    // First, check if this panel is in our AC-integrated constant list
    const makeLabel = values.selectedMakeLabel || values.selectedMake || "";
    const isInACList = isACIntegratedPanel(makeLabel, human);

    if (isInACList) {
      // Panel is in our AC-integrated list - use our constant mapping
      const microInfo = getACIntegratedMicroinverter(makeLabel, human);

      if (microInfo) {
        console.log("[SolarPanelSection] AC-integrated panel detected from constant list:", {
          panel: `${makeLabel} ${human}`,
          microinverter: `${microInfo.microinverterMake} ${microInfo.microinverterModel}`
        });

        // Mark as AC integrated and set microinverter info
        onChange("isAcIntegrated", true);
        onChange("integratedMicroMake", microInfo.microinverterMake);
        onChange("integratedMicroModel", microInfo.microinverterModel);

        // If we have a panel ID, store it
        if (panelId) {
          onChange("selectedPanelId", panelId);
        }

        return; // Skip the API call since we have all the info we need
      }
    }

    // Fetch panel details to check if it's AC integrated (fallback to API check)
    try {
      let response;

      // Try to fetch by ID first if available
      if (panelId) {
        onChange("selectedPanelId", panelId);
        response = await getSolarPanelById(panelId);
      }
      // Otherwise fetch by make/model
      else if (values.selectedMake && human) {
        response = await getSolarPanelByMakeModel(values.selectedMake, human);
      }

      if (response?.status === 200 && response?.data?.success) {
        const panelData = response.data.data;
        const isAcIntegrated = panelData.integrated_ac === true ||
                               panelData.model_number?.includes('/AC');

        // Store the panel ID if we got it from the response
        if (panelData.id && !panelId) {
          onChange("selectedPanelId", panelData.id);
        }

        // Notify parent component about AC integrated status and micro details
        onChange("isAcIntegrated", isAcIntegrated);

        if (isAcIntegrated) {
          onChange("integratedMicroMake", panelData.integrated_micro_make || "Integrated");
          onChange("integratedMicroModel", panelData.integrated_micro_model || "Integrated with Panel");
        } else {
          onChange("integratedMicroMake", undefined);
          onChange("integratedMicroModel", undefined);
        }
      } else {
        onChange("isAcIntegrated", false);
        onChange("integratedMicroMake", undefined);
        onChange("integratedMicroModel", undefined);
      }
    } catch (error) {
      console.error("[SolarPanelSection] Error fetching panel details:", error);
      onChange("isAcIntegrated", false);
    }
  };

  const clearAll = () => {
    onChange("quantity", "");
    onChange("selectedMake", "");
    onChange("selectedMakeLabel", "");
    onChange("selectedModel", "");
    onChange("selectedModelLabel", "");
    onChange("selectedPanelId", undefined);
    onChange("isAcIntegrated", false);
    onChange("isNew", true);
    setPanelNote("");
    setShowClearModal(false);
  };

  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_PANEL_PHOTO_TAGS,
      initialNote: panelNote,
      onNotesSaved: (note) => {
        setPanelNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  // Extract system number from label (e.g., "Solar Panel 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <>
      <CollapsibleSection
        title={values.isBatteryOnly ? "Battery Only" : titleWithoutNumber}
        systemNumber={values.isBatteryOnly ? undefined : systemNumber}
        initiallyExpanded={false}
        isDirty={isDirty}
        isRequiredComplete={isComplete}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
        isLoading={isLoading}
      >
        <View style={styles.content}>
          {/* New/Existing Toggle - only show if not battery only */}
          {!values.isBatteryOnly && (
            <NewExistingToggle
              isNew={values.isNew}
              onToggle={(v) => onChange("isNew", v)}
              onTrashPress={() => setShowClearModal(true)}
            />
          )}

          {/* Form Fields - only show if not battery only */}
          {!values.isBatteryOnly && (
            <View style={styles.formFields}>
              {/* Quantity and Watts Row */}
              <View style={styles.quantityRow}>
                <View style={styles.qtyWrap}>
                  <TextInput
                    label="Quantity*"
                    value={tempQty}
                    editable
                    showNumericKeypad={true}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericText = text.replace(/[^0-9]/g, '');
                      setTempQty(numericText);
                    }}
                    onBlur={() => {
                      // Save to parent when user finishes editing
                      const cleanedQty = tempQty.replace(/^0+/, "") || "";
                      console.log('[SolarPanelSection] onBlur - saving quantity:', { tempQty, cleanedQty });
                      onChange("quantity", cleanedQty);
                    }}
                    errorText={errors.quantity}
                  />
                </View>

                <View style={styles.wattsWrap}>
                  <TextInput
                    label="Watt Filter"
                    value={tempWatts}
                    editable
                    showNumericKeypad={true}
                    onChangeText={(text) => {
                      // Only allow numbers, max 3 digits
                      const numericText = text.replace(/[^0-9]/g, '').slice(0, 3);
                      console.log('[SolarPanelSection] Watt filter onChangeText:', { text, numericText });
                      setTempWatts(numericText);
                    }}
                    onBlur={() => {
                      // Apply filter when user finishes editing
                      console.log('[SolarPanelSection] Watt filter onBlur:', { tempWatts });
                      setWatts(tempWatts);
                    }}
                  />
                </View>
              </View>

              {/* Make */}
              <Dropdown
                label="Make*"
                data={makeData}
                value={values.selectedMake}
                onOpen={handleMakeOpen}
                loading={loadingSolarMakes}
                onChange={handleMakeChange}
                errorText={errors.selectedMake}
                // enableSearch={true} // COMMENTED OUT - Search needs better solution
              />

              {/* Model */}
              <Dropdown
                label="Model*"
                data={modelData}
                value={values.selectedModel}
                onOpen={handleModelOpen}
                loading={loadingSolarModels}
                disabled={!values.selectedMake || loadingSolarModels}
                onChange={handleModelChange}
                errorText={errors.selectedModel}
                // enableSearch={true} // COMMENTED OUT - Search needs better solution
              />
            </View>
          )}

          {/* Action Buttons Row - Different buttons based on Battery Only state and AC Integrated */}
          <View style={[styles.batteryButtonRow, (values.isBatteryOnly || values.isAcIntegrated) && styles.centeredButtonRow]}>
            {values.isBatteryOnly ? (
              // Battery Only Mode: Show Add Solar Panels button
              <Button
                title="Add Solar Panels"
                onPress={() => {
                  onChange("isBatteryOnly", false);
                }}
                selected={false}
                width={wp("60%")} // Centered button, wider like in System Selection
                style={styles.batteryOnlyButton}
              />
            ) : values.isAcIntegrated ? (
              // AC Integrated Mode: Show only Battery Only button (centered)
              <Button
                title="Battery Only"
                onPress={() => {
                  onChange("isBatteryOnly", true);
                  // Clear solar panel data when switching to battery only
                  onChange("quantity", "");
                  onChange("selectedMake", "");
                  onChange("selectedMakeLabel", "");
                  onChange("selectedModel", "");
                  onChange("selectedModelLabel", "");
                }}
                selected={values.isBatteryOnly}
                width={wp("60%")} // Centered button, wider like Battery Only mode
                style={styles.batteryOnlyButton}
              />
            ) : (
              // Normal Mode: Show both buttons
              <>
                <Button
                  title="+ 2nd Panel Type"
                  onPress={() => {
                    if (values.showSecondPanelType) {
                      // User is unchecking - clear data and hide section
                      onChange("showSecondPanelType", false);
                      // Clear Solar Panel Type 2 data from database
                      onClearType2?.();
                    } else {
                      // User is checking - show section
                      onChange("showSecondPanelType", true);
                    }
                  }}
                  selected={values.showSecondPanelType}
                  width={wp("44%")} // 44% width to match System Selection buttons
                  style={styles.batteryOnlyButton}
                />

                <Button
                  title="Battery Only"
                  onPress={() => {
                    onChange("isBatteryOnly", true);
                    // Clear solar panel data when switching to battery only
                    onChange("quantity", "");
                    onChange("selectedMake", "");
                    onChange("selectedMakeLabel", "");
                    onChange("selectedModel", "");
                    onChange("selectedModelLabel", "");
                  }}
                  selected={values.isBatteryOnly}
                  width={wp("44%")} // 44% width to match System Selection buttons
                  style={styles.batteryOnlyButton}
                />
              </>
            )}
          </View>
        </View>
      </CollapsibleSection>

      {/* Quantity Keypad */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={tempQty}
        onNumberPress={(n) =>
          setTempQty((prev) => (prev === "" || prev === "0" ? n : prev + n))
        }
        onBackspace={() => setTempQty((prev) => prev.slice(0, -1))}
        onClose={handleQuantityClose}
      />

      {/* Watts Keypad */}
      <NumericKeypad
        isVisible={wattsKeypadVisible}
        currentValue={tempWatts}
        title="Wattage Filter"
        onNumberPress={(n) => {
          if (tempWatts.length < 3) {
            setTempWatts((prev) => (prev === "" || prev === "0" ? n : prev + n));
          }
        }}
        onBackspace={() => setTempWatts((prev) => prev.slice(0, -1))}
        onClose={() => {
          setWatts(tempWatts);
          setWattsKeypadVisible(false);
        }}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        onConfirm={clearAll}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Solar Panel Specs Modal */}
      <SolarPanelSpecsModal
        visible={specsModalVisible}
        panelId={values.selectedPanelId || null}
        manufacturer={values.selectedMakeLabel || values.selectedMake}
        modelNumber={values.selectedModelLabel || values.selectedModel}
        onClose={() => setSpecsModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    width: "100%",
  },
  formFields: {
    width: "100%",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
  },
  qtyWrap: {
    width: moderateScale(180),
    marginBottom: verticalScale(-10),
  },
  wattsWrap: {
    width: moderateScale(180),
    marginBottom: verticalScale(-10),
  },
  specsLink: {
    marginLeft: moderateScale(12),
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(8),
  },
  specsText: {
    color: "#FFB02E",
    fontSize: moderateScale(14),
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  batteryButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
  },
  centeredButtonRow: {
    justifyContent: "center",
  },
  batteryOnlyButton: {
    // No additional styles needed - Button component handles it
    // This matches the System Selection buttons exactly
  },
});
