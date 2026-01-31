import React, { Fragment, useEffect, useState } from "react";
import { TouchableOpacity, View, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { styles } from "../../styles/listComponentStyles";
import Text from "../../components/Text";
import { DeleteEquipment, GetListInventoryEquipment } from "../../api/inventry.service";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

export const ListComponent: React.FC<{
  children: string;
  onPressDelete: () => void;
}> = ({ children, onPressDelete }) => {
  const navigation:any = useNavigation();
  return (
    <View style={styles.inventoryView}>
      <LinearGradient
        colors={["#0C1F3F", "#2E4161"]}
        style={styles.componentContainer}
      >
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("InventoryCategory", {
              item: children,
            });
          }}
          style={styles.opacityContainer}
          activeOpacity={0.7}
        >
          <Text children={children} style={styles.componentText}></Text>
        </TouchableOpacity>
      </LinearGradient>
      {/* {showInventory && (
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.gradientView}
        >
          <View style={styles.showInventory}>
            <View>
              <Text children={"Make"} style={styles.inventoryTitle} />
              <Text children={"Model"} style={styles.componentText} />
            </View>
            <View style={{ flexDirection: "row", columnGap: 8 }}>
              <UtilityButton
                name={require("./../../assets/Images/icons/delete.png")}
                type={"delete"}
                onPress={handleDelete}
              />
              <UtilityButton
                name={require("./../../assets/Images/icons/3dots.png")}
                type={"dots"}
                onPress={() => setShowDetails(!showDetails)}
              />
            </View>
          </View>
        </LinearGradient>
      )} */}
      {/* {showDetails && (
        <LinearGradient
          colors={["#0C1F3F", "transparent"]}
          style={styles.gradientDetails}
          key={item?.uuid}
        >
          <View
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
               columnGap: 10,
            }}
          >
            <View>
              <Text children={"Make"} style={styles.componentText} />
              <Text children={"Model"} style={styles.componentText} />
            </View>
            <View style={{ rowGap: 5 }}>
              <Text children={item?.equipment?.manufacturer} style={styles.detailsText} />
              <Text
                children={
                  item?.equipment?.model
                }
                style={styles.detailsText}
              />
              <TouchableOpacity onPress={()=>deleteEquipment(item?.uuid)}>
                <Text children={"Delete"} style={styles.detailsText} />
              </TouchableOpacity>
          
            </View>
          </View>
        </LinearGradient>
      )} */}
    </View>
  );
};
