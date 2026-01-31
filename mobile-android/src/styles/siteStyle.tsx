import { Platform, StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import FONTSIZE from "../utils/styleConstant/Font";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    textAlign: "left",
  },
  textInputView: {
    flex: 1,
    paddingHorizontal: 30,
  },
  mapButton: {
    borderRadius: 90,
    flex: 1,
    alignSelf: "center",
    alignItems: "center",
    padding: 15,
    paddingHorizontal: 50,
  },
  infoIcon: {
    height: 18,
    width: 18,
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 16.8,
    textAlign: "center",
  },
  textInput: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 21,
    backgroundColor: "transparent",
    color: "white",
    paddingHorizontal: 0,
  },
  createAcc: {
    height: "100%",
    width: "48%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  contentStyle: {
    color: "white",
    padding: 0,
    margin: 0,
  },
  error: {
    color: "red",
    marginTop: 10,
    fontSize: 12,
  },
  label: {
    color: "#FFFFFF80",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  buttonTextSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
});
