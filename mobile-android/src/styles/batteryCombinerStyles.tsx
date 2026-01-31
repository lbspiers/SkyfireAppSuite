import { Platform, StyleSheet } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import FONTSIZE from "../utils/styleConstant/Font";
import COLORS from "../utils/styleConstant/Color";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  gradientView: {
    flex: 1,
    marginBottom: 40,
  },
  headerTitle: {
    fontFamily: fontFamily.lato,
    fontSize: 20,
    color: COLORS.white,
    fontWeight: "400",
    width: 203,
  },
  username: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 20,
    color: COLORS.white,
    marginTop: 20,
    marginBottom: 10,
  },
  mainTitle: {
    color: "#fff",
    // fontWeight:'400',
    textAlign: "left",
  },
  Address: {
    fontFamily: fontFamily.lato,
    fontWeight: "400",
    fontSize: 14,
    color: "rgba(255, 255, 255, 1)",
    lineHeight: 21,
  },
  subAddress: {},
  btnStyle: {
    width: 75,
    height: 30,
    borderRadius: 5,
  },
  logoStyle: {
    width: 48.13,
    height: 48,
    overflow: "hidden",
  },
  installer: {
    color: "rgba(134, 137, 144, 1)",
  },
  btn_Installer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buttonText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    color: "#fff",
  },
  headingContainer: {
    flexDirection: "row",
    flex: 1,
    borderBottomColor: "#ECECF24D",
    borderBottomWidth: 1,
    paddingBottom: 18,
  },
  keepView: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  keepMeLogText: {
    fontSize: 14,
    color: "hsla(0, 0%, 100%, 0.5)",
    fontWeight: "400",
    paddingLeft: 10,
  },
  secondsub: {
    flex: 0.4,
    flexDirection: "row",
    marginTop: 30,
    // flex:1
  },
  btnItem: {
    borderRadius: 5,
    flex: 1,
    height: 28,
    alignSelf: "center",
    width: 70,
  },
  backupTitle: {
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  backupLoads: {
    width: 130,
    position: "relative",
    fontFamily: fontFamily.lato,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  infoBackup: {
    position: "absolute",
    top: -17,
    left: 121,
  },
  info: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 8,
    right: Platform.OS === "ios" ? 90 : 100,
  },
  wholeHome: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.white,
  },
  wholeHomebakcup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraContainer: {
    alignSelf: "flex-start",
  },
  backupContainer: {
    paddingVertical: 15,
    rowGap: 15,
  },
  dropdown: {
    height: 50,
    borderBottomColor: "#868990",
    borderBottomWidth: 0.5,
    borderRadius: 100,
    width: "100%",
  },
  itemContainerStyle: {
    borderBottomWidth: 0.2,
    borderColor: COLORS.white,
    marginHorizontal: 14,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#fff",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#ffff",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  ampsText: {
    verticalAlign: "bottom",
    padding: 10,
    paddingBottom: 17,
  },
  backupLoadsContainer: {
    marginBottom: 20,
  },
  optionItem: {
    borderRadius: 5,
    flex: 1,
    padding: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    columnGap: 10,
  },
  option: {
    flex: 1,
    rowGap: 10,
    paddingTop: 10,
  },
  optionText: {
    fontFamily: fontFamily.lato,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
    color: "#fff",
  },
});
