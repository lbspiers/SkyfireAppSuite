import { Platform, StyleSheet, StatusBar } from "react-native";
import fontFamily from "../utils/styleConstant/FontFamily";
import FONTSIZE from "../utils/styleConstant/Font";
import COLORS from "../utils/styleConstant/Color";
// const colors = getColor()
export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientView: {
    flex: 1,
  },
  statusBarBackground: {
    backgroundColor: "#2E4161",
    height: Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0,
  },
  closeMapButton: {
    alignSelf: "center",
    alignItems: "center",
    width: 158,
    height: 45,
    borderRadius: 5,
    cursor: "pointer",
  },
  mapButton: {
    borderRadius: 90,
    alignSelf: "center",
    alignItems: "center",
    padding: 20,
    paddingHorizontal: 50,
  },
  fieldsView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errormessage: {
    color: COLORS.red,
    paddingTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  join: {
    height: "100%",
    width: "51%",
    borderRadius: 90,
    margin: 10,
    paddingVertical: 5,
  },
  textInputView: {
    flex: 1,
    paddingHorizontal: 30,
    backgroundColor: "red",
  },

  buttonView: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginTop: "20%",
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 16.8,
    textAlign: "center",
  },
  map: {
    height: "100%",
    //  ...StyleSheet.absoluteFillObject,
  },
  mapWithStatusBar: {
    height: "100%",
    marginTop: Platform.OS === "ios" ? 0 : -(StatusBar.currentHeight || 0),
  },

  contentStyle: {
    color: "white",
    padding: 0,
    margin: 0,
  },
  error: {
    color: "red",
    marginTop: 10,
    fontSize: 12,
  },
  label: {
    color: "#FFFFFF80",
    // Set label text color
  },
  googleMapContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  googleImg: {
    width: 125,
    height: 112,
  },
});
