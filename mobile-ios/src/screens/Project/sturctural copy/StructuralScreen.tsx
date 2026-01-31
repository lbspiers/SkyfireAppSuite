import React, { useState } from "react";
import { SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { HeaderLogoComponent } from "../../../components/Header";
import Text from "../../../components/Text";
import { styles } from "../../../styles/structuralScreenStyles";
import Button from "../../../components/Button";
import RoofingAttachment from "./components/RoofingAttachment";
import MountingPlanes from "./components/MountingPlanes";
import { useSelector } from "react-redux";

const StructuralScreen = () => {
  const navigation = useNavigation();
  const options = ["Roofing &\nAttachment", "Mounting\nPlanes"];
  const [selectedOption, setSelection] = useState<string>("Roofing &\nAttachment");

  const companyData = useSelector((store: any) => store?.profile?.profile);
  const InstallerId = useSelector(
    (store: any) => store?.project?.currentProject?.details?.installer_project_id
  );
  const company = companyData?.company;

  const userFullName = `${companyData.user?.firstName || ""} ${companyData.user?.lastName || ""}`;
  const addressString = `${company?.name || ""} ${company?.address || ""} ${company?.city || ""} ${
    company?.state || ""
  }`;

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          enableOnAndroid
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <HeaderLogoComponent
            isTitle={true}
            title="Structural"
            back={false}
            applogo={true}
            onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />

          <View style={{ paddingHorizontal: 30, paddingBottom: 50 }}>
            <View>
              <Text children={userFullName} style={styles.username} />
              <Text style={styles.Address} children={addressString} />
              <Text style={styles.installer} children={InstallerId || ""} />
            </View>

            <View style={styles.optionsContainer}>
              {options.map((value, index) => (
                <Button
                  children={value}
                  key={index}
                  color1={selectedOption === value ? "#FD7332" : "#0C1F3F"}
                  color2={selectedOption === value ? "#EF3826" : "#2E4161"}
                  onPress={() => setSelection(value)}
                  style={styles.optionItem}
                  labelStyle={[
                    styles.optionText,
                    { fontWeight: selectedOption === value ? "700" : "400" },
                  ]}
                />
              ))}
            </View>
            {selectedOption === "Roofing &\nAttachment" ? (
              <RoofingAttachment />
            ) : (
              <MountingPlanes />
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default StructuralScreen;
