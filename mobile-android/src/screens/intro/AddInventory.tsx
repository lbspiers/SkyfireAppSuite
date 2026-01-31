import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/addInventoryStyle";
import { HeaderLogoComponent } from "../../components/Header";
import { NavButton } from "../../components/NavButton/NavButton";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Button from "../../components/Button";
import InputModal from "../../components/Forms/InputModal/InputModal";
import {
  GetModelNumber,
  ListAllEquipmentsData,
  ListAllManufacturer,
} from "../../api/inventry.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddInventory = ({navigation}:any) => {
  //const navigation = useNavigation<NavigationProp<string | any>>();
  const [listItems, setListItems] = useState<any[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<any>();
  const [modalVisible, setModal] = React.useState(false);
  const [manufacturerList, setManufacturerList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchListItems = async () => {
    setLoading(true);
    try {
      const response = await ListAllEquipmentsData();
      if (response?.status == 200) {
        setListItems(response?.data?.data);
      } else {
        console.log(response?.data);
      }
    } catch (error) {
      console.log("error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListItems();
  }, []);

  const onPress = (state: string) => {
    // alert();
    setModal(true);
    setSelectedInventory(state);
  };

  useEffect(() => {
    if (selectedInventory) {
      ListAllManufacturerData(selectedInventory);
    }
  }, [selectedInventory]);

  const ListAllManufacturerData = async (type: any) => {
    try {
      const response: any = await ListAllManufacturer(type);
      console.log("responseDataaaaaaa", response?.data);
      if (response?.status == 200) {
        setManufacturerList(response?.data?.data);
        setModal(true);
      } else {
        setManufacturerList([]);
        console.log(response?.data);
      }
      console.log(response?.data?.data);
    } catch (error: any) {
      console.log(error?.message);
    }
  };

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, paddingTop: 30 }}>
        <HeaderLogoComponent
          isTitle={true}
          title="+Add Inventory"
          applogo={true}
          back={false}
          onBackButtonPress={() => navigation.goBack()}
          onIconPress={() => {}}
        />
        <View style={styles.mainContainer}>
          <View>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <FlatList
                data={listItems}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => (
                  <View style={{ alignItems: "center" }}>
                    <Button
                      color1={"#FD7332"}
                      color2={"#EF3826"}
                      // children={"Sign in"}
                      children={"Finish"}
                      style={styles.createAcc}
                      onPress={() => navigation.navigate("Home")}
                      labelStyle={styles.buttonTextSignin}
                    />
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <Button
                    key={index}
                    color1={selectedInventory === item ? "#FD7332" : "#0C1F3F"}
                    color2={selectedInventory === item ? "#EF3826" : "#2E4161"}
                    children={item}
                    style={styles.inventoryContainer}
                    onPress={() => onPress(item)}
                    labelStyle={styles.inventoryText}
                  />
                )}
              />
            )}
          </View>
        </View>
        {modalVisible && (
          <InputModal
            isVisible={modalVisible}
            title={selectedInventory}
            closeModal={() => setModal(false)}
            onPressButton={() => {
              setModal(false), navigation.navigate("Home");
            }}
            bottonText={"Not Listed ?"}
            data={manufacturerList}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AddInventory;
