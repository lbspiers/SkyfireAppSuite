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
  backupTitle: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 20,
    color: COLORS.white,
  },
  subText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 20,
    color: COLORS.white,
  },
  info: {
    verticalAlign: "top",
    alignSelf: "flex-start",
    marginTop: -6,
    paddingLeft: 5,
  },
  optionItem: {
    borderRadius: 5,
    flex: 1,
    paddingVertical: 10,
  },
  button: {
    borderRadius: 5,
    width: "40%",
    paddingVertical: 10,
    alignSelf: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 20,
    paddingVertical: 40,
  },
  subContainer: {
    rowGap: 10,
    paddingVertical: 10,
  },
  checkView: {
    flexDirection: "row",
    columnGap: 15,
    alignContent: "center",
    flexWrap: "wrap",
  },
  checkBox: {
    height: 20,
    width: 20,
    margin: 0.2,
  },
  checkMark: {
    height: 20,
    width: 20,
  },
  checkContainer: {
    paddingHorizontal: 35,
    paddingVertical: 20,
    rowGap: 30,
    paddingBottom: 30,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 16,
    textAlign: "center",
    color: "#fff",
    lineHeight: 16.8,
  },
});
