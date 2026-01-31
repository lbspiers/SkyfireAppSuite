import React from "react";
import {
  TouchableOpacity,
  Text as RNText,
  StyleSheet,
  TextStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { spacing } from "../theme/theme";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// your blue gradient stops (top → bottom)
const BLUE_GRADIENT = ["#0C1F3F", "#2E4161"];
// your orange gradient stops (top → bottom)
const ORANGE_GRADIENT = ["#FD7332", "#B92011"];
const RADIUS = spacing.sm;

export default function StatusFilterButton({
  label,
  selected,
  onPress,
}: Props) {
  // always white text
  const textStyle: TextStyle = { color: "#FFFFFF" };

  // pick which gradient to use
  const colors = selected ? ORANGE_GRADIENT : BLUE_GRADIENT;
  // border matches the bottom color
  const borderColor = selected ? ORANGE_GRADIENT[1] : BLUE_GRADIENT[1];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.button, { borderColor }]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.inner}
      >
        <RNText style={[styles.text, textStyle]}>{label}</RNText>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: spacing.sm,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  inner: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: RADIUS,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
