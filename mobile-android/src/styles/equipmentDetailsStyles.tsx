import { StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
  },
  headerText: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    textAlign: "left",
    lineHeight: 40,
  },
  secondsub: {
    flexDirection: "row",
    flex: 1,
  },
  subBtn: {
    borderRadius: 5,
    flex: 1,
    alignSelf: "center",
    paddingVertical: 8,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
  textInputView: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
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
  subText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fontFamily.lato,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 20,
  },
  textView: {
    flex: 1,
    paddingHorizontal: 30,
  },
});
