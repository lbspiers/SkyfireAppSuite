import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { moderateScale } from "../../utils/responsive";
import Button from "../Button";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSystems: number[];
  activeSystems: number[];
  onSystemSelect?: (systemNum: number) => void; // Allow users to jump to a system for editing
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  completedSystems,
  activeSystems,
  onSystemSelect,
}) => {
  const pencilIcon = require("../../assets/Images/icons/pencil_icon_white.png");

  return (
    <View style={styles.container}>
      {/* System Text */}
      <Text style={styles.stepText}>
        System {currentStep} of {totalSteps}
      </Text>

      {/* Pill Buttons */}
      <View style={styles.pillsContainer}>
        {activeSystems.map((systemNum, index) => {
          const isCompleted = completedSystems.includes(systemNum);
          const isCurrent = index + 1 === currentStep;

          return (
            <View key={systemNum} style={styles.pillWrapper}>
              <Button
                title={`Sys ${systemNum}`}
                selected={isCurrent}
                onPress={() => onSystemSelect?.(systemNum)}
                width={moderateScale(80)}
                height={38} // Matches NewExistingToggle minHeight of 38 (verticalScale will be applied in Button)
                rounded={24} // Pill shape - matches NewExistingToggle
                disabled={!isCompleted && !isCurrent} // Can't click future systems
                deactivated={!isCompleted && !isCurrent} // Grey out future systems
              />
              {/* Edit Pencil for completed systems */}
              {isCompleted && !isCurrent && onSystemSelect && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onSystemSelect(systemNum)}
                  activeOpacity={0.7}
                >
                  <Image source={pencilIcon} style={styles.pencilIcon} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: moderateScale(16),
  },
  stepText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: moderateScale(12),
  },
  pillsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(12),
  },
  pillWrapper: {
    position: "relative",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    top: -moderateScale(6),
    right: -moderateScale(6),
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#FD7332",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  pencilIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    tintColor: "#FFFFFF",
    resizeMode: "contain",
  },
});

export default ProgressIndicator;
