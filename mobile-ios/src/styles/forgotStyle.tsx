import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
    paddingHorizontal: 30,
  },
  error: {
    color: "red",
    paddingTop: 10,
  },
  logoView: { flex: 1, paddingTop: 20 },
  logoContainer: {
    flex: 0.7,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 20,
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
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  heading: {
    fontFamily: fontFamily.Inter_14pt_Black,
    fontSize: 16,
    color: COLORS.textOrange,
    fontWeight: "700",
    paddingTop: 10,
    textAlign: "center",
  },
  forgotPassText: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
  },
  btnContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  createAcc: {
    height: "100%",
    width: "55%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  backSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    paddingTop: 10,
    opacity: 0.5,
  },
});
