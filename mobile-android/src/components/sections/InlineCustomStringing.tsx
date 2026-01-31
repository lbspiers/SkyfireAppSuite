// src/components/sections/InlineCustomStringing.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import NumericKeypad from "../NumericKeypad";
import Button from "../Button";
import { BLUE_2C_BT, ORANGE_TB } from "../../styles/gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface InverterData {
  makeModel: string;
  max_strings_branches: number;
}

interface InlineCustomStringingProps {
  inverterData: InverterData;
  solarPanelQuantity: number;
  // Simple field values - just like solar panel quantity
  branchString1: string;
  branchString2: string;
  branchString3: string;
  branchString4: string;
  branchString5: string;
  branchString6: string;
  // Simple onChange callback
  onBranchStringChange: (field: string, value: string) => void;
  // New/existing toggles
  inverterIsNew?: boolean;
  // Labels for customization (microinverter vs inverter)
  branchLabelSingular?: string; // "MPPT" or "Branch"
  branchLabelPlural?: string; // "MPPTs" or "Branch Chains"
  quantityLabel?: string; // "Panel Qty" or "Micro Qty"
}

const InlineCustomStringing: React.FC<InlineCustomStringingProps> = ({
  inverterData,
  solarPanelQuantity,
  branchString1,
  branchString2,
  branchString3,
  branchString4,
  branchString5,
  branchString6,
  onBranchStringChange,
  inverterIsNew = true,
  branchLabelSingular = "MPPT",
  branchLabelPlural = "MPPT",
  quantityLabel = "Panel Qty",
}) => {
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState<string>("");
  const [keypadVisible, setKeypadVisible] = useState(false);

  // Track per-MPPT new/existing toggle states (all synced with inverterIsNew)
  const [mpptToggles, setMpptToggles] = useState<Record<number, boolean>>({});

  // Sync toggle states with inverterIsNew prop on mount and when it changes
  useEffect(() => {
    const maxMPPTs = inverterData.max_strings_branches || 6;
    const initialToggles: Record<number, boolean> = {};
    for (let i = 1; i <= maxMPPTs; i++) {
      initialToggles[i] = inverterIsNew;
    }
    setMpptToggles(initialToggles);
  }, [inverterIsNew, inverterData.max_strings_branches]);

  // Calculate total panels from branch strings
  const totalPanels =
    (parseInt(branchString1) || 0) +
    (parseInt(branchString2) || 0) +
    (parseInt(branchString3) || 0) +
    (parseInt(branchString4) || 0) +
    (parseInt(branchString5) || 0) +
    (parseInt(branchString6) || 0);

  const panelsRemaining = solarPanelQuantity - totalPanels;

  const handleMPPTValueChange = (mpptIndex: number, value: string) => {
    const fieldMap: Record<number, string> = {
      1: 'branchString1',
      2: 'branchString2',
      3: 'branchString3',
      4: 'branchString4',
      5: 'branchString5',
      6: 'branchString6',
    };

    const fieldName = fieldMap[mpptIndex];
    if (fieldName) {
      onBranchStringChange(fieldName, value);
    }
  };

  const openKeypad = (mpptIndex: number, currentValue: string) => {
    setActiveInput(`mppt${mpptIndex}`);
    setKeypadValue(currentValue);
    setKeypadVisible(true);
  };

  const handleKeypadNumber = (num: string) => {
    setKeypadValue((prev) => prev + num);
  };

  const handleKeypadBackspace = () => {
    setKeypadValue((prev) => prev.slice(0, -1));
  };

  const handleKeypadClose = () => {
    if (activeInput) {
      const mpptIndex = parseInt(activeInput.replace('mppt', ''));
      handleMPPTValueChange(mpptIndex, keypadValue);
    }
    setKeypadVisible(false);
    setActiveInput(null);
    setKeypadValue("");
  };

  // Map branch string values to array for rendering
  const branchStrings = [
    branchString1,
    branchString2,
    branchString3,
    branchString4,
    branchString5,
    branchString6,
  ];

  // Render header row with column labels
  const renderHeaderRow = () => {
    return (
      <View style={styles.headerRow}>
        {/* Column 1: Branch label (MPPT or Branch Chains) */}
        <View style={styles.column1}>
          <Text style={styles.headerText}>{branchLabelPlural}</Text>
        </View>

        {/* Columns 2+3: New/Existing (combined header) */}
        <View style={styles.combinedColumn23}>
          <Text style={styles.headerText}>New/Existing</Text>
        </View>

        {/* Column 4: Strings */}
        <View style={styles.column4}>
          <Text style={styles.headerText}>Strings</Text>
        </View>

        {/* Column 5: Panel Qty / Micro Qty */}
        <View style={styles.column5}>
          <View style={styles.stackedHeader}>
            {quantityLabel.split(' ').map((word, idx) => (
              <Text key={idx} style={styles.headerText}>{word}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMPPTRow = (mpptIndex: number) => {
    const value = branchStrings[mpptIndex - 1] || "";
    const displayValue = (!value || value === "" || value === "0" || value === "undefined") ? "" : value;
    const isActive = activeInput === `mppt${mpptIndex}`;
    const isNew = mpptToggles[mpptIndex] ?? inverterIsNew;

    return (
      <View key={mpptIndex} style={styles.mpptRow}>
        {/* Column 1: Branch Label */}
        <View style={styles.column1}>
          <Text style={styles.mpptLabel}>{branchLabelSingular} {mpptIndex}</Text>
        </View>

        {/* Columns 2+3: New/Existing Buttons (combined, 1px gap) */}
        <View style={styles.combinedColumn23}>
          <View style={styles.toggleButtonContainer}>
            <Button
              title="New"
              onPress={() => {
                setMpptToggles(prev => ({ ...prev, [mpptIndex]: true }));
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
                setMpptToggles(prev => ({ ...prev, [mpptIndex]: false }));
              }}
              selected={!isNew}
              style={styles.toggleButton}
              textStyle={styles.buttonText}
              height={moderateScale(38)}
            />
          </View>
        </View>

        {/* Column 4: Strings Dropdown */}
        <View style={styles.column4}>
          <View style={styles.stringsDropdown}>
            <Text style={styles.dropdownText}>1</Text>
          </View>
        </View>

        {/* Column 5: Panel Qty Input */}
        <View style={styles.column5}>
          <TouchableOpacity
            style={[
              styles.inputField,
              isActive && styles.inputFieldActive
            ]}
            onPress={() => openKeypad(mpptIndex, value)}
          >
            <Text style={displayValue ? styles.inputText : styles.placeholderText}>
              {displayValue || "0"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMPPTRows = () => {
    const rows = [];
    const maxMPPTs = inverterData.max_strings_branches;

    for (let i = 1; i <= maxMPPTs; i++) {
      rows.push(renderMPPTRow(i));
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      {/* System Info - Shows remaining panels */}
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
          Max String: 0
        </Text>
        <Text style={styles.infoLabel}>
          Min String: 0
        </Text>
        {panelsRemaining < 0 && (
          <Text style={[styles.infoLabel, styles.errorText]}>
            Excess: {Math.abs(panelsRemaining)} panels over limit
          </Text>
        )}
      </View>

      {/* Header Row */}
      {renderHeaderRow()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderMPPTRows()}
      </ScrollView>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={keypadValue}
        onNumberPress={handleKeypadNumber}
        onBackspace={handleKeypadBackspace}
        onClose={handleKeypadClose}
        title={activeInput ? `${activeInput.toUpperCase()} Panels` : "Panels"}
      />
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
  mpptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    marginBottom: verticalScale(2),
    paddingHorizontal: moderateScale(10),
    justifyContent: "space-between",
  },
  // Column layout: MPPT (18%) | New/Existing (36%) | Strings (18%) | Panel Qty (18%)
  column1: {
    width: "18%",
    justifyContent: "center",
  },
  combinedColumn23: {
    width: "36%", // Double width for combined New/Existing
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
  column4: {
    width: "18%",
    justifyContent: "center",
    alignItems: "center",
  },
  column5: {
    width: "18%",
    justifyContent: "center",
    alignItems: "center",
  },
  mpptLabel: {
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
  stringsDropdown: {
    backgroundColor: "#1a2942",
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: "#888888",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    minWidth: moderateScale(60),
    alignItems: "center",
  },
  dropdownText: {
    color: "#ffffff",
    fontSize: moderateScale(18),
    fontWeight: "400",
  },
  inputField: {
    backgroundColor: "#1a2942",
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: "#888888",
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    minWidth: moderateScale(60),
    alignItems: "center",
  },
  inputFieldActive: {
    borderColor: "#FD7332",
  },
  inputText: {
    color: "#ffffff",
    fontSize: moderateScale(18),
    fontWeight: "400",
  },
  placeholderText: {
    color: "#bbbbbb",
    fontSize: moderateScale(18),
    fontWeight: "400",
  },
});

export default InlineCustomStringing;
