import React from "react";
import { View } from "react-native";
import CollapsibleSection from "../UI/CollapsibleSection";
import TextInputField from "../UI/ThemedTextInput";
import Text from "../Text";

interface Props {
  values: any;
  errors: any;
  touched: any;
  handleBlur: (field: string) => void;
  handleBlurWithSave: (handler: any, field: string) => () => void;
  setFieldValue: (field: string, value: any) => void;
  equipmentUuid: string;
  manufacturer: string;
  fieldIndex: number;
  styles: any;
}

const BatterySection: React.FC<Props> = ({
  values,
  errors,
  touched,
  handleBlur,
  handleBlurWithSave,
  setFieldValue,
  equipmentUuid,
  manufacturer,
  fieldIndex,
  styles,
}) => {
  const sectionTitle = fieldIndex === 0 ? "Battery 1" : "Battery 2";

  return (
    <CollapsibleSection
      title={sectionTitle}
      initiallyExpanded={fieldIndex === 0}
    >
      <View style={styles.textInputView}>
        <TextInputField
          label="Quantity"
          value={
            fieldIndex === 0
              ? values.batteryQuantity?.toString() || ""
              : values.battery2Quantity?.toString() || ""
          }
          onChangeText={(val: string) => {
            const field =
              fieldIndex === 0 ? "batteryQuantity" : "battery2Quantity";
            setFieldValue(field, parseInt(val) || "");
          }}
          onBlur={handleBlurWithSave(
            handleBlur,
            fieldIndex === 0 ? "batteryQuantity" : "battery2Quantity"
          )}
          errorText={
            fieldIndex === 0
              ? touched.batteryQuantity && errors.batteryQuantity
              : touched.battery2Quantity && errors.battery2Quantity
          }
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInputField
          label="Model UUID"
          value={
            fieldIndex === 0
              ? values.batteryModelUuid || ""
              : values.battery2ModelUuid || ""
          }
          onChangeText={(val: string) => {
            const field =
              fieldIndex === 0 ? "batteryModelUuid" : "battery2ModelUuid";
            setFieldValue(field, val);
          }}
          onBlur={handleBlurWithSave(
            handleBlur,
            fieldIndex === 0 ? "batteryModelUuid" : "battery2ModelUuid"
          )}
          errorText={
            fieldIndex === 0
              ? touched.batteryModelUuid && errors.batteryModelUuid
              : touched.battery2ModelUuid && errors.battery2ModelUuid
          }
          keyboardType="default"
          style={styles.input}
        />
      </View>
    </CollapsibleSection>
  );
};

export default BatterySection;
