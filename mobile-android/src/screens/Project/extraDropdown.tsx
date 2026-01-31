import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

import COLORS from "../../utils/styleConstant/Color";
import Text from "../../components/Text";

const DropdownComponent = ({ label, onChangeValue, error,data,type,values}: any) => {
  const [value, setValue] = useState( null);
  let formattedData = data?.map(item => ({ label: item, value: item }));
  if(label == 'Model Number' || label =='Select Model'){
    formattedData=data?.map((item:any)=>({...item,label:item?.model,value:item?.uuid}))
  }

  useEffect(()=>{
    if(values)
    setValue(values);
  },[values])

  return (
    <>
      <Dropdown
        style={styles.dropdown}
        containerStyle={{
          backgroundColor: "#2E4161",
          borderWidth: 1,
          borderColor: COLORS.white,
        }}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        itemContainerStyle={styles.itemContainerStyle}
        itemTextStyle={{ color: COLORS.white }}
        data={formattedData}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={label}
        value={value}
        onChange={(item: any) => {
          setValue(item.value);
          if (onChangeValue) {
            onChangeValue(item.value); // Pass selected value to the parent
          }
        }}
        renderItem={(item) => (
          <View
            style={[styles.item, item.value === value && styles.selectedItem]}
          >
            <Text
              style={[
                styles.itemText,
                item.value === value && styles.selectedItemText,
              ]}
            >
              {item.label}
            </Text>
          </View>
        )}
      />
      <Text style={{ color: "red" }}>{error}</Text>
    </>
  );
};

export default DropdownComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dropdown: {
    height: 60,
    borderBottomColor: "#FFFFFF80",
    borderBottomWidth: 0.5,
    width: "100%",
  },
  itemContainerStyle: {
    borderBottomWidth: 0.2,
    borderColor: "#FFFFFF80",
    marginHorizontal: 14,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 14,
    color: "#FFFFFF80",
  },
  selectedTextStyle: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
  },
  item: {
    paddingVertical: 18,
    backgroundColor: "#2E4161",
    padding: 10,
    // Default background color for unselected items
  },
  itemText: {
    fontSize: 16,
    color: "gray",
  },

  selectedItem: {
    backgroundColor: COLORS.textOrange, // Change the background color for the selected item
    width: "100%",
    padding: 10,
  },
  selectedItemText: {
    color: COLORS.white, // Change the text color for the selected item
    fontWeight: "bold", // Make the selected item text bold
  },
});
