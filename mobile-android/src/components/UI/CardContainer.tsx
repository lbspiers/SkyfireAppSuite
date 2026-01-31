import React from "react";
import { ViewStyle, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { moderateScale, verticalScale } from "../../utils/responsive";

interface CardContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const CardContainer: React.FC<CardContainerProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={["#334A66", "#223347"]}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    borderWidth: moderateScale(1),
    borderColor: "#445066",
  },
});

export default CardContainer;
