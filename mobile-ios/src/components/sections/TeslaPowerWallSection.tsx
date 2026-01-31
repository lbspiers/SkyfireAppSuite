import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../styles/gradient";
import { TESLA_POWERWALL_GATEWAYS } from "../../utils/constants";
import Button from "../Button";

interface TeslaPowerWallSectionProps {
  make: string;
  model: string;
  onExpansionPacksChange?: (expansionPacks: number) => void;
  onGatewayChange?: (gateway: string) => void;
}

export default function TeslaPowerWallSection({
  make,
  model,
  onExpansionPacksChange,
  onGatewayChange,
}: TeslaPowerWallSectionProps) {
  const [selectedExpansionPacks, setSelectedExpansionPacks] =
    useState<number>(0);
  const [selectedGateway, setSelectedGateway] = useState<string>("");

  const expansionPackOptions = [0, 1, 2, 3];

  // Check if this is PowerWall+ (not PowerWall 3)
  const isPowerWallPlus = model.toLowerCase().includes('powerwall+') || model.toLowerCase().includes('powerwall +');

  const handleExpansionPackSelect = (option: number) => {
    setSelectedExpansionPacks(option);
    onExpansionPacksChange?.(option);
  };

  const handleGatewaySelect = (gateway: string) => {
    setSelectedGateway(gateway);
    onGatewayChange?.(gateway);
  };

  const renderExpansionPackButton = (option: number) => {
    const isSelected = selectedExpansionPacks === option;
    const gradient = isSelected ? ORANGE_TB : BLUE_2C_BT;

    return (
      <TouchableOpacity
        key={option}
        activeOpacity={0.8}
        onPress={() => handleExpansionPackSelect(option)}
        style={styles.buttonContainer}
      >
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={styles.buttonCircle}
        >
          <Text style={styles.buttonLabel}>{option}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Add Battery Expansion Packs?</Text>

      <View style={styles.radioButtonContainer}>
        {expansionPackOptions.map(renderExpansionPackButton)}
      </View>

      {/* Gateway buttons - only for PowerWall+ */}
      {isPowerWallPlus && (
        <View style={styles.gatewayContainer}>
          <Text style={styles.gatewayLabel}>Gateway*</Text>
          <View style={styles.gatewayButtonContainer}>
            {TESLA_POWERWALL_GATEWAYS.map((gateway) => (
              <Button
                key={gateway.value}
                title={gateway.label}
                selected={selectedGateway === gateway.value}
                onPress={() => handleGatewaySelect(gateway.value)}
                width={200}
                height={40}
                style={styles.gatewayButton}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed marginTop since model dropdown already has bottom margin
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  radioButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: moderateScale(35), // Increased from 20 to 35 to prevent fat finger issues
  },
  buttonContainer: {
    alignItems: "center",
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(22),
    fontWeight: "700",
    textAlign: "center",
  },
  buttonCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  gatewayContainer: {
    marginTop: verticalScale(10),
  },
  gatewayLabel: {
    color: "#FFFFFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: verticalScale(10),
  },
  gatewayButtonContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: moderateScale(8),
  },
  gatewayButton: {
    // Button component will handle width/height
  },
});
