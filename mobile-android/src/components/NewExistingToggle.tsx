// src/components/NewExistingToggle.tsx

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../styles/gradient";


interface NewExistingToggleProps {
  /** defaults to `true` if not provided */
  isNew?: boolean;
  onToggle: (isNew: boolean) => void;
  style?: StyleProp<ViewStyle>;
  onTrashPress?: () => void;
  /** Custom label for the "New" button, defaults to "New" */
  newLabel?: string;
  /** Custom label for the "Existing" button, defaults to "Existing" */
  existingLabel?: string;
}

const NewExistingToggle: React.FC<NewExistingToggleProps> = ({
  // default to 'new' if parent doesn't send isNew
  isNew = true,
  onToggle,
  style,
  onTrashPress,
  newLabel = "New",
  existingLabel = "Existing",
}) => {
  return (
    <View style={[styles.row, style as any]}>
      <View style={styles.buttonContainer}>
        {/* New Button */}
        <TouchableOpacity
          onPress={() => onToggle(true)}
          style={styles.button}
        >
          {isNew ? (
            <LinearGradient
              {...ORANGE_TB}
              locations={[0, 1]}
              style={styles.activeButton}
            >
              <Text style={styles.activeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{newLabel}</Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              {...BLUE_2C_BT}
              style={styles.inactiveButton}
            >
              <Text style={styles.inactiveText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{newLabel}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Existing Button */}
        <TouchableOpacity
          onPress={() => onToggle(false)}
          style={styles.button}
        >
          {!isNew ? (
            <LinearGradient
              {...ORANGE_TB}
              locations={[0, 1]}
              style={styles.activeButton}
            >
              <Text style={styles.activeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{existingLabel}</Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              {...BLUE_2C_BT}
              style={styles.inactiveButton}
            >
              <Text style={styles.inactiveText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{existingLabel}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Clear text (if handler provided) */}
      {onTrashPress && (
        <TouchableOpacity
          onPress={onTrashPress}
          style={styles.clearBtn}
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
    paddingBottom: verticalScale(10),
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4), // Small gap between buttons
    minWidth: moderateScale(180), // Increased min width to prevent text wrapping
    width: moderateScale(180), // Increased total width to accommodate "Existing"
  },
  button: {
    flex: 1, // Each button takes equal space
    borderRadius: moderateScale(24), // Pill shape
    overflow: "hidden",
  },
  activeButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(8), // Increased horizontal padding to prevent text wrapping
    borderRadius: moderateScale(24), // Pill shape
    minHeight: verticalScale(38), // Ensure consistent button height
  },
  inactiveButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(8), // Added horizontal padding for consistency
    borderRadius: moderateScale(24), // Pill shape
    borderWidth: moderateScale(1), // Match other components
    borderColor: "#888888",
    minHeight: verticalScale(38), // Ensure consistent button height
  },
  activeText: {
    fontSize: moderateScale(18), // Increased by 1pt from 17 to 18
    color: "#ffffff",
    fontWeight: "700", // Bold weight for active state
    textAlignVertical: "center",
    textAlign: "center",
    numberOfLines: 1, // Prevent text wrapping
  },
  inactiveText: {
    fontSize: moderateScale(18), // Increased by 1pt from 17 to 18
    color: "#bbbbbb", // Grey text for inactive state
    fontWeight: "400", // Normal weight for inactive state
    textAlignVertical: "center",
    textAlign: "center",
    numberOfLines: 1, // Prevent text wrapping
  },
  clearBtn: {
    marginLeft: moderateScale(12),
  },
  clearText: {
    color: "#FD7332",
    fontSize: moderateScale(20),
    fontWeight: "600",
    fontFamily: "Lato-Bold",
  },
});

export default NewExistingToggle;
