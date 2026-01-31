// src/screens/Project/SystemDetails/sections/SolarPanelType2Section.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import TextInput from "../../../../components/TextInput";
import Dropdown from "../../../../components/Dropdown";
import NumericKeypad from "../../../../components/NumericKeypad";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_PANEL_PHOTO_TAGS } from "../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

const requiredFields = ["selectedMake", "selectedModel", "quantity"] as const;

interface SolarPanelType2SectionProps {
  values: {
    quantity?: string;
    selectedMake?: string;
    selectedMakeLabel?: string;
    selectedModel?: string;
    selectedModelLabel?: string;
    isNew: boolean;
  };
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string }>;
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  label?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  onRemove: () => void; // Callback to remove this section
}

export default function SolarPanelType2Section({
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
  label = "Solar Panel 1 - Type 2",
  onOpenGallery,
  onRemove,
}: SolarPanelType2SectionProps) {
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  const [keypadVisible, setKeypadVisible] = useState(false);
  const [tempQty, setTempQty] = useState(values.quantity ?? "");
  const [panelNote, setPanelNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [showClearModal, setShowClearModal] = useState(false);

  // Reset tempQty when label (system) changes
  useEffect(() => {
    const fresh = values.quantity ?? "";
    setTempQty(fresh);
  }, [label]); // Reset when system changes

  useEffect(() => setTempQty(values.quantity ?? ""), [values.quantity]);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  const qty = (values.quantity ?? "").trim();
  const makeVal = values.selectedMake ?? "";
  const modelVal = values.selectedModel ?? "";

  const isDirty = Boolean(qty || makeVal || modelVal);
  const isComplete = requiredFields.every((f) => {
    const v = (values as any)[f];
    return v != null && v.toString().trim() !== "";
  });

  const handleQuantityClose = () => {
    onChange("quantity", tempQty.replace(/^0+/, "") || "");
    setKeypadVisible(false);
  };

  const makeData = values.selectedMakeLabel
    ? [{ label: values.selectedMakeLabel, value: makeVal }, ...makes]
    : makes;

  const modelData = values.selectedModelLabel
    ? [{ label: values.selectedModelLabel, value: modelVal }, ...models]
    : models;

  const handleMakeOpen = () => loadMakes();
  const handleMakeChange = (val: string) => {
    const human = makeData.find((m) => m.value === val)?.label ?? val;
    onChange("selectedMake", val);
    onChange("selectedMakeLabel", human);
    onChange("selectedModel", "");
    onChange("selectedModelLabel", "");
    // Note: Removed auto-capture logic - let user control new/existing toggle
  };

  const handleModelOpen = () => loadModels();
  const handleModelChange = (val: string) => {
    const human = modelData.find((m) => m.value === val)?.label ?? val;
    onChange("selectedModel", val);
    onChange("selectedModelLabel", human);
    // Note: Removed auto-capture logic - let user control new/existing toggle
  };

  const clearAll = () => {
    onChange("quantity", "");
    onChange("selectedMake", "");
    onChange("selectedMakeLabel", "");
    onChange("selectedModel", "");
    onChange("selectedModelLabel", "");
    onChange("isNew", true);
    setPanelNote("");
    setShowClearModal(false);
    onRemove(); // Remove this section after clearing
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

  // Extract system number from label (e.g., "Solar Panel 1 - Type 2" -> "1")
  const systemNumber = label.match(/\d+/)?.[0];
  const titleWithoutNumber = label.replace(/\s*\d+\s*-?\s*/, "");

  return (
    <>
      <CollapsibleSection
        title={titleWithoutNumber}
        systemNumber={systemNumber}
        initiallyExpanded={false}
        isDirty={isDirty}
        isRequiredComplete={isComplete}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
        isLoading={isLoading}
      >
        <View style={styles.content}>
          <NewExistingToggle
            isNew={values.isNew}
            onToggle={(v) => onChange("isNew", v)}
            onTrashPress={() => setShowClearModal(true)}
          />

          {/* Form Fields - no buttons underneath for Type 2 */}
          <View style={styles.formFields}>
            {/* Quantity */}
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
                  onChange("quantity", tempQty.replace(/^0+/, "") || "");
                }}
                errorText={errors.quantity}
              />
            </View>

            {/* Make */}
            <Dropdown
              label="Make*"
              data={makeData}
              value={values.selectedMake}
              onOpen={handleMakeOpen}
              loading={loadingMakes}
              onChange={handleMakeChange}
              errorText={errors.selectedMake}
            />

            {/* Model */}
            <Dropdown
              label="Model*"
              data={modelData}
              value={values.selectedModel}
              onOpen={handleModelOpen}
              loading={loadingModels}
              disabled={!values.selectedMake || loadingModels}
              onChange={handleModelChange}
              errorText={errors.selectedModel}
            />
          </View>
        </View>
      </CollapsibleSection>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={tempQty}
        onNumberPress={(n) =>
          setTempQty((prev) => (prev === "" || prev === "0" ? n : prev + n))
        }
        onBackspace={() => setTempQty((prev) => prev.slice(0, -1))}
        onClose={handleQuantityClose}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        onConfirm={clearAll}
        onCancel={() => setShowClearModal(false)}
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
  qtyWrap: {
    width: moderateScale(180),
    marginBottom: verticalScale(-12),
  },
});