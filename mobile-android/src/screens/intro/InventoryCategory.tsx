import React, { Fragment, useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  Image,
  SafeAreaView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../components/Text";
import { HeaderLogoComponent } from "../../components/Header";
import Button from "../../components/Button";
import Icon from "react-native-vector-icons";
import {
  DeleteEquipment,
  GetListInventoryEquipment,
} from "../../api/inventry.service";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import AlertBox from "../../components/Alert";
import logger from "../../utils/logger";
const data = [
  {
    id: "1",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "2",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "3",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "4",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "5",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "6",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "7",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
  {
    id: "8",
    name: "Tesla",
    description:
      "Tesla Solar Inverter 7.6 kWCompletes the Tesla home solar system, converting DC power from solar to AC power for home consumption",
  },
];

const InventoryCategory = ({ route,navigation }: any) => {
 // const navigation = useNavigation();
  
  const [showModal, setShowModal] = useState(false);
  const [uuid, setUUid] = useState("");
  const [listEquipment, setListEquipment] = useState([]);
  const companyId = useSelector((store: any) => store?.profile?.profile?.company?.uuid);
  console.log("companyID==============>",companyId)
  const [loading, setLoading] = useState(false);

  const fetchListQuipmentInveentory = async (manufacturer: any) => {
    setLoading(true);
    try {
      // Fetching the inventory list for the given manufacturer
      const response = await GetListInventoryEquipment(
        companyId,
        manufacturer
      );

      if (response?.status === 200) {
        // Successfully fetched data, updating state
        setListEquipment(response.data?.data);
        console.log(
          "Equipment data fetched successfully:",
          response.data?.data
        );
      } else {
        // Handle unexpected statuses
        console.error(
          "Unexpected response status:",
          response?.status,
          response?.data
        );
      }
    } catch (error: any) {
      // Detailed error handling
      if (error.response) {
        // Server responded with a status code outside of the 2xx range
        console.error(
          "Server error:",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request was made but no response was received
        console.error("No response received from server:", error.request);
      } else {
        // Something else happened during request setup
        console.error("Error setting up request:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  //     if (response?.status === 200) {
  //       // Successfully fetched data, updating state
  //       setListEquipment(response.data?.data);
  //       console.log(
  //         "Equipment data fetched successfully:",
  //         response.data?.data
  //       );
  //     } else {
  //       // Handle unexpected statuses
  //       console.error(
  //         "Unexpected response status:",
  //         response?.status,
  //         response?.data
  //       );
  //     }
  //   } catch (error: any) {
  //     // Detailed error handling
  //     if (error.response) {
  //       // Server responded with a status code outside of the 2xx range
  //       console.error(
  //         "Server error:",
  //         error.response.status,
  //         error.response.data
  //       );
  //     } else if (error.request) {
  //       // Request was made but no response was received
  //       console.error("No response received from server:", error.request);
  //     } else {
  //       // Something else happened during request setup
  //       console.error("Error setting up request:", error.message);
  //     }
  //   }
  // };

  const deleteEquipment = async (UUID: any) => {
    try {
      const response = await DeleteEquipment(companyId, UUID);
      if (response?.status === 200) {
        Toast.show({
          text1: "Equipment deleted Successfully",
          type: "success",
          position: "top",
          visibilityTime: 2000,
        });
        fetchListQuipmentInveentory(route?.params?.item);
      } else {
        Toast.show({
          text1: "Failed to delete equipment",
          type: "error",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      // Detailed error handling
      if (error.response) {
        // Server responded with a status code outside of the 2xx range
        console.error(
          "Server error:",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request was made but no response was received
        console.error("No response received from server:", error.request);
      } else {
        // Something else happened during request setup
        console.error("Error setting up request:", error.message);
      }
    }
  };

  useEffect(() => {
    fetchListQuipmentInveentory(route?.params?.item);
  }, [route?.params?.item]);
  return (
    <LinearGradient
      colors={["#0C1F3F", "#2E4161"]}
      style={styles.componentContainer}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderLogoComponent
          isTitle={true}
          title={route?.params?.item}
          back={true}
          applogo={true}
          onIconPress={() => {}}
          onBackButtonPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1 }}>
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
          ) : listEquipment?.length == 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* <Text style={{ color: "white", textAlign: "center" }}>
              No equipment found for this manufacturer
            </Text> */}
              <Text
                style={{ color: "white", textAlign: "center" }}
                children={"No equipment found for this manufacturer"}
              />
            </View>
          ) : (
            <FlatList
              contentContainerStyle={{
                paddingBottom: 50,
                paddingHorizontal: 10,
              }}
              data={listEquipment}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }: any) => (
                <LinearGradient
                  colors={["#2E4161", "#0C1F3F"]}
                  style={{
                    flex: 1,
                    margin: 10,
                    padding: 15,
                    borderRadius: 15,
                  }}
                  key={item?.uuid}
                >
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 0.4 }}>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "800",
                        }}
                      >
                        Make :{item?.equipment?.manufacturer}
                      </Text>
                    </View>
                    <View style={{ flex: 0.5 }}>
                      <Text style={{ color: "white" }}>{item.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setShowModal(true);
                        setUUid(item?.uuid);
                        //deleteEquipment(item?.uuid);
                      }}
                      style={{ flex: 0.1, alignItems: "center" }}
                    >
                      <Image
                        tintColor={"white"}
                        source={require("./../../assets/Images/icons/delete.png")}
                        style={{
                          height: 15,
                          width: 15,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 15 }}>
                    <View style={{ flex: 0.4 }}>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "800",
                        }}
                      >
                        Model : {item?.equipment?.model}
                      </Text>
                    </View>
                    <View style={{ flex: 0.6 }}>
                      <Text style={{ color: "white", flex: 1 }}>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit.
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              )}
            />
          )}
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
            // navigation.navigate("ForgotPassword", {
            //   flag: "password",
            // })
            deleteEquipment(uuid)
          }
          button2onPress={() => {
            () => setShowModal(false);
          }}
        />
      )}
    </LinearGradient>
  );
};
export default InventoryCategory;

const styles = StyleSheet.create({
  inventoryView: {
    flex: 1,
  },
  componentContainer: {
    flex: 1,
  },
});
