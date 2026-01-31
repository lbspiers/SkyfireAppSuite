// src/screens/Project/Equipment/CombineBOSTypeSection.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import SystemButton from "../../../components/Button/SystemButton";
import CollapsibleSection from "../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../components/NewExistingToggle";
import ConfirmClearModal from "../../../components/Modals/ConfirmClearModal";
import Dropdown from "../../../components/Dropdown";
import { moderateScale } from "../../../utils/responsive";
import { saveSystemDetails } from "../../../api/systemDetails.service";
import { logger } from "../../../utils/logger";
import Toast from "react-native-toast-message";
import { EQUIPMENT_TYPE_OPTIONS, EQUIPMENT_CATALOG, UTILITY_EQUIPMENT_TO_STANDARD, getUtilityEquipmentTypeOptions } from "../../../utils/constants";

interface BOSTypeData {
  equipmentType: string;
  ampRating: string;
  make: string;
  model: string;
  isNew: boolean;
}

interface CombineBOSTypeSectionProps {
  typeNumber: 1 | 2 | 3;
  targetSlot: 1 | 2 | 3; // Which database slot to use (1, 2, or 3) based on String Combiner Panel presence
  projectUuid: string;
  data: BOSTypeData;
  onDataChange: (data: BOSTypeData) => void;
  hasPreviousType?: boolean; // Used for spacing when stacked
  showNextTypeButton?: boolean; // Show the next type button inside this section
  onNextTypePress?: () => void; // Callback when next type button is pressed
  forceInitialExpand?: boolean; // Force this section to start expanded
  onClear?: () => void; // Callback when section is cleared (to hide it completely)
  utilityAbbrev?: string; // Utility abbreviation for utility-specific equipment names
}

