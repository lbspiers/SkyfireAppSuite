import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  componentContainer: {
    height: 45,
    width: "100%",
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  componentText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "left",
  },
  arrowIcon: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    fontWeight: "700",
  },
  listContainer: {
    rowGap: 10,
  },
  opacityContainer: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gradientView: {
    paddingHorizontal: 20,
    borderRadius: 10,
    padding: 10,
    width: "100%",
  },
  gradientDetails: {
    paddingHorizontal: 20,
    borderRadius: 10,
    padding: 10,
    width: "100%",
  },
  inventoryTitle: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "900",
  },
  inventoryView: {
    rowGap: 7,
  },
  showInventory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  utilityBtn: {
    alignSelf: "center",
    padding: 13,
    borderRadius: 100,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  detailsText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "200",
    textAlign: "left",
    // width: "34%",
  },
});
