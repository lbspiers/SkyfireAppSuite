import React, { useState } from "react";
import { colors } from "../../../../theme/tokens/tokens";
import { View, StyleSheet, Text } from "react-native";
import { colors } from "../../../../theme/tokens/tokens";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import { colors } from "../../../../theme/tokens/tokens";
import Button from "../../../../components/Button";
import { colors } from "../../../../theme/tokens/tokens";
import SystemSwitchConfirmModal from "../../../../components/Modals/SystemSwitchConfirmModal";
import { colors } from "../../../../theme/tokens/tokens";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP as wp,
} from "../../../../utils/responsive";

interface SystemSelectionSectionProps {
  value: "microinverter" | "inverter" | "";
  onChange: (value: "microinverter" | "inverter" | "") => void;
  onSystemSwitch?: () => void;  // Callback for when system is switched
  errors?: { [key: string]: string };
  showAddSolarPanels?: boolean;
  onAddSolarPanels?: () => void;
  systemNumber?: number;
  /** System label for the title (e.g., "System 1", "System 2") */
  systemLabel?: string;
}

const systemTypes = [
  { label: "Microinverter", value: "microinverter" as const },
  { label: "Inverter", value: "inverter" as const },
];

const SystemSelectionSection: React.FC<SystemSelectionSectionProps> = ({
  value,
  onChange,
  onSystemSwitch,
  errors = {},
  showAddSolarPanels = false,
  onAddSolarPanels,
  systemNumber = 1,
  systemLabel = "",
}) => {
  const isDirty = !!value;
  const isRequiredComplete = !!value;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSystem, setPendingSystem] = useState<"microinverter" | "inverter" | "">("");

  const buttonWidth = wp("44%"); // 44% of screen width for each button (with gap)

  // Extract just the number from systemLabel (e.g., "System 1" -> "1")
  const systemNum = systemLabel ? systemLabel.replace(/[^\d]/g, '') : '';
  const titleWithoutNumber = "System Selection";

  return (
    <>
      <CollapsibleSection
        title={titleWithoutNumber}
        systemNumber={systemNum || undefined}
        initiallyExpanded={false}
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
        renderCamera={false}
      >
        <View style={styles.sectionContent}>
          {/* Label */}
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Choose System {systemNumber} Type</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {systemTypes.map((type, i) => (
              <Button
                key={type.value}
                title={type.label}
                onPress={() => {
                  // If switching to a different system and already have one selected, show confirmation
                  if (value && value !== type.value) {
                    setPendingSystem(type.value);
                    setShowConfirmModal(true);
                  } else {
                    // First selection or selecting same system
                    onChange(type.value);
                  }
                }}
                selected={value === type.value}
                width={buttonWidth}
                style={
                  i < systemTypes.length - 1
                    ? { marginRight: moderateScale(10) }
                    : undefined
                }
              />
            ))}
          </View>

          {/* Add Solar Panels Button - centered under system buttons */}
          {showAddSolarPanels && (
            <View style={styles.addSolarPanelsRow}>
              <Button
                title="Add Solar Panels"
                onPress={onAddSolarPanels}
                selected={false}
                width={wp("60%")} // Centered button, slightly wider
                style={styles.addSolarPanelsButton}
              />
            </View>
          )}

          {errors.value ? <Text style={styles.error}>{errors.value}</Text> : null}
        </View>
      </CollapsibleSection>

      <SystemSwitchConfirmModal
        visible={showConfirmModal}
        currentSystem={value}
        newSystem={pendingSystem as "microinverter" | "inverter"}
        onConfirm={() => {
          // Call the system switch callback to clear Energy Storage data
          if (onSystemSwitch) {
            onSystemSwitch();
          }
          // Then change the system type
          onChange(pendingSystem);
          setShowConfirmModal(false);
          setPendingSystem("");
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingSystem("");
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(4),
    marginBottom: verticalScale(10),
  },
  labelText: {
    color: colors.white,
    fontSize: moderateScale(20),
    fontWeight: "700",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
  },
  addSolarPanelsRow: {
    alignItems: "center",
    marginTop: verticalScale(15),
    marginBottom: verticalScale(15),
  },
  addSolarPanelsButton: {
    height: verticalScale(40),
  },
  error: {
    color: "#FF3B30",
    marginTop: verticalScale(8),
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
});

export default SystemSelectionSection;
