// src/components/Header/SmallHeader.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useResponsive } from "../../utils/responsive";
import { BLUE_LIGHT_MD_TB, ORANGE_LR } from "../../styles/gradient";
import FlameToggleButton from "../FlameToggleButton";

interface SmallHeaderProps {
  title: string;
  subtitle?: string;
  onDrawerPress: () => void;
}

export default function SmallHeader({
  title,
  subtitle,
  onDrawerPress,
}: SmallHeaderProps) {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  return (
    <>
      {/* Make the status bar translucent so our gradient shows behind it */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient {...BLUE_LIGHT_MD_TB} style={styles.container}>
        {/* Title + drawer icon row */}
        <View style={styles.row}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.flameContainer}>
            <FlameToggleButton top={0} right={0} />
          </View>
        </View>

        {/* Bottom separator */}
        <LinearGradient
          {...ORANGE_LR}
          start={ORANGE_LR.start}
          end={ORANGE_LR.end}
          locations={[0, 1]}
          style={styles.separator}
        />
      </LinearGradient>
    </>
  );
}

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    container: {
      width: "100%",
      // Push content down by the status bar height so the gradient
      // fills behind the notch/status bar on both platforms
      paddingTop: StatusBar.currentHeight || verticalScale(35),
      paddingBottom: verticalScale(10),
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: moderateScale(20),
      marginBottom: verticalScale(5),
      // No extra top spacer needed
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: font(28),
      color: "#FFF",
      fontWeight: "700" as any,
      fontFamily: "Lato-Bold",
    },
    subtitle: {
      fontSize: font(28),
      color: "#FD7332",
      fontWeight: "400" as any,
      fontFamily: "Lato-Regular",
      marginTop: verticalScale(2),
    },
    flameContainer: {
      width: moderateScale(58),
      height: moderateScale(58),
      position: "relative",
    },
    separator: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 1,
      borderRadius: moderateScale(2),
    },
  });
