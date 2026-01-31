import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    rowGap: 20,
  },
  gradientView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainHeader: {
    fontFamily: fontFamily.lato,
    fontSize: 27,
    color: COLORS.white,
    fontWeight: "400",
    textAlign: "center",
    height: 32,
  },
  inventoryContainer: {
    height: 45,
    width: "100%",
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  inventoryText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  createAcc: {
    height: 50,
    width: "48%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  buttonTextSignin: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  listContainer: {
    rowGap: 10,
  },
  navBtnContainer: {
    alignItems: "center",
    paddingTop: 26,
  },
  navBtn: {
    height: 45,
    width: 45,
    transform: [{ rotateY: "180 deg" }],
  },
});
