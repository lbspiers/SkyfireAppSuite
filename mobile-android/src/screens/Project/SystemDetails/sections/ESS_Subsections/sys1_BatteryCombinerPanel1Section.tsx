// src/screens/Project/SystemDetails/sections/ESS_Subsections/BatteryCombinerPanelSection.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text as RNText,
} from "react-native";
import { useSelector } from "react-redux";
import CollapsibleSection from "../../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../../components/NewExistingToggle";
import Dropdown from "../../../../../components/Dropdown";
import ConfirmClearModal from "../../../../../components/Modals/ConfirmClearModal";
import RadialButton from "../../../../../components/Button/RadialButton";
import { equipmentManufacturers } from "../../../../../api/project.service";
import { GetModelNumber } from "../../../../../api/inventry.service";
import { useProjectContext } from "../../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../../hooks/usePhotoCapture";
import { DEFAULT_ELECTRICAL_PHOTO_TAGS } from "../../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../../utils/responsive";

// Icons
const pencilIcon = require("../../../../../assets/Images/icons/pencil_icon_white.png");
const xIcon = require("../../../../../assets/Images/icons/X_Icon_Red_BB92011.png");

type LabeledOption = { label: string; value: string };

// Use the SAME equipment type as standard combiner panels
const TYPE = "String Combiner Panel";

