// ReviewRadialButton.tsx - Custom radial button for ReviewPage with right-aligned label and Sky logo
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale } from "../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../styles/gradient";

export interface ReviewRadialButtonProps {
  /** Text label shown to the right of the circle */
  label: string;
  /** Controlled selected state */
  selected: boolean;
  /** Called when the button is pressed */
  onToggle: (isOn: boolean) => void;
  /** Optional container styling */
  style?: ViewStyle;
  /** Optional label text styling */
  labelStyle?: TextStyle;
  /** Diameter of the circle in pixels - defaults to 40 (scaled) */
  size?: number;
  /** Disabled state */
  disabled?: boolean;
}

const ReviewRadialButton: React.FC<ReviewRadialButtonProps> = ({
  label,
  selected,
  onToggle,
  style,
  labelStyle,
  size = moderateScale(40),
  disabled = false,
}) => {
  const handlePress = () => {
    if (disabled) return;
    onToggle(!selected);
  };

  const gradient = selected ? ORANGE_TB : BLUE_2C_BT;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, style]}
      disabled={disabled}
    >
      {/* Circle with optional Sky logo */}
      <View
        style={[
          styles.borderContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          !selected && {
            borderWidth: moderateScale(2),
            borderColor: "#888888",
          },
          disabled && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={[
            styles.circle,
            {
              width: "100%",
              height: "100%",
              borderRadius: size / 2,
            },
          ]}
        >
          {/* Show Sky logo when selected */}
          {selected && (
            <Image
              source={require("../../assets/Images/appIcon.png")}
              style={[
                styles.logo,
                {
                  width: size * 0.6,
                  height: size * 0.6,
                },
              ]}
              tintColor="#FFFFFF"
            />
          )}
        </LinearGradient>
      </View>

      {/* Label to the right */}
      <Text
        style={[
          styles.label,
          disabled && styles.disabledLabel,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  borderContainer: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    resizeMode: "contain",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 20, // Match address size from LargeHeader (font(20))
    fontWeight: "400", // Regular to match Lato-Regular
    marginLeft: 12,
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledLabel: {
    color: "rgba(255, 255, 255, 0.5)",
  },
});

export default ReviewRadialButton;
