// src/components/Button/DerateButton.tsx

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface DerateButtonProps {
  derated: boolean;
  onToggle: (value: boolean) => void;
}

const DerateButton: React.FC<DerateButtonProps> = ({
  derated,
  onToggle,
}) => {
  const buttonSize = 40; // Slightly smaller button size

  return (
    <View style={styles.derateContainer}>
      <Text style={styles.derateLabel}>Derate</Text>
      <View style={{ height: verticalScale(6) }} />
      <TouchableOpacity
        onPress={() => onToggle(!derated)}
        activeOpacity={0.8}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={
            derated ? ["#FD7332", "#B92011"] : ["#0C1F3F", "#2E4161"]
          }
          style={[styles.derateCircle, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  derateContainer: {
    alignItems: "center",
    marginLeft: 12,
    marginTop: verticalScale(18),
  },
  derateLabel: {
    color: "#FFF",
    fontSize: moderateScale(20),
    lineHeight: moderateScale(20),
    fontWeight: "700",
  },
  buttonWrapper: {
    borderRadius: 9999, // Make it fully circular
    borderWidth: moderateScale(2), // Match dropdown border width
    borderColor: "#888888",
    overflow: "hidden",
  },
  derateCircle: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DerateButton;
