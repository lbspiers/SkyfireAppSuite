// src/components/sections/InlineHoymilesStringing.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import Button from "../Button";
import SystemButton from "../Button/SystemButton";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface HoymilesStringingProps {
  // Hoymiles specs
  panelRatio: number; // e.g., 4 for 4:1 ratio
  maxMicrosPerBranch: number; // e.g., 4 micros max per branch
  maxPanelsPerMicro: number; // e.g., 4 panels max per micro (same as ratio)
  totalMicroinverters: number; // e.g., 7 total micros
  totalSolarPanels: number; // e.g., 26 total panels

  // Individual microinverter panel quantities (up to 25 micros)
  micro1Panels?: string;
  micro2Panels?: string;
  micro3Panels?: string;
  micro4Panels?: string;
  micro5Panels?: string;
  micro6Panels?: string;
  micro7Panels?: string;
  micro8Panels?: string;
  micro9Panels?: string;
  micro10Panels?: string;
  micro11Panels?: string;
  micro12Panels?: string;
  micro13Panels?: string;
  micro14Panels?: string;
  micro15Panels?: string;
  micro16Panels?: string;
  micro17Panels?: string;
  micro18Panels?: string;
  micro19Panels?: string;
  micro20Panels?: string;
  micro21Panels?: string;
  micro22Panels?: string;
  micro23Panels?: string;
  micro24Panels?: string;
  micro25Panels?: string;
  onMicroPanelChange: (field: string, value: string) => void;

  // New/existing toggle
  inverterIsNew?: boolean;

  // Callback to update total microinverters when user adds/removes
  onTotalMicroinvertersChange?: (newTotal: number) => void;
}

