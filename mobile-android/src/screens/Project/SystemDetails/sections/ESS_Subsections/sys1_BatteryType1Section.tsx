// src/screens/Project/SystemDetails/sections/ESS_Subsections/sys1_BatteryType1Section.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { useProjectContext } from "../../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../../hooks/usePhotoCapture";
import { DEFAULT_INVERTER_PHOTO_TAGS } from "../../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../../utils/responsive";
import CollapsibleSection from "../../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../../components/NewExistingToggle";
import TextInput from "../../../../../components/TextInput";
import Dropdown from "../../../../../components/Dropdown";
import NumericKeypad from "../../../../../components/NumericKeypad";
import ConfirmClearModal from "../../../../../components/Modals/ConfirmClearModal";
import EquipmentReminderModal from "../../../../../components/Modals/EquipmentReminderModal";
import SystemButton from "../../../../../components/Button/SystemButton";

interface Props {
  values: {
    quantity: number | string;
    selectedMake: string;
    selectedModel: string;
    configuration: string;
    isNew: boolean;
    tieInLocation?: string; // NEW: Tie-in location (e.g., "SMS - Franklin aGate", "Main Panel")
  };
  onChange: (field: string, value: any) => void;
  errors: { [k: string]: string };
  onClear?: () => void;

  /** Show the "Battery Type 2" button (true when BT2 hasn't been added yet) */
  showAddType2: boolean;
  /** Called when user taps "Battery Type 2" */
  onAddType2: () => void;

  /** Explicit control over BT1 configuration visibility (qty>1 && !BT2) */
  showConfigInThisSection?: boolean;

  /** Provided by parent (catalog data/loaders) */
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string }>;
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;

  /** NEW: suppress ESS subsection for Tesla PowerWall */
  suppressESS?: boolean;

  label?: string;
  debugFetch?: boolean; // kept for parity; unused here

  // BOS props
  showBOSButton?: boolean; // Show the Add BOS button
  onShowBOS?: () => void; // Callback when Add BOS button is clicked

  // NEW: Equipment info for tie-in location options
  smsData?: { make: string; model: string } | null;
  inverterData?: { make: string; model: string } | null;
  batteryCombinerPanelData?: { make: string; model: string } | null;
}

const configOptions = [
  { label: "Daisy Chain", value: "daisy_chain" },
  { label: "Battery Combiner Panel", value: "combiner_panel" },
  { label: "Inverter", value: "inverter" },
];

