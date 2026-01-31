// src/components/NumericKeypad.tsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Vibration,
  TouchableNativeFeedback,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../utils/responsive";
import { ORANGE_TB, ORANGE_LR, BLUE_2C_BT } from "../styles/gradient";

type NumericKeypadProps = {
  isVisible: boolean;
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  onClose: () => void; // acts as "Confirm" ✓
  currentValue: string;
  /** optional dynamic title, e.g., "Azimuth" or "Array 3" (defaults to "Quantity") */
  title?: string;
};

const SMOOTH_GRADIENT = ["#2E4161", "#1D3050", "#0C1F3F"]; // Matches CustomKeyboard background
const KEY_FLAT_GRAY = ['#4A5568', '#4A5568']; // Matches CustomKeyboard flat gray keys
const KEY_FLAT_RED = ["#E53E3E", "#E53E3E"]; // Matches CustomKeyboard backspace

const KEYS: Array<
  Array<
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "0"
    | "backspace"
    | "close"
  >
> = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["backspace", "0", "close"],
];

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  isVisible,
  onNumberPress,
  onBackspace,
  onClose,
  currentValue,
  title = "Quantity",
}) => {
  const { moderateScale: rs, verticalScale: vs, font: rf } = useResponsive();
  const { width: screenWidth } = Dimensions.get("window");

  // a bit wider/taller but capped for small screens
  const CARD_WIDTH = Math.min(screenWidth * 0.94, rs(380));
  const HEADER_HEIGHT = vs(72);

  // entrance/exit animation
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          bounciness: 7,
          speed: 14,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [isVisible, opacity, scale]);

  const displayValue = useMemo(() => currentValue || "0", [currentValue]);

  // Haptic feedback handler - disabled per user request
  const handleHapticFeedback = useCallback(() => {
    // Vibration disabled - user feedback indicated it was too aggressive
    // if (Platform.OS === 'ios') {
    //   Vibration.vibrate(1);
    // } else if (Platform.OS === 'android') {
    //   Vibration.vibrate(15);
    // }
  }, []);

  // Key (with press animation + haptic feedback + optional long-press clear on backspace)
  const Key: React.FC<{
    label: string;
    variant?: "number" | "backspace" | "close";
    onPress: () => void;
    onLongPress?: () => void;
  }> = ({ label, variant = "number", onPress, onLongPress }) => {
    const press = useRef(new Animated.Value(0)).current;

    const down = () => {
      handleHapticFeedback();
      Animated.spring(press, {
        toValue: 1,
        useNativeDriver: true,
        tension: Platform.OS === 'ios' ? 150 : 100,
        friction: Platform.OS === 'ios' ? 5 : 3,
      }).start();
    };

    const up = () =>
      Animated.spring(press, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();

    const s = press.interpolate({ inputRange: [0, 1], outputRange: [1, Platform.OS === 'ios' ? 0.97 : 0.95] });
    const bgOpacity = press.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.15],
    });

    // Android version with ripple effect
    if (Platform.OS === 'android') {
      return (
        <Animated.View style={[{ flex: 1, marginHorizontal: rs(6), transform: [{ scale: s }] }]}>
          <TouchableNativeFeedback
            onPressIn={down}
            onPressOut={up}
            onPress={onPress}
            onLongPress={onLongPress}
            delayLongPress={350}
            background={TouchableNativeFeedback.Ripple('rgba(253, 115, 50, 0.3)', false)}
          >
            <View
              style={[
                styles.keyBase,
                { borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4), paddingVertical: vs(20) },
              ]}
            >
              <LinearGradient
                colors={variant === "backspace" ? KEY_FLAT_RED : KEY_FLAT_GRAY}
                style={[StyleSheet.absoluteFillObject, { borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4) }]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "#ffffff",
                    opacity: bgOpacity,
                    borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4),
                  },
                ]}
              />
              <View>
                <Text
                  style={[
                    styles.keyText,
                    {
                      fontSize: rf(24),
                      color: "#fff",
                      ...(variant === "close" ? { fontWeight: "800" } : null),
                    },
                  ]}
                >
                  {variant === "backspace"
                    ? "⌫"
                    : variant === "close"
                    ? "✓"
                    : label}
                </Text>
              </View>
            </View>
          </TouchableNativeFeedback>
        </Animated.View>
      );
    }

    // iOS version with TouchableOpacity
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={down}
        onPressOut={up}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={{ flex: 1, marginHorizontal: rs(6) }}
      >
        <Animated.View style={{ transform: [{ scale: s }] }}>
          <View
            style={[
              styles.keyBase,
              { borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4), paddingVertical: vs(20) },
            ]}
          >
            <LinearGradient
              colors={variant === "backspace" ? KEY_FLAT_RED : KEY_FLAT_GRAY}
              style={[StyleSheet.absoluteFillObject, { borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4) }]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "#ffffff",
                  opacity: bgOpacity,
                  borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4),
                },
              ]}
            />
            <View>
              <Text
                style={[
                  styles.keyText,
                  {
                    fontSize: rf(24),
                    color: "#fff",
                    ...(variant === "close" ? { fontWeight: "800" } : null),
                  },
                ]}
              >
                {variant === "backspace"
                  ? "⌫"
                  : variant === "close"
                  ? "✓"
                  : label}
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (!isVisible) return null;

  // long-press backspace clears
  const handleBackspaceLong = () => {
    const times = Math.max(1, displayValue.length);
    for (let i = 0; i < times; i++) onBackspace();
  };

  // Close button component (extracted to avoid hooks issue)
  const CloseButton: React.FC = () => {
    const closePress = useRef(new Animated.Value(0)).current;

    const closeDown = () => {
      handleHapticFeedback();
      Animated.spring(closePress, {
        toValue: 1,
        useNativeDriver: true,
        tension: Platform.OS === 'ios' ? 150 : 100,
        friction: Platform.OS === 'ios' ? 5 : 3,
      }).start();
    };

    const closeUp = () =>
      Animated.spring(closePress, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();

    const closeScale = closePress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, Platform.OS === 'ios' ? 0.97 : 0.95],
    });

    // Android version with ripple
    if (Platform.OS === 'android') {
      return (
        <Animated.View style={[{ flex: 1, marginHorizontal: rs(6), transform: [{ scale: closeScale }] }]}>
          <TouchableNativeFeedback
            onPressIn={closeDown}
            onPressOut={closeUp}
            onPress={onClose}
            background={TouchableNativeFeedback.Ripple('rgba(255, 255, 255, 0.3)', false)}
          >
            <View style={{ borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4), overflow: "hidden" }}>
              <LinearGradient
                {...ORANGE_TB}
                style={{
                  paddingVertical: vs(20),
                  alignItems: "center",
                  borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4),
                  borderWidth: 0.5,
                  borderColor: "rgba(253, 115, 50, 0.3)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text
                  style={[
                    styles.keyText,
                    {
                      fontSize: rf(24),
                      fontWeight: "800",
                      color: "#fff",
                    },
                  ]}
                >
                  ✓
                </Text>
              </LinearGradient>
            </View>
          </TouchableNativeFeedback>
        </Animated.View>
      );
    }

    // iOS version
    return (
      <TouchableOpacity
        style={{ flex: 1, marginHorizontal: rs(6) }}
        onPressIn={closeDown}
        onPressOut={closeUp}
        onPress={onClose}
        activeOpacity={1}
      >
        <Animated.View style={{ transform: [{ scale: closeScale }] }}>
          <View style={{ borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4), overflow: "hidden" }}>
            <LinearGradient
              {...ORANGE_TB}
              style={{
                paddingVertical: vs(20),
                alignItems: "center",
                borderRadius: Platform.OS === 'ios' ? rs(5) : rs(4),
                borderWidth: 0.5,
                borderColor: "rgba(253, 115, 50, 0.3)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text
                style={[
                  styles.keyText,
                  {
                    fontSize: rf(24),
                    fontWeight: "800",
                    color: "#fff",
                  },
                ]}
              >
                ✓
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <View style={{ borderRadius: rs(20), overflow: "visible" }}>
            <LinearGradient
              {...ORANGE_LR}
              style={{
                padding: rs(3), // slightly thicker ring
                borderRadius: rs(20),
                shadowColor: "#000",
                shadowOpacity: 0.35,
                shadowRadius: rs(14),
                shadowOffset: { width: 0, height: rs(7) },
                elevation: 18,
              }}
            >
              {/* card */}
              <LinearGradient
                colors={SMOOTH_GRADIENT}
                style={[
                  styles.container,
                  {
                    borderRadius: rs(18),
                    padding: rs(18),
                    width: CARD_WIDTH,
                  },
                ]}
              >
                {/* Header */}
                <View
                  style={[
                    styles.header,
                    { height: HEADER_HEIGHT, marginBottom: vs(12) },
                  ]}
                >
                  <LinearGradient
                    {...BLUE_2C_BT}
                    style={{
                      position: "absolute",
                      left: -rs(18),
                      right: -rs(18),
                      top: -rs(18),
                      height: HEADER_HEIGHT,
                      borderTopLeftRadius: rs(18),
                      borderTopRightRadius: rs(18),
                    }}
                  />
                  <Text
                    style={[styles.headerText, { fontSize: rf(22) }]}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.headerClose, { fontSize: rf(34) }]}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Display */}
                <View
                  style={[
                    styles.display,
                    {
                      borderRadius: rs(12),
                      paddingVertical: vs(12),
                      paddingHorizontal: rs(12),
                    },
                  ]}
                >
                  <Text style={[styles.displayText, { fontSize: rf(34) }]}>
                    {displayValue}
                  </Text>
                </View>

                {/* Keypad */}
                <View style={{ width: "100%", marginTop: vs(12) }}>
                  {KEYS.map((row, i) => (
                    <View
                      key={i}
                      style={[styles.row, { marginBottom: vs(12) }]}
                    >
                      {row.map((key) => {
                        if (key === "backspace")
                          return (
                            <Key
                              key={key}
                              label={key}
                              variant="backspace"
                              onPress={onBackspace}
                              onLongPress={handleBackspaceLong}
                            />
                          );
                        if (key === "close")
                          return <CloseButton key={key} />;
                        return (
                          <Key
                            key={key}
                            label={key}
                            variant="number"
                            onPress={() => onNumberPress(key)}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Hint */}
                <Text
                  style={{
                    marginTop: vs(4),
                    color: "rgba(255,255,255,0.55)",
                    fontSize: rf(13),
                    textAlign: "center",
                  }}
                >
                  Tap ✓ to apply • long-press ⌫ to clear
                </Text>
              </LinearGradient>
            </LinearGradient>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.46)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
  },
  header: {
    width: "100%",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
    fontWeight: "700",
  },
  headerClose: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontWeight: "700",
    marginLeft: 8,
  },
  display: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#111924",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  displayText: {
    color: "#FFFFFF",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  keyBase: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(253, 115, 50, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  keyText: {
    fontFamily: "Lato-Bold",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default NumericKeypad;
