// src/components/Button/RadialButton.tsx

import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale } from "../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../styles/gradient";

export interface RadialButtonProps {
  /** Text label shown above or inside the circle */
  label: string;
  /** Initial on/off state; default = true (only used if 'selected' is not provided) */
  defaultOn?: boolean;
  /** Controlled selected state - when provided, component becomes controlled */
  selected?: boolean;
  /** Show label inside the circle instead of above - default = false */
  labelInside?: boolean;
  /** Called whenever the state toggles */
  onToggle?: (isOn: boolean) => void;
  /** Optional container styling */
  style?: ViewStyle;
  /** Optional label text styling */
  labelStyle?: TextStyle;
  /** Diameter of the circle in pixels - defaults to 40 (scaled) */
  size?: number;
  /** Optional callback for press events */
  onPress?: (e: GestureResponderEvent) => void;
}

const RadialButton: React.FC<RadialButtonProps> = ({
  label,
  defaultOn = true,
  selected,
  labelInside = false,
  onToggle,
  style,
  labelStyle,
  size = moderateScale(40),
  onPress,
}) => {
  const [internalState, setInternalState] = useState(defaultOn);

  // Use controlled 'selected' prop if provided, otherwise use internal state
  const isOn = selected !== undefined ? selected : internalState;

  const handlePress = (e: GestureResponderEvent) => {
    const next = !isOn;

    // Only update internal state if not controlled
    if (selected === undefined) {
      setInternalState(next);
    }

    onToggle?.(next);
    onPress?.(e);
  };

  const gradient = isOn ? ORANGE_TB : BLUE_2C_BT;
  const textColor = isOn ? "#FFFFFF" : "#bbbbbb";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, style]}
    >
      {/* Label above circle (default behavior) */}
      {!labelInside && (
        <Text style={[styles.label, { color: textColor }, labelStyle]}>{label}</Text>
      )}

      <View
        style={[
          styles.borderContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          !isOn && {
            borderWidth: moderateScale(2),
            borderColor: "#888888",
          },
        ]}
      >
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={[
            styles.circle,
            {
              width: "100%",
              height: "100%",
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Label inside circle */}
          {labelInside && (
            <Text style={[styles.labelInside, { color: textColor }, labelStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column", // label above circle
    alignItems: "center",
  },
  label: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginBottom: moderateScale(6), // space between label & circle
    textAlign: "center",
  },
  labelInside: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    textAlign: "center",
  },
  borderContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RadialButton;
