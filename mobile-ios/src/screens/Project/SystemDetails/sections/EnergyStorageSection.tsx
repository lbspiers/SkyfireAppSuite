// src/screens/Project/SystemDetails/sections/EnergyStorageSection.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import Button from "../../../../components/Button";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import {
  DEFAULT_INVERTER_PHOTO_TAGS,
  BACKUP_SYSTEM_SIZE_WHOLE_HOME_OPTIONS,
  BACKUP_SYSTEM_SIZE_PARTIAL_HOME_OPTIONS,
} from "../../../../utils/constants";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP as wp,
} from "../../../../utils/responsive";


interface EnergyStorageSectionProps {
  value: "" | "Whole Home" | "Partial Home" | "No Backup";
  onChange: (v: "" | "Whole Home" | "Partial Home" | "No Backup") => void;
  utilityServiceAmps: string;
  onUtilityServiceAmpsChange: (value: string) => void;
  errors?: { [key: string]: string };
  initiallyExpanded?: boolean;
  /** NEW: allow parent to clear DB as well */
  onClear?: () => void;
  /** NEW: suppress ESS section for Tesla PowerWall */
  suppressESS?: boolean;
  /** Optional label for system-specific ESS sections */
  label?: string;
}

const backupOptions: Array<{
  label: string;
  value: "whole" | "partial" | "none";
}> = [
  { label: "Whole Home", value: "whole" },
  { label: "Partial Home", value: "partial" },
  { label: "No Backup", value: "none" },
];

const GAP = moderateScale(14); // px between buttons
const BUTTON_FONT_SIZE = moderateScale(16); // shrink text so it fits
const BUTTON_HEIGHT = moderateScale(44); // match BOS Equipment button height

export default function EnergyStorageSection({
  value,
  onChange,
  utilityServiceAmps,
  onUtilityServiceAmpsChange,
  errors = {},
  initiallyExpanded = false,
  onClear,
  suppressESS = false,
  label = "Energy Storage System",
}: EnergyStorageSectionProps) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [showClearModal, setShowClearModal] = useState(false);

  // NOTE: Removed auto-clear logic - it was incorrectly clearing backup option for PowerWall
  // The backup option should persist even when ESS section UI is suppressed
  // PowerWall uses the same backup option field, just displayed in PowerWall config section

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);
  
  const isDirty = !!value;
  const isRequiredComplete = !!value;
  
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
      onPhotoAdded: () => {},
    });
  };

  // Hide the entire ESS section when suppressed
  if (suppressESS) {
    return null;
  }

  // Extract system number from label (e.g., "Energy Storage 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <CollapsibleSection
      title={titleWithoutNumber}
      systemNumber={systemNumber}
      initiallyExpanded={initiallyExpanded}
      isDirty={isDirty}
      isRequiredComplete={isRequiredComplete}
      renderCamera={false}
    >
      {/* 1) Backup option row */}
      <View style={styles.sectionContent}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Select Backup Option</Text>
          <TouchableOpacity
            onPress={() => setShowClearModal(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* 3 evenly‐spaced buttons */}
        <View style={styles.buttonRow}>
          {backupOptions.map((opt, idx) => {
            const btnStyle = {
              ...styles.button,
              ...(idx > 0 ? { marginLeft: GAP } : {}),
              height: BUTTON_HEIGHT,
            };
            return (
              <Button
                key={opt.value}
                title={opt.label}
                onPress={() => onChange(opt.label)}
                selected={value === opt.label}
                style={btnStyle}
                textStyle={{ fontSize: BUTTON_FONT_SIZE }}
              />
            );
          })}
        </View>

        {errors.value && <Text style={styles.error}>{errors.value}</Text>}

        {/* Backup System Size - Only show for Whole Home or Partial Home */}
        {(value === "Whole Home" || value === "Partial Home") && (
          <>
            <Text style={styles.helperText}>
              {value === "Whole Home"
                ? "Choose the size of the backup load system"
                : "Choose the size you are backing up"}
            </Text>
            <Dropdown
              label="Backup System Size"
              data={
                value === "Whole Home"
                  ? BACKUP_SYSTEM_SIZE_WHOLE_HOME_OPTIONS
                  : BACKUP_SYSTEM_SIZE_PARTIAL_HOME_OPTIONS
              }
              value={utilityServiceAmps}
              onChange={onUtilityServiceAmpsChange}
              widthPercent={100}
            />
          </>
        )}
      </View>

      {/* Clear Confirmation Modal */}
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={label}
        customMessage="This will clear all battery sections."
        onConfirm={() => {
          // Clear UI
          onChange("");
          // Let parent clear DB (set all ESS fields to NULL)
          onClear?.();
          setSectionNote("");
          setShowClearModal(false);
        }}
        onCancel={() => setShowClearModal(false)}
      />
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(10),
  },
  labelText: {
    flex: 1,
    color: "#fff",
    fontSize: moderateScale(20),
    fontWeight: "700",
  },
  clearBtn: {
    marginLeft: moderateScale(20),
    padding: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: {
    color: "#FD7332",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
  },
  button: {
    flex: 1, // share width equally
  },
  error: {
    color: "#FF3B30",
    marginTop: verticalScale(8),
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  separator: {
    height: verticalScale(3),
    width: "100%",
    borderRadius: moderateScale(2),
    marginTop: 0,
    marginBottom: verticalScale(30),
  },
  helperText: {
    color: "#FFF",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
    marginTop: verticalScale(16),
    opacity: 0.9,
  },
});
