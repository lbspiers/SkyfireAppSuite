// src/components/UI/CollapsibleSection.tsx

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  Text as RNText,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { spacing, typography } from "../../theme/theme";

interface Props {
  title: string;
  initiallyExpanded?: boolean;
  isComplete?: boolean;
  children: React.ReactNode;
  photoCount?: number;
  onCameraPress?: () => void;
  isDirty?: boolean;
  isRequiredComplete?: boolean;
  renderCamera?: boolean;

  /** New prop: called when trash icon is tapped */
  onTrashPress?: () => void;
  /** New props to allow external control */
  expanded?: boolean;
  onToggle?: () => void;
}

export default function CollapsibleSection({
  title,
  initiallyExpanded = false,
  isComplete = false,
  children,
  photoCount = 0,
  onCameraPress,
  isDirty = false,
  isRequiredComplete = false,
  renderCamera = true,
  onTrashPress,
  expanded: expandedProp,
  onToggle: onToggleProp,
}: Props) {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);
  //use the controlled prop if provided, otherwise fallback to internal state
  const expanded =
    typeof expandedProp === "boolean" ? expandedProp : internalExpanded;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleProp) {
      onToggleProp();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Camera is visible when expanded, or when collapsed and photoCount > 0
  const showCamera =
    renderCamera && (expanded || (!expanded && photoCount > 0));

  // Camera icon tint: grey if no photos, orange if > 0
  const cameraTint = photoCount > 0 ? "#FD7332" : "#FFFFFF";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {/* Title */}
        <TouchableOpacity
          style={styles.headerTouchable}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <RNText
            style={[
              typography.label,
              styles.title,
              isRequiredComplete && styles.completeTitle,
            ]}
          >
            {title}
          </RNText>
        </TouchableOpacity>

        {/* Clear button, only when expanded */}
        {expanded && onTrashPress && (
          <TouchableOpacity
            onPress={onTrashPress}
            style={styles.clearWrapper}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <RNText style={styles.clearText}>Clear</RNText>
          </TouchableOpacity>
        )}

        {/* Camera icon + count */}
        {showCamera && (
          <TouchableOpacity
            onPress={onCameraPress}
            style={styles.cameraWrapper}
            activeOpacity={onCameraPress ? 0.6 : 1}
            disabled={!onCameraPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image
              source={require("../../assets/Images/icons/camera.png")}
              style={[styles.cameraIcon, { tintColor: cameraTint }]}
            />
            <View style={styles.countBadge}>
              <RNText style={styles.badgeText}>
                {photoCount > 99 ? "99+" : photoCount}
              </RNText>
            </View>
          </TouchableOpacity>
        )}

        {/* Collapse/expand icon */}
        <TouchableOpacity
          onPress={toggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image
            source={
              expanded
                ? require("../../assets/Images/icons/minus_icon_orange_fd7332.png")
                : isDirty
                ? require("../../assets/Images/icons/pencil_icon_orange_fd7332.png")
                : require("../../assets/Images/icons/plus_icon_orange_fd7332.png")
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {expanded && <View style={styles.body}>{children}</View>}

      {/* Bottom accent border */}
      <LinearGradient
        colors={["#FD7332", "#B92011"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBorder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 64,
    backgroundColor: "transparent",
  },
  headerTouchable: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 24,
    marginTop: 15,
    marginBottom: 10,
  },
  completeTitle: {
    color: "#36B509",
  },
  cameraWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
  },
  cameraIcon: {
    width: 34,
    height: 34,
    resizeMode: "contain",
    marginRight: 3,
    marginTop: -5,
  },
  countBadge: {
    backgroundColor: "transparent",
    borderRadius: 5,
    minWidth: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginLeft: 0,
    marginTop: -8,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 24,
    letterSpacing: 0.15,
  },
  clearWrapper: {
    marginLeft: 8,
  },
  clearText: {
    color: "#FD7332",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Lato-Bold",
    marginTop: -4,
    marginRight: 45,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginLeft: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: spacing.sm,
    backgroundColor: "transparent",
  },
  accentBorder: {
    height: 1,
    width: "100%",
  },
});
