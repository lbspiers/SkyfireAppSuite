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
  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
  },
  subText: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 20,
    color: COLORS.white,
  },
  extraConatiner: {
    flexDirection: "row",
    alignContent: "center",
    flexWrap: "wrap",
  },
  info: {
    marginTop: 10,
    flexGrow: 1,
  },
  btn_Installer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btnStyle: {
    width: 75,
    height: 30,
    borderRadius: 5,
  },
  button: {
    borderRadius: 5,
    width: "40%",
    paddingVertical: 10,
    alignSelf: "center",
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
  label: {
    color: "#FFFFFF80",
    fontFamily: fontFamily.lato,
    fontWeight: "700",
  },
  subContainer: {
    rowGap: 10,
    paddingVertical: 10,
  },
  quantityContainer: {
    paddingVertical: 30,
    alignItems: "center",
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
