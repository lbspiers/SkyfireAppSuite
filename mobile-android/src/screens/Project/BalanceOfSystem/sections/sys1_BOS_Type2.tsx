// src/screens/Project/BalanceOfSystem/sections/sys1_BOS_Type2.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import CollapsibleSectionBOS from "../../../../components/UI/CollapsibleSectionBOS";
import Dropdown from "../../../../components/Dropdown";
import SystemButton from "../../../../components/Button/SystemButton";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";

import {
  EQUIPMENT_CATALOG,
  DEFAULT_BOS_PHOTO_TAGS,
  getUtilityEquipmentTypeOptions,
} from "../../../../utils/constants";

interface Props {
  type2: any;
  update: any;
  onCancel: () => void;
  /** Called when "BOS Type 3" button is tapped */
  onNext: () => void;
  /** When true, don't render the Type-3 button row */
  hideNext?: boolean;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  maxContinuousOutputAmps?: number | null;
  customTitle?: string;
  utilityAbbrev?: string;
}

export default function Sys1BOSType2({
  type2,
  update,
  onCancel,
  onNext,
  hideNext = false,
  projectId = "",
  companyId = "",
  onOpenGallery,
  maxContinuousOutputAmps = null,
  customTitle,
  utilityAbbrev,
}: Props) {
  const { equipmentType, make, model, ampRating, isNew } = type2;
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");

  useEffect(() => {
    if (equipmentType) {
      update.type2.ampRating("");
      update.type2.make("");
      update.type2.model("");
    }
  }, [equipmentType]); // Removed unstable update.type2 dependency

  useEffect(() => {
    if (ampRating) {
      update.type2.make("");
      update.type2.model("");
    }
  }, [ampRating]); // Removed unstable update.type2 dependency

  useEffect(() => {
    if (make) {
      update.type2.model("");
    }
  }, [make]); // Removed unstable update.type2 dependency

  // dropdown data - filter by equipment type and amp rating >= maxContinuousOutputAmps * 1.25
  const byType = EQUIPMENT_CATALOG.filter((e) => {
    if (e.type !== equipmentType) return false;

    // If we have a max continuous output, only show items with amp rating >= max output * 1.25
    if (maxContinuousOutputAmps !== null && maxContinuousOutputAmps > 0) {
      const minRequiredAmps = maxContinuousOutputAmps * 1.25;
      const itemAmp = parseFloat(e.amp);
      return !isNaN(itemAmp) && itemAmp >= minRequiredAmps;
    }

    return true;
  });

  // Get available amp ratings from filtered equipment
  const amps = [...new Set(byType.map((e) => e.amp))];

  // Filter by selected amp rating
  const byAmpRating = byType.filter((e) => e.amp === ampRating);
  const makes = [...new Set(byAmpRating.map((e) => e.make))];

  // Filter by selected make
  const byMake = byAmpRating.filter((e) => e.make === make);
  const models = [...new Set(byMake.map((e) => e.model))];

  const isDirty = !!equipmentType || !!make || !!model || !!ampRating;
  const isComplete = !!equipmentType && !!make && !!model && !!ampRating;
  const defaultTitle = customTitle || "BOS Type 2";
  const headerTitle = equipmentType || (customTitle ? `Post ${customTitle}` : defaultTitle);
  const sectionLabel = headerTitle;

  return (
    <CollapsibleSectionBOS
      title={headerTitle}
      initiallyExpanded
      isDirty={isDirty}
      isRequiredComplete={isComplete}
      photoCount={photoCount}
      onCameraPress={() => {
        // TODO: Implement camera functionality
        console.log('Camera pressed for BOS Type 2');
      }}
    >
      {/* 1) New/Existing toggle full-width */}
      <View style={styles.toggleOverride}>
        <NewExistingToggle
          isNew={isNew}
          onToggle={(isNew: boolean) => update.type2.isNew(isNew)}
          onTrashPress={onCancel}
        />
      </View>

      {/* 2) Main form - Equipment Type, Amp Rating, Make, Model */}
      <View style={styles.container}>
        <Dropdown
          label="Equipment Type"
          data={getUtilityEquipmentTypeOptions(utilityAbbrev)}
          value={equipmentType}
          onChange={(value) => update.type2.equipmentType(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Amp Rating"
          data={amps.map((a) => ({ label: a, value: a }))}
          value={ampRating}
          onChange={(value) => update.type2.ampRating(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Make"
          data={makes.map((m) => ({ label: m, value: m }))}
          value={make}
          onChange={(value) => update.type2.make(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Model"
          data={models.map((m) => ({ label: m, value: m }))}
          value={model}
          onChange={(value) => update.type2.model(value)}
          widthPercent={100}
        />

        {/* 3) BOS Type 3 button, only if hideNext===false */}
        {!hideNext && (
          <View style={styles.buttonsRow}>
            <SystemButton
              label="BOS Type 3"
              active={false}
              onPress={onNext}
              style={styles.button}
            />
          </View>
        )}
      </View>
    </CollapsibleSectionBOS>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "110%",
    gap: 0,
    paddingHorizontal: 0,
    marginLeft: -20,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  toggleOverride: {
    marginLeft: -20,
    marginRight: -20,
    marginBottom: 12,
  },
});
