import React from "react";
import {
  View,
  ActivityIndicator as RNActivityIndicator,
  StyleSheet,
  ViewStyle,
} from "react-native";
import COLORS from "../../utils/styleConstant/Color";
interface ActivityIndicatorProps {
  size?: "small" | "large" | number;
  color?: string;
  style?: ViewStyle;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  size = "small",
  color = COLORS.white,
  style,
}) => {
  return <RNActivityIndicator size={size} color={color} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Optional: Add a semi-transparent background
  },
});

export default ActivityIndicator;
