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
  circleCheckMark: {
    height: 20,
    width: 20,
    tintColor: COLORS.white,
    alignSelf: "center",
  },
  circleCheck: {
    height: 30,
    // backgroundColor: "red",
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
  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
  },
  circleBtnText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    verticalAlign: "middle",
    color: "#fff",
  },
  secondsub: {
    flexDirection: "row",
    flex: 1,
  },
  sub: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexGrow: 1,
  },
  list: {
    flexDirection: "row",
    flex: 1,
    alignContent: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
  },
  serviceList: {
    flexDirection: "row",
    flex: 1,
    alignContent: "center",
    paddingVertical: 20,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  serviceSection: {
    rowGap: 15,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  circleSelection: {
    width: 30,
    height: 30,
    borderRadius: 50,
  },

  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  subTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "400",
    color: COLORS.white,
  },

  extraInfo: {
    width: 25,
    height: 25,
    marginTop: -5,
  },
  optionItem: {
    borderRadius: 5,
    flex: 1,
    height: 40,
  },
  extraSub: {
    flex: 1,
    flexDirection: "row",
    paddingBottom: 25,
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 20,
    paddingVertical: 20,
    paddingTop: 25,
  },
  calcsBtn: {
    borderRadius: 5,
    padding: 4,
    height: 30,
    width: 100,
  },
  subButton: {
    width: 150,
    borderRadius: 5,
    height: 40,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },
  fieldName: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    color: "rgba(134, 137, 144, 1)",
    lineHeight: 17,
  },
});
