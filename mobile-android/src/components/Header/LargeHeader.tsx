// src/components/Header/LargeHeader.tsx

import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  moderateScale,
  verticalScale,
  widthPercentageToDP,
  useResponsive,
} from "../../utils/responsive";
import { BLUE_LIGHT_MD_TB, ORANGE_LR, BLUE_2C_BT } from "../../styles/gradient";
import FlameToggleButton from "../FlameToggleButton";
import HeaderNotification from "../../screens/Project/SystemDetails/components/HeaderNotification";

interface LargeHeaderProps {
  title: string;
  name?: string;
  addressLines?: string[];
  projectId?: string;
  onDrawerPress: () => void;
  // Optional: Enable address editing
  editableAddress?: boolean;
  onEditAddress?: (lineIndex: number) => void;
  onAddressFocus?: (lineIndex: number) => void;
  isEditingAddress?: boolean[];
  onSaveAddress?: (lineIndex: number) => void;
  editedAddressLines?: string[];
  onAddressChange?: (lineIndex: number, value: string) => void;
  // Optional: Enable name editing
  editableName?: boolean;
  isEditingName?: boolean;
  onEditName?: () => void;
  onSaveName?: () => void;
  editedName?: string;
  onNameChange?: (value: string) => void;
  // Optional: Enable project ID editing
  editableProjectId?: boolean;
  isEditingProjectId?: boolean;
  onEditProjectId?: () => void;
  onSaveProjectId?: () => void;
  editedProjectId?: string;
  onProjectIdChange?: (value: string) => void;
  // Optional: Notification display
  notificationMessage?: string | null;
  notificationType?: 'success' | 'error';
  onNotificationComplete?: () => void;
}

