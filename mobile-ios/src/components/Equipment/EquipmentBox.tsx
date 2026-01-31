import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale } from "../../utils/responsive";

export type EquipmentType =
  | "solar_panel"
  | "inverter"
  | "microinverter"
  | "battery"
  | "sms"
  | "backup_gateway"
  | "combiner_panel"
  | "sub_panel"
  | "main_panel"
  | "bos_equipment";

interface EquipmentBoxProps {
  type: EquipmentType;
  label: string;
  make?: string;
  model?: string;
  x: number;
  y: number;
  systemNumber?: number; // Which system this belongs to
  isShared?: boolean; // Is this shared between systems (like combiner panel)
}

const EquipmentBox: React.FC<EquipmentBoxProps> = ({
  type,
  label,
  make,
  model,
  x,
  y,
  systemNumber,
  isShared = false,
}) => {
  // Define box dimensions - all square but larger for text
  const getBoxDimensions = () => {
    switch (type) {
      case "combiner_panel":
      case "sub_panel":
        return {
          width: moderateScale(70),
          height: moderateScale(70), // Square for panels
        };
      case "main_panel":
        return {
          width: moderateScale(70),
          height: moderateScale(70),
        };
      default:
        return {
          width: moderateScale(70),
          height: moderateScale(70), // All boxes are square
        };
    }
  };

  // Define colors based on equipment type
  const getBoxColors = () => {
    switch (type) {
      case "solar_panel":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.2)", // Blue tint
          borderColor: "#3B82F6",
        };
      case "inverter":
      case "microinverter":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.2)", // Green tint
          borderColor: "#10B981",
        };
      case "battery":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.2)", // Amber tint
          borderColor: "#F59E0B",
        };
      case "sms":
        return {
          backgroundColor: "rgba(139, 92, 246, 0.2)", // Purple tint
          borderColor: "#8B5CF6",
        };
      case "backup_gateway":
        return {
          backgroundColor: "rgba(34, 197, 94, 0.2)", // Emerald tint
          borderColor: "#22C55E",
        };
      case "bos_equipment":
        return {
          backgroundColor: "rgba(236, 72, 153, 0.2)", // Pink tint
          borderColor: "#EC4899",
        };
      case "combiner_panel":
      case "sub_panel":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.2)", // Red tint
          borderColor: "#EF4444",
        };
      case "main_panel":
        return {
          backgroundColor: "rgba(185, 32, 17, 0.3)", // Darker red
          borderColor: "#FD7332",
        };
      default:
        return {
          backgroundColor: "rgba(107, 114, 128, 0.2)", // Gray
          borderColor: "#6B7280",
        };
    }
  };

  const dimensions = getBoxDimensions();
  const colors = getBoxColors();

  return (
    <View
      style={[
        styles.container,
        {
          position: "absolute",
          left: x,
          top: y,
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: colors.backgroundColor,
          borderColor: isShared ? "#FD7332" : colors.borderColor,
          borderWidth: isShared ? moderateScale(2.5) : moderateScale(1.5),
        },
      ]}
    >
      {/* Label - only show equipment type */}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>

      {/* System indicator (top right corner) */}
      {systemNumber && !isShared && (
        <View style={styles.systemBadge}>
          <Text style={styles.systemBadgeText}>S{systemNumber}</Text>
        </View>
      )}

      {/* Shared indicator */}
      {isShared && (
        <View style={[styles.systemBadge, styles.sharedBadge]}>
          <Text style={styles.systemBadgeText}>SHARED</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(4),
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(2),
  },
  label: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    flexWrap: "wrap",
  },
  systemBadge: {
    position: "absolute",
    top: moderateScale(2),
    right: moderateScale(2),
    backgroundColor: "#3B82F6",
    borderRadius: moderateScale(2),
    paddingHorizontal: moderateScale(3),
    paddingVertical: moderateScale(1),
  },
  sharedBadge: {
    backgroundColor: "#FD7332",
  },
  systemBadgeText: {
    fontSize: moderateScale(6),
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default EquipmentBox;
