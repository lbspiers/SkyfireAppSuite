// src/screens/Project/SystemDetails/sections/ESS_Subsections/sys1_BatteryType2Section.tsx
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
  /** Battery 1 quantity (for any UI logic you want to apply) */
  battery1Quantity: number | string;

  values: {
    quantity: number | string;
    selectedMake: string;
    selectedModel: string;
    configuration: string;
    isNew: boolean;
    tieInLocation?: string; // NEW: Tie-in location
  };
  onChange: (field: string, value: any) => void;
  onClearType2: () => void;
  errors: { [k: string]: string };

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
  debugFetch?: boolean; // kept for parity

  // BOS props
  showBOSButton?: boolean; // Show the Add BOS button
  onShowBOS?: () => void; // Callback when Add BOS button is clicked

  // NEW: Equipment info for tie-in location options
  smsData?: { make: string; model: string } | null;
  inverterData?: { make: string; model: string } | null;
  batteryCombinerPanelData?: { make: string; model: string } | null;
}

type LabeledOption = { label: string; value: string };

const configOptions: LabeledOption[] = [
  { label: "Daisy Chain", value: "daisy_chain" },
  { label: "Battery Combiner Panel", value: "combiner_panel" },
];

export default function BatteryType2Section({
  battery1Quantity, // not used here directly, but kept for future logic
  values,
  onChange,
  onClearType2,
  errors,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,
  label = "Battery Type 2",
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

  // — Numeric keypad mirror —
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [tempQty, setTempQty] = useState(values.quantity?.toString() ?? "");
  useEffect(() => {
    setTempQty(values.quantity?.toString() ?? "");
  }, [values.quantity]);

  // Tie-in Location state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEquipmentType, setReminderEquipmentType] = useState<string>("");

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

  // — Validation & dirty —
  const hasText = (v: any) => String(v || "").trim().length > 0;
  const isDirty =
    values.isNew === false ||
    !!values.quantity ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    !!values.configuration;

  // Type 2 requires config (it owns the global config when visible)
  const isRequiredComplete =
    hasText(values.selectedMake) &&
    hasText(values.selectedModel) &&
    hasText(values.configuration);

  // — Keypad handlers —
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
    onChange("quantity", "");
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("configuration", "");
    onChange("tieInLocation", "");
    onChange("isNew", true);
    setSectionNote("");
    onClearType2(); // tell parent to hide the section
    setShowClearModal(false);
  };

  // Auto-clear battery data when suppression is activated
  useEffect(() => {
    if (suppressESS && (values.quantity || values.selectedMake || values.selectedModel || values.configuration || !values.isNew)) {
      onChange("quantity", "");
      onChange("selectedMake", "");
      onChange("selectedModel", "");
      onChange("configuration", "");
      onChange("isNew", true);
      onClearType2(); // tell parent to hide the section
    }
  }, [suppressESS, values.quantity, values.selectedMake, values.selectedModel, values.configuration, values.isNew, onChange, onClearType2]);

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

  // Hide the entire Battery Type 2 section when suppressed
  if (suppressESS) {
    return null;
  }

  // Extract system number from label (e.g., "Battery Type 2" -> "2")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <>
      <CollapsibleSection
        title={titleWithoutNumber}
        systemNumber={systemNumber}
        initiallyExpanded={false}
        isDirty={!!isDirty}
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
            customMessage="This will clear the Battery Type 2 section."
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

          {/* Configuration — Type 2 owns it while visible */}
          <Dropdown
            label="Configuration*"
            data={configOptions}
            value={values.configuration}
            onChange={(v) => onChange("configuration", v)}
            errorText={errors.configuration}
          />

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
  bosSection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  addBOSButton: {
    width: "100%",
  },
});
