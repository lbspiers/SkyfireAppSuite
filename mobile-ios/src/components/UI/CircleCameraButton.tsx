import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  Platform,
  Pressable,
} from "react-native";

interface Props {
  onPress: () => void;
  size?: number;
  icon?: any;
}

const CircleCameraButton: React.FC<Props> = ({
  onPress,
  size = 60,
  icon = require("../../assets/Images/icons/camera.png"),
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
      accessibilityLabel="Camera Button"
      accessibilityHint="Opens the camera"
    >
      <Image source={icon} style={styles.icon} resizeMode="contain" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FD7332",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
  },
});

export default CircleCameraButton;
