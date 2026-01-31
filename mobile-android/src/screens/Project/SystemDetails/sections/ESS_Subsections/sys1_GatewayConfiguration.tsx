// src/screens/Project/SystemDetails/sections/ESS_Subsections/sys1_GatewayConfiguration.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useSelector, shallowEqual } from "react-redux";
import { useProjectContext } from "../../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../../hooks/usePhotoCapture";
import { DEFAULT_INVERTER_PHOTO_TAGS } from "../../../../../utils/constants";
import CollapsibleSection from "../../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../../components/NewExistingToggle";
import Dropdown from "../../../../../components/Dropdown";
import ConfirmClearModal from "../../../../../components/Modals/ConfirmClearModal";
import Note from "../../../../../components/Note";

const xIcon = require("../../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

type Option = { label: string; value: string };

const tieInOptions: Option[] = [{ label: "###", value: "" }].concat(
  [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175,
    200, 225, 250,
  ].map((n) => ({ label: String(n), value: String(n) }))
);

const mainBreakerOptions: Option[] = [{ label: "###", value: "" }].concat(
  [100, 125, 150, 175, 200].map((n) => ({ label: String(n), value: String(n) }))
);

interface Props {
  values: {
    isNew: boolean;
    selectedMainBreaker: string;
    selectedBackupPanel: string;
    activatePCS?: boolean;
    selectedPVBreaker?: string;
    selectedESSBreaker?: string;
    selectedTieInBreaker?: string;
  };
  onChange: (field: keyof Props["values"], value: any) => void;
  errors: { [k: string]: string };
  /** The specific gateway type - determines which make/model to show */
  gatewayType: "backup_gateway_2" | "gateway_3";
  /** System label for the title (e.g., "System 1", "System 2") */
  systemLabel?: string;
}

const requiredFields = ["selectedMainBreaker", "selectedBackupPanel"] as const;

const EMPTY_ARR: any[] = [];

// Gateway-specific make/model mappings
const GATEWAY_CONFIGS = {
  backup_gateway_2: {
    make: "Tesla",
    model: "Backup Gateway 2",
  },
  gateway_3: {
    make: "Tesla",
    model: "Gateway 3",
  },
} as const;

export default function Sys1GatewayConfigurationSection({
  values,
  onChange,
  errors,
  gatewayType,
  systemLabel = "",
}: Props) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // Local UI state
  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [editPV, setEditPV] = useState(false);
  const [editESS, setEditESS] = useState(false);
  const [editTI, setEditTI] = useState(false);
  const [editMainBreaker, setEditMainBreaker] = useState(false);
  const [editBackupPanel, setEditBackupPanel] = useState(false);

  // Get the configuration for this gateway type
  const gatewayConfig = GATEWAY_CONFIGS[gatewayType];

  // Defaults on first mount - always default to MLO
  useEffect(() => {
    onChange("selectedMainBreaker", "mlo");
    onChange("selectedBackupPanel", "mlo");
    if (values.selectedPVBreaker === undefined)
      onChange("selectedPVBreaker", "");
    if (values.selectedESSBreaker === undefined)
      onChange("selectedESSBreaker", "");
    if (values.selectedTieInBreaker === undefined)
      onChange("selectedTieInBreaker", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Section name for photos - extract just the number
  const photoSystemNum = systemLabel ? systemLabel.replace(/[^\d]/g, '') : '';
  const photoSectionName = photoSystemNum ? `Gateway Configuration ${photoSystemNum}` : "Gateway Configuration";

  // Load photo count for this section
  useEffect(() => {
    if (projectId) {
      photoCapture.getPhotoCount(photoSectionName).then(setPhotoCount);
    }
  }, [projectId, photoCapture.refreshTrigger, photoSectionName]);

  // Breaker options from company profile
  const breakerList = useSelector(
    (s: any) => s.profile.profile?.company?.breakerOptions,
    shallowEqual
  ) as Array<Option> | undefined;

  const breakerOptions = useMemo<Option[]>(
    () =>
      [{ label: "###", value: "" }].concat(
        (breakerList ?? EMPTY_ARR).map((b: any) => ({
          label: b.label,
          value: b.value,
        }))
      ),
    [breakerList]
  );

  // Dirty/complete state
  const isDirty =
    !values.isNew ||
    !!values.selectedMainBreaker ||
    !!values.selectedBackupPanel;

  const isComplete = requiredFields.every((f) => !!String(values[f]).trim());

  const clearAll = useCallback(() => {
    onChange("isNew", true);
    onChange("selectedMainBreaker", "mlo");
    onChange("selectedBackupPanel", "mlo");
    onChange("activatePCS", false);
    onChange("selectedPVBreaker", "");
    onChange("selectedESSBreaker", "");
    onChange("selectedTieInBreaker", "");

    setEditPV(false);
    setEditESS(false);
    setEditTI(false);
    setEditMainBreaker(false);
    setEditBackupPanel(false);
    setSectionNote("");
  }, [onChange]);

  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: photoSectionName,
      tagOptions: DEFAULT_INVERTER_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {
      },
    });
  };

  // Extract just the number from systemLabel (e.g., "System 1" -> "1")
  const systemNum = systemLabel ? systemLabel.replace(/[^\d]/g, '') : '';
  const sectionTitle = "Gateway Configuration";

  return (
    <CollapsibleSection
      title={sectionTitle}
      systemNumber={systemNum || undefined}
      initiallyExpanded={false}
      isDirty={!!isDirty}
      isRequiredComplete={isComplete}
      photoCount={photoCount}
      onCameraPress={handleCameraPress}
    >
      <View style={styles.sectionContent}>
        <NewExistingToggle
          isNew={values.isNew}
          onToggle={(v) => onChange("isNew", v)}
          onTrashPress={() => setShowClearModal(true)}
        />

        <ConfirmClearModal
          visible={showClearModal}
          sectionTitle="Gateway Configuration"
          onConfirm={() => {
            clearAll();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        {/* Hardcoded Make & Model Display */}
        <View style={styles.makeModelSection}>
          <View style={styles.makeModelRow}>
            <Text style={styles.makeModelLabel}>Make:</Text>
            <Text style={styles.makeModelValue}>{gatewayConfig.make}</Text>
          </View>
          <View style={styles.makeModelRow}>
            <Text style={styles.makeModelLabel}>Model:</Text>
            <Text style={styles.makeModelValue}>{gatewayConfig.model}</Text>
          </View>
        </View>

        {/* Main Breaker */}
        <Note
          label="Main Breaker"
          note="Main Breaker is defaulted to MLO. Click pencil to edit if alternate breaker is needed."
          iconSource={editMainBreaker ? xIcon : undefined}
          onEdit={() => {
            if (editMainBreaker) onChange("selectedMainBreaker", "mlo");
            setEditMainBreaker(!editMainBreaker);
          }}
        >
          {editMainBreaker && (
            <Dropdown
              label=""
              data={mainBreakerOptions}
              value={
                values.selectedMainBreaker === "mlo"
                  ? ""
                  : values.selectedMainBreaker
              }
              onChange={(v) => onChange("selectedMainBreaker", v || "mlo")}
              widthPercent={40}
            />
          )}
        </Note>

        {/* Backup Subpanel */}
        <Note
          label="Backup Subpanel"
          note="Backup Subpanel is defaulted to MLO. Click pencil to edit if alternate breaker is needed."
          iconSource={editBackupPanel ? xIcon : undefined}
          onEdit={() => {
            if (editBackupPanel) onChange("selectedBackupPanel", "mlo");
            setEditBackupPanel(!editBackupPanel);
          }}
        >
          {editBackupPanel && (
            <Dropdown
              label=""
              data={mainBreakerOptions}
              value={
                values.selectedBackupPanel === "mlo"
                  ? ""
                  : values.selectedBackupPanel
              }
              onChange={(v) => onChange("selectedBackupPanel", v || "mlo")}
              widthPercent={40}
            />
          )}
        </Note>

        {/* PV / ESS / Tie-in override */}
        <Note
          label="PV Breaker"
          note="A minimum PV Breaker will be added in the SMS PV input and will be rated to protect the total PV max continuous output current."
          iconSource={editPV ? xIcon : undefined}
          onEdit={() => {
            if (editPV) onChange("selectedPVBreaker", "");
            setEditPV(!editPV);
          }}
        >
          {editPV && (
            <Dropdown
              label=""
              data={breakerOptions}
              value={values.selectedPVBreaker!}
              onChange={(v) => onChange("selectedPVBreaker", v)}
              widthPercent={40}
            />
          )}
        </Note>

        <Note
          label="ESS Breaker"
          note="A minimum Battery Breaker will be added in the SMS Battery input and will be rated to protect the total Battery max continuous output current."
          iconSource={editESS ? xIcon : undefined}
          onEdit={() => {
            if (editESS) onChange("selectedESSBreaker", "");
            setEditESS(!editESS);
          }}
        >
          {editESS && (
            <Dropdown
              label=""
              data={breakerOptions}
              value={values.selectedESSBreaker!}
              onChange={(v) => onChange("selectedESSBreaker", v)}
              widthPercent={40}
            />
          )}
        </Note>

        <Note
          label="Tie-in Breaker"
          note="A minimum SMS Tie-in Breaker will be added in Main Panel (A). If you are landing in another location and/or using an alternate Tie in method, you can edit it in the Electrical section. If Whole Home Backup, the Tie-in breaker will auto size to the bus rating of the Panel it is landing in. If Partial Home Backup, the Tie-in Breaker will auto size to protect the total PV and Battery max continuous output current landed in the SMS. If the total PV and Battery max continuous output current landed in the SMS is larger than the max allowable panel backfeed, then the Power Control System (PCS) will activate and be sized to the max allowable panel backfeed or manually activate below."
          iconSource={editTI ? xIcon : undefined}
          onEdit={() => {
            if (editTI) onChange("selectedTieInBreaker", "");
            setEditTI(!editTI);
          }}
        >
          {editTI && (
            <Dropdown
              label=""
              data={tieInOptions}
              value={values.selectedTieInBreaker!}
              onChange={(v) => onChange("selectedTieInBreaker", v)}
              widthPercent={40}
            />
          )}
        </Note>

      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: 10,
  },
  makeModelSection: {
    marginVertical: 8,
  },
  makeModelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  makeModelLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    width: 80,
  },
  makeModelValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  dropdownWrap: { width: 180, alignSelf: "flex-start" },
  radial: { marginLeft: 40 },
});
