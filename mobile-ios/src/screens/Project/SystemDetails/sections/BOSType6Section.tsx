// src/screens/Project/SystemDetails/sections/BOSType6Section.tsx

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import Dropdown from "../../../../components/Dropdown";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import SystemButton from "../../../../components/Button/SystemButton";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { DEFAULT_BOS_PHOTO_TAGS } from "../../../../utils/constants";
import { PreferredEquipment } from "../../../../api/preferredEquipment.service";
import {
  fetchPreferredEquipment,
  filterEquipmentByPreferred,
  getEquipmentTypeForPreferred,
  getAutoSelectEquipment,
  logPreferredFiltering,
} from "../../../../utils/preferredEquipmentHelper";
import {
  EQUIPMENT_CATALOG,
  BOS_EQUIPMENT_TRANSLATION,
  UTILITY_EQUIPMENT_TO_STANDARD,
  getUtilityEquipmentTypeOptions,
} from "../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

interface BOSType6SectionProps {
  values: {
    isNew: boolean;
    equipmentType: string;
    ampRating: string;
    make: string;
    model: string;
  };
  onChange: (
    field: "isNew" | "equipmentType" | "ampRating" | "make" | "model",
    value: any
  ) => void;
  errors: Record<string, string>;
  label?: string;
  maxContinuousOutputAmps?: number | null;
  loadingMaxOutput?: boolean;
  onRemove?: () => void;
  showAddBOSType7Button?: boolean;
  onAddBOSType7?: () => void;
  utilityAbbrev?: string;
  sizingLabel?: string; // Section-specific label (e.g., "Inverter Output", "Backup Panel Rating")
  sizingCalculation?: string; // Calculation breakdown (e.g., "32A × 1.25 = 40A")
}

