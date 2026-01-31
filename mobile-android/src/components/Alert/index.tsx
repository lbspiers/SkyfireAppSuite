import * as React from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import LinearGradient from "react-native-linear-gradient";
import COLORS from "../../utils/styleConstant/Color";
import Text from "../../components/Text";
import FONTSIZE from "../../utils/styleConstant/Font";
import Button from "../Button";
import fontFamily from "../../utils/styleConstant/FontFamily";

const AlertBox = ({
  isVisible,
  message,
  label1,
  lable2,
  button1onPress = () => {},
  button2onPress = () => {},
  closeModal = () => {},
}: any) => {
  return (
    <Modal
      isVisible={isVisible}
      style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}
    >
      <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.container}>
        <TouchableOpacity
          style={{
            justifyContent: "center",
            paddingRight: 12,
            alignItems: "flex-end",
            paddingTop: 10,
          }}
          onPress={() => closeModal()}
        >
          <Image
            source={require("../../assets/Images/icons/close.png")}
            style={{ height: 30, width: 30, tintColor: COLORS.textOrange }}
          />
        </TouchableOpacity>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 15,
            paddingHorizontal: 20,
          }}
        >
          <Text
            children={message}
            numberOfLines={3}
            style={{
              color: COLORS.white,
              fontSize: 19,
              opacity: 0.8,
              textAlign: "center",
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignSelf: "center",
            paddingVertical: 20,
            alignItems: "center",
          }}
        >
          {label1 && (
            <Button
              color1={"#FD7332"}
              color2={"#B92011"}
              children={label1}
              style={styles.createAcc}
              onPress={() => {
                closeModal(), button1onPress();
              }}
              labelStyle={styles.buttonText}
            />
          )}
          {lable2 && (
            <Button
              color1={"#D9E6ED"}
              color2={"#018AD7"}
              children={lable2}
              style={styles.createAcc}
              onPress={() => {
                closeModal(), button2onPress();
              }}
              labelStyle={styles.buttonTextSignin}
            />
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "auto",
    width: "100%",
    borderRadius: 20,
  },
  createAcc: {
    height: "100%",
    width: "35%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  buttonTextSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
});
export default AlertBox;
