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
import { colors } from "../../theme/tokens/tokens";
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

const ThemedTextInput: React.FC<ThemedTextInputProps> = ({
  label,
  placeholder,
  errorText,
  icon,
  onIconPress,
  containerStyle,
  labelStyle,
  inputStyle,
  placeholderColor = colors.textMuted,
  ...rest
}) => {
  const hasError = !!errorText;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      {/* Orange gradient border */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.borderGradient}
      >
        {/* Blue gradient background */}
        <LinearGradient
          colors={[colors.bgInput, colors.bgInputHover]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientWrapper}
        >
          <TextInput
            mode="flat"
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            underlineColor={colors.transparent}
            activeUnderlineColor={colors.transparent}
            textColor={colors.textPrimary}
            selectionColor={colors.textPrimary}
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
    color: colors.textPrimary,
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
    backgroundColor: colors.transparent,
    fontSize: moderateScale(15),
    color: colors.textPrimary,
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
    tintColor: colors.primary,
    resizeMode: "contain",
  },
  errorText: {
    color: colors.error,
    fontSize: moderateScale(12),
    marginTop: verticalScale(6),
  },
});

export default ThemedTextInput;
