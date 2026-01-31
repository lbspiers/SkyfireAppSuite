// src/components/CustomKeyboard/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { BLUE_2C_BT } from '../../styles/gradient';

import KeyboardKey from './KeyboardKey';
import { KeyboardLayout, getKeyboardLayout } from './KeyboardLayout';
import { KeyboardState, KeyType } from './types';

export interface CustomKeyboardProps {
  fieldId?: string;
  onKeyPress?: (key: string) => void;
  onTextChange?: (text: string) => void;
  onBackspace?: () => void;
  onEnter?: () => void;
  returnKeyType?: 'done' | 'send' | 'search' | 'next' | 'go';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  enableHapticFeedback?: boolean;
  showSuggestions?: boolean;
  theme?: 'dark' | 'light';
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

const SMOOTH_GRADIENT = ["#2E4161", "#1D3050", "#0C1F3F"];
const BRAND_ORANGE = "#FD7332";

export default function CustomKeyboard({
  fieldId,
  onKeyPress,
  onTextChange,
  onBackspace,
  onEnter,
  returnKeyType = 'done',
  autoCapitalize = 'sentences',
  enableHapticFeedback = true,
  showSuggestions = false,
  theme = 'dark',
  visible = true,
  onVisibilityChange,
}: CustomKeyboardProps) {
  // Initialize shift state based on autoCapitalize setting
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isShiftActive: autoCapitalize !== 'none',
    isCapsLock: autoCapitalize === 'characters',
    isSymbolMode: false,
  });
  const [characterCount, setCharacterCount] = useState(0);
  const [lastCharacter, setLastCharacter] = useState('');

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const slideAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const insets = useSafeAreaInsets();

  // Listen for dimension changes (orientation, screen size)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Animation for keyboard show/hide - platform-specific timing
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: Platform.OS === 'ios' ? 300 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  // Reset keyboard state when keyboard becomes visible OR autoCapitalize changes (new field)
  useEffect(() => {
    if (visible) {
      setKeyboardState({
        isShiftActive: autoCapitalize !== 'none',
        isCapsLock: autoCapitalize === 'characters',
        isSymbolMode: false,
      });
      setCharacterCount(0);
      setLastCharacter('');
    }
  }, [visible, autoCapitalize]);

  // Reset when fieldId changes (new field focused) even if keyboard is already visible
  useEffect(() => {
    setKeyboardState({
      isShiftActive: autoCapitalize !== 'none',
      isCapsLock: autoCapitalize === 'characters',
      isSymbolMode: false,
    });
    setCharacterCount(0);
    setLastCharacter('');
  }, [fieldId, autoCapitalize]);


  const handleHapticFeedback = useCallback(() => {
    if (!enableHapticFeedback) return;

    if (Platform.OS === 'ios') {
      // For iOS, use very light vibration (1ms - nearly instantaneous tap feedback)
      Vibration.vibrate(1);
    } else if (Platform.OS === 'android') {
      // For Android, use slightly stronger vibration (15ms more noticeable)
      Vibration.vibrate(15);
    }
  }, [enableHapticFeedback]);


  const handleKeyPress = useCallback((key: string, keyType: KeyType) => {
    handleHapticFeedback();

    switch (keyType) {
      case 'character':
      case 'punctuation':
        let char = key;

        // Apply case logic for characters only
        if (keyType === 'character' && (keyboardState.isCapsLock || keyboardState.isShiftActive)) {
          char = char.toUpperCase();
        }

        // Track character for auto-capitalization logic
        setCharacterCount(prev => prev + 1);
        setLastCharacter(char);

        onKeyPress?.(char);

        // Handle shift state AFTER sending the character
        // This ensures the current character uses the correct case before changing state
        if (keyboardState.isShiftActive && !keyboardState.isCapsLock) {
          // Immediately reset shift after use (don't use setTimeout)
          setKeyboardState(prev => ({
            ...prev,
            isShiftActive: false,
          }));
        }

        // Only auto-activate shift for specific scenarios
        // Use a slight delay to allow state to settle
        const shouldAutoShift = (() => {
          if (autoCapitalize === 'none') return false;
          if (autoCapitalize === 'characters') return true; // Always caps

          // For 'words' mode: only activate after space or dash
          if (autoCapitalize === 'words') {
            return char === ' ' || char === '-';
          }

          // For 'sentences' mode: only activate after sentence-ending punctuation followed by space
          if (autoCapitalize === 'sentences') {
            return char === '.' || char === '!' || char === '?';
          }

          return false;
        })();

        if (shouldAutoShift && !keyboardState.isCapsLock) {
          // Very brief delay to ensure state updates properly
          setTimeout(() => {
            setKeyboardState(prev => ({
              ...prev,
              isShiftActive: true,
            }));
          }, 10);
        }
        break;

      case 'backspace':
        onBackspace?.();

        // Update character tracking on backspace
        setCharacterCount(prev => {
          const newCount = Math.max(0, prev - 1);
          // If we're back to the beginning, activate shift for first character
          if (newCount === 0 && autoCapitalize !== 'none' && !keyboardState.isCapsLock) {
            setTimeout(() => {
              setKeyboardState(prevState => ({
                ...prevState,
                isShiftActive: true,
              }));
            }, 10);
          }
          return newCount;
        });
        break;

      case 'caps':
        setKeyboardState(prev => ({
          ...prev,
          isCapsLock: !prev.isCapsLock, // Toggle caps lock
          isShiftActive: !prev.isCapsLock, // Set shift state to match caps lock
        }));
        break;

      case 'symbol':
        setKeyboardState(prev => ({
          ...prev,
          isSymbolMode: !prev.isSymbolMode,
        }));
        break;

      case 'space':
        setCharacterCount(prev => prev + 1);
        setLastCharacter(' ');
        onKeyPress?.(' ');

        // Auto-activate shift after space in specific modes
        if (autoCapitalize === 'words' ||
            (autoCapitalize === 'sentences' && (lastCharacter === '.' || lastCharacter === '!' || lastCharacter === '?'))) {
          setTimeout(() => {
            setKeyboardState(prev => ({
              ...prev,
              isShiftActive: !prev.isCapsLock,
            }));
          }, 10);
        }
        break;

      case 'enter':
        onEnter?.();
        break;

      default:
        onKeyPress?.(key);
        break;
    }
  }, [keyboardState, handleHapticFeedback, onKeyPress, onBackspace, onEnter]);

  const layout = getKeyboardLayout(keyboardState.isSymbolMode, keyboardState.isShiftActive);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom, // Position above navigation bar
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
          opacity: slideAnim,
        },
      ]}
    >
      <LinearGradient
        colors={SMOOTH_GRADIENT}
        style={styles.keyboardContainer}
      >
        {/* Suggestion bar (if enabled) */}
        {showSuggestions && (
          <View style={styles.suggestionBar}>
            <Text style={styles.suggestionText}>Suggestions would go here</Text>
          </View>
        )}

        {/* Keyboard rows */}
        <View style={styles.keyboardRows}>
          {layout.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keyRow}>
              {row.map((keyData, keyIndex) => (
                <KeyboardKey
                  key={`${rowIndex}-${keyIndex}`}
                  keyData={keyData}
                  onPress={handleKeyPress}
                  screenWidth={screenDimensions.width}
                  isShiftActive={keyboardState.isShiftActive}
                  isCapsLock={keyboardState.isCapsLock}
                  isSymbolMode={keyboardState.isSymbolMode}
                  returnKeyType={returnKeyType}
                  theme={theme}
                />
              ))}
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    maxWidth: Dimensions.get('window').width,
    zIndex: 999999, // Extremely high z-index to render above dropdown menus
    elevation: 999, // Android elevation
    margin: 0,
    padding: 0,
  },
  keyboardContainer: {
    paddingHorizontal: moderateScale(3),
    paddingTop: verticalScale(8),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(8),
    width: '100%',
    alignSelf: 'stretch',
  },
  suggestionBar: {
    height: verticalScale(35),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: verticalScale(8),
    marginHorizontal: moderateScale(6),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
  },
  keyboardRows: {
    gap: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(6),
    width: '100%',
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? moderateScale(5) : moderateScale(3),
    paddingHorizontal: moderateScale(2),
  },
});

export { CustomKeyboard };
export default CustomKeyboard;