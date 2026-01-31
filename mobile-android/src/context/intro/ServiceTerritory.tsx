import React, { useEffect, useState } from "react";
import { View, SafeAreaView, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../components/Text";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { FlatGrid } from "react-native-super-grid";
import Button from "../../components/Button";
import { styles } from "../../styles/serviceTerriotoryStyle";
import { HeaderLogoComponent } from "../../components/Header";
import { NavButton } from "../../components/NavButton/NavButton";
import AlertBox from "../../components/Alert";
import USdata from "./../../utils/json/states.json";
import { useSelector } from "react-redux";
import { Delete_Service_Territory } from "../../api/introModule.service";
import Toast from "react-native-toast-message";
import COLORS from "../../utils/styleConstant/Color";
import fontFamily from "../../utils/styleConstant/FontFamily";
const ServiceTerritory = ({ route, navigation }: any) => {
  const { isDrawer } = route.params || false;
  console.log("isDrawer", isDrawer);
  // const navigation = useNavigation<NavigationProp<string | any>>();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [itemState, setItemState] = useState("");
  const [modal, setModal] = useState<boolean>(false);
  const companyAddress = useSelector(
    (store: any) => store?.profile?.profile?.company?.serviceTerritories
  );
  const companyId = useSelector((store: any) => store?.profile?.profile);

  const onPress = (state: string) => {
    setItemState(state);
    if (selectedStates.includes(state)) {
      setModal(true);
      // Show Modal then Remove
    } else {
      navigation.navigate("TerritoryDetails", {
        title: state,
        setSelectedStates,
      });
      //setSelectedStates((prevStates) => [...prevStates, state]);
    }
  };
  const deleteServiceTerritory = async (companyId: any, uuid: any) => {
    try {
      const response: any = await Delete_Service_Territory(companyId, uuid);
      if (response?.status == 200) {
        Toast.show({
          text1: "Territory deleted Successfully",
          type: "success",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      console.log(error?.message);
    }
  };
  const deleteItem = async (statusCode: any) => {
    const data = companyAddress?.find(
      (item: any) => item?.state_code == statusCode
    );
    if (data) {
      deleteServiceTerritory(companyId?.company?.uuid, data?.uuid);
      setSelectedStates((prevStates) =>
        prevStates.filter((s) => s !== statusCode)
      );
    }
  };
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, paddingTop: 30 }}>
        <HeaderLogoComponent
          isTitle={false}
          back={false}
          applogo={true}
          onIconPress={() => {}}
          onBackButtonPress={() => navigation.goBack()}
        />
        <View style={styles.mainContainer}>
          <View style={{ rowGap: 20, flex: 0.1 }}>
            <Text style={styles.mainHeader}>Service Territory</Text>
            <Text children="Pick your State's" style={styles.subText} />
          </View>
          <View style={{ flex: 0.75 }}>
            <FlatGrid
              itemDimension={50}
              data={USdata.states}
              renderItem={({ item, index }) => (
                <Button
                  key={index}
                  color1={
                    selectedStates.includes(item.short_name)
                      ? "#FD7332"
                      : "#0C1F3F"
                  }
                  color2={
                    selectedStates.includes(item.short_name)
                      ? "#EF3826"
                      : "#2E4161"
                  }
                  children={item.short_name}
                  style={styles.statesContainer}
                  onPress={() => onPress(item.short_name)}
                  labelStyle={styles.statesText}
                />
              )}
            />
          </View>
          <View
            style={{
              flex: 0.15,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Button
              color1={"#FD7332"}
              color2={"#B92011"}
              children={"Next"}
              style={styles.uploadBtn}
              labelStyle={styles.buttonText}
              onPress={() => {
                navigation.navigate("AddInventory");
              }}
            />

            <TouchableOpacity
              style={{ paddingTop: 20 }}
              onPress={() => navigation.goBack("")}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: COLORS.white,
                  fontFamily: fontFamily.lato,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {"< Back"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* <NavButton
            source={require("../../assets/Images/icons/Navigate.png")}
            onPress={() => navigation.navigate("AddInventory")}
            style={styles.navBtnContainer}
            imageStyle={styles.navBtn}
          /> */}
        </View>
        {modal && (
          <AlertBox
            isVisible={modal}
            message={
              "Are you sure you want to \n remove the state from your \n Service Territory"
            }
            label1={"Remove"}
            lable2={"Cancel"}
            closeModal={() => setModal(false)}
            button1onPress={() => {
              // console.log(itemState)
              deleteItem(itemState);
              // setSelectedStates((prevStates) =>
              //   prevStates.filter((s) => s !== itemState)
              // )
            }}
            button2onPress={() => setModal(false)}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};
export default ServiceTerritory;
