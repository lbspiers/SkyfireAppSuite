// src/components/CustomKeyboard/KeyboardKey.tsx
import React, { useState, useRef, useCallback, memo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Image,
  View,
  TouchableNativeFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { KeyData, KeyType, ReturnKeyType, KeyboardTheme } from './types';
import { ORANGE_TB, BLUE_2C_BT } from '../../styles/gradient';

interface KeyboardKeyProps {
  keyData: KeyData;
  onPress: (key: string, keyType: KeyType) => void;
  screenWidth: number;
  isShiftActive: boolean;
  isCapsLock: boolean;
  isSymbolMode: boolean;
  returnKeyType: ReturnKeyType;
  theme: KeyboardTheme;
}

const BRAND_ORANGE = "#FD7332";
const BRAND_BLUE = "#0C1F3F";
// const KEY_GRADIENT_NORMAL = ["#4A5568", "#2D3748"]; // Commented out to try BLUE_2C_BT
const KEY_GRADIENT_NORMAL = BLUE_2C_BT.colors; // Using BLUE_2C_BT gradient
const KEY_GRADIENT_PRESSED = ["#FD7332", "#E53E3E"];
const KEY_GRADIENT_SPECIAL = ["#FD7332", "#DD6B20"];
const ORANGE_GRADIENT = ORANGE_TB.colors; // Using ORANGE_TB gradient

function KeyboardKey({
  keyData,
  onPress,
  screenWidth,
  isShiftActive,
  isCapsLock,
  isSymbolMode,
  returnKeyType,
  theme,
}: KeyboardKeyProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Calculate key width based on screen width and key data - edge to edge responsive
  const totalHorizontalPadding = moderateScale(12); // Total padding for keyboard container
  const keyGap = moderateScale(4); // Gap between keys
  const availableWidth = screenWidth - totalHorizontalPadding - (keyGap * 9);
  const baseKeyWidth = availableWidth / 10; // Base for 10 keys per row

  // Responsive key width with min/max constraints
  const minKeyWidth = screenWidth < 350 ? 28 : 32; // Smaller min for very small screens
  const maxKeyWidth = screenWidth > 500 ? 60 : 50; // Larger max for tablets

  // Special case for space bar, backspace, and caps lock - allow them to be larger than normal max
  // Platform-specific key width with improved multipliers
  const keyWidth = ['space', 'backspace', 'caps', 'enter'].includes(keyData.type)
    ? Math.max(baseKeyWidth * (keyData.width || 1), minKeyWidth)
    : Math.min(Math.max(baseKeyWidth * (keyData.width || 1), minKeyWidth), maxKeyWidth);

  const getDisplayText = useCallback(() => {
    // For special keys with labels
    if (keyData.label) {
      if (keyData.type === 'enter') {
        const labels = {
          done: 'Done',
          send: 'Send',
          search: 'Search',
          next: 'Next',
          go: 'Go',
        };
        return labels[returnKeyType] || 'Done';
      }
      return keyData.label;
    }

    // For shift key, show state
    if (keyData.type === 'shift') {
      return isCapsLock ? 'CAPS' : isShiftActive ? 'SHIFT' : 'shift';
    }

    // For caps lock key
    if (keyData.type === 'caps') {
      return keyData.label || '⬆';
    }

    // For symbol key
    if (keyData.type === 'symbol') {
      return isSymbolMode ? 'ABC' : (keyData.label || '#@$');
    }

    // For character keys
    if (keyData.secondary && (isShiftActive || isCapsLock || isSymbolMode)) {
      return keyData.secondary;
    }

    return keyData.primary;
  }, [keyData, isShiftActive, isCapsLock, isSymbolMode, returnKeyType]);

  const getKeyGradient = useCallback(() => {
    if (isPressed) {
      return KEY_GRADIENT_PRESSED;
    }

    // Flatter styling for more native feel - using solid-like gradients
    switch (keyData.type) {
      case 'caps':
        return isCapsLock ? ORANGE_TB.colors : ['#4A5568', '#4A5568']; // Flat when not active
      case 'symbol':
      case 'enter':
        return ORANGE_TB.colors; // Keep gradient for primary action keys
      case 'backspace':
        return ["#E53E3E", "#E53E3E"]; // Flat red
      default:
        return ['#4A5568', '#4A5568']; // Flat gray for normal keys
    }
  }, [isPressed, keyData.type, isShiftActive, isCapsLock]);

  const getTextColor = useCallback(() => {
    if (keyData.type === 'caps' && isCapsLock) {
      return '#FFFFFF';
    }
    if (['symbol', 'enter', 'backspace', 'caps'].includes(keyData.type)) {
      return '#FFFFFF';
    }
    return '#FFFFFF';
  }, [keyData.type, isCapsLock]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    // Platform-specific press animation - iOS uses subtle scale, Android could use ripple
    Animated.spring(scaleAnim, {
      toValue: Platform.OS === 'ios' ? 0.97 : 0.95,
      useNativeDriver: true,
      tension: Platform.OS === 'ios' ? 150 : 100,
      friction: Platform.OS === 'ios' ? 5 : 3,
    }).start();

    // Handle long press for backspace - platform-specific timing
    if (keyData.type === 'backspace') {
      const initialDelay = Platform.OS === 'ios' ? 400 : 500;
      const repeatInterval = Platform.OS === 'ios' ? 80 : 100;

      longPressTimer.current = setTimeout(() => {
        // Start repeating backspace
        const repeatBackspace = () => {
          onPress(keyData.primary, keyData.type);
          longPressTimer.current = setTimeout(repeatBackspace, repeatInterval);
        };
        repeatBackspace();
      }, initialDelay);
    }
  }, [scaleAnim, keyData, onPress]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 3,
    }).start();

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    const keyToSend = keyData.secondary && (isShiftActive || isCapsLock || isSymbolMode)
      ? keyData.secondary
      : keyData.primary;

    onPress(keyToSend, keyData.type);
  }, [keyData, isShiftActive, isCapsLock, isSymbolMode, onPress]);

  const renderKeyContent = () => {
    // For backspace, show arrow icon (no rotation, facing left)
    if (keyData.type === 'backspace') {
      return (
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/Images/icons/Arrow_2_White_FFFFFF.png')}
            style={[
              styles.backspaceIcon,
              {
                tintColor: '#FFFFFF', // White tint for visibility
              }
            ]}
          />
        </View>
      );
    }

    // For caps lock, show rotated arrow icon
    if (keyData.type === 'caps') {
      const rotation = isCapsLock ? '270deg' : '90deg'; // Down when on (270°), up when off (90°)
      return (
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/Images/icons/Arrow_2_White_FFFFFF.png')}
            style={[
              styles.capsIcon,
              {
                transform: [{ rotate: rotation }],
                tintColor: '#FFFFFF', // White tint for visibility
              }
            ]}
          />
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.keyText,
          {
            color: getTextColor(),
            fontSize: keyData.type === 'caps' ? moderateScale(24) :
                     keyData.type === 'character' ? moderateScale(22) :
                     keyData.type === 'space' ? moderateScale(18) :
                     keyData.type === 'symbol' ? moderateScale(18) :
                     keyData.type === 'punctuation' ? moderateScale(22) : moderateScale(16),
            fontWeight: Platform.OS === 'ios'
              ? (keyData.type === 'character' ? '300' : ['symbol', 'enter', 'caps'].includes(keyData.type) ? '500' : '400')
              : (['symbol', 'enter', 'caps'].includes(keyData.type) ? '600' : '400'),
          }
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {getDisplayText()}
      </Text>
    );
  };

  // Render differently for Android vs iOS to properly support ripple effect
  if (Platform.OS === 'android') {
    return (
      <Animated.View
        style={[
          styles.keyContainer,
          {
            width: keyWidth,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableNativeFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          background={TouchableNativeFeedback.Ripple('rgba(253, 115, 50, 0.3)', false)}
          accessible={true}
          accessibilityLabel={getDisplayText()}
          accessibilityRole="button"
        >
          <View style={styles.touchable}>
            <LinearGradient
              colors={getKeyGradient()}
              style={[
                styles.keyButton,
                {
                  borderColor: isPressed ? BRAND_ORANGE : 'rgba(253, 115, 50, 0.3)',
                },
              ]}
              start={BLUE_2C_BT.start}
              end={BLUE_2C_BT.end}
            >
              {renderKeyContent()}
            </LinearGradient>
          </View>
        </TouchableNativeFeedback>
      </Animated.View>
    );
  }

  // iOS implementation with TouchableOpacity
  return (
    <Animated.View
      style={[
        styles.keyContainer,
        {
          width: keyWidth,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        accessible={true}
        accessibilityLabel={getDisplayText()}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={getKeyGradient()}
          style={[
            styles.keyButton,
            {
              borderColor: isPressed ? BRAND_ORANGE : 'rgba(253, 115, 50, 0.3)',
            },
          ]}
          start={BLUE_2C_BT.start}
          end={BLUE_2C_BT.end}
        >
          {renderKeyContent()}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keyContainer: {
    height: Platform.OS === 'ios' ? Math.max(verticalScale(44), 44) : Math.max(verticalScale(50), 50),
    minHeight: Platform.OS === 'ios' ? 44 : 50,
    overflow: 'visible',
  },
  touchable: {
    flex: 1,
    overflow: 'visible',
  },
  keyButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Platform.OS === 'ios' ? moderateScale(5) : moderateScale(4),
    borderWidth: 0.5,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  keyText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  keyIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#FFFFFF',
  },
  backspaceIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    resizeMode: 'contain',
  },
  capsIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    resizeMode: 'contain',
  },
  iconContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});

// Export memoized version to prevent unnecessary re-renders
// Only re-render if props actually change
export default memo(KeyboardKey, (prevProps, nextProps) => {
  return (
    prevProps.keyData.primary === nextProps.keyData.primary &&
    prevProps.keyData.type === nextProps.keyData.type &&
    prevProps.isShiftActive === nextProps.isShiftActive &&
    prevProps.isCapsLock === nextProps.isCapsLock &&
    prevProps.isSymbolMode === nextProps.isSymbolMode &&
    prevProps.returnKeyType === nextProps.returnKeyType &&
    prevProps.screenWidth === nextProps.screenWidth &&
    prevProps.theme === nextProps.theme
  );
});