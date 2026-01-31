// src/screens/Project/SystemDetails/sections/ESS_Subsections/sys1_BackuploadSubPanel.tsx
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
import AutoSizeBackupPanelModal from "../../../../../components/Modals/AutoSizeBackupPanelModal";
import SystemButton from "../../../../../components/Button/SystemButton";
import { equipmentManufacturers } from "../../../../../api/project.service";
import { GetModelNumber } from "../../../../../api/inventry.service";
import { useProjectContext } from "../../../../../hooks/useProjectContext";
import { usePhotoCapture } from "../../../../../hooks/usePhotoCapture";
import { DEFAULT_ELECTRICAL_PHOTO_TAGS } from "../../../../../utils/constants";
import { moderateScale, verticalScale } from "../../../../../utils/responsive";
import { fetchPreferredEquipment, getEquipmentTypeForPreferred } from "../../../../../utils/preferredEquipmentHelper";

// Icons
const pencilIcon = require("../../../../../assets/Images/icons/pencil_icon_white.png");
const xIcon = require("../../../../../assets/Images/icons/X_Icon_Red_BB92011.png");
const boltIcon = require("../../../../../assets/Images/icons/tab3.png");

type LabeledOption = { label: string; value: string };

// Use the SAME equipment type as other combiner panels
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
      (n) => ({ label: String(n), value: String(n) })
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
    /** allow overriding the tie-in breaker */
    selectedTieInBreaker?: string;
  };
  onChange: (field: string, value: any) => void;
  errors: { [k: string]: string };
  label?: string;
  debugFetch?: boolean;
  showBOSButton?: boolean; // Show the Add BOS button
  onShowBOS?: () => void; // Callback when Add BOS button is clicked
  backupSystemSize?: string; // Backup system size selected by user (e.g., "100", "200", "30", "60")
}

const requiredFields = [
  "selectedMake",
  "selectedModel",
  "selectedBusAmps",
  "selectedMainBreaker",
] as const;