export default function BatteryType1Section({
  values,
  onChange,
  errors,
  onClear,
  showAddType2,
  onAddType2,
  showConfigInThisSection,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,
  label = "Battery Type 1",
  suppressESS = false,
  showBOSButton = false,
  onShowBOS,
  smsData,
  inverterData,
  batteryCombinerPanelData,
}: Props) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // If not explicitly provided, default to: qty>1 && can still add BT2
  const qtyNum = Number(values.quantity || 0);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const computedShowConfig =
    showConfigInThisSection ?? (showAddType2 && qtyNum > 1);

  // Franklin aPower battery detection: requires Battery Combiner Panel for qty > 1
  const isFranklinAPower =
    values.selectedMake?.toLowerCase().includes('franklin') &&
    values.selectedModel?.toLowerCase().includes('apower') &&
    qtyNum > 1;

  // Get filtered configuration options based on battery type
  const getConfigOptions = () => {
    if (isFranklinAPower) {
      // Only Battery Combiner Panel allowed for Franklin aPower with qty > 1
      return [{ label: "Battery Combiner Panel", value: "combiner_panel" }];
    }
    return configOptions;
  };

  const filteredConfigOptions = getConfigOptions();

  // DEBUG: Log configuration state
  console.log('[Battery Type 1] Render state:', {
    qtyNum,
    computedShowConfig,
    isFranklinAPower,
    currentConfiguration: values.configuration,
    filteredConfigOptions,
    showAddType2,
    showConfigInThisSection,
  });

  // Tie-in Location state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEquipmentType, setReminderEquipmentType] = useState<string>("");

  // Auto-select Battery Combiner Panel for Franklin aPower batteries with qty > 1
  useEffect(() => {
    if (isFranklinAPower && values.configuration !== "combiner_panel") {
      console.log('[Battery] Franklin aPower detected with qty > 1 - auto-selecting Battery Combiner Panel');
      onChange("configuration", "combiner_panel");
    }
  }, [isFranklinAPower, values.configuration, onChange]);

  // Build tie-in location options based on available equipment
  const buildTieInLocationOptions = (): Array<{ label: string; value: string }> => {
    const options: Array<{ label: string; value: string }> = [];

    // Storage Management System (SMS)
    if (smsData?.make && smsData?.model) {
      options.push({
        label: `SMS - ${smsData.make} ${smsData.model}`,
        value: `SMS - ${smsData.make} ${smsData.model}`,
      });
    } else {
      // Generic SMS option if no SMS selected
      options.push({
        label: "SMS",
        value: "SMS",
      });
    }

    // Inverter
    if (inverterData?.make && inverterData?.model) {
      options.push({
        label: `Inverter - ${inverterData.make} ${inverterData.model}`,
        value: `Inverter - ${inverterData.make} ${inverterData.model}`,
      });
    }

    // Main Panel
    options.push({ label: "Main Panel", value: "Main Panel" });

    // Sub Panel
    options.push({ label: "Sub Panel", value: "Sub Panel" });

    // Battery Combiner Panel
    if (batteryCombinerPanelData?.make && batteryCombinerPanelData?.model) {
      options.push({
        label: `Battery Combiner Panel - ${batteryCombinerPanelData.make} ${batteryCombinerPanelData.model}`,
        value: `Battery Combiner Panel - ${batteryCombinerPanelData.make} ${batteryCombinerPanelData.model}`,
      });
    } else {
      options.push({
        label: "Battery Combiner Panel",
        value: "Battery Combiner Panel",
      });
    }

    // Backup Load Sub Panel
    options.push({ label: "Backup Load Sub Panel", value: "Backup Load Sub Panel" });

    return options;
  };

  const tieInLocationOptions = buildTieInLocationOptions();

  // Handle tie-in location change with validation
  const handleTieInLocationChange = (value: string) => {
    // Check if user selected SMS without having SMS configured
    if (value === "SMS" && (!smsData?.make || !smsData?.model)) {
      setReminderEquipmentType("SMS");
      setShowReminderModal(true);
      onChange("tieInLocation", value);
      return;
    }

    // Check if user selected Battery Combiner Panel without having one configured
    if (value === "Battery Combiner Panel" && (!batteryCombinerPanelData?.make || !batteryCombinerPanelData?.model)) {
      setReminderEquipmentType("Battery Combiner Panel");
      setShowReminderModal(true);
      onChange("tieInLocation", value);
      return;
    }

    onChange("tieInLocation", value);
  };

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Auto-update tie-in location when equipment changes
  useEffect(() => {
    const currentLocation = values.tieInLocation;

    // If user selected "SMS" and now SMS is configured, auto-update to include make/model
    if (currentLocation === "SMS" && smsData?.make && smsData?.model) {
      const newValue = `SMS - ${smsData.make} ${smsData.model}`;
      onChange("tieInLocation", newValue);
    }

    // If user selected "Battery Combiner Panel" and now it's configured, auto-update
    if (currentLocation === "Battery Combiner Panel" && batteryCombinerPanelData?.make && batteryCombinerPanelData?.model) {
      const newValue = `Battery Combiner Panel - ${batteryCombinerPanelData.make} ${batteryCombinerPanelData.model}`;
      onChange("tieInLocation", newValue);
    }
  }, [smsData?.make, smsData?.model, batteryCombinerPanelData?.make, batteryCombinerPanelData?.model, values.tieInLocation, onChange]);

  // — Numeric keypad mirror —
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [tempQty, setTempQty] = useState(values.quantity?.toString() ?? "");
  useEffect(() => {
    setTempQty(values.quantity?.toString() ?? "");
  }, [values.quantity]);

  // — Validation & dirty —
  const hasText = (v: any) => String(v || "").trim().length > 0;
  const isDirty =
    !!values.quantity ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    !!values.configuration ||
    values.isNew === false;

  const isRequiredComplete =
    hasText(values.selectedMake) &&
    hasText(values.selectedModel) &&
    (qtyNum > 1 ? hasText(values.configuration) : true);

  const canAddType2 = isRequiredComplete;

  // — Numeric keypad handlers —
  const handleNumberPress = (num: string) => {
    if (tempQty.length < 2) setTempQty((t) => (t === "0" ? num : t + num));
  };
  const handleBackspace = () => setTempQty((t) => t.slice(0, -1));
  const handleKeypadClose = () => {
    onChange("quantity", tempQty.replace(/^0+/, "") || "");
    setKeypadVisible(false);
  };

  // — Clear modal —
  const [showClearModal, setShowClearModal] = useState(false);
  const clearAll = () => {
    // Clear UI state
    onChange("quantity", "");
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("configuration", "");
    onChange("tieInLocation", "");
    onChange("isNew", true);
    setSectionNote("");
    setShowClearModal(false);

    // Clear database
    onClear?.();
  };

  // Auto-clear battery data when suppression is activated
  useEffect(() => {
    if (
      suppressESS &&
      (values.quantity ||
        values.selectedMake ||
        values.selectedModel ||
        values.configuration ||
        !values.isNew)
    ) {
      onChange("quantity", "");
      onChange("selectedMake", "");
      onChange("selectedModel", "");
      onChange("configuration", "");
      onChange("isNew", true);
    }
  }, [
    suppressESS,
    values.quantity,
    values.selectedMake,
    values.selectedModel,
    values.configuration,
    values.isNew,
    onChange,
  ]);

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
      },
    });
  };

  // Hide the entire Battery Type 1 section when suppressed
  if (suppressESS) {
    return null;
  }

  // Extract system number from label (e.g., "Battery Type 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <>
      <CollapsibleSection
        title={titleWithoutNumber}
        systemNumber={systemNumber}
        initiallyExpanded={false}
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
        isLoading={isLoading}
      >
        <View style={styles.container}>
          <NewExistingToggle
            isNew={values.isNew}
            onToggle={(v) => onChange("isNew", v)}
            onTrashPress={() => setShowClearModal(true)}
          />
          <ConfirmClearModal
            visible={showClearModal}
            sectionTitle={label}
            customMessage="This will clear the Battery Type 1 section."
            onConfirm={clearAll}
            onCancel={() => setShowClearModal(false)}
          />

          {/* Quantity */}
          <View style={styles.quantityWrap}>
            <TextInput
              label="Quantity*"
              placeholder="00"
              value={values.quantity?.toString() ?? ""}
              editable
              showNumericKeypad={true}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, '');
                onChange("quantity", numericText || "");
              }}
              errorText={errors.quantity}
            />
          </View>

          {/* Make */}
          <Dropdown
            label="Make*"
            data={makes}
            value={values.selectedMake}
            onOpen={loadMakes}
            loading={loadingMakes}
            onChange={(v) => {
              onChange("selectedMake", v);
              onChange("selectedModel", ""); // reset model when make changes
            }}
            errorText={errors.selectedMake}
          />

          {/* Model */}
          <Dropdown
            label="Model*"
            data={models}
            value={values.selectedModel}
            onOpen={loadModels}
            loading={loadingModels}
            disabled={!values.selectedMake}
            onChange={(v) => onChange("selectedModel", v)}
            errorText={errors.selectedModel}
          />

          {/* Tie-in Location */}
          <Dropdown
            label="Tie-in Location"
            data={tieInLocationOptions}
            value={values.tieInLocation || ""}
            onChange={handleTieInLocationChange}
            errorText={errors.tieInLocation}
          />

          {/* Configuration (only while BT2 not added, qty>1) — ABOVE the add button */}
          {computedShowConfig && (
            <Dropdown
              label="Configuration*"
              data={filteredConfigOptions}
              value={values.configuration}
              onChange={(v) => {
                console.log('[Battery Type 1] Configuration dropdown onChange called:', {
                  newValue: v,
                  currentValue: values.configuration,
                  options: filteredConfigOptions,
                });
                onChange("configuration", v);
              }}
              errorText={errors.configuration}
              disabled={isFranklinAPower} // Disable dropdown for Franklin aPower (only one option)
            />
          )}

          {/* Battery Type 2 button (outline/empty, full width) */}
          {showAddType2 && (
            <SystemButton
              label="Battery Type 2"
              active={false}
              onPress={() => canAddType2 && onAddType2()}
              style={styles.addButton}
            />
          )}

          {/* BOS Section */}
          {showBOSButton && onShowBOS && (
            <View style={styles.bosSection}>
              <SystemButton
                label="Add Battery BOS Equipment"
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

      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={tempQty}
        onNumberPress={handleNumberPress}
        onBackspace={handleBackspace}
        onClose={handleKeypadClose}
      />

      <EquipmentReminderModal
        visible={showReminderModal}
        equipmentType={reminderEquipmentType}
        onClose={() => setShowReminderModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  quantityWrap: ViewStyle;
  addButton: ViewStyle;
  bosSection: ViewStyle;
  addBOSButton: ViewStyle;
}>({
  container: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: moderateScale(8),
  },
  quantityWrap: {
    width: moderateScale(180),
    alignSelf: "flex-start",
  },
  addButton: {
    marginTop: verticalScale(12),
    marginBottom: verticalScale(15),
    alignSelf: "stretch", // full width like other SystemButtons
  },
  bosSection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  addBOSButton: {
    width: "100%",
  },
});