const BOSType6Section: React.FC<BOSType6SectionProps> = ({
  values,
  onChange,
  errors,
  label = "Pre-Combine BOS Equipment",
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
  onRemove,
  showAddBOSType7Button = false,
  onAddBOSType7,
  utilityAbbrev,
  sizingLabel,
  sizingCalculation,
}) => {
  // Translate utility-specific variation name back to standard catalog name for filtering
  // Direction: Utility-Specific Variation (displayed) → Standard Name (for catalog filtering)
  // This is a reverse lookup in the translation table
  const translateToStandardName = (variationName: string): string => {
    if (!variationName) return variationName;

    if (utilityAbbrev) {
      const utilityTranslations = BOS_EQUIPMENT_TRANSLATION[utilityAbbrev];
      if (utilityTranslations) {
        for (const [standardName, variation] of Object.entries(utilityTranslations)) {
          if (variation === variationName) {
            variationName = standardName;
            break;
          }
        }
      }
    }

    if (UTILITY_EQUIPMENT_TO_STANDARD[variationName]) {
      return UTILITY_EQUIPMENT_TO_STANDARD[variationName];
    }

    return variationName;
  };
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);

  // Preferred equipment state
  const [preferredEquipment, setPreferredEquipment] = useState<PreferredEquipment[]>([]);
  const [loadingPreferred, setLoadingPreferred] = useState(false);
  const [allMakes, setAllMakes] = useState<Array<{ label: string; value: string }>>([]);
  const [allModels, setAllModels] = useState<Array<{ label: string; value: string }>>([]);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Load preferred equipment on mount
  useEffect(() => {
    const loadPreferred = async () => {
      if (!companyId || !values.equipmentType) return;
      setLoadingPreferred(true);
      try {
        const equipmentType = getEquipmentTypeForPreferred(values.equipmentType);
        const preferred = await fetchPreferredEquipment(companyId, equipmentType);
        console.log(`[BOSType6Section] Loaded ${preferred.length} preferred equipment for type: "${values.equipmentType}" → "${equipmentType}"`);
        setPreferredEquipment(preferred);
        if (values.isNew && preferred.length > 0 && values.equipmentType) {
          const autoSelect = getAutoSelectEquipment(preferred, values.isNew);
          if (autoSelect && !values.make && !values.model) {
            onChange("make", autoSelect.make);
            onChange("model", autoSelect.model);
          }
        }
      } catch (error) {
        console.error("[BOSType6Section] Error loading preferred equipment:", error);
      } finally {
        setLoadingPreferred(false);
      }
    };
    loadPreferred();
  }, [companyId, label, values.equipmentType]);

  // Track previous values to detect actual changes (not just hydration)
  const prevEquipmentType = useRef<string>("");
  const prevAmpRating = useRef<string>("");
  const prevMake = useRef<string>("");

  // Cascade resets when equipment type changes (skip if transitioning from empty)
  useEffect(() => {
    // Skip if transitioning from empty to populated (hydration)
    if (!prevEquipmentType.current && values.equipmentType) {
      prevEquipmentType.current = values.equipmentType;
      return;
    }

    // Only clear if equipment type actually changed from one value to another
    if (prevEquipmentType.current && prevEquipmentType.current !== values.equipmentType && values.equipmentType) {
      const currentAmpRating = values.ampRating;
      const currentMake = values.make;
      const currentModel = values.model;

      if (currentAmpRating || currentMake || currentModel) {
        console.log(`[BOS Type1] Equipment type changed from "${prevEquipmentType.current}" to "${values.equipmentType}", clearing dependent fields`);
        onChange("ampRating", "");
        onChange("make", "");
        onChange("model", "");
      }
    }

    prevEquipmentType.current = values.equipmentType;
  }, [values.equipmentType]);

  // Reset make and model when amp rating changes (skip if transitioning from empty)
  useEffect(() => {
    // Skip if transitioning from empty to populated (hydration)
    if (!prevAmpRating.current && values.ampRating) {
      prevAmpRating.current = values.ampRating;
      return;
    }

    // Only clear if amp rating actually changed from one value to another
    if (prevAmpRating.current && prevAmpRating.current !== values.ampRating && values.ampRating) {
      const currentMake = values.make;
      const currentModel = values.model;

      if (currentMake || currentModel) {
        console.log(`[BOS Type1] Amp rating changed from "${prevAmpRating.current}" to "${values.ampRating}", clearing make/model`);
        onChange("make", "");
        onChange("model", "");
      }
    }

    prevAmpRating.current = values.ampRating;
  }, [values.ampRating]);

  // Reset model when make changes (skip if transitioning from empty)
  useEffect(() => {
    // Skip if transitioning from empty to populated (hydration)
    if (!prevMake.current && values.make) {
      prevMake.current = values.make;
      return;
    }

    // Only clear if make actually changed from one value to another
    if (prevMake.current && prevMake.current !== values.make && values.make) {
      const currentModel = values.model;

      if (currentModel) {
        console.log(`[BOS Type1] Make changed from "${prevMake.current}" to "${values.make}", clearing model`);
        onChange("model", "");
      }
    }

    prevMake.current = values.make;
  }, [values.make]);

  // Auto-select closest amp rating >= minRequired when max output is available
  useEffect(() => {
    if (!values.equipmentType || !maxContinuousOutputAmps || maxContinuousOutputAmps <= 0) {
      console.log(`[BOS Auto-select] Skipping amp auto-select: equipmentType=${values.equipmentType}, maxOutput=${maxContinuousOutputAmps}`);
      return;
    }

    // Only auto-select if user hasn't manually selected an amp rating
    if (values.ampRating) {
      console.log(`[BOS Auto-select] Skipping amp auto-select: ampRating already set to ${values.ampRating}`);
      return;
    }

    const minRequiredAmps = maxContinuousOutputAmps * 1.25;

    // Translate the utility-specific name to standard catalog name
    const standardName = translateToStandardName(values.equipmentType);
    // Get available amp ratings from equipment catalog (case-insensitive comparison)
    const matchingEquipment = EQUIPMENT_CATALOG.filter((e) => e.type.toLowerCase() === standardName.toLowerCase());
    console.log(`[BOS Auto-select] Equipment type: "${values.equipmentType}", Matching items: ${matchingEquipment.length}`);

    const availableAmps = matchingEquipment
      .map((e) => parseFloat(e.amp))
      .filter((amp) => !isNaN(amp) && amp >= minRequiredAmps);

    console.log(`[BOS Auto-select] Min required amps: ${minRequiredAmps.toFixed(2)}, Available amps >= min: ${JSON.stringify(availableAmps)}`);

    if (availableAmps.length === 0) {
      console.log(`[BOS Auto-select] No amp ratings found that meet requirement`);
      return;
    }

    // Find the closest amp rating that meets the requirement
    const closestAmp = Math.min(...availableAmps);
    const closestAmpString = closestAmp.toString();

    console.log(`[BOS Auto-select] Auto-selecting amp rating: ${closestAmpString} (min required: ${minRequiredAmps.toFixed(2)})`);
    onChange("ampRating", closestAmpString);
  }, [values.equipmentType, maxContinuousOutputAmps, values.ampRating]);

  // Auto-select make if only one option exists
  useEffect(() => {
    if (!values.ampRating || values.make) {
      return;
    }

    const standardName = translateToStandardName(values.equipmentType);
    const availableMakes = [...new Set(
      EQUIPMENT_CATALOG
        .filter((e) => e.type.toLowerCase() === standardName.toLowerCase() && e.amp === values.ampRating)
        .map((e) => e.make)
    )];

    if (availableMakes.length === 1) {
      console.log(`[BOS Auto-select] Auto-selecting make: ${availableMakes[0]}`);
      onChange("make", availableMakes[0]);
    }
  }, [values.ampRating, values.make]); // Removed equipmentType to prevent re-run on manual changes

  // Auto-select model if only one option exists
  useEffect(() => {
    // Treat "N/A" as empty - it's a placeholder from preferred equipment, not a real selection
    const hasValidModel = values.model && values.model !== 'N/A' && values.model.trim() !== '';

    if (!values.make || hasValidModel) {
      return;
    }

    const standardName = translateToStandardName(values.equipmentType);
    const availableModels = [...new Set(
      EQUIPMENT_CATALOG
        .filter((e) => e.type.toLowerCase() === standardName.toLowerCase() && e.amp === values.ampRating && e.make === values.make)
        .map((e) => e.model)
    )];

    if (availableModels.length === 1) {
      console.log(`[BOSType6Section] Auto-selecting single available model: ${availableModels[0]} (was: ${values.model})`);
      onChange("model", availableModels[0]);
    } else if (availableModels.length > 1) {
      console.log(`[BOSType6Section] Multiple models available (${availableModels.length}), user must select`);
    }
  }, [values.make, values.model, values.ampRating, values.equipmentType]);

  // Dropdown data - filter by equipment type and amp rating >= maxContinuousOutputAmps * 1.25
  const byType = EQUIPMENT_CATALOG.filter((e) => {
    // Translate the utility-specific name to standard catalog name for comparison
    const standardName = translateToStandardName(values.equipmentType);
    // Case-insensitive comparison for equipment type
    if (e.type.toLowerCase() !== standardName.toLowerCase()) return false;

    // If we have a max continuous output, only show items with amp rating >= max output * 1.25
    if (maxContinuousOutputAmps !== null && maxContinuousOutputAmps > 0) {
      const minRequiredAmps = maxContinuousOutputAmps * 1.25;
      const itemAmp = parseFloat(e.amp);
      return !isNaN(itemAmp) && itemAmp >= minRequiredAmps;
    }

    return true;
  });

  console.log(`[BOS Dropdown] Equipment type: "${values.equipmentType}", maxOutput: ${maxContinuousOutputAmps}, filtered items: ${byType.length}`);

  // Get available amp ratings from filtered equipment and sort numerically
  const amps = [...new Set(byType.map((e) => e.amp))].sort((a, b) => parseFloat(a) - parseFloat(b));
  console.log(`[BOS Dropdown] Available amp ratings: ${JSON.stringify(amps)}`);

  // Filter by selected amp rating
  const byAmpRating = byType.filter((e) => e.amp === values.ampRating);
  const allMakesFromCatalog = [...new Set(byAmpRating.map((e) => e.make))].map(m => ({ label: m, value: m }));

  // Filter by selected make
  const byMake = byAmpRating.filter((e) => e.make === values.make);
  const allModelsFromCatalog = [...new Set(byMake.map((e) => e.model))].map(m => ({ label: m, value: m }));

  // For BOS equipment: only filter makes (not models), since model selection depends on amp sizing
  const filtered = filterEquipmentByPreferred(allMakesFromCatalog, allModelsFromCatalog, preferredEquipment, values.isNew, values.make, true);
  const makes = filtered.makes.map(m => m.value);
  const models = filtered.models.map(m => m.value);

  const isDirty =
    values.isNew === false ||
    !!values.equipmentType ||
    !!values.make ||
    !!values.model ||
    !!values.ampRating;

  const isRequiredComplete =
    !!values.equipmentType && !!values.make && !!values.model && !!values.ampRating;

  const clearAll = () => {
    onChange("isNew", true);
    onChange("equipmentType", "");
    onChange("ampRating", "");
    onChange("make", "");
    onChange("model", "");
    setSectionNote("");
    setShowClearModal(false);

    // If onRemove callback is provided, call it to hide the BOS section
    if (onRemove) {
      onRemove();
    }
  };

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_BOS_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  const headerTitle = values.equipmentType || label;

  return (
    <CollapsibleSection
      title={headerTitle}
      initiallyExpanded={false}
      isDirty={isDirty}
      isRequiredComplete={isRequiredComplete}
      photoCount={photoCount}
      onCameraPress={handleCameraPress}
    >
      <View style={styles.row}>
        <NewExistingToggle
          isNew={values.isNew}
          onToggle={(val) => onChange("isNew", val)}
          onTrashPress={() => setShowClearModal(true)}
        />
      </View>

      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        onConfirm={clearAll}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Sizing Display - shows section-specific label and calculation */}
      <View style={styles.maxOutputContainer}>
        <Text style={styles.maxOutputLabel}>{sizingLabel || 'Max Continuous Output'}:</Text>
        {loadingMaxOutput ? (
          <ActivityIndicator size="small" color="#FD7332" style={styles.maxOutputLoader} />
        ) : sizingCalculation ? (
          <Text style={styles.maxOutputValue}>{sizingCalculation}</Text>
        ) : maxContinuousOutputAmps !== null ? (
          <Text style={styles.maxOutputValue}>{maxContinuousOutputAmps} Amps</Text>
        ) : (
          <Text style={styles.maxOutputValue}>N/A</Text>
        )}
      </View>

      {/* Equipment Order Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          Note: BOS equipment is entered in order from the inverter/combiner panel back to the MSP (Main Service Panel).
        </Text>
      </View>

      {/* Equipment Type */}
      <Dropdown
        label="Equipment Type*"
        data={getUtilityEquipmentTypeOptions(utilityAbbrev)}
        value={values.equipmentType}
        onChange={(val) => onChange("equipmentType", val)}
        errorText={errors.equipmentType}
      />

      {/* Amp Rating */}
      <Dropdown
        label="Amp Rating*"
        data={amps.map((a) => ({ label: a, value: a }))}
        value={values.ampRating}
        onChange={(val) => onChange("ampRating", val)}
        disabled={!values.equipmentType}
        errorText={errors.ampRating}
      />

      {/* Make */}
      <Dropdown
        label="Make*"
        data={makes.map((m) => ({ label: m, value: m }))}
        value={values.make}
        onChange={(val) => onChange("make", val)}
        disabled={!values.ampRating}
        errorText={errors.make}
      />

      {/* Model */}
      <Dropdown
        label="Model*"
        data={models.map((m) => ({ label: m, value: m }))}
        value={values.model}
        onChange={(val) => onChange("model", val)}
        disabled={!values.make}
        errorText={errors.model}
      />

      {/* Add BOS Type 2 Button */}
      {showAddBOSType7Button && onAddBOSType7 && (
        <View style={styles.addBOSButtonContainer}>
          <SystemButton
            label="Add BOS Type 2"
            onPress={onAddBOSType7}
            style={styles.addBOSButton}
            scaleOverride={0.85}
          />
        </View>
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
    gap: moderateScale(20),
  },
  maxOutputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: verticalScale(16),
    gap: moderateScale(8),
  },
  maxOutputLabel: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
  maxOutputValue: {
    color: "#FD7332",
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  maxOutputLoader: {
    marginLeft: moderateScale(8),
  },
  noteContainer: {
    backgroundColor: "#1E3A5F",
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  noteText: {
    color: "#A8C5E6",
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontStyle: "italic",
  },
  addBOSButtonContainer: {
    width: "100%",
    marginTop: 0,
  },
  addBOSButton: {
    width: "100%",
    height: verticalScale(40),
  },
});

export default BOSType6Section;
