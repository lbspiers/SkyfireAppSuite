import * as React from "react";
import { View, StyleSheet, Image, SafeAreaView, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../../components/Text";
import COLORS from "../../../utils/styleConstant/Color";
import fontFamily from "../../../utils/styleConstant/FontFamily";
import Button from "../../../components/Button";
import { useNavigation } from "@react-navigation/native";

const SuccessScreen = (props: any) => {
  const navigation: any = useNavigation();
  const { params } = props.route;
  console.log(params, "success");
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={styles.gradientView}>
        <View style={styles.logoView}>
          <Image
            style={styles.logo}
            source={require("../../../assets/Images/applogo.png")}
          />
        </View>
        <View style={styles.contentView}>
          <Image
            style={styles.icon}
            source={require("../../../assets/Images/icons/rightTick.png")}
          />
          <Text children={params?.heading} style={styles.heading}></Text>
          {params?.description && (
            <Text
              children={params?.description}
              style={styles.description}
            ></Text>
          )}
          {params?.descriptionInfo && (
            <Text
              children={params?.descriptionInfo}
              style={styles.descriptionInfo}
            ></Text>
          )}
          {/* {params?.descriptionInfo && (
            <Text
              children={params?.descriptionInfo}
              style={styles.descriptionInfo}
            ></Text>
          )} */}
          {params?.content && (
            <Text children={params?.content} style={styles.content}></Text>
          )}
          {params?.message && (
            <Text children={params?.message} style={styles.message}></Text>
          )}
        </View>
        {params.buttonText && (
          <View style={styles.buttonView}>
            <Button
              color1={"#FD7332"}
              color2={"#EF3826"}
              children={params.buttonText}
              style={styles.createAcc}
              onPress={() =>
                navigation.navigate(params?.screenName, {
                  email: params?.email,
                })
              }
              labelStyle={styles.buttonText}
            />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientView: { flex: 1 },
  createAcc: {
    height: 45,
    width: 158,
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  logoView: {
    flex: 0.4,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { height: 212, width: 255 },
  contentView: { flex: 0.4, alignItems: "center" },
  description: {
    color: COLORS.textOrange,
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "400",
    paddingTop: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  descriptionInfo: {
    color: COLORS.white,
    fontFamily: fontFamily.lato,
    fontSize: 24,
    fontWeight: "400",
    paddingTop: 14,
    textAlign: "center",
    padding: 100,
    backgroundColor: "pink",
  },
  content: {
    color: COLORS.white,
    fontFamily: fontFamily.lato,
    fontSize: 24,
    fontWeight: "400",
    paddingTop: 14,
    textAlign: "center",
    lineHeight: 41,
  },
  heading: {
    color: COLORS.white,
    fontFamily: fontFamily.Inter_28pt_Regular,
    fontSize: 30,
    fontWeight: "600",
    paddingVertical: 20,
    lineHeight: 31,
    textAlign: "center",
  },
  message: {
    marginTop: 20,
    // width: 285,
    // height: 425,
    color: COLORS.textOrange,
    fontFamily: fontFamily.lato,
    fontSize: 18,
    fontWeight: "400",
    paddingVertical: 10,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 10,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  icon: { height: 100, width: 100, marginVertical: 12 },
  buttonView: {
    flex: 0.2,
    alignItems: "center",
    justifyContent: "center",
    // paddingTop: Platform.OS === "ios" ? 70 : 0,
  },
});
export default SuccessScreen;
