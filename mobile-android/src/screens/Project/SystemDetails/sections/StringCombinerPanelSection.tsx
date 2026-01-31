// src/screens/Project/SystemDetails/sections/StringCombinerPanelSection.tsx
import React, { useState, useEffect } from "react";
import { colors } from "../../../../theme/tokens/tokens";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text as RNText,
} from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import { colors } from "../../../../theme/tokens/tokens";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import { colors } from "../../../../theme/tokens/tokens";
import Dropdown from "../../../../components/Dropdown";
import { colors } from "../../../../theme/tokens/tokens";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import { colors } from "../../../../theme/tokens/tokens";
import RadialButton from "../../../../components/Button/RadialButton";
import { colors } from "../../../../theme/tokens/tokens";
import SystemButton from "../../../../components/Button/SystemButton";
import { colors } from "../../../../theme/tokens/tokens";
import Button from "../../../../components/Button";
import { colors } from "../../../../theme/tokens/tokens";
import InlineCustomStringing from "../../../../components/sections/InlineCustomStringing";
import { colors } from "../../../../theme/tokens/tokens";
import { useProjectContext } from "../../../../hooks/useProjectContext";
import { colors } from "../../../../theme/tokens/tokens";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import { colors } from "../../../../theme/tokens/tokens";
import { DEFAULT_ELECTRICAL_PHOTO_TAGS, BUS_BAR_RATING, STRING_COMBINER_MODELS, HOYMILES_STRINGING_SPECS } from "../../../../utils/constants";
import { colors } from "../../../../theme/tokens/tokens";
import { moderateScale, verticalScale, widthPercentageToDP as wp } from "../../../../utils/responsive";
import { colors } from "../../../../theme/tokens/tokens";

