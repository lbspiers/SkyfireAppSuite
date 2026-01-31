import React, { useState } from "react";
import { Image, SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LinearGradient from "react-native-linear-gradient";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import Text from "../../components/Text";
import { HeaderLogoComponent } from "../../components/Header";
import Button from "../../components/Button";
import TextInputField from "../../components/TextInput";
import { styles } from "../../styles/equipmentNoStyles";
import { useDispatch, useSelector } from "react-redux";
import { EquipmentLists, saveEquipmentDetails } from "../../api/project.service";
import { getEquipmentSetByType, setUpdateProjectDetails } from "../../store/slices/projectSlice";
import { isNumber, set } from "lodash";
import Toast from "react-native-toast-message";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";

const EquipmentNumber = (props: any) => {
  const navigation: any = useNavigation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const { details, title } = props?.route?.params;
  const company = useSelector((store: any) => store?.profile?.profile);
  const companyID = company?.company?.uuid;

  const projectID = useSelector((store: any) => store?.project?.currentProject?.uuid);
  const primaryEquipmentSet = useSelector((_) => getEquipmentSetByType(_, "Micro / Inverter 1"));
  const currentEquipmentSet = useSelector((_) => getEquipmentSetByType(_, "Micro / Inverter 2"));

  const [value, setValue] = useState({ quantity: "" });

  const [data, setData] = useState({
    modelNo: primaryEquipmentSet?.solar_panel_quantity,
    make: primaryEquipmentSet?.solar_panel?.manufacturer,
    model: primaryEquipmentSet?.solar_panel?.model,
  });

  const fetchEquipmentLists = async () => {
    try {
      const response = await EquipmentLists(projectID?.uuid, companyID);
      if (response?.status == 200) {
        dispatch(setUpdateProjectDetails(response?.data?.data));
      } else {
        console.log("Failed to fetch Equipment Lists", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  const handleEnter = async () => {
    try {
      setLoading(true);
      const quantity = parseInt(value.quantity);
      if (quantity && isNumber(quantity) && quantity > 0) {
        let remaining_qty = primaryEquipmentSet?.solar_panel_quantity - parseInt(value.quantity);

        if (remaining_qty <= 0) {
          Toast.show({
            text1: `You cannot allocate all the solar panels to ${title}`,
            type: "error",
            position: "top",
            visibilityTime: 3000,
          });
        } else {
          await onSaveEquipmentDetails([
            {
              solarPanelQuantity: parseInt(`${remaining_qty}`),
              equipmentSetUuid: primaryEquipmentSet?.uuid,
            },
            {
              solarPanelQuantity: parseInt(`${value.quantity}`),
              equipmentSetUuid: currentEquipmentSet?.uuid,
            },
          ]);
          await fetchEquipmentLists();

          navigation.navigate("EquipmentDetails", {
            title: title,
            details: {
              address: details.address,
              name: details?.name,
              installerId: details?.InstallerId,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error in handleEnter function:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: any) => (value: any) => {
    setValue({ ...value, [name]: value });
  };

  const onSaveEquipmentDetails = async (equipmentSet: any[]) => {
    const payload: any = { equipmentSet };

    try {
      const response = await saveEquipmentDetails(projectID, companyID, payload);
      if (response?.status == 200) {
        console.log("response", JSON.stringify(response?.data));
      } else {
        console.log("Failed to save equipment details", response?.data);
      }
    } catch (error: any) {
      console.log(error?.message);
    } finally {
    }
  };

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
              <Text style={styles.Address} children={"1234 W Covered Wagon Way"}></Text>
              <Text style={styles.Address} children={"Western City, ST 12345"}></Text>
              <View style={styles.btn_Installer}>
                <Text style={styles.installer} children={"Installer ID123"}></Text>
                <Button
                  color1={"#0C1F3F"}
                  color2={"#213454"}
                  color3={"#2E4161"}
                  children={"< Back"}
                  style={styles.btnStyle}
                  labelStyle={styles.buttonText}
                  onPress={() => navigation.goBack()}
                />
              </View>
            </View>
            <View style={{ paddingVertical: 40, rowGap: 20 }}>
              <View style={styles.subContainer}>
                <Text children={"How many of the"} style={styles.subText} />
                <Text style={styles.Address} children={data.modelNo}></Text>
                <Text style={styles.Address} children={data.make}></Text>
                <Text style={styles.Address} children={data.model}></Text>
                <View style={styles.extraConatiner}>
                  <Text
                    children={"Solar Panels would you like\nto  allocate to Microinverter 2?"}
                    style={styles.subText}
                  />
                  <View style={styles.info}>
                    <Image
                      style={{ width: 25, height: 25 }}
                      source={require("../../assets/Images/icons/info.png")}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.quantityContainer}>
                <View style={{ width: "30%" }}>
                  <TextInputField
                    label={"Quantity*"}
                    placeholder={"###"}
                    onChangeText={handleChange("quantity")}
                    value={value.quantity}
                    style={styles.textInput}
                    labelStyle={styles.label}
                    placeHolderColor={styles.label.color}
                  />
                </View>
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Button
                  children={"Enter"}
                  color1={"#0C1F3F"}
                  color2={"#213454"}
                  color3={"#2E4161"}
                  disabled={loading}
                  onPress={() => handleEnter()}
                  style={styles.button}
                  labelStyle={styles.optionText}
                />
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EquipmentNumber;
