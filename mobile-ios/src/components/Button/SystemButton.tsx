import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
// NOTE: make sure this file does NOT import any barrels that re-export SystemButton.
// If you have a styles/gradients barrel that imports components, import the concrete file instead.
import { ORANGE_TB, ORANGE_LR, BLUE_2C_BT } from "../../styles/gradient";

interface SystemButtonProps {
  label: string;
  active?: boolean; // ← filled gradient when true
  deactivated?: boolean; // ← grey border, disabled state
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleOverride?: number;
}

const { height: screenHeight } = Dimensions.get("window");
const BUTTON_HEIGHT = moderateScale(44); // Match dropdown/TextInput height
const BUTTON_GAP = screenHeight * 0.015;

const rs = (size: number, override?: number) =>
  moderateScale(size) * (override ?? 1);
const rvs = (size: number, override?: number) =>
  verticalScale(size) * (override ?? 1);

const SystemButton: React.FC<SystemButtonProps> = ({
  label,
  active = false,
  deactivated = false,
  onPress,
  style,
  disabled = false,
  scaleOverride = 1,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (onPress && !disabled && !deactivated) onPress();
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const BORDER_RADIUS = rs(24, scaleOverride); // Pill shape
  const BORDER_WIDTH = Math.max(1, rs(2, scaleOverride)); // Match TextInput/Dropdown border width
  const ICON_SIZE = rs(20, scaleOverride);
  const FONT_SIZE = rs(20, scaleOverride); // Match TextInput/Dropdown font size

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
          marginVertical: BUTTON_GAP / 1.5,
          height: BUTTON_HEIGHT,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.88}
        disabled={disabled || deactivated}
        style={styles.touchable}
      >
        {active ? (
          <LinearGradient
            {...ORANGE_TB}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: BORDER_RADIUS,
              paddingHorizontal: rs(20, scaleOverride),
            }}
          >
            <Text
              style={[
                styles.activeText,
                { fontSize: FONT_SIZE, marginRight: rs(4, scaleOverride) },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Image
              source={require("../../assets/Images/icons/pencil_icon_white.png")}
              style={{
                width: ICON_SIZE,
                height: ICON_SIZE,
                marginLeft: rs(12, scaleOverride),
              }}
              resizeMode="contain"
            />
          </LinearGradient>
        ) : deactivated ? (
          <View
            style={{ borderRadius: BORDER_RADIUS, overflow: "hidden", flex: 1 }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: BORDER_RADIUS,
                borderWidth: BORDER_WIDTH,
                borderColor: "#808080",
                overflow: "hidden",
              }}
            >
              <LinearGradient
                {...BLUE_2C_BT}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: rs(20, scaleOverride),
                }}
              >
                <Text
                  style={[
                    styles.inactiveText,
                    { fontSize: FONT_SIZE, marginRight: rs(4, scaleOverride), opacity: 0.6 },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <Image
                  source={require("../../assets/Images/icons/plus_icon_orange_fd7332.png")}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    marginLeft: rs(12, scaleOverride),
                    opacity: 0.6,
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{ borderRadius: BORDER_RADIUS, overflow: "hidden", flex: 1 }}
          >
            <LinearGradient
              {...ORANGE_LR}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={{
                flex: 1,
                margin: BORDER_WIDTH,
                borderRadius: Math.max(0, BORDER_RADIUS - BORDER_WIDTH),
                overflow: "hidden",
              }}
            >
              <LinearGradient
                {...BLUE_2C_BT}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: rs(20, scaleOverride),
                }}
              >
                <Text
                  style={[
                    styles.inactiveText,
                    { fontSize: FONT_SIZE, marginRight: rs(4, scaleOverride) },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                <Image
                  source={require("../../assets/Images/icons/plus_icon_orange_fd7332.png")}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    marginLeft: rs(12, scaleOverride),
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
    flex: 1,
  },
  activeText: {
    fontFamily: "Lato-Regular",
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    flex: 1,
  },
  inactiveText: {
    fontFamily: "Lato-Regular",
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    flex: 1,
  },
});

export default SystemButton;
