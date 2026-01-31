// src/components/UI/CollapsibleSectionBOS.tsx

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
import { spacing, typography } from "../../theme/theme";
import NewExistingToggle from "../NewExistingToggle"; // <-- import toggle

interface Props {
  title: string;
  initiallyExpanded?: boolean;
  isRequiredComplete?: boolean;
  isDirty?: boolean;
  photoCount?: number;
  onCameraPress?: () => void;
  /** callback when trash icon in the toggle is pressed */
  onTrashPress?: () => void;
  children: React.ReactNode;
}

export default function CollapsibleSectionBOS({
  title,
  initiallyExpanded = false,
  isRequiredComplete = false,
  isDirty = false,
  photoCount = 0,
  onCameraPress,
  onTrashPress,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((e) => !e);
  };

  // camera visibility logic
  const showCamera = expanded || (!expanded && photoCount > 0);
  const cameraTint = photoCount > 0 ? "#FD7332" : "#FFFFFF";

  return (
    <View style={[
      styles.container,
      !expanded && styles.collapsedContainer,
      !expanded && isDirty && styles.collapsedContainerDirty,
    ]}>
      {/* header */}
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

        {/* New/Existing toggle + trash */}
        {onTrashPress && (
          <NewExistingToggle
            isNew={!isDirty}
            onToggle={() => {}}
            onTrashPress={onTrashPress}
            style={styles.toggle}
          />
        )}

        {/* optional camera icon + count */}
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

        {/* expand/collapse icon */}
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

      {/* body */}
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 20, // same LR spacing as other sections
    minHeight: 45,
    backgroundColor: "transparent",
    marginTop: -14,
  },
  headerTouchable: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
    marginTop: 4,
    marginLeft: -20,
  },
  completeTitle: {
    color: "#36B509",
  },
  toggle: {
    marginRight: 12, // ensure spacing before camera/icon
  },
  cameraWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
  },
  cameraIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    marginRight: 4,
    marginTop: 0,
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
    marginTop: 0,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 24,
    letterSpacing: 0.15,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginLeft: 12,
  },
  body: {
    paddingHorizontal: 20, // same LR padding
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  collapsedContainer: {
    borderWidth: 2,
    borderColor: "#6B7280",
    borderRadius: 8,
    marginBottom: 6,
    marginTop: 14,
    paddingVertical: 3,
  },
  collapsedContainerDirty: {
    borderColor: "#FD7332",
  },
});