export default function LargeHeader({
  title,
  name,
  addressLines = [],
  projectId,
  onDrawerPress,
  editableAddress = false,
  onEditAddress,
  onAddressFocus,
  isEditingAddress = [],
  onSaveAddress,
  editedAddressLines = [],
  onAddressChange,
  editableName = false,
  isEditingName = false,
  onEditName,
  onSaveName,
  editedName = "",
  onNameChange,
  editableProjectId = false,
  isEditingProjectId = false,
  onEditProjectId,
  onSaveProjectId,
  editedProjectId = "",
  onProjectIdChange,
  notificationMessage,
  notificationType = 'success',
  onNotificationComplete,
}: LargeHeaderProps) {
  const { moderateScale, verticalScale, font } = useResponsive();

  const pencilIcon = require("../../assets/Images/icons/pencil_icon_white.png");
  const checkIcon = require("../../assets/Images/icons/checkMark.png");

  // Extract system number from title (e.g., "System 1" -> "1")
  const systemNumber = title.match(/\d+$/)?.[0];
  const titleWithoutNumber = systemNumber ? title.replace(/\s+\d+$/, "") : title;

  return (
    <LinearGradient {...BLUE_LIGHT_MD_TB} style={styles.container}>
      {/* Spacer for notch / status bar */}
      <View style={styles.topSpace} />

      {/* Title + Icon Row */}
      <View style={styles.row}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: font(32) }]}>{titleWithoutNumber}</Text>
          {systemNumber && (
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>{systemNumber}</Text>
            </View>
          )}
        </View>
        <View style={styles.flameContainer}>
          <FlameToggleButton top={0} right={0} />
        </View>
      </View>

      {/* Name */}
      {name && (
        <View style={styles.fieldContainer}>
          {isEditingName ? (
            <LinearGradient
              colors={BLUE_2C_BT.colors}
              start={BLUE_2C_BT.start}
              end={BLUE_2C_BT.end}
              style={[
                styles.editableInputWrapper,
                {
                  borderWidth: moderateScale(1),
                  borderColor: editedName ? "#FD7332" : "#888888",
                },
              ]}
            >
              <TextInput
                style={[styles.editableInput, { fontSize: font(24) }]}
                value={editedName || name}
                onChangeText={(text) => onNameChange?.(text)}
                placeholder="Customer Name"
                placeholderTextColor="#FFFFFF66"
                autoCorrect={false}
                autoCapitalize="words"
                selectionColor="#FD7332"
              />
            </LinearGradient>
          ) : (
            <Text style={[styles.name, { fontSize: font(24) }]}>{name}</Text>
          )}
        </View>
      )}

      {/* Address Lines */}
      <View>
        {addressLines[0] && (
          <View style={styles.fieldContainer}>
            {isEditingAddress[0] ? (
              <LinearGradient
                colors={BLUE_2C_BT.colors}
                start={BLUE_2C_BT.start}
                end={BLUE_2C_BT.end}
                style={[
                  styles.editableInputWrapper,
                  {
                    borderWidth: moderateScale(1),
                    borderColor: editedAddressLines[0] ? "#FD7332" : "#888888",
                  },
                ]}
              >
                <TextInput
                  style={[styles.editableInput, { fontSize: font(20) }]}
                  value={editedAddressLines[0] || addressLines[0]}
                  onChangeText={(text) => onAddressChange?.(0, text)}
                  onFocus={() => onAddressFocus?.(0)}
                  placeholder="Street Address"
                  placeholderTextColor="#FFFFFF66"
                  autoCorrect={false}
                  autoCapitalize="words"
                  selectionColor="#FD7332"
                />
              </LinearGradient>
            ) : (
              <Text style={[styles.address, { fontSize: font(20) }]}>
                {addressLines[0]}
              </Text>
            )}
          </View>
        )}
        {addressLines[1] && (
          <View style={styles.fieldContainer}>
            {isEditingAddress[1] ? (
              <LinearGradient
                colors={BLUE_2C_BT.colors}
                start={BLUE_2C_BT.start}
                end={BLUE_2C_BT.end}
                style={[
                  styles.editableInputWrapper,
                  {
                    borderWidth: moderateScale(1),
                    borderColor: editedAddressLines[1] ? "#FD7332" : "#888888",
                  },
                ]}
              >
                <TextInput
                  style={[styles.editableInput, { fontSize: font(20) }]}
                  value={editedAddressLines[1] || addressLines[1]}
                  onChangeText={(text) => onAddressChange?.(1, text)}
                  onFocus={() => onAddressFocus?.(1)}
                  placeholder="City, State, Zip"
                  placeholderTextColor="#FFFFFF66"
                  autoCorrect={false}
                  autoCapitalize="words"
                  selectionColor="#FD7332"
                />
              </LinearGradient>
            ) : (
              <Text style={[styles.address, { fontSize: font(20) }]}>
                {addressLines[1]}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Project ID with single edit icon */}
      {projectId && (
        <View style={styles.projectIdRow}>
          <View style={styles.fieldContainer}>
            {isEditingProjectId ? (
              <LinearGradient
                colors={BLUE_2C_BT.colors}
                start={BLUE_2C_BT.start}
                end={BLUE_2C_BT.end}
                style={[
                  styles.editableInputWrapper,
                  {
                    borderWidth: moderateScale(1),
                    borderColor: editedProjectId ? "#FD7332" : "#888888",
                  },
                ]}
              >
                <TextInput
                  style={[styles.editableInput, { fontSize: font(16), color: "#FFFFFF" }]}
                  value={editedProjectId || projectId}
                  onChangeText={(text) => onProjectIdChange?.(text)}
                  placeholder="Project ID"
                  placeholderTextColor="#FFFFFF66"
                  autoCorrect={false}
                  autoCapitalize="characters"
                  selectionColor="#FD7332"
                />
              </LinearGradient>
            ) : (
              <Text style={[styles.projectId, { fontSize: font(16) }]}>
                {projectId}
              </Text>
            )}
          </View>
          {/* Single pencil/check icon for ALL fields */}
          {editableProjectId && (
            <TouchableOpacity
              onPress={() => {
                if (isEditingProjectId) {
                  onSaveProjectId?.();
                } else {
                  onEditProjectId?.();
                }
              }}
              style={styles.editIconButton}
            >
              <Image
                source={isEditingProjectId ? checkIcon : pencilIcon}
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Separator */}
      <LinearGradient
        {...ORANGE_LR}
        style={styles.separator}
        locations={[0, 1]}
      />

      {/* Header Notification */}
      <HeaderNotification
        message={notificationMessage}
        type={notificationType}
        onComplete={onNotificationComplete}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: widthPercentageToDP("100%"),
    position: "relative",
    paddingBottom: verticalScale(15),
  },
  topSpace: {
    height: verticalScale(50),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: moderateScale(16),
    paddingBottom: verticalScale(4),
    marginBottom: verticalScale(10),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "Lato-Bold",
  },
  numberCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: moderateScale(12),
    marginBottom: verticalScale(2),
    marginTop: -4,
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: moderateScale(24),
    fontWeight: "700",
    fontFamily: "Lato-Bold",
    lineHeight: moderateScale(24),
    includeFontPadding: false,
    textAlignVertical: "center",
    marginTop: 4,
  },
  flameContainer: {
    width: moderateScale(58),
    height: verticalScale(58),
    position: "relative",
  },
  name: {
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(5),
  },
  fieldContainer: {
    marginBottom: verticalScale(5),
  },
  projectIdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 0,
    marginBottom: verticalScale(-5),
  },
  editableInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: moderateScale(16),
    paddingRight: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(4),
    minHeight: moderateScale(44),
    marginHorizontal: 0,
  },
  editableInput: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
    padding: 0,
    margin: 0,
    backgroundColor: "transparent",
  },
  address: {
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
    lineHeight: verticalScale(28),
    paddingHorizontal: moderateScale(16),
  },
  editIconButton: {
    padding: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  editIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: "#FFFFFF",
  },
  projectId: {
    color: "#737E91",
    fontFamily: "Lato-Regular",
    paddingHorizontal: moderateScale(16),
    marginBottom: verticalScale(-5),
    lineHeight: verticalScale(28),
  },
  separator: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: verticalScale(2),
    borderRadius: moderateScale(2),
  },
});
