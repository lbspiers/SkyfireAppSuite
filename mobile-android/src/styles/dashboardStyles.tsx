import { Platform, StyleSheet } from "react-native";
import COLORS from "../utils/styleConstant/Color";
import fontFamily from "../utils/styleConstant/FontFamily";

export const styles = StyleSheet.create({
  safeViewContainer: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: COLORS.matteBlack,
    paddingHorizontal: 10,
    overflow: "visible",
  },
  mainViewContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listComponent: {
    height: 29,
    paddingHorizontal: 15,
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  listComponentText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },
  sortView: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  sortGradient: {
    alignContent: "space-between",
    paddingHorizontal: 10,
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  sortTouchable: {
    alignContent: "center",
    flexDirection: "row",
    columnGap: 10,
    opacity: 0.6,
  },
  sortImg: {
    width: 20,
    height: 20,
  },
  searchImg: {
    width: 42,
    height: 42,
  },
  itemGradient: {
    borderRadius: 10,
    width: "100%",
  },
  textGradient: {
    borderRadius: 5,
    alignSelf: "flex-end",
    padding: 5,
  },
  itemContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    columnGap: 10,
  },
  labelContainer: {
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
  },
  optionsContainer: {
    flex: 1,
    rowGap: 6,
  },
  btnContainer: {
    flexDirection: "row",
    columnGap: 3,
    alignSelf: "flex-end",
  },
  secondListContainer: {
    rowGap: 10,
  },
  extraContainer: {
    paddingHorizontal: 10,
    rowGap: 28,
  },
  labelText: {
    fontFamily: fontFamily.Inter_14pt_Black,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 20,
  },
  durationText: {
    fontFamily: fontFamily.Inter_14pt_Black,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "400",
    padding: 3,
    paddingHorizontal: 10,
  },
  itemText: {
    fontFamily: fontFamily.Inter_14pt_Black,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "400",
    textAlign: "left",
    lineHeight: 20,
  },
  typeImg: {
    height: 40,
    width: 100,
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  btnStyle: {
    alignSelf: "center",
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 90,
    paddingVertical: Platform.OS === "ios" ? 7 : 5,
  },
  buttonText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
  },

  // Modal Container
  modalContainer: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  modalBackdrop: {
    position: "absolute",
    padding: 10,
    width: "100%",
    zIndex: 999,
    top: Platform.OS === "ios" ? "27%" : "24%",
  },
  // Sort Option Container
  sortOption: {
    borderBottomWidth: 1,
    borderBottomColor: "#2F343A",
    width: "100%",
  },

  // Sort Option Text
  sortOptionText: {
    fontFamily: fontFamily.lato,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "left",
    paddingVertical: 15,
  },
});
