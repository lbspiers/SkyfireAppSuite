import React, { useEffect, useState } from "react";
import { FlatList, View, SafeAreaView, ActivityIndicator } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { HeaderLogoComponent } from "../../components/Header";
import { styles } from "../../styles/inventoryStyle";
import Button from "../../components/Button";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { ListComponent } from "./ListComponent";
import AlertBox from "../../components/Alert";
import {
  GetListInventoryEquipment,
  ListAllEquipmentsData,
} from "../../api/inventry.service";
import { useSelector } from "react-redux";

const Inventory = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [Inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchListItems = async () => {
    setLoading(true);
    try {
      const response = await ListAllEquipmentsData();
      if (response?.status == 200) {
        setInventories(response?.data?.data);
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

  const navigation = useNavigation<NavigationProp<string | any>>();

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={{ flex: 1, paddingTop: 30 }}>
        <HeaderLogoComponent
          isTitle={true}
          title="Inventory"
          applogo={true}
          back={true}
          onBackButtonPress={() => navigation.navigate("Home")}
        />
        <View style={styles.mainContainer}>
          <View style={styles.listContainer}>
            <Button
              color1={"#FD7332"}
              color2={"#EF3826"}
              children={"+ Add Inventory"}
              style={styles.inventoryContainer}
              onPress={() => navigation.navigate("AddInventory")}
              labelStyle={styles.inventoryText}
            />
            {loading && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
            <FlatList
              data={Inventories}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <ListComponent
                  key={index}
                  children={item}
                  onPressDelete={() => setShowModal(true)}
                />
              )}
            />
          </View>
        </View>
      </SafeAreaView>
      {showModal && (
        <AlertBox
          isVisible={showModal}
          message={"Your about to delete this equipment from your Inventory"}
          label1={"Remove"}
          lable2={"Cancel"}
          closeModal={() => setShowModal(false)}
          button1onPress={() =>
            navigation.navigate("ForgotPassword", {
              flag: "password",
            })
          }
          button2onPress={() => {
            () => setShowModal(false);
          }}
        />
      )}
    </LinearGradient>
  );
};

export default Inventory;
