// src/screens/Project/electrical/sections/SubPanelBSection.tsx

import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
import NumericKeypad from "../../../../components/NumericKeypad";
import Button from "../../../../components/Button";
import SystemButton from "../../../../components/Button/SystemButton";
import DerateButton from "../../../../components/Button/DerateButton";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";
import { useResponsive } from "../../../../utils/responsive";

import {
  BUS_BAR_RATING,
  MAIN_CIRCUIT_BREAKER_RATINGS,
  BREAKER_RATING_OPTIONS,
  TIE_IN_LOCATIONS,
  CONDUCTOR_SIZING,
  DEFAULT_ELECTRICAL_PHOTO_TAGS,
} from "../../../../utils/constants";

const boltIcon = require("../../../../assets/Images/icons/tab3.png");

export interface SubPanelBSectionProps {
  type: "new" | "existing" | null;
  onTypeChange: (v: "new" | "existing") => void;

  busAmps: string;
  onBusAmpsChange: (v: string) => void;

  mainBreakerAmps: string;
  onMainBreakerChange: (v: string) => void;

  feederLocation: string;
  onFeederLocationChange: (v: string) => void;

  tieInBreakerRating: string;
  onTieInBreakerRatingChange: (v: string) => void;

  tieInLocation: string;
  onTieInLocationChange: (v: string) => void;

  conductorSizing: string;
  onConductorSizingChange: (v: string) => void;

  /** Derate toggle state and handler */
  derated?: boolean | null;
  onDerateChange?: (derated: boolean) => void;

  errors?: {
    busAmps?: string;
    mainBreaker?: string;
    feederLocation?: string;
    tieInBreakerRating?: string;
    tieInLocation?: string;
    conductorSizing?: string;
  };
  onClose: () => void; // Called when clearing - parent handles clearing all fields
  onClear?: () => void; // Optional separate clear handler
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
  hideCollapsible?: boolean; // Hide the collapsible wrapper (for use in modals)
}

