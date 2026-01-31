import { StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  gradientView: {
    flex: 1,
    marginBottom: 40,
  },
  username: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 10,
  },

  Address: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    color: "rgba(255, 255, 255, 1)",
    lineHeight: 21,
  },
  installer: {
    color: "rgba(134, 137, 144, 1)",
  },

  optionItem: {
    borderRadius: 5,
    flex: 1,
    height: 40,
  },

  optionsContainer: {
    flexDirection: "row",
    columnGap: 20,
    paddingVertical: 20,
    paddingTop: 25,
  },

  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },
});
