import React from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import ThemedButton from "../UI/ThemedButton";
import CollapsibleSection from "../UI/CollapsibleSection";
import BatterySection from "./BatterySection";
import { styles } from "../../styles/energySSStyles";

interface Props {
  isSecondBattery: boolean;
  setSecondBattery: (v: boolean) => void;
  values: any;
  errors: any;
  touched: any;
  handleBlur: (field: string) => void;
  handleBlurWithSave: (handler: any, field: string) => () => void;
  setFieldValue: (field: string, value: any) => void;
  equipmentUuid: string;
  manufacturer: string;
  styles: any;
}

const SecondaryBatterySection: React.FC<Props> = ({
  isSecondBattery,
  setSecondBattery,
  values,
  errors,
  touched,
  handleBlur,
  handleBlurWithSave,
  setFieldValue,
  equipmentUuid,
  manufacturer,
  styles,
}) => {
  return (
    <>
      <View style={styles.extraBtns}>
        <ThemedButton
          color1={isSecondBattery ? "#FD7332" : "#0C1F3F"}
          color2={isSecondBattery ? "#EF3826" : "#2E4161"}
          style={{ ...styles.subBtn, alignSelf: "flex-start" }}
          onPress={() => setSecondBattery(!isSecondBattery)}
        >
          <Text
            style={{
              ...styles.buttonText,
              fontWeight: isSecondBattery ? "700" : "400",
            }}
          >
            + Battery Model
          </Text>
        </ThemedButton>

        <TouchableOpacity style={{ justifyContent: "center", paddingLeft: 15 }}>
          <Image
            source={require("../../assets/Images/icons/info.png")}
            style={styles.infoIcon}
          />
        </TouchableOpacity>
      </View>

      {isSecondBattery && (
        <CollapsibleSection title="Battery 2" initiallyExpanded>
          <BatterySection
            values={values}
            errors={errors}
            touched={touched}
            handleBlur={handleBlur}
            handleBlurWithSave={handleBlurWithSave}
            setFieldValue={setFieldValue}
            equipmentUuid={equipmentUuid}
            manufacturer={manufacturer}
            fieldIndex={1}
            styles={styles}
          />
        </CollapsibleSection>
      )}
    </>
  );
};

export default SecondaryBatterySection;
