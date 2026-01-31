import React from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import ThemedButton from "../UI/ThemedButton";
import CollapsibleSection from "../UI/CollapsibleSection";
import { styles } from "../../styles/energySSStyles";

interface Props {
  active: string;
  handleSetActive: (value: string) => void;
  isBackupLoad: boolean;
  setBackupLoad: (v: boolean) => void;
}

const FooterActionSection: React.FC<Props> = ({
  active,
  handleSetActive,
  isBackupLoad,
  setBackupLoad,
}) => {
  const buttons = ["Daisy Chain", "+ Battery \n Combiner Panel"];

  return (
    <CollapsibleSection title="Actions" initiallyExpanded>
      <View style={[styles.subContainer, { columnGap: 20 }]}>
        {buttons.map((label, idx) => (
          <ThemedButton
            key={idx}
            color1={active === label ? "#FD7332" : "#0C1F3F"}
            color2={active === label ? "#EF3826" : "#2E4161"}
            style={{ ...styles.subBtn }}
            onPress={() => handleSetActive(label)}
          >
            <Text
              style={{
                ...styles.buttonText,
                fontWeight: active === label ? "700" : "400",
              }}
            >
              {label}
            </Text>
          </ThemedButton>
        ))}
      </View>

      <View style={[styles.extraBtns, { marginVertical: 20 }]}>
        <ThemedButton
          color1={isBackupLoad ? "#FD7332" : "#0C1F3F"}
          color2={isBackupLoad ? "#EF3826" : "#2E4161"}
          style={{ ...styles.subBtn, alignSelf: "flex-start" }}
          onPress={() => setBackupLoad(!isBackupLoad)}
        >
          <Text
            style={{
              ...styles.buttonText,
              fontWeight: isBackupLoad ? "700" : "400",
            }}
          >
            + Backup Load {"\n"} Sub Panel
          </Text>
        </ThemedButton>

        <TouchableOpacity style={{ justifyContent: "center", paddingLeft: 15 }}>
          <Image
            source={require("../../assets/Images/icons/info.png")}
            style={styles.infoIcon}
          />
        </TouchableOpacity>
      </View>
    </CollapsibleSection>
  );
};

export default FooterActionSection;
