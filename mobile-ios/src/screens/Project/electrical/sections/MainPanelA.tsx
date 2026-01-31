// src/screens/Project/electrical/sections/MainPanelA.tsx

import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import Dropdown from "../../../../components/Dropdown";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";
// import SystemSpecsModal from "../../../../components/Modals/SystemSpecsModal"; // System Specs moved to POI sections
import NumericKeypad from "../../../../components/NumericKeypad";
import SystemButton from "../../../../components/Button/SystemButton";
import DerateButton from "../../../../components/Button/DerateButton";
import { usePhotoCapture } from "../../../../context/PhotoCaptureContext";
import { moderateScale } from "../../../../utils/responsive";

import {
  BUS_BAR_RATING,
  MAIN_CIRCUIT_BREAKER_RATINGS,
  FEEDER_LOCATIONS,
  DEFAULT_ELECTRICAL_PHOTO_TAGS,
} from "../../../../utils/constants";

const boltIcon = require("../../../../assets/Images/icons/tab3.png");

export interface MainPanelAProps {
  type: "new" | "existing" | null;
  onTypeChange: (v: "new" | "existing") => void;

  busAmps: string;
  onBusAmpsChange: (v: string) => void;

  mainBreakerAmps: string;
  onMainBreakerChange: (v: string) => void;

  feederLocation: string;
  onFeederLocationChange: (v: string) => void;

  /** Parent tells us whether Sub-Panel B is already shown */
  subPanelBVisible: boolean;
  /** Call this to ask parent to show Sub-Panel B */
  onSubPanelBPress?: () => void;

  /** Derate toggle state and handler */
  derated?: boolean | null;
  onDerateChange?: (derated: boolean) => void;

  /** Allowable backfeed property */
  allowableBackfeed?: any;

  /** MPA Bus Bar existing state handler */
  onMpaBusBarExistingChange?: (existing: boolean) => void;

  /** MPA Main Circuit Breaker existing state handler */
  onMpaMainCircuitBreakerExistingChange?: (existing: boolean) => void;

  errors?: {
    busAmps?: string;
    mainBreaker?: string;
    feederLocation?: string;
  };

  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}

