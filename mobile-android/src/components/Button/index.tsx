import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Text as RNText,
  GestureResponderEvent,
  DimensionValue,
  StyleProp, // ⬅️ add
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";
import { ORANGE_TB, BLUE_2C_BT } from "../../styles/gradient";

export type ButtonProps = {
  title?: string;
  label?: string;
  children?: React.ReactNode;
  onPress: (e?: GestureResponderEvent) => void;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  selected?: boolean;
  disabled?: boolean;
  deactivated?: boolean; // grey border, disabled state
  color1?: string;
  color2?: string;

  // ✅ allow arrays/numbers for styles
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;

  rounded?: number;

  // ✅ new: so you can pass testID from callers
  testID?: string;
};

const DEFAULT_WIDTH_PX = 200;
const DEFAULT_HEIGHT_PX = 40;

function Button({
  title,
  label,
  children,
  onPress,
  width = DEFAULT_WIDTH_PX,
  height = DEFAULT_HEIGHT_PX,
  selected = false,
  disabled = false,
  deactivated = false,
  color1,
  color2,
  style,
  textStyle,
  labelStyle,
  rounded,
  testID, // ⬅️ add
}: ButtonProps) {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = getStyles({ moderateScale, verticalScale, font });

  const baseGradient = selected ? ORANGE_TB : BLUE_2C_BT;
  const gradientProps =
    color1 && color2
      ? { ...baseGradient, colors: [color1, color2] }
      : baseGradient;

  const computedWidth: DimensionValue =
    typeof width === "string" ? width : moderateScale(width);
  const computedHeight: DimensionValue =
    typeof height === "string" ? height : verticalScale(height);

  // ✅ flatten so array styles are OK
  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;

  const borderRadius = moderateScale(rounded ?? 24); // Pill shape (matches NewExistingToggle)

  // Add border for deactivated or unselected state (matches NewExistingToggle)
  // Active (selected): No border
  // Inactive (unselected): 1px border, #888888 color (matches NewExistingToggle)
  // Deactivated: 1px border, #808080 color (grey)
  const hasBorder = deactivated || !selected;
  const borderWidth = moderateScale(1);

  const wrapperStyle: ViewStyle = {
    width: computedWidth,
    height: computedHeight,
    opacity: disabled || deactivated ? 0.6 : 1,
    ...(flatStyle || {}),
  };

  // Update text color and weight based on selected/deactivated state (matches NewExistingToggle)
  const textColor = deactivated ? "#999999" : (selected ? "#ffffff" : "#bbbbbb");
  const fontWeight = selected ? "700" : "400"; // Bold for selected, normal for unselected (matches NewExistingToggle)
  const mergedTextStyle = [
    styles.text,
    { color: textColor, fontWeight: fontWeight as any },
    textStyle || labelStyle
  ];

  let content: React.ReactNode = null;
  if (children !== undefined && children !== null) {
    content =
      typeof children === "string" || typeof children === "number" ? (
        <RNText style={mergedTextStyle}>{children}</RNText>
      ) : (
        children
      );
  } else {
    const text = title ?? label;
    content = text ? <RNText style={mergedTextStyle}>{text}</RNText> : null;
  }

  // Gradient style - with proper border radius
  const gradientStyle: any = {
    ...styles.gradient,
    borderRadius,
    paddingVertical: selected ? verticalScale(8) : verticalScale(6), // Matches NewExistingToggle padding
    paddingHorizontal: moderateScale(8), // Matches NewExistingToggle padding
  };

  // If border is needed, use nested view approach (matches SystemButton)
  if (hasBorder) {
    const borderColor = deactivated ? "#808080" : "#888888";
    return (
      <View style={wrapperStyle}>
        <View style={{ borderRadius, overflow: "hidden", flex: 1, backgroundColor: borderColor }}>
          <View
            style={{
              flex: 1,
              margin: borderWidth,
              borderRadius: Math.max(0, borderRadius - borderWidth),
              overflow: "hidden",
            }}
          >
            <LinearGradient
              {...gradientProps}
              style={gradientStyle}
            >
              <TouchableOpacity
                testID={testID}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.7}
                style={styles.touchable}
              >
                {content}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  }

  // No border - simple gradient
  return (
    <View style={wrapperStyle}>
      <LinearGradient
        {...gradientProps}
        style={gradientStyle}
      >
        <TouchableOpacity
          testID={testID} // ✅ forward it here
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
          style={styles.touchable}
        >
          {content}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default Button;

export const SmallButton: React.FC<Omit<ButtonProps, "width" | "height">> = (
  props
) => <Button {...props} width={75} height={35} />;
export const MediumButton: React.FC<Omit<ButtonProps, "width" | "height">> = (
  props
) => <Button {...props} width={200} height={40} />;
export const LargeButton: React.FC<Omit<ButtonProps, "width" | "height">> = (
  props
) => <Button {...props} width={320} height={48} />;

const getStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    touchable: {
      flex: 1,
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    text: {
      color: "#ffffff", // Matches NewExistingToggle
      fontSize: moderateScale(18), // Matches NewExistingToggle (was font(20))
      fontWeight: "700", // Will be overridden by mergedTextStyle
      textAlign: "center",
      textAlignVertical: "center",
    },
  });