// Icons
const pencilIcon = require("../../../../assets/Images/icons/pencil_icon_white.png");
const xIcon = require("../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

type LabeledOption = { label: string; value: string };

// Static dropdown options
const busAmpOptions: LabeledOption[] = [{ label: "###", value: "" }].concat(
  BUS_BAR_RATING
);
const mainBreakerOptions: LabeledOption[] = [{ label: "###", value: "" }]
  .concat([{ label: "MLO", value: "mlo" }])
  .concat(
    [100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600].map(
      (v) => ({ label: String(v), value: String(v) })
    )
  );
const tieInOptions: LabeledOption[] = [{ label: "###", value: "" }].concat(
  [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175,
    200, 225, 250,
  ].map((n) => ({ label: String(n), value: String(n) }))
);

// Required fields for completeness check
const requiredFields = [
  "selectedMake",
  "selectedModel",
  "selectedBusAmps",
  "selectedMainBreaker",
] as const;

interface Props {
  values: {
    isNew: boolean;
    selectedMake: string;
    selectedModel: string;
    selectedBusAmps: string;
    selectedMainBreaker: string;
    // Custom stringing branch fields
    branchString1?: string;
    branchString2?: string;
    branchString3?: string;
    branchString4?: string;
    branchString5?: string;
    branchString6?: string;
    branchString7?: string;
    branchString8?: string;
    // Stringing type
    stringingType?: "auto" | "custom" | "";
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  label?: string;
  debugFetch?: boolean;

  // Provided by parent
  makes: Array<{ label: string; value: string }>;
  models: Array<{ label: string; value: string }>;
  loadMakes: () => void;
  loadModels: () => void;
  loadingMakes: boolean;
  loadingModels: boolean;
  isLoading?: boolean;

  // For custom stringing
  solarPanelQuantity?: number;

  // BOS props
  showBOSButton?: boolean;
  onShowBOS?: () => void;
}

export default function StringCombinerPanelSection({
  values,
  onChange,
  errors,
  label = "Combiner Panel 1",
  debugFetch = true,
  makes,
  models,
  loadMakes,
  loadModels,
  loadingMakes,
  loadingModels,
  isLoading = false,

  // Custom stringing
  solarPanelQuantity = 0,

  // BOS props
  showBOSButton = false,
  onShowBOS,
}: Props) {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // UI state
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingTieIn, setEditingTieIn] = useState(false);
  const [tieInValue, setTieInValue] = useState("");
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the dynamic models prop from parent (fetched from API)
  // This matches the pattern used in SolarPanelSection
  const modelsToUse = models;

  // Helper function to determine max branches based on Enphase model
  const getMaxBranches = (make: string, model: string): number => {
    if (make !== "Enphase") {
      return 8; // Default for non-Enphase
    }

    // Check for specific Enphase models
    if (model.includes("6C")) {
      return 5; // IQ Combiner 6C has 5 branches
    } else {
      return 4; // All other Enphase models have 4 branches
    }
  };

  // Ensure default MLO if empty
  useEffect(() => {
    if (!values.selectedMainBreaker) {
      onChange("selectedMainBreaker", "mlo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  const clearAll = () => {
    onChange("isNew", true);
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("selectedBusAmps", "");
    onChange("selectedMainBreaker", "");
    // Clear custom stringing branch fields
    onChange("branchString1", "");
    onChange("branchString2", "");
    onChange("branchString3", "");
    onChange("branchString4", "");
    onChange("branchString5", "");
    onChange("branchString6", "");
    onChange("branchString7", "");
    onChange("branchString8", "");
    setEditingTieIn(false);
    setTieInValue("");
    setSectionNote("");
  };
  
  // Handle camera button press
  const handleCameraPress = () => {
    if (!photoCapture.hasProjectContext) {
      return;
    }

    photoCapture.openForSection({
      section: label,
      tagOptions: DEFAULT_ELECTRICAL_PHOTO_TAGS,
      initialNote: sectionNote,
      onNotesSaved: (note) => {
        setSectionNote(note);
      },
      onPhotoAdded: () => {},
    });
  };

  // Dynamic required fields based on make
  const isEnphase = values.selectedMake === "Enphase";
  const dynamicRequiredFields = isEnphase
    ? ["selectedMake", "selectedModel"]
    : requiredFields;

  const isDirty =
    !values.isNew ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    (!isEnphase && !!values.selectedBusAmps) ||
    (!isEnphase && !!values.selectedMainBreaker) ||
    editingTieIn;

  const isRequiredComplete = dynamicRequiredFields.every((f) => {
    const v = (values as any)[f];
    return v !== "" && v != null;
  });

  // Extract system number from label (e.g., "String Combiner Panel 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  // Format title with line break after "Combiner" only when expanded
  const formattedTitle = isExpanded
    ? titleWithoutNumber.replace("Combiner ", "Combiner\n")
    : titleWithoutNumber;

  return (
    <>
      <CollapsibleSection
        title={formattedTitle}
        systemNumber={systemNumber}
        initiallyExpanded={false}
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
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
            sectionTitle={label}
            onConfirm={() => {
              clearAll();
              setShowClearModal(false);
            }}
            onCancel={() => setShowClearModal(false)}
          />

          {/* Make */}
          <Dropdown
            label="Make*"
            data={makes}
            value={values.selectedMake}
            onOpen={loadMakes}
            loading={loadingMakes}
            onChange={(v) => {
              onChange("selectedMake", v);
              onChange("selectedModel", "");

              // Clear Bus Amps and Main Breaker fields when Enphase is selected
              if (v === "Enphase") {
                onChange("selectedBusAmps", "");
                onChange("selectedMainBreaker", "");
              }
            }}
            errorText={errors.selectedMake}
          />

          {/* Model */}
          <Dropdown
            label="Model*"
            data={modelsToUse}
            value={values.selectedModel}
            disabled={!values.selectedMake}
            onOpen={loadModels}
            loading={loadingModels}
            onChange={(v) => onChange("selectedModel", v)}
            errorText={errors.selectedModel}
          />

          {/* Bus (Amps) - Hidden for Enphase */}
          {values.selectedMake !== "Enphase" && (
            <View style={styles.dropdownWrap}>
              <Dropdown
                label="Bus (Amps)*"
                data={busAmpOptions}
                value={values.selectedBusAmps}
                onChange={(v) => onChange("selectedBusAmps", v)}
                errorText={errors.selectedBusAmps}
              />
            </View>
          )}

          {/* Main Breaker + MLO - Hidden for Enphase */}
          {values.selectedMake !== "Enphase" && (
            <View style={styles.row}>
              <View style={styles.dropdownWrap}>
                <Dropdown
                  label="Main Circuit Breaker*"
                  data={mainBreakerOptions}
                  value={values.selectedMainBreaker}
                  onChange={(v) => onChange("selectedMainBreaker", v)}
                  errorText={errors.selectedMainBreaker}
                />
              </View>
              <RadialButton
                label="MLO"
                defaultOn={values.selectedMainBreaker === "mlo"}
                onToggle={(on) =>
                  onChange("selectedMainBreaker", on ? "mlo" : "")
                }
                size={28}
                style={styles.radial}
              />
            </View>
          )}

          {/* Tie-in Breaker note or edit */}
          {!editingTieIn ? (
            <View style={styles.noteRow}>
              <View style={styles.noteTextWrap}>
                <RNText style={styles.noteLabel}>Tie-in Breaker</RNText>
                <RNText style={styles.note}>
                  A Tie-in Breaker will be added in the Main Panel (A) and will be rated to protect the total Microinverter continuous output current landed in this Combiner Panel.{"\n\n"}You can change the Tie-in Location in the Electrical Section.
                </RNText>
              </View>
              <TouchableOpacity onPress={() => setEditingTieIn(true)}>
                <Image source={pencilIcon} style={styles.pencil} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.row, styles.editRow]}>
              <View style={styles.dropdownWrap}>
                <Dropdown
                  label="Tie-in Breaker*"
                  data={tieInOptions}
                  value={tieInValue}
                  onChange={setTieInValue}
                />
              </View>
              <TouchableOpacity onPress={() => setEditingTieIn(false)}>
                <Image source={xIcon} style={styles.xIcon} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Add Pre-Combine BOS Equipment Button */}
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
      </CollapsibleSection>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    gap: moderateScale(12),
  },
  dropdownWrap: {
    width: moderateScale(180),
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  editRow: {
    justifyContent: "space-between",
    width: "100%",
  },
  radial: {
    marginLeft: moderateScale(40),
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: verticalScale(20),
  },
  noteTextWrap: {
    flex: 1,
    paddingRight: moderateScale(8),
  },
  hoymilesSpecsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  specsLabel: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: "400",
    marginBottom: verticalScale(4),
  },
  noteLabel: {
    color: colors.white,
    fontWeight: "700",
    fontSize: moderateScale(20),
    marginBottom: verticalScale(4),
  },
  note: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "400",
  },
  pencil: {
    width: moderateScale(28),
    height: moderateScale(28),
    tintColor: "#fff",
    resizeMode: "contain",
  },
  xIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    resizeMode: "contain",
  },
  bosSection: {
    width: "100%",
    marginTop: moderateScale(10),
  },
  addBOSButton: {
    width: "100%",
    height: verticalScale(40),
    marginBottom: verticalScale(10),
  },
  stringingSection: {
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
  stringingLabelRow: {
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
  stringingLabel: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "700",
  },
  stringingButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
  noteText: {
    color: "#fff",
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    marginTop: 0,
    marginBottom: verticalScale(10),
    fontStyle: "normal",
  },
  customSection: {
    marginTop: 0,
    marginBottom: verticalScale(10),
  },
  warningText: {
    color: "#FFA500",
    fontSize: moderateScale(16),
    marginTop: 0,
    marginBottom: verticalScale(10),
    fontStyle: "italic",
  },
});
