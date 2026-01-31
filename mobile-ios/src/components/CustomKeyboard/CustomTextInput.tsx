// src/components/CustomKeyboard/CustomTextInput.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Image,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { BLUE_2C_BT } from '../../styles/gradient';

import { useGlobalKeyboard } from './GlobalKeyboardProvider';

export interface CustomTextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  returnKeyType?: 'done' | 'send' | 'search' | 'next' | 'go';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  editable?: boolean;
  multiline?: boolean;
  maxLength?: number;
  errorText?: string;
  useCustomKeyboard?: boolean;
  enableHapticFeedback?: boolean;
  showSuggestions?: boolean;
  theme?: 'dark' | 'light';
  widthPercent?: number;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
}

export default function CustomTextInput({
  label,
  placeholder = '',
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  returnKeyType = 'done',
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  multiline = false,
  maxLength,
  errorText,
  useCustomKeyboard = false,
  enableHapticFeedback = true,
  showSuggestions = false,
  theme = 'dark',
  widthPercent = 100,
  containerStyle,
  inputStyle,
  labelStyle,
}: CustomTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const globalKeyboard = useGlobalKeyboard();

  const hasText = internalValue.trim().length > 0;

  // Blinking cursor animation
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const cursorAnimationRef = useRef<any>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Generate a unique field ID for this input
  const currentFieldId = `custom-${label || 'text-input'}`;

  // Check if this field is the globally focused one
  const isGloballyFocused = globalKeyboard?.focusedFieldId === currentFieldId;

  // Start/stop cursor blinking animation based on focus state
  useEffect(() => {
    // Always stop any existing animation first
    if (cursorAnimationRef.current) {
      cursorAnimationRef.current.stop();
      cursorAnimationRef.current = null;
    }

    // Only show cursor if this field is both locally focused AND globally focused
    if (isFocused && isGloballyFocused) {
      // Start blinking animation
      cursorOpacity.setValue(1); // Start visible
      cursorAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      cursorAnimationRef.current.start();
    } else {
      // Hide cursor immediately when not focused or not globally focused
      cursorOpacity.setValue(0);
    }

    // Cleanup animation on unmount
    return () => {
      if (cursorAnimationRef.current) {
        cursorAnimationRef.current.stop();
        cursorAnimationRef.current = null;
      }
    };
  }, [isFocused, isGloballyFocused, cursorOpacity]);

  const handleTextChange = useCallback((text: string) => {
    if (maxLength && text.length > maxLength) {
      return;
    }

    setInternalValue(text);
    onChangeText?.(text);
  }, [maxLength, onChangeText]);

  const handleCustomKeyPress = useCallback((key: string) => {
    setInternalValue(currentValue => {
      const newText = currentValue + key;
      // Use setTimeout to avoid setState during render
      setTimeout(() => onChangeText?.(newText), 0);
      return newText;
    });
  }, [onChangeText]);

  const handleCustomBackspace = useCallback(() => {
    setInternalValue(currentValue => {
      const newText = currentValue.slice(0, -1);
      // Use setTimeout to avoid setState during render
      setTimeout(() => onChangeText?.(newText), 0);
      return newText;
    });
  }, [onChangeText]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Clear this field from global focus
    if (globalKeyboard) {
      globalKeyboard.clearFocusedField(currentFieldId);
      if (useCustomKeyboard) {
        globalKeyboard.hideKeyboard();
      }
    }

    // Immediately stop cursor animation when field loses focus
    if (cursorAnimationRef.current) {
      cursorAnimationRef.current.stop();
      cursorAnimationRef.current = null;
    }
    cursorOpacity.setValue(0); // Hide cursor immediately

    onBlur?.();
  }, [useCustomKeyboard, onBlur, globalKeyboard, cursorOpacity, currentFieldId]);

  const handleCustomEnter = useCallback(() => {
    if (multiline) {
      const newText = internalValue + '\n';
      handleTextChange(newText);
    } else {
      handleBlur();
    }
  }, [multiline, internalValue, handleTextChange, handleBlur]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);

    // Set this field as globally focused (will clear other fields)
    if (globalKeyboard) {
      globalKeyboard.setFocusedField(currentFieldId);
    }

    // Immediately start cursor animation when field gains focus
    cursorOpacity.setValue(1); // Show cursor immediately

    onFocus?.();

    if (useCustomKeyboard) {
      // Dismiss system keyboard and show custom keyboard
      Keyboard.dismiss();
      globalKeyboard.showKeyboard({
        fieldId: currentFieldId,
        onKeyPress: handleCustomKeyPress,
        onBackspace: handleCustomBackspace,
        onEnter: handleCustomEnter,
        onTextChange: handleTextChange,
        returnKeyType,
        autoCapitalize,
        enableHapticFeedback,
        showSuggestions,
        theme,
      });
    }
  }, [useCustomKeyboard, onFocus, globalKeyboard, handleCustomKeyPress, handleCustomBackspace, handleCustomEnter, handleTextChange, returnKeyType, autoCapitalize, enableHapticFeedback, showSuggestions, theme, cursorOpacity, currentFieldId]);

  const handleTouchablePress = useCallback(() => {
    if (editable) {
      handleFocus();
    }
  }, [editable, handleFocus]);


  const renderDisplayText = () => {
    // When focused, never show placeholder - always show actual text (even if empty)
    if (isFocused) {
      if (secureTextEntry && !isPasswordVisible && internalValue) {
        return '•'.repeat(internalValue.length);
      }
      return internalValue; // Return actual text, even if empty string
    }

    // When not focused, show placeholder if no text
    if (secureTextEntry && !isPasswordVisible && internalValue) {
      return '•'.repeat(internalValue.length);
    }
    return internalValue || placeholder;
  };

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const getTextColor = () => {
    // When focused, always use text color (never placeholder color)
    if (isFocused) {
      return '#FFFFFF'; // Always text color when focused
    }

    // When not focused, use placeholder color if showing placeholder
    if (!internalValue && placeholder) {
      return '#bbb'; // Placeholder color
    }
    return '#FFFFFF'; // Text color
  };

  return (
    <View style={[{ width: `${widthPercent}%` }, styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <View style={{ height: verticalScale(6) }} />

      {/* Input Container */}
      <TouchableOpacity
        onPress={handleTouchablePress}
        disabled={!editable}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={BLUE_2C_BT.colors}
          start={BLUE_2C_BT.start}
          end={BLUE_2C_BT.end}
          style={[
            styles.inputWrapper,
            {
              borderWidth: moderateScale(2),
              borderColor: isFocused ? "#FD7332" : hasText ? "#FD7332" : "#888888",
              opacity: editable ? 1 : 0.6,
              minHeight: multiline ? verticalScale(80) : verticalScale(44),
            },
          ]}
        >
          <View style={styles.textContainer}>
            <View style={styles.textWithCursor}>
              {/* Text and cursor in same container for precise positioning */}
              <View style={styles.textCursorWrapper}>
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: getTextColor(),
                      fontWeight: hasText ? "400" : "400",
                    },
                    inputStyle,
                  ]}
                  numberOfLines={multiline ? undefined : 1}
                >
                  {renderDisplayText()}
                </Text>
                {/* Blinking Cursor - positioned immediately after text */}
                {isFocused && isGloballyFocused && (
                  <Animated.View
                    style={[
                      styles.cursor,
                      {
                        opacity: cursorOpacity,
                        // Position cursor right after the text with minimal gap
                        marginLeft: internalValue ? moderateScale(-1) : moderateScale(0),
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Password visibility toggle */}
          {secureTextEntry && (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeIconContainer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.eyeIconWrapper}>
                <Image
                  source={require('../../assets/Images/icons/eye.png')}
                  style={[
                    styles.eyeIcon,
                    {
                      opacity: isPasswordVisible ? 0.6 : 1,
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Character count (if maxLength is set) */}
          {maxLength && (
            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {internalValue.length}/{maxLength}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Error Text */}
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <View style={{ height: verticalScale(10) }} />
      )}


      {/* Bottom spacing */}
      <View style={{ height: verticalScale(10) }} />

      {/* Custom Keyboard - Rendered at screen level */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(20),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: "100%",
    paddingHorizontal: moderateScale(8),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(6),
    borderRadius: moderateScale(4),
    position: 'relative',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textWithCursor: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textCursorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputText: {
    fontSize: moderateScale(20),
    lineHeight: moderateScale(24),
    color: "#FFFFFF",
    backgroundColor: "transparent",
    minHeight: moderateScale(20),
    textAlignVertical: 'center',
  },
  characterCount: {
    position: 'absolute',
    bottom: moderateScale(4),
    right: moderateScale(8),
  },
  characterCountText: {
    fontSize: moderateScale(12),
    color: '#888',
  },
  errorText: {
    marginTop: verticalScale(5),
    fontSize: moderateScale(12),
    color: "#EF4444",
    marginBottom: verticalScale(-5),
  },
  eyeIconContainer: {
    position: 'absolute',
    right: moderateScale(4),
    top: '50%',
    transform: [{ translateY: -moderateScale(8) }],
    zIndex: 1,
    overflow: 'visible',
  },
  eyeIconWrapper: {
    width: moderateScale(28),
    height: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  eyeIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  cursor: {
    width: moderateScale(2),
    height: moderateScale(20),
    backgroundColor: "#FD7332", // Orange cursor to match theme
    borderRadius: moderateScale(1), // Slightly rounded cursor
  },
});

export { CustomTextInput };
export default CustomTextInput;