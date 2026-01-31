// src/screens/Project/structural/sections/MountingHardwareB.tsx

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import CollapsibleSectionNoToggle from "../../../../components/UI/CollapsibleSection_noToggle";
import Dropdown from "../../../../components/Dropdown";
import SystemButton from "../../../../components/Button/SystemButton"; // ← SystemButton
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { RAIL_CATALOG, MOUNT_CATALOG, DEFAULT_STRUCTURAL_PHOTO_TAGS } from "../../../../utils/constants";

interface MountingValues {
  railMake: string;
  railModel: string;
  attachMake: string;
  attachModel: string;
}

interface MountingHardwareAProps {
  values: MountingValues;
  onChange: (field: keyof MountingValues, value: any) => void;
  errors?: Partial<Record<keyof MountingValues, string>>;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

const REQUIRED: (keyof MountingValues)[] = ["railMake", "railModel"];

export default function MountingHardwareB({
  values,
  onChange,
  errors = {},
  projectId = "",
  companyId = "",
  onOpenGallery,
}: MountingHardwareAProps) {
  const [expanded, setExpanded] = useState(true);
  const [showClear, setShowClear] = useState(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");
  
  const sectionLabel = "Mounting Hardware (B)";
  const photoCapture = usePhotoCapture();
  
  // Load photo count on mount
  React.useEffect(() => {
    if (projectId && sectionLabel) {
      photoCapture.getPhotoCount(sectionLabel).then(setPhotoCount);
    }
  }, [projectId, sectionLabel, photoCapture.refreshTrigger]);
  
  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      console.warn("Missing project context for photo capture");
      return;
    }

    photoCapture.openForSection({
      section: sectionLabel,
      tagOptions: DEFAULT_STRUCTURAL_PHOTO_TAGS,
      initialNote: panelNote,
      onNotesSaved: (note) => {
        setPanelNote(note);
        console.log(`Notes saved for ${sectionLabel}:`, note);
      },
      onPhotoAdded: () => {
        console.log(`Photo added to ${sectionLabel}`);
      },
    });
  };

  const railMakes = Array.from(new Set(RAIL_CATALOG.map((r) => r.make)));
  const railModels = RAIL_CATALOG.filter((r) => r.make === values.railMake).map(
    (r) => r.model
  );

  const attachMakes = Array.from(new Set(MOUNT_CATALOG.map((m) => m.make)));
  const attachModels = MOUNT_CATALOG.filter(
    (m) => m.make === values.attachMake
  ).map((m) => m.model);

  const isDirty = Object.values(values).some((v) => String(v).trim() !== "");
  const isRequiredComplete = REQUIRED.every(
    (k) => String(values[k]).trim() !== ""
  );

  const clearAll = () => {
    onChange("railMake", "");
    onChange("railModel", "");
    onChange("attachMake", "");
    onChange("attachModel", "");
  };

  // two-line when expanded, one-line when collapsed
  const titleText = expanded
    ? "Mounting\nHardware (B)"
    : "Mounting Hardware (B)";

  return (
    <>
      <ConfirmClearModal
        visible={showClear}
        sectionTitle="Mounting Hardware (B)"
        onConfirm={() => {
          clearAll();
          setShowClear(false);
          setExpanded(false);
        }}
        onCancel={() => setShowClear(false)}
      />
      <CollapsibleSectionNoToggle
        title={titleText}
        initiallyExpanded={true}
        expanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
        onTrashPress={expanded ? () => setShowClear(true) : undefined}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
      >
        {/* Rail Make / Model */}
        <Dropdown
          label="Rail Make*"
          data={railMakes.map((m) => ({ label: m, value: m }))}
          value={values.railMake}
          onChange={(v) => onChange("railMake", v)}
          widthPercent={100}
          errorText={errors.railMake}
        />
        <Dropdown
          label="Rail Model*"
          data={railModels.map((m) => ({ label: m, value: m }))}
          value={values.railModel}
          onChange={(v) => onChange("railModel", v)}
          widthPercent={100}
          errorText={errors.railModel}
        />

        {/* Attachment Make / Model */}
        <Dropdown
          label="Attachment Make"
          data={attachMakes.map((m) => ({ label: m, value: m }))}
          value={values.attachMake}
          onChange={(v) => onChange("attachMake", v)}
          widthPercent={100}
          errorText={errors.attachMake}
        />
        <Dropdown
          label="Attachment Model"
          data={attachModels.map((m) => ({ label: m, value: m }))}
          value={values.attachModel}
          onChange={(v) => onChange("attachModel", v)}
          widthPercent={100}
          errorText={errors.attachModel}
        />
      </CollapsibleSectionNoToggle>
    </>
  );
}

const styles = StyleSheet.create({
  clearRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  clearButton: {
    width: 140,
  },
  nextButtonRow: {
    marginTop: 0,
    marginBottom: 12, // spacing before the section separator
    alignItems: "stretch",
  },
  nextButton: {
    width: "100%", // adjust as needed
  },
});
