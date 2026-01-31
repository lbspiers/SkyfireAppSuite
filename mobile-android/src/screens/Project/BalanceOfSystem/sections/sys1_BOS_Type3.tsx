// src/screens/Project/BalanceOfSystem/sections/sys1_BOS_Type3.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import CollapsibleSectionBOS from "../../../../components/UI/CollapsibleSectionBOS";
import Dropdown from "../../../../components/Dropdown";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";

import {
  EQUIPMENT_CATALOG,
  DEFAULT_BOS_PHOTO_TAGS,
  getUtilityEquipmentTypeOptions,
} from "../../../../utils/constants";

interface Props {
  type3: any;
  update: any;
  /** Called when the user hits Trash on this section */
  onCancel: () => void;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  maxContinuousOutputAmps?: number | null;
  customTitle?: string;
  utilityAbbrev?: string;
}

export default function Sys1BOSType3({
  type3,
  update,
  onCancel,
  projectId = "",
  companyId = "",
  onOpenGallery,
  maxContinuousOutputAmps = null,
  customTitle,
  utilityAbbrev,
}: Props) {
  const { equipmentType, make, model, ampRating, isNew } = type3;
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");

  // reset downstream when type changes (fixed dependencies)
  useEffect(() => {
    if (equipmentType) {
      update.type3.ampRating("");
      update.type3.make("");
      update.type3.model("");
    }
  }, [equipmentType]); // Removed unstable update.type3 dependency

  useEffect(() => {
    if (ampRating) {
      update.type3.make("");
      update.type3.model("");
    }
  }, [ampRating]); // Removed unstable update.type3 dependency

  useEffect(() => {
    if (make) {
      update.type3.model("");
    }
  }, [make]); // Removed unstable update.type3 dependency

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
  const defaultTitle = customTitle || "BOS Type 3";
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
        console.log('Camera pressed for BOS Type 3');
      }}
    >
      {/* 1) New/Existing toggle full-width */}
      <View style={styles.toggleOverride}>
        <NewExistingToggle
          isNew={isNew}
          onToggle={(isNew: boolean) => update.type3.isNew(isNew)}
          onTrashPress={onCancel}
        />
      </View>

      {/* 2) Main form - Equipment Type, Amp Rating, Make, Model */}
      <View style={styles.container}>
        <Dropdown
          label="Equipment Type"
          data={getUtilityEquipmentTypeOptions(utilityAbbrev)}
          value={equipmentType}
          onChange={(value) => update.type3.equipmentType(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Amp Rating"
          data={amps.map((a) => ({ label: a, value: a }))}
          value={ampRating}
          onChange={(value) => update.type3.ampRating(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Make"
          data={makes.map((m) => ({ label: m, value: m }))}
          value={make}
          onChange={(value) => update.type3.make(value)}
          widthPercent={100}
        />
        <Dropdown
          label="Model"
          data={models.map((m) => ({ label: m, value: m }))}
          value={model}
          onChange={(value) => update.type3.model(value)}
          widthPercent={100}
        />
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
  toggleOverride: {
    marginLeft: -20,
    marginRight: -20,
    marginBottom: 12,
  },
});
