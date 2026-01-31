import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { BLUE_2C_BT } from "../../styles/gradient";

interface LandingOptionButtonProps {
  label: string;
  description?: string;
  highlighted?: boolean;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const LandingOptionButton: React.FC<LandingOptionButtonProps> = ({
  label,
  description,
  highlighted = false,
  selected = false,
  onPress,
  disabled = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const BORDER_RADIUS = moderateScale(8);
  const BORDER_WIDTH = moderateScale(2);

  // Color schemes
  const backgroundColor = highlighted
    ? "rgba(16, 185, 129, 0.15)" // Green tint for AC coupling/SMS
    : "rgba(12, 31, 63, 0.5)"; // Standard blue

  const borderColor = selected
    ? "#FD7332" // Orange when selected
    : highlighted
    ? "#10B981" // Green when highlighted
    : "#888888"; // Grey default

  const iconColor = highlighted ? "#10B981" : "#FD7332";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.88}
        disabled={disabled}
        style={styles.touchable}
      >
        <LinearGradient
          {...BLUE_2C_BT}
          style={[
            styles.gradient,
            {
              borderRadius: BORDER_RADIUS,
              borderWidth: BORDER_WIDTH,
              borderColor,
              backgroundColor,
            },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                {highlighted && <View style={styles.highlightDot} />}
              </View>
              {description && (
                <Text style={styles.description}>{description}</Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: moderateScale(6),
  },
  touchable: {
    width: "100%",
  },
  gradient: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(2),
  },
  label: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  highlightDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#10B981",
    marginLeft: moderateScale(8),
  },
  description: {
    fontSize: moderateScale(14),
    fontWeight: "400",
    color: "#A0AEC0",
  },
});

export default LandingOptionButton;
