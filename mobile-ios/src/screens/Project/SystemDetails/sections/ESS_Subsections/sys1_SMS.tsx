// src/screens/Project/SystemDetails/sections/ESS_Subsections/sys1_SMS.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useProjectContext } from "../../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../../hooks/usePhotoCapture";
import { DEFAULT_INVERTER_PHOTO_TAGS } from "../../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../../utils/responsive";
import CollapsibleSection from "../../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../../components/NewExistingToggle";
import Dropdown from "../../../../../components/Dropdown";
import ConfirmClearModal from "../../../../../components/Modals/ConfirmClearModal";
import Button from "../../../../../components/Button";
import SystemButton from "../../../../../components/Button/SystemButton";
import Note from "../../../../../components/Note";
import { BREAKER_RATING_OPTIONS } from "../../../../../utils/constants";

const xIcon = require("../../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

type Option = { label: string; value: string };

const tieInOptions: Option[] = [{ label: "###", value: "" }].concat(
  [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175,
    200, 225, 250,
  ].map((n) => ({ label: String(n), value: String(n) }))
);

interface Props {
  values: {
    isNew: boolean;

    /** NOTE: must match useEquipmentSection state shape */
    selectedMakeLabel: string;
    selectedMakeValue: string;
    selectedModelLabel: string;
    selectedModelValue: string;

    hasRSD: boolean; // -> sys1_sms_rsd_enabled
    selectedMainBreaker: string; // -> sys1_sms_breaker_rating
    selectedPVBreaker?: string; // -> sys1_sms_pv_breaker_rating_override
    selectedESSBreaker?: string; // -> sys1_sms_ess_breaker_rating_override
    selectedTieInBreaker?: string; // -> sys1_sms_tie_in_breaker_rating_override
  };
  onChange: (field: keyof Props["values"], value: any) => void;
  errors: { [k: string]: string };
  onClear?: () => void;

  // Provided by parent hook (same pattern as other sections)
  makes: Option[];
  models: Option[];
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;

  // Backup option for dynamic Tie-in Breaker note
  backupOption?: "" | "Whole Home" | "Partial Home" | "No Backup";

  // BOS props
  showBOSButton?: boolean; // Show the Add BOS button
  onShowBOS?: () => void; // Callback when Add BOS button is clicked

  // Optional label for system-specific SMS sections
  label?: string;
}

const requiredFields = [
  "selectedMakeValue",
  "selectedModelValue",
  "selectedMainBreaker",
] as const;

const EMPTY_ARR: any[] = [];

export default function Sys1SMSSection({
  values,
  onChange,
  errors,
  onClear,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,
  backupOption = "",
  showBOSButton = false,
  onShowBOS,
  label = "Storage Management System (SMS)",
}: Props) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();
  
  // Local UI state
  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editPV, setEditPV] = useState(false);
  const [editESS, setEditESS] = useState(false);
  const [editTI, setEditTI] = useState(false);

  // Defaults on first mount - set MLO as default for Main Breaker
  useEffect(() => {
    if (!values.selectedMainBreaker) onChange("selectedMainBreaker", "MLO");
    if (values.selectedPVBreaker === undefined)
      onChange("selectedPVBreaker", "");
    if (values.selectedESSBreaker === undefined)
      onChange("selectedESSBreaker", "");
    if (values.selectedTieInBreaker === undefined)
      onChange("selectedTieInBreaker", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Use BREAKER_RATING_OPTIONS from constants
  const breakerOptions = useMemo<Option[]>(
    () => BREAKER_RATING_OPTIONS.map(opt => ({ label: opt.label, value: opt.value })),
    []
  );

  // Dirty/complete state
  const isDirty =
    !values.isNew ||
    !!values.selectedMakeValue ||
    !!values.selectedModelValue ||
    values.hasRSD ||
    !!values.selectedMainBreaker;

  // "No SMS" is considered complete on its own
  const isComplete =
    values.selectedMakeValue === "No SMS" ||
    requiredFields.every((f) => !!String(values[f]).trim());

  const clearAll = useCallback(() => {
    // Clear UI state
    onChange("isNew", true);

    onChange("selectedMakeLabel", "");
    onChange("selectedMakeValue", "");
    onChange("selectedModelLabel", "");
    onChange("selectedModelValue", "");

    onChange("hasRSD", false);
    onChange("selectedMainBreaker", "MLO");
    onChange("selectedPVBreaker", "");
    onChange("selectedESSBreaker", "");
    onChange("selectedTieInBreaker", "");

    setEditPV(false);
    setEditESS(false);
    setEditTI(false);
    setSectionNote("");

    // Clear database
    onClear?.();
  }, [onChange, onClear]);

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
      onPhotoAdded: () => {
      },
    });
  };

  // Helpers to set both label & value from dropdown selections
  const setMakeFromValue = (val: string) => {
    const opt = makes.find((m) => m.value === val);
    onChange("selectedMakeValue", val);
    onChange("selectedMakeLabel", opt?.label ?? val);

    // Reset model when make changes
    onChange("selectedModelValue", "");
    onChange("selectedModelLabel", "");
  };

  const setModelFromValue = (val: string) => {
    const opt = models.find((m) => m.value === val);
    onChange("selectedModelValue", val);
    onChange("selectedModelLabel", opt?.label ?? val);
  };

  // Build dynamic Tie-in Breaker note based on backup option
  const getTieInBreakerNote = () => {
    let note = "A minimum SMS Tie-in Breaker will be added in the Main Panel (A). If you are landing in another location and/or using an alternate Tie-in method, you can edit it in the Electrical section.";

    // Add middle paragraph based on backup option
    if (backupOption === "Whole Home") {
      note += "\n\nThe Tie-in breaker will auto-size to the bus rating of the Panel it is landing in.";
    } else if (backupOption === "Partial Home") {
      note += "\n\nThe Tie-in breaker will auto-size to protect the total PV and battery max continuous output current landed in the SMS.";
    }
    // No Backup or empty: no middle paragraph

    // Always add final paragraph
    note += "\n\nIf the total PV and Battery max continuous output of the current landed in the SMS is larger than the max allowable panel backfeed, the Power Control System (PCS) will activate and be sized to the max allowable panel backfeed.";

    return note;
  };

  // Extract system number from label (e.g., "Storage Management System (SMS) 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  // Format title with line break after "Management" only when expanded
  const formattedTitle = isExpanded
    ? titleWithoutNumber.replace("Management ", "Management\n")
    : titleWithoutNumber;

  return (
    <CollapsibleSection
      title={formattedTitle}
      systemNumber={systemNumber}
      initiallyExpanded={false}
      isDirty={!!isDirty}
      isRequiredComplete={isComplete}
      photoCount={photoCount}
      onCameraPress={handleCameraPress}
      isLoading={isLoading}
      wrapTitleWhenExpanded={true}
      expanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
    >
      <View style={styles.sectionContent}>
        <NewExistingToggle
          isNew={values.isNew}
          onToggle={(v) => onChange("isNew", v)}
          onTrashPress={() => setShowClearModal(true)}
        />

        <ConfirmClearModal
          visible={showClearModal}
          sectionTitle="SMS"
          customMessage="This will clear the Storage Management System section."
          onConfirm={() => {
            clearAll();
            setShowClearModal(false);
          }}
          onCancel={() => setShowClearModal(false)}
        />

        {/* No SMS Button */}
        {!values.selectedMakeValue && (
          <Button
            title="No SMS"
            selected={values.selectedMakeValue === "No SMS"}
            onPress={() => {
              // Set "No SMS" as the make value
              onChange("selectedMakeValue", "No SMS");
              onChange("selectedMakeLabel", "No SMS");
              // Clear all other fields
              onChange("selectedModelValue", "");
              onChange("selectedModelLabel", "");
              onChange("selectedMainBreaker", "MLO");
              onChange("selectedPVBreaker", "");
              onChange("selectedESSBreaker", "");
              onChange("selectedTieInBreaker", "");
              onChange("hasRSD", false);
              setEditPV(false);
              setEditESS(false);
              setEditTI(false);
            }}
            width="100%"
            height={45}
            style={{ marginBottom: moderateScale(12) }}
          />
        )}

        {/* Make & Model - hide when "No SMS" is selected */}
        {values.selectedMakeValue !== "No SMS" && (
          <Dropdown
            label="Make*"
            data={makes}
            value={values.selectedMakeValue}
            onOpen={loadMakes}
            loading={loadingMakes}
            onChange={setMakeFromValue}
            errorText={errors.selectedMakeValue || errors.selectedMakeLabel}
          />
        )}

        {/* Show "No SMS" indicator when selected */}
        {values.selectedMakeValue === "No SMS" && (
          <View style={styles.noSmsContainer}>
            <Note
              label="No SMS Selected"
              note="This system does not require a Storage Management System. The inverter acts as the SMS."
              iconSource={xIcon}
              onEdit={() => {
                // Clear "No SMS" selection
                onChange("selectedMakeValue", "");
                onChange("selectedMakeLabel", "");
              }}
            />
          </View>
        )}

        {/* Only show remaining fields when "No SMS" is NOT selected */}
        {values.selectedMakeValue !== "No SMS" && (
          <>
            <Dropdown
              label="Model*"
              data={models}
              value={values.selectedModelValue}
              onOpen={() => {
                if (values.selectedMakeValue) loadModels();
              }}
              loading={loadingModels}
              disabled={!values.selectedMakeValue}
              onChange={setModelFromValue}
              errorText={errors.selectedModelValue || errors.selectedModelLabel}
            />

            {/* Main Breaker - defaults to MLO */}
            <Dropdown
              label="Main Breaker*"
              data={breakerOptions}
              value={values.selectedMainBreaker}
              onChange={(v) => onChange("selectedMainBreaker", v)}
              errorText={errors.selectedMainBreaker}
            />

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
              note="A minimum SMS Tie-in Breaker will be added in the Main Panel (A). If you are landing in another location and/or using alternate Tie-in method you can edit it in the Electrical Section."
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
              note={getTieInBreakerNote()}
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

            {/* RSD - Button at bottom */}
            {!values.hasRSD ? (
              <Button
                title="+ Rapid Shutdown (RSD)"
                selected={false}
                onPress={() => onChange("hasRSD", true)}
                width="100%"
                height={45}
                style={styles.rsdButton}
              />
            ) : (
              <Button
                title="Rapid Shutdown (RSD)"
                selected={true}
                onPress={() => onChange("hasRSD", false)}
                width="100%"
                height={45}
                style={styles.rsdButton}
              />
            )}
          </>
        )}

        {/* BOS Section */}
        {showBOSButton && onShowBOS && (
          <View style={styles.bosSection}>
            <SystemButton
              label="Add Pre-Combine BOS Equipment"
              onPress={() => {
                onShowBOS();
              }}
              style={styles.addBOSButton}
              scaleOverride={0.85}
            />
          </View>
        )}

      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: moderateScale(12),
  },
  rsdButton: {
    marginTop: 0,
    marginBottom: verticalScale(8),
  },
  bosSection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  addBOSButton: {
    width: "100%",
  },
  noSmsContainer: {
    marginBottom: moderateScale(12),
  },
});
