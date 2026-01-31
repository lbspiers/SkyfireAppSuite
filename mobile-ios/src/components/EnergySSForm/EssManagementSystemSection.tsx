import React from "react";
import { View } from "react-native";
import CollapsibleSection from "../UI/CollapsibleSection";
import TextInputField from "../UI/ThemedTextInput";
import Text from "../Text";

interface Props {
  values: any;
  systemType: string;
  setFieldValue: (field: string, value: any) => void;
  handleBlur: (field: string) => void;
  handleBlurWithSave: (handler: any, field: string) => () => void;
  touched: any;
  errors: any;
  styles: any;
}

const EssManagementSystemSection: React.FC<Props> = ({
  values,
  systemType,
  setFieldValue,
  handleBlur,
  handleBlurWithSave,
  touched,
  errors,
  styles,
}) => {
  return (
    <CollapsibleSection title="ESS Management System" initiallyExpanded>
      <View style={styles.textInputView}>
        <TextInputField
          label="Main Breaker Rating (Amps)*"
          value={
            values?.essManagementSystem?.mainBreakerRating?.toString() || ""
          }
          onChangeText={(val: string) =>
            setFieldValue(
              "essManagementSystem.mainBreakerRating",
              parseInt(val) || ""
            )
          }
          onBlur={handleBlurWithSave(
            handleBlur,
            "essManagementSystem.mainBreakerRating"
          )}
          errorText={
            touched?.essManagementSystem?.mainBreakerRating &&
            errors?.essManagementSystem?.mainBreakerRating
          }
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInputField
          label="Upstream Breaker Rating (Amps)*"
          value={
            values?.essManagementSystem?.upstreamBreakerRating?.toString() || ""
          }
          onChangeText={(val: string) =>
            setFieldValue(
              "essManagementSystem.upstreamBreakerRating",
              parseInt(val) || ""
            )
          }
          onBlur={handleBlurWithSave(
            handleBlur,
            "essManagementSystem.upstreamBreakerRating"
          )}
          errorText={
            touched?.essManagementSystem?.upstreamBreakerRating &&
            errors?.essManagementSystem?.upstreamBreakerRating
          }
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInputField
          label="Upstream Breaker Location"
          value={
            values?.essManagementSystem?.upstreamBreakerLocation?.toString() ||
            ""
          }
          onChangeText={(val: string) =>
            setFieldValue("essManagementSystem.upstreamBreakerLocation", val)
          }
          onBlur={handleBlurWithSave(
            handleBlur,
            "essManagementSystem.upstreamBreakerLocation"
          )}
          errorText={
            touched?.essManagementSystem?.upstreamBreakerLocation &&
            errors?.essManagementSystem?.upstreamBreakerLocation
          }
          keyboardType="default"
          style={styles.input}
        />
      </View>
    </CollapsibleSection>
  );
};

export default EssManagementSystemSection;
