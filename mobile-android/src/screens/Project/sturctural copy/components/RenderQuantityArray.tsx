import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import Text from "../../../../components/Text";
import DropDownField from "./DropDownField";
import COLORS from "../../../../utils/styleConstant/Color";
import fontFamily from "../../../../utils/styleConstant/FontFamily";
import InfoIcon from "../../../../components/InfoIcon/InfoIcon";

export const RenderQuantityArray = () => {
  const [array, setArray] = useState<number[]>([1, 2, 3, 4]);

  const toggleAddQuantity = () => {
    if (array.length < 32) {
      setArray((prevArray) =>
        [
          ...prevArray,
          prevArray.length + 1,
          prevArray.length + 2,
          prevArray.length + 3,
          prevArray.length + 4,
        ].slice(0, 32)
      );
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.quantityContainer}>
      <View
        style={[
          styles.extraQuantity,
          { rowGap: 13, paddingBottom: index === 0 ? 33 : 0 },
        ]}
      >
        {index === 0 && <InfoIcon isgradientInfo={true} />}
        <Text children={"Quantity"} style={styles.fieldName} />
      </View>
      <View style={styles.arrayContainer}>
        {item.map((element) => (
          <View style={styles.quantities} key={element}>
            <DropDownField
              label={`Array ${element}`}
              labelInfo={false}
              dropDownLabel="XX"
            />
          </View>
        ))}
      </View>
    </View>
  );

  const transformData = () => {
    const rows = [];
    for (let i = 0; i < array.length; i += 4) {
      rows.push(array.slice(i, i + 4));
    }
    return rows;
  };

  return (
    <View style={{ alignItems: "center" }}>
      <FlatList
        data={transformData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListFooterComponent={
          array.length < 32 ? (
            <View style={styles.toggleButton}>
              <TouchableOpacity onPress={toggleAddQuantity}>
                <Image
                  source={require("../../../../assets/Images/icons/close.png")}
                  style={styles.closeIcon}
                  tintColor={COLORS.grey}
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  quantities: {
    width: "17%",
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: COLORS.grey,
    lineHeight: 17,
  },
  extraQuantity: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginRight: 10,
  },
  arrayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  toggleButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: "50%",
    marginTop: 10,
    marginBottom: 20,
  },
  closeIcon: {
    width: 25,
    height: 25,
    transform: [{ rotate: "45deg" }],
  },
});
