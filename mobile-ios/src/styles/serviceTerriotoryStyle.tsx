import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    // paddingTop: 10,
    // rowGap: 10,
    paddingHorizontal: 30,
  },
  gradientView: {
    flex: 1,
  },
  mainHeader: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
  subText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    textAlign: "center",
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  uploadBtn: {
    height: "40%",
    width: "42%",
    borderRadius: 90,
  },
  statesContainer: {
    height: 45,
    width: 45,
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  statesText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  navBtnContainer: {
    alignItems: "center",
  },
  navBtn: {
    height: 45,
    width: 45,
  },
});
