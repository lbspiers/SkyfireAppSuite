import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import CollapsibleSection from "../../../../components/UI/CollapsibleSection";
import NewExistingToggle from "../../../../components/NewExistingToggle";
import TextInput from "../../../../components/TextInput";
import Dropdown from "../../../../components/Dropdown";
import NumericKeypad from "../../../../components/NumericKeypad";
import ConfirmClearModal from "../../../../components/Modals/ConfirmClearModal";

const requiredFields = ["selectedSolarPanel", "selectedSolarPanelModal"];

interface SolarPanelsSectionProps {
  values: {
    quantity: number | string;
    selectedSolarPanel: string;
    selectedSolarPanelModal: string;
    isNewSolarPanel: boolean;
  };
  onChange: (field: string, value: any) => void;
  solarPanelList: any[];
  solarModalList: any[];
  errors: { [k: string]: string };
}

const SolarPanelsSection: React.FC<SolarPanelsSectionProps> = ({
  values,
  onChange,
  solarPanelList,
  solarModalList,
  errors,
}) => {
  // Numeric keypad modal state
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [tempQty, setTempQty] = useState(values.quantity?.toString() ?? "");

  useEffect(() => {
    setTempQty(values.quantity?.toString() ?? "");
  }, [values.quantity]);

  // Dirty/complete logic
  const isDirty =
    String(values.quantity ?? "").trim() !== "" ||
    String(values.selectedSolarPanel ?? "").trim() !== "" ||
    String(values.selectedSolarPanelModal ?? "").trim() !== "";

  const areFieldsComplete = (fields: string[], vals: Record<string, any>) =>
    fields.every((field) => {
      const val = vals[field];
      return val !== null && val !== undefined && String(val).trim() !== "";
    });

  const isRequiredComplete = areFieldsComplete(requiredFields, values);

  // Keypad handlers
  const handleNumberPress = (num: string) => {
    if (tempQty.length < 2) {
      if (tempQty === "0") setTempQty(num);
      else setTempQty(tempQty + num);
    }
  };
  const handleBackspace = () => setTempQty((prev) => prev.slice(0, -1));
  const handleKeypadClose = () => {
    onChange("quantity", tempQty.replace(/^0+/, "") || "");
    setKeypadVisible(false);
  };

  // Trash handler for this section
  const clearFields = () => {
    onChange("quantity", "");
    onChange("selectedSolarPanel", "");
    onChange("selectedSolarPanelModal", "");
    onChange("isNewSolarPanel", true); // optionally reset toggle
    // Add more fields to clear as needed!
  };
  const [showClearModal, setShowClearModal] = useState(false);
  return (
    <>
      <CollapsibleSection
        title="Solar Panels"
        initiallyExpanded
        isDirty={isDirty}
        isRequiredComplete={isRequiredComplete}
      >
        <View style={styles.sectionContent}>
          {/* Toggle + Trash icon (always together, perfectly aligned) */}
          <NewExistingToggle
            isNew={values.isNewSolarPanel}
            onToggle={(val) => onChange("isNewSolarPanel", val)}
            onTrashPress={() => setShowClearModal(true)}
            style={{ marginLeft: 0, marginTop: 0 }}
          />
          <ConfirmClearModal
            visible={showClearModal}
            sectionTitle="Solar Panel 1" // or whatever name is appropriate
            onConfirm={() => {
              clearFields(); // your existing clear logic
              setShowClearModal(false);
            }}
            onCancel={() => setShowClearModal(false)}
          />
          {/* Quantity - no wrap */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.quantityWrap}
            onPress={() => setKeypadVisible(true)}
          >
            <TextInput
              label="Quantity*"
              placeholder="00"
              value={values.quantity?.toString()}
              editable={false}
              pointerEvents="none"
              widthPercent={100}
              errorText={errors.quantity}
              showNumericKeypad={true}
              onChangeText={() => {}} // required, but unused
            />
          </TouchableOpacity>

          {/* Make/Model Dropdowns */}
          <Dropdown
            label="Make*"
            data={solarPanelList}
            value={values.selectedSolarPanel}
            onChange={(val) => onChange("selectedSolarPanel", val)}
            widthPercent={100}
            errorText={errors.selectedSolarPanel}
          />
          <Dropdown
            label="Model*"
            data={solarModalList}
            value={values.selectedSolarPanelModal}
            onChange={(val) => onChange("selectedSolarPanelModal", val)}
            widthPercent={100}
            errorText={errors.selectedSolarPanelModal}
          />
        </View>
      </CollapsibleSection>

      {/* NumericKeypad Modal */}
      <NumericKeypad
        isVisible={keypadVisible}
        currentValue={tempQty}
        onNumberPress={handleNumberPress}
        onBackspace={handleBackspace}
        onClose={handleKeypadClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sectionContent: {
    paddingHorizontal: 0,
    width: "100%",
    alignItems: "stretch",
    gap: 0,
  },
  quantityWrap: {
    width: 180,
    marginBottom: 0,
    alignSelf: "flex-start",
  },
});

export default SolarPanelsSection;