export default function CombineBOSTypeSection({
  typeNumber,
  targetSlot,
  projectUuid,
  data,
  onDataChange,
  hasPreviousType = false,
  showNextTypeButton = false,
  onNextTypePress,
  forceInitialExpand = false,
  onClear,
  utilityAbbrev,
}: CombineBOSTypeSectionProps) {
  const [expanded, setExpanded] = useState(forceInitialExpand);
  const [showClearModal, setShowClearModal] = useState(false);

  const isDirty = !!(
    data.equipmentType ||
    data.ampRating ||
    data.make ||
    data.model
  );

  const isRequiredComplete = !!(
    data.equipmentType &&
    data.ampRating &&
    data.make &&
    data.model
  );

  const title = `Post Combine BOS Type ${targetSlot}`;
  const nextTypeNumber = (typeNumber + 1) as 1 | 2 | 3;
  const nextTypeTitle = `Post Combine BOS ${nextTypeNumber}`;

  // Get equipment type options based on utility
  const equipmentTypeOptions = getUtilityEquipmentTypeOptions(utilityAbbrev);

  // Helper: Map equipment type to catalog type
  // Converts utility-specific names (e.g., "Bi-Directional Meter") to catalog names (e.g., "PV Meter")
  const getCatalogEquipmentType = (equipmentType: string): string => {
    return UTILITY_EQUIPMENT_TO_STANDARD[equipmentType] || equipmentType;
  };

  // Database field mapping based on target slot (dynamically assigned based on String Combiner Panel)
  const getFieldName = (property: string) => {
    return `post_sms_bos_sys1_type${targetSlot}_${property}`;
  };

  const handleClear = async () => {
    // Clear UI state
    onDataChange({
      equipmentType: "",
      ampRating: "",
      make: "",
      model: "",
      isNew: true,
    });

    // Reset to button view
    setExpanded(false);

    // Clear database fields
    try {
      await saveSystemDetails(projectUuid, {
        [getFieldName("equipment_type")]: null,
        [getFieldName("make")]: null,
        [getFieldName("model")]: null,
        [getFieldName("amp_rating")]: null,
        [getFieldName("existing")]: null,
      });
      logger.debug(`[Equipment] Post Combine BOS Type ${typeNumber} (slot ${targetSlot}) cleared successfully`);
    } catch (error) {
      logger.error(`[Equipment] Error clearing Post Combine BOS Type ${typeNumber}:`, error);
      Toast.show({
        text1: "Error",
        text2: `Failed to clear Combine BOS Type ${typeNumber}`,
        type: "error",
        position: "bottom",
        visibilityTime: 3000,
      });
    }

    setShowClearModal(false);

    // Notify parent to hide this type completely
    if (onClear) {
      onClear();
    }
  };

  return (
    <>
      {!isDirty && !expanded ? (
        // Show button when no data has been added and not expanded
        <SystemButton
          label={title}
          active={false}
          onPress={() => {
            setExpanded(true);
          }}
          style={{
            width: "100%",
            marginBottom: moderateScale(8),
          }}
        />
      ) : (
        // Show collapsible section when data has been added or user clicked to expand
        <View
          style={[
            styles.collapsibleSectionWrapper,
            hasPreviousType && styles.collapsibleSectionWithSpacing,
          ]}
        >
          <CollapsibleSection
            title={title}
            initiallyExpanded={expanded && !isDirty}
            isDirty={isDirty}
            isRequiredComplete={isRequiredComplete}
            fullWidth={true}
          >
            <View style={styles.collapsibleContent}>
              <NewExistingToggle
                isNew={data.isNew}
                onToggle={(v) =>
                  onDataChange({ ...data, isNew: v })
                }
                onTrashPress={() => setShowClearModal(true)}
              />

              <ConfirmClearModal
                visible={showClearModal}
                sectionTitle={title}
                onConfirm={handleClear}
                onCancel={() => setShowClearModal(false)}
              />

              {/* Equipment Type */}
              <Dropdown
                label="Equipment Type*"
                data={equipmentTypeOptions}
                value={data.equipmentType}
                onChange={(v) => {
                  onDataChange({
                    equipmentType: v,
                    ampRating: "",
                    make: "",
                    model: "",
                    isNew: data.isNew,
                  });
                }}
                widthPercent={100}
              />

              {/* Amp Rating */}
              <Dropdown
                label="Amp Rating*"
                data={(() => {
                  const catalogType = getCatalogEquipmentType(data.equipmentType);
                  const byType = EQUIPMENT_CATALOG.filter(
                    (e) => e.type === catalogType
                  );
                  const amps = [...new Set(byType.map((e) => e.amp))];
                  return amps.map((a) => ({ label: a, value: a }));
                })()}
                value={data.ampRating}
                onChange={(v) => {
                  onDataChange({
                    ...data,
                    ampRating: v,
                    make: "",
                    model: "",
                  });
                }}
                widthPercent={100}
                disabled={!data.equipmentType}
              />

              {/* Make */}
              <Dropdown
                label="Make*"
                data={(() => {
                  const catalogType = getCatalogEquipmentType(data.equipmentType);
                  const byType = EQUIPMENT_CATALOG.filter(
                    (e) =>
                      e.type === catalogType &&
                      e.amp === data.ampRating
                  );
                  const makes = [...new Set(byType.map((e) => e.make))];
                  return makes.map((m) => ({ label: m, value: m }));
                })()}
                value={data.make}
                onChange={(v) => {
                  onDataChange({
                    ...data,
                    make: v,
                    model: "",
                  });
                }}
                widthPercent={100}
                disabled={!data.ampRating}
              />

              {/* Model */}
              <Dropdown
                label="Model*"
                data={(() => {
                  const catalogType = getCatalogEquipmentType(data.equipmentType);
                  const byMake = EQUIPMENT_CATALOG.filter(
                    (e) =>
                      e.type === catalogType &&
                      e.amp === data.ampRating &&
                      e.make === data.make
                  );
                  const models = [...new Set(byMake.map((e) => e.model))];
                  return models.map((m) => ({
                    label: m,
                    value: m,
                  }));
                })()}
                value={data.model}
                onChange={(v) => {
                  onDataChange({
                    ...data,
                    model: v,
                  });
                }}
                widthPercent={100}
                disabled={!data.make}
              />

              {/* Show "Add next type" button when appropriate */}
              {showNextTypeButton && typeNumber < 3 && (
                <SystemButton
                  label={nextTypeTitle}
                  active={false}
                  onPress={() => {
                    if (onNextTypePress) {
                      onNextTypePress();
                    }
                  }}
                  style={{
                    width: "100%",
                    marginTop: moderateScale(12),
                    marginBottom: moderateScale(8),
                  }}
                />
              )}
            </View>
          </CollapsibleSection>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  collapsibleContent: {
    width: "100%",
  },
  collapsibleSectionWrapper: {
    marginTop: moderateScale(-10),
  },
  collapsibleSectionWithSpacing: {
    marginTop: moderateScale(2),
  },
});
