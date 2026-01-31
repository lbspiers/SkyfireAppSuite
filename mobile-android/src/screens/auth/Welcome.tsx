import * as React from "react";
import { View, StyleSheet, Image, SafeAreaView, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../components/Text";
import COLORS from "../../utils/styleConstant/Color";
import fontFamily from "../../utils/styleConstant/FontFamily";
import Button from "../../components/Button";
import { useNavigation } from "@react-navigation/native";

const WelcomeScreen = (props: any) => {
  const navigation: any = useNavigation();
  const { params } = props.route;

  const steps = [
    {
      key: "Step 1",
      value: "Create a Company Profile",
    },
    {
      key: "Step 2",
      value: "Select Service Territory",
    },
    {
      key: "Step 3",
      value: "Select Preferred Equipment",
    },
    {
      key: "Step 4",
      value: "Generate Plan Sets in Minutes",
    },
  ];

  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={styles.gradientView}>
        <View style={styles.logoView}>
          <Image style={styles.logo} source={require("../../assets/Images/applogo.png")} />
        </View>
        <View style={styles.welcomeView}>
          <Text children={"Welcome"} style={styles.heading}></Text>
        </View>
        <View style={styles.contentView}>
          <Text style={styles.welcomeMessage}>{"Let's set up your Company Account"}</Text>
          <View style={{ flexDirection: "column" }}>
            {steps.map((step: any) => {
              return (
                <View style={{ flexDirection: "row" }}>
                  <Text style={styles.steps}>{step.key}:</Text>
                  <Text style={styles.createCompText}>{step.value}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View
          style={{
            flex: 0.3,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button
            color1={"#FD7332"}
            color2={"#EF3826"}
            // children={"Sign in"}
            children={"Set up my Account"}
            style={styles.createAcc}
            onPress={() => navigation.navigate("CompanyAddress")}
            labelStyle={styles.buttonText}
          />
        </View>
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
  logo: {
    height: 212,
    width: 255,
  },
  welcomeView: {
    flex: 0.1,
    paddingTop: 20,
    alignItems: "center",
  },
  contentView: {
    flex: 0.35,
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeMessage: {
    color: COLORS.textOrange,
    fontFamily: fontFamily.lato,
    fontSize: 16.5,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 15,
  },
  needText: {
    color: COLORS.white,
    fontFamily: fontFamily.lato,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  createCompText: {
    color: COLORS.textOrange,
    fontFamily: fontFamily.lato,
    fontSize: 18,
    fontWeight: "600",
    // textAlign: "center",
    lineHeight: 40,
  },
  steps: {
    color: COLORS.white,
    fontFamily: fontFamily.lato,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 40,
    width: 75,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  heading: {
    color: COLORS.white,
    fontFamily: fontFamily.Inter_28pt_Regular,
    fontSize: 38,
    fontWeight: "700",
    paddingVertical: 20,
    lineHeight: 31,
    textAlign: "center",
  },
});
export default WelcomeScreen;
