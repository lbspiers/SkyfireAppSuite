// src/screens/Project/LoadCalculations/components/LoadCalculationResults.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "../../../../utils/responsive";
import { LoadCalculationsValues } from "../hooks/useLoadCalculations";

interface LoadCalculationResultsProps {
  values: LoadCalculationsValues;
}

export default function LoadCalculationResults({ values }: LoadCalculationResultsProps) {
  const calculations = useMemo(() => {
    // Parse all input values as numbers (empty strings become 0)
    const floorArea = parseFloat(values.floorArea) || 0;
    const smallApplianceCircuits = parseFloat(values.smallApplianceCircuits) || 0;
    const bathroomCircuits = parseFloat(values.bathroomCircuits) || 0;
    const laundryCircuits = parseFloat(values.laundryCircuits) || 0;
    const hvacAirHandler = parseFloat(values.hvacAirHandler) || 0;
    const electricalFurnace = parseFloat(values.electricalFurnace) || 0;

    // Sum all 2-pole breaker amps
    const twoPoleBreakersSum = values.additionalLoads.reduce((sum, load) => {
      const amps = parseFloat(load.amps) || 0;
      return sum + amps;
    }, 0);

    // Step 1: SqFtLoad = Floor Area × 3
    const sqFtLoad = floorArea * 3;

    // Step 2: BreakerQuantitiesSum = (circuits sum) × 1500
    const circuitsSum = smallApplianceCircuits + bathroomCircuits + laundryCircuits;
    const breakerQuantitiesSum = circuitsSum * 1500;

    // Step 3: TotalVA = (2-pole breaker amps sum ÷ 1.25) × 240
    const totalVA = (twoPoleBreakersSum / 1.25) * 240;

    // Step 4: TotalVA_NonAC = SqFtLoad + BreakerQuantitiesSum + TotalVA
    const totalVA_NonAC = sqFtLoad + breakerQuantitiesSum + totalVA;

    // Step 5: 40PercentRemaining = (TotalVA_NonAC - 10000) × 0.4
    const fortyPercentRemaining = (totalVA_NonAC - 10000) * 0.4;

    // Step 6: AdjustTotalofNonACLoad = 40PercentRemaining + 10000
    const adjustTotalofNonACLoad = fortyPercentRemaining + 10000;

    // Step 7: ACLoad = (HVAC/Air Handler ÷ 1.25) × 240
    const acLoad = (hvacAirHandler / 1.25) * 240;

    // Step 8: FurnaceLoad = (Electrical Furnace ÷ 1.25) × 240
    const furnaceLoad = (electricalFurnace / 1.25) * 240;

    // Step 9: Total Load = AdjustTotalofNonACLoad + ACLoad + FurnaceLoad
    const totalLoad = adjustTotalofNonACLoad + acLoad + furnaceLoad;

    // Step 10: Total Proposed Load (Amps) = Total Load ÷ 240
    const totalProposedLoadAmps = totalLoad / 240;

    return {
      sqFtLoad,
      breakerQuantitiesSum,
      totalVA,
      totalVA_NonAC,
      fortyPercentRemaining,
      adjustTotalofNonACLoad,
      acLoad,
      furnaceLoad,
      totalLoad,
      totalProposedLoadAmps,
    };
  }, [values]);

  // Format number to 2 decimal places with commas
  const formatNumber = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return "0.00";
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Load Calculation Results</Text>

      <View style={styles.resultsGrid}>
        {/* Intermediate calculations */}
        <ResultRow label="Sq Ft Load (VA)" value={formatNumber(calculations.sqFtLoad)} />
        <ResultRow label="Breaker Quantities Sum (VA)" value={formatNumber(calculations.breakerQuantitiesSum)} />
        <ResultRow label="Total VA (2-Pole Breakers)" value={formatNumber(calculations.totalVA)} />
        <ResultRow label="Total VA Non-AC" value={formatNumber(calculations.totalVA_NonAC)} />
        <ResultRow label="40% Remaining" value={formatNumber(calculations.fortyPercentRemaining)} />
        <ResultRow label="Adjusted Total Non-AC Load (VA)" value={formatNumber(calculations.adjustTotalofNonACLoad)} />
        <ResultRow label="AC Load (VA)" value={formatNumber(calculations.acLoad)} />
        <ResultRow label="Furnace Load (VA)" value={formatNumber(calculations.furnaceLoad)} />

        {/* Final results - highlighted */}
        <View style={styles.divider} />
        <ResultRow
          label="Total Load (VA)"
          value={formatNumber(calculations.totalLoad)}
          highlighted
        />
        <ResultRow
          label="Total Proposed Load (Amps)"
          value={formatNumber(calculations.totalProposedLoadAmps)}
          highlighted
        />
      </View>
    </View>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function ResultRow({ label, value, highlighted }: ResultRowProps) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, highlighted && styles.resultLabelHighlighted]}>
        {label}
      </Text>
      <Text style={[styles.resultValue, highlighted && styles.resultValueHighlighted]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
    paddingHorizontal: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
    marginBottom: verticalScale(16),
  },
  resultsGrid: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "rgba(253, 115, 50, 0.3)",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
  },
  resultLabel: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
    flex: 1,
  },
  resultValue: {
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
    textAlign: "right",
    minWidth: moderateScale(100),
  },
  resultLabelHighlighted: {
    fontSize: moderateScale(18),
    color: "#FD7332",
    fontFamily: "Lato-Bold",
  },
  resultValueHighlighted: {
    fontSize: moderateScale(20),
    color: "#FD7332",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(253, 115, 50, 0.5)",
    marginVertical: verticalScale(8),
  },
});
