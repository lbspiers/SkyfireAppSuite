import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onPress: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  expanded,
  onPress,
}) => {
  return (
    <LinearGradient
      colors={["#334A66", "#223347"]}
      style={styles.headerContainer}
    >
      <TouchableOpacity style={styles.row} onPress={onPress}>
        <Text style={styles.title}>{title}</Text>
        <Image
          source={
            expanded
              ? require("../../assets/Images/icons/icon_collapse.png")
              : require("../../assets/Images/icons/icon_expand.png")
          }
          style={styles.icon}
        />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: "#FD7332",
  },
});

export default SectionHeader;
