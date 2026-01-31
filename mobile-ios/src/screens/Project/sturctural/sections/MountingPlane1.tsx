import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CollapsibleSectionNoToggle from "../../../../components/UI/CollapsibleSection_noToggle";
import Button from "../../../../components/Button";
import SystemButton from "../../../../components/Button/SystemButton";
import Dropdown from "../../../../components/Dropdown";
import { ORANGE_TB, BLUE_2C_BT } from "../../../../styles/gradient";
import TextInput from "../../../../components/TextInput";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import NumericKeypad from "../../../../components/NumericKeypad";
import { usePhotoCapture } from "../../../../hooks/usePhotoCapture";
import {
  STORIES_OPTIONS,
  PITCH_OPTIONS,
  DEFAULT_STRUCTURAL_PHOTO_TAGS,
} from "../../../../utils/constants";
import { useResponsive } from "../../../../utils/responsive";

const plusIcon = require("../../../../assets/Images/icons/plus_icon_orange_fd7332.png");

// Compact A/B Toggle Component
interface ABToggleProps {
  isA: boolean;
  onToggle: (isA: boolean) => void;
  style?: any;
}

const ABToggle: React.FC<ABToggleProps> = ({ isA, onToggle, style }) => {
  const { moderateScale: rs, verticalScale: vs } = useResponsive();

  return (
    <View style={[abToggleStyles.container, style]}>
      <TouchableOpacity onPress={() => onToggle(true)} style={abToggleStyles.button}>
        {isA ? (
          <LinearGradient
            colors={ORANGE_TB.colors}
            start={ORANGE_TB.start}
            end={ORANGE_TB.end}
            style={abToggleStyles.activeButton}
          >
            <Text style={abToggleStyles.activeText}>A</Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={BLUE_2C_BT.colors}
            start={BLUE_2C_BT.start}
            end={BLUE_2C_BT.end}
            style={abToggleStyles.inactiveButton}
          >
            <Text style={abToggleStyles.inactiveText}>A</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onToggle(false)} style={abToggleStyles.button}>
        {!isA ? (
          <LinearGradient
            colors={ORANGE_TB.colors}
            start={ORANGE_TB.start}
            end={ORANGE_TB.end}
            style={abToggleStyles.activeButton}
          >
            <Text style={abToggleStyles.activeText}>B</Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={BLUE_2C_BT.colors}
            start={BLUE_2C_BT.start}
            end={BLUE_2C_BT.end}
            style={abToggleStyles.inactiveButton}
          >
            <Text style={abToggleStyles.inactiveText}>B</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </View>
  );
};

const abToggleStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 2,
  },
  button: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  activeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8, // 6 + 2 to compensate for inactive button's 2px border
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  inactiveButton: {
    paddingHorizontal: 8,
    paddingVertical: 6, // Match dropdown paddingVertical
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#888888",
    borderRadius: 4,
  },
  activeText: {
    fontSize: 20, // Match dropdown selectedText fontSize
    fontWeight: "400", // Match dropdown selectedText fontWeight
    color: "#FFFFFF",
  },
  inactiveText: {
    fontSize: 20, // Match dropdown placeholder fontSize
    fontWeight: "400", // Match dropdown placeholder fontWeight
    color: "#bbbbbb",
  },
});

export interface MountingPlaneValues {
  mode: "Flush" | "Tilt" | "Ground" | "";
  stories: string;
  pitch: string;
  azimuth: string;
  qty1: string;
  qty2: string;
  qty3: string;
  qty4: string;
  qty5?: string;
  qty6?: string;
  qty7?: string;
  qty8?: string;
  roof_type: "A" | "B" | "";
}

interface Props {
  planeIndex: number; // 1..10
  isFirst: boolean;
  isLastVisible: boolean;
  showNext?: boolean;
  onNext?: () => void;
  onClear: () => void;

