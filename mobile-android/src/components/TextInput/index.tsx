// components/TextInputField.tsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Keyboard,
  Image,
  Animated,
  TextInput as RNTextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { colors } from "../../theme/tokens/tokens";
// TODO: Custom keyboard disabled - will be re-enabled later
// import { useGlobalKeyboard } from "../CustomKeyboard/GlobalKeyboardProvider";

export type TextInputFieldProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  widthPercent?: number;
  containerStyle?: View["props"]["style"];
  labelStyle?: Text["props"]["style"];
  inputStyle?: TextInputProps["style"];
  errorText?: string;
  showNumericKeypad?: boolean;
  onNumericKeypadOpen?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  fieldId?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  placeholder = "",
  value = "",
  onChangeText = () => {},
  widthPercent = 100,
  containerStyle,
  labelStyle,
  inputStyle,
  errorText,
  showNumericKeypad = false,
  onNumericKeypadOpen,
  autoCapitalize = 'sentences',
  fieldId,
  secureTextEntry = false,
  ...rest
}) => {
  const hasText = value && value.trim().length > 0;
  const [reveal, setReveal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isSecure = secureTextEntry && !reveal;
  const inputRef = useRef<RNTextInput>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Note: showNumericKeypad now uses native number-pad keyboard via keyboardType prop
    // Custom NumericKeypad component is preserved for future use
    rest.onFocus?.({} as any);
  }, [rest]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  }, [rest]);

  // Filter out props that interfere with native numeric keyboard
  const { showSoftInputOnFocus, ...filteredRest } = rest;
  const inputProps = showNumericKeypad
    ? filteredRest // Allow native keyboard to show
    : rest; // Keep all original props

  return (
    <View
      style={[{ width: `${widthPercent}%` }, styles.container, containerStyle]}
    >
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View style={{ height: verticalScale(6) }} />

      <LinearGradient
        colors={[colors.bgInput, colors.bgInputHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.inputWrapper,
          {
            borderWidth: moderateScale(1),
            borderColor: hasText ? colors.primary : colors.borderInactive,
          },
        ]}
      >
        <RNTextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          returnKeyType="done"
          keyboardType={showNumericKeypad ? "number-pad" : rest.keyboardType}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              flex: 1,
            },
            inputStyle,
          ]}
          {...inputProps}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIconWrapper}
            onPress={() => setReveal((r) => !r)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require("../../assets/Images/icons/eye.png")}
              style={[
                styles.eyeIcon,
                {
                  opacity: reveal ? 0.6 : 1,
                }
              ]}
            />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <View style={{ height: verticalScale(10) }} />
      )}
      <View style={{ height: verticalScale(10) }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(20),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: moderateScale(12),
    paddingVertical: 0,
    borderRadius: moderateScale(4),
    minHeight: moderateScale(44),
  },
  input: {
    fontSize: moderateScale(20),
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    minHeight: moderateScale(20),
  },
  eyeIconWrapper: {
    padding: moderateScale(6),
  },
  eyeIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: colors.textPrimary,
    resizeMode: "contain",
  },
  errorText: {
    marginTop: verticalScale(5),
    fontSize: moderateScale(12),
    color: colors.error,
    marginBottom: verticalScale(-5),
  },
});

export default TextInputField;
