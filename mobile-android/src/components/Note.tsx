// src/components/Note.tsx

import React, { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from "react-native";
import { moderateScale, verticalScale } from "../utils/responsive";

// icons
const pencilIcon = require("../assets/Images/icons/pencil_icon_white.png");
const flameIcon = require("../assets/Images/appIcon.png");

export interface NoteProps {
  /** Title on the top‐left */
  label: string;
  /** Body text of the note (when not editing) */
  note?: string;
  /**
   * Width of the note block, e.g. "100%" or 240
   */
  noteWidth?: number | string;
  /** Called when the pencil or X icon is tapped */
  onEdit: () => void;
  /** Optionally override the header icon (e.g. your red X) */
  iconSource?: any;
  /** Control the size/tint of that icon */
  iconStyle?: StyleProp<ImageStyle>;
  /** Custom wrapper style */
  style?: StyleProp<ViewStyle>;
  /** If provided, renders these children instead of the static text */
  children?: ReactNode;
}

export default function Note({
  label,
  note = "",
  noteWidth = "100%",
  onEdit,
  iconSource,
  iconStyle,
  children,
  style,
}: NoteProps) {
  const isEditing = Boolean(children);

  // Icon styling: always base on styles.icon; only tint white if default pencil
  const headerIconStyles = [
    styles.icon,
    !iconSource && styles.tinted, // apply white tint only for pencil
    iconStyle,
  ];

  return (
    <View style={[styles.container, style]}>
      {/* Header: main label + pencil/X */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Image source={iconSource ?? pencilIcon} style={headerIconStyles} />
        </TouchableOpacity>
      </View>

      {/* Sub‐label row: flame + “Note:” — only when not editing */}
      {!isEditing && (
        <View style={styles.subLabelRow}>
          <Image source={flameIcon} style={styles.flameSmall} />
          <Text style={styles.subLabel}>Note</Text>
        </View>
      )}

      {/* Body: children (edit mode) or static note text */}
      <View style={[styles.body, { width: noteWidth } as any]}>
        {isEditing ? (
          <View style={styles.content}>{children}</View>
        ) : (
          <Text style={styles.noteText}>{note}</Text>
        )}
      </View>
    </View>
  );
}

const FLAME_SIZE = moderateScale(26);
const ICON_SIZE = moderateScale(28);
const SUBLABEL_GAP = moderateScale(6);

const styles = StyleSheet.create<{
  container: ViewStyle;
  headerRow: ViewStyle;
  label: TextStyle;
  icon: ImageStyle;
  tinted: ImageStyle;
  subLabelRow: ViewStyle;
  flameSmall: ImageStyle;
  subLabel: TextStyle;
  body: ViewStyle;
  content: ViewStyle;
  noteText: TextStyle;
}>({
  container: {
    width: "100%",
    paddingVertical: verticalScale(8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#FFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    marginTop: verticalScale(-20),
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: "contain",
  },
  tinted: {
    tintColor: "#FFF",
  },

  subLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(8),
  },
  flameSmall: {
    width: FLAME_SIZE,
    height: FLAME_SIZE,
    resizeMode: "contain",
    marginRight: SUBLABEL_GAP,
  },
  subLabel: {
    color: "#FFF",
    fontSize: moderateScale(20),
    fontWeight: "700",
    opacity: 1,
  },

  body: {
    marginTop: verticalScale(4),
  },
  content: {
    // for dropdown or other children
  },
  noteText: {
    color: "#FFF",
    fontSize: moderateScale(20),
    lineHeight: verticalScale(22),
    opacity: 1,
    textAlign: "left",
    marginBottom: verticalScale(20),
  },
});
