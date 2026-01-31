import * as React from "react";
import { View, StyleSheet, Image, SafeAreaView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Text from "../../components/Text";
import COLORS from "../../utils/styleConstant/Color";
import fontFamily from "../../utils/styleConstant/FontFamily";
import Button from "../../components/Button";
import { useNavigation } from "@react-navigation/native";

const Submitted = (props: any) => {
  const navigation: any = useNavigation();
  const { params } = props.route;
  return (
    <LinearGradient colors={["#2E4161", "#0C1F3F"]} style={styles.gradientView}>
      <SafeAreaView style={styles.gradientView}>
        <View style={styles.titleContainer}>
          <Text children={"Installer Project ID *"} style={styles.title}></Text>
          <Text children={"Skyfiree1127272024"} style={styles.skyfireId}></Text>
        </View>
        <LinearGradient
          colors={["#2E4161", "#0C1F3F"]}
          style={styles.contentView}
        >
          <View>
            <View style={{justifyContent:'center',alignItems:'center'}}>
              <Image
                style={styles.icon}
                source={require("../../assets/Images/icons/rightTick.png")}
              />
            </View>
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
            {params?.message && (
              <Text children={params?.message} style={styles.message}></Text>
            )}
          </View>
          {/* {params.buttonText && <View style={styles.buttonView}>
          <Button color1={"#FD7332"} color2={"#EF3826"} children={params.buttonText} style={styles.createAcc} onPress={() => navigation.navigate(params?.screenName,{email:params?.email})} labelStyle={styles.buttonText} />
        </View>} */}
        </LinearGradient>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientView: { flex: 1, backgroundColor: "#292C31" },
  createAcc: {
    height: 45,
    width: 158,
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  titleContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    gap: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    color: "#FFFFFF", // Set title color
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
  },
  skyfireId: {
    marginBottom: 30,
    color: "#9B9FA7",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  logoView: { marginLeft: 50, flex: 0.2, marginTop: 5 },
  logo: { height: 104, width: 222 },
  contentView: {
    alignItems: "center",
    marginTop: 20,
    margin: 10,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  description: {
    color: COLORS.orange,
    fontFamily: fontFamily.lato,
    fontSize: 16,
    fontWeight: "700",
    paddingTop: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  descriptionInfo: {
    color: COLORS.white,
    fontFamily: fontFamily.lato,
    fontSize: 16,
    fontWeight: "400",
    paddingTop: 14,
    textAlign: "center",
    lineHeight: 21,
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
    width: 285,
    height: 425,
    color: "#FFFFFF",
    fontFamily: fontFamily.lato,
    fontSize: 14,
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
  buttonView: { flex: 0.3, alignItems: "center" },
});
export default Submitted;
