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
    lineHeight: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  eSSContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  btnStyle: {
    width: 75,
    height: 30,
    borderRadius: 5,
  },
  backupContainer: {
    paddingHorizontal: 30,
  },
  optionItem: {
    borderRadius: 5,
    flex: 1,
    padding: 5,
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 10,
  },
  extraInfo: {
    justifyContent: "center",
    position: "absolute",
    bottom: "18%",
    left: "40%",
  },
  option: {
    flex: 1,
    rowGap: 10,
  },
  camOption: {
    flex: 1,
    alignSelf: "flex-start",
  },
  subContainer: {
    flex: 1,
    flexDirection: "row",
  },
  subBtn: {
    borderRadius: 5,
    flex: 1,
    alignSelf: "center",
    paddingVertical: 6,
  },
  extraBtns: {
    flexDirection: "row",
    width: "58%",
    marginVertical: 15,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
  textInputView: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  infoIcon: {
    height: 18,
    width: 18,
    resizeMode: "contain",
    tintColor: COLORS.white,
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
    fontFamily: fontFamily.lato,
    fontWeight: "700",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  subText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    textAlign: "left",
    lineHeight: 20,
    paddingRight: 5,
  },
  textView: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  extraCamStyle: {
    justifyContent: "flex-end",
    flex: 1,
    alignItems: "flex-end",
    paddingBottom: 20,
  },
  checkView: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  checkText: {
    // fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    paddingLeft: 10,
  },
});
