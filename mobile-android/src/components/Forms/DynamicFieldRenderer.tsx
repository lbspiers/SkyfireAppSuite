import React from "react";
import { View } from "react-native";
import TextInputField from "../TextInput";
import RadioButtonGroup from "../RadioButtonGroup";
import { styles } from "../../styles/siteStyle";

type FieldConfig = {
  condition: (values: any) => boolean;
  label: string;
  field: string;
  componentType: "text" | "radio";
  placeholder?: string;
  options?: string[];
};

type Props = {
  values: any;
  handleChange: (field: string) => (value: any) => void;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
};

const DynamicFieldRenderer: React.FC<Props> = ({
  values,
  handleChange,
  touched,
  errors,
}) => {
  const fields: FieldConfig[] =
    require("../../utils/siteDynamicFields").default;

  return (
    <View>
      {fields.map((field: FieldConfig, idx: number) => {
        if (!field.condition(values)) return null;

        if (field.componentType === "text") {
          return (
            <TextInputField
              key={idx}
              label={field.label}
              placeholder={field.placeholder || ""}
              value={values[field.field]}
              onChangeText={handleChange(field.field)}
              error={touched[field.field] && Boolean(errors[field.field])}
              style={styles.textInput}
              labelStyle={styles.label}
              placeHolderColor={styles.label.color}
            />
          );
        }

        if (field.componentType === "radio" && field.options) {
          return (
            <RadioButtonGroup
              key={idx}
              label={field.label}
              options={field.options}
              value={values[field.field]}
              onChange={(value: string) => handleChange(field.field)(value)}
            />
          );
        }

        return null;
      })}
    </View>
  );
};

export default DynamicFieldRenderer;
