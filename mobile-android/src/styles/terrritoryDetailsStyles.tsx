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
    paddingTop: Platform.OS === "ios" ? 0 : 20,
  },
  fieldsView: {
    flex: 0.05,
    alignItems: "center",
    flexDirection: "row",
    // padding: 5,
    paddingHorizontal: 20,
  },
  textInputView: {
    flex: 0.8,
    paddingHorizontal: 40,
  },
  checkBoxContainer: {
    alignSelf: "center",
    flex: 0.15,
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

  iconStyle: {
    width: 35,
    height: 35,
  },
  errormessage: {
    color: COLORS.red,
    paddingTop: 10,
  },
  closeContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  join: {
    height: 48,
    width: "51%",
    margin: 10,
    borderRadius: 90,
    paddingVertical: 5,
  },

  heading: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    flexGrow: 1,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 42,
    textAlign: "right",
  },
  buttonView: {
    flex: 1,
    alignItems: "center",
    // padding: 20,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 16.8,
    textAlign: "center",
  },

  error: {
    color: "red",
    marginTop: 10,
    fontSize: 12,
  },
  label: {
    color: "#FFFFFF80",
  },
  keepView: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  keepMeLogText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    paddingLeft: 10,
  },
});
