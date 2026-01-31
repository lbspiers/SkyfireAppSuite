import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_PANEL_PHOTO_TAGS } from "../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

type LabeledOption = { label: string; value: string };

interface OptimizerSectionProps {
  values: {
    isNew: boolean;
    selectedMake: string; // optimizer manufacturer
    selectedModel: string; // optimizer model
  };
  onChange: (
    field: "isNew" | "selectedMake" | "selectedModel",
    value: any
  ) => void;
  errors: Record<string, string>;

  // Catalog data + lazy loaders (same pattern as Battery/Combiner)
  makes: LabeledOption[];
  models: LabeledOption[];
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;

  label?: string;
  suppressOptimizer?: boolean; // NEW: Hide optimizer section for certain inverter types
  isSolarEdge?: boolean; // NEW: Flag to determine if this is a SolarEdge inverter
  onHideOptimizer?: () => void; // NEW: Callback to hide the optimizer section for non-SolarEdge
}

const OptimizerSection: React.FC<OptimizerSectionProps> = ({
  values,
  onChange,
  errors,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  label = "Inverter Optimizer",
  suppressOptimizer = false,
  isSolarEdge = false,
  onHideOptimizer,
}) => {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Auto-clear optimizer data when suppression is activated
  useEffect(() => {
    if (suppressOptimizer && (values.selectedMake || values.selectedModel || !values.isNew)) {
      // Clear data directly instead of calling clearAll to avoid dependency issues
      onChange("isNew", true);
      onChange("selectedMake", "");
      onChange("selectedModel", "");
      setSectionNote("");
    }
  }, [suppressOptimizer, values.selectedMake, values.selectedModel, values.isNew, onChange]);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  const isDirty =
    values.isNew === false || !!values.selectedMake || !!values.selectedModel;

  const isRequiredComplete = !!values.selectedMake && !!values.selectedModel;

  const clearAll = () => {
    onChange("isNew", true);
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    setSectionNote("");
    setShowClearModal(false);

    // If not SolarEdge, hide the optimizer section and show "Add Optimizers" button
    if (!isSolarEdge && onHideOptimizer) {
      onHideOptimizer();
    }
  };

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_PANEL_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  // Hide the entire optimizer section when suppressed
  if (suppressOptimizer) {
    return null;
  }

  return (
    <View>
      <View style={styles.row}>
        <NewExistingToggle
          isNew={values.isNew}
          onToggle={(val) => onChange("isNew", val)}
          onTrashPress={() => {
            if (isSolarEdge) {
              // SolarEdge requires optimizers, just show the modal to clear data (not remove section)
              setShowClearModal(true);
            } else {
              // For non-SolarEdge, show modal which will hide section on confirm
              setShowClearModal(true);
            }
          }}
        />
      </View>

      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        onConfirm={clearAll}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Make */}
      <Dropdown
        label="Make*"
        data={makes}
        value={values.selectedMake}
        onOpen={loadMakes}
        loading={loadingMakes}
        onChange={(val) => {
          // update make and clear model so user re-picks within the new make
          onChange("selectedMake", val);
          onChange("selectedModel", "");
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
        onChange={(val) => onChange("selectedModel", val)}
        errorText={errors.selectedModel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
    gap: moderateScale(20),
  },
});

export default OptimizerSection;
