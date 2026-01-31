import { Platform, StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import FONTSIZE from "../utils/styleConstant/Font";
import COLORS from "../utils/styleConstant/Color";
// const colors = getColor()
export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientView: {
    flex: 1,
    // paddingTop: 30,
  },
  fieldsView: {
    // justifyContent: "center",
    flex: 0.5,
    // alignItems: "center",
  },
  logoContainer: {
    flex: 0.7,
    justifyContent: "flex-end",
    // alignItems: "center",
    paddingVertical: 15,
    paddingLeft: 50,
  },
  errormessage: {
    color: COLORS.red,
    paddingTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  join: {
    height: "100%",
    width: "51%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  textInputView: {
    flex: 0.5,
    // padding: 20,
    paddingHorizontal: 30,
    paddingTop: 0,
  },

  heading: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 42,
  },
  buttonView: {
    flex: 1,
    alignItems: "center",

    justifyContent: "flex-start",
    paddingVertical: 10,
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
    // Set label text color
  },
});
