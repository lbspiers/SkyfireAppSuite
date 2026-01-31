// Code Input Component
// Advanced 6-digit code input with auto-advance, paste detection, and animations

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  Keyboard,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { moderateScale, verticalScale } from '../utils/responsive';

interface CodeInputProps {
  length?: number;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'number-pad' | 'numeric' | 'default';
  textContentType?: 'oneTimeCode' | 'none';
  style?: ViewStyle;
  cellStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export interface CodeInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

const CodeInput = forwardRef<CodeInputRef, CodeInputProps>(
  (
    {
      length = 6,
      value = '',
      onChangeText,
      onFocus,
      onBlur,
      editable = true,
      autoFocus = false,
      keyboardType = 'number-pad',
      textContentType = 'oneTimeCode',
      style,
      cellStyle,
      textStyle,
    },
    ref
  ) => {
    // State
    const [internalValue, setInternalValue] = useState(value);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Refs
    const hiddenInputRef = useRef<TextInput>(null);
    const cellRefs = useRef<(View | null)[]>([]);
    const cellAnimations = useRef<Animated.Value[]>([]);

    // Initialize animations
    useEffect(() => {
      cellAnimations.current = Array.from({ length }, () => new Animated.Value(1));
    }, [length]);

    // Update internal value when prop changes
    useEffect(() => {
      if (value !== internalValue) {
        setInternalValue(value);
        updateFocusedIndex(value);
      }
    }, [value]);

    // Auto focus on mount
    useEffect(() => {
      if (autoFocus && editable) {
        setTimeout(() => {
          hiddenInputRef.current?.focus();
        }, 100);
      }
    }, [autoFocus, editable]);

    // Imperative handle for parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        hiddenInputRef.current?.focus();
      },
      blur: () => {
        hiddenInputRef.current?.blur();
      },
      clear: () => {
        handleChangeText('');
      },
      isFocused: () => isFocused,
    }));

    // Update focused index based on current value
    const updateFocusedIndex = (currentValue: string) => {
      if (isFocused) {
        const nextEmptyIndex = currentValue.length;
        setFocusedIndex(nextEmptyIndex < length ? nextEmptyIndex : null);
      } else {
        setFocusedIndex(null);
      }
    };

    // Handle text change
    const handleChangeText = (text: string) => {
      // Filter to only allow digits
      const cleanText = text.replace(/[^0-9]/g, '');

      // Limit to specified length
      const limitedText = cleanText.slice(0, length);

      setInternalValue(limitedText);
      onChangeText?.(limitedText);

      // Update focused index
      updateFocusedIndex(limitedText);

      // Animate cells
      animateCells(limitedText);

      // Auto-dismiss keyboard when complete
      if (limitedText.length === length) {
        setTimeout(() => {
          Keyboard.dismiss();
        }, 100);
      }
    };

    // Handle focus
    const handleFocus = () => {
      setIsFocused(true);
      updateFocusedIndex(internalValue);
      onFocus?.();
    };

    // Handle blur
    const handleBlur = () => {
      setIsFocused(false);
      setFocusedIndex(null);
      onBlur?.();
    };

    // Animate cells when value changes
    const animateCells = (currentValue: string) => {
      currentValue.split('').forEach((_, index) => {
        if (cellAnimations.current[index]) {
          Animated.sequence([
            Animated.timing(cellAnimations.current[index], {
              toValue: 1.1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(cellAnimations.current[index], {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    };

    // Handle cell press
    const handleCellPress = (index: number) => {
      if (!editable) return;

      // Focus the hidden input
      hiddenInputRef.current?.focus();

      // Set cursor position
      setTimeout(() => {
        const newValue = internalValue.slice(0, index);
        handleChangeText(newValue);
      }, 50);
    };

    // Render individual cell
    const renderCell = (index: number) => {
      const isActive = focusedIndex === index;
      const isFilled = index < internalValue.length;
      const cellValue = isFilled ? internalValue[index] : '';

      const cellBackground = isActive
        ? 'rgba(253, 115, 50, 0.1)'
        : isFilled
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(255, 255, 255, 0.1)';

      const borderColor = isActive
        ? '#FD7332'
        : isFilled
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(255, 255, 255, 0.3)';

      return (
        <Animated.View
          key={index}
          ref={(el) => (cellRefs.current[index] = el)}
          style={[
            styles.cell,
            cellStyle,
            {
              backgroundColor: cellBackground,
              borderColor: borderColor,
              transform: [{ scale: cellAnimations.current[index] || 1 }],
            },
            !editable && styles.cellDisabled,
          ]}
        >
          <Animated.View
            style={[
              styles.cellContent,
              {
                opacity: isFilled ? 1 : isActive ? 0.5 : 0.3,
              },
            ]}
            onTouchEnd={() => handleCellPress(index)}
          >
            <Animated.Text
              style={[
                styles.cellText,
                textStyle,
                {
                  opacity: isFilled ? 1 : 0,
                },
              ]}
            >
              {cellValue}
            </Animated.Text>

            {/* Cursor indicator */}
            {isActive && !isFilled && (
              <Animated.View
                style={[
                  styles.cursor,
                  {
                    opacity: new Animated.Value(1),
                  },
                ]}
              />
            )}
          </Animated.View>
        </Animated.View>
      );
    };

    return (
      <View style={[styles.container, style]}>
        {/* Hidden input for actual text input */}
        <TextInput
          ref={hiddenInputRef}
          style={styles.hiddenInput}
          value={internalValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete="sms-otp"
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={length}
          editable={editable}
          selectTextOnFocus
          caretHidden
        />

        {/* Visible cells */}
        <View style={styles.cellsContainer}>
          {Array.from({ length }, (_, index) => renderCell(index))}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: moderateScale(1),
    height: verticalScale(1),
    opacity: 0,
    zIndex: -1,
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    width: moderateScale(45),
    height: verticalScale(55),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(2),
    marginHorizontal: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cellDisabled: {
    opacity: 0.6,
  },
  cellContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cellText: {
    fontSize: moderateScale(24),
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cursor: {
    position: 'absolute',
    width: moderateScale(2),
    height: moderateScale(24),
    backgroundColor: '#FD7332',
    borderRadius: moderateScale(1),
  },
});

// Start cursor blinking animation
const startCursorAnimation = (cursorAnim: Animated.Value) => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(cursorAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cursorAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  ).start();
};

CodeInput.displayName = 'CodeInput';

export default CodeInput;