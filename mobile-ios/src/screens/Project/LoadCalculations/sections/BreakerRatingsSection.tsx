// src/screens/Project/LoadCalculations/sections/BreakerRatingsSection.tsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import TextInput from "../../../../components/TextInput";
import NumericKeypad from "../../../../components/NumericKeypad";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

const flameIcon = require("../../../../assets/Images/appIcon.png");

interface BreakerRatingsSectionProps {
  values: {
    hvacAirHandler: string;
    electricalFurnace: string;
    electricVehicle: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string | undefined>;
}

export default function BreakerRatingsSection({
  values,
  onChange,
  errors,
}: BreakerRatingsSectionProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const handleOpenKeypad = (fieldName: string) => {
    setActiveField(fieldName);
    setTempValue(values[fieldName as keyof typeof values] || "");
  };

  const handleCloseKeypad = () => {
    if (activeField) {
      const cleanValue = tempValue.replace(/^0+/, "") || "";
      onChange(activeField, cleanValue);
    }
    setActiveField(null);
    setTempValue("");
  };

  const isDirty =
    values.hvacAirHandler || values.electricalFurnace || values.electricVehicle;

  return (
    <>
      <CollapsibleSection
        title="HVAC/Furnace/EV"
        initiallyExpanded={false}
        isDirty={!!isDirty}
        renderCamera={false}
      >
        <View style={styles.content}>
          {/* Note */}
          <View style={styles.noteContainer}>
            <View style={styles.noteHeader}>
              <Image source={flameIcon} style={styles.flameIcon} />
              <Text style={styles.noteLabel}>Note</Text>
            </View>
            <Text style={styles.noteText}>
              Enter the sum total of the breaker amp ratings for the following:
            </Text>
          </View>

          {/* HVAC/Air Handler */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("hvacAirHandler")}
              activeOpacity={0.8}
            >
              <TextInput
                label="HVAC/Air Handler"
                value={values.hvacAirHandler}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => handleOpenKeypad("hvacAirHandler")}
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("hvacAirHandler")}
                onTouchEnd={() => handleOpenKeypad("hvacAirHandler")}
                onChangeText={() => {}}
                errorText={errors.hvacAirHandler}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Amps</Text>
          </View>

          {/* Electrical Furnace */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("electricalFurnace")}
              activeOpacity={0.8}
            >
              <TextInput
                label="Electrical Furnace"
                value={values.electricalFurnace}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => handleOpenKeypad("electricalFurnace")}
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("electricalFurnace")}
                onTouchEnd={() => handleOpenKeypad("electricalFurnace")}
                onChangeText={() => {}}
                errorText={errors.electricalFurnace}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Amps</Text>
          </View>

          {/* Electric Vehicle */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("electricVehicle")}
              activeOpacity={0.8}
            >
              <TextInput
                label="Electric Vehicle"
                value={values.electricVehicle}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => handleOpenKeypad("electricVehicle")}
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("electricVehicle")}
                onTouchEnd={() => handleOpenKeypad("electricVehicle")}
                onChangeText={() => {}}
                errorText={errors.electricVehicle}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Amps</Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={!!activeField}
        currentValue={tempValue}
        title={
          activeField === "hvacAirHandler"
            ? "HVAC/Air Handler (Total Amps)"
            : activeField === "electricalFurnace"
            ? "Electrical Furnace (Total Amps)"
            : "Electric Vehicle (Total Amps)"
        }
        onNumberPress={(n) =>
          setTempValue((prev) => (prev === "" || prev === "0" ? n : prev + n))
        }
        onBackspace={() => setTempValue((prev) => prev.slice(0, -1))}
        onClose={handleCloseKeypad}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    width: "100%",
  },
  noteContainer: {
    marginBottom: verticalScale(20),
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  flameIcon: {
    width: moderateScale(26),
    height: moderateScale(26),
    resizeMode: "contain",
    marginRight: moderateScale(8),
  },
  noteLabel: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Lato-Bold",
  },
  noteText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
  },
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  fullWidthInput: {
    width: moderateScale(200),
    marginTop: 0,
  },
  unitLabel: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Lato-Regular",
    marginLeft: moderateScale(12),
    marginTop: verticalScale(10),
  },
});
