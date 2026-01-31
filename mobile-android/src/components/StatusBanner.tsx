// src/components/StatusBanner.tsx
import React from "react";
import {
  ImageBackground,
  Text,
  StyleSheet,
  ImageStyle,
  TextStyle,
} from "react-native";
import { typography } from "../theme/theme";

interface StatusBannerProps {
  status: string;
  style?: ImageStyle | ImageStyle[];
}

const BANNER_WIDTH = 86;
const BANNER_HEIGHT = 25;

const StatusBanner: React.FC<StatusBannerProps> = ({ status, style }) => (
  <ImageBackground
    source={require("../assets/Images/StatusBanner.png")}
    resizeMode="stretch"
    style={[styles.banner, style]}
  >
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[styles.text, typography.label as TextStyle]}
    >
      {status}
    </Text>
  </ImageBackground>
);

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  } as ImageStyle,

  text: {
    color: "#FFFFFF",
    // any additional overrides here
  } as TextStyle,
});

export default StatusBanner;
