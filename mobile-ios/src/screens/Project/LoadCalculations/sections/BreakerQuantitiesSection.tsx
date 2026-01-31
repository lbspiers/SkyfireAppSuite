// src/screens/Project/LoadCalculations/sections/BreakerQuantitiesSection.tsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import TextInput from "../../../../components/TextInput";
import NumericKeypad from "../../../../components/NumericKeypad";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

const flameIcon = require("../../../../assets/Images/appIcon.png");

interface BreakerQuantitiesSectionProps {
  values: {
    smallApplianceCircuits: string;
    bathroomCircuits: string;
    laundryCircuits: string;
  };
  onChange: (field: string, value: string) => void;
  errors: Record<string, string | undefined>;
}

export default function BreakerQuantitiesSection({
  values,
  onChange,
  errors,
}: BreakerQuantitiesSectionProps) {
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
    values.smallApplianceCircuits ||
    values.bathroomCircuits ||
    values.laundryCircuits;

  return (
    <>
      <CollapsibleSection
        title="1P/20A Circuits"
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
              Enter single pole/20 amp circuits (<Text style={styles.boldText}>Minimum 2 Required</Text>).
            </Text>
          </View>

          {/* Small Appliance Circuits */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("smallApplianceCircuits")}
              activeOpacity={0.8}
            >
              <TextInput
                label="Sm Appliance Circuits"
                value={values.smallApplianceCircuits}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() =>
                  handleOpenKeypad("smallApplianceCircuits")
                }
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("smallApplianceCircuits")}
                onTouchEnd={() => handleOpenKeypad("smallApplianceCircuits")}
                onChangeText={() => {}}
                errorText={errors.smallApplianceCircuits}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Circuits</Text>
          </View>

          {/* Bathroom Circuits */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("bathroomCircuits")}
              activeOpacity={0.8}
            >
              <TextInput
                label="Bathroom Circuits"
                value={values.bathroomCircuits}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => handleOpenKeypad("bathroomCircuits")}
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("bathroomCircuits")}
                onTouchEnd={() => handleOpenKeypad("bathroomCircuits")}
                onChangeText={() => {}}
                errorText={errors.bathroomCircuits}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Circuits</Text>
          </View>

          {/* Laundry Circuits */}
          <View style={styles.inputWithUnit}>
            <TouchableOpacity
              style={styles.fullWidthInput}
              onPress={() => handleOpenKeypad("laundryCircuits")}
              activeOpacity={0.8}
            >
              <TextInput
                label="Laundry Circuits"
                value={values.laundryCircuits}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => handleOpenKeypad("laundryCircuits")}
                showSoftInputOnFocus={false}
                onFocus={() => handleOpenKeypad("laundryCircuits")}
                onTouchEnd={() => handleOpenKeypad("laundryCircuits")}
                onChangeText={() => {}}
                errorText={errors.laundryCircuits}
              />
            </TouchableOpacity>
            <Text style={styles.unitLabel}>Circuits</Text>
          </View>
        </View>
      </CollapsibleSection>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={!!activeField}
        currentValue={tempValue}
        title={
          activeField === "smallApplianceCircuits"
            ? "Sm Appliance Circuits"
            : activeField === "bathroomCircuits"
            ? "Bathroom Circuits"
            : "Laundry Circuits"
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
  boldText: {
    fontWeight: "700",
    fontFamily: "Lato-Bold",
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
