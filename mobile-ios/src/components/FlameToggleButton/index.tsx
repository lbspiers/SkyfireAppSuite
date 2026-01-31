// src/components/FlameToggleButton/index.tsx

import React from "react";
import { TouchableOpacity, Image, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useDrawerStatus } from "@react-navigation/drawer";
import { useNavigation, DrawerActions } from "@react-navigation/native";

interface FlameToggleButtonProps {
  top?: number;
  right?: number;
}

const FlameToggleButton: React.FC<FlameToggleButtonProps> = ({
  top = 60,
  right = 20,
}) => {
  const navigation = useNavigation<any>();
  const drawerStatus = useDrawerStatus();
  const isOpen = drawerStatus === "open";

  const handlePress = () => {
    if (isOpen) {
      navigation.dispatch(DrawerActions.closeDrawer());
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={[styles.container, { top, right }]} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Image
          source={
            isOpen
              ? require("../../assets/Images/fire-active.png")
              : require("../../assets/Images/appIcon.png")
          }
          style={styles.flame}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 9999,
  },
  button: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  flame: {
    width: 48,
    height: 48,
  },
});

export default FlameToggleButton;