export default function MainPanelA({
  type,
  onTypeChange,
  busAmps,
  onBusAmpsChange,
  mainBreakerAmps,
  onMainBreakerChange,
  feederLocation,
  onFeederLocationChange,
  subPanelBVisible,
  onSubPanelBPress,
  derated,
  onDerateChange,
  allowableBackfeed,
  onMpaBusBarExistingChange,
  onMpaMainCircuitBreakerExistingChange,
  errors = {},
  projectId = "",
  companyId = "",
  onOpenGallery,
}: MainPanelAProps) {
  const navigation = useNavigation<any>();
  const [showClear, setShowClear] = useState(false);
  // const [showSystemSpecs, setShowSystemSpecs] = useState(false); // System Specs moved to POI sections
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [panelNote, setPanelNote] = useState<string>("");

  const sectionLabel = "Main Panel (A)";

  // Check if MLO is selected to hide derate button
  const isMLOSelected = mainBreakerAmps.toLowerCase().trim() === "mlo";

  // When MLO is selected and Derate is active, deactivate Derate
  useEffect(() => {
    if (isMLOSelected && derated) {
      console.log("[MainPanelA] MLO selected with Derate active - deactivating Derate");
      onDerateChange?.(false);
      onMpaMainCircuitBreakerExistingChange?.(true);
    }
  }, [mainBreakerAmps]); // Only trigger when mainBreakerAmps changes

  // Ensure default behavior: always send True/True on mount unless explicitly changed
  useEffect(() => {
    // Always default to existing (true) for both fields on component mount
    // This ensures the database gets the default values immediately
    console.log(
      "[MainPanelA] Setting default existing values: bus=true, breaker=true"
    );
    onMpaBusBarExistingChange?.(true);
    onMpaMainCircuitBreakerExistingChange?.(true);
  }, []); // Only run on mount - sends defaults immediately

  // Prepend "###" placeholder into the two short dropdowns
  const busOptions = [{ label: "", value: "" }, ...BUS_BAR_RATING];
  const breakerOptions = [
    { label: "", value: "" },
    ...MAIN_CIRCUIT_BREAKER_RATINGS,
  ];

  const isDirty =
    type !== null ||
    !!busAmps ||
    !!mainBreakerAmps ||
    !!feederLocation ||
    !!derated;
  const isRequiredComplete =
    !!busAmps?.trim() && !!mainBreakerAmps?.trim() && !!feederLocation?.trim();

  // Helper function to save current toggle state - called when other inputs change
  const saveCurrentToggleState = () => {
    if (derated) {
      // If derated, maintain derate logic: bus=true, breaker=false
      console.log(
        "[MainPanelA] saveCurrentToggleState: derated=true, setting bus=true, breaker=false"
      );
      onMpaBusBarExistingChange?.(true);
      onMpaMainCircuitBreakerExistingChange?.(false);
    } else {
      // Follow current toggle state - treat null as "existing" (default)
      const existingValue = type !== "new"; // null !== "new" = true, "existing" !== "new" = true, "new" !== "new" = false
      console.log(
        `[MainPanelA] saveCurrentToggleState: derated=false, type=${type}, setting bus=${existingValue}, breaker=${existingValue}`
      );
      onMpaBusBarExistingChange?.(existingValue);
      onMpaMainCircuitBreakerExistingChange?.(existingValue);
    }
  };

  // Save the current toggle selection whenever the component becomes dirty (has any data)
  useEffect(() => {
    if (isDirty) {
      saveCurrentToggleState();
    }
  }, [isDirty]); // Run whenever isDirty changes

  // Custom handler for MPU toggle that manages both type and MPA fields
  const handleMpuToggle = (isNew: boolean) => {
    const newType = isNew ? "new" : "existing";
    console.log(`[MainPanelA] MPU toggle: ${newType}`);
    onTypeChange(newType);

    // If switching to MPU (new), disable derate
    if (isNew) {
      onDerateChange?.(false);
    }

    // For MPU: when "new" (MPU) -> both bus and breaker are new (false)
    // When "existing" -> both bus and breaker are existing (true)
    const existingValue = !isNew;
    console.log(
      `[MainPanelA] Setting MPA fields: bus=${existingValue}, breaker=${existingValue}`
    );
    onMpaBusBarExistingChange?.(existingValue);
    onMpaMainCircuitBreakerExistingChange?.(existingValue);
  };

  // Custom handler for derate toggle that forces MPU to existing and sets correct MPA fields
  const handleDerateToggle = (newDerateValue: boolean) => {
    console.log(`[MainPanelA] Derate toggle: ${newDerateValue}`);
    onDerateChange?.(newDerateValue);

    if (newDerateValue) {
      // When derate is enabled: force MPU to "Existing" and set bus=true, breaker=false
      onTypeChange("existing");
      console.log(
        "[MainPanelA] Derate enabled: Setting bus=true, breaker=false"
      );
      onMpaBusBarExistingChange?.(true); // Bus is existing
      onMpaMainCircuitBreakerExistingChange?.(false); // Main breaker is new (needs replacement)
    } else {
      // When derate is disabled: set breaker existing to true and change to MLO
      console.log(
        "[MainPanelA] Derate disabled: Setting breaker=true, mainBreaker=MLO"
      );
      onMpaMainCircuitBreakerExistingChange?.(true); // Set breaker existing to true
      onMainBreakerChange("mlo"); // Set main circuit breaker to MLO

      // Follow the current MPU toggle state for bus bar
      const currentlyNew = type === "new";
      const existingValue = !currentlyNew;
      onMpaBusBarExistingChange?.(existingValue);
    }
  };

  const clearAll = () => {
    onTypeChange("existing");
    onBusAmpsChange("");
    onMainBreakerChange("");
    onFeederLocationChange("");
    onDerateChange?.(false);
    // When clearing, default to existing (true, true)
    onMpaBusBarExistingChange?.(true);
    onMpaMainCircuitBreakerExistingChange?.(true);
  };

  // backfeed calculation (1.2× bus − breaker), floored at 0
  const busValue = parseFloat(busAmps) || 0;
  // If MLO is selected, use bus amps as the breaker value
  let breakerValue: number;
  const lowerMainBreaker = mainBreakerAmps.toLowerCase().trim();
  if (lowerMainBreaker === "mlo" || lowerMainBreaker === "") {
    breakerValue = busValue; // Use bus amps when MLO
  } else {
    breakerValue = parseFloat(mainBreakerAmps) || 0;
  }
  const rawBackfeed = busValue * 1.2 - breakerValue;
  const backfeedValue = rawBackfeed > 0 ? Math.round(rawBackfeed) : 0;

  return (
    <>
      <CollapsibleSection
        title={sectionLabel}
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
        <View style={styles.sectionContent}>
          {/* Top row: New/Existing + Load Calcs */}
          <View style={styles.topRow}>
            <NewExistingToggle
              isNew={type === "new"}
              onToggle={handleMpuToggle}
              onTrashPress={() => setShowClear(true)}
              newLabel="MPU"
              existingLabel="Existing"
            />
            {/* Load Calcs - Navigate to Load Calculations Screen */}
            <TouchableOpacity
              style={styles.loadCalcs}
              onPress={() => navigation.navigate("LoadCalculations", {
                panelType: "Main Panel A",
                projectId,
                companyId
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.loadCalcsText}>Load Calcs</Text>
              <Image source={boltIcon} style={styles.boltIcon} />
            </TouchableOpacity>
          </View>

          <ConfirmClearModal
            visible={showClear}
            sectionTitle="Main Panel (A)"
            onConfirm={() => {
              clearAll();
              setShowClear(false);
            }}
            onCancel={() => setShowClear(false)}
          />

          {/* Bus (Amps) */}
          <View style={styles.fieldRow}>
            <View style={styles.smallDropdown}>
              <Dropdown
                label="Bus (Amps)*"
                data={busOptions}
                value={busAmps}
                onChange={(value) => {
                  console.log(`[MainPanelA] Bus amps changed to: ${value}`);
                  onBusAmpsChange(value);
                  saveCurrentToggleState();
                }}
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
                onChange={(value) => {
                  console.log(`[MainPanelA] Main breaker changed to: ${value}`);
                  onMainBreakerChange(value);
                  saveCurrentToggleState();
                }}
                widthPercent={100}
                errorText={errors.mainBreaker}
              />
            </View>
            {/* Hide Derate button when MLO is selected */}
            {!isMLOSelected && (
              <DerateButton
                derated={!!derated}
                onToggle={handleDerateToggle}
              />
            )}
          </View>

          {/* Feeder location */}
          <View style={styles.fieldRow}>
            <Dropdown
              label="Feeder location on Bus Bar"
              data={FEEDER_LOCATIONS}
              value={feederLocation}
              onChange={(value) => {
                onFeederLocationChange(value);
                saveCurrentToggleState();
              }}
              widthPercent={100}
              errorText={errors.feederLocation}
            />
          </View>

          {/* Allowable Backfeed */}
          <View style={styles.backfeedContainer}>
            <View style={styles.backfeedHeader}>
              <Text style={styles.backfeedLabel}>Allowable Backfeed</Text>
              {/* System Specs moved to POI sections */}
              {/* <TouchableOpacity onPress={() => setShowSystemSpecs(true)}>
                <Text style={styles.systemSpecsLink}>System Specs</Text>
              </TouchableOpacity> */}
            </View>
            <Text style={styles.backfeedResult}>{backfeedValue} Amps</Text>
          </View>

          {/* Sub Panel (B) button — shown only when parent says “hidden” */}
          {!subPanelBVisible && (
            <SystemButton
              label="Sub Panel (B)"
              active={false}
              style={styles.subPanelButton}
              onPress={() => onSubPanelBPress?.()}
            />
          )}
        </View>
      </CollapsibleSection>

      {/* Hidden NumericKeypad */}
      <NumericKeypad
        isVisible={false}
        currentValue=""
        onNumberPress={() => {}}
        onBackspace={() => {}}
        onClose={() => {}}
      />

      {/* System Specs Modal - Moved to POI sections */}
      {/* <SystemSpecsModal
        visible={showSystemSpecs}
        onClose={() => setShowSystemSpecs(false)}
        projectId={projectId}
      /> */}
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
    width: moderateScale(180),
    marginRight: 12,
  },
  backfeedContainer: {
    alignItems: "center",
    marginVertical: 0,
    marginTop: -20,
  },
  backfeedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  backfeedLabel: {
    color: "#FFF",
    fontSize: 24,
  },
  systemSpecsLink: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "600",
    textDecorationLine: "underline",
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
});
