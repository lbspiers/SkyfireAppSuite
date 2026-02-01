import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors, radius, spacing, fontSize, fontWeight } from "../../theme/tokens/tokens";

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
      colors={[colors.bgElevated, colors.bgSurface]}
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: colors.primary,
  },
});

export default SectionHeader;
