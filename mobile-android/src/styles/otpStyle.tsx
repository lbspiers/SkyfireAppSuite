import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
    paddingHorizontal: 30,
  },
  errorview: {
    color: "red",
  },
  logoView: { flex: 0.4 },

  logoContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  tagLine: {
    fontFamily: fontFamily.lato,
    fontSize: 16,
    color: COLORS.textOrange,
    fontWeight: "700",
    paddingTop: 10,
    textAlign: "center",
  },
  forgotpassView: {
    justifyContent: "flex-end",
    alignItems: "center",
    flex: 0.4,
  },
  textInputContainer: {
    marginBottom: 20,
  },
  createAcc: {
    width: "55%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  enterOtp: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
  },
  textInput: {
    color: COLORS.white, // Change the text color here
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  otpInputView: { flex: 0.2, flexDirection: "row", justifyContent: "center" },
  buttonView: { alignItems: "center" },
});
