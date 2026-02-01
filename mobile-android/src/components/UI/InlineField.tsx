// src/components/UI/InlineField.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../../theme/tokens/tokens";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface InlineFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  /** Hide bottom border (for last item in section) */
  noBorder?: boolean;
  /** Error message to display */
  error?: string;
}

export default function InlineField({
  label,
  children,
  required = false,
  style,
  labelStyle,
  noBorder = false,
  error,
}: InlineFieldProps) {
  return (
    <View style={[styles.container, !noBorder && styles.withBorder, style]}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}{required && <Text style={styles.required}>*</Text>}
          </Text>
        </View>
        <View style={styles.inputContainer}>
          {children}
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: verticalScale(12),
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  labelContainer: {
    flex: 0.3, // 30% width
    paddingRight: moderateScale(12),
  },
  label: {
    fontSize: moderateScale(16),
    color: colors.textMuted,
    fontWeight: "400",
  },
  required: {
    color: colors.primary,
  },
  inputContainer: {
    flex: 0.7, // 70% width
  },
  errorText: {
    color: colors.error,
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
    marginLeft: "30%", // Align with input
  },
});