export default function SubPanelBSection({
  type,
  onTypeChange,
  busAmps,
  onBusAmpsChange,
  mainBreakerAmps,
  onMainBreakerChange,
  feederLocation,
  onFeederLocationChange,
  tieInBreakerRating,
  onTieInBreakerRatingChange,
  tieInLocation,
  onTieInLocationChange,
  conductorSizing,
  onConductorSizingChange,
  derated,
  onDerateChange,
  errors = {},
  onClose,
  onClear,
  projectId = "",
  companyId = "",
  onOpenGallery,
  hideCollapsible = false,
}: SubPanelBSectionProps) {
  const [showClear, setShowClear] = useState(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");

  const sectionLabel = "Sub Panel (B)";

  // Get responsive utilities for button sizing
  const {
    verticalScale: vs,
    font: rf,
    widthPercentageToDP: wp
  } = useResponsive();

  // Calculate button width for feeder location buttons (3 buttons with gaps)
  const screenWidth = parseFloat(wp("100%"));
  const buttonWidth = (screenWidth - 48) / 3; // Account for container padding and gaps

  // Check if MLO is selected to hide derate button
  const isMLOSelected = mainBreakerAmps.toLowerCase().trim() === "mlo";

  // When MLO is selected and Derate is active, deactivate Derate
  useEffect(() => {
    if (isMLOSelected && derated) {
      console.log(
        "[SubPanelB] MLO selected with Derate active - deactivating Derate"
      );
      onDerateChange?.(false);
    }
  }, [mainBreakerAmps]); // Only trigger when mainBreakerAmps changes

  // Prepend "###" placeholder into the two short dropdowns
  const busOptions = [{ label: "", value: "" }, ...BUS_BAR_RATING];
  const breakerOptions = [
    { label: "", value: "" },
    ...MAIN_CIRCUIT_BREAKER_RATINGS,
  ];

  // Tie-In Breaker Rating options
  const tieInBreakerOptions = [
    { label: "", value: "" },
    ...BREAKER_RATING_OPTIONS,
  ];

  // Tie-In Location options
  const tieInLocationOptions = [
    { label: "", value: "" },
    ...TIE_IN_LOCATIONS,
  ];

  // Conductor Sizing options
  const conductorSizingOptions = [
    { label: "", value: "" },
    ...CONDUCTOR_SIZING,
  ];

  const isDirty =
    type !== null ||
    !!busAmps ||
    !!mainBreakerAmps ||
    !!feederLocation ||
    !!tieInBreakerRating ||
    !!tieInLocation ||
    !!conductorSizing ||
    !!derated;
  const isRequiredComplete =
    type !== null &&
    !!busAmps &&
    !!mainBreakerAmps &&
    !!feederLocation;

  const handleClearConfirm = () => {
    // Call parent's onClose which triggers clearSubPanelB in the parent
    setShowClear(false);
    onClose();
  };

  // backfeed calculation (1.2× bus − breaker), floored at 0
  const busValue = parseFloat(busAmps) || 0;
  // If MLO is selected, use tie-in breaker rating if available, otherwise use bus amps
  let breakerValue: number;
  const lowerMainBreaker = mainBreakerAmps.toLowerCase().trim();
  if (lowerMainBreaker === "mlo" || lowerMainBreaker === "") {
    // When MLO, use tie-in breaker rating if available, otherwise use bus amps
    const tieInValue = parseFloat(tieInBreakerRating) || 0;
    breakerValue = tieInValue > 0 ? tieInValue : busValue;
  } else {
    breakerValue = parseFloat(mainBreakerAmps) || 0;
  }
  const rawBackfeed = busValue * 1.2 - breakerValue;
  const backfeedValue = rawBackfeed > 0 ? Math.round(rawBackfeed) : 0;

  // Content that goes inside the section
  const sectionContent = (
    <View style={styles.sectionContent}>
          {/* Top row: New/Existing + Load Calcs */}
          <View style={styles.topRow}>
            <NewExistingToggle
              isNew={type === "new"}
              onToggle={(isNew) => onTypeChange(isNew ? "new" : "existing")}
              onTrashPress={() => setShowClear(true)}
            />
            {/* Load Calcs - Currently disabled, uncomment TouchableOpacity to enable */}
            {/* <TouchableOpacity style={styles.loadCalcs}>
              <Text style={styles.loadCalcsText}>Load Calcs</Text>
              <Image source={boltIcon} style={styles.boltIcon} />
            </TouchableOpacity> */}
            <View style={styles.loadCalcs}>
              <Text style={styles.loadCalcsText}>Load Calcs</Text>
              <Image source={boltIcon} style={styles.boltIcon} />
            </View>
          </View>

          <ConfirmClearModal
            visible={showClear}
            sectionTitle="Sub Panel (B)"
            onConfirm={handleClearConfirm}
            onCancel={() => setShowClear(false)}
          />

          {/* Bus (Amps) */}
          <View style={styles.fieldRow}>
            <View style={styles.smallDropdown}>
              <Dropdown
                label="Bus (Amps)*"
                data={busOptions}
                value={busAmps}
                onChange={onBusAmpsChange}
                widthPercent={100}
                errorText={errors.busAmps}
              />
            </View>
          </View>

          {/* Main Circuit Breaker + Derate */}
          <View style={styles.fieldRow}>
            <View style={styles.smallDropdown}>
              <Dropdown
                label="Main Circuit Breaker (Amps)"
                data={breakerOptions}
                value={mainBreakerAmps}
                onChange={onMainBreakerChange}
                widthPercent={100}
                errorText={errors.mainBreaker}
              />
            </View>
            {/* Hide Derate button when MLO is selected */}
            {!isMLOSelected && (
              <DerateButton
                derated={!!derated}
                onToggle={(value) => onDerateChange?.(value)}
              />
            )}
          </View>

          {/* Feeder location - Pill Buttons */}
          <View style={styles.feederLocationContainer}>
            <Text style={styles.feederLocationLabel}>Feeder location on Bus Bar*</Text>
            <View style={styles.feederLocationButtons}>
              {["Top", "Center", "Bottom"].map((location) => (
                <Button
                  key={location}
                  title={location}
                  selected={feederLocation === location}
                  onPress={() => onFeederLocationChange(location)}
                  width={buttonWidth}
                  height={vs(40)}
                  style={styles.feederButton}
                  textStyle={{
                    fontSize: rf(18),
                    fontWeight: "700",
                    letterSpacing: 0.15,
                  }}
                />
              ))}
            </View>
            {errors.feederLocation && (
              <Text style={styles.errorText}>{errors.feederLocation}</Text>
            )}
          </View>

          {/* Tie-In Breaker Rating + Conductor Sizing */}
          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <Dropdown
                label="Tie-In Breaker Rating (Amps)"
                data={tieInBreakerOptions}
                value={tieInBreakerRating}
                onChange={onTieInBreakerRatingChange}
                widthPercent={100}
                errorText={errors.tieInBreakerRating}
              />
            </View>
            {/* Conductor Sizing - Only show for existing panels */}
            {type === "existing" && (
              <View style={[styles.column, styles.conductorSizingColumn]}>
                <Dropdown
                  label="Conductor Sizing"
                  data={conductorSizingOptions}
                  value={conductorSizing}
                  onChange={onConductorSizingChange}
                  widthPercent={100}
                  errorText={errors.conductorSizing}
                />
              </View>
            )}
          </View>

          {/* Tie-In Location */}
          <View style={styles.fieldRow}>
            <Dropdown
              label="Tie-In Location"
              data={tieInLocationOptions}
              value={tieInLocation}
              onChange={onTieInLocationChange}
              widthPercent={100}
              errorText={errors.tieInLocation}
            />
          </View>

          {/* Allowable Backfeed */}
          <View style={styles.backfeedContainer}>
            <Text style={styles.backfeedLabel}>Allowable Backfeed</Text>
            <Text style={styles.backfeedResult}>{backfeedValue} Amps</Text>
          </View>

          {/* Sub Panel (C) button, inactive (border only) */}
          <SystemButton
            label="Sub Panel (C)"
            active={false}
            onPress={() => {}}
            style={styles.subPanelButton}
          />
        </View>
  );

  return (
    <>
      {hideCollapsible ? (
        // Render content directly without CollapsibleSection wrapper (for modal use)
        sectionContent
      ) : (
        // Render with CollapsibleSection wrapper (for electrical screen use)
        <CollapsibleSection
          title="Sub Panel (B)"
          initiallyExpanded={false}
          isDirty={isDirty}
          isRequiredComplete={isRequiredComplete}
          photoCount={photoCount}
          alwaysShowCamera
          captureConfig={{
            projectId,
            companyId,
            section: sectionLabel,
            tagOptions: DEFAULT_ELECTRICAL_PHOTO_TAGS,
            tagValue: null,
            initialNote: panelNote,
            onOpenGallery: () => onOpenGallery?.(sectionLabel),
            onSaveNote: (n) => setPanelNote(n),
            onMediaAdded: (type) => {
              if (type === "photo") setPhotoCount((c) => c + 1);
            },
          }}
        >
          {sectionContent}
        </CollapsibleSection>
      )}

      {/* Hidden NumericKeypad */}
      <NumericKeypad
        isVisible={false}
        currentValue=""
        onNumberPress={() => {}}
        onBackspace={() => {}}
        onClose={() => {}}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  loadCalcs: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -20,
  },
  loadCalcsText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 6,
  },
  boltIcon: {
    width: 24,
    height: 32,
    tintColor: "#B92011",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  smallDropdown: {
    width: 160,
    marginRight: 12,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  conductorSizingColumn: {
    paddingTop: 20, // Align with wrapped "Tie-In Breaker Rating (Amps)" label
  },
  backfeedContainer: {
    alignItems: "center",
    marginVertical: 0,
    marginTop: -20,
  },
  backfeedLabel: {
    color: "#FFF",
    fontSize: 24,
    marginBottom: 4,
  },
  backfeedResult: {
    color: "#FD7332",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subPanelButton: {
    marginTop: 0,
    marginBottom: 8,
  },
  feederLocationContainer: {
    marginBottom: 20,
  },
  feederLocationLabel: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  feederLocationButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  feederButton: {
    marginVertical: 0,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 4,
  },
});
