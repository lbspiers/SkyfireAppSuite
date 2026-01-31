// src/screens/Project/LoadCalculations/sections/FloorAreaSection.tsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import TextInput from "../../../../components/TextInput";
import NumericKeypad from "../../../../components/NumericKeypad";
import { moderateScale, verticalScale } from "../../../../utils/responsive";

interface FloorAreaSectionProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function FloorAreaSection({
  value,
  onChange,
  error,
}: FloorAreaSectionProps) {
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  // Sync tempValue when external value changes
  React.useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleKeypadClose = () => {
    // Remove leading zeros and update parent
    const cleanValue = tempValue.replace(/^0+/, "") || "";
    onChange(cleanValue);
    setKeypadVisible(false);
  };

  const isDirty = value && value.trim() !== "";
  const isComplete = value && value.trim() !== "";

  return (
    <>
      <CollapsibleSection
        title="Floor Area"
        initiallyExpanded={false}
        isDirty={!!isDirty}
        isRequiredComplete={!!isComplete}
        renderCamera={false}
      >
        <View style={styles.content}>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setKeypadVisible(true)}
              activeOpacity={0.8}
              style={styles.halfInput}
            >
              <TextInput
                label="Floor Area* (sq. ft.)"
                value={value}
                editable
                showNumericKeypad={true}
                onNumericKeypadOpen={() => setKeypadVisible(true)}
                showSoftInputOnFocus={false}
                onFocus={() => setKeypadVisible(true)}
                onTouchEnd={() => setKeypadVisible(true)}
                onChangeText={() => {}} // no-op (we edit via keypad)
                errorText={error}
              />
            </TouchableOpacity>
            <View style={styles.spacer} />
          </View>
        </View>
      </CollapsibleSection>

      {/* Numeric Keypad */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={tempValue}
        title="Floor Area (sq. ft.)"
        onNumberPress={(n) =>
          setTempValue((prev) => (prev === "" || prev === "0" ? n : prev + n))
        }
        onBackspace={() => setTempValue((prev) => prev.slice(0, -1))}
        onClose={handleKeypadClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },
  halfInput: {
    flex: 1,
  },
  spacer: {
    width: moderateScale(10),
    flex: 1,
  },
});
