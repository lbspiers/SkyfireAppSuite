import React from "react";
import { ViewStyle, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";
import { colors, radius, spacing } from "../../theme/tokens/tokens";

interface CardContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardContainer: React.FC<CardContainerProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={[colors.bgElevated, colors.bgSurface]}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(10),
    padding: moderateScale(spacing.base),
    marginBottom: verticalScale(spacing.base),
    borderWidth: moderateScale(1),
    borderColor: colors.borderDefault,
  },
});

export default CardContainer;
