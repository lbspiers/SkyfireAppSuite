import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import Text from "../Text";
import { styles } from "../../styles/energySSStyles";

interface Props {
  checkbox: boolean;
  setCheckbox: (v: boolean) => void;
  setFieldValue: (field: string, value: any) => void;
  selectedOption: string;
}

const IntegratedESSCheckbox: React.FC<Props> = ({
  checkbox,
  setCheckbox,
  setFieldValue,
  selectedOption,
}) => {
  const label =
    selectedOption === "No Backup"
      ? "Connect batteries to Main Panel A"
      : "Select if ESS Management System \n is inverter integrated";

  return (
    <View style={styles.checkView}>
      <TouchableOpacity
        onPress={() => {
          setCheckbox(!checkbox);
          setFieldValue("hasIntegratedEss", !checkbox);
        }}
      >
        <Image
          style={{ height: 20.5, width: 20.5 }}
          source={
            checkbox
              ? require("../../assets/Images/icons/checked.png")
              : require("../../assets/Images/icons/checkbox.png")
          }
        />
      </TouchableOpacity>
      <Text children={label} style={styles.checkText} />
    </View>
  );
};

export default IntegratedESSCheckbox;
