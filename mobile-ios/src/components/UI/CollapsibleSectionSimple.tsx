// src/components/UI/CollapsibleSectionSimple.tsx

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
  /** Section header text */
  title: string;
  /** Start expanded? */
  initiallyExpanded?: boolean;
  /** Mark header green when true */
  isRequiredComplete?: boolean;
  /** Draw pencil icon (when collapsed & dirty) */
  isDirty?: boolean;
  /** Controlled expand/collapse */
  expanded?: boolean;
  /** Controlled toggle */
  onToggle?: () => void;
  /** Children to render when expanded */
  children: React.ReactNode;
}

export default function CollapsibleSectionSimple({
  title,
  initiallyExpanded = false,
  isRequiredComplete = false,
  isDirty = false,
  expanded: expandedProp,
  onToggle: onToggleProp,
  children,
}: Props) {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);

  // use controlled expanded if provided, else fall back to internal
  const expanded =
    typeof expandedProp === "boolean" ? expandedProp : internalExpanded;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggleProp) {
      onToggleProp();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
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

        {/* collapse/expand / dirty indicator */}
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

      {/* BODY */}
      {expanded && <View style={styles.body}>{children}</View>}

      {/* ACCENT BAR */}
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
  },
  headerTouchable: {
    flex: 1,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    lineHeight: 24,
    marginTop: 6,
  },
  completeTitle: {
    color: "#36B509",
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
  },
  accentBorder: {
    height: 1,
    width: "100%",
  },
});
