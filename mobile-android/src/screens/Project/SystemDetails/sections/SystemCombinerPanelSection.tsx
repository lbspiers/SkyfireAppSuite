// src/screens/Project/SystemDetails/sections/SystemCombinerPanelSection.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_ELECTRICAL_PHOTO_TAGS, BUS_BAR_RATING } from "../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

type LabeledOption = { label: string; value: string };

// Static dropdown options
const busAmpOptions: LabeledOption[] = [{ label: "###", value: "" }].concat(
  BUS_BAR_RATING
);
const mainBreakerOptions: LabeledOption[] = [{ label: "###", value: "" }]
  .concat([{ label: "MLO", value: "mlo" }])
  .concat(
    [100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600].map(
      (v) => ({ label: String(v), value: String(v) })
    )
  );

// Required fields for completeness check
const requiredFields = [
  "selectedMake",
  "selectedModel",
  "selectedBusAmps",
  "selectedMainBreaker",
] as const;

interface Props {
  values: {
    isNew: boolean;
    selectedMake: string;
    selectedModel: string;
    selectedBusAmps: string;
    selectedMainBreaker: string;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  label?: string;
  debugFetch?: boolean;

  // Provided by parent
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string }>;
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;
  onClear?: () => Promise<void>; // Callback to clear database
}

export default function SystemCombinerPanelSection({
  values,
  onChange,
  errors,
  label = "System Combiner Panel",
  debugFetch = true,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,
  onClear,
}: Props) {
  console.log('🎯 [SystemCombinerPanelSection] ✅ NEW COMPONENT LOADED! Using new SystemCombinerPanelSection component', {
    label,
    selectedMake: values.selectedMake,
    selectedModel: values.selectedModel,
    makesCount: makes.length,
    modelsCount: models.length,
    isNew: values.isNew,
  });

  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // UI state
  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Use the dynamic models prop from parent (fetched from API)
  const modelsToUse = models;

  // Ensure default MLO if empty
  useEffect(() => {
    if (!values.selectedMainBreaker) {
      onChange("selectedMainBreaker", "mlo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  const clearAll = async () => {
    onChange("isNew", true);
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("selectedBusAmps", "");
    onChange("selectedMainBreaker", "mlo");
    setSectionNote("");

    // Call parent's clear callback to clear database
    if (onClear) {
      await onClear();
    }
  };

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_ELECTRICAL_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  const isDirty =
    !values.isNew ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    !!values.selectedBusAmps ||
    !!values.selectedMainBreaker;

  const isRequiredComplete = requiredFields.every((f) => {
    const v = (values as any)[f];
    return v !== "" && v != null;
  });

  // Extract system number from label (e.g., "System Combiner Panel 1" -> "1")
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
        fullWidth={true}
      >
        <View style={styles.sectionContent}>
          <NewExistingToggle
            isNew={values.isNew}
            onToggle={(v) => onChange("isNew", v)}
            onTrashPress={() => setShowClearModal(true)}
          />
          <ConfirmClearModal
            visible={showClearModal}
            sectionTitle={label}
            onConfirm={async () => {
              await clearAll();
              setShowClearModal(false);
            }}
            onCancel={() => setShowClearModal(false)}
          />

          {/* Make */}
          <Dropdown
            label="Make*"
            data={makes}
            value={values.selectedMake}
            onOpen={loadMakes}
            loading={loadingMakes}
            onChange={(v) => {
              onChange("selectedMake", v);
              onChange("selectedModel", "");
            }}
            errorText={errors.selectedMake}
          />

          {/* Model */}
          <Dropdown
            label="Model*"
            data={modelsToUse}
            value={values.selectedModel}
            disabled={!values.selectedMake}
            loading={loadingModels}
            onChange={(v) => {
              onChange("selectedModel", v);

              // Auto-populate Bus (Amps) from model name if it contains "XXX Amp" or "XXX Amps"
              // Example: "200 Amps" -> set Bus to "200"
              const modelEntry = modelsToUse.find(m => m.value === v);
              const modelLabel = modelEntry?.label || v;
              const ampMatch = modelLabel.match(/(\d+)\s*Amps?/i);

              if (ampMatch) {
                const ampValue = ampMatch[1];
                console.log('[SystemCombinerPanel] Auto-populating Bus from model:', { modelLabel, ampValue });
                onChange("selectedBusAmps", ampValue);
              } else {
                // Model doesn't contain amp rating, clear Bus field
                console.log('[SystemCombinerPanel] Model does not contain amp rating, clearing Bus:', { modelLabel });
                onChange("selectedBusAmps", "");
              }
            }}
            errorText={errors.selectedModel}
          />

          {/* Bus (Amps) */}
          <View style={styles.dropdownWrap}>
            <Dropdown
              label="Bus (Amps)*"
              data={busAmpOptions}
              value={values.selectedBusAmps}
              onChange={(v) => onChange("selectedBusAmps", v)}
              errorText={errors.selectedBusAmps}
            />
          </View>

          {/* Main Breaker + MLO - No radial button needed, just dropdown with MLO option */}
          <View style={styles.dropdownWrap}>
            <Dropdown
              label="Main Circuit Breaker*"
              data={mainBreakerOptions}
              value={values.selectedMainBreaker}
              onChange={(v) => onChange("selectedMainBreaker", v)}
              errorText={errors.selectedMainBreaker}
            />
          </View>
        </View>
      </CollapsibleSection>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    gap: moderateScale(12),
  },
  dropdownWrap: {
    width: moderateScale(180),
    alignSelf: "flex-start",
  },
});