const InlineHoymilesStringing: React.FC<HoymilesStringingProps> = ({
  panelRatio,
  maxMicrosPerBranch,
  maxPanelsPerMicro,
  totalMicroinverters,
  totalSolarPanels,
  micro1Panels = "",
  micro2Panels = "",
  micro3Panels = "",
  micro4Panels = "",
  micro5Panels = "",
  micro6Panels = "",
  micro7Panels = "",
  micro8Panels = "",
  micro9Panels = "",
  micro10Panels = "",
  micro11Panels = "",
  micro12Panels = "",
  micro13Panels = "",
  micro14Panels = "",
  micro15Panels = "",
  micro16Panels = "",
  micro17Panels = "",
  micro18Panels = "",
  micro19Panels = "",
  micro20Panels = "",
  micro21Panels = "",
  micro22Panels = "",
  micro23Panels = "",
  micro24Panels = "",
  micro25Panels = "",
  onMicroPanelChange,
  inverterIsNew = true,
  onTotalMicroinvertersChange,
}) => {
  // Track per-microinverter new/existing toggle states
  const [microToggles, setMicroToggles] = useState<Record<number, boolean>>({});

  // Sync toggle states with inverterIsNew prop
  useEffect(() => {
    const initialToggles: Record<number, boolean> = {};
    for (let i = 1; i <= totalMicroinverters; i++) {
      initialToggles[i] = inverterIsNew;
    }
    setMicroToggles(initialToggles);
  }, [inverterIsNew, totalMicroinverters]);

  // Create array of microinverter panel values for easy access
  const microPanelValues = [
    micro1Panels, micro2Panels, micro3Panels, micro4Panels, micro5Panels,
    micro6Panels, micro7Panels, micro8Panels, micro9Panels, micro10Panels,
    micro11Panels, micro12Panels, micro13Panels, micro14Panels, micro15Panels,
    micro16Panels, micro17Panels, micro18Panels, micro19Panels, micro20Panels,
    micro21Panels, micro22Panels, micro23Panels, micro24Panels, micro25Panels,
  ];

  // Calculate total panels assigned
  const totalPanelsAssigned = microPanelValues.reduce((sum, value) => {
    const numValue = parseInt(value) || 0;
    return sum + numValue;
  }, 0);

  const panelsRemaining = totalSolarPanels - totalPanelsAssigned;

  // Handler for TextInput changes
  const handlePanelChange = (microIndex: number, value: string) => {
    const fieldName = `micro${microIndex}Panels`;
    onMicroPanelChange(fieldName, value);
  };

  // Organize microinverters into branches
  const getBranchStructure = () => {
    const branches: number[][] = [];
    let currentBranch: number[] = [];

    for (let i = 1; i <= totalMicroinverters; i++) {
      currentBranch.push(i);

      // Start new branch if we hit the max micros per branch
      if (currentBranch.length === maxMicrosPerBranch && i < totalMicroinverters) {
        branches.push(currentBranch);
        currentBranch = [];
      }
    }

    // Add remaining micros as final branch
    if (currentBranch.length > 0) {
      branches.push(currentBranch);
    }

    return branches;
  };

  const branches = getBranchStructure();

  // Handler for adding a new microinverter
  const handleAddMicroinverter = () => {
    if (!onTotalMicroinvertersChange) return;

    // Check if we've hit the maximum (25 micros)
    if (totalMicroinverters >= 25) {
      console.log('[Add Micro] Already at maximum of 25 microinverters');
      return;
    }

    // Calculate new total
    const newTotal = totalMicroinverters + 1;

    console.log('[Add Micro] Adding microinverter:', {
      currentTotal: totalMicroinverters,
      newTotal,
      maxMicrosPerBranch,
    });

    // Call parent callback to update total
    onTotalMicroinvertersChange(newTotal);

    // Initialize the new microinverter with default panels (up to ratio, but not exceeding remaining panels)
    const newMicroIndex = newTotal;
    const defaultPanels = Math.min(panelRatio, panelsRemaining);
    const fieldName = `micro${newMicroIndex}Panels`;

    console.log(`[Add Micro] Initializing Micro ${newMicroIndex} with ${defaultPanels} panels`);
    onMicroPanelChange(fieldName, String(defaultPanels));
  };

  const renderMicroinverterRow = (microIndex: number) => {
    const fieldName = `micro${microIndex}Panels`;
    const value = microPanelValues[microIndex - 1] || ""; // Array is 0-indexed, microIndex is 1-indexed
    // Only show value if it's not empty and not "0" - otherwise use empty string for placeholder
    const displayValue = (value && value !== "" && value !== "0") ? value : "";
    const isNew = microToggles[microIndex] ?? inverterIsNew;

    return (
      <View key={microIndex} style={styles.microRow}>
        {/* Column 1: Micro Label */}
        <View style={styles.column1}>
          <Text style={styles.microLabel}>Micro {microIndex}</Text>
        </View>

        {/* Column 2: New/Existing Buttons */}
        <View style={styles.column2}>
          <View style={styles.toggleButtonContainer}>
            <Button
              title="New"
              onPress={() => {
                setMicroToggles(prev => ({ ...prev, [microIndex]: true }));
              }}
              selected={isNew}
              style={styles.toggleButton}
              textStyle={styles.buttonText}
              height={moderateScale(38)}
            />

            <View style={styles.toggleButtonGap} />

            <Button
              title="Existing"
              onPress={() => {
                setMicroToggles(prev => ({ ...prev, [microIndex]: false }));
              }}
              selected={!isNew}
              style={styles.toggleButton}
              textStyle={styles.buttonText}
              height={moderateScale(38)}
            />
          </View>
        </View>

        {/* Column 3: Panel Qty Input */}
        <View style={styles.column3}>
          <TextInput
            style={styles.inputField}
            value={displayValue}
            onChangeText={(text) => handlePanelChange(microIndex, text)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#bbbbbb"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* System Info - Shows remaining panels and specs */}
      <View style={styles.infoSection}>
        <Text
          style={[
            styles.infoLabel,
            panelsRemaining > 0 ? styles.infoLabel : panelsRemaining < 0 ? styles.errorText : styles.successText
          ]}
        >
          Solar Panels Remaining: {panelsRemaining >= 0 ? panelsRemaining : 0}
        </Text>
        <Text style={styles.infoLabel}>
          Micro/Panel Ratio: {panelRatio}:1
        </Text>
        <Text style={styles.infoLabel}>
          Max Panels Per Micro: {maxPanelsPerMicro}
        </Text>
        <Text style={styles.infoLabel}>
          Max Panels Per Branch: {maxMicrosPerBranch * maxPanelsPerMicro}
        </Text>
        {panelsRemaining < 0 && (
          <Text style={[styles.infoLabel, styles.errorText]}>
            Excess: {Math.abs(panelsRemaining)} panels over limit
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {branches.map((branchMicros, branchIndex) => (
          <View key={branchIndex} style={branchIndex > 0 ? styles.branchContainer : undefined}>
            {/* Branch Chain Label with Panel Qty */}
            <View style={styles.branchHeaderRow}>
              <View style={styles.branchLabelContainer}>
                <Text style={styles.branchLabel}>Branch Chain {branchIndex + 1}</Text>
              </View>
              <View style={styles.panelQtyContainer}>
                <Text style={styles.headerText}>Panel Qty</Text>
              </View>
            </View>

            {/* Grey divider line below branch label */}
            <View style={styles.branchDivider} />

            {/* Microinverters in this branch */}
            {branchMicros.map((microIndex) => renderMicroinverterRow(microIndex))}
          </View>
        ))}
      </ScrollView>

      {/* Add Microinverter Button - Pinned at bottom */}
      {onTotalMicroinvertersChange && totalMicroinverters < 25 && (
        <View style={styles.addButtonContainer}>
          <SystemButton
            label="Add Microinverter"
            onPress={handleAddMicroinverter}
            scaleOverride={0.85}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 0,
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 16,
    paddingHorizontal: moderateScale(10),
  },
  infoLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(18),
    marginBottom: verticalScale(5),
  },
  errorText: {
    color: "#EF4444",
  },
  successText: {
    color: "#10B981",
  },
  addButtonContainer: {
    width: "100%",
    paddingHorizontal: moderateScale(10),
    marginBottom: verticalScale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: verticalScale(4),
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  stackedHeader: {
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  branchContainer: {
    marginTop: moderateScale(10),
  },
  branchLabelRow: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(10),
    marginTop: verticalScale(4),
  },
  branchHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(2),
    paddingHorizontal: moderateScale(10),
    marginBottom: verticalScale(3),
  },
  branchLabelContainer: {
    flex: 1,
  },
  panelQtyContainer: {
    width: "31%", // Match column3 width
    alignItems: "center",
  },
  branchLabel: {
    color: "#FD7332",
    fontSize: moderateScale(18),
    fontWeight: "700",
  },
  microRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(2),
    paddingHorizontal: moderateScale(10),
    justifyContent: "space-between",
  },
  branchDivider: {
    height: 1,
    backgroundColor: "#555555",
    marginTop: 0,
    marginBottom: verticalScale(8),
    marginHorizontal: moderateScale(10),
  },
  // Column layout: Micro (23%) | New/Existing (46%) | Panel Qty (31%)
  column1: {
    width: "23%",
    justifyContent: "center",
  },
  column2: {
    width: "46%",
    justifyContent: "center",
    alignItems: "center",
  },
  column3: {
    width: "31%",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
  },
  toggleButtonGap: {
    width: 1,
  },
  microLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  toggleButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: moderateScale(14),
  },
  inputField: {
    backgroundColor: "#1a2942",
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: "#888888",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    minWidth: moderateScale(60),
    color: "#ffffff",
    fontSize: moderateScale(18),
    fontWeight: "400",
    textAlign: "center",
  },
});

export default InlineHoymilesStringing;
