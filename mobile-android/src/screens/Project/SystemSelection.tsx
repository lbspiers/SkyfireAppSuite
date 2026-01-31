import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { styles } from "../../styles/equipmentConfirmationStyles";
import Text from "../../components/Text";
import { HeaderLogoComponent } from "../../components/Header";
import Button from "../../components/Button";
import COLORS from "../../utils/styleConstant/Color";
import { useDispatch, useSelector } from "react-redux";
import { EquipmentLists } from "../../api/project.service";
import { setUpdateProjectDetails } from "../../store/slices/projectSlice";

const SystemSelection = (props: any) => {
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const companyID = useSelector((store: any) => store?.profile?.profile);
  const projectID = useSelector((store: any) => store?.project?.currentProject);
  const updateProjectDetails = useSelector(
    (store: any) => store?.project?.updateProjectDetails?.equipment_sets[0]
  );
  console.log(
    "updated project details confirmation screen =>",
    updateProjectDetails?.solar_panel?.manufacturer
  );
  const options = ["MicroInverter", "Inverter"];
  const [selectedOption, setSelection] = useState<string>("MicroInverter");
  const [checked, setChecked] = useState(false);
  const [checkedValue, setCheckedValue] = useState("");
  const { details, title } = props?.route?.params;
  const [data, setData] = useState({
    modelNo: updateProjectDetails?.solar_panel_quantity,
    make: updateProjectDetails?.solar_panel?.manufacturer,
    model: updateProjectDetails?.solar_panel?.model,
  });

  const handleInfo = () => {};
  const handleSubmit = () => {
    if (checkedValue === "yes") {
      navigation.navigate("EquipmentNumber", {
        title: title,
        details: {
          address: details.address,
          name: details?.name,
          installerId: details?.InstallerId,
        },
        system:selectedOption
      });
    } else {
      navigation.navigate("EquipmentDetails", {
        title: title,
        details: {
          address: details.address,
          name: details?.name,
          installerId: details?.InstallerId,    
        },
        system:selectedOption
      });
    }
  };

  const CheckBox = ({ label, checked, onPress }: any) => {
    return (
      <View style={styles.checkView}>
        <TouchableOpacity onPress={onPress} style={{ marginTop: 5 }}>
          {checked ? (
            <ImageBackground
              style={styles.checkBox}
              source={require("../../assets/Images/icons/activeCheck.png")}
            >
              <Image
                source={require("../../assets/Images/icons/checkMark.png")}
                style={styles.checkMark}
                tintColor={COLORS.white}
              />
            </ImageBackground>
          ) : (
            <Image
              style={styles.checkBox}
              source={require("../../assets/Images/icons/checkbox.png")}
            />
          )}
        </TouchableOpacity>
        <Text children={label} style={[styles.backupTitle, { flex: 1 }]} />
      </View>
    );
  };
  const fetchEquipmentLists = async () => {
    try {
      const response = await EquipmentLists(
        projectID?.uuid,
        companyID?.company?.uuid
      );
      if (response?.status == 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        console.log("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };
  useEffect(() => {
    if (projectID?.uuid) {
      fetchEquipmentLists();
    }
  }, [projectID]);

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
            isTitle={false}
            back={false}
            applogo={true}
            onIconPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />

          <View style={{ paddingHorizontal: 30, paddingBottom: 50 }}>
            <View>
              <Text children={"Doe, John"} style={styles.username}></Text>
              <Text
                style={styles.Address}
                children={"1234 W Covered Wagon Way"}
              ></Text>
              <Text
                style={styles.Address}
                children={"Western City, ST 12345"}
              ></Text>
              <Text
                style={styles.installer}
                children={"Installer ID123"}
              ></Text>
            </View>
            <View style={{ marginTop: 20, flex: 0.4 }}>
              <Text
                children={"Choose 1st System Type"}
                style={styles.backupTitle}
              />
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
            <View style={{ paddingVertical: 30 }}>
              <Button
                children={"Submit"}
                color1={"#0C1F3F"}
                color2={"#213454"}
                color3={"#2E4161"}
                onPress={() => handleSubmit()}
                style={styles.button}
                labelStyle={styles.optionText}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SystemSelection;
