import { StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#292C31",
  },
  inputborder: {
    borderBottomColor: "#ECECF24D",
    borderBottomWidth: 1,
  },
  label: {
    marginTop: 10,
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: "#FFFFFF80",
    fontWeight: "400",
    marginBottom: 20,
  },
  content: {
    width: 288,
    lineHeight: 13,
    fontFamily: fontFamily.lato,
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "400",
    marginBottom: 25,
  },

  titleContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    gap: 20,
  },
  formContainer: {
    margin: 10,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainHeader: {
    fontFamily: fontFamily.lato,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
    height: 30,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    color: "#FFFFFF", // Set title color
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
  },
  skyfireId: {
    marginBottom: 30,
    color: "#9B9FA7",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  buttonTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  btnContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  join: {
    height: "100%",
    width: "51%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  googleMapContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    width: 355,
    height: 434,
    borderRadius: 9,
  },
  googleImg: {
    width: 125,
    height: 112,
  },
  geocontainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
