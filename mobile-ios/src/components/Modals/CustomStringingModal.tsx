// src/components/Modals/CustomStringingModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import TextInput from "../TextInput";
import NumericKeypad from "../NumericKeypad";
import {
  StringingConfiguration,
  MPPTConfiguration,
} from "../../screens/Project/SystemDetails/hooks/useEquipmentDetails";

const redX = require("../../assets/Images/icons/X_Icon_Red_BB92011.png");
const saveIcon = require("../../assets/Images/icons/check_green.png");

interface CustomStringingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (configuration: StringingConfiguration) => void;
  totalSolarPanels: number;
  maxStringsBranches?: number;
  inverterModel?: string;
  systemLabel?: string;
  initialConfiguration?: Partial<StringingConfiguration>;
}

const CustomStringingModal: React.FC<CustomStringingModalProps> = ({
  visible,
  onClose,
  onSave,
  totalSolarPanels,
  maxStringsBranches = 12, // Default fallback
  inverterModel = "Selected Inverter",
  systemLabel = "System 1",
  initialConfiguration,
}) => {
  const [configuration, setConfiguration] = useState<StringingConfiguration>({
    mppt1: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    mppt2: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    mppt3: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    mppt4: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    mppt5: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    mppt6: { strings: 0, panelsPerString: 0, totalPanels: 0 },
    totalMPPTs: 6,
    totalPanels: 0,
  });

  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState<string>("");
  const [keypadVisible, setKeypadVisible] = useState(false);

  // Initialize configuration from props or calculate auto distribution
  useEffect(() => {
    if (initialConfiguration) {
      setConfiguration((prev) => ({ ...prev, ...initialConfiguration }));
    } else {
      // Auto-distribute panels evenly across available MPPTs
      calculateAutoDistribution();
    }
  }, [totalSolarPanels, initialConfiguration]);

  const calculateAutoDistribution = useCallback(() => {
    if (totalSolarPanels <= 0) return;

    // Simple auto-distribution: try to use first few MPPTs evenly
    const activeMPPTs = Math.min(6, Math.ceil(totalSolarPanels / 10)); // Use up to 6 MPPTs
    const baseStrings = Math.floor(totalSolarPanels / activeMPPTs / 10) + 1; // Base strings per MPPT
    const panelsPerString = Math.floor(
      totalSolarPanels / (baseStrings * activeMPPTs)
    );
    const remainder = totalSolarPanels % (baseStrings * activeMPPTs);

    const newConfig: StringingConfiguration = {
      mppt1: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt2: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt3: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt4: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt5: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt6: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      totalMPPTs: activeMPPTs,
      totalPanels: 0,
    };

    // Distribute across active MPPTs
    let distributed = 0;
    for (let i = 1; i <= activeMPPTs; i++) {
      const mpptKey = `mppt${i}` as keyof StringingConfiguration;
      if (typeof newConfig[mpptKey] === "object") {
        const mpptConfig = newConfig[mpptKey] as MPPTConfiguration;
        mpptConfig.strings = baseStrings;
        mpptConfig.panelsPerString = panelsPerString;

        // Add remainder to first few MPPTs
        if (i <= remainder) {
          mpptConfig.panelsPerString += 1;
        }

        mpptConfig.totalPanels =
          mpptConfig.strings * mpptConfig.panelsPerString;
        distributed += mpptConfig.totalPanels;
      }
    }

    newConfig.totalPanels = distributed;
    setConfiguration(newConfig);
  }, [totalSolarPanels]);

  const updateMPPTValue = (
    mpptIndex: number,
    field: "strings" | "panelsPerString",
    value: number
  ) => {
    setConfiguration((prev) => {
      const mpptKey = `mppt${mpptIndex}` as keyof StringingConfiguration;
      const mpptConfig = { ...(prev[mpptKey] as MPPTConfiguration) };

      mpptConfig[field] = value;
      mpptConfig.totalPanels = mpptConfig.strings * mpptConfig.panelsPerString;

      const newConfig = { ...prev, [mpptKey]: mpptConfig };

      // Recalculate total panels
      newConfig.totalPanels = Object.keys(newConfig)
        .filter((key) => key.startsWith("mppt") && key !== "totalMPPTs")
        .reduce((total, key) => {
          const mppt = newConfig[
            key as keyof StringingConfiguration
          ] as MPPTConfiguration;
          return total + mppt.totalPanels;
        }, 0);

      return newConfig;
    });
  };

  const handleInputPress = (
    mpptIndex: number,
    field: "strings" | "panelsPerString"
  ) => {
    const inputKey = `mppt${mpptIndex}_${field}`;
    setActiveInput(inputKey);

    const mpptKey = `mppt${mpptIndex}` as keyof StringingConfiguration;
    const currentValue = (configuration[mpptKey] as MPPTConfiguration)[field];
    setKeypadValue(currentValue.toString());
    setKeypadVisible(true);
  };

  const handleKeypadClose = () => {
    if (activeInput) {
      const [mpptStr, field] = activeInput.split("_");
      const mpptIndex = parseInt(mpptStr.replace("mppt", ""));
      const value = parseInt(keypadValue) || 0;

      updateMPPTValue(mpptIndex, field as "strings" | "panelsPerString", value);
    }

    setActiveInput(null);
    setKeypadValue("");
    setKeypadVisible(false);
  };

  const handleClear = () => {
    // Clear all MPPT configurations and close modal
    setConfiguration({
      mppt1: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt2: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt3: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt4: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt5: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      mppt6: { strings: 0, panelsPerString: 0, totalPanels: 0 },
      totalMPPTs: 6,
      totalPanels: 0,
    });

    // Close modal and revert to auto-stringing note
    onClose();
  };

  const handleSave = () => {
    // Validation
    if (configuration.totalPanels !== totalSolarPanels) {
      Alert.alert(
        "Panel Count Mismatch",
        `Total configured panels (${configuration.totalPanels}) must equal solar panel quantity (${totalSolarPanels}). Please adjust your configuration.`,
        [{ text: "OK" }]
      );
      return;
    }

    // Check string limits
    const totalStrings = Object.keys(configuration)
      .filter((key) => key.startsWith("mppt") && key !== "totalMPPTs")
      .reduce((total, key) => {
        const mppt = configuration[
          key as keyof StringingConfiguration
        ] as MPPTConfiguration;
        return total + mppt.strings;
      }, 0);

    if (totalStrings > maxStringsBranches) {
      Alert.alert(
        "String Limit Exceeded",
        `Total strings (${totalStrings}) exceeds inverter maximum (${maxStringsBranches}). Please reduce string count.`,
        [{ text: "OK" }]
      );
      return;
    }

    onSave(configuration);
    onClose();
  };

  const renderMPPTRow = (mpptIndex: number) => {
    const mpptKey = `mppt${mpptIndex}` as keyof StringingConfiguration;
    const mpptConfig = configuration[mpptKey] as MPPTConfiguration;

    return (
      <View key={mpptIndex} style={styles.mpptRow}>
        <Text style={styles.mpptLabel}>MPPT {mpptIndex}</Text>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => handleInputPress(mpptIndex, "strings")}
        >
          <Text style={styles.inputValue}>{mpptConfig.strings}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => handleInputPress(mpptIndex, "panelsPerString")}
        >
          <Text style={styles.inputValue}>{mpptConfig.panelsPerString}</Text>
        </TouchableOpacity>

        <Text style={styles.totalValue}>{mpptConfig.totalPanels}</Text>
      </View>
    );
  };

  const panelCountMatch = configuration.totalPanels === totalSolarPanels;
  const isValid = panelCountMatch;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Custom Stringing</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Image source={redX} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* System Info - Removed Inverter label */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>
              Solar Panels: {totalSolarPanels}
            </Text>
            <Text style={styles.infoLabel}>
              Max Strings: {maxStringsBranches}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Column Headers */}
            <View style={styles.headerRow}>
              <Text style={styles.columnHeader}>Input</Text>
              <Text style={styles.columnHeader}>Strings</Text>
              <Text style={styles.columnHeader}>Panels/String</Text>
              <Text style={styles.columnHeader}>Total</Text>
            </View>

            {/* MPPT Rows */}
            {[1, 2, 3, 4, 5, 6].map(renderMPPTRow)}

            {/* Summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TOTAL</Text>
              <Text
                style={[
                  styles.summaryValue,
                  !panelCountMatch && styles.errorText,
                ]}
              >
                {configuration.totalPanels}
              </Text>
            </View>

            {!panelCountMatch && (
              <Text style={styles.warningText}>
                ⚠️ Total panels ({configuration.totalPanels}) must equal{" "}
                {totalSolarPanels}
              </Text>
            )}

            {/* Additional info */}
            <Text style={styles.infoText}>
              💡 Tip: Use "Auto Distribute" to evenly spread panels across MPPTs
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.autoDistributeButton}
              onPress={calculateAutoDistribution}
            >
              <Text style={styles.autoDistributeButtonText}>
                Auto Distribute
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Image source={saveIcon} style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={keypadValue}
        onNumberPress={(num) =>
          setKeypadValue((prev) => (prev === "0" ? num : prev + num))
        }
        onBackspace={() => setKeypadValue((prev) => prev.slice(0, -1))}
        onClose={handleKeypadClose}
        title={
          activeInput
            ? `${activeInput.replace("_", " ").toUpperCase()}`
            : "Value"
        }
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  clearButton: {
    backgroundColor: "transparent",
    padding: 0,
  },
  clearButtonText: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  infoSection: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: 8,
  },
  columnHeader: {
    color: "#FD7332",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  mpptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  mpptLabel: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  inputValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  summaryLabel: {
    color: "#FD7332",
    fontSize: 18,
    fontWeight: "bold",
  },
  summaryValue: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF6B6B",
  },
  warningText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  infoText: {
    color: "#A0A0A0",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  autoDistributeButton: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  autoDistributeButtonText: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#FD7332",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "rgba(253, 115, 50, 0.5)",
  },
  saveIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CustomStringingModal;
