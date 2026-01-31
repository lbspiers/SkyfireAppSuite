import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import Button from "../Button";
import Text from "../Text";
import { styles } from "../../styles/energySSStyles";

interface Props {
  selectedOption: string;
  setSelection: (v: string) => void;
}

const options = ["Whole Home", "Partial Home", "No Backup"];

const BackupTypeSelector: React.FC<Props> = ({
  selectedOption,
  setSelection,
}) => {
  const handleInfo = (option: string) => {
    // Can later show modal or tooltips
    console.log(`ℹ️ Info for ${option}`);
  };

  return (
    <View style={styles.textView}>
      <Text style={styles.headerText}>Select Backup Option</Text>
      <View style={styles.optionsContainer}>
        {options.map((value, index) => (
          <View key={index} style={styles.option}>
            <TouchableOpacity onPress={() => handleInfo(value)}>
              <Image
                source={require("../../assets/Images/icons/info.png")}
                style={[styles.infoIcon, { alignSelf: "center" }]}
              />
            </TouchableOpacity>
            <Button
              color1={selectedOption === value ? "#FD7332" : "#0C1F3F"}
              color2={selectedOption === value ? "#EF3826" : "#2E4161"}
              style={styles.optionItem}
              onPress={() => setSelection(value)}
              labelStyle={[
                styles.buttonText,
                { fontWeight: selectedOption === value ? "700" : "400" },
              ]}
            >
              {value}
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
};

export default BackupTypeSelector;
