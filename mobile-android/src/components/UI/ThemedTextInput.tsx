// src/components/UI/ThemedTextInput.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextStyle,
  ViewStyle,
  TouchableOpacity,
  Image,
} from "react-native";
import { TextInput, TextInputProps } from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import { ORANGE_LR, BLUE_2C_BT } from "../../styles/gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface ThemedTextInputProps extends TextInputProps {
  label: string;
  placeholder?: string;
  errorText?: string;
  icon?: any;
  onIconPress?: () => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  placeholderColor?: string;
}

const ORANGE = "#FD7332";

const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
  label,
  placeholder,
  errorText,
  icon,
  onIconPress,
  containerStyle,
  labelStyle,
  inputStyle,
  placeholderColor = "#AAAAAA",
  ...rest
}) => {
  const hasError = !!errorText;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      {/* Orange gradient border */}
      <LinearGradient
        colors={ORANGE_LR.colors}
        start={ORANGE_LR.start}
        end={ORANGE_LR.end}
        style={styles.borderGradient}
      >
        {/* Blue gradient background */}
        <LinearGradient
          colors={BLUE_2C_BT.colors}
          start={BLUE_2C_BT.start}
          end={BLUE_2C_BT.end}
          style={styles.gradientWrapper}
        >
          <TextInput
            mode="flat"
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            textColor="#FFFFFF"
            selectionColor="#FFFFFF"
            {...rest}
          />
          {icon && (
            <TouchableOpacity onPress={onIconPress} style={styles.iconContainer}>
              <Image source={icon} style={styles.icon} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </LinearGradient>

      {hasError && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(8),
  },
  label: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  borderGradient: {
    borderRadius: moderateScale(8),
    padding: moderateScale(2), // Creates the border thickness
  },
  gradientWrapper: {
    borderRadius: moderateScale(6),
    position: "relative",
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(2), // Reduced from 4 to 2
  },
  input: {
    backgroundColor: "transparent",
    fontSize: moderateScale(15),
    color: "#FFFFFF",
    height: verticalScale(32),
    padding: 0,
    margin: 0,
  },
  iconContainer: {
    position: "absolute",
    right: moderateScale(12),
    top: verticalScale(12),
  },
  icon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: ORANGE,
    resizeMode: "contain",
  },
  errorText: {
    color: "red",
    fontSize: moderateScale(12),
    marginTop: verticalScale(6),
  },
});

export default ThemedTextInput;