  values: MountingPlaneValues;
  onChange: (field: keyof MountingPlaneValues, value: any) => void;
  errors?: Partial<Record<keyof MountingPlaneValues, string>>;
  hasRoofTypeB?: boolean;
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

export default function MountingPlaneSection({
  planeIndex,
  isFirst,
  isLastVisible,
  showNext = false,
  onNext,
  onClear,

  values,
  onChange,
  errors = {},
  hasRoofTypeB = false,
  projectId = "",
  companyId = "",
  onOpenGallery,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showExtraArrays, setShowExtraArrays] = useState(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");

  // Local state for debounced inputs
  const [localQty1, setLocalQty1] = useState(values.qty1 || "");
  const [localQty2, setLocalQty2] = useState(values.qty2 || "");
  const [localQty3, setLocalQty3] = useState(values.qty3 || "");
  const [localQty4, setLocalQty4] = useState(values.qty4 || "");
  const [localQty5, setLocalQty5] = useState(values.qty5 || "");
  const [localQty6, setLocalQty6] = useState(values.qty6 || "");
  const [localQty7, setLocalQty7] = useState(values.qty7 || "");
  const [localQty8, setLocalQty8] = useState(values.qty8 || "");

  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Debounced onChange handler for quantity fields
  const debouncedOnChange = useCallback((field: keyof MountingPlaneValues, value: string) => {
    // Clear existing timer for this field
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field]);
    }

    // Set new timer
    debounceTimers.current[field] = setTimeout(() => {
      onChange(field, value);
      delete debounceTimers.current[field];
    }, 400); // 400ms debounce delay
  }, [onChange]);

  const sectionLabel = `Mounting Plane ${planeIndex}`;
  const photoCapture = usePhotoCapture();

  // Sync local state when values change externally (but not while typing)
  useEffect(() => {
    // Only sync if we're not currently editing (no active debounce timer)
    if (!debounceTimers.current.qty1) {
      setLocalQty1(values.qty1 || "");
    }
    if (!debounceTimers.current.qty2) {
      setLocalQty2(values.qty2 || "");
    }
    if (!debounceTimers.current.qty3) {
      setLocalQty3(values.qty3 || "");
    }
    if (!debounceTimers.current.qty4) {
      setLocalQty4(values.qty4 || "");
    }
    if (!debounceTimers.current.qty5) {
      setLocalQty5(values.qty5 || "");
    }
    if (!debounceTimers.current.qty6) {
      setLocalQty6(values.qty6 || "");
    }
    if (!debounceTimers.current.qty7) {
      setLocalQty7(values.qty7 || "");
    }
    if (!debounceTimers.current.qty8) {
      setLocalQty8(values.qty8 || "");
    }
  }, [values.qty1, values.qty2, values.qty3, values.qty4, values.qty5, values.qty6, values.qty7, values.qty8]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

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

  // keypad
  const [padVisible, setPadVisible] = useState(false);
  const [padField, setPadField] = useState<keyof MountingPlaneValues | null>(
    null
  );
  const [padLabel, setPadLabel] = useState<string>("Quantity");
  const padValue = useMemo(
    () => (padField ? String(values[padField] ?? "") : ""),
    [padField, values]
  );

  const {
    moderateScale: rs,
    verticalScale: vs,
    font: rf,
    widthPercentageToDP: wp,
  } = useResponsive();

  // Calculate button width: (screen width - padding - gaps) / 3
  // Assuming 20px padding on each side (40 total) and 2 gaps of 10px each (20 total)
  const screenWidth = require("react-native").Dimensions.get("window").width;
  const horizontalPadding = 40; // 20px on each side
  const gapSize = rs(10);
  const totalGaps = gapSize * 2; // 2 gaps between 3 buttons
  const buttonWidth = (screenWidth - horizontalPadding - totalGaps) / 3;

  // ── TUNABLE SPACING ──────────────────────────────────────────────────────
  const SPACING = {
    betweenModeAndFields: vs(24),
    sectionTop: vs(8),
    beforeQuantity: vs(-8),
    colGap: rs(12),
    modeBtnGap: rs(11),
    plusTop: vs(6),
  };

  const isDirty =
    !!values.mode ||
    !!values.stories ||
    !!values.pitch ||
    !!values.azimuth ||
    !!values.qty1;

  const isComplete =
    !!values.mode &&
    !!values.stories &&
    !!values.pitch &&
    !!values.azimuth &&
    !!values.qty1;

  // keypad control
  const openPad = (field: keyof MountingPlaneValues, label: string) => {
    setPadField(field);
    setPadLabel(label);
    setPadVisible(true);
  };
  const handlePadNumber = (n: string) => {
    if (!padField) return;

    // For azimuth and quantity fields, only allow whole numbers (no decimal points)
    const wholeNumberFields = ["azimuth", "qty1", "qty2", "qty3", "qty4", "qty5", "qty6", "qty7", "qty8"];
    if (wholeNumberFields.includes(padField) && n === ".") {
      return;
    }

    onChange(padField, `${values[padField] ?? ""}${n}`);
  };
  const handlePadBack = () => {
    if (!padField) return;
    const cur = String(values[padField] ?? "");
    onChange(padField, cur.slice(0, -1));
  };
  const handlePadClose = () => setPadVisible(false);

  // Section wrapper with consistent vertical rhythm
  const Section: React.FC<
    React.PropsWithChildren<{ mt?: number; first?: boolean }>
  > = ({ mt, first, children }) => (
    <View style={{ marginTop: first ? 0 : mt ?? SPACING.sectionTop }}>
      {children}
    </View>
  );

  const titleText = expanded
    ? `Mounting\nPlane ${planeIndex}`
    : `Mounting Plane ${planeIndex}`;

  // Clear button rules:
  // - All planes show clear when expanded and have data
  // - MP1 and middle planes: clear data only (keep section)
  // - Last visible plane: clear data and remove section
  const canShowTrash = isDirty;

  // Clear data function - clears all fields but keeps section
  const clearDataOnly = () => {
    onChange("mode", "");
    onChange("stories", "");
    onChange("pitch", "");
    onChange("azimuth", "");
    onChange("qty1", "");
    onChange("qty2", "");
    onChange("qty3", "");
    onChange("qty4", "");
    onChange("qty5", "");
    onChange("qty6", "");
    onChange("qty7", "");
    onChange("qty8", "");
    onChange("roof_type", "A");
  };

  // Determine which clear action to use
  const handleClearAction = () => {
    if (isLastVisible && !isFirst) {
      // Last plane (and not MP1): remove section entirely
      onClear();
    } else {
      // MP1 or middle planes: just clear data, keep section
      clearDataOnly();
    }
    setShowClearModal(false);
  };

  return (
    <>
      <ConfirmClearModal
        visible={showClearModal}
        sectionTitle={`Mounting Plane ${planeIndex}`}
        onConfirm={handleClearAction}
        onCancel={() => setShowClearModal(false)}
      />

      <CollapsibleSectionNoToggle
        title={titleText}
        initiallyExpanded
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        isDirty={isDirty}
        isRequiredComplete={isComplete}
        onTrashPress={
          canShowTrash && expanded ? () => setShowClearModal(true) : undefined
        }
        photoCount={photoCount}
        onCameraPress={handleCameraPress}
      >
        {/* MODE row */}
        <Section first>
          <View style={[styles.modeRow, { gap: gapSize }]}>
            {["Flush", "Tilt", "Ground"].map((m) => (
              <Button
                key={m}
                title={m}
                selected={values.mode === m}
                onPress={() => onChange("mode", m as any)}
                width={buttonWidth} // Calculated width to fill screen
                height={vs(40)} // Fixed height with vertical scaling
                style={styles.modeButton}
                textStyle={{
                  fontSize: rf(18), // Responsive font size
                  fontWeight: "700",
                  letterSpacing: 0.15, // Add letter spacing for readability
                }}
              />
            ))}
          </View>
        </Section>

        {/* Roof Type / Stories / Pitch / Azimuth */}
        <Section mt={SPACING.betweenModeAndFields}>
          <View style={[styles.inputRow, { gap: hasRoofTypeB ? rs(8) : SPACING.colGap }]}>
            {hasRoofTypeB && (
              <View style={styles.colFiveLayout}>
                <Text style={[styles.roofTypeLabel, { fontSize: rf(20), lineHeight: rf(20) }]}>Roof</Text>
                <View style={{ height: vs(6) }} />
                <ABToggle
                  isA={values.roof_type === "A"}
                  onToggle={(isA) => onChange("roof_type", isA ? "A" : "B")}
                  style={styles.roofTypeToggle}
                />
              </View>
            )}
            <View style={hasRoofTypeB ? styles.colFiveLayout : styles.col}>
              <Dropdown
                label="Stories*"
                data={STORIES_OPTIONS.map((s) => ({ label: s, value: s }))}
                value={values.stories}
                onChange={(v) => onChange("stories", v)}
                widthPercent={100}
                errorText={errors.stories}
              />
            </View>
            <View style={hasRoofTypeB ? styles.colFiveLayout : styles.col}>
              <Dropdown
                label="Pitch*"
                data={PITCH_OPTIONS.map((p) => ({ label: p, value: p }))}
                value={values.pitch}
                onChange={(v) => onChange("pitch", v)}
                widthPercent={100}
                errorText={errors.pitch}
              />
            </View>
            <View style={hasRoofTypeB ? styles.colFiveLayout : styles.col}>
              <TextInput
                label="Azimuth*"
                value={values.azimuth}
                onChangeText={(t) => onChange("azimuth", t)}
                widthPercent={100}
                errorText={errors.azimuth}
                placeholder="0-360"
                keyboardType="numeric"
              />
            </View>
          </View>
        </Section>

        {/* Quantities 1–4 */}
        <Section mt={SPACING.beforeQuantity}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: rf(20),
              fontWeight: "700",
              marginBottom: vs(2),
            }}
          >
            Quantity*
          </Text>

          <View style={[styles.arrayInputsRow, { gap: SPACING.colGap }]}>
            {(["qty1", "qty2", "qty3", "qty4"] as const).map((field, i) => {
              const localStateMap = { qty1: localQty1, qty2: localQty2, qty3: localQty3, qty4: localQty4 };
              const setLocalStateMap = { qty1: setLocalQty1, qty2: setLocalQty2, qty3: setLocalQty3, qty4: setLocalQty4 };

              return (
                <View style={styles.arrayCol} key={field}>
                  <TextInput
                    label={`Array ${i + 1}`}
                    labelStyle={{ fontSize: rf(18) }}
                    placeholder="0"
                    value={localStateMap[field]}
                    onChangeText={(t) => {
                      setLocalStateMap[field](t);
                      debouncedOnChange(field, t);
                    }}
                    widthPercent={100}
                    errorText={errors[field]}
                    showNumericKeypad={true}
                  />
                </View>
              );
            })}
          </View>
        </Section>

        {/* “+” add arrays 5–8 */}
        {!showExtraArrays && (
          <Section mt={SPACING.plusTop}>
            <TouchableOpacity
              style={{ alignSelf: "flex-start" }}
              onPress={() => setShowExtraArrays(true)}
            >
              <Image
                source={plusIcon}
                style={{ width: rs(32), height: rs(32) }}
              />
            </TouchableOpacity>
          </Section>
        )}

        {/* Quantities 5–8 */}
        {showExtraArrays && (
          <Section>
            <View style={[styles.arrayInputsRow, { gap: SPACING.colGap }]}>
              {(["qty5", "qty6", "qty7", "qty8"] as const).map((field, i) => {
                const localStateMap = { qty5: localQty5, qty6: localQty6, qty7: localQty7, qty8: localQty8 };
                const setLocalStateMap = { qty5: setLocalQty5, qty6: setLocalQty6, qty7: setLocalQty7, qty8: setLocalQty8 };

                return (
                  <View style={styles.arrayCol} key={field}>
                    <TextInput
                      label={`Array ${i + 5}`}
                      labelStyle={{ fontSize: rf(18) }}
                      placeholder="0"
                      value={localStateMap[field]}
                      onChangeText={(t) => {
                        setLocalStateMap[field](t);
                        debouncedOnChange(field, t);
                      }}
                      widthPercent={100}
                      errorText={errors[field]}
                      showNumericKeypad={true}
                    />
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* Next plane */}
        {showNext && onNext && (
          <Section>
            <SystemButton
              label={`Mounting Plane ${planeIndex + 1}`}
              onPress={onNext}
            />
          </Section>
        )}
      </CollapsibleSectionNoToggle>

      {/* Numeric keypad */}
      <NumericKeypad
        isVisible={padVisible}
        title={padLabel}
        currentValue={padValue}
        onNumberPress={handlePadNumber}
        onBackspace={handlePadBack}
        onClose={handlePadClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Distribute evenly
    alignItems: "center",
    flexWrap: "nowrap", // Prevent wrapping
    width: "100%", // Full width
  },
  modeButton: {
    marginHorizontal: 0, // No extra margins, gap handles spacing
    flex: 0, // Don't flex, use fixed width
  },
  inputRow: {
    flexDirection: "row",
  },
  col: {
    flex: 1, // Full width when no roof type B (3 columns - 33.33% each)
  },
  colFiveLayout: {
    flex: 1, // Equal flex distribution for 5 columns
  },
  roofTypeLabel: {
    fontWeight: "700", // Match dropdown label fontWeight
    color: "#FFFFFF", // Match dropdown label color
  },
  roofTypeToggle: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  arrayInputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  arrayCol: {
    flex: 1,
  },
});