// Static dropdown options
const busAmpOptions: LabeledOption[] = [{ label: "###", value: "" }].concat(
  Array.from({ length: 22 }, (_, i) => {
    const v = String(40 + i * 10);
    return { label: v, value: v };
  })
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

interface Props {
  values: {
    isNew: boolean;
    selectedMake: string;
    selectedModel: string;
    selectedBusAmps: string;
    selectedMainBreaker: string;
    tieInBreaker?: string;
  };
  onChange: (field: string, value: any) => void;
  errors: { [k: string]: string };
  onClear?: () => void;
  label?: string;
  debugFetch?: boolean;
  isLoading?: boolean;
}

const requiredFields = [
  "selectedMake",
  "selectedModel",
  "selectedBusAmps",
  "selectedMainBreaker",
] as const;

const BatteryCombinerPanelSection: React.FC<Props> = ({
  values,
  onChange,
  errors,
  onClear,
  label = "Battery Combiner Panel",
  debugFetch = true,
  isLoading = false,
}) => {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();
  
  // Local state
  const [showClearModal, setShowClearModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [editingTieIn, setEditingTieIn] = useState(false);
  const [tieInValue, setTieInValue] = useState<string>("");

  // Dropdown data + loading flags
  const [makes, setMakes] = useState<LabeledOption[]>([]);
  const [models, setModels] = useState<LabeledOption[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // only fetch once per mount/open
  const hasLoadedMakes = useRef(false);
  const hasLoadedModels = useRef(false);

  const companyUUID = useSelector(
    (store: any) => store.profile.profile?.company?.uuid
  );

  // Load photo count for this section
  useEffect(() => {
    if (projectId && label) {
      photoCapture.getPhotoCount(label).then(setPhotoCount);
    }
  }, [projectId, label, photoCapture.refreshTrigger]);

  // Ensure a default MLO selection on mount
  useEffect(() => {
    if (!values.selectedMainBreaker) {
      onChange("selectedMainBreaker", "mlo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch makes on-demand (using shared TYPE)
  const fetchMakes = useCallback(async () => {
    if (!companyUUID || loadingMakes || hasLoadedMakes.current) return;
    hasLoadedMakes.current = true;
    setLoadingMakes(true);
    try {
      const resp: any = await equipmentManufacturers(TYPE);
      const raw = resp.data?.data || [];
      const normalized = uniqueByLabel(raw.map(normalizeMake));
      setMakes(normalized);
    } catch (e: any) {
      hasLoadedMakes.current = false; // allow retry on failure
    } finally {
      setLoadingMakes(false);
    }
  }, [companyUUID, debugFetch, loadingMakes]);

  // Fetch models on-demand for selected make (using shared TYPE)
  const fetchModels = useCallback(
    async (make: string) => {
      if (!make || loadingModels || hasLoadedModels.current) return;
      hasLoadedModels.current = true;
      setLoadingModels(true);
      try {
        const resp: any = await GetModelNumber(TYPE, make);
        const raw = resp.data?.data || [];
        const normalized = uniqueByLabel(raw.map(normalizeModel));
        setModels(normalized);
      } catch (e: any) {
        hasLoadedModels.current = false; // allow retry on failure
      } finally {
        setLoadingModels(false);
      }
    },
    [debugFetch, loadingModels]
  );

  const handleMakeOpen = () => fetchMakes();
  const handleModelOpen = () => fetchModels(values.selectedMake);

  // Dirty and completeness flags
  const isDirty =
    values.isNew === false ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    !!values.selectedBusAmps ||
    !!values.selectedMainBreaker ||
    editingTieIn;

  const isRequiredComplete = requiredFields.every((f) => {
    const v = (values as any)[f];
    return v !== "" && v != null;
  });

  // Clear all fields
  const clearAll = () => {
    // Clear UI state
    onChange("isNew", true);
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("selectedBusAmps", "");
    onChange("selectedMainBreaker", "");
    setEditingTieIn(false);
    setTieInValue("");
    setSectionNote("");
    hasLoadedModels.current = false;
    setModels([]);

    // Clear database
    onClear?.();
  };

  // MLO toggle helper
  const handleToggleMLO = (on: boolean) =>
    onChange("selectedMainBreaker", on ? "mlo" : "");

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
      onPhotoAdded: () => {
      },
    });
  };

  // Extract system number from label (e.g., "Battery Combiner Panel 1" -> "1")
  const systemNumber = label.match(/\d+$/)?.[0];
  const titleWithoutNumber = label.replace(/\s+\d+$/, "");

  return (
    <>
      <CollapsibleSection
        title={titleWithoutNumber}
        systemNumber={systemNumber}
        initiallyExpanded={false}
        isDirty={!!isDirty}
        isRequiredComplete={isRequiredComplete}
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
        isLoading={isLoading}
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

          {/* Make* */}
          <Dropdown
            label="Make*"
            data={makes}
            value={values.selectedMake}
            onOpen={handleMakeOpen}
            loading={loadingMakes}
            onChange={(v) => {
              onChange("selectedMake", v);
              onChange("selectedModel", "");
              hasLoadedModels.current = false;
              setModels([]); // clear stale models
            }}
            errorText={errors.selectedMake}
          />

          {/* Model* */}
          <Dropdown
            label="Model*"
            data={models}
            value={values.selectedModel}
            onOpen={handleModelOpen}
            loading={loadingModels}
            disabled={!values.selectedMake}
            onChange={(v) => onChange("selectedModel", v)}
            errorText={errors.selectedModel}
          />

          {/* Bus (Amps)* */}
          <View style={styles.dropdownWrap}>
            <Dropdown
              label="Bus (Amps)*"
              data={busAmpOptions}
              value={values.selectedBusAmps}
              onChange={(v) => onChange("selectedBusAmps", v)}
              errorText={errors.selectedBusAmps}
            />
          </View>

          {/* Main breaker + MLO */}
          <View style={styles.row}>
            <View style={styles.dropdownWrap}>
              <Dropdown
                label="Main Circuit Breaker (Amps)*"
                data={mainBreakerOptions}
                value={values.selectedMainBreaker}
                onChange={(v) => onChange("selectedMainBreaker", v)}
                errorText={errors.selectedMainBreaker}
              />
            </View>
            <RadialButton
              label="MLO"
              defaultOn={values.selectedMainBreaker === "mlo"}
              onToggle={handleToggleMLO}
              size={28}
              style={styles.radial}
            />
          </View>

          {/* Tie-in Breaker note/edit */}
          {!editingTieIn ? (
            <View style={styles.noteRow}>
              <View style={styles.noteTextWrap}>
                <RNText style={styles.noteLabel}>Tie-in Breaker</RNText>
                <RNText style={styles.note}>
                  {values.tieInBreaker
                    ? `Tie-in Breaker: ${values.tieInBreaker}A - Tap the pencil to edit.`
                    : "Note: A Tie-in Breaker will be added in Main Panel (A)… Tap the pencil to edit."}
                </RNText>
              </View>
              <TouchableOpacity onPress={() => {
                setEditingTieIn(true);
                setTieInValue(values.tieInBreaker || "");
              }}>
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
                  onChange={(v) => {
                    setTieInValue(v);
                    onChange("tieInBreaker", v);
                  }}
                />
              </View>
              <TouchableOpacity onPress={() => setEditingTieIn(false)}>
                <Image source={xIcon} style={styles.xIcon} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CollapsibleSection>
    </>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeMake(item: any): LabeledOption {
  if (typeof item === "string") return { label: item, value: item };
  const manufacturer =
    item.manufacturer ?? item.name ?? item.label ?? String(item ?? "");
  return { label: manufacturer, value: manufacturer };
}

function normalizeModel(item: any): LabeledOption {
  if (typeof item === "string") return { label: item, value: item };
  const model =
    item.model ??
    item.model_number ??
    item.name ??
    item.label ??
    item.sku ??
    item.part_number ??
    String(item ?? "");
  return { label: model, value: model };
}

function uniqueByLabel(arr: LabeledOption[]): LabeledOption[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = (x.label || "").toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
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
  noteLabel: {
    color: "#FFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(4),
  },
  note: {
    color: "#FFF",
    fontSize: moderateScale(20),
  },
  pencil: {
    width: moderateScale(28),
    height: moderateScale(28),
    resizeMode: "contain",
    tintColor: "#fff",
  },
  editRow: {
    justifyContent: "space-between",
    width: "100%",
  },
  xIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    resizeMode: "contain",
  },
});

export default BatteryCombinerPanelSection;
