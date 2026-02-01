// src/components/UI/InlineTextInput.tsx
import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { colors } from "../../theme/tokens/tokens";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface InlineTextInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numeric?: boolean;
  disabled?: boolean;
}

export default function InlineTextInput({
  value,
  onChangeText,
  placeholder = "",
  numeric = false,
  disabled = false,
  ...rest
}: InlineTextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        keyboardType={numeric ? "number-pad" : "default"}
        style={[
          styles.input,
          disabled && styles.inputDisabled,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    fontSize: moderateScale(16),
    color: colors.textPrimary,
    backgroundColor: "transparent",
    paddingVertical: verticalScale(4),
    paddingHorizontal: 0,
  },
  inputDisabled: {
    color: colors.textMuted,
  },
});
