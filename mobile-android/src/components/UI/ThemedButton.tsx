import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../Text"; // 🔥 Use your custom Text component
import { moderateScale, verticalScale } from "../../utils/responsive";
import { colors } from "../../theme/tokens/tokens";

interface ThemedButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color1?: string;
  color2?: string;
  color3?: string;
  disabled?: boolean;
  gradient?: boolean;
  children?: React.ReactNode;
  small?: boolean; // ✅ NEW: Small button support
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
  onPress,
  style,
  textStyle,
  color1 = colors.primary,
  color2 = colors.primaryDark,
  color3,
  disabled = false,
  gradient = true,
  children,
  small = false, // ✅ default false
}) => {
  const gradientColors = color3 ? [color1, color2, color3] : [color1, color2];

  const ButtonContent = () => (
    <TouchableOpacity
      style={[
        styles.button,
        small && styles.smallButton, // 👈 if small apply smaller height
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          small && styles.smallText, // 👈 if small apply smaller font
          textStyle,
          disabled && styles.disabledText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );

  if (gradient && !disabled) {
    return (
      <LinearGradient colors={gradientColors} style={[styles.gradient, style]}>
        <ButtonContent />
      </LinearGradient>
    );
  } else {
    return (
      <View style={[styles.gradient, style, styles.disabledBackground]}>
        <ButtonContent />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: moderateScale(50),
    overflow: "hidden",
  },
  button: {
    height: verticalScale(48),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
  },
  smallButton: {
    height: verticalScale(36), // 👈 slightly shorter for small button
    paddingHorizontal: moderateScale(12),
  },
  text: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  smallText: {
    fontSize: moderateScale(14), // 👈 smaller font size for small button
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textMuted,
  },
  disabledBackground: {
    backgroundColor: colors.bgInputDisabled,
  },
});

export default ThemedButton;