const BackupLoadSubPanelSection: React.FC<Props> = ({
  values,
  onChange,
  errors,
  label = "Backup Load Sub Panel",
  debugFetch = true,
  showBOSButton = false,
  onShowBOS,
  backupSystemSize,
}) => {
  // Photo capture integration
  const { projectId, companyId } = useProjectContext();
  const photoCapture = usePhotoCapture();

  // ── Local UI state ─────────────────────────
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAutoSizeModal, setShowAutoSizeModal] = useState(false);
  const [sectionNote, setSectionNote] = useState<string>("");
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [editingTieIn, setEditingTieIn] = useState(false);
  // Initialize from props (could be undefined)
  const [tieInValue, setTieInValue] = useState(
    values.selectedTieInBreaker ?? ""
  );

  // ── Dropdown lists ─────────────────────────
  const [makes, setMakes] = useState<LabeledOption[]>([]);
  const [models, setModels] = useState<LabeledOption[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

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

  // Show auto-size modal when backup system size exists but bus amps is empty
  useEffect(() => {
    if (backupSystemSize && !values.selectedBusAmps) {
      setShowAutoSizeModal(true);
    } else {
      setShowAutoSizeModal(false);
    }
  }, [backupSystemSize, values.selectedBusAmps]);

  // ── Default MLO on mount ────────────────────
  useEffect(() => {
    if (!values.selectedMainBreaker) {
      onChange("selectedMainBreaker", "mlo");
    }
    if (values.selectedTieInBreaker == null) {
      onChange("selectedTieInBreaker", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Makes on-demand (combiner type) ──
  const fetchMakes = useCallback(async () => {
    if (!companyUUID || loadingMakes || hasLoadedMakes.current) return;
    hasLoadedMakes.current = true;
    setLoadingMakes(true);
    try {
      const resp: any = await equipmentManufacturers(TYPE);
      const raw = resp.data?.data || [];
      const normalized = uniqueByLabel(raw.map(normalizeMake));
      setMakes(normalized);
    } catch (err: any) {
      hasLoadedMakes.current = false; // allow retry if it failed
    } finally {
      setLoadingMakes(false);
    }
  }, [companyUUID, loadingMakes, debugFetch]);

  // ── Fetch Models on-demand (combiner type) ─
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
      } catch (err: any) {
        hasLoadedModels.current = false; // allow retry if it failed
      } finally {
        setLoadingModels(false);
      }
    },
    [loadingModels, debugFetch]
  );

  const handleMakeOpen = () => fetchMakes();
  const handleModelOpen = () => fetchModels(values.selectedMake);

  // ── Dirty & completeness ───────────────────
  const isDirty =
    !values.isNew ||
    !!values.selectedMake ||
    !!values.selectedModel ||
    !!values.selectedBusAmps ||
    !!values.selectedMainBreaker ||
    editingTieIn;

  const isRequiredComplete = requiredFields.every((f) => {
    const v = (values as any)[f];
    return v !== "" && v != null;
  });

  // ── Clear all ──────────────────────────────
  const clearAll = () => {
    onChange("isNew", true);
    onChange("selectedMake", "");
    onChange("selectedModel", "");
    onChange("selectedBusAmps", "");
    onChange("selectedMainBreaker", "mlo"); // Reset to MLO
    onChange("selectedTieInBreaker", "");
    setEditingTieIn(false);
    setTieInValue("");
    setSectionNote("");
    hasLoadedModels.current = false;
    setModels([]);
    setShowClearModal(false);
  };

  // ── Auto-size backup panel handler ────────
  const handleAutoSizeConfirm = async () => {
    console.log(`[BackupLoadSubPanel] Auto-sizing to ${backupSystemSize}A`);

    // 1. Populate bus amps with backup system size
    onChange("selectedBusAmps", backupSystemSize);

    // 2. Set main circuit breaker to MLO
    onChange("selectedMainBreaker", "mlo");

    // 3. Fetch preferred equipment for Load Centers
    if (companyUUID && backupSystemSize) {
      try {
        const equipmentType = getEquipmentTypeForPreferred("Load Center");
        console.log(`[BackupLoadSubPanel] Fetching preferred equipment for type: ${equipmentType}`);

        const preferred = await fetchPreferredEquipment(companyUUID, equipmentType);
        console.log(`[BackupLoadSubPanel] Found ${preferred.length} preferred Load Centers`);

        if (preferred.length > 0) {
          // Filter by size if amperage info is available
          const sizeMatches = preferred.filter((item: any) => {
            // Check if model or make contains the size (e.g., "200A", "200 Amp", etc.)
            const modelStr = (item.model || "").toLowerCase();
            const makeStr = (item.make || "").toLowerCase();
            const searchStr = `${makeStr} ${modelStr}`;

            return searchStr.includes(`${backupSystemSize}a`) ||
                   searchStr.includes(`${backupSystemSize} amp`) ||
                   searchStr.includes(`${backupSystemSize} a`);
          });

          const targetList = sizeMatches.length > 0 ? sizeMatches : preferred;
          console.log(`[BackupLoadSubPanel] Size matches: ${sizeMatches.length}, using: ${targetList.length}`);

          // If only one match, auto-select it
          if (targetList.length === 1) {
            const selected = targetList[0];
            console.log(`[BackupLoadSubPanel] Auto-selecting: ${selected.make} ${selected.model}`);

            onChange("selectedMake", selected.make);
            onChange("selectedModel", selected.model);

            // Fetch and populate makes/models for display
            await fetchMakes();
            await fetchModels(selected.make);
          } else if (targetList.length > 1) {
            // Multiple matches - just populate the make if they all share the same make
            const uniqueMakes = new Set(targetList.map((item: any) => item.make));
            if (uniqueMakes.size === 1) {
              const make = Array.from(uniqueMakes)[0];
              console.log(`[BackupLoadSubPanel] Auto-selecting make: ${make} (${targetList.length} models available)`);
              onChange("selectedMake", make);
              await fetchMakes();
              await fetchModels(make);
            } else {
              console.log(`[BackupLoadSubPanel] Multiple makes found, user must choose`);
              await fetchMakes();
            }
          } else {
            console.log(`[BackupLoadSubPanel] No preferred equipment, user must choose manually`);
            await fetchMakes();
          }
        } else {
          console.log(`[BackupLoadSubPanel] No preferred equipment found`);
        }
      } catch (error) {
        console.error(`[BackupLoadSubPanel] Error fetching preferred equipment:`, error);
      }
    }

    setShowAutoSizeModal(false);
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
      onPhotoAdded: () => {
      },
    });
  };

  // Extract system number from label (e.g., "Backup Load Sub Panel 1" -> "1")
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
      >
        <View style={styles.sectionContent}>
          {/* Top row: New/Existing + Load Calcs */}
          <View style={styles.topRow}>
            <NewExistingToggle
              isNew={values.isNew}
              onToggle={(v) => onChange("isNew", v)}
              onTrashPress={() => setShowClearModal(true)}
            />
            <TouchableOpacity style={styles.loadCalcs}>
              <RNText style={styles.loadCalcsText}>Load Calcs</RNText>
              <Image source={boltIcon} style={styles.boltIcon} />
            </TouchableOpacity>
          </View>

          <ConfirmClearModal
            visible={showClearModal}
            sectionTitle={label}
            customMessage="This will clear the Backup Load Sub Panel section."
            onConfirm={clearAll}
            onCancel={() => setShowClearModal(false)}
          />

          <AutoSizeBackupPanelModal
            visible={showAutoSizeModal}
            backupSystemSize={backupSystemSize || ""}
            onConfirm={handleAutoSizeConfirm}
            onCancel={() => setShowAutoSizeModal(false)}
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
              setModels([]);
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

          {/* Main Circuit Breaker - defaults to MLO */}
          <View style={styles.dropdownWrap}>
            <Dropdown
              label="Main Circuit Breaker (Amps)*"
              data={mainBreakerOptions}
              value={values.selectedMainBreaker}
              onChange={(v) => onChange("selectedMainBreaker", v)}
              errorText={errors.selectedMainBreaker}
            />
          </View>

          {/* Tie-in Breaker Note / Edit */}
          {!editingTieIn ? (
            <View style={styles.noteRow}>
              <View style={styles.noteTextWrap}>
                <RNText style={styles.noteLabel}>Tie-in Breaker</RNText>
                <RNText style={styles.note}>
                  A minimum SMS Tie-in Breaker will be added in Main Panel (A)…
                  Tap the pencil to edit.
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
                  onChange={(v) => {
                    setTieInValue(v);
                    onChange("selectedTieInBreaker", v);
                  }}
                />
              </View>
              <TouchableOpacity onPress={() => setEditingTieIn(false)}>
                <Image source={xIcon} style={styles.xIcon} />
              </TouchableOpacity>
            </View>
          )}

          {/* Add BOS Equipment Button */}
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
    </>
  );
};

// ── Helpers ─────────────────────────────────────────────
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  loadCalcs: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadCalcsText: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "700",
    marginRight: moderateScale(4),
  },
  boltIcon: {
    width: moderateScale(24),
    height: verticalScale(32),
    tintColor: "#B92011",
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
    tintColor: "#FFF",
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
  bosSection: {
    width: "100%",
    marginTop: verticalScale(16),
  },
  addBOSButton: {
    width: "100%",
    height: verticalScale(40),
  },
});

export default BackupLoadSubPanelSection;
