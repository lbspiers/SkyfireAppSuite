import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: "center",
  },
  subContainer: {
    flex: 0.5,
    // padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientView: {
    flex: 1,
    // paddingHorizontal: 18,
  },
  uploadContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.white,
    borderStyle: "dotted",
    borderRadius: 10,
    rowGap: 5,
    // paddingVertical: 30,
    height: Platform.OS === "ios" ? "85%" : "80%",
    justifyContent: "center",
    alignContent: "center",
    width: "90%",
  },

  // Logo Style

  // Text Styles

  mainHeader: {
    fontFamily: fontFamily.lato,
    fontSize: 25,
    color: COLORS.white,
    fontWeight: "700",
    paddingLeft: 30,
    // textAlign: "center",
    height: 32,
  },
  subText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    textAlign: "center",
    height: 17,
    margin: 10,
    // padding: 10,
  },
  midText: {
    fontFamily: fontFamily.lato,
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "400",
    opacity: 0.5,
    textAlign: "center",
    height: 23,
  },
  dragIcon: {
    fontFamily: fontFamily.lato,
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.5,
    textAlign: "center",
  },
  browseBtn: {
    // alignSelf: "center",
    // paddingHorizontal: 20,
    height: "24%",
    width: "42%",
    borderRadius: 90,
    marginTop: 15,
    // marginTop: 35,
    // paddingVertical: Platform.OS === "ios" ? 5 : 5,
  },
  uploadBtn: {
    // alignSelf: "center",
    // paddingHorizontal: 20,
    height: "24%",
    width: "42%",
    borderRadius: 90,
    // marginTop: 35,
    // margin: 10,
    // paddingVertical: Platform.OS === "ios" ? 5 : 5,
  },
  buttonText: {
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

  container: {
    marginVertical: 20,
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    margin: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  statusIndicator: {
    marginLeft: 10,
  },
  waitingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#f39c12",
    marginLeft: 10,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#777",
  },
  cancelButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
});
