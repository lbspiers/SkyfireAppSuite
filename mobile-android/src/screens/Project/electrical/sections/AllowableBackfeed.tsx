// src/components/Calculations/AllowableBackfeed.tsx

import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

export function calculateAllowableBackfeed(
  busAmps: number,
  mainBreakerAmps: number,
  multiplier: number = 1.25
): number {
  // If MLO (Main Lug Only), use busAmps for main breaker value
  // busAmps × multiplier, minus the main breaker amps
  return busAmps * multiplier - mainBreakerAmps;
}

export interface AllowableBackfeedProps {
  /** Bus Amps value (string or number) */
  busAmps: number | string;
  /** Main breaker Amps value */
  mainBreakerAmps: number | string;
  /** Multiplier factor (default 1.25) */
  multiplier?: number;
  /** Optional container style override */
  containerStyle?: ViewStyle;
  /** Optional text style override */
  textStyle?: TextStyle;
  /** Label prefix (default “Allowable Backfeed:”) */
  label?: string;
}

const AllowableBackfeed: React.FC<AllowableBackfeedProps> = ({
  busAmps,
  mainBreakerAmps,
  multiplier = 1.25,
  containerStyle,
  textStyle,
  label = "Allowable Backfeed:",
}) => {
  // parse inputs to numbers
  const bus = typeof busAmps === "string" ? parseFloat(busAmps) : busAmps;

  // If MLO is selected, use bus amps as the breaker value
  let breaker: number;
  if (typeof mainBreakerAmps === "string") {
    const lowerValue = mainBreakerAmps.toLowerCase().trim();
    if (lowerValue === "mlo" || lowerValue === "") {
      breaker = bus; // Use bus amps when MLO is selected
    } else {
      breaker = parseFloat(mainBreakerAmps);
    }
  } else {
    breaker = mainBreakerAmps;
  }

  const result = calculateAllowableBackfeed(bus, breaker, multiplier);
  const display = Number.isNaN(result) ? "--" : `${result.toFixed(0)} Amps`;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, textStyle]}>
        {label} {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  text: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AllowableBackfeed;
