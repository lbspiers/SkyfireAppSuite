// CheckBox.tsx
import React from "react";
import { View, TouchableOpacity, Image, ImageBackground, StyleSheet, Pressable } from "react-native";
import COLORS from "../../../../utils/styleConstant/Color";
import Text from "../../../../components/Text";
import fontFamily from "../../../../utils/styleConstant/FontFamily";

const CheckBox = ({ label, checked, onPress,isInfo,infoStyles={} }) => {
  return (
    <View style={styles.checkView}>
      <TouchableOpacity onPress={onPress}>
        {checked ? (
          <ImageBackground
            style={styles.checkBox}
            source={require("../../../../assets/Images/icons/activeCheck.png")}
          >
            <Image
              source={require("../../../../assets/Images/icons/checkMark.png")}
              style={styles.checkMark}
              tintColor={COLORS.white}
            />
          </ImageBackground>
        ) : (
          <Image
            style={styles.checkBox}
            source={require("../../../../assets/Images/icons/checkbox.png")}
          />
        )}
      </TouchableOpacity>
      {/* <Text children={label} style={styles.fieldName} is/> */}
     <View style={{flexDirection:"row"}}>
          <Text children={label} style={styles.fieldName} />
          {isInfo && <Pressable style={{marginTop:-10}}>
                    <Image
                      style={[infoStyles,{ width: 25, height: 25 }]}
                      source={require("../../../../assets/Images/icons/info.png")}
                    />
                  </Pressable>}
          </View>
    </View>
  );
};

const styles = StyleSheet.create({
    checkView: {
      flexDirection: "row",
      columnGap: 15,
      alignItems:"center"
    },
    checkBox: {
      height: 30,
      width: 30,
      justifyContent: "center",
      alignContent: "center",
    },
    checkMark: {
      justifyContent: "center",
      alignSelf: "center",
      height: 25,
      width: 25,
    },
    fieldName: {
      fontFamily: fontFamily.lato,
      fontWeight: "700",
      fontSize: 14,
      color: "rgba(134, 137, 144, 1)",
      lineHeight: 17,
      paddingVertical: 2,
    },
  });
export default CheckBox;
