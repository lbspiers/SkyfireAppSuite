// src/screens/Project/structural/sections/RoofingB.tsx

import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import CollapsibleSectionNoToggle from "../../../../components/UI/CollapsibleSection";
import Dropdown from "../../../../components/Dropdown";
import Button from "../../../../components/Button"; // generic Button
import TextInput from "../../../../components/TextInput";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import NumericKeypad from "../../../../components/NumericKeypad";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";
import {
  ROOFING_MATERIAL_TYPES,
  FRAMING_MEMBER_SIZES,
  FRAMING_MEMBER_SPACINGS,
  DEFAULT_STRUCTURAL_PHOTO_TAGS,
} from "../../../../utils/constants";


interface RoofingValues {
  roofingMaterial: string;
  framingSize: string;
  roofArea: string;
  framingSpacing: string;
  framingType: "Truss" | "Rafter" | "";
}

interface RoofingSectionProps {
  values: RoofingValues;
  onChange: (field: keyof RoofingValues, value: any) => void;
  errors?: Partial<Record<keyof RoofingValues, string>>;
  /** Called when user confirms clear so parent can hide this section */
  onCancel: () => void;
  /** Called when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

const REQUIRED: (keyof RoofingValues)[] = ["roofingMaterial"];

export default function RoofingB({
  values,
  onChange,
  errors = {},
  onCancel,
  onDirtyChange,
  projectId = "",
  companyId = "",
  onOpenGallery,
}: RoofingSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");
  const [numericKeypadVisible, setNumericKeypadVisible] = useState(false);
  
  const sectionLabel = "Roofing (B)";

  const isDirty = Object.values(values).some((v) => String(v).trim() !== "");
  const isRequiredComplete = REQUIRED.every(
    (k) => String(values[k]).trim() !== ""
  );

  // Notify parent when dirty state changes
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  /** clears all fields, closes section via onCancel */
  const handleConfirmClear = () => {
    // clear all fields
    onChange("roofingMaterial", "");
    onChange("framingSize", "");
    onChange("roofArea", "");
    onChange("framingSpacing", "");
    onChange("framingType", "");
    setShowClearModal(false);
    onCancel();
  };

  return (
    <>
      {/* confirm‐clear modal */}
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle="Roofing (B)"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearModal(false)}
      />

      {/* header + trash, no toggle arrow */}
      <CollapsibleSectionNoToggle
        title="Roofing (B)"
        initiallyExpanded
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
        onTrashPress={expanded ? () => setShowClearModal(true) : undefined}
        photoCount={photoCount}
        alwaysShowCamera
        captureConfig={{
          projectId,
          companyId,
          section: sectionLabel,
          tagOptions: DEFAULT_STRUCTURAL_PHOTO_TAGS,
          tagValue: null,
          initialNote: panelNote,
          onOpenGallery: () => onOpenGallery?.(sectionLabel),
          onSaveNote: (n) => setPanelNote(n),
          onMediaAdded: (type) => {
            if (type === "photo") setPhotoCount((c) => c + 1);
          },
        }}
      >
        {/* two‐column form */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Dropdown
              label="Roofing Material*"
              data={ROOFING_MATERIAL_TYPES.map((s) => ({ label: s, value: s }))}
              value={values.roofingMaterial}
              onChange={(v) => onChange("roofingMaterial", v)}
              widthPercent={100}
              errorText={errors.roofingMaterial}
            />
            <Dropdown
              label="Framing Size*"
              data={FRAMING_MEMBER_SIZES.map((s) => ({ label: s, value: s }))}
              value={values.framingSize}
              onChange={(v) => onChange("framingSize", v)}
              widthPercent={100}
              errorText={errors.framingSize}
              style={{ marginTop: 0 }}
            />
          </View>
          <View style={styles.col}>
            <TextInput
              label="Roof Area (Sq Ft)"
              value={values.roofArea}
              onChangeText={(t) => onChange("roofArea", t)}
              widthPercent={100}
              errorText={errors.roofArea}
              placeholder="e.g. 1200"
              keyboardType="numeric"
              showNumericKeypad={true}
              onNumericKeypadOpen={() => setNumericKeypadVisible(true)}
            />
            <Dropdown
              label="Framing Spacing*"
              data={FRAMING_MEMBER_SPACINGS.map((s) => ({
                label: s,
                value: s,
              }))}
              value={values.framingSpacing}
              onChange={(v) => onChange("framingSpacing", v)}
              widthPercent={100}
              errorText={errors.framingSpacing}
              style={{ marginTop: 0 }}
            />
          </View>
        </View>

        {/* framing‐type */}
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Framing Type*</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Button
              title="Truss"
              onPress={() => onChange("framingType", "Truss")}
              selected={values.framingType === "Truss"}
              style={styles.button}
            />
          </View>
          <View style={styles.col}>
            <Button
              title="Rafter"
              onPress={() => onChange("framingType", "Rafter")}
              selected={values.framingType === "Rafter"}
              style={styles.button}
            />
          </View>
        </View>
      </CollapsibleSectionNoToggle>

      {/* Numeric Keypad for Roof Area */}
      <NumericKeypad
        isVisible={numericKeypadVisible}
        currentValue={values.roofArea}
        onNumberPress={(num) => {
          const currentVal = values.roofArea || "";
          onChange("roofArea", currentVal + num);
        }}
        onBackspace={() => {
          const currentVal = values.roofArea || "";
          onChange("roofArea", currentVal.slice(0, -1));
        }}
        onClose={() => setNumericKeypadVisible(false)}
        title="Roof Area (Sq Ft)"
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 20,
  },
  col: {
    flex: 1,
  },
  labelRow: {
    marginTop: 0,
    marginBottom: 10,
  },
  labelText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  button: {
    flex: 1,
    marginBottom: 15,
  },
});
