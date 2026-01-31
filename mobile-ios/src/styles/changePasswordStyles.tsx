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
    paddingHorizontal: 30,
  },
  logoView: { flex: 0.4 },

  logoContainer: {
    flex: 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  signInTextView: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    flex: 0.2,
  },
  signinText: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
  },
  tagLine: {
    fontFamily: fontFamily.lato,
    fontSize: 16,
    color: COLORS.textOrange,
    fontWeight: "700",
    paddingTop: 10,
  },
  textInputView: {
    flex: 0.5,
  },
  input: {
    height: 30,
    marginVertical: 10,
  },
  label: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    paddingTop: 10,
    opacity: 0.5,
  },
  errorText: {
    color: "red",
    paddingTop: 10,
  },
  keepView: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  keepMeLogText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    paddingLeft: 10,
  },
  buttonView: {
    flex: 0.5,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: Platform.OS === "ios" ? 30 : 30,
  },
  createAcc: {
    height: "22%",
    width: "68%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: "700",
  },
  buttonTextSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  needHelpView: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 45 : 40,
  },
  needHelpText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    paddingTop: 10,
    opacity: 0.5,
  },
});
